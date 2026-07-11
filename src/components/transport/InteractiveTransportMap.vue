<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import mapData from '@/data/transportMap.json'

const props = defineProps({
	stations: { type: Array, default: () => [] },
	routeStationIds: { type: Array, default: () => [] },
	routeSegments: { type: Array, default: () => [] },
	startStationId: { type: [String, Number], default: '' },
	endStationId: { type: [String, Number], default: '' },
	routeLoading: { type: Boolean, default: false },
	routeMessage: { type: String, default: '' },
})

const emit = defineEmits(['set-start', 'set-end'])
const viewport = ref(null)
const query = ref('')
const selectedStation = ref(null)
const scale = ref(1)
const isInteracting = ref(false)
let wheelFrame = 0
let panFrame = 0
let wheelDelta = 0
let wheelAnchor = { x: 0.5, y: 0.5 }
let interactionTimer = 0
let dragState = null
let pinchState = null
const activePointers = new Map()

const graphNodes = mapData.graph?.nodes || []
const graphEdges = mapData.graph?.edges || []
const nodeByKey = new Map(graphNodes.map((node) => [node.key, node]))
const edgeByKey = new Map(graphEdges.map((edge) => [edge.key, edge]))
const bounds = graphNodes.reduce((result, node) => {
	const { x = 0, y = 0 } = node.attributes || {}
	result.minX = Math.min(result.minX, x)
	result.maxX = Math.max(result.maxX, x)
	result.minY = Math.min(result.minY, y)
	result.maxY = Math.max(result.maxY, y)
	return result
}, { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity })

const padding = 82
const baseView = {
	x: bounds.minX - padding,
	y: bounds.minY - padding,
	width: bounds.maxX - bounds.minX + padding * 2,
	height: bounds.maxY - bounds.minY + padding * 2,
}
const viewState = ref({ ...baseView })
const viewBox = computed(() => `${viewState.value.x} ${viewState.value.y} ${viewState.value.width} ${viewState.value.height}`)

function nodePayload(node) {
	const attributes = node.attributes || {}
	return attributes[attributes.type] || {}
}

function nodeNames(node) {
	const names = nodePayload(node).names
	return Array.isArray(names) ? names : []
}

function normalized(value) {
	return String(value || '').trim().toLocaleLowerCase()
}

function colorOf(payload, fallback = '#393332') {
	return payload?.color?.[2] || fallback
}

