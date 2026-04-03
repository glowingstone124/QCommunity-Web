<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import TransportOptionsModal from '@/components/transport/TransportOptionsModal.vue'
import TransportResultTimeline from '@/components/transport/TransportResultTimeline.vue'
import { defaultDimensionOptions, defaultTransportTypes } from '@/data/transport'

const stations = ref([])
const startInput = ref('')
const endInput = ref('')
const startStationId = ref('')
const endStationId = ref('')
const showStartSuggestions = ref(false)
const showEndSuggestions = ref(false)
const isLoading = ref(false)
const routeResult = ref(null)
const showOptions = ref(false)
const transportTypes = ref(defaultTransportTypes.map((item) => ({ ...item })))
const dimensionOptions = ref(defaultDimensionOptions.map((item) => ({ ...item })))

const fetchAllStations = async () => {
	try {
		const response = await fetch('https://api.qoriginal.vip/qo/transportation/station/all')
		stations.value = await response.json()
	} catch (error) {
		console.error('获取站点数据失败:', error)
	}
}

const filteredStartStations = computed(() => {
	const query = startInput.value.toLowerCase()
	return stations.value.filter(
		(station) =>
			station.name.toLowerCase().includes(query) ||
			(station.name_en && station.name_en.toLowerCase().includes(query))
	)
})

const filteredEndStations = computed(() => {
	const query = endInput.value.toLowerCase()
	return stations.value.filter(
		(station) =>
			station.name.toLowerCase().includes(query) ||
			(station.name_en && station.name_en.toLowerCase().includes(query))
	)
})

const getBannedTypes = computed(() => transportTypes.value.filter((t) => t.disabled).map((t) => t.int_name))
const getBannedDims = computed(() => dimensionOptions.value.filter((d) => d.disabled).map((d) => d.id))

const selectStartStation = (station, locale) => {
	startInput.value = locale === 'en' ? station.name_en : station.name
	startStationId.value = station.id
	showStartSuggestions.value = false
}

const selectEndStation = (station, locale) => {
	endInput.value = locale === 'en' ? station.name_en : station.name
	endStationId.value = station.id
	showEndSuggestions.value = false
}

const searchRoute = async () => {
	if (!startStationId.value || !endStationId.value) {
		alert('请选择始发站和终点站')
		return
	}
	isLoading.value = true
	try {
		const response = await fetch('https://api.qoriginal.vip/qo/transportation/calculate', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				start: startStationId.value,
				end: endStationId.value,
				banned_dims: getBannedDims.value,
				banned_types: getBannedTypes.value,
			}),
		})
		const data = await response.json()
		routeResult.value =
			data.result === '-1'
				? { message: '未找到符合条件的路线' }
				: {
						message: `共 ${data.totalStops} 站，用时约 ${data.totalTime} 秒`,
						data,
					}
	} catch (error) {
		console.error('查询路线失败:', error)
		routeResult.value = { error: error.message }
	} finally {
		isLoading.value = false
	}
}

const handleStartFocus = () => {
	showStartSuggestions.value = true
}

const handleEndFocus = () => {
	showEndSuggestions.value = true
}

const showMap = () => {
	window.open('https://bucket.glowingstone.cn/metro.png')
}

const closeSuggestionsOnClickOutside = (event) => {
	const isClickInsideStartInput = event.target.closest('.start-input-container')
	const isClickInsideEndInput = event.target.closest('.end-input-container')
	if (!isClickInsideStartInput) {
		showStartSuggestions.value = false
	}
	if (!isClickInsideEndInput) {
		showEndSuggestions.value = false
	}
}

const toggleTransportType = (typeId) => {
	const index = transportTypes.value.findIndex((t) => t.id === typeId)
	if (index !== -1) {
		transportTypes.value[index].disabled = !transportTypes.value[index].disabled
	}
}

const toggleDimension = (dimId) => {
	const index = dimensionOptions.value.findIndex((d) => d.id === dimId)
	if (index !== -1) {
		dimensionOptions.value[index].disabled = !dimensionOptions.value[index].disabled
	}
}

