import { computed, onBeforeUnmount, ref } from 'vue'
import {
  baseView,
  colorOf,
  graphNodes,
  nodeByKey,
  nodePayload,
} from './transportMapGraph.js'
import { useTransportMapRoutes } from './transportMapRoutes.js'
import { useTransportMapStations } from './transportMapGraph.js'

export function useInteractiveTransportMap(props, t) {
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
  const viewState = ref({ ...baseView })
  const viewBox = computed(() => `${viewState.value.x} ${viewState.value.y} ${viewState.value.width} ${viewState.value.height}`)
  const { stations, filteredStations, apiStationName } = useTransportMapStations(props, t, query)
  const {
    hasActiveRoute,
    isActiveStation,
    isActiveEdge,
    stationConnectionsForDisplay,
  } = useTransportMapRoutes(props, stations)

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

  return {
    viewport,
    query,
    selectedStation,
    scale,
    isInteracting,
    viewBox,
    filteredStations,
    apiStationName,
    hasActiveRoute,
    isActiveStation,
    isActiveEdge,
    stationConnectionsForDisplay,
    visibleStations,
    visibleMiscNodes,
    visibleEdges,
    colorOf,
    badgeWidth,
    chooseStation,
    handleStationKeydown,
    handleWheel,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    zoomIn,
    zoomOut,
    resetMap,
  }
}
