<template>
  <div class="container">
    <div :class="['sidebar', { 'sidebar-collapsed': !isMenuOpen }]">
      <button @click="toggleMenu" class="menu-toggle">
        <svg class="toggle-icon" viewBox="0 0 24 24">
          <path :d="isMenuOpen ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'"
                fill="none"
                stroke="currentColor"
                stroke-width="2"/>
        </svg>
      </button>
      <ul class="menu-list">
        <li
            v-for="item in menuItems"
            :key="item.name"
            @click="switchComponent(item.component)"
        >
          <span class="menu-icon" v-html="item.icon"></span>
          <span class="menu-text">{{ item.name }}</span>
        </li>
      </ul>
    </div>

    <div class="content">
      <component :is="activeComponent" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import FortuneComponent from "@/components/FortuneComponent.vue";

const isMenuOpen = ref(true);
const activeComponent = ref(FortuneComponent);

const menuItems = [
  {
    name: '今日运势',
    component: FortuneComponent,
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2a10 10 0 0110 10 10 10 0 01-10 10A10 10 0 012 12 10 10 0 0112 2z"/>
            <path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/>
          </svg>`
  },
];

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
};

const switchComponent = (component) => {
  activeComponent.value = component;
};
</script>

<style scoped>
.menu-icon {
  display: inline-block;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.menu-icon svg {
  width: 100%;
  height: 100%;
  vertical-align: top;
}

.menu-text {
  margin-left: 12px;
  opacity: 1;
  transition: opacity 0.2s;
}

.sidebar-collapsed .menu-text {
  opacity: 0;
  margin-left: 0;
}

.menu-list li {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}
.sidebar-collapsed .menu-text {
  display: none;
}

.sidebar {
  width: 240px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar-collapsed {
  width: 64px;
}

.sidebar-collapsed .menu-list li {
  justify-content: center;
  padding: 12px;
}

.toggle-icon {
  width: 24px;
  height: 24px;
  transition: transform 0.2s;
}
.container {
  display: flex;
  height: 100vh;
  background-color: #1a1a1a;
  color: #e0e0e0;
}

.sidebar {
  background-color: #2d2d2d;
  overflow: hidden;
}

.menu-toggle {
  width: 100%;
  padding: 16px;
  background-color: #3a6df3;
  color: #e0e0e0;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;
}

.menu-toggle:hover {
  background-color: #2c59c7;
}

.menu-list {
  padding: 8px 0;
}

.menu-list li:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

.content {
  flex: 1;
  padding: 24px;
  background-color: #242424;
  overflow-y: auto;
}

@media (max-width: 768px) {
  .sidebar {
    width: 64px;
  }

  .sidebar:not(.sidebar-collapsed) {
    width: 100%;
    position: absolute;
    height: 100%;
    z-index: 100;
    background-color: #2d2d2d;
  }

  .menu-toggle {
    padding: 12px;
  }
}
</style>