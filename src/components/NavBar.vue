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
        <div class="user-info" v-if="loginstat">
          <span class="user-name">{{ username }}</span>
          <span class="user-role">您已经游玩了{{ playtime }}分钟</span>
        </div>
        <div class="avatar-container"   @click="toggleUserMenu">
          <img
              :src="avatarUrl"
              alt="User Avatar"
              class="user-avatar"
              @click="toggleUserMenu"
          >
          <p v-if="loginstat"   @click="toggleUserMenu">账户中心</p>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const username = ref(localStorage.getItem('username') || "")
const token = ref(localStorage.getItem('token') || "")
const loginstat = ref(false)
const playtime = ref(0)
const avatarUrl = ref('https://example.com/avatar.jpg')

onMounted(() => {
  if (username.value) {
    fetch("https://api.qoriginal.vip/qo/authorization/account", {
      headers: {
        "token": token.value
      }
    }).then(res => res.json())
        .then(data => {
          if (data.error === 3 || data.error === 1) {
            getAvatar("steve")
            loginstat.value = false
            username.value = "未登录"
            return
          }
          loginstat.value = true
          username.value = data.username
          playtime.value = data.playtime
          getAvatar(data.username)
        })
  } else {
    username.value = "未登录"
    getAvatar("steve")
  }
})

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
  router.push('/login')
}
</script>

<style scoped>
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
  padding: 0 1rem;
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
  gap: 10px;
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
  border-radius: 50%;
  transition: transform 0.2s;
}

.user-avatar:hover {
  transform: scale(1.05);
}

.avatar-container {
  display: flex;
  align-items: center;
  background: #1b6414;
  padding-right: 20px;
  border-radius: 30px;
  gap: 5px;
}

.avatar-container p {
  margin: 0;
  color: rgb(253, 253, 253);
  font-size: 0.9em;
}

.login-alert {
  background: #ff4757;
  color: white;
  padding: 8px 15px;
  border-radius: 20px;
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

@media (max-width: 768px) {
  .logo-text {
    font-size: 20px;
  }

  .user-info {
    display: none;
  }

  .avatar-container p {
    display: none;
  }

  .login-alert {
    padding: 6px 12px;
    font-size: 0.9em;
  }

  .user-avatar {
    width: 35px;
    height: 35px;
  }
}

@media (max-width: 480px) {
  .header-content {
    padding: 0 0.5rem;
  }

  .logo-text {
    font-size: 18px;
  }

  .login-alert {
    padding: 5px 10px;
    font-size: 0.8em;
  }

  .user-avatar {
    width: 30px;
    height: 30px;
  }
}
</style>