// src/utils/tokenService.js

// 使用内存变量存储 Access Token
let accessToken = localStorage.getItem('token');

/**
 * 获取内存中的 Access Token
 * @returns {string | null} Access Token 或 null
 */
export const getAccessToken = () => {
  // console.log('Getting Access Token from memory:', accessToken); // 调试日志
  return accessToken;
};

/**
 * 设置 Access Token 到内存
 * @param {string | null} token Access Token 或 null 来清除
 */
export const setAccessToken = (token) => {
  // console.log('Setting Access Token in memory:', token); // 调试日志
  accessToken = token;
};

/**
 * 清除内存中的 Access Token
 */
export const clearAccessToken = () => {
  // console.log('Clearing Access Token from memory'); // 调试日志
  accessToken = null;
};

// 导出方法
export default {
  getAccessToken,
  setAccessToken,
  clearAccessToken,
};