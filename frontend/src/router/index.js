import { createRouter, createWebHistory } from 'vue-router'
import IntelligenceDashboard from '@/components/IntelligenceDashboard.vue'
import HelloWorld from '@/components/HelloWorld.vue'

// 导入新页面组件
const GuardianManagement = () => import('@/components/GuardianManagement.vue')
const AlertCenter = () => import('@/components/AlertCenter.vue')
const UserProfile = () => import('@/components/UserProfile.vue')
const SafetyReport = () => import('@/components/SafetyReport.vue')
const KnowledgeBase = () => import('@/components/KnowledgeBase.vue')
const SystemSettings = () => import('@/components/SystemSettings.vue')

// 导入布局组件
const UserLayout = () => import('@/layouts/UserLayout.vue')
const GuardianLayout = () => import('@/layouts/GuardianLayout.vue')

function getStoredUserType() {
  try {
    const isLoggedIn = localStorage.getItem('web_is_logged_in') === '1'
    if (!isLoggedIn) return null

    const accounts = JSON.parse(localStorage.getItem('web_user_accounts') || '[]')
    const activeIndex = Number(localStorage.getItem('web_active_user_account_index') || 0)
    const activeAccount = Array.isArray(accounts) ? (accounts[activeIndex] || accounts[0] || null) : null
    const userType = activeAccount?.userType
    const roleText = activeAccount?.role || ''

    if (userType === '监护人') return '监护人'
    if (userType === '用户') return '用户'
    if (typeof roleText === 'string' && roleText.includes('监护人')) return '监护人'
    return null
  } catch (error) {
    console.warn('读取本地用户类型失败:', error)
    return null
  }
}

const routes = [
  {
    path: '/',
    name: 'Home',
    redirect: () => {
      const userType = getStoredUserType()
      if (userType === '监护人') return '/guardian/dashboard'
      return '/user/dashboard'
    }
  },
  {
    path: '/quickstart',
    name: 'QuickStart',
    component: HelloWorld
  },
  // 用户端路由
  {
    path: '/user',
    name: 'UserLayout',
    component: UserLayout,
    children: [
      {
        path: 'dashboard',
        name: 'UserDashboard',
        component: IntelligenceDashboard
      },
      {
        path: 'alert',
        name: 'UserAlertCenter',
        component: AlertCenter
      },
      {
        path: 'profile',
        name: 'UserProfile',
        component: UserProfile
      },
      {
        path: 'report',
        name: 'UserSafetyReport',
        component: SafetyReport
      },
      {
        path: 'knowledge',
        name: 'UserKnowledgeBase',
        component: KnowledgeBase
      },
      {
        path: 'quickstart',
        name: 'UserQuickStart',
        component: HelloWorld
      },
      {
        path: 'settings',
        name: 'UserSettings',
        component: SystemSettings
      }
    ]
  },
  // 监护人端路由
  {
    path: '/guardian',
    name: 'GuardianLayout',
    component: GuardianLayout,
    children: [
      {
        path: 'dashboard',
        name: 'GuardianDashboard',
        component: IntelligenceDashboard
      },
      {
        path: 'management',
        name: 'GuardianManagement',
        component: GuardianManagement
      },
      {
        path: 'alert',
        name: 'GuardianAlertCenter',
        component: AlertCenter
      },
      {
        path: 'report',
        name: 'GuardianSafetyReport',
        component: SafetyReport
      },
      {
        path: 'knowledge',
        name: 'GuardianKnowledgeBase',
        component: KnowledgeBase
      },
      {
        path: 'quickstart',
        name: 'GuardianQuickStart',
        component: HelloWorld
      },
      {
        path: 'profile',
        name: 'GuardianProfile',
        component: UserProfile
      },
      {
        path: 'settings',
        name: 'GuardianSettings',
        component: SystemSettings
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

router.beforeEach((to) => {
  const userType = getStoredUserType()
  
  // 如果用户已登录
  if (userType) {
    const isGuardianRoute = to.path.startsWith('/guardian')
    const isUserRoute = to.path.startsWith('/user')

    // 已登录监护人不再进入用户端；普通用户同理。
    if (userType === '监护人' && isUserRoute) {
      return '/guardian/dashboard'
    }
    if (userType === '用户' && isGuardianRoute) {
      return '/user/dashboard'
    }

    // 访问首页时，按当前账号类型自动进入对应端。
    if (to.path === '/') {
      return userType === '监护人' ? '/guardian/dashboard' : '/user/dashboard'
    }
  } else {
    // 未登录：可浏览用户端各页面（首页、知识库等），不必困在个人中心
    if (to.path.startsWith('/guardian')) {
      return '/user/dashboard'
    }
  }

  return true
})

export default router