function normalizedColor(value) {
	const raw = String(value || '').trim().replace(/^#/, '').replace(/^0x/i, '').toLowerCase()
	if (/^[0-9a-f]{3}$/.test(raw)) return `#${raw.split('').map((part) => part + part).join('')}`
	return /^[0-9a-f]{6}$/.test(raw) ? `#${raw}` : ''
}

function colorsMatch(first, second) {
	const a = normalizedColor(first)
	const b = normalizedColor(second)
	if (!a || !b) return false
	if (a === b) return true
	const channels = (color) => [1, 3, 5].map((index) => Number.parseInt(color.slice(index, index + 2), 16))
	const [ar, ag, ab] = channels(a)
	const [br, bg, bb] = channels(b)
	return Math.hypot(ar - br, ag - bg, ab - bb) <= 12
}

const lineNamesByColor = graphNodes.reduce((lookup, node) => {
	const type = node.attributes?.type || ''
	if (!type.includes('line-badge')) return lookup
	const payload = nodePayload(node)
	const color = normalizedColor(payload.color?.[2])
	const name = payload.num !== undefined ? `${payload.num}号线` : payload.names?.[0]
	if (!color || !name) return lookup
	const names = lookup.get(color) || []
	if (!names.includes(name)) names.push(name)
	lookup.set(color, names)
	return lookup
}, new Map())

const stationTypeNames = {
	'shmetro-basic': '普通站',
	'shmetro-int': '换乘站',
	'suzhourt-basic': '普通站',
	'suzhourt-int': '换乘站',
	'guangdong-intercity-rwy': '城际铁路站',
}

const transportStyleNames = {
	'single-color': '轨道交通',
	'mtr-light-rail': '捷运线路',
	'river': '水路',
	'bjsubway-dotted': '暂未建成线路',
	'sh-sub-rwy': '城际铁路',
	'gzmtr-virtual-int': '站外换乘',
	'mtr-paid-area': '站内换乘',
	'mtr-unpaid-area': '站外换乘',
	'chengdurt-outside-fare-gates': '出闸换乘',
}

function connectionName(style, color) {
	const exactColor = normalizedColor(color)
	const matchedColor = [...lineNamesByColor.keys()].find((candidate) => colorsMatch(candidate, exactColor))
	const lineNames = lineNamesByColor.get(exactColor) || lineNamesByColor.get(matchedColor)
	return lineNames?.join(' / ') || transportStyleNames[style] || '交通连接'
}

function stationConnections(key, stationPayload) {
	const seen = new Set()
	const connections = graphEdges.flatMap((edge) => {
		if (edge.source !== key && edge.target !== key) return []
		const style = edge.attributes?.style || 'single-color'
		const payload = edge.attributes?.[style] || {}
		const color = colorOf(payload, style.includes('paid-area') ? '#393332' : '#898989')
		const signature = `${style}:${color}`
		if (seen.has(signature)) return []
		seen.add(signature)
		return [{ style, color, name: connectionName(style, color) }]
	})
	const stationColors = [stationPayload.color, ...(stationPayload.transfer?.flat(1) || [])]
		.filter((color) => Array.isArray(color) && color[2])
	for (const colorPayload of stationColors) {
		const color = colorPayload[2]
		const signature = `station:${normalizedColor(color)}`
		if (seen.has(signature)) continue
		seen.add(signature)
		connections.push({ style: 'station', color, name: connectionName('single-color', color) })
	}
	const hasNamedStationColor = connections.some((connection) => connection.style === 'station' && [...lineNamesByColor.keys()].some((color) => colorsMatch(color, connection.color)))
	return hasNamedStationColor
		? connections.filter((connection) => !(connection.style === 'mtr-light-rail' && normalizedColor(connection.color) === '#000000'))
		: connections
}

const apiStationLookup = computed(() => {
	const lookup = new Map()
	props.stations.forEach((station) => {
		if (station.name) lookup.set(normalized(station.name), station)
		if (station.name_en) lookup.set(normalized(station.name_en), station)
	})
	return lookup
})

function stationLabelLayout(type, payload, names) {
	if (payload.preciseNameOffsets) return {
		x: payload.preciseNameOffsets.x,
		y: payload.preciseNameOffsets.y,
		anchor: payload.preciseNameOffsets.anchor || 'start',
	}
	const offsetX = payload.nameOffsetX || 'right'
	const offsetY = payload.nameOffsetY || 'top'
	const anchor = offsetX === 'left' ? 'end' : offsetX === 'middle' ? 'middle' : 'start'
	const polarityY = offsetY === 'top' ? -1 : 1
	const nameLines = String(names[offsetY === 'top' ? 1 : 0] || '').split('\n').length
	if (type === 'shmetro-basic') {
		return { x: offsetX === 'left' ? -13.33 : offsetX === 'right' ? 13.33 : 0, y: offsetY === 'middle' ? 0 : polarityY * (nameLines * (offsetY === 'top' ? 6.67 : 12.67) + (offsetY === 'top' ? 10 : 5.83)), anchor }
	}
	if (type === 'shmetro-int') {
		const rotate = Number(payload.rotate || 0)
		const width = Number(payload.width || 13)
		const height = Number(payload.height || 10)
		const radians = rotate * Math.PI / 180
		const iconWidth = Math.abs(Math.cos(radians) * width) + Math.abs(Math.sin(radians) * height)
		const iconHeight = Math.abs(Math.sin(radians) * width) + Math.abs(Math.cos(radians) * height)
		const xSign = offsetX === 'left' ? -1 : offsetX === 'right' ? 1 : 0
		const baseY = offsetY === 'top' ? nameLines * 6.67 + 5 : nameLines * 12.67 + 0.83
		return { x: xSign * (iconWidth / 2 + 6.83), y: offsetY === 'middle' ? 0 : polarityY * (iconHeight / 2 + baseY), anchor }
	}
	const iconRadius = type === 'suzhourt-int' ? 5 : 3
	return {
		x: offsetX === 'left' ? -(iconRadius + 2) : offsetX === 'right' ? iconRadius + 2 : 0,
		y: offsetY === 'middle' ? 5 : polarityY * (nameLines * (offsetY === 'top' ? 5 : 10) + iconRadius + (offsetY === 'top' ? 2.5 : 1)),
		anchor,
	}
}

const stations = computed(() => graphNodes
	.filter((node) => node.key.startsWith('stn_') && node.attributes?.visible !== false)
	.map((node) => {
		const names = nodeNames(node)
		const payload = nodePayload(node)
		const type = node.attributes.type || ''
		let apiStation = names.map((name) => apiStationLookup.value.get(normalized(name))).find(Boolean) || null
		if (!apiStation && type === 'suzhourt-int' && names[0] === '三岛') apiStation = apiStationLookup.value.get(normalized('高铁三岛站')) || null
		if (!apiStation && type === 'suzhourt-int' && names[0] === '海底谭') apiStation = apiStationLookup.value.get(normalized('高铁海底谭站')) || null
		return {
			key: node.key,
			x: node.attributes.x,
			y: node.attributes.y,
			zIndex: node.attributes.zIndex || 0,
			type,
			payload,
			name: names[0] || '',
			nameEn: names[1] || '',
			apiStation,
			label: stationLabelLayout(type, payload, names),
			typeName: stationTypeNames[type] || '交通站点',
			connections: stationConnections(node.key, payload),
		}
	})
	.sort((a, b) => a.zIndex - b.zIndex))

const filteredStations = computed(() => {
	const value = normalized(query.value)
	if (!value) return []
	const seen = new Set()
	return stations.value.filter((station) => {
		if (!normalized(station.name).includes(value) && !normalized(station.nameEn).includes(value)) return false
		const id = station.apiStation?.id || normalized(station.name)
		if (!id || seen.has(id)) return false
		seen.add(id)
		return true
	}).slice(0, 8)
})

function apiStationName(id) {
	return props.stations.find((station) => String(station.id) === String(id))?.name || id || '未选择'
}

const activeStationIds = computed(() => new Set([
	...props.routeStationIds,
	...props.routeSegments.flatMap((segment) => segment.stationIds || []),
].map(String)))

const routeEdgeKeys = computed(() => {
	if (!props.routeSegments.length) return new Set()
	const stationByApiId = stations.value.filter((station) => station.apiStation).reduce((lookup, station) => {
		const id = String(station.apiStation.id)
		lookup.set(id, [...(lookup.get(id) || []), station])
		return lookup
	}, new Map())
	const adjacency = new Map()
	for (const edge of graphEdges) {
		if (edge.attributes?.visible === false || edge.source === edge.target) continue
		if (!adjacency.has(edge.source)) adjacency.set(edge.source, [])
		if (!adjacency.has(edge.target)) adjacency.set(edge.target, [])
		adjacency.get(edge.source).push({ node: edge.target, edge: edge.key })
		adjacency.get(edge.target).push({ node: edge.source, edge: edge.key })
	}
	const result = new Set()
	const findPath = (source, target, segmentColor) => {
		const queue = [source]
		const previous = new Map([[source, null]])
		while (queue.length) {
			const current = queue.shift()
			if (current === target) break
			const candidates = [...(adjacency.get(current) || [])].sort((first, second) => {
				const firstEdge = edgeByKey.get(first.edge)
				const secondEdge = edgeByKey.get(second.edge)
				const firstColor = normalizedColor(firstEdge?.attributes?.[firstEdge.attributes.style]?.color?.[2])
				const secondColor = normalizedColor(secondEdge?.attributes?.[secondEdge.attributes.style]?.color?.[2])
				return Number(colorsMatch(secondColor, segmentColor)) - Number(colorsMatch(firstColor, segmentColor))
			})
			for (const next of candidates) {
				if (previous.has(next.node)) continue
				const candidate = nodeByKey.get(next.node)
				const isOtherNamedStation = next.node !== target && candidate?.key.startsWith('stn_') && nodeNames(candidate).some(Boolean)
				if (isOtherNamedStation) continue
				previous.set(next.node, { node: current, edge: next.edge })
				queue.push(next.node)
			}
		}
		if (!previous.has(target)) return false
		let cursor = target
		while (cursor !== source) {
			const step = previous.get(cursor)
			result.add(step.edge)
			cursor = step.node
		}
		return true
	}
	for (const segment of props.routeSegments) {
		const segmentColor = normalizedColor(segment.color)
		const keys = (segment.stationIds || []).map((id) => {
			const candidates = stationByApiId.get(String(id)) || []
			return (candidates.find((station) => station.connections.some((connection) => colorsMatch(connection.color, segmentColor))) || candidates[0])?.key
		}).filter(Boolean)
		for (let index = 0; index < keys.length - 1; index += 1) {
			findPath(keys[index], keys[index + 1], segmentColor)
		}
	}
	return result
})

const hasActiveRoute = computed(() => props.routeSegments.length > 0)

function isActiveStation(station) {
	return station.apiStation && activeStationIds.value.has(String(station.apiStation.id))
}

function isActiveEdge(edge) {
	return !hasActiveRoute.value || routeEdgeKeys.value.has(edge.key)
}

function stationConnectionsForDisplay(station) {
	const stationId = String(station.apiStation?.id || '')
	return station.connections.map((connection) => {
		const routeSegment = props.routeSegments.find((segment) =>
			(segment.stationIds || []).map(String).includes(stationId) &&
			colorsMatch(segment.color, connection.color))
		if (!routeSegment) return connection
		return { ...connection, name: routeSegment.lineName || routeSegment.name_en || connection.name }
	})
}

function roundedPath(points, radius) {
	if (points.length < 3 || radius <= 0) return points.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ')
	const parts = [`M ${points[0].x} ${points[0].y}`]
	for (let index = 1; index < points.length - 1; index += 1) {
		const previous = points[index - 1]
		const corner = points[index]
		const next = points[index + 1]
		const beforeDistance = Math.hypot(previous.x - corner.x, previous.y - corner.y)
		const afterDistance = Math.hypot(next.x - corner.x, next.y - corner.y)
		const beforeRatio = Math.min(radius, beforeDistance / 2) / (beforeDistance || 1)
		const afterRatio = Math.min(radius, afterDistance / 2) / (afterDistance || 1)
		const before = { x: corner.x + (previous.x - corner.x) * beforeRatio, y: corner.y + (previous.y - corner.y) * beforeRatio }
		const after = { x: corner.x + (next.x - corner.x) * afterRatio, y: corner.y + (next.y - corner.y) * afterRatio }
		parts.push(`L ${before.x} ${before.y} Q ${corner.x} ${corner.y} ${after.x} ${after.y}`)
	}
	const last = points.at(-1)
	parts.push(`L ${last.x} ${last.y}`)
	return parts.join(' ')
}

function perpendicularPoints(source, target, attrs) {
	const fromStart = (attrs.startFrom || 'from') === 'from'
	const offset1 = fromStart ? Number(attrs.offsetFrom || 0) : Number(attrs.offsetTo || 0)
	const offset2 = fromStart ? Number(attrs.offsetTo || 0) : Number(attrs.offsetFrom || 0)
	const [dx1, dy1, dx2, dy2] = fromStart ? [0, offset1, offset2, 0] : [offset1, 0, 0, offset2]
	const turn = fromStart ? { x: target.x + dx2, y: source.y + dy1 } : { x: source.x + dx1, y: target.y + dy2 }
	return [{ x: source.x + dx1, y: source.y + dy1 }, turn, { x: target.x + dx2, y: target.y + dy2 }]
}

function diagonalPoints(source, target, attrs) {
	const fromStart = (attrs.startFrom || 'from') === 'from'
	const first = fromStart ? source : target
	const last = fromStart ? target : source
	const offset1 = Number((fromStart ? attrs.offsetFrom : attrs.offsetTo) || 0)
	const offset2 = Number((fromStart ? attrs.offsetTo : attrs.offsetFrom) || 0)
	const dx = last.x - first.x
	const dy = last.y - first.y
	const horizontal = Math.abs(dx) > Math.abs(dy)
	const dx1 = horizontal ? 0 : offset1
	const dy1 = horizontal ? offset1 : 0
	const dx2 = offset2 * Math.SQRT1_2
	const dy2 = offset2 * Math.SQRT1_2 * (dx * dy < 0 ? 1 : -1)
	const a = { x: first.x + dx1, y: first.y + dy1 }
	const c = { x: last.x + dx2, y: last.y + dy2 }
	const b = horizontal
		? { x: c.x + Math.abs(c.y - a.y) * (c.x - a.x > 0 ? -1 : 1), y: a.y }
		: { x: a.x, y: c.y + Math.abs(c.x - a.x) * (c.y - a.y > 0 ? -1 : 1) }
	const points = [a, b, c]
	return fromStart ? points : points.reverse()
}

function edgePath(edge) {
	const source = nodeByKey.get(edge.source)?.attributes
	const target = nodeByKey.get(edge.target)?.attributes
	if (!source || !target || edge.source === edge.target) return ''
	const type = edge.attributes?.type || 'simple'
	const attrs = edge.attributes?.[type] || {}
	if (type === 'perpendicular' || type === 'ro-perp') return roundedPath(perpendicularPoints(source, target, attrs), Number(attrs.roundCornerFactor || 18.33))
	if (type === 'diagonal') return roundedPath(diagonalPoints(source, target, attrs), Number(attrs.roundCornerFactor || 10))
	return `M ${source.x} ${source.y} L ${target.x} ${target.y}`
}

function edgeStyle(edge) {
	const attrs = edge.attributes || {}
	const payload = attrs[attrs.style] || {}
	const color = colorOf(payload, attrs.style === 'river' ? '#b9e3f9' : '#393332')
	const styles = {
		'single-color': { color, width: 5 },
		'mtr-light-rail': { color, width: 2.5 },
		river: { color, width: Number(payload.width || 20) },
		'mtr-unpaid-area': { color: '#000', width: 1.33, dash: '2.66 1.33' },
		'mtr-paid-area': { color: '#000', width: 1.5 },
		'bjsubway-dotted': { color, width: 5, dash: '2 2', inner: true },
		'chengdurt-outside-fare-gates': { color: '#b4b4b5', width: 5, dash: '6 5' },
		'sh-sub-rwy': { color: '#898989', width: 5, inner: true },
		'gzmtr-virtual-int': { color: '#565656', width: 3, dash: '3 3' },
	}
	return styles[attrs.style] || { color, width: 5 }
}

const edges = computed(() => graphEdges
	.filter((edge) => edge.attributes?.visible !== false)
	.map((edge) => ({ ...edge, path: edgePath(edge), ...edgeStyle(edge), zIndex: edge.attributes?.zIndex || 0, style: edge.attributes?.style }))
	.filter((edge) => edge.path)
	.sort((a, b) => a.zIndex - b.zIndex))

const miscNodes = computed(() => graphNodes
	.filter((node) => !node.key.startsWith('stn_') && node.attributes?.visible !== false && node.attributes?.type !== 'virtual')
	.map((node) => ({ key: node.key, x: node.attributes.x, y: node.attributes.y, zIndex: node.attributes.zIndex || 0, type: node.attributes.type, payload: nodePayload(node) }))
	.sort((a, b) => a.zIndex - b.zIndex))

function pointIsVisible(x, y, margin = 0) {
	const view = viewState.value
	return x >= view.x - margin && x <= view.x + view.width + margin && y >= view.y - margin && y <= view.y + view.height + margin
}

const visibleStations = computed(() => stations.value.filter((station) => pointIsVisible(station.x, station.y, 90)))
const visibleMiscNodes = computed(() => miscNodes.value.filter((node) => pointIsVisible(node.x, node.y, 140)))
const visibleEdges = computed(() => edges.value.filter((edge) => {
	const source = nodeByKey.get(edge.source)?.attributes
	const target = nodeByKey.get(edge.target)?.attributes
	if (!source || !target) return false
	const view = viewState.value
	const margin = Math.max(35, edge.width * 2)
	const minX = Math.min(source.x, target.x) - margin
	const maxX = Math.max(source.x, target.x) + margin
	const minY = Math.min(source.y, target.y) - margin
	const maxY = Math.max(source.y, target.y) + margin
	return maxX >= view.x && minX <= view.x + view.width && maxY >= view.y && minY <= view.y + view.height
}))

function badgeWidth(node) {
	if (node.type === 'shmetro-num-line-badge') return String(node.payload.num).length > 1 ? 24 : 16
	const names = node.payload.names || []
	return Math.max(node.type.startsWith('bjsubway') ? 22 : 25, String(names[0] || '').length * 10 + 7, String(names[1] || '').length * 4 + 7)
}

function chooseStation(station, zoomToStation = false) {
	if (!station.name) return
	selectedStation.value = station
	query.value = ''
	if (zoomToStation && scale.value < 1.8) {
		const width = baseView.width / 1.8
		const height = baseView.height / 1.8
		setView({ x: station.x - width / 2, y: station.y - height / 2, width, height })
	}
}

function handleStationKeydown(event, station) {
	if (event.key !== 'Enter' && event.key !== ' ') return
	event.preventDefault()
	chooseStation(station)
}

function markInteraction() {
	isInteracting.value = true
	if (interactionTimer) window.clearTimeout(interactionTimer)
	interactionTimer = window.setTimeout(() => { isInteracting.value = false }, 100)
}

function setView(next) {
	const width = Math.min(baseView.width, Math.max(baseView.width / 10, next.width))
	const height = width * (baseView.height / baseView.width)
	const maxX = baseView.x + baseView.width - width
	const maxY = baseView.y + baseView.height - height
	viewState.value = {
		x: Math.min(maxX, Math.max(baseView.x, next.x)),
		y: Math.min(maxY, Math.max(baseView.y, next.y)),
		width,
		height,
	}
	scale.value = baseView.width / width
}

function applyZoom(factor, anchor = { x: 0.5, y: 0.5 }) {
	const current = viewState.value
	const width = current.width * factor
	const height = current.height * factor
	setView({
		x: current.x + (current.width - width) * anchor.x,
		y: current.y + (current.height - height) * anchor.y,
		width,
		height,
	})
	markInteraction()
}

function viewportMetrics(view = viewState.value) {
	const rect = viewport.value?.getBoundingClientRect()
	if (!rect) return null
	const pixelsPerUnit = Math.min(rect.width / view.width, rect.height / view.height)
	const renderedWidth = view.width * pixelsPerUnit
	const renderedHeight = view.height * pixelsPerUnit
	return {
		rect,
		pixelsPerUnit,
		offsetX: (rect.width - renderedWidth) / 2,
		offsetY: (rect.height - renderedHeight) / 2,
	}
}

function handleWheel(event) {
	event.preventDefault()
	const metrics = viewportMetrics()
	if (!metrics) return
	wheelDelta += event.deltaY
	wheelAnchor = {
		x: Math.min(1, Math.max(0, (event.clientX - metrics.rect.left - metrics.offsetX) / (viewState.value.width * metrics.pixelsPerUnit))),
		y: Math.min(1, Math.max(0, (event.clientY - metrics.rect.top - metrics.offsetY) / (viewState.value.height * metrics.pixelsPerUnit))),
	}
	if (wheelFrame) return
	wheelFrame = requestAnimationFrame(() => {
		applyZoom(Math.exp(wheelDelta * 0.0015), wheelAnchor)
		wheelDelta = 0
		wheelFrame = 0
	})
}

function handlePointerDown(event) {
	if (event.button !== 0 || event.target.closest?.('.map-station')) return
	event.currentTarget.setPointerCapture(event.pointerId)
	activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
	if (activePointers.size === 1) {
		dragState = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, lastX: event.clientX, lastY: event.clientY, view: { ...viewState.value } }
	} else if (activePointers.size === 2) {
		const [first, second] = [...activePointers.values()]
		pinchState = {
			distance: Math.hypot(second.x - first.x, second.y - first.y),
			center: { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 },
			view: { ...viewState.value },
		}
		dragState = null
	}
	isInteracting.value = true
}

