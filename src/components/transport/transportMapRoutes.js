import { computed } from 'vue'
import {
  colorOf,
  colorsMatch,
  edgeByKey,
  graphEdges,
  nodeByKey,
  nodeNames,
  normalizedColor,
} from './transportMapGraph.js'

export function useTransportMapRoutes(props, stations) {
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
  	const findPath = (sources, targets, segmentColor) => {
  		const targetKeys = new Set(targets)
  		const queue = [...sources]
  		const previous = new Map(sources.map((source) => [source, null]))
  		let reachedTarget = null
  		while (queue.length) {
  			const current = queue.shift()
  			if (targetKeys.has(current)) {
  				reachedTarget = current
  				break
  			}
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
  				const isOtherNamedStation = !targetKeys.has(next.node) && candidate?.key.startsWith('stn_') && nodeNames(candidate).some(Boolean)
  				if (isOtherNamedStation) continue
  				previous.set(next.node, { node: current, edge: next.edge })
  				queue.push(next.node)
  			}
  		}
  		if (!reachedTarget) return false
  		let cursor = reachedTarget
  		while (previous.get(cursor)) {
  			const step = previous.get(cursor)
  			result.add(step.edge)
  			cursor = step.node
  		}
  		return true
  	}
  	for (const segment of props.routeSegments) {
  		const segmentColor = normalizedColor(segment.color)
  		const candidateKeys = (segment.stationIds || []).map((id) => {
  			const candidates = stationByApiId.get(String(id)) || []
  			return [...candidates]
  				.sort((first, second) => Number(second.connections.some((connection) => colorsMatch(connection.color, segmentColor))) - Number(first.connections.some((connection) => colorsMatch(connection.color, segmentColor))))
  				.map((station) => station.key)
  		})
  		for (let index = 0; index < candidateKeys.length - 1; index += 1) {
  			if (!candidateKeys[index].length || !candidateKeys[index + 1].length) continue
  			findPath(candidateKeys[index], candidateKeys[index + 1], segmentColor)
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

  return {
    hasActiveRoute,
    isActiveStation,
    isActiveEdge,
    stationConnectionsForDisplay,
    edges,
  }
}
