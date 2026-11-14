import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { buildOptionalAuthHeaders, parseTaRestrictedResponse } from '@/utils/taAccess.js'

export function useTransportPlanner() {
  const { t, locale } = useI18n()

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
    {id: 0, nameKey: 'mapPage.metro', int_name: 'METRO', disabled: false},
    {id: 1, nameKey: 'mapPage.rapid', int_name: 'RAPID', disabled: false},
    {id: 2, nameKey: 'mapPage.blueIce', int_name: 'BLUEICE', disabled: false},
    {id: 3, nameKey: 'mapPage.cityMetro', int_name: 'CITYMETRO', disabled: false},
    {id: 4, nameKey: 'mapPage.nether', int_name: 'NETHER', disabled: false},
    {id: 5, nameKey: 'mapPage.pearl', int_name: 'PEARL', disabled: false},
    {id: 6, nameKey: 'mapPage.airplane', int_name: 'AIRPLANE', disabled: false},
    {id: 7, nameKey: 'mapPage.boat', int_name: 'BOAT', disabled: false}
  ])
  // 维度选项
  const dimensionOptions = ref([
    {id: 'OVERWORLD', nameKey: 'mapPage.overworld', disabled: false},
    {id: 'NETHER', nameKey: 'mapPage.netherDimension', disabled: false},
    {id: 'THE_END', nameKey: 'mapPage.theEnd', disabled: false}
  ])

  const fetchAllStations = async () => {
    try {
      const response = await fetch('https://api.qoriginal.vip/qo/transportation/station/all', {
        headers: buildOptionalAuthHeaders(),
      })
      const data = await response.json().catch(() => ([]))
      const taGate = parseTaRestrictedResponse(response.status, data)
      if (taGate.restricted) {
        routeResult.value = {
          taRestricted: true,
          message: taGate.message || t('transportPage.taRestrictedFallback'),
        }
        return
      }
      if (Array.isArray(data)) {
        stations.value = data
      }
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
      routeResult.value = { error: t('transportPage.selectStations') }
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
        headers: buildOptionalAuthHeaders({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify(requestData)
      })
      const data = await response.json().catch(() => ({}))
      const taGate = parseTaRestrictedResponse(response.status, data)
      if (taGate.restricted) {
        routeResult.value = {
          taRestricted: true,
          message: taGate.message || t('transportPage.taRestrictedFallback'),
        }
        return
      }
      if (!response.ok) {
        routeResult.value = {error: data?.message || t('transportPage.noRoute')}
        return
      }
      routeResult.value = {message: t('transportPage.routeFound', { stops: data.totalStops, seconds: data.totalTime }), data: data}
      if (data.result === "-1") {
        routeResult.value = {message: t('transportPage.noRoute')}
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
    startInput.value = locale.value === 'en' ? (station.name_en || station.name) : (station.name || station.name_en)
    startStationId.value = station.id
    routeResult.value = null
    if (endStationId.value) await searchRoute()
  }

  const setMapEndStation = async (station) => {
    endInput.value = locale.value === 'en' ? (station.name_en || station.name) : (station.name || station.name_en)
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
      return t('transportPage.planning')
    }

  	return getBannedTypes.value.length + getBannedDims.value.length === 0 ? t('transportPage.query') : t('transportPage.advancedQuery')
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

  return {
    t,
    locale,
    stations,
    startInput,
    endInput,
    startStationId,
    endStationId,
    showStartSuggestions,
    showEndSuggestions,
    isLoading,
    routeResult,
    showOptions,
    showMapPreview,
    transportTypes,
    dimensionOptions,
    filteredStartStations,
    filteredEndStations,
    selectStartStation,
    selectEndStation,
    searchRoute,
    handleStartFocus,
    handleEndFocus,
    showMap,
    closeMap,
    setMapStartStation,
    setMapEndStation,
    toggleTransportType,
    toggleDimension,
    applyPreset,
    getBannedTypes,
    getBannedDims,
    searchButtonLabel,
    getStationName,
    normalizeColor,
    closeOptions,
    closeOnOutsideClick,
  }
}
