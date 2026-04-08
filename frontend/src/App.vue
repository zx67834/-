<template>
  <v-app>
    <v-app-bar app elevation="0" class="top-bar">
      <div class="brand">
        <div class="brand-logo">
          <v-icon size="16" color="white">mdi-shield-check</v-icon>
        </div>
        <div class="brand-text">
          <div class="brand-title">示例科技</div>
          <div class="brand-subtitle">AI反诈助手平台</div>
        </div>
      </div>
      <v-spacer></v-spacer>
      <nav class="top-nav">
        <router-link :to="{ name: 'Home' }" :class="['tab-link', route.name === 'Home' ? 'active-tab' : '']">
          <v-icon size="small" class="nav-icon">mdi-home</v-icon>
          <span>首页</span>
        </router-link>
        <router-link :to="{ name: 'QuickStart' }" :class="['tab-link', route.name === 'QuickStart' ? 'active-tab' : '']">
          <v-icon size="small" class="nav-icon">mdi-shield-alert</v-icon>
          <span>反诈检测</span>
        </router-link>
        <router-link :to="{ name: 'KnowledgeBase' }" :class="['tab-link', route.name === 'KnowledgeBase' ? 'active-tab' : '']">
          <v-icon size="small" class="nav-icon">mdi-book-open</v-icon>
          <span>知识科普</span>
        </router-link>
        <router-link :to="{ name: 'SafetyReport' }" :class="['tab-link', route.name === 'SafetyReport' ? 'active-tab' : '']">
          <v-icon size="small" class="nav-icon">mdi-shield-check</v-icon>
          <span>安全中心</span>
        </router-link>
        <router-link :to="{ name: 'AlertCenter' }" :class="['tab-link', route.name === 'AlertCenter' ? 'active-tab' : '']">
          <v-icon size="small" class="nav-icon">mdi-bell</v-icon>
          <span>预警中心</span>
        </router-link>
        <router-link :to="{ name: 'GuardianManagement' }" :class="['tab-link', route.name === 'GuardianManagement' ? 'active-tab' : '']">
          <v-icon size="small" class="nav-icon">mdi-account-group</v-icon>
          <span>监护人管理</span>
        </router-link>
        <router-link :to="{ name: 'SystemSettings' }" :class="['tab-link', route.name === 'SystemSettings' ? 'active-tab' : '']">
          <v-icon size="small" class="nav-icon">mdi-cog</v-icon>
          <span>系统设置</span>
        </router-link>
        <router-link :to="{ name: 'UserProfile' }" :class="['tab-link', route.name === 'UserProfile' ? 'active-tab' : '']">
          <v-icon size="small" class="nav-icon">mdi-account</v-icon>
          <span>个人中心</span>
        </router-link>
      </nav>
    </v-app-bar>

    <v-main class="compact-main">
      <router-view v-slot="{ Component }">
        <transition name="fade-slide" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
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
  background: linear-gradient(135deg, #4f8cff, #2f64f5);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 16px rgba(47, 100, 245, 0.25);
  transition: transform 0.2s ease;
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

.tab-link:hover .nav-icon {
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
