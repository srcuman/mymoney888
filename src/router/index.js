import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // ========== 核心模块 ==========
    {
      path: '/',
      name: 'home',
      component: () => import('../core/views/HomeView.vue'),
      meta: { requiresAuth: true, module: 'core' }
    },
    {
      path: '/accounts',
      name: 'accounts',
      component: () => import('../core/views/AccountsView.vue'),
      meta: { requiresAuth: true, module: 'core' }
    },
    {
      path: '/dimension-management',
      name: 'dimension-management',
      component: () => import('../core/views/DimensionManagementView.vue'),
      meta: { requiresAuth: true, module: 'core' }
    },

    // ========== 功能模块 ==========
    {
      path: '/statistics',
      name: 'statistics',
      component: () => import('../modules/statistics/StatisticsView.vue'),
      meta: { requiresAuth: true, module: 'statistics' }
    },
    {
      path: '/credit-cards',
      name: 'credit-cards',
      component: () => import('../modules/credit-cards/CreditCardsView.vue'),
      meta: { requiresAuth: true, module: 'credit-cards' }
    },
    {
      path: '/loans',
      name: 'loans',
      component: () => import('../modules/loans/LoansView.vue'),
      meta: { requiresAuth: true, module: 'loans' }
    },
    {
      path: '/investments',
      name: 'investments',
      component: () => import('../modules/investments/InvestmentsView.vue'),
      meta: { requiresAuth: true, module: 'investments' }
    },
    {
      path: '/annual-review',
      name: 'annual-review',
      component: () => import('../modules/annual-review/AnnualReviewView.vue'),
      meta: { requiresAuth: true, module: 'annual-review' }
    },
    {
      path: '/assets',
      name: 'assets',
      component: () => import('../modules/data/AssetsView.vue'),
      meta: { requiresAuth: true, module: 'data' }
    },
    {
      path: '/import-export',
      name: 'import-export',
      component: () => import('../modules/data/ImportExportView.vue'),
      meta: { requiresAuth: true, module: 'data' }
    },

    // ========== 系统模块 ==========
    {
      path: '/login',
      name: 'login',
      component: () => import('../system/LoginView.vue')
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../system/RegisterView.vue')
    },
    {
      path: '/user-management',
      name: 'user-management',
      component: () => import('../system/UserManagementView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/ledger-management',
      name: 'ledger-management',
      component: () => import('../system/LedgerManagementView.vue'),
      meta: { requiresAuth: true }
    }
  ]
})

router.beforeEach((to, from, next) => {
  const requiresAuth = to.meta.requiresAuth
  const user = localStorage.getItem('user')
  
  if (requiresAuth && !user) {
    next('/login')
  } else {
    next()
  }
})

export default router