const applyPreset = (preset) => {
	switch (preset) {
		case 'rail':
			transportTypes.value.forEach((t) => {
				t.disabled = ![0, 1, 3].includes(t.id)
			})
			dimensionOptions.value.forEach((d) => {
				d.disabled = false
			})
			break
		case 'overworld':
			transportTypes.value.forEach((t) => {
				t.disabled = false
			})
			dimensionOptions.value.forEach((d) => {
				d.disabled = d.id !== 'OVERWORLD'
			})
			break
		default:
			transportTypes.value.forEach((t) => {
				t.disabled = false
			})
			dimensionOptions.value.forEach((d) => {
				d.disabled = false
			})
			break
	}
}

onMounted(() => {
	fetchAllStations()
	document.addEventListener('click', closeSuggestionsOnClickOutside)
})

onUnmounted(() => {
	document.removeEventListener('click', closeSuggestionsOnClickOutside)
})
</script>

<template>
	<div class="transport-page page-shell">
		<div class="title">
			<h1>在这里查询交通路线</h1>
			<h2>含地铁、捷运、蓝冰船、城铁、下界交通、珍珠炮、飞机等</h2>
		</div>

		<div class="container">
			<div class="query">
				<div class="input-group">
					<label for="start">始发站：</label>
					<div class="input-with-suggestions start-input-container">
						<input
							id="start"
							v-model="startInput"
							type="text"
							@focus="handleStartFocus"
							@input="showStartSuggestions = true"
							placeholder="输入站名或英文站名"
							class="station-input"
							autocomplete="off"
						/>
						<div v-if="showStartSuggestions && filteredStartStations.length" class="suggestions">
							<div
								v-for="station in filteredStartStations"
								:key="station.id"
								class="suggestion-item"
								@click="selectStartStation(station, $i18n.locale)"
							>
								<div class="station-name" v-if="$i18n.locale === 'en'">{{ station.name_en }}</div>
								<div class="station-name" v-else>{{ station.name }}</div>
								<div class="station-name-en" v-if="$i18n.locale === 'en'">{{ station.name }}</div>
								<div class="station-name-en" v-else>{{ station.name_en }}</div>
							</div>
						</div>
					</div>
				</div>

				<div class="input-group">
					<label for="end">终点站：</label>
					<div class="input-with-suggestions end-input-container">
						<input
							id="end"
							v-model="endInput"
							type="text"
							@focus="handleEndFocus"
							@input="showEndSuggestions = true"
							placeholder="输入站名或英文站名"
							class="station-input"
							autocomplete="off"
						/>
						<div v-if="showEndSuggestions && filteredEndStations.length" class="suggestions">
							<div
								v-for="station in filteredEndStations"
								:key="station.id"
								class="suggestion-item"
								@click="selectEndStation(station, $i18n.locale)"
							>
								<div class="station-name" v-if="$i18n.locale === 'en'">{{ station.name_en }}</div>
								<div class="station-name" v-else>{{ station.name }}</div>
								<div class="station-name-en" v-if="$i18n.locale === 'en'">{{ station.name }}</div>
								<div class="station-name-en" v-else>{{ station.name_en }}</div>
							</div>
						</div>
					</div>
				</div>

				<div class="button-group">
					<button
						@click="searchRoute"
						:disabled="isLoading || !startStationId || !endStationId"
						class="search-button"
					>
						{{ isLoading ? '查询中...' : getBannedTypes.length + getBannedDims.length === 0 ? '查询' : '高级查询' }}
					</button>
					<button @click="showOptions = true" class="options-button">高级选项</button>
				</div>
				<img src="https://bucket.glowingstone.cn/metro.png" alt="单击查看大图" @click="showMap" class="transport-map" />
			</div>

			<div class="result">
				<div v-if="routeResult">
					<h3>查询结果：</h3>
					<p v-if="routeResult.message">{{ routeResult.message }}</p>
					<p v-if="routeResult.error" class="error">{{ routeResult.error }}</p>
					<TransportResultTimeline :result="routeResult" :stations="stations" :locale="$i18n.locale" />
				</div>
				<div v-else class="placeholder">
					<p>查询结果将显示在这里</p>
					<p>请选择始发站和终点站后点击查询按钮</p>
				</div>
			</div>
		</div>

		<TransportOptionsModal
			:show="showOptions"
			:transport-types="transportTypes"
			:dimension-options="dimensionOptions"
			:banned-types="getBannedTypes"
			:banned-dims="getBannedDims"
			@close="showOptions = false"
			@preset="applyPreset"
			@toggle-transport="toggleTransportType"
			@toggle-dimension="toggleDimension"
		/>
	</div>
