import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import '@fortawesome/fontawesome-free/css/all.min.css'
import App from './App.vue'
import router from './router'
// 导入全局响应式样式
import './assets/responsive.css'


const pinia = createPinia();
const app = createApp(App)
app.use(createPinia())
app.use(pinia)
app.use(ElementPlus)
app.use(router)
app.mount('#app')