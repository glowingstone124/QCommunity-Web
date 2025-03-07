<script setup>
import { onMounted, ref } from 'vue';
import Redirect from '@/components/RedirectButton.vue';

const proxies = ref([]);
const isLoading = ref(true);
const error = ref(null);

const fetchProxies = async () => {
  try {
    const response = await fetch('https://api.qoriginal.vip/qo/proxies/status');
    if (!response.ok) {
      throw new Error('网络响应不正常');
    }
    const data = await response.json();
    proxies.value = data;
  } catch (err) {
    error.value = '无法获取代理列表，请稍后重试。';
    console.error('API 请求失败:', err);
  } finally {
    isLoading.value = false;
  }
};

const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text).then(() => {
    alert(`已复制: ${text}`);
  }).catch(err => {
    console.error('复制失败', err);
  });
};

onMounted(() => {
  fetchProxies();
});
</script>

<template>
  <div class="container">
    <div class="column">
      <h1>域名列表</h1>
      <h2>在这里找到所有的可用分布式连接，随便选择一个可用的来连接到 QuantumOriginal，单击复制到剪切板。</h2>
      <Redirect />
    </div>

    <div class="column">
      <div v-if="isLoading" class="loading">
        加载中...
      </div>

      <div v-if="error" class="error">
        {{ error }}
      </div>
      <div
          v-for="(proxy, index) in proxies"
          :key="'proxy-' + index"
          class="domain-item"
          :class="{ 'dead': proxy.stat === 'DEAD' }"
          @click="copyToClipboard(proxy.url)"
      >
        <p>{{ proxy.url }}</p>
        <span class="status" :class="{ 'alive': proxy.stat === 'ALIVE', 'dead': proxy.stat === 'DEAD' }">
          {{ proxy.stat === 'ALIVE' ? '可用' : '不可用' }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
h1, h2, p {
  color: #d4e7a9;
}

.container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 90%;
  margin: 0 auto;
  padding: 20px;
  background-color: #2a3a2a;
  border-radius: 8px;
}

.column {
  width: 100%;
  padding: 10px 0;
}

.domain-item {
  padding: 16px;
  margin: 8px 0;
  background-color: #394f39;
  border-radius: 30px;
  font-size: 18px;
  color: #d4e7a9;
  cursor: pointer;
  text-align: center;
  transition: background-color 0.3s ease, box-shadow 0.3s ease;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.domain-item:hover {
  background-color: #388d51;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.domain-item.dead {
  background-color: #5a3a3a;
  cursor: not-allowed;
}

.domain-item.dead:hover {
  background-color: #7a4a4a;
}

.status {
  font-size: 14px;
  margin-left: 10px;
}

.status.alive {
  color: #4caf50;
}

.status.dead {
  color: #ff4757;
}

.loading, .error {
  padding: 16px;
  margin: 8px 0;
  background-color: #394f39;
  border-radius: 30px;
  font-size: 18px;
  color: #d4e7a9;
  text-align: center;
}

.error {
  background-color: #ff4757;
}

@media (min-width: 768px) {
  .container {
    flex-direction: row;
    width: 70vw;
  }

  .column {
    flex: 1;
    padding: 0 10px;
  }
}
</style>