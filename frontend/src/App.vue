<template>
  <v-app>
    <router-view v-slot="{ Component }">
      <transition name="fade-slide">
        <component :is="Component" :key="layoutKey" />
      </transition>
    </router-view>
  </v-app>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
/** 用户端 / 监护人端切换时强制换根，避免与 transition 叠加产生空白帧 */
const layoutKey = computed(() => {
  if (route.path.startsWith('/guardian')) return 'layout-guardian'
  if (route.path.startsWith('/user')) return 'layout-user'
  return route.path || 'root'
})
</script>

<style>
/* 全局样式 */
html, body {
  margin: 0;
  padding: 0;
  font-family: 'Roboto', sans-serif;
}
</style>