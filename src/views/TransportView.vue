<script setup>
import InteractiveTransportMap from '@/components/transport/InteractiveTransportMap.vue'
import { useTransportPlanner } from './useTransportPlanner.js'

const {
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
} = useTransportPlanner()
</script>

<template>
	<div class="title">
	<h1>{{ t('transportPage.title') }}</h1>
	<h2>{{ t('transportPage.description') }}</h2>
  </div>

  <div class="container">
    <div class="query">
      <div class="input-group">
		<label for="start">{{ t('transportPage.start') }}</label>
        <div class="input-with-suggestions start-input-container">
          <input
              type="text"
              id="start"
              v-model="startInput"
              @focus="handleStartFocus"
              @input="showStartSuggestions = true"
				:placeholder="t('transportPage.stationPlaceholder')"
              class="station-input"
              autocomplete="off"
          />
          <Transition name="suggestions">
          <div v-if="showStartSuggestions && filteredStartStations.length" class="suggestions">
            <div
                v-for="station in filteredStartStations"
                :key="station.id"
				@click="selectStartStation(station, locale)"
                class="suggestion-item"
            >
				<div class="station-name" v-if="locale === 'en'">{{ station.name_en }}</div>
				<div class="station-name" v-else>{{ station.name }}</div>
				<div class="station-name-en" v-if="locale === 'en'">{{ station.name }}</div>
              <div class="station-name-en" v-else>{{ station.name_en }}</div>
            </div>
          </div>
          </Transition>
        </div>
      </div>

      <div class="input-group">
		<label for="end">{{ t('transportPage.end') }}</label>
        <div class="input-with-suggestions end-input-container">
          <input
              type="text"
              id="end"
              v-model="endInput"
              @focus="handleEndFocus"
              @input="showEndSuggestions = true"
				:placeholder="t('transportPage.stationPlaceholder')"
              class="station-input"
              autocomplete="off"
          />
          <Transition name="suggestions">
          <div v-if="showEndSuggestions && filteredEndStations.length" class="suggestions">
            <div
                v-for="station in filteredEndStations"
                :key="station.id"
				@click="selectEndStation(station, locale)"
                class="suggestion-item"
            >
				<div class="station-name" v-if="locale === 'en'">{{ station.name_en }}</div>
              <div class="station-name" v-else>{{ station.name }}</div>
				<div class="station-name-en" v-if="locale === 'en'">{{ station.name }}</div>
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
			{{ t('transportPage.advanced') }}
        </button>
      </div>
	<button type="button" class="transport-map-button" :aria-label="t('transportPage.mapButton')" @click="showMap">
        <span class="map-entry-copy">
			<strong>{{ t('transportPage.openMap') }}</strong>
			<small>{{ t('transportPage.mapDescription') }}</small>
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
			<h3>{{ t('transportPage.planning') }}</h3>
			<p>{{ t('transportPage.planningDescription') }}</p>
        </div>

        <div class="loading-skeleton" aria-hidden="true">
          <div v-for="item in 4" :key="item" class="skeleton-row">
            <span class="skeleton-bar" :style="{ '--skeleton-width': item % 2 === 0 ? '62%' : '84%' }"></span>
          </div>
        </div>
      </div>

      <div v-else-if="routeResult" key="route-result" class="route-result-content">
		<h3>{{ t('mapPage.searchResult') }}</h3>
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
				<span class="node_stations">{{ getStationName(segment.stationIds[0], locale) }}</span>
            </div>
            <div class="timeline-row line-row">
              <div class="timeline-line" aria-hidden="true"></div>
				<h3 class="line_name">{{ locale === 'en' ? segment.name_en : segment.lineName }}</h3>
            </div>
            <div
                v-for="(stationId, seq) in segment.stationIds"
                :key="`${segment.lineName}-${stationId}-${seq}`"
                class="route-station-step"
                :style="{ '--station-index': Math.min(seq, 12) }"
            >
              <div v-if="seq === segment.stationIds.length - 1" class="timeline-row node-row">
                <div class="timeline-node" aria-hidden="true"></div>
					<span class="node_stations">{{ getStationName(stationId, locale) }}</span>
              </div>
              <div v-else-if="seq !== 0" class="timeline-row station-row">
                <div class="timeline-line" aria-hidden="true"></div>
					<span class="small_stations">{{ getStationName(stationId, locale) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else key="placeholder" class="placeholder">
		<p>{{ t('mapPage.resultPlaceholder') }}</p>
		<p>{{ t('mapPage.resultHint') }}</p>
      </div>
      </Transition>
    </div>
  </div>

  <Transition name="options-modal">
  <div v-if="showOptions" class="options-popup-overlay" @click="closeOnOutsideClick">
    <div class="options-popup">
      <div class="popup-header">
		<h2>{{ t('mapPage.optionsTitle') }}</h2>
		<button class="close-button" :aria-label="t('mapPage.close')" @click="closeOptions">&times;</button>
      </div>

      <div class="popup-content">
        <!-- 预设方案 -->
        <div class="options-section">
			<h3>{{ t('mapPage.presets') }}</h3>
          <div class="preset-buttons">
            <button
                class="preset-button"
                @click="applyPreset('all')"
            >
				{{ t('mapPage.allPresets') }}
            </button>
            <button
                class="preset-button"
                @click="applyPreset('rail')"
            >
				{{ t('mapPage.railPreset') }}
            </button>
            <button
                class="preset-button"
                @click="applyPreset('overworld')"
            >
				{{ t('mapPage.overworldPreset') }}
            </button>
          </div>
        </div>

        <!-- 启用交通方式 -->
        <div class="options-section">
			<h3>{{ t('mapPage.enabledTypes') }}</h3>
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
				<span class="checkbox-text">{{ t(type.nameKey) }}</span>
              </label>
            </div>
          </div>
        </div>

        <!-- 启用维度 -->
        <div class="options-section">
			<h3>{{ t('transportPage.enabledDimensions') }}</h3>
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
				<span class="checkbox-text">{{ t(dim.nameKey) }}</span>
              </label>
            </div>
          </div>
        </div>

        <!-- 当前禁用状态提示 -->
        <div class="current-settings">
          <p v-if="getBannedTypes.length > 0">
			{{ t('mapPage.disabledTypes', { types: getBannedTypes.map(type => t(transportTypes.find(tt => tt.int_name === type)?.nameKey)).join(', ') }) }}
          </p>
          <p v-if="getBannedDims.length > 0">
			{{ t('mapPage.disabledDimensions', { dimensions: getBannedDims.map(dimension => t(dimensionOptions.find(dd => dd.id === dimension)?.nameKey)).join(', ') }) }}
          </p>
          <p v-if="getBannedTypes.length === 0 && getBannedDims.length === 0">
			{{ t('mapPage.noDisabled') }}
          </p>
        </div>
      </div>

      <div class="popup-footer">
		<button class="apply-button" @click="closeOptions">{{ t('mapPage.applyOptions') }}</button>
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
			<span>{{ t('mapPage.network') }}</span>
		<h2 id="map-preview-title">{{ t('mapPage.mapTitle') }}</h2>
          </div>
		<button type="button" class="map-close-button" :aria-label="t('mapPage.closeMap')" :title="t('mapPage.closeMap')" @click="closeMap">&times;</button>
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

<style scoped src="./TransportView.styles-1.css"></style>
<style scoped src="./TransportView.styles-2.css"></style>
<style scoped src="./TransportView.styles-3.css"></style>