function handlePointerMove(event) {
	if (!activePointers.has(event.pointerId)) return
	activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
	if (pinchState && activePointers.size >= 2) {
		if (panFrame) return
		panFrame = requestAnimationFrame(() => {
			if (!pinchState || activePointers.size < 2) { panFrame = 0; return }
			const [first, second] = [...activePointers.values()]
			const distance = Math.max(1, Math.hypot(second.x - first.x, second.y - first.y))
			const center = { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 }
			const metrics = viewportMetrics(pinchState.view)
			if (metrics) {
				const factor = pinchState.distance / distance
				const width = pinchState.view.width * factor
				const height = pinchState.view.height * factor
				const mapAnchor = {
					x: pinchState.view.x + (pinchState.center.x - metrics.rect.left - metrics.offsetX) / metrics.pixelsPerUnit,
					y: pinchState.view.y + (pinchState.center.y - metrics.rect.top - metrics.offsetY) / metrics.pixelsPerUnit,
				}
				const nextPixelsPerUnit = metrics.pixelsPerUnit / factor
				setView({
					x: mapAnchor.x - (center.x - metrics.rect.left - metrics.offsetX) / nextPixelsPerUnit,
					y: mapAnchor.y - (center.y - metrics.rect.top - metrics.offsetY) / nextPixelsPerUnit,
					width,
					height,
				})
			}
			panFrame = 0
		})
		return
	}
	if (!dragState || dragState.pointerId !== event.pointerId) return
	dragState.lastX = event.clientX
	dragState.lastY = event.clientY
	if (panFrame) return
	panFrame = requestAnimationFrame(() => {
		const metrics = dragState ? viewportMetrics(dragState.view) : null
		if (metrics && dragState) setView({
			...dragState.view,
			x: dragState.view.x - (dragState.lastX - dragState.startX) / metrics.pixelsPerUnit,
			y: dragState.view.y - (dragState.lastY - dragState.startY) / metrics.pixelsPerUnit,
		})
		panFrame = 0
	})
}

