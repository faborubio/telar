import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

// Code splitting por ruta (SAD §9): lazy loading de las vistas.
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('../pages/HomePage.vue'),
    meta: { title: 'Inicio' },
  },
  {
    path: '/users',
    name: 'users',
    component: () => import('../pages/UsersPage.vue'),
    meta: { title: 'Usuarios' },
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('../pages/AboutPage.vue'),
    meta: { title: 'Acerca de' },
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})
