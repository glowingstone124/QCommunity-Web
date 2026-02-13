<script setup>
import {ref, computed, onUnmounted, onMounted} from 'vue'

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
  window.open('https://bucket.glowingstone.cn/metro.png')
}

onMounted(() => {
  document.addEventListener('click', closeSuggestionsOnClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', closeSuggestionsOnClickOutside)
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
        </div>
      </div>

      <div class="button-group">
        <button
            @click="searchRoute"
            :disabled="isLoading || !startStationId || !endStationId"
            class="search-button"
        >
          {{ isLoading ? '查询中...' : ( getBannedTypes.length + getBannedDims.length === 0 ? '查询' : '高级查询') }}
        </button>
        <button
            @click="showOptions = true"
            class="options-button"
        >
          高级选项
        </button>
      </div>
      <img src="https://bucket.glowingstone.cn/metro.png" alt="单击查看大图" @click="showMap" class="transport-map"/>
    </div>

    <div class="result">
      <div v-if="routeResult">
        <h3>查询结果：</h3>
        <p v-if="routeResult.message">{{ routeResult.message }}</p>
        <p v-if="routeResult.error" class="error">{{ routeResult.error }}</p>
        <p class="error">【运营提示】2号线竞技场站因结构升级封站</p>
        <div v-if="routeResult.data" class="result-main">
          <div v-for="(segment, seg) in routeResult.data.segments">
            <div class="colored-segment" v-if="seg===0">
              <div class="concentric-circle-mask">&nbsp;</div>
              <span class="node_stations"
                    v-if="$i18n.locale === 'en'">{{
                  stations.find(station => station.id === segment.stationIds[0]).name_en
                }}</span>
              <span class="node_stations"
                    v-else>{{ stations.find(station => station.id === segment.stationIds[0]).name }}</span>
            </div>
            <div class="colored-segment">
              <div class="color-block" :style="{backgroundColor: '#'+segment.color}">&nbsp;</div>
              <h3 class="line_name">{{ $i18n.locale === 'en' ? segment.name_en : segment.lineName }}</h3></div>
            <div v-for="(stationId, seq) in segment.stationIds" class="colored-segment">
              <div v-if="seq === segment.stationIds.length - 1" class="colored-segment">
                <div class="concentric-circle-mask">&nbsp;</div>
                <span class="node_stations"
                      v-if="$i18n.locale === 'en'">{{
                    stations.find(station => station.id === stationId).name_en
                  }}</span>
                <span class="node_stations" v-else>{{ stations.find(station => station.id === stationId).name }}</span>
              </div>
              <div v-else-if="seq !== 0" class="colored-segment">
                <div class="color-block" :style="{backgroundColor: '#'+segment.color}">&nbsp;</div>
                <span class="small_stations"
                      v-if="$i18n.locale === 'en'">{{
                    stations.find(station => station.id === stationId).name_en
                  }}</span>
                <span class="small_stations" v-else>{{ stations.find(station => station.id === stationId).name }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="placeholder">
        <p>查询结果将显示在这里</p>
        <p>请选择始发站和终点站后点击查询按钮</p>
      </div>
    </div>
  </div>

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
</template>

<style scoped>
@import url("@/assets/main.css");

.title {
  padding-left: 2em;
  padding-bottom: 2em;
}

h1 {
  color: var(--text);
  font-weight: 500;
  margin-block-end: 0;
  font-size: xxx-large;
}

h2 {
  color: var(--text);
  font-weight: 200;
  margin-block-start: 0;
}

.container {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 2em;
  padding: 0 2em;
  min-height: 60vh;
}

.query, .result {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  padding: 1.5em;
}

.query {
  display: flex;
  flex-direction: column;
  gap: 1.5em;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5em;
}

label {
  color: var(--text);
  font-weight: 500;
}

.input-with-suggestions {
  position: relative;
}

.station-input {
  width: 80%;
  padding: 0.8em 1.25em;
  border: 1px solid black;
  border-radius: 1em;
  background: var(--background-secondary);
  color: var(--text);
  font-size: 1em;
}

.station-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(var(--primary), 0.1);
}

.suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--background-secondary);
  border: 1px solid black;
  border-radius: 5px;
  margin-top: 0.25em;
  max-height: 300px;
  overflow-y: auto;
  z-index: 1000;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.suggestion-item {
  padding: 0.75em 1em;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background-color 0.2s;
}

.suggestion-item:hover {
  background-color: rgba(var(--primary), 0.1);
}

.station-name {
  color: var(--text);
  font-weight: 500;
}

.station-name-en {
  color: var(--text-secondary);
  font-size: 0.9em;
}

.button-group {
  display: flex;
  gap: 1em;
  align-items: center;
}

.button-group button {
  padding: 0.5em 0;
  border-radius: 5px;
  font-size: 1.1em;
  font-weight: 500;
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
  color: var(--dark-bg);
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

.result pre {
  background: var(--background-secondary);
  padding: 1em;
  border-radius: 5px;
  overflow-x: auto;
  color: var(--text);
  flex-grow: 1;
  margin: 0;
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
  margin: 0.5em 0;
}

.error {
  color: var(--error);
}

.colored-segment {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  gap: 1em;
  margin-block: -0.5px;
}

.color-block {
  display: block;
  width: 0.5em;
  margin-left: 1.05em;
}

.line_name {
  font-weight: 500;
  margin-block-end: 0.3em;
}

.small_stations {
  font-weight: 200;
  padding: 1px 2px 4px 2px;
}

.node_stations {
  font-weight: 500;
  font-size: 1.6em;
  vertical-align: middle;
}

.concentric-circle-mask {
  width: 1.8em;
  height: 1.8em;
  background-color: white;
  border-radius: 50%;
  border: 0.4em var(--primary) solid;
  z-index: 1;
}

.result-main {
  overflow: auto;
  max-height: 50vh;
  padding-bottom: 5em;
  padding-top: 1px;
}

.transport-map {
  width: 100%;
  cursor: pointer;
}

.options-popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.options-popup {
  background: var(--background);
  border-radius: 10px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5em;
}

.popup-header h2 {
  margin: 0;
  color: var(--text);
}

.close-button {
  background: none;
  border: none;
  font-size: 2em;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.close-button:hover {
  background: var(--background-secondary);
  color: lightcoral;
}

.popup-content {
  padding: 1.5em;
}

.options-section {
  margin-bottom: 1.5em;
}

.options-section h3 {
  margin-top: 0;
  margin-bottom: 0.75em;
  color: var(--text);
  font-weight: 500;
}

.preset-buttons {
  display: flex;
  gap: 1em;
  flex-wrap: wrap;
}

.preset-button {
  padding: 0.5em 1em;
  background: var(--button-primary-bg);
  color: var(--text);
  border-radius: 5px;
  font-size: 0.9em;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.preset-button:hover {
  border-color: var(--primary);
  background: var(--button-primary-hover);
}

.transport-checkboxes,
.dimension-checkboxes {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5em;
}

@media (max-width: 480px) {
  .transport-checkboxes {
    grid-template-columns: 1fr;
  }
}

.checkbox-item {
  margin-bottom: 0.25em;
}

.checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 0.5em;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.checkbox-label:hover {
  background: var(--background-secondary);
}

.checkbox-input {
  display: none;
}

.checkbox-custom {
  width: 18px;
  height: 18px;
  border-radius: 3px;
  margin-right: 0.75em;
  position: relative;
  transition: all 0.2s;
}

.checkbox-input:checked + .checkbox-custom {
  background: var(--primary);
  border-color: var(--primary);
}

.checkbox-input:checked + .checkbox-custom::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 5px;
  width: 5px;
  height: 10px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.checkbox-text {
  color: var(--text);
  font-size: 0.9em;
}

.current-settings {
  margin-top: 1.5em;
  padding: 1em;
  background: var(--background-secondary);
  border-radius: 5px;
}

.current-settings p {
  margin: 0.25em 0;
  font-size: 0.85em;
  color: var(--text-secondary);
}

.popup-footer {
  padding: 1.5em;
  text-align: right;
}

.apply-button {
  padding: 0.5em 1.5em;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 0.9em;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.apply-button:hover {
  background: var(--primary-dark);
}

@media (max-width: 768px) {
  .container {
    grid-template-columns: 1fr;
    padding: 0 1em;
  }

  .title {
    padding-left: 1em;
  }

  h1 {
    font-size: xx-large;
  }

  h2 {
    font-size: large;
  }
}
</style>