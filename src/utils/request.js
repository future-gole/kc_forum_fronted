import axios from 'axios';
import { ElMessage } from 'element-plus'; // 引入 Element Plus 消息提示

// --- Token 相关常量 ---
const ACCESS_TOKEN_KEY = 'token'; // localStorage 中存储 Access Token 的键名

// --- 全局状态，用于处理并发刷新请求 ---
let isRefreshing = false; // 标记是否正在刷新 Token
let failedQueue = []; // 存储因 Token 过期而失败的请求队列 { resolve, reject }

/**
 * 处理等待队列中的请求
 * @param {Error | null} error 刷新失败时的错误信息，成功则为 null
 * @param {string | null} token 新的 Access Token，刷新失败则为 null
 */
const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error); // 刷新失败，拒绝队列中的请求
    } else {
      prom.resolve(token); // 刷新成功，用新 Token 解决队列中的 Promise
    }
  });
  failedQueue = []; // 清空队列
};

// --- 创建 Axios 实例 ---
const request = axios.create({
  baseURL: 'http://localhost:58080', // 设置基础URL (建议使用环境变量)
  timeout: 10000, // 请求超时时间 (原 3000 可能较短，建议增加)
  headers: {
    'Content-Type': 'application/json',
  },
  // !! 关键：允许跨域请求携带 Cookie (用于刷新 Refresh Token) !!
  withCredentials: true,
});

