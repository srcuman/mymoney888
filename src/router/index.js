import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue')
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/RegisterView.vue')
    },
    {
      path: '/assets',
      name: 'assets',
      component: () => import('../views/AssetsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/accounts',
      name: 'accounts',
      component: () => import('../views/AccountsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/statistics',
      name: 'statistics',
      component: () => import('../views/StatisticsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/credit-cards',
      name: 'credit-cards',
      component: () => import('../views/CreditCardsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/loans',
      name: 'loans',
      component: () => import('../views/LoansView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/import-export',
      name: 'import-export',
      component: () => import('../views/ImportExportView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/annual-review',
      name: 'annual-review',
      component: () => import('../views/AnnualReviewView.vue'),
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