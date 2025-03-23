<script setup>
import { ref, onMounted } from 'vue';
import { alert } from '@pnotify/core';
import '@pnotify/core/dist/BrightTheme.css';

const loginStat = ref(false);
const hintMessage = ref("");
const fortuneData = ref(null);
const isLoading = ref(false);


onMounted(async () => {
  await validateToken();
  if (loginStat.value) {
    fetchFortune();
  }
});

async function validateToken() {
  if (!localStorage.getItem("token")) {
    showLoginPrompt();
    return false;
  }

  try {
    const response = await fetch("https://api.qoriginal.vip/qo/authorization/account", {
      headers: { "token": localStorage.getItem("token") }
    });
    const data = await response.json();

    if (data.error === 1 || data.error === 3) {
      showLoginPrompt();
      return false;
    }

    loginStat.value = true;
    return true;
  } catch (error) {
    alert({ type: 'error', text: '网络请求失败' });
    return false;
  }
}

function showLoginPrompt() {
  hintMessage.value = "请登录查看今日运势";
  loginStat.value = false;
}

async function fetchFortune() {
  isLoading.value = true;
  try {
    fortuneData.value = await fetch("https://api.qoriginal.vip/qo/authorization/fortune", {
      headers: { "token": localStorage.getItem("token") }
    }).then(response => response.json());
  } catch (error) {
    alert({ type: 'error', text: '获取运势失败' });
  } finally {
    isLoading.value = false;
  }
}

const getProgressColor = (amount) => {
  if (amount >= 80) return '#2ed573';
  if (amount >= 50) return '#ffa502';
  return '#ff4757';
};
</script>

<template>
  <div class="fortune-container">
    <div class="fortune-card">
      <h1 class="title">今日运势</h1>

      <div v-if="!loginStat" class="login-prompt">
        <div class="prompt-icon">🔒</div>
        <p class="prompt-text">{{ hintMessage }}</p>
        <router-link to="/login" class="login-button">
          立即登录
        </router-link>
      </div>

      <template v-else>
        <div v-if="isLoading" class="loading">
          <div class="spinner"></div>
          <p>正在获取今日运势...</p>
        </div>

        <div v-else-if="fortuneData" class="fortune-content">
          <div class="category-card">
            <div class="category-header">
              <span class="icon">💖</span>
              <h3>感情运势</h3>
            </div>
            <div class="progress-bar">
              <div
                  class="progress-fill"
                  :style="{
                  width: `${fortuneData.love.amount}%`,
                  backgroundColor: getProgressColor(fortuneData.love.amount)
                }"
              ></div>
              <span class="progress-text">{{ fortuneData.love.amount }}%</span>
            </div>
            <p class="comment">{{ fortuneData.love.comment }}</p>
          </div>

          <div class="category-card">
            <div class="category-header">
              <span class="icon">💼</span>
              <h3>事业运势</h3>
            </div>
            <div class="progress-bar">
              <div
                  class="progress-fill"
                  :style="{
                  width: `${fortuneData.career.amount}%`,
                  backgroundColor: getProgressColor(fortuneData.career.amount)
                }"
              ></div>
              <span class="progress-text">{{ fortuneData.career.amount }}%</span>
            </div>
            <p class="comment">{{ fortuneData.career.comment }}</p>
          </div>

          <div class="category-card">
            <div class="category-header">
              <span class="icon">💰</span>
              <h3>财富运势</h3>
            </div>
            <div class="progress-bar">
              <div
                  class="progress-fill"
                  :style="{
                  width: `${fortuneData.wealth.amount}%`,
                  backgroundColor: getProgressColor(fortuneData.wealth.amount)
                }"
              ></div>
              <span class="progress-text">{{ fortuneData.wealth.amount }}%</span>
            </div>
            <p class="comment">{{ fortuneData.wealth.comment }}</p>
          </div>

        </div>
        <button @click="fetchFortune" class="refresh-button">
          <svg viewBox="0 0 24 24" class="refresh-icon">
            <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
          </svg>
          刷新运势
        </button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.fortune-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.fortune-card {
  background: #2d2d2d;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.title {
  color: #89e88b;
  text-align: center;
  margin-bottom: 2rem;
  font-size: 2.5rem;
}

.login-prompt {
  text-align: center;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
}

.prompt-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.prompt-text {
  color: #e0e0e0;
  font-size: 1.2rem;
  margin-bottom: 1.5rem;
}

.login-button {
  display: inline-block;
  padding: 0.8rem 2rem;
  background: #4da153;
  color: white;
  border-radius: 8px;
  text-decoration: none;
  transition: background 0.3s;
}

.login-button:hover {
  background: #3bc72c;
}

.loading {
  text-align: center;
  padding: 2rem;
}

.spinner {
  width: 40px;
  height: 40px;
  margin: 0 auto 1rem;
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-top-color: #a9f33a;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.fortune-result {
  text-align: center;
}

.fortune-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.fortune-icon {
  font-size: 3rem;
}

.fortune-level {
  font-size: 2.5rem;
  margin: 0;
}

.fortune-message {
  white-space: pre-wrap;
  text-align: left;
  background: rgba(255, 255, 255, 0.05);
  padding: 1.5rem;
  border-radius: 8px;
  font-family: inherit;
  line-height: 1.6;
  color: #e0e0e0;
}

.refresh-button {
  margin-top: 2rem;
  padding: 0.8rem 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid #93f33a;
  color: #66b240;
  border-radius: 8px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s;
}

.refresh-button:hover {
  background: #516750;
  color: white;
}

.refresh-icon {
  width: 20px;
  height: 20px;
  fill: currentColor;
}

@media (max-width: 768px) {
  .fortune-container {
    padding: 1rem;
  }

  .fortune-card {
    padding: 1.5rem;
  }

  .title {
    font-size: 2rem;
  }

  .fortune-level {
    font-size: 2rem;
  }
}
.date {
  text-align: center;
  color: #89e88b;
  margin-bottom: 2rem;
  font-size: 1.2rem;
}

.fortune-content {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.category-card {
  background: #3d3d3d;
  padding: 1.5rem;
  border-radius: 12px;
  transition: transform 0.3s;
}

.category-card:hover {
  transform: translateY(-3px);
}

.category-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.category-header .icon {
  font-size: 1.8rem;
}

.progress-bar {
  height: 24px;
  background: #2d2d2d;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  margin: 1rem 0;
}

.progress-fill {
  height: 100%;
  transition: width 0.8s ease, background-color 0.3s;
}

.progress-text {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: white;
  font-weight: bold;
  mix-blend-mode: difference;
}

.comment {
  color: #e0e0e0;
  line-height: 1.6;
  margin: 0;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
}
</style>
