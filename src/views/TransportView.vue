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

const fetchAllStations = async () => {
  try {
    const response = await fetch('https://api.qoriginal.vip/qo/transportation/station/all')
    const data = await response.json()
    stations.value = data
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

const selectStartStation = (station) => {
  startInput.value = station.name
  startStationId.value = station.id
  showStartSuggestions.value = false
}

const selectEndStation = (station) => {
  endInput.value = station.name
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
      banned_dims: [],
      banned_types: []
    }
    const response = await fetch('https://api.qoriginal.vip/qo/transportation/calculate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData)
    })
    const data = await response.json()
    routeResult.value = { message:"共 "+data.totalStops+" 站，用时约 "+data.totalTime+" 秒", data: data}
    if (data.result === "-1") {
      routeResult.value = { message: "未找到符合条件的路线" }
    } else {
      console.log('路线查询结果:', data)
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
</script>

<template>
  <div class="title">
    <h1>在这里查询交通路线</h1>
    <h2>含地铁、捷运、蓝冰船、城铁、下界交通、珍珠炮、飞机等</h2>
  </div>

  <div class="container">
    <div class="query">
      <div class="input-group">
        <label for="start">线路正在登记，不全或查不出请见谅！</label>
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
                @click="selectStartStation(station)"
                class="suggestion-item"
            >
              <div class="station-name">{{ station.name }}</div>
              <div class="station-name-en">{{ station.name_en }}</div>
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
                @click="selectEndStation(station)"
                class="suggestion-item"
            >
              <div class="station-name">{{ station.name }}</div>
              <div class="station-name-en">{{ station.name_en }}</div>
            </div>
          </div>
        </div>
      </div>

      <button
          @click="searchRoute"
          :disabled="isLoading || !startStationId || !endStationId"
          class="search-button"
      >
        {{ isLoading ? '查询中...' : '查询' }}
      </button>
    </div>

    <div class="result">
      <div v-if="routeResult">
        <h3>查询结果：</h3>
        <p v-if="routeResult.message">{{ routeResult.message }}</p>
        <p v-if="routeResult.error" class="error">{{ routeResult.error }}</p>
        <div v-if="routeResult.data" class="result-main">
          <div v-for="(segment, seg) in routeResult.data.segments">
            <div class="colored-segment" v-if="seg===0">
              <div class="concentric-circle-mask">&nbsp;</div>
              <span class="node_stations">{{stations.find(station => station.id === segment.stationIds[0]).name}}</span>
            </div>
            <div class="colored-segment"><div class="color-block" :style="{backgroundColor: '#'+segment.color}">&nbsp;</div><h3 class="line_name">{{segment.lineName}}</h3></div>
            <div v-for="(stationId, seq) in segment.stationIds" class="colored-segment">
              <div v-if="seq === segment.stationIds.length - 1" class="colored-segment">
                <div class="concentric-circle-mask">&nbsp;</div>
                <span class="node_stations">{{stations.find(station => station.id === stationId).name}}</span>
              </div>
              <div v-else-if="seq !== 0" class="colored-segment">
                <div class="color-block" :style="{backgroundColor: '#'+segment.color}">&nbsp;</div>
                <span class="small_stations">{{stations.find(station => station.id === stationId).name}}</span>
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

.search-button {
  padding: 0.75em 1.5em;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 1em;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.search-button:hover:not(:disabled) {
  background: var(--primary-dark);
}

.search-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.selected-info {
  padding: 0.5em;
  background: rgba(var(--primary), 0.1);
  border-radius: 5px;
  color: var(--text-secondary);
  font-size: 0.9em;
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