</template>

<style scoped>
@import url('@/assets/main.css');

.transport-page {
	display: grid;
	gap: 1.5rem;
}

.title {
	display: grid;
	gap: 0.25rem;
}

h1,
h2 {
	color: var(--text);
	margin: 0;
}

h1 {
	font-weight: 600;
	font-size: clamp(2rem, 5vw, 3rem);
}

h2 {
	font-weight: 300;
}

.container {
	display: grid;
	grid-template-columns: minmax(300px, 0.95fr) minmax(0, 1.35fr);
	gap: 1.5rem;
	min-height: 60vh;
}

.query,
.result {
	background: var(--card-background);
	border-radius: 24px;
	padding: 1.5rem;
	border: 1px solid var(--split);
	box-shadow: 0 16px 32px rgba(15, 23, 42, 0.08);
}

.query {
	display: flex;
	flex-direction: column;
	gap: 1.25rem;
	min-width: 0;
}

.input-group {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	min-width: 0;
}

label {
	color: var(--text);
	font-weight: 500;
}

.input-with-suggestions {
	position: relative;
	width: 100%;
	min-width: 0;
}

.station-input {
	box-sizing: border-box;
	width: 100%;
	max-width: 100%;
	padding: 0.95rem 1rem;
	border: 1px solid var(--split);
	border-radius: 1rem;
	background: var(--background-secondary);
	color: var(--text);
	font-size: 1rem;
}

.station-input:focus {
	outline: none;
	border-color: var(--primary);
	box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 16%, transparent);
}

.suggestions {
	position: absolute;
	top: calc(100% + 0.25rem);
	left: 0;
	right: 0;
	background: var(--background-secondary);
	border: 1px solid var(--split);
	border-radius: 14px;
	max-height: 300px;
	overflow-y: auto;
	z-index: 1000;
	box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08);
}

.suggestion-item {
	padding: 0.75rem 1rem;
	cursor: pointer;
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 1rem;
	transition: background-color 0.2s;
}

.suggestion-item:hover {
	background-color: color-mix(in srgb, var(--primary) 10%, transparent);
}

.station-name {
	color: var(--text);
	font-weight: 500;
}

.station-name-en {
	color: var(--text-secondary);
	font-size: 0.9rem;
}

.button-group {
	display: flex;
	gap: 1rem;
	align-items: center;
}

.button-group button {
	padding: 0.8rem 0;
	border-radius: 12px;
	font-size: 1rem;
	font-weight: 600;
	cursor: pointer;
	border: none;
	transition: background-color 0.2s;
}

.search-button {
	width: 60%;
	color: white;
	background: var(--primary);
}

.options-button {
	width: 40%;
	color: var(--text-main);
	background: var(--primary-light);
}

.search-button:hover:not(:disabled) {
	background: var(--primary-dark);
}

.search-button:disabled {
	opacity: 0.5;
	cursor: not-allowed;
}

.result {
	display: flex;
	flex-direction: column;
}

.result h3 {
	color: var(--text);
	margin-top: 0;
}

.placeholder {
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	height: 100%;
	color: var(--text-secondary);
	text-align: center;
}

.placeholder p {
	margin: 0.5rem 0;
}

.error {
	color: var(--error);
}

.transport-map {
	width: 100%;
	cursor: pointer;
	border-radius: 18px;
	border: 1px solid var(--split);
}

@media (max-width: 900px) {
	.container {
		grid-template-columns: 1fr;
	}
}

@media (max-width: 640px) {
	.button-group {
		flex-direction: column;
	}

	.search-button,
	.options-button {
		width: 100%;
	}

	.query,
	.result {
		padding: 1rem;
		border-radius: 18px;
	}
}
</style>
