import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '../stores/auth'

// Code splitting por ruta (SAD §9): lazy loading de las vistas.
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('../pages/HomePage.vue'),
    meta: { title: 'Inicio', public: true },
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../pages/LoginPage.vue'),
    meta: { title: 'Iniciar sesión', public: true },
  },
  {
    path: '/users',
    name: 'users',
    component: () => import('../pages/UsersPage.vue'),
    meta: { title: 'Usuarios' },
  },
  {
    path: '/users/:id',
    name: 'user-detail',
    component: () => import('../pages/UserDetailPage.vue'),
    meta: { title: 'Editar usuario' },
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('../pages/AboutPage.vue'),
    meta: { title: 'Acerca de', public: true },
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Guard de autenticación: las rutas no públicas requieren sesión (flujo de login, SAD §7).
router.beforeEach((to) => {
  const auth = useAuthStore()
  if (!to.meta.public && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.name === 'login' && auth.isAuthenticated) {
    return { name: 'users' }
  }
  return true
})
