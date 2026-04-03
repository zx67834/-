<template>
  <v-app>
    <v-app-bar app elevation="0" class="top-bar">
      <div class="brand">
        <div class="brand-logo">
          <v-icon size="16" color="white">mdi-shield-check</v-icon>
        </div>
        <div class="brand-text">
          <div class="brand-title">示例科技</div>
          <div class="brand-subtitle">AI反诈助手平台（静态演示）</div>
        </div>
      </div>
      <v-spacer></v-spacer>
      <nav class="top-nav">
        <router-link :to="{ name: 'Home' }" :class="['tab-link', route.name === 'Home' ? 'active-tab' : '']">首页</router-link>
        <router-link :to="{ name: 'QuickStart' }" :class="['tab-link', route.name === 'QuickStart' ? 'active-tab' : '']">反诈检测</router-link>
        <router-link :to="{ name: 'KnowledgeBase' }" :class="['tab-link', route.name === 'KnowledgeBase' ? 'active-tab' : '']">知识科普</router-link>
        <router-link :to="{ name: 'SafetyReport' }" :class="['tab-link', route.name === 'SafetyReport' ? 'active-tab' : '']">安全中心</router-link>
        <router-link :to="{ name: 'AlertCenter' }" :class="['tab-link', route.name === 'AlertCenter' ? 'active-tab' : '']">预警中心</router-link>
        <router-link :to="{ name: 'GuardianManagement' }" :class="['tab-link', route.name === 'GuardianManagement' ? 'active-tab' : '']">监护人管理</router-link>
        <router-link :to="{ name: 'SystemSettings' }" :class="['tab-link', route.name === 'SystemSettings' ? 'active-tab' : '']">系统设置</router-link>
        <router-link :to="{ name: 'UserProfile' }" :class="['tab-link', route.name === 'UserProfile' ? 'active-tab' : '']">个人中心</router-link>
      </nav>
    </v-app-bar>

    <v-main class="compact-main">
      <router-view />
    </v-main>

    <AppFooter />
  </v-app>
</template>

<script setup>
import { useRoute } from 'vue-router'
import AppFooter from '@/components/AppFooter.vue'

const route = useRoute()
</script>

<style scoped>
.top-bar {
  background: #ffffff;
  border-bottom: 1px solid #e8edf7;
  padding: 0 12px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.brand-logo {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: linear-gradient(135deg, #4f8cff, #2f64f5);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 16px rgba(47, 100, 245, 0.3);
}

.brand-text {
  line-height: 1.1;
}

.brand-title {
  font-weight: 700;
  color: #1a2b53;
}

.brand-subtitle {
  font-size: 11px;
  color: #8b97b3;
}

.top-nav {
  display: flex;
  align-items: center;
  gap: 6px;
}

.tab-link {
  text-decoration: none;
  color: #4e5c7f;
  font-size: 14px;
  font-weight: 600;
  padding: 8px 16px;
  border-radius: 999px;
  transition: all 0.2s ease;
}

.tab-link:hover {
  background: #f2f5fd;
}

.active-tab {
  background: #dbe8ff;
  color: #2d63e8;
}

.compact-main {
  background: #f3f6fc;
}

.compact-main :deep(.v-container) {
  padding-top: 14px;
  padding-bottom: 18px;
}

.compact-main :deep(.v-row) {
  margin-bottom: 2px;
}

.compact-main :deep(h1.text-h4) {
  margin-bottom: 10px !important;
  color: #1e2f59;
  font-weight: 700;
}

.compact-main :deep(.text-body-1) {
  color: #6d7a9a;
}

.compact-main :deep(.v-card-title) {
  padding-top: 12px;
  padding-bottom: 8px;
}

.compact-main :deep(.v-card-text) {
  padding-top: 12px;
  padding-bottom: 12px;
}
</style>
