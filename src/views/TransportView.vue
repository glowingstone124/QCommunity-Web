<script setup>
import {ref, computed, onUnmounted, onMounted} from 'vue'
import InteractiveTransportMap from '@/components/transport/InteractiveTransportMap.vue'

// 站点数据
const stations = ref([])
// 输入框内容
const startInput = ref('')
const endInput = ref('')
// 选中的站点ID
const startStationId = ref('')
const endStationId = ref('')
// 显示建议列表
const showStartSuggestions = ref(false)
const showEndSuggestions = ref(false)
// 加载状态
const isLoading = ref(false)
// 查询结果
const routeResult = ref(null)
const showOptions = ref(false)
const showMapPreview = ref(false)
// 交通方式映射
const transportTypes = ref([
  {id: 0, name: '地铁', int_name: 'METRO', disabled: false},
  {id: 1, name: '捷运', int_name: 'RAPID', disabled: false},
  {id: 2, name: '蓝冰船', int_name: 'BLUEICE', disabled: false},
  {id: 3, name: '城铁', int_name: 'CITYMETRO', disabled: false},
  {id: 4, name: '下界交通', int_name: 'NETHER', disabled: false},
  {id: 5, name: '珍珠炮', int_name: 'PEARL', disabled: false},
  {id: 6, name: '飞机', int_name: 'AIRPLANE', disabled: false},
  {id: 7, name: '船运', int_name: 'BOAT', disabled: false}
])
// 维度选项
const dimensionOptions = ref([
  {id: 'OVERWORLD', name: '主世界', disabled: false},
  {id: 'NETHER', name: '下界', disabled: false},
  {id: 'THE_END', name: '末地', disabled: false}
])

const fetchAllStations = async () => {
  try {
    const response = await fetch('https://api.qoriginal.vip/qo/transportation/station/all')
    stations.value = await response.json()
  } catch (error) {
    console.error('获取站点数据失败:', error)
  }
}

fetchAllStations()

const filteredStartStations = computed(() => {
  const query = startInput.value.toLowerCase()
  return stations.value.filter(station =>
      station.name.toLowerCase().includes(query) ||
      (station.name_en && station.name_en.toLowerCase().includes(query))
  )
})

const filteredEndStations = computed(() => {
  const query = endInput.value.toLowerCase()
  return stations.value.filter(station =>
      station.name.toLowerCase().includes(query) ||
      (station.name_en && station.name_en.toLowerCase().includes(query))
  )
})

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
    const requestData = {
      start: startStationId.value,
      end: endStationId.value,
      banned_dims: getBannedDims.value,
      banned_types: getBannedTypes.value
    }
    const response = await fetch('https://api.qoriginal.vip/qo/transportation/calculate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData)
    })
    const data = await response.json()
    routeResult.value = {message: "共 " + data.totalStops + " 站，用时约 " + data.totalTime + " 秒", data: data}
    if (data.result === "-1") {
      routeResult.value = {message: "未找到符合条件的路线"}
    } else {
      console.log('路线查询结果:', data)
    }
  } catch (error) {
    console.error('查询路线失败:', error)
    routeResult.value = {error: error.message}
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
  showMapPreview.value = true
}

const closeMap = () => {
  showMapPreview.value = false
}

const setMapStartStation = async (station) => {
  startInput.value = station.name
  startStationId.value = station.id
  routeResult.value = null
  if (endStationId.value) await searchRoute()
}

const setMapEndStation = async (station) => {
  endInput.value = station.name
  endStationId.value = station.id
  routeResult.value = null
  if (startStationId.value) await searchRoute()
}

const handleEscape = (event) => {
  if (event.key !== 'Escape') return
  if (showMapPreview.value) closeMap()
  if (showOptions.value) closeOptions()
}

onMounted(() => {
  document.addEventListener('click', closeSuggestionsOnClickOutside)
  document.addEventListener('keydown', handleEscape)
})

onUnmounted(() => {
  document.removeEventListener('click', closeSuggestionsOnClickOutside)
  document.removeEventListener('keydown', handleEscape)
})
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
  const index = transportTypes.value.findIndex(t => t.id === typeId)
  if (index !== -1) {
    transportTypes.value[index].disabled = !transportTypes.value[index].disabled
  }
}

const toggleDimension = (dimId) => {
  const index = dimensionOptions.value.findIndex(d => d.id === dimId)
  if (index !== -1) {
    dimensionOptions.value[index].disabled = !dimensionOptions.value[index].disabled
  }
}

const applyPreset = (preset) => {
  switch (preset) {
    case 'rail':
      transportTypes.value.forEach(t => {
        t.disabled = ![0, 1, 3].includes(t.id)
      })
      dimensionOptions.value.forEach(d => {
        d.disabled = false
      })
      break

    case 'overworld':
      transportTypes.value.forEach(t => {
        t.disabled = false
      })
      dimensionOptions.value.forEach(d => {
        d.disabled = d.id !== 'OVERWORLD'
      })
      break

    default:
      transportTypes.value.forEach(t => {
        t.disabled = false
      })
      dimensionOptions.value.forEach(d => {
        d.disabled = false
      })
      break
  }
}