// --- 请求拦截器 ---
request.interceptors.request.use(
  config => {
    // 从 localStorage 获取 Access Token
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    // 仅在 Token 存在且请求的不是刷新接口时添加 Header
    if (accessToken && config.url !== '/api/token/refresh') {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return config;
  },
  error => {
    console.error('请求拦截器错误:', error);
    return Promise.reject(error);
  }
);

// --- 响应拦截器 ---
request.interceptors.response.use(
  // --- 成功响应处理 (HTTP status 2xx) ---
  response => {
    const res = response.data; // 后端返回的 Result 对象 { code, message, data?, newAccessToken? }

    // **主动续期：检查响应体中是否有新的 Access Token**
    if (res && res.newAccessToken) {
      const newAccessToken = res.newAccessToken;
      console.log('收到后端主动刷新的 Access Token (来自响应体)，更新本地存储...');
      localStorage.setItem(ACCESS_TOKEN_KEY, newAccessToken);
    }

    // **处理业务状态码**
    if (res && typeof res.code !== 'undefined') {
      if (res.code === 200) { // ResultCode.SUCCESS.code
        // 操作成功，返回核心业务数据 data (如果存在)，否则返回整个 Result 对象
        // 这样业务代码可以直接 .then(data => ...)
        return response;
      } else {
        // 后端返回了业务错误码 (非 200)
        console.warn('后端业务错误:', res);
        ElMessage.error(res.message || '操作失败');
        // 根据需要，可以根据不同的 code 做特定处理，但通常直接拒绝 Promise
        // 例如，如果是特定需要跳转登录的业务码 (非 401 过期)
        // if (res.code === SOME_SPECIFIC_CODE) {
        //   localStorage.removeItem(ACCESS_TOKEN_KEY);
        //   // router.push('/login');
        // }
        return Promise.reject(new Error(res.message || '操作失败')); // 返回 Error 对象
      }
    } else {
      // 如果后端响应没有 code 字段 (不规范)，则直接返回数据
      console.warn('后端响应缺少 code 字段:', response);
      return response;
    }
  },

  // --- 错误响应处理 (HTTP status 非 2xx) ---
  async error => { // 使用 async 以便在内部使用 await
    const originalRequest = error.config; // 获取原始请求配置

    // 处理网络错误或请求取消等非 response 错误
    if (!error.response) {
      console.error('网络错误或请求已取消:', error.message);
      if (!axios.isCancel(error)) {
          ElMessage.error(error.message || '网络错误，请检查连接');
      }
      return Promise.reject(error);
    }

    const status = error.response.status; // HTTP 状态码
    const data = error.response.data || {}; // 后端返回的 Result 对象 { code, message, data? }
    const errorMessage = data.message || error.message || '未知错误'; // 获取错误消息
    const errorCode = data.code; // 获取后端的业务错误码

    // --- 核心：处理 401 Unauthorized ---
    if (status === 401) {
      // **条件 1: 判断是否是 Access Token 过期**
      //    优先使用特定错误码，其次依赖消息文本
      const isAccessTokenExpired = errorMessage.includes('访问令牌已过期'); // 或者 errorCode === YOUR_EXPIRED_CODE
      // const isRefreshTokenInvalid = errorCode === 1009; // FAIL_REFRESH_TOKEN

      // **条件 2: 检查是否正在刷新 Token**
      if (isAccessTokenExpired && !isRefreshing) {
        // **不需要检查本地 Refresh Token，因为它在 HttpOnly Cookie 中**

        isRefreshing = true;
        originalRequest._retry = true; // 标记此请求已尝试过重试
        console.log('Access Token 过期，尝试通过 Cookie 刷新...');

        try {
          // **步骤 1: 调用刷新接口**
          const refreshResponse = await axios.post(
            `${request.defaults.baseURL}/api/token/refresh`,
            {}, // 请求体为空
            {
              withCredentials: true, // !! 必须携带 Cookie !!
              timeout: 8000
            }
          );

          // **步骤 2: 刷新成功**
          // !! 从刷新接口的响应体 data 字段获取新 Access Token !!
          const newAccessToken = refreshResponse.data.newAccessToken;

          if (!newAccessToken) {
              // 如果刷新成功了，但响应结构不符合预期，没有拿到新 Token
              console.error('刷新 Token 成功，但响应数据中未找到新的 Access Token:', refreshResponse.data);
              throw new Error('刷新成功但未能获取新令牌'); // 抛出错误，会进入 catch 块
          }

          console.log('Token 刷新成功!');
          localStorage.setItem(ACCESS_TOKEN_KEY, newAccessToken); // 更新 localStorage 中的 Access Token

          // **步骤 3: 处理等待队列中的请求**
          processQueue(null, newAccessToken);

          // **步骤 4: 重试原始请求**
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
          console.log('重试原始请求:', originalRequest.url);
          return request(originalRequest); // 返回重试请求的 Promise

        } catch (refreshError) {
          // **步骤 5: 刷新失败** (例如 Refresh Token Cookie 无效或过期, 或网络问题)
          const refreshErrorMessage = refreshError.response?.data?.message || refreshError.message || '会话已失效，请重新登录';
          console.error('通过 Cookie 刷新 Token 失败:', refreshErrorMessage);
          localStorage.removeItem(ACCESS_TOKEN_KEY); // 清除本地 Access Token
          processQueue(refreshError, null); // 拒绝队列中的请求

          // 在这里可以进行跳转到登录页的操作
          // const router = useRouter(); // 在 setup 函数或组件内获取 router
          // router.push('/login');
          ElMessage.error(refreshErrorMessage); // 显示后端返回的刷新失败信息
          // 返回一个特定错误或原始错误，以便上层知道是刷新失败
          return Promise.reject(new Error(refreshErrorMessage));

        } finally {
          isRefreshing = false; // 重置刷新状态
        }

      } else if (isAccessTokenExpired && isRefreshing) {
        // **如果正在刷新，将当前失败的请求加入队列**
        console.log('正在刷新 Token，请求加入队列:', originalRequest.url);
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token) => {
              originalRequest.headers['Authorization'] = `Bearer ${token}`;
              console.log('队列请求恢复执行:', originalRequest.url);
              resolve(request(originalRequest));
            },
            reject: (err) => {
              console.log('队列请求因刷新失败而被拒绝:', originalRequest.url);
              reject(err);
            }
          });
        });
      } else {
        // **其他 401 错误** (非 Access Token 过期，例如权限不足或直接的刷新失败响应)
        console.warn(`收到 401 错误 (非 Access Token 过期或刷新期间): ${errorMessage} (Code: ${errorCode})`);
        localStorage.removeItem(ACCESS_TOKEN_KEY); // 清除本地 Access Token
        // const router = useRouter();
        // router.push('/login');
        // 根据错误消息或错误码判断是否是刷新失败导致的 401
        if (errorMessage.includes('无效或已过期的 Refresh Token') || errorCode === 1009 /* FAIL_REFRESH_TOKEN */) {
             ElMessage.error('会话已失效，请重新登录');
             // 返回特定错误，避免业务代码误判
             return Promise.reject(new Error('会话已失效，请重新登录'));
        } else {
             ElMessage.error(errorMessage || '未授权，请登录');
             return Promise.reject(new Error(errorMessage || '未授权，请登录'));
        }
      }
    } // --- End of 401 Handling ---

    // --- 处理其他 HTTP 错误状态码 ---
    console.error(`HTTP 错误 ${status}:`, errorMessage, `(Code: ${errorCode})`);
    let displayMessage = errorMessage;
    // 可以根据需要保留或修改这里的 switch 逻辑
    switch (status) {
        case 403: displayMessage = `禁止访问 (403): ${errorMessage}`; break; // ResultCode.FAILED_FORBIDDEN
        case 404: displayMessage = `资源未找到 (404): ${errorMessage}`; break; // ResultCode.FAILED_NOT_EXISTS 等
        case 500: displayMessage = `服务器内部错误 (500): ${errorMessage}`; break; // ResultCode.ERROR_SERVICES
        // 可以根据后端的 ResultCode 进一步细化提示
        // case XXX: ...
        default: displayMessage = `请求失败 (${status}): ${errorMessage}`;
    }
    ElMessage.error(displayMessage);

    // 返回包含后端 Result 对象的错误，或者只返回 Error 对象
    return Promise.reject(error.response?.data || error); // 让业务代码可以拿到 Result 对象
  }
);

export default request;