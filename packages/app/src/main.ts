import { createApp } from 'vue'
import { createPinia } from 'pinia'
// Estilos del DS (tokens + reset + base). El consumidor los importa explícitamente.
import '@telar/ds/styles.css'
import './styles/app.css'
import App from './App.vue'
import { router } from './router'

createApp(App).use(createPinia()).use(router).mount('#app')
