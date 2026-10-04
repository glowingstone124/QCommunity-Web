<script setup>
import { useI18n } from 'vue-i18n'
import { useInteractiveTransportMap } from './useInteractiveTransportMap.js'

const { t } = useI18n()

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
const {
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
} = useInteractiveTransportMap(props, t)
</script>

<template>
	<div :class="['interactive-map', { 'is-interacting': isInteracting }]">
		<div class="map-toolbar">
			<label class="map-search">
				<span class="sr-only">{{ t('mapPage.mapSearch') }}</span>
				<input v-model="query" type="search" :placeholder="t('mapPage.mapSearch')" autocomplete="off" />
				<div v-if="filteredStations.length" class="search-results">
					<button v-for="station in filteredStations" :key="station.key" type="button" @click="chooseStation(station, true)">
						<strong>{{ station.name }}</strong><span>{{ station.nameEn }}</span>
					</button>
				</div>
			</label>
			<div class="zoom-controls" :aria-label="t('mapPage.mapZoomControls')">
				<button type="button" :aria-label="t('mapPage.zoomOut')" :title="t('mapPage.zoomOut')" @click="zoomOut">−</button>
				<span>{{ Math.round(scale * 100) }}%</span>
				<button type="button" :aria-label="t('mapPage.zoomIn')" :title="t('mapPage.zoomIn')" @click="zoomIn">+</button>
				<button type="button" class="reset-button" @click="resetMap">{{ t('mapPage.resetMap') }}</button>
			</div>
		</div>
		<div v-if="routeLoading || routeMessage || startStationId || endStationId" class="map-route-status" aria-live="polite">
			<span v-if="routeLoading" class="status-spinner"></span>
			<div>
					<strong v-if="routeLoading">{{ t('mapPage.mapCalculating') }}</strong>
				<strong v-else-if="routeMessage">{{ routeMessage }}</strong>
					<strong v-else>{{ t(startStationId ? 'mapPage.chooseEnd' : 'mapPage.chooseStart') }}</strong>
						<small v-if="!routeLoading">{{ t('mapPage.startAndEnd', { start: apiStationName(startStationId), end: apiStationName(endStationId) }) }}</small>
			</div>
		</div>

		<div ref="viewport" class="map-canvas" @wheel="handleWheel" @pointerdown="handlePointerDown" @pointermove="handlePointerMove" @pointerup="handlePointerUp" @pointercancel="handlePointerUp">
				<svg class="map-stage" :viewBox="viewBox" role="img" :aria-label="t('mapPage.mapImageAlt')">
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
							<text :x="badgeWidth(node) + 2" y="11.5" font-size="12.5" font-weight="700">{{ t('mapPage.line', { number: node.payload.num }) }}</text>
							<text :x="badgeWidth(node) + 3" y="21" font-size="7">{{ t('mapPage.lineEn', { number: node.payload.num }) }}</text>
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

					<g v-for="station in visibleStations" :key="station.key" :class="['map-station', station.type, { active: isActiveStation(station), 'start-point': station.apiStation && String(startStationId) === String(station.apiStation.id), 'end-point': station.apiStation && String(endStationId) === String(station.apiStation.id), 'route-dimmed': hasActiveRoute && !isActiveStation(station), selected: selectedStation?.key === station.key, linked: station.apiStation, interactive: station.name }]" :transform="`translate(${station.x} ${station.y})`" :role="station.name ? 'button' : undefined" :tabindex="station.name ? 0 : undefined" :aria-label="station.name ? `${station.name} ${t('mapPage.stationDetails')}` : undefined" @click.stop="chooseStation(station)" @keydown="handleStationKeydown($event, station)">
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
					<button type="button" class="panel-close" :aria-label="t('mapPage.closeStation')" @click="selectedStation = null">×</button>
					<h3>{{ selectedStation.name }}</h3><p>{{ selectedStation.nameEn || t('mapPage.noEnglishName') }}</p>
				<dl class="station-facts">
					<div>
						<dt>{{ t('mapPage.stationId') }}</dt>
						<dd>{{ selectedStation.apiStation?.id || t('mapPage.notRecorded') }}</dd>
					</div>
					<div>
						<dt>{{ t('mapPage.stationType') }}</dt>
						<dd>{{ selectedStation.typeName }}</dd>
					</div>
				</dl>
				<div v-if="stationConnectionsForDisplay(selectedStation).length" class="station-connections">
						<span>{{ t('mapPage.connections') }}</span>
					<ul>
						<li v-for="connection in stationConnectionsForDisplay(selectedStation)" :key="`${connection.style}-${connection.color}`">
							<i :style="{ backgroundColor: connection.color }"></i>{{ connection.name }}
						</li>
					</ul>
				</div>
				<div v-if="selectedStation.apiStation" class="station-actions">
						<button type="button" :disabled="routeLoading || String(startStationId) === String(selectedStation.apiStation.id)" @click="emit('set-start', selectedStation.apiStation)">{{ String(startStationId) === String(selectedStation.apiStation.id) ? t('mapPage.currentStart') : t('mapPage.setStart') }}</button>
						<button type="button" :disabled="routeLoading || String(endStationId) === String(selectedStation.apiStation.id)" @click="emit('set-end', selectedStation.apiStation)">{{ String(endStationId) === String(selectedStation.apiStation.id) ? t('mapPage.currentEnd') : t('mapPage.setEnd') }}</button>
				</div>
					<p v-else class="unlinked">{{ t('mapPage.notLinked') }}</p>
			</aside>
		</Transition>
	</div>
</template>

<style scoped src="./InteractiveTransportMap.css"></style>
