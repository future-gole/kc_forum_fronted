import axios from 'axios';
import { ElMessage } from 'element-plus';
import router from '@/router/index';
// --- Token 相关常量 ---
const ACCESS_TOKEN_KEY = 'token'; // localStorage 中存储 Access Token 的键名

const request = axios.create({
  baseURL: 'http://localhost:58080',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- 请求拦截器 ---
request.interceptors.request.use(
  config => {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// --- 响应拦截器 ---
request.interceptors.response.use(
  response => {
    const res = response.data;
    if (res && res.newAccessToken) {
      const newAccessToken = res.newAccessToken;
      console.log('收到后端主动刷新的 Access Token (来自响应体)，更新本地存储...');
      localStorage.setItem(ACCESS_TOKEN_KEY, newAccessToken);
    }
    return response;
  },
  error => {
    if (error.response && error.response.status === 401) {
      ElMessage.error("登录认证过期，即将跳转到登录页");
      localStorage.removeItem(ACCESS_TOKEN_KEY);

      // 获取当前路由信息，避免在登录页重复跳转或产生导航错误
      // Vue Router 4.x (Vue 3) 使用 router.currentRoute.value
      // Vue Router 3.x (Vue 2) 使用 router.currentRoute
      const currentPath = router.currentRoute.value ? router.currentRoute.value.path : window.location.pathname;
      const loginRouteNames = ['LoginMobile', 'LoginDesktop'];
      const isCurrentlyOnLoginPage = router.currentRoute.value && loginRouteNames.includes(router.currentRoute.value.name);


      if (!isCurrentlyOnLoginPage) {
        // 根据屏幕宽度判断跳转到哪个登录页
        // 确保您的 'LoginMobile' 和 'LoginDesktop' 路由已正确定义了 name 属性
        if (window.innerWidth < 768) {
          router.replace({ name: 'LoginMobile' }).catch(navigationError => {
            if (navigationError && navigationError.name !== 'NavigationDuplicated') {
               console.warn('导航到 LoginMobile 失败:', navigationError);
            }
          });
        } else {
          router.replace({ name: 'LoginDesktop' }).catch(navigationError => {
             if (navigationError && navigationError.name !== 'NavigationDuplicated') {
               console.warn('导航到 LoginDesktop 失败:', navigationError);
            }
          });
        }
      } else {
        console.log("已在登录页面或导航到登录页时发生错误，不重复跳转。");
      }
    }
    return Promise.reject(error);
  }
);

export default request;