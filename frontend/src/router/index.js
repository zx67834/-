import { createRouter, createWebHistory } from 'vue-router'
import IntelligenceDashboard from '@/components/IntelligenceDashboard.vue'
import HelloWorld from '@/components/HelloWorld.vue'

// 导入新页面组件（稍后创建）
const GuardianManagement = () => import('@/components/GuardianManagement.vue')
const AlertCenter = () => import('@/components/AlertCenter.vue')
const UserProfile = () => import('@/components/UserProfile.vue')
const SafetyReport = () => import('@/components/SafetyReport.vue')
const KnowledgeBase = () => import('@/components/KnowledgeBase.vue')
const SystemSettings = () => import('@/components/SystemSettings.vue')

const routes = [
  {
    path: '/',
    name: 'Home',
    component: IntelligenceDashboard
  },
  {
    path: '/quickstart',
    name: 'QuickStart',
    component: HelloWorld
  },
  {
    path: '/guardian',
    name: 'GuardianManagement',
    component: GuardianManagement
  },
  {
    path: '/alert',
    name: 'AlertCenter',
    component: AlertCenter
  },
  {
    path: '/profile',
    name: 'UserProfile',
    component: UserProfile
  },
  {
    path: '/report',
    name: 'SafetyReport',
    component: SafetyReport
  },
  {
    path: '/knowledge',
    name: 'KnowledgeBase',
    component: KnowledgeBase
  },
  {
    path: '/settings',
    name: 'SystemSettings',
    component: SystemSettings
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router