function handlePointerUp(event) {
	activePointers.delete(event.pointerId)
	pinchState = null
	if (activePointers.size === 1) {
		const [pointerId, point] = [...activePointers.entries()][0]
		dragState = { pointerId, startX: point.x, startY: point.y, lastX: point.x, lastY: point.y, view: { ...viewState.value } }
	} else {
		dragState = null
	}
	markInteraction()
}

function zoomIn() { applyZoom(0.8) }
function zoomOut() { applyZoom(1.25) }
function resetMap() {
	viewState.value = { ...baseView }
	scale.value = 1
	selectedStation.value = null
}

onBeforeUnmount(() => {
	if (wheelFrame) cancelAnimationFrame(wheelFrame)
	if (panFrame) cancelAnimationFrame(panFrame)
	if (interactionTimer) window.clearTimeout(interactionTimer)
})
</script>

<template>
	<div :class="['interactive-map', { 'is-interacting': isInteracting }]">
		<div class="map-toolbar">
			<label class="map-search">
				<span class="sr-only">搜索站点</span>
				<input v-model="query" type="search" placeholder="搜索站点" autocomplete="off" />
				<div v-if="filteredStations.length" class="search-results">
					<button v-for="station in filteredStations" :key="station.key" type="button" @click="chooseStation(station, true)">
						<strong>{{ station.name }}</strong><span>{{ station.nameEn }}</span>
					</button>
				</div>
			</label>
			<div class="zoom-controls" aria-label="地图缩放控件">
				<button type="button" aria-label="缩小" title="缩小" @click="zoomOut">−</button>
				<span>{{ Math.round(scale * 100) }}%</span>
				<button type="button" aria-label="放大" title="放大" @click="zoomIn">+</button>
				<button type="button" class="reset-button" @click="resetMap">复位</button>
			</div>
		</div>
		<div v-if="routeLoading || routeMessage || startStationId || endStationId" class="map-route-status" aria-live="polite">
			<span v-if="routeLoading" class="status-spinner"></span>
			<div>
				<strong v-if="routeLoading">正在地图内计算路线</strong>
				<strong v-else-if="routeMessage">{{ routeMessage }}</strong>
				<strong v-else>请选择{{ startStationId ? '终点站' : '起点站' }}</strong>
				<small v-if="!routeLoading">起点 {{ apiStationName(startStationId) }} · 终点 {{ apiStationName(endStationId) }}</small>
			</div>
		</div>

		<div ref="viewport" class="map-canvas" @wheel="handleWheel" @pointerdown="handlePointerDown" @pointermove="handlePointerMove" @pointerup="handlePointerUp" @pointercancel="handlePointerUp">
			<svg class="map-stage" :viewBox="viewBox" role="img" aria-label="Quantum Original 交互式交通线路图">
				<g class="map-content">
					<g class="line-layer">
						<g v-for="edge in visibleEdges" :key="edge.key" :class="['route-edge', { 'is-dimmed': !isActiveEdge(edge) }]">
							<path :d="edge.path" :stroke="edge.color" :stroke-width="edge.width" :stroke-dasharray="edge.dash" class="map-edge" />
							<path v-if="edge.inner" :d="edge.path" stroke="#fff" :stroke-width="edge.style === 'bjsubway-dotted' ? 3.4 : 2" class="map-edge" />
						</g>
					</g>

					<g v-for="node in visibleMiscNodes" :key="node.key" :transform="`translate(${node.x} ${node.y})`" class="misc-node">
						<template v-if="node.type === 'text'">
							<text :text-anchor="node.payload.textAnchor" :dominant-baseline="node.payload.dominantBaseline" :fill="colorOf(node.payload, '#000')" :font-size="node.payload.fontSize" :font-weight="node.payload.bold" :font-style="node.payload.italic" :transform="`rotate(${node.payload.rotate || 0})`" :class="{ outlined: node.payload.outline }">
								<tspan v-for="(line, index) in String(node.payload.content || '').split('\n')" :key="index" x="0" :dy="index ? node.payload.lineHeight : 0">{{ line }}</tspan>
							</text>
						</template>
						<template v-else-if="node.type.includes('line-badge')">
							<template v-if="node.type === 'shmetro-num-line-badge'">
								<rect :width="badgeWidth(node)" height="22.67" :fill="colorOf(node.payload)" />
								<text :x="badgeWidth(node) / 2" y="18.5" text-anchor="middle" :fill="node.payload.color?.[3] || '#fff'" font-size="20" font-weight="700">{{ node.payload.num }}</text>
								<text :x="badgeWidth(node) + 2" y="11.5" font-size="12.5" font-weight="700">号线</text>
								<text :x="badgeWidth(node) + 3" y="21" font-size="7">Line {{ node.payload.num }}</text>
							</template>
							<template v-else>
								<rect :width="badgeWidth(node)" :height="node.type.startsWith('bjsubway') ? 16 : 21" :rx="node.type.startsWith('bjsubway') ? 2 : 0" :fill="colorOf(node.payload)" />
								<text :x="badgeWidth(node) / 2" :y="node.type.startsWith('bjsubway') ? 7.5 : 10" text-anchor="middle" :fill="node.payload.color?.[3] || '#fff'" font-size="8.5" font-weight="700">{{ node.payload.names?.[0] }}</text>
								<text :x="badgeWidth(node) / 2" :y="node.type.startsWith('bjsubway') ? 13.5 : 17.5" text-anchor="middle" :fill="node.payload.color?.[3] || '#fff'" font-size="4.5">{{ node.payload.names?.[1] }}</text>
							</template>
						</template>
						<path v-else-if="node.type === 'london-arrow'" d="M0 0 L-10 -10 L-2.93 -10 L7.07 0 L-2.93 10 L-10 10 Z" :fill="colorOf(node.payload)" stroke="#fff" stroke-width="1" :transform="`rotate(${node.payload.rotate || 0}) scale(${node.payload.type === 'sandwich' ? 0.5 : 1})`" />
						<g v-else-if="node.type === 'facilities'" class="facility-icon">
							<circle r="10" fill="#fff" stroke="#202a44" stroke-width="1.5" />
							<path v-if="node.payload.type === 'airport'" d="M0-7 2-2 7 0 7 2 2 1 1 7-1 7-2 1-7 2-7 0-2-2 0-7Z" fill="#202a44" />
							<path v-else d="M-6-6H6V3H4L7 7H4L2 4H-2L-4 7H-7L-4 3H-6ZM-3-3V0H3V-3Z" fill="#202a44" fill-rule="evenodd" />
						</g>
					</g>

					<g v-for="station in visibleStations" :key="station.key" :class="['map-station', station.type, { active: isActiveStation(station), 'start-point': station.apiStation && String(startStationId) === String(station.apiStation.id), 'end-point': station.apiStation && String(endStationId) === String(station.apiStation.id), 'route-dimmed': hasActiveRoute && !isActiveStation(station), selected: selectedStation?.key === station.key, linked: station.apiStation, interactive: station.name }]" :transform="`translate(${station.x} ${station.y})`" :role="station.name ? 'button' : undefined" :tabindex="station.name ? 0 : undefined" :aria-label="station.name ? `查看${station.name}站详情` : undefined" @click.stop="chooseStation(station)" @keydown="handleStationKeydown($event, station)">
						<circle class="station-hit" r="12" />
						<circle v-if="station.type === 'shmetro-basic'" class="station-core sh-basic" r="5" />
						<g v-else-if="station.type === 'shmetro-int'" :transform="`rotate(${station.payload.rotate || 0})`">
							<rect class="station-core sh-int" :x="-(station.payload.width || 13) / 2" :y="-(station.payload.height || 10) / 2" :width="station.payload.width || 13" :height="station.payload.height || 10" :ry="(station.payload.height || 10) / 2" />
						</g>
						<circle v-else-if="station.type === 'suzhourt-basic'" class="station-core sz-basic" r="3" :stroke="colorOf(station.payload)" />
						<g v-else-if="station.type === 'suzhourt-int'" :transform="`rotate(${station.payload.rotate || 0})`">
							<rect class="station-core sz-int" :x="-((station.payload.transfer?.[0]?.length || 1) * 5 + 1) / 2" y="-3" :width="(station.payload.transfer?.[0]?.length || 1) * 5 + 1" height="6" ry="3" />
							<circle v-for="(transfer, index) in station.payload.transfer?.[0] || []" :key="index" r="2" :cx="-((station.payload.transfer?.[0]?.length || 1) * 5 + 1) / 2 + 3 + index * 5" :fill="transfer[2]" />
						</g>
						<g v-else-if="station.type === 'guangdong-intercity-rwy'">
							<circle class="station-core gd-intercity" r="5" />
							<circle v-if="station.payload.interchange" r="2.5" fill="#fff" stroke="#2559a8" stroke-width="1" />
						</g>
						<circle v-else class="station-core other-station" r="4" />
						<g v-if="station.name" class="station-label" :transform="`translate(${station.label.x} ${station.label.y})`" :text-anchor="station.label.anchor">
							<text class="station-name-zh" y="-1">{{ station.name }}</text>
							<text v-if="station.nameEn" class="station-name-en" y="1.5" dominant-baseline="hanging">{{ station.nameEn }}</text>
						</g>
					</g>
				</g>
			</svg>
		</div>

		<Transition name="station-panel">
			<aside v-if="selectedStation" class="station-panel" aria-live="polite">
				<button type="button" class="panel-close" aria-label="关闭站点信息" @click="selectedStation = null">×</button>
				<span class="station-kicker">站点详情 · STATION</span>
				<h3>{{ selectedStation.name }}</h3><p>{{ selectedStation.nameEn || '暂无英文站名' }}</p>
				<dl class="station-facts">
					<div>
						<dt>站点编号</dt>
						<dd>{{ selectedStation.apiStation?.id || '暂未录入' }}</dd>
					</div>
					<div>
						<dt>站点类型</dt>
						<dd>{{ selectedStation.typeName }}</dd>
					</div>
				</dl>
				<div v-if="stationConnectionsForDisplay(selectedStation).length" class="station-connections">
					<span>交通连接</span>
					<ul>
						<li v-for="connection in stationConnectionsForDisplay(selectedStation)" :key="`${connection.style}-${connection.color}`">
							<i :style="{ backgroundColor: connection.color }"></i>{{ connection.name }}
						</li>
					</ul>
				</div>
				<div v-if="selectedStation.apiStation" class="station-actions">
					<button type="button" :disabled="routeLoading || String(startStationId) === String(selectedStation.apiStation.id)" @click="emit('set-start', selectedStation.apiStation)">{{ String(startStationId) === String(selectedStation.apiStation.id) ? '当前起点' : '设为始发站' }}</button>
					<button type="button" :disabled="routeLoading || String(endStationId) === String(selectedStation.apiStation.id)" @click="emit('set-end', selectedStation.apiStation)">{{ String(endStationId) === String(selectedStation.apiStation.id) ? '当前终点' : '设为终点站' }}</button>
				</div>
				<p v-else class="unlinked">该站暂未录入路线查询数据库。</p>
			</aside>
		</Transition>
	</div>
