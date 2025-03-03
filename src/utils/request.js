import axios from 'axios';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user'; // 假设使用 Pinia 存储用户状态

// 创建axios实例
const request = axios.create({
    baseURL: '/', // 设置基础URL
    timeout: 2000, // 请求超时时间
    headers: {
        'Content-Type': 'application/json', // 全局设置 Content-Type
    }
});

// 请求拦截器
request.interceptors.request.use(
  config => {
    // 从localStorage获取token
    const token = localStorage.getItem('token');
    if (token) {
      // 设置请求头
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// // 响应拦截器
// request.interceptors.response.use(
//   response => {
//     const res = response.data;
//
//     // 如果业务状态码不是200，则判断为错误
//     if (res.code !== 200) {
//       // 根据不同的错误码进行不同处理
//       switch (res.code) {
//         case 1001: // 未授权
//         case 1003: // 禁止访问
//           // 清除token并跳转到登录页
//           localStorage.removeItem('token');
//           // 如果使用了router，可以在这里跳转
//           // router.push('/login');
//           return Promise.reject(new Error(res.message || '未授权，请重新登录'));
//
//         case 1104: // 用户被禁言
//           return Promise.reject(new Error(res.message || '您已被禁言，请联系管理员'));
//
//         case 1005: // 资源不存在
//         case 1006: // 板块不存在
//         case 1102: // 用户不存在
//         case 3001: // 帖子不存在
//           return Promise.reject(new Error(res.message || '请求的资源不存在'));
//
//         case 2000: // 服务器内部错误
//           return Promise.reject(new Error('服务器内部错误，请稍后再试'));
//
//         default:
//           // 其他错误统一处理
//           return Promise.reject(new Error(res.message || '操作失败'));
//       }
//     } else {
//       // 业务状态码为200，直接返回数据
//       return res;
//     }
//   },
//   error => {
//     // 处理HTTP错误（非200响应状态码）
//     if (error.response) {
//       switch (error.response.status) {
//         case 401:
//           // 未授权，清除token并跳转到登录页
//           localStorage.removeItem('token');
//           // router.push('/login');
//           break;
//         case 403:
//           // 禁止访问
//           error.message = '禁止访问';
//           break;
//         case 404:
//           // 资源不存在
//           error.message = '请求的资源不存在';
//           break;
//         case 500:
//           // 服务器错误
//           error.message = '服务器内部错误';
//           break;
//         default:
//           error.message = '网络错误';
//       }
//     } else {
//       // 请求被取消或者网络问题
//       error.message = '网络连接失败，请检查您的网络';
//     }
//
//     // 可以在这里添加全局错误提示，例如使用Element Plus的Message组件
//     ElMessage.error(error.message);
//
//     return Promise.reject(error);
//   }
// );

export default request;