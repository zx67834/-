<template>
  <div class="layout-root">
    <v-app-bar app elevation="0" class="top-bar">
      <div class="brand">
        <div class="brand-logo">
          <img src="/favicon.ico" alt="favicon" class="brand-logo-image" />
        </div>
        <div class="brand-text">
          <div class="brand-title">智融反诈</div>
          <div class="brand-subtitle">前端页面 - 用户端</div>
        </div>
      </div>
      <v-spacer></v-spacer>
      <nav class="top-nav">
        <router-link :to="{ name: 'UserDashboard' }" :class="['tab-link', route.name === 'UserDashboard' ? 'active-tab' : '']">
          <img :src="navIcon('首页 (3).png', '首页 (2)blue..png', route.name === 'UserDashboard')" alt="首页" class="nav-icon-image" />
          <span>首页</span>
        </router-link>
        <router-link :to="{ name: 'UserQuickStart' }" :class="['tab-link', route.name === 'UserQuickStart' ? 'active-tab' : '']">
          <img :src="navIcon('数据检测-m.png', '数据检测-m (1)blue..png', route.name === 'UserQuickStart')" alt="反诈检测" class="nav-icon-image" />
          <span>反诈检测</span>
        </router-link>
        <router-link :to="{ name: 'UserAlertCenter' }" :class="['tab-link', route.name === 'UserAlertCenter' ? 'active-tab' : '']">
          <img :src="navIcon('预警 (2).png', '预警 (1)blue.png', route.name === 'UserAlertCenter')" alt="预警中心" class="nav-icon-image" />
          <span>预警中心</span>
        </router-link>
        <router-link :to="{ name: 'UserSafetyReport' }" :class="['tab-link', route.name === 'UserSafetyReport' ? 'active-tab' : '']">
          <img :src="navIcon('安全中心.png', '安全中心 (1)blue.png', route.name === 'UserSafetyReport')" alt="安全中心" class="nav-icon-image" />
          <span>安全中心</span>
        </router-link>
        <router-link :to="{ name: 'UserKnowledgeBase' }" :class="['tab-link', route.name === 'UserKnowledgeBase' ? 'active-tab' : '']">
          <img :src="navIcon('知识库 (3).png', '知识库 (4)blue.png', route.name === 'UserKnowledgeBase')" alt="知识科普" class="nav-icon-image" />
          <span>知识科普</span>
        </router-link>
        <router-link :to="{ name: 'UserProfile' }" :class="['tab-link', route.name === 'UserProfile' ? 'active-tab' : '']">
          <img :src="navIcon('个人 (4) (1).png', '个人 (4)blue.png', route.name === 'UserProfile')" alt="个人中心" class="nav-icon-image" />
          <span>个人中心</span>
        </router-link>
        <router-link :to="{ name: 'UserSettings' }" :class="['tab-link', route.name === 'UserSettings' ? 'active-tab' : '']">
          <img :src="navIcon('set-up-dot (1).png', 'set-up-dot (2)blue.png', route.name === 'UserSettings')" alt="系统设置" class="nav-icon-image" />
          <span>系统设置</span>
        </router-link>
      </nav>
    </v-app-bar>

    <v-main class="compact-main flex-grow-1">
      <router-view v-slot="{ Component }">
        <transition name="fade-slide">
          <component :is="Component" :key="route.name" />
        </transition>
      </router-view>
    </v-main>

    <AppFooter />
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'
import AppFooter from '@/components/AppFooter.vue'

const route = useRoute()
const NAV_ICON_BASE = '/Navigation Bar'

function navIcon(normalFileName, activeFileName, active) {
  const fileName = active ? activeFileName : normalFileName
  return `${NAV_ICON_BASE}/${encodeURIComponent(fileName)}`
}
</script>

<style scoped>
.layout-root {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.top-bar {
  background: #ffffff;
  border-bottom: 1px solid #e8edf7;
  padding: 0 20px;
  z-index: 1000;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-logo {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 16px rgba(15, 23, 42, 0.12);
  transition: transform 0.2s ease;
  overflow: hidden;
}

.brand-logo-image {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.brand-logo:hover {
  transform: scale(1.05);
}

.brand-text {
  line-height: 1.1;
}

.brand-title {
  font-weight: 700;
  color: #1a2b53;
  font-size: 18px;
}

.brand-subtitle {
  font-size: 12px;
  color: #8b97b3;
}

.top-nav {
  display: flex;
  align-items: center;
  gap: 4px;
}

.refresh-section {
  margin-left: 12px;
  display: flex;
  align-items: center;
}

.refresh-btn {
  border-radius: 12px !important;
  color: #64748b !important;
  background: #f8fafc !important;
  border: 1px solid #e2e8f0 !important;
  transition: all 0.2s ease;
}

.refresh-btn:hover {
  color: #3b82f6 !important;
  background: #eff6ff !important;
  border-color: #3b82f6 !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}

.rotating {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.tab-link {
  text-decoration: none;
  color: #4e5c7f;
  font-size: 14px;
  font-weight: 500;
  padding: 10px 16px;
  border-radius: 12px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.tab-link:hover {
  background: #f2f5fd;
  color: #2d63e8;
}

.active-tab {
  background: #dbe8ff;
  color: #2d63e8;
  font-weight: 600;
}

.nav-icon {
  transition: transform 0.2s ease;
}

.nav-icon-image {
  width: 16px;
  height: 16px;
  object-fit: contain;
  flex: 0 0 16px;
  transition: transform 0.2s ease;
}

.tab-link:hover .nav-icon,
.tab-link:hover .nav-icon-image {
  transform: scale(1.1);
}

.compact-main {
  background: #f3f6fc;
  min-height: calc(100vh - 64px - 60px);
}

.compact-main :deep(.v-container) {
  padding-top: 20px;
  padding-bottom: 24px;
}

.compact-main :deep(.v-row) {
  margin-bottom: 4px;
}

.compact-main :deep(h1.text-h4) {
  margin-bottom: 12px !important;
  color: #1e2f59;
  font-weight: 700;
}

.compact-main :deep(.text-body-1) {
  color: #6d7a9a;
}

.compact-main :deep(.v-card-title) {
  padding-top: 16px;
  padding-bottom: 10px;
}

.compact-main :deep(.v-card-text) {
  padding-top: 14px;
  padding-bottom: 14px;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@media (max-width: 1200px) {
  .top-nav {
    gap: 2px;
  }

  .tab-link {
    padding: 8px 12px;
    font-size: 13px;
  }
}

@media (max-width: 960px) {
  .top-bar {
    padding: 0 12px;
  }

  .brand-subtitle {
    display: none;
  }

  .top-nav {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    padding-bottom: 2px;
  }

  .top-nav::-webkit-scrollbar {
    display: none;
  }
}

@media (max-width: 600px) {
  .tab-link span {
    display: none;
  }

  .tab-link {
    padding: 10px 12px;
  }
}
</style>
