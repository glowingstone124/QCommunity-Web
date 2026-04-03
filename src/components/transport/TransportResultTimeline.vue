<script setup>
const props = defineProps({
	locale: {
		type: String,
		default: 'zh',
	},
	result: {
		type: Object,
		default: null,
	},
	stations: {
		type: Array,
		default: () => [],
	},
})

function findStation(stationId) {
	return props.stations.find((station) => station.id === stationId)
}

function getStationName(stationId) {
	const station = findStation(stationId)
	if (!station) {
		return stationId
	}

	return props.locale === 'en' ? station.name_en || station.name : station.name || station.name_en
}

function normalizeColor(color) {
	const raw = String(color || '').trim().replace(/^#/, '').replace(/^0x/i, '')
	if (/^([0-9a-f]{3}|[0-9a-f]{6})$/i.test(raw)) {
		return `#${raw}`
	}
	return 'var(--primary)'
}
</script>

<template>
	<div v-if="result?.data" class="result-main">
		<div v-for="(segment, seg) in result.data.segments" :key="`${segment.lineName}-${seg}`" class="segment-group">
			<div v-if="seg === 0" class="colored-segment station-node">
				<div class="concentric-circle-mask">&nbsp;</div>
				<span class="node-stations">{{ getStationName(segment.stationIds[0]) }}</span>
			</div>

			<div class="colored-segment line-heading">
				<div class="color-block" :style="{ backgroundColor: normalizeColor(segment.color) }">&nbsp;</div>
				<h3 class="line-name">{{ locale === 'en' ? segment.name_en : segment.lineName }}</h3>
			</div>

			<div v-for="(stationId, seq) in segment.stationIds" :key="`${segment.lineName}-${stationId}-${seq}`">
				<div v-if="seq === segment.stationIds.length - 1" class="colored-segment station-node">
					<div class="concentric-circle-mask">&nbsp;</div>
					<span class="node-stations">{{ getStationName(stationId) }}</span>
				</div>
				<div v-else-if="seq !== 0" class="colored-segment station-item">
					<div class="color-block" :style="{ backgroundColor: normalizeColor(segment.color) }">&nbsp;</div>
					<span class="small-stations">{{ getStationName(stationId) }}</span>
				</div>
			</div>
		</div>
	</div>
</template>

<style scoped>
.result-main {
	overflow: auto;
	max-height: 50vh;
	padding: 0.5rem 0 4rem;
}

.segment-group {
	display: grid;
}

.colored-segment {
	display: flex;
	flex-direction: row;
	align-items: center;
	gap: 1rem;
	margin-block: -0.5px;
	border-radius: 0;
}

.color-block {
	display: block;
	width: 0.7rem;
	min-width: 0.7rem;
	height: 2rem;
	margin-left: 1.05rem;
	border-radius: 0;
	box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.08);
}

.line-name {
	font-weight: 600;
	margin: 0 0 0.2rem;
}

.small-stations {
	font-weight: 300;
	padding: 0.2rem 0 0.35rem;
}

.node-stations {
	font-weight: 600;
	font-size: 1.25rem;
	vertical-align: middle;
}

.concentric-circle-mask {
	width: 1.8rem;
	height: 1.8rem;
	min-width: 1.8rem;
	background-color: white;
	border-radius: 50%;
	border: 0.4rem solid var(--primary);
	z-index: 1;
}
</style>
