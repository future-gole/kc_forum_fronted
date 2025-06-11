import axios from 'axios';

// --- Token 相关常量 ---
const ACCESS_TOKEN_KEY = 'token'; // localStorage 中存储 Access Token 的键名

// --- 创建 Axios 实例 ---
const request = axios.create({
  baseURL: 'http://localhost:58080', // 设置基础URL (建议使用环境变量)
  timeout: 10000, // 请求超时时间
  headers: {
    'Content-Type': 'application/json',
  },
  // 如果你的其他请求也需要携带 cookie，请保留/添加 withCredentials: true
  // withCredentials: true,
});

// --- 请求拦截器 ---
request.interceptors.request.use(
  config => {
    // 从 localStorage 获取 Access Token
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (accessToken) { // 仅当 accessToken 存在时才添加
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return config;
  },
  error => {
    // console.error('请求拦截器错误:', error); // 可以选择性保留日志
    return Promise.reject(error);
  }
);

// --- 响应拦截器 ---
request.interceptors.response.use(
  // --- 成功响应处理 (HTTP status 2xx) ---
  response => {
    const res = response.data; // 后端返回的数据

    // **主动续期：检查响应体中是否有新的 Access Token**
    if (res && res.newAccessToken) {
      const newAccessToken = res.newAccessToken;
      console.log('收到后端主动刷新的 Access Token (来自响应体)，更新本地存储...');
      localStorage.setItem(ACCESS_TOKEN_KEY, newAccessToken);
    }

    // 直接返回整个响应对象，或根据需要返回 response.data
    // 如果希望调用者直接拿到 data: return res;
    return response;
  },

  // --- 错误响应处理 (HTTP status 非 2xx) ---
  // 已移除所有复杂的错误处理逻辑，仅简单地将错误传递下去
  error => {
    // console.error('响应错误:', error.response || error.message); // 可以选择性保留日志
    return Promise.reject(error);
  }
);

export default request;