import { computed } from 'vue'
import mapData from '@/data/transportMap.json'

export const graphNodes = mapData.graph?.nodes || []
export const graphEdges = mapData.graph?.edges || []
export const nodeByKey = new Map(graphNodes.map((node) => [node.key, node]))
export const edgeByKey = new Map(graphEdges.map((edge) => [edge.key, edge]))
const bounds = graphNodes.reduce((result, node) => {
	const { x = 0, y = 0 } = node.attributes || {}
	result.minX = Math.min(result.minX, x)
	result.maxX = Math.max(result.maxX, x)
	result.minY = Math.min(result.minY, y)
	result.maxY = Math.max(result.maxY, y)
	return result
}, { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity })

const padding = 82
export const baseView = {
	x: bounds.minX - padding,
	y: bounds.minY - padding,
	width: bounds.maxX - bounds.minX + padding * 2,
	height: bounds.maxY - bounds.minY + padding * 2,
}

export function nodePayload(node) {
	const attributes = node.attributes || {}
	return attributes[attributes.type] || {}
}

export function nodeNames(node) {
	const names = nodePayload(node).names
	return Array.isArray(names) ? names : []
}

export function normalized(value) {
	return String(value || '').trim().toLocaleLowerCase()
}

export function colorOf(payload, fallback = '#393332') {
	return payload?.color?.[2] || fallback
}

export function normalizedColor(value) {
	const raw = String(value || '').trim().replace(/^#/, '').replace(/^0x/i, '').toLowerCase()
	if (/^[0-9a-f]{3}$/.test(raw)) return `#${raw.split('').map((part) => part + part).join('')}`
	return /^[0-9a-f]{6}$/.test(raw) ? `#${raw}` : ''
}

export function colorsMatch(first, second) {
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
	const name = payload.num !== undefined ? String(payload.num) : payload.names?.[0]
	if (!color || !name) return lookup
	const names = lookup.get(color) || []
	if (!names.includes(name)) names.push(name)
	lookup.set(color, names)
	return lookup
}, new Map())

const stationTypeNames = {
	'shmetro-basic': 'mapPage.stationTypes.basic',
	'shmetro-int': 'mapPage.stationTypes.interchange',
	'suzhourt-basic': 'mapPage.stationTypes.basic',
	'suzhourt-int': 'mapPage.stationTypes.interchange',
	'guangdong-intercity-rwy': 'mapPage.stationTypes.intercity',
}

const transportStyleNames = {
	'single-color': 'mapPage.stationTypes.rail',
	'mtr-light-rail': 'mapPage.stationTypes.rapid',
	'river': 'mapPage.stationTypes.water',
	'bjsubway-dotted': 'mapPage.stationTypes.unbuilt',
	'sh-sub-rwy': 'mapPage.stationTypes.intercityRail',
	'gzmtr-virtual-int': 'mapPage.stationTypes.outsideTransfer',
	'mtr-paid-area': 'mapPage.stationTypes.insideTransfer',
	'mtr-unpaid-area': 'mapPage.stationTypes.outsideTransfer',
	'chengdurt-outside-fare-gates': 'mapPage.stationTypes.fareGateTransfer',
}

export function useTransportMapStations(props, t, query) {
  function connectionName(style, color) {
  	const exactColor = normalizedColor(color)
  	const matchedColor = [...lineNamesByColor.keys()].find((candidate) => colorsMatch(candidate, exactColor))
  	const lineNames = lineNamesByColor.get(exactColor) || lineNamesByColor.get(matchedColor)
  	const localizedLineNames = lineNames?.map((name) => /^\d+$/.test(String(name)) ? t('mapPage.line', { number: name }) : name)
  	return localizedLineNames?.join(' / ') || (transportStyleNames[style] ? t(transportStyleNames[style]) : t('mapPage.stationTypes.default'))
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
  		const color = node.attributes.color || []
  		let apiStation = names.map((name) => apiStationLookup.value.get(normalized(name))).find(Boolean) || null
  		if (!apiStation && type === 'suzhourt-int') apiStation = apiStationLookup.value.get(normalized('高铁'+names[0]+'站')) || null
  		if (!apiStation && type === 'suzhourt-basic' && color[2] != "#000000" && color[2] != "#e0e0e0") apiStation = apiStationLookup.value.get(normalized('高铁'+names[0]+'站')) || null
  		if (type === 'suzhourt-basic' && names[0] === '出生点') apiStation = apiStationLookup.value.get(normalized('高铁出生点站')) || null
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
  			typeName: t(stationTypeNames[type] || 'transportPage.stationTypes.default'),
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
  	return props.stations.find((station) => String(station.id) === String(id))?.name || id || t('mapPage.notSelected')
  }

  return { stations, filteredStations, apiStationName }
}
