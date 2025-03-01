<template>
  <header class="app-header">
    <div class="header-content">
      <div class="logo-section">
        <h1 class="logo-text" @click="goHome">QCommunity</h1>
      </div>

      <div class="user-section">
        <div v-if="!loginstat" class="login-alert" @click="goToLogin">
          <span class="alert-icon">⚠️</span>
          <span class="alert-text">点击此处登录</span>
        </div>
        <div class="user-info">
          <span class="user-name">{{ username }}</span>
          <span class="user-role" v-if="loginstat">您已经游玩了{{ playtime }}分钟</span>
        </div>
        <div class="avatar-container">
          <img
              :src="avatarUrl"
              alt="User Avatar"
              class="user-avatar"
              @click="toggleUserMenu"
          >
          <p v-if="loginstat">前往账户中心</p>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import {get} from 'lodash'
import {ref, onMounted} from 'vue'
import {useRouter} from 'vue-router'

const router = useRouter()

const userName = ref('glowingstone124')
const avatarUrl = ref('https://example.com/avatar.jpg')

const username = ref(localStorage.getItem('username') || "");
const token = ref(localStorage.getItem('token') || "");
const password = ref('');
const loginstat = ref(false);
const playtime = ref(0);
onMounted(() => {
  if (username) {
    fetch("https://api.qoriginal.vip/qo/authorization/account", {
      headers: {
        "token": token.value
      }
    }).then(res => res.json())
        .then(data => {
          if (data.error === 3 || data.error === 1) {
            getAvatar("steve")
            loginstat.value = false
            userName.value = "未登录"
            return
          }
          loginstat.value = true
          username.value = data.username;
          playtime.value = data.playtime;
          getAvatar(data.username)
        });
  } else {
    userName.value = "未登录"
    getAvatar("steve")
  }
});

function getAvatar(name) {
  fetch("https://api.qoriginal.vip/qo/download/avatar?name=" + name).then(res => res.json())
      .then(data => {
        avatarUrl.value = data.url
      })

}

const goHome = () => {
  router.push('/')
}
const toggleUserMenu = () => {
  router.push('/account')
}
const goToLogin = () => {
  router.push('/login');
}
</script>

<style scoped>
.avatar-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  background: rgb(239, 236, 236);
  border-radius: 40px;
  padding: 1px;
  overflow: hidden;
  p {
    margin:0 5px;
    color: rgb(36, 37, 36);
  }
}

.app-header {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 60px;
  background-color: #64816c;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  margin: 0 auto;
  padding: 0 2rem;
}

.logo-section {
  cursor: pointer;
}

.logo-text {
  font-size: 24px;
  font-weight: bold;
  color: #d1d7dd;
  margin: 0;
}

.user-section {
  display: flex;
  align-items: center;
  gap: 15px;
}

.user-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.user-name {
  font-weight: 500;
  color: #f5f2f2;
}

.user-role {
  font-size: 0.8em;
  color: #e7e3e3;
}

.user-avatar {
  width: 40px;
  height: 40px;
  cursor: pointer;
  margin-right: 10px;
  border-radius: 50%;
  transition: transform 0.2s;
}

.user-avatar:hover {
  transform: scale(1.05);
}

@media (max-width: 768px) {
  .logo-text {
    font-size: 20px;
  }

  .user-name {
    display: none;
  }
}

.login-alert {
  background: #ff4757;
  color: white;
  padding: 8px 15px;
  border-radius: 20px;
  margin-right: 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s;
  animation: pulse 2s infinite;
}

.login-alert:hover {
  background: #ff6b81;
}

.alert-icon {
  font-size: 16px;
}

.alert-text {
  font-weight: 500;
  font-size: 0.95rem;
}

.unlogged {
  color: #ff4757 !important;
  font-weight: 600 !important;
}

.unlogged-avatar {
  border: 2px solid #ff4757 !important;
  filter: grayscale(0.5);
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

.user-section {
  gap: 20px;
}

.user-name {
  transition: color 0.3s;
}
</style>