</template>

<style scoped>
.interactive-map { position: relative; width: 100%; height: 100%; min-height: 0; overflow: hidden; background: #fff; color: #172033; }
.map-toolbar { position: absolute; z-index: 5; top: 0.75rem; left: 0.75rem; right: 0.75rem; display: flex; justify-content: space-between; align-items: flex-start; gap: 0.75rem; pointer-events: none; }
.map-search, .zoom-controls { pointer-events: auto; }
.map-search { position: relative; width: min(320px, 48%); }
.map-search input { width: 100%; height: 42px; padding: 0 0.8rem; box-sizing: border-box; border: 1px solid #cbd5e1; background: rgba(255,255,255,0.96); color: #172033; }
.map-search input:focus { outline: 2px solid rgba(37,99,235,0.22); border-color: #2563eb; }
.search-results { margin-top: 0.35rem; border: 1px solid #cbd5e1; background: white; max-height: 260px; overflow: auto; }
.search-results button { width: 100%; display: flex; justify-content: space-between; align-items: baseline; gap: 0.75rem; padding: 0.65rem 0.75rem; border: 0; border-bottom: 1px solid #e2e8f0; background: white; color: #172033; text-align: left; cursor: pointer; }
.search-results button:hover { background: #eff6ff; }
.search-results span { color: #64748b; font-size: 0.78rem; text-align: right; }
.zoom-controls { display: flex; align-items: center; min-height: 42px; border: 1px solid #cbd5e1; background: rgba(255,255,255,0.96); }
.zoom-controls button { width: 40px; height: 40px; padding: 0; border: 0; border-right: 1px solid #e2e8f0; background: transparent; color: #172033; cursor: pointer; font-size: 1.1rem; }
.zoom-controls button:hover { background: #eff6ff; color: #1d4ed8; }
.zoom-controls span { min-width: 56px; text-align: center; font-family: var(--font-mono); font-size: 0.75rem; }
.zoom-controls .reset-button { width: auto; padding: 0 0.7rem; border-right: 0; font-size: 0.82rem; }
.map-route-status { position: absolute; z-index: 4; right: 0.75rem; bottom: 0.75rem; display: flex; align-items: center; gap: 0.65rem; max-width: min(380px, calc(100% - 1.5rem)); padding: 0.65rem 0.8rem; box-sizing: border-box; border: 1px solid #cbd5e1; background: rgba(255,255,255,0.96); pointer-events: none; }
.map-route-status div { display: grid; gap: 0.15rem; }
.map-route-status strong { color: #172033; font-size: 0.8rem; }
.map-route-status small { color: #64748b; font-size: 0.68rem; }
.status-spinner { width: 16px; height: 16px; flex: 0 0 auto; border: 2px solid #bfdbfe; border-top-color: #2563eb; border-radius: 50%; animation: route-spin 700ms linear infinite; }
.map-canvas { width: 100%; height: 100%; overflow: hidden; touch-action: none; cursor: grab; }
.map-canvas:active { cursor: grabbing; }
.map-canvas svg { width: 100%; height: 100%; display: block; background: #fff; }
.map-stage { text-rendering: optimizeLegibility; }
.is-interacting .misc-node, .is-interacting .station-label { visibility: hidden; }
.is-interacting .map-edge { shape-rendering: optimizeSpeed; }
.line-layer { pointer-events: none; }
.route-edge { opacity: 1; }
.route-edge.is-dimmed { opacity: 0.12; }
.map-edge { fill: none; stroke-linecap: round; stroke-linejoin: round; }
.misc-node { pointer-events: none; }
.misc-node text { font-family: Arial, "Noto Sans SC", sans-serif; letter-spacing: 0; }
.misc-node text.outlined { paint-order: stroke; stroke: #fff; stroke-width: 2px; stroke-linejoin: round; }
.map-station { opacity: 1; }
.map-station.interactive { cursor: pointer; }
.map-station.route-dimmed { opacity: 0.28; }
.map-station.route-dimmed:hover, .map-station.route-dimmed.selected { opacity: 1; }
.station-hit { fill: transparent; }
.station-core { fill: white; stroke: #393332; stroke-width: 1; transition: stroke-width 140ms ease, filter 140ms ease; }
.sz-int { stroke: #616161; }
.gd-intercity { stroke: #2559a8; stroke-width: 1.5; }
.other-station { stroke: #667085; }
.station-label { paint-order: stroke; stroke: rgba(255,255,255,0.96); stroke-width: 2.5px; stroke-linejoin: round; }
.station-label text { fill: #111; font-family: Arial, "Noto Sans SC", sans-serif; letter-spacing: 0; }
.station-name-zh { font-size: 12.67px; font-weight: 500; }
.map-station.suzhourt-basic .station-name-zh, .map-station.suzhourt-int .station-name-zh { font-size: 10px; }
.map-station.suzhourt-basic .station-name-en, .map-station.suzhourt-int .station-name-en { font-size: 5px; }
.station-name-en { fill: #60646c !important; font-size: 6.67px; font-weight: 400; }
.map-station:hover .station-core, .map-station.selected .station-core { stroke: #2563eb; stroke-width: 2.5; }
.map-station.active .station-core { fill: #fff3a6; stroke: #e11d48; stroke-width: 3; }
.map-station.start-point .station-core { fill: #dcfce7; stroke: #15803d; stroke-width: 3; }
.map-station.end-point .station-core { fill: #ffe4e6; stroke: #be123c; stroke-width: 3; }
.map-station:focus { outline: none; }
.map-station:focus .station-core { stroke: #2563eb; stroke-width: 2.5; }
.station-panel { position: absolute; z-index: 4; left: 0.75rem; bottom: 0.75rem; width: min(320px, calc(100% - 1.5rem)); padding: 1rem; box-sizing: border-box; border: 1px solid #cbd5e1; background: rgba(255,255,255,0.97); }
.panel-close { position: absolute; top: 0.5rem; right: 0.5rem; width: 32px; height: 32px; border: 1px solid #e2e8f0; background: transparent; color: #475569; cursor: pointer; font-size: 1.25rem; }
.station-kicker { color: #2563eb; font-size: 0.68rem; font-weight: 800; }
.station-panel h3 { margin: 0.35rem 2rem 0 0; font-size: 1.25rem; color: #0f172a; }
.station-panel p { margin: 0.25rem 0 0; color: #64748b; }
.station-facts { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin: 0.85rem 0 0; }
.station-facts div { padding: 0.55rem 0.65rem; background: #f1f5f9; border-left: 2px solid #94a3b8; }
.station-facts dt, .station-connections > span { color: #64748b; font-size: 0.68rem; font-weight: 700; }
.station-facts dd { margin: 0.2rem 0 0; color: #172033; font-size: 0.85rem; font-weight: 700; }
.station-connections { margin-top: 0.75rem; }
.station-connections ul { display: flex; flex-wrap: wrap; gap: 0.35rem; margin: 0.4rem 0 0; padding: 0; list-style: none; }
.station-connections li { display: flex; align-items: center; gap: 0.35rem; padding: 0.28rem 0.45rem; border: 1px solid #e2e8f0; color: #334155; font-size: 0.72rem; }
.station-connections i { width: 12px; height: 4px; flex: 0 0 auto; border-radius: 1px; }
.station-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-top: 0.9rem; }
.station-actions button { min-height: 38px; border: 1px solid #2563eb; background: #2563eb; color: white; cursor: pointer; font-weight: 700; }
.station-actions button + button { background: white; color: #2563eb; }
.station-actions button:hover { background: #1d4ed8; color: white; }
.station-actions button:disabled { border-color: #94a3b8; background: #e2e8f0; color: #64748b; cursor: default; }
.unlinked { padding-top: 0.65rem; border-top: 1px solid #e2e8f0; font-size: 0.82rem; }
.station-panel-enter-active, .station-panel-leave-active { transition: opacity 180ms ease, transform 220ms cubic-bezier(0.22,1,0.36,1); }
.station-panel-enter-from, .station-panel-leave-to { opacity: 0; transform: translateY(10px); }
.sr-only { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; }
@keyframes route-spin { to { transform: rotate(360deg); } }

@media (max-width: 640px) {
	.map-toolbar { top: max(0.6rem, env(safe-area-inset-top, 0px)); left: 0.6rem; right: 0.6rem; flex-wrap: wrap; }
	.map-search { width: 100%; order: 2; }
	.zoom-controls { margin-left: auto; }
	.map-route-status { right: 0.6rem; bottom: max(0.6rem, env(safe-area-inset-bottom, 0px)); max-width: calc(100% - 1.2rem); }
	.station-panel { left: 0.6rem; bottom: max(0.6rem, env(safe-area-inset-bottom, 0px)); width: calc(100% - 1.2rem); max-height: min(58dvh, 430px); overflow-y: auto; overscroll-behavior: contain; }
}

@media (max-width: 420px) {
	.map-toolbar { top: max(0.4rem, env(safe-area-inset-top, 0px)); left: 0.4rem; right: 0.4rem; gap: 0.4rem; }
	.map-search input { height: 38px; padding-inline: 0.65rem; font-size: 0.88rem; }
	.search-results { max-height: min(42dvh, 220px); }
	.search-results button { align-items: flex-start; flex-direction: column; gap: 0.15rem; padding: 0.55rem 0.65rem; }
	.search-results span { text-align: left; overflow-wrap: anywhere; }
	.zoom-controls { min-height: 38px; }
	.zoom-controls button { width: 36px; height: 36px; }
	.zoom-controls span { min-width: 46px; font-size: 0.7rem; }
	.zoom-controls .reset-button { padding-inline: 0.55rem; font-size: 0.76rem; }
	.map-route-status { right: 0.4rem; bottom: max(0.4rem, env(safe-area-inset-bottom, 0px)); max-width: calc(100% - 0.8rem); padding: 0.55rem 0.65rem; }
	.map-route-status strong, .map-route-status small { overflow-wrap: anywhere; }
	.station-panel { left: 0.4rem; bottom: max(0.4rem, env(safe-area-inset-bottom, 0px)); width: calc(100% - 0.8rem); max-height: min(62dvh, 420px); padding: 0.75rem; }
	.station-panel h3 { font-size: 1.08rem; overflow-wrap: anywhere; }
	.station-panel p { overflow-wrap: anywhere; }
	.station-facts { gap: 0.35rem; margin-top: 0.65rem; }
	.station-facts div { min-width: 0; padding: 0.45rem 0.5rem; }
	.station-facts dd { overflow-wrap: anywhere; }
	.station-connections { margin-top: 0.55rem; }
	.station-connections li { min-width: 0; overflow-wrap: anywhere; }
	.station-actions { gap: 0.35rem; margin-top: 0.65rem; }
	.station-actions button { min-width: 0; min-height: 36px; padding-inline: 0.35rem; font-size: 0.78rem; overflow-wrap: anywhere; }
}

@media (max-width: 320px) {
	.zoom-controls button { width: 32px; }
	.zoom-controls span { min-width: 40px; }
	.zoom-controls .reset-button { padding-inline: 0.4rem; }
	.station-kicker { font-size: 0.62rem; }
	.station-facts { grid-template-columns: 1fr; }
}

@media (prefers-reduced-motion: reduce) {
	.station-core, .station-panel-enter-active, .station-panel-leave-active { transition: none; }
	.status-spinner { animation: none; }
}
</style>