const getBannedTypes = computed(() => {
  return transportTypes.value
      .filter(t => t.disabled)
      .map(t => t.int_name)
})

const getBannedDims = computed(() => {
  return dimensionOptions.value
      .filter(d => d.disabled)
      .map(d => d.id)
})

const searchButtonLabel = computed(() => {
  if (isLoading.value) {
    return '正在规划路线'
  }

  return getBannedTypes.value.length + getBannedDims.value.length === 0 ? '查询' : '高级查询'
})

const stationMap = computed(() => {
  return new Map(stations.value.map(station => [station.id, station]))
})

const getStationName = (stationId, locale) => {
  const station = stationMap.value.get(stationId)
  if (!station) {
    return stationId
  }

  return locale === 'en'
      ? (station.name_en || station.name)
      : (station.name || station.name_en)
}

const normalizeColor = (color) => {
  const raw = String(color || '').trim().replace(/^#/, '').replace(/^0x/i, '')
  if (/^([0-9a-f]{3}|[0-9a-f]{6})$/i.test(raw)) {
    return `#${raw}`
  }

  return 'var(--primary)'
}

const closeOptions = () => {
  showOptions.value = false
}

const closeOnOutsideClick = (event) => {
  if (event.target.classList.contains('options-popup-overlay')) {
    closeOptions()
  }
}

</script>

<template>
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
              type="text"
              id="start"
              v-model="startInput"
              @focus="handleStartFocus"
              @input="showStartSuggestions = true"
              placeholder="输入站名或英文站名"
              class="station-input"
              autocomplete="off"
          />
          <Transition name="suggestions">
          <div v-if="showStartSuggestions && filteredStartStations.length" class="suggestions">
            <div
                v-for="station in filteredStartStations"
                :key="station.id"
                @click="selectStartStation(station, $i18n.locale)"
                class="suggestion-item"
            >
              <div class="station-name" v-if="$i18n.locale === 'en'">{{ station.name_en }}</div>
              <div class="station-name" v-else>{{ station.name }}</div>
              <div class="station-name-en" v-if="$i18n.locale === 'en'">{{ station.name }}</div>
              <div class="station-name-en" v-else>{{ station.name_en }}</div>
            </div>
          </div>
          </Transition>
        </div>
      </div>

      <div class="input-group">
        <label for="end">终点站：</label>
        <div class="input-with-suggestions end-input-container">
          <input
              type="text"
              id="end"
              v-model="endInput"
              @focus="handleEndFocus"
              @input="showEndSuggestions = true"
              placeholder="输入站名或英文站名"
              class="station-input"
              autocomplete="off"
          />
          <Transition name="suggestions">
          <div v-if="showEndSuggestions && filteredEndStations.length" class="suggestions">
            <div
                v-for="station in filteredEndStations"
                :key="station.id"
                @click="selectEndStation(station, $i18n.locale)"
                class="suggestion-item"
            >
              <div class="station-name" v-if="$i18n.locale === 'en'">{{ station.name_en }}</div>
              <div class="station-name" v-else>{{ station.name }}</div>
              <div class="station-name-en" v-if="$i18n.locale === 'en'">{{ station.name }}</div>
              <div class="station-name-en" v-else>{{ station.name_en }}</div>
            </div>
          </div>
          </Transition>
        </div>
      </div>

      <div class="button-group">
        <button
            @click="searchRoute"
            :disabled="isLoading || !startStationId || !endStationId"
            class="search-button"
            :class="{ loading: isLoading }"
        >
          <span v-if="isLoading" class="button-spinner" aria-hidden="true"></span>
          <span>{{ searchButtonLabel }}</span>
        </button>
        <button
            @click="showOptions = true"
            class="options-button"
            :disabled="isLoading"
        >
          高级选项
        </button>
      </div>
      <button type="button" class="transport-map-button" aria-label="在应用内查看交通地图" @click="showMap">
        <span class="map-entry-copy">
          <strong>打开交互式交通图</strong>
          <small>缩放、拖动并查看站点信息</small>
        </span>
        <span class="map-entry-art" aria-hidden="true">
          <i></i><i></i><i></i>
        </span>
      </button>
    </div>

    <div class="result" :class="{ 'is-loading': isLoading }">
      <Transition name="result-swap" mode="out-in">
      <div v-if="isLoading" key="loading" class="loading-state" aria-live="polite" aria-busy="true">
        <div class="loading-copy">
          <span class="loading-spinner" aria-hidden="true"></span>
          <h3>正在生成换乘方案</h3>
          <p>系统正在比对线路颜色、停靠站点和已禁用交通方式，请稍候片刻。</p>
        </div>

        <div class="loading-skeleton" aria-hidden="true">
          <div v-for="item in 4" :key="item" class="skeleton-row">
            <span class="skeleton-bar" :style="{ '--skeleton-width': item % 2 === 0 ? '62%' : '84%' }"></span>
          </div>
        </div>
      </div>

      <div v-else-if="routeResult" key="route-result" class="route-result-content">
        <h3>查询结果：</h3>
        <p v-if="routeResult.message">{{ routeResult.message }}</p>
        <p v-if="routeResult.error" class="error">{{ routeResult.error }}</p>
        <div v-if="routeResult.data" class="result-main route-timeline">
          <div
              v-for="(segment, seg) in routeResult.data.segments"
              :key="`${segment.lineName}-${seg}`"
              class="route-segment"
              :style="{ '--segment-color': normalizeColor(segment.color), '--segment-index': Math.min(seg, 6) }"
          >
            <div class="timeline-row node-row" v-if="seg===0">
              <div class="timeline-node" aria-hidden="true"></div>
              <span class="node_stations">{{ getStationName(segment.stationIds[0], $i18n.locale) }}</span>
            </div>
            <div class="timeline-row line-row">
              <div class="timeline-line" aria-hidden="true"></div>
              <h3 class="line_name">{{ $i18n.locale === 'en' ? segment.name_en : segment.lineName }}</h3>
            </div>
            <div
                v-for="(stationId, seq) in segment.stationIds"
                :key="`${segment.lineName}-${stationId}-${seq}`"
                class="route-station-step"
                :style="{ '--station-index': Math.min(seq, 12) }"
            >
              <div v-if="seq === segment.stationIds.length - 1" class="timeline-row node-row">
                <div class="timeline-node" aria-hidden="true"></div>
                <span class="node_stations">{{ getStationName(stationId, $i18n.locale) }}</span>
              </div>
              <div v-else-if="seq !== 0" class="timeline-row station-row">
                <div class="timeline-line" aria-hidden="true"></div>
                <span class="small_stations">{{ getStationName(stationId, $i18n.locale) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else key="placeholder" class="placeholder">
        <p>查询结果将显示在这里</p>
        <p>请选择始发站和终点站后点击查询按钮</p>
      </div>
      </Transition>
    </div>
  </div>

  <Transition name="options-modal">
  <div v-if="showOptions" class="options-popup-overlay" @click="closeOnOutsideClick">
    <div class="options-popup">
      <div class="popup-header">
        <h2>查询选项</h2>
        <button class="close-button" @click="closeOptions">&times;</button>
      </div>

      <div class="popup-content">
        <!-- 预设方案 -->
        <div class="options-section">
          <h3>预设方案</h3>
          <div class="preset-buttons">
            <button
                class="preset-button"
                @click="applyPreset('all')"
            >
              全部方案
            </button>
            <button
                class="preset-button"
                @click="applyPreset('rail')"
            >
              纯铁路方案
            </button>
            <button
                class="preset-button"
                @click="applyPreset('overworld')"
            >
              主世界方案
            </button>
          </div>
        </div>

        <!-- 启用交通方式 -->
        <div class="options-section">
          <h3>启用交通方式</h3>
          <div class="transport-checkboxes">
            <div v-for="type in transportTypes" :key="type.id" class="checkbox-item">
              <label class="checkbox-label">
                <input
                    type="checkbox"
                    :checked="!type.disabled"
                    @change="toggleTransportType(type.id)"
                    class="checkbox-input"
                />
                <span class="checkbox-custom"></span>
                <span class="checkbox-text">{{ type.name }}</span>
              </label>
            </div>
          </div>
        </div>

        <!-- 启用维度 -->
        <div class="options-section">
          <h3>启用维度</h3>
          <div class="dimension-checkboxes">
            <div v-for="dim in dimensionOptions" :key="dim.id" class="checkbox-item">
              <label class="checkbox-label">
                <input
                    type="checkbox"
                    :checked="!dim.disabled"
                    @change="toggleDimension(dim.id)"
                    class="checkbox-input"
                />
                <span class="checkbox-custom"></span>
                <span class="checkbox-text">{{ dim.name }}</span>
              </label>
            </div>
          </div>
        </div>

        <!-- 当前禁用状态提示 -->
        <div class="current-settings">
          <p v-if="getBannedTypes.length > 0">
            禁用交通方式: {{ getBannedTypes.map(t => transportTypes.find(tt => tt.int_name === t)?.name).join(', ') }}
          </p>
          <p v-if="getBannedDims.length > 0">
            禁用维度: {{ getBannedDims.map(d => dimensionOptions.find(dd => dd.id === d)?.name).join(', ') }}
          </p>
          <p v-if="getBannedTypes.length === 0 && getBannedDims.length === 0">
            当前不禁用任何交通方式和维度
          </p>
        </div>
      </div>

      <div class="popup-footer">
        <button class="apply-button" @click="closeOptions">应用选项</button>
      </div>
    </div>
  </div>
  </Transition>

  <Transition name="map-preview">
    <div
        v-if="showMapPreview"
        class="map-preview-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="map-preview-title"
        @click.self="closeMap"
    >
      <div class="map-preview-shell">
        <header class="map-preview-header">
          <div>
            <span>TRANSPORT NETWORK</span>
            <h2 id="map-preview-title">交通线路地图</h2>
          </div>
          <button type="button" class="map-close-button" aria-label="关闭地图" title="关闭地图" @click="closeMap">&times;</button>
        </header>
        <div class="map-preview-viewport">
          <InteractiveTransportMap
              :stations="stations"
              :route-station-ids="routeResult?.data?.stationIds || []"
              :route-segments="routeResult?.data?.segments || []"
              :start-station-id="startStationId"
              :end-station-id="endStationId"
              :route-loading="isLoading"
              :route-message="routeResult?.message || routeResult?.error || ''"
              @set-start="setMapStartStation"
              @set-end="setMapEndStation"
          />
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.title,
.container {
  --transport-surface: color-mix(in srgb, var(--background) 96%, var(--primary));
  --transport-line: color-mix(in srgb, var(--text-main) 13%, transparent);
  --transport-line-strong: color-mix(in srgb, var(--text-main) 24%, transparent);
  --transport-soft: color-mix(in srgb, var(--text-main) 4%, transparent);
  --transport-active: color-mix(in srgb, var(--primary) 12%, transparent);
}

:global(:root[data-theme='dark'] .title),
:global(:root[data-theme='dark'] .container) {
  --transport-surface: color-mix(in srgb, var(--background-secondary) 92%, var(--primary));
  --transport-line: color-mix(in srgb, var(--dark-text-primary) 18%, transparent);
  --transport-line-strong: color-mix(in srgb, var(--dark-text-primary) 26%, transparent);
  --transport-soft: color-mix(in srgb, var(--dark-text-primary) 7%, transparent);
}

.title {
  width: min(1280px, 100%);
  margin: 0 auto;
  padding: 0.75rem 1rem 0.75rem;
  box-sizing: border-box;
  animation: transport-title-in 520ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

h1 {
  margin: 0;
  color: var(--title-color);
  font-size: clamp(2rem, 5vw, 4.2rem);
  font-weight: 520;
  line-height: 1.08;
}

h2 {
  margin: 0.65rem 0 0;
  color: var(--text-secondary);
  font-size: clamp(1rem, 2vw, 1.25rem);
  font-weight: 400;
  line-height: 1.5;
}

.container {
  width: min(1280px, 100%);
  margin: 0 auto;
  padding: 0 1rem 0.75rem;
  box-sizing: border-box;
  display: grid;
  grid-template-columns: minmax(300px, 0.82fr) minmax(0, 1.45fr);
  align-items: stretch;
  gap: 1rem;
  min-height: 0;
  animation: transport-workspace-in 620ms cubic-bezier(0.22, 1, 0.36, 1) 80ms both;
}

.query,
.result {
  border: 1px solid var(--transport-line);
  background: var(--transport-surface);
  padding: 1rem;
  box-sizing: border-box;
}

.query {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-height: 100%;
}

.input-group {
  display: grid;
  gap: 0.45rem;
}

label {
  color: var(--text-main);
  font-weight: 700;
}

.input-with-suggestions {
  position: relative;
}

.station-input {
  width: 100%;
  padding: 0.82rem 0.9rem;
  border: 1px solid var(--transport-line);
  background: var(--background);
  color: var(--text-main);
  font-size: 1rem;
  box-sizing: border-box;
  transition:
      border-color 160ms ease,
      background-color 160ms ease;
}

.station-input:focus {
  outline: none;
  border-color: var(--primary);
  background: var(--transport-surface);
}

.suggestions {
  position: absolute;
  top: calc(100% + 0.35rem);
  left: 0;
  right: 0;
  z-index: 1000;
  max-height: 300px;
  overflow-y: auto;
  background: var(--background);
  border: 1px solid var(--transport-line-strong);
}

.suggestions-enter-active,
.suggestions-leave-active {
  transition: opacity 160ms ease, transform 160ms ease;
  transform-origin: top center;
}

.suggestions-enter-from,
.suggestions-leave-to {
  opacity: 0;
  transform: translateY(-6px) scaleY(0.98);
}

.suggestion-item {
  padding: 0.75rem 0.9rem;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  border-bottom: 1px solid var(--transport-line);
  transition: background-color 160ms ease;
}

.suggestion-item:last-child {
  border-bottom: none;
}

.suggestion-item:hover {
  background: var(--transport-active);
}

.station-name {
  color: var(--text-main);
  font-weight: 700;
}

.station-name-en {
  color: var(--text-secondary);
  font-size: 0.9rem;
  text-align: right;
}

.button-group {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.75rem;
}

.button-group button,
.preset-button,
.apply-button,
.close-button {
  border-radius: 0;
}

.button-group button {
  min-height: 46px;
  padding: 0 1rem;
  border: 1px solid var(--transport-line);
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition:
      background-color 160ms ease,
      color 160ms ease,
      border-color 160ms ease,
      opacity 160ms ease;
}

.search-button {
  color: var(--button-primary-text);
  background: var(--button-primary-bg);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
}

.options-button {
  color: var(--text-main);
  background: var(--background);
}

.search-button:hover:not(:disabled) {
  background: var(--button-primary-hover);
  transform: translateY(-1px);
}

.options-button:hover:not(:disabled) {
  border-color: var(--text-main);
  background: var(--transport-active);
  transform: translateY(-1px);
}

.button-group button:active:not(:disabled) {
  transform: translateY(0);
}

.button-group button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.button-spinner,
.loading-spinner {
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.button-spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid color-mix(in srgb, white 30%, transparent);
  border-top-color: white;
}

.transport-map-button {
  width: 100%;
  min-height: 132px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(110px, 0.72fr);
  align-items: center;
  gap: 1rem;
  margin-top: auto;
  padding: 1rem;
  border: 1px solid var(--transport-line);
  background: var(--transport-soft);
  overflow: hidden;
  cursor: pointer;
  text-align: left;
  color: var(--text-main);
  transition: border-color 180ms ease, background-color 180ms ease, transform 180ms ease;
}

.transport-map-button:hover {
  border-color: var(--primary);
  background: var(--transport-active);
  transform: translateY(-2px);
}

.map-entry-copy {
  min-width: 0;
  display: grid;
  gap: 0.35rem;
}

.map-entry-copy strong {
  color: var(--title-color);
  font-size: 1.05rem;
}

.map-entry-copy small {
  color: var(--text-secondary);
  line-height: 1.4;
}

.map-entry-art {
  position: relative;
  height: 64px;
}

.map-entry-art::before,
.map-entry-art::after {
  content: '';
  position: absolute;
  top: 30px;
  height: 4px;
  border-radius: 2px;
}

.map-entry-art::before {
  left: 4px;
  width: calc(50% - 4px);
  background: #e4002b;
}

.map-entry-art::after {
  left: 50%;
  right: 4px;
  background: #82bf25;
}

.map-entry-art i { position: absolute; top: 24px; width: 10px; height: 10px; border-radius: 50%; background: white; border: 2px solid #334155; z-index: 1; }
.map-entry-art i:nth-child(1) { left: 0; border-color: #e4002b; }
.map-entry-art i:nth-child(2) { left: calc(50% - 7px); width: 12px; height: 12px; top: 23px; border-color: #00629b; }
.map-entry-art i:nth-child(3) { right: 0; border-color: #82bf25; }

.result {
  display: flex;
  flex-direction: column;
  min-height: 34rem;
  overflow: hidden;
}

.result.is-loading {
  justify-content: center;
}

.result h3 {
  color: var(--title-color);
  margin-top: 0;
}

.placeholder,
.loading-state {
  min-height: 22rem;
}

.result-swap-enter-active,
.result-swap-leave-active {
  transition: opacity 220ms ease, transform 220ms ease;
}

.result-swap-enter-from {
  opacity: 0;
  transform: translateY(12px);
}

.result-swap-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.route-result-content {
  min-width: 0;
}

.placeholder {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: var(--text-secondary);
  text-align: center;
}

.placeholder p {
  margin: 0.35rem 0;
}

.loading-state {
  display: grid;
  gap: 1rem;
  align-content: center;
}

.loading-copy {
  display: grid;
  justify-items: center;
  text-align: center;
  gap: 0.45rem;
}

.loading-copy h3,
.loading-copy p {
  margin: 0;
}

.loading-copy p {
  color: var(--text-secondary);
}

.loading-spinner {
  width: 2.5rem;
  height: 2.5rem;
  border: 4px solid color-mix(in srgb, var(--primary) 16%, transparent);
  border-top-color: var(--primary);
}

.loading-skeleton {
  display: grid;
  gap: 0.75rem;
  padding: 1rem;
  border: 1px solid var(--transport-line);
  background: var(--transport-soft);
}

.skeleton-row {
  display: flex;
  align-items: center;
}

.skeleton-bar {
  width: var(--skeleton-width);
  height: 0.9rem;
  background: color-mix(in srgb, var(--text-main) 12%, transparent);
  animation: skeleton-pulse 1.15s ease-in-out infinite alternate;
}

.skeleton-row:nth-child(2) .skeleton-bar { animation-delay: 120ms; }
.skeleton-row:nth-child(3) .skeleton-bar { animation-delay: 240ms; }
.skeleton-row:nth-child(4) .skeleton-bar { animation-delay: 360ms; }

.error {
  color: var(--error);
}

.result-main {
  overflow: auto;
  max-height: 64vh;
  padding: 0.25rem 0 1rem;
}

.route-timeline {
  --timeline-track: 2rem;
  --timeline-line-width: 0.42rem;
  --timeline-node-size: 1.55rem;
  display: grid;
  align-content: start;
}

.route-segment {
  --segment-color: var(--primary);
  display: grid;
  position: relative;
  opacity: 0;
  animation: route-segment-in 420ms cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: calc(80ms + var(--segment-index, 0) * 130ms);
}

.route-segment::before {
  content: '';
  position: absolute;
  left: calc(var(--timeline-track) / 2 - var(--timeline-line-width) / 2);
  top: 0;
  bottom: calc(var(--timeline-node-size) / 2);
  width: var(--timeline-line-width);
  background: var(--segment-color);
  transform: scaleY(0);
  transform-origin: top center;
  animation: route-line-grow 560ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
  animation-delay: calc(150ms + var(--segment-index, 0) * 130ms);
}

.route-segment:first-child::before {
  top: calc(var(--timeline-node-size) / 2);
}

.timeline-row {
  display: grid;
  grid-template-columns: var(--timeline-track) minmax(0, 1fr);
  gap: 0.85rem;
  align-items: stretch;
  min-height: 1.75rem;
  position: relative;
}

.route-station-step {
  opacity: 0;
  transform: translateX(-8px);
  animation: route-station-in 320ms ease forwards;
  animation-delay: calc(180ms + var(--segment-index, 0) * 130ms + var(--station-index, 0) * 42ms);
}

.timeline-node,
.timeline-line {
  justify-self: center;
}

.timeline-line {
  width: var(--timeline-line-width);
  min-height: 100%;
  background: var(--segment-color);
  opacity: 0;
}

.line_name {
  align-self: center;
  font-weight: 700;
  margin: 0;
  padding: 0.2rem 0 0.45rem;
}

.small_stations {
  color: var(--text-secondary);
  font-weight: 400;
  padding: 0.16rem 0 0.35rem;
}

.node_stations {
  align-self: center;
  color: var(--text-main);
  font-weight: 700;
  font-size: 1.45rem;
  padding: 0.28rem 0;
}

.timeline-node {
  width: var(--timeline-node-size);
  height: var(--timeline-node-size);
  background-color: var(--background);
  border-radius: 50%;
  border: 0.35rem var(--segment-color) solid;
  z-index: 1;
  box-sizing: border-box;
  align-self: center;
  position: relative;
  animation: route-node-pop 360ms cubic-bezier(0.2, 0.9, 0.25, 1.25) both;
  animation-delay: calc(120ms + var(--segment-index, 0) * 130ms);
}

.timeline-node::before,
.timeline-node::after {
  display: none;
}

.options-popup-overlay {
  position: fixed;
  inset: 0;
  background: color-mix(in srgb, var(--background) 30%, rgba(0, 0, 0, 0.62));
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 1rem;
  box-sizing: border-box;
}

.options-modal-enter-active,
.options-modal-leave-active {
  transition: opacity 180ms ease;
}

.options-modal-enter-active .options-popup,
.options-modal-leave-active .options-popup {
  transition: transform 220ms cubic-bezier(0.22, 1, 0.36, 1), opacity 180ms ease;
}

.options-modal-enter-from,
.options-modal-leave-to {
  opacity: 0;
}

.options-modal-enter-from .options-popup,
.options-modal-leave-to .options-popup {
  opacity: 0;
  transform: translateY(16px) scale(0.98);
}

.options-popup {
  width: min(540px, 100%);
  max-height: 84vh;
  overflow-y: auto;
  background: var(--background);
  border: 1px solid var(--transport-line-strong);
}

.map-preview-overlay {
  position: fixed;
  inset: 0;
  z-index: 2100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding:
      max(0.75rem, env(safe-area-inset-top, 0px))
      max(0.75rem, env(safe-area-inset-right, 0px))
      max(0.75rem, env(safe-area-inset-bottom, 0px))
      max(0.75rem, env(safe-area-inset-left, 0px));
  box-sizing: border-box;
  background: color-mix(in srgb, var(--background) 18%, rgba(0, 0, 0, 0.84));
  backdrop-filter: blur(8px);
}

.map-preview-shell {
  width: min(1440px, 100%);
  height: min(92dvh, 980px);
  min-height: 0;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  background: var(--background);
  border: 1px solid var(--transport-line-strong);
}

.map-preview-header {
  min-height: 66px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--transport-line);
  box-sizing: border-box;
}

.map-preview-header > div {
  min-width: 0;
}

.map-preview-header span {
  display: block;
  margin-bottom: 0.2rem;
  color: var(--primary);
  font-size: 0.68rem;
  font-weight: 700;
}

.map-preview-header h2 {
  margin: 0;
  color: var(--title-color);
  font-size: 1.1rem;
  font-weight: 700;
  line-height: 1.2;
}

.map-close-button {
  width: 42px;
  height: 42px;
  flex: 0 0 auto;
  padding: 0;
  border: 1px solid var(--transport-line);
  background: transparent;
  color: var(--text-main);
  font-size: 1.7rem;
  line-height: 1;
  cursor: pointer;
}

.map-close-button:hover {
  color: var(--error);
  border-color: var(--error);
  background: color-mix(in srgb, var(--error) 7%, transparent);
}

.map-preview-viewport {
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  display: block;
  padding: 0;
  box-sizing: border-box;
  background: color-mix(in srgb, var(--text-main) 4%, var(--background));
  touch-action: none;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

.map-preview-enter-active,
.map-preview-leave-active {
  transition: opacity 180ms ease;
}

.map-preview-enter-active .map-preview-shell,
.map-preview-leave-active .map-preview-shell {
  transition: opacity 200ms ease, transform 240ms cubic-bezier(0.22, 1, 0.36, 1);
}

.map-preview-enter-from,
.map-preview-leave-to {
  opacity: 0;
}

.map-preview-enter-from .map-preview-shell,
.map-preview-leave-to .map-preview-shell {
  opacity: 0;
  transform: scale(0.975) translateY(12px);
}

.popup-header,
.popup-footer {
  padding: 1rem;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--transport-line);
}

.popup-header h2 {
  margin: 0;
  color: var(--title-color);
}

.close-button {
  width: 2.4rem;
  height: 2.4rem;
  border: 1px solid var(--transport-line);
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 1.6rem;
}

.close-button:hover {
  color: var(--error);
  border-color: var(--error);
}

.popup-content {
  padding: 1rem;
}

.options-section {
  margin-bottom: 1.25rem;
}

.options-section h3 {
  margin: 0 0 0.75rem;
  color: var(--title-color);
}

.preset-buttons,
.transport-checkboxes,
.dimension-checkboxes {
  display: grid;
  gap: 0.5rem;
}

.preset-buttons {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.transport-checkboxes,
.dimension-checkboxes {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.preset-button,
.apply-button {
  min-height: 38px;
  padding: 0 0.85rem;
  border: 1px solid var(--transport-line);
  background: var(--background);
  color: var(--text-main);
  cursor: pointer;
  font-weight: 700;
}

.preset-button:hover,
.apply-button:hover {
  border-color: var(--primary);
  background: var(--transport-active);
}

.checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 0.55rem;
  border: 1px solid var(--transport-line);
  gap: 0.65rem;
}

.checkbox-label:hover {
  background: var(--transport-active);
}

.checkbox-input {
  display: none;
}

.checkbox-custom {
  width: 1rem;
  height: 1rem;
  border: 1px solid var(--transport-line-strong);
  position: relative;
  flex: 0 0 auto;
  transition: background-color 150ms ease, border-color 150ms ease, transform 150ms ease;
}

.checkbox-input:checked + .checkbox-custom {
  background: var(--primary);
  border-color: var(--primary);
  transform: scale(1.06);
}

.checkbox-input:checked + .checkbox-custom::after {
  content: '';
  position: absolute;
  top: 1px;
  left: 4px;
  width: 4px;
  height: 8px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.checkbox-text {
  color: var(--text-main);
  font-size: 0.9rem;
}

.current-settings {
  margin-top: 1rem;
  padding: 0.85rem;
  background: var(--transport-soft);
  border: 1px solid var(--transport-line);
}

.current-settings p {
  margin: 0.25rem 0;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.popup-footer {
  text-align: right;
  border-top: 1px solid var(--transport-line);
}

button:focus-visible,
.station-input:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes transport-title-in {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes transport-workspace-in {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes skeleton-pulse {
  from { opacity: 0.38; transform: scaleX(0.96); transform-origin: left; }
  to { opacity: 0.9; transform: scaleX(1); transform-origin: left; }
}

@keyframes route-segment-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes route-line-grow {
  to { transform: scaleY(1); }
}

@keyframes route-station-in {
  to { opacity: 1; transform: translateX(0); }
}

@keyframes route-node-pop {
  from { opacity: 0; transform: scale(0.55); }
  to { opacity: 1; transform: scale(1); }
}

@media (min-width: 901px) {
  .container {
    min-height: 38rem;
  }

  .query,
  .result {
    min-height: 100%;
  }
}

@media (max-width: 900px) {
  .container {
    grid-template-columns: 1fr;
  }

  .result,
  .placeholder,
  .loading-state {
    min-height: 20rem;
  }
}

@media (max-width: 640px) {
  .title,
  .container {
    padding-left: 0.75rem;
    padding-right: 0.75rem;
  }

  .button-group,
  .preset-buttons,
  .transport-checkboxes,
  .dimension-checkboxes {
    grid-template-columns: 1fr;
  }

  .suggestion-item {
    align-items: flex-start;
    flex-direction: column;
  }

  .station-name-en {
    text-align: left;
  }

  .transport-map-button {
    min-height: 116px;
    grid-template-columns: minmax(0, 1fr) 96px;
    padding: 0.85rem;
  }

  .map-preview-overlay {
    padding: 0;
  }

  .map-preview-shell {
    width: 100%;
    height: 100dvh;
    border-left: 0;
    border-right: 0;
  }

  .map-preview-header {
    padding:
        max(0.65rem, env(safe-area-inset-top, 0px))
        max(0.75rem, env(safe-area-inset-right, 0px))
        0.65rem
        max(0.75rem, env(safe-area-inset-left, 0px));
  }

}

@media (max-width: 420px) {
  .title,
  .container {
    padding-left: 0.5rem;
    padding-right: 0.5rem;
  }

  .title {
    padding-top: 0.5rem;
    padding-bottom: 0.6rem;
  }

  h1 {
    font-size: 1.75rem;
    line-height: 1.12;
    overflow-wrap: anywhere;
  }

  h2 {
    margin-top: 0.45rem;
    font-size: 0.9rem;
    line-height: 1.4;
  }

  .container {
    gap: 0.65rem;
  }

  .query,
  .result {
    padding: 0.75rem;
  }

  .query {
    gap: 0.75rem;
  }

  .station-input {
    padding: 0.72rem 0.75rem;
    font-size: 0.95rem;
  }

  .button-group {
    gap: 0.5rem;
  }

  .button-group button {
    min-height: 42px;
    padding-inline: 0.75rem;
    font-size: 0.92rem;
  }

  .transport-map-button {
    min-height: 104px;
    grid-template-columns: minmax(0, 1fr) 72px;
    gap: 0.5rem;
    padding: 0.7rem;
  }

  .map-entry-copy strong {
    font-size: 0.96rem;
    overflow-wrap: anywhere;
  }

  .map-entry-copy small {
    font-size: 0.78rem;
  }

  .result,
  .placeholder,
  .loading-state {
    min-height: 16rem;
  }

  .route-timeline {
    --timeline-track: 1.65rem;
    --timeline-line-width: 0.34rem;
    --timeline-node-size: 1.3rem;
  }

  .timeline-row {
    gap: 0.55rem;
  }

  .node_stations {
    min-width: 0;
    font-size: 1.15rem;
    overflow-wrap: anywhere;
  }

  .line_name,
  .small_stations {
    min-width: 0;
    overflow-wrap: anywhere;
  }

  .options-popup-overlay {
    padding: 0;
  }

  .options-popup {
    width: 100%;
    max-height: 100dvh;
    min-height: 100dvh;
    border-left: 0;
    border-right: 0;
  }

  .popup-header,
  .popup-footer,
  .popup-content {
    padding: 0.75rem;
  }

  .map-preview-header {
    min-height: 54px;
    gap: 0.5rem;
  }

  .map-preview-header span {
    display: none;
  }

  .map-preview-header h2 {
    font-size: 0.95rem;
  }

  .map-close-button {
    width: 36px;
    height: 36px;
    font-size: 1.4rem;
  }
}

@media (max-width: 340px) {
  .title,
  .container {
    padding-left: 0.375rem;
    padding-right: 0.375rem;
  }

  h1 {
    font-size: 1.55rem;
  }

  .query,
  .result {
    padding: 0.625rem;
  }

  .transport-map-button {
    grid-template-columns: minmax(0, 1fr) 58px;
  }

  .map-entry-copy small {
    font-size: 0.72rem;
  }

  .suggestion-item {
    gap: 0.2rem;
    padding: 0.65rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .title,
  .container,
  .route-segment,
  .route-segment::before,
  .route-station-step,
  .timeline-node,
  .skeleton-bar {
    animation: none;
    opacity: 1;
    transform: none;
  }

  .suggestions-enter-active,
  .suggestions-leave-active,
  .result-swap-enter-active,
  .result-swap-leave-active,
  .options-modal-enter-active,
  .options-modal-leave-active,
  .options-modal-enter-active .options-popup,
  .options-modal-leave-active .options-popup {
    transition: none;
  }

  .transport-map-button:hover,
  .search-button:hover:not(:disabled),
  .options-button:hover:not(:disabled) {
    transform: none;
  }

  .map-preview-enter-active,
  .map-preview-leave-active,
  .map-preview-enter-active .map-preview-shell,
  .map-preview-leave-active .map-preview-shell {
    transition: none;
  }
}
</style>
