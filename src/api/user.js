// api/user.js
import request from '@/utils/request'; // 确保这里的路径正确

/**
 * 搜索用户
 * @param {string} query - 搜索关键词
 * @returns {Promise<any>} - 后端返回的 Result<?> 对象，data 字段为用户列表 (List<User>)
 * !!! 注意：您的后端 UserController 中未提供 `/user/search` 接口。
 *      如果此接口不存在，您需要自行实现或调整前端逻辑。
 */
export function searchUsers(query) {
  return request({
    url: `/user/search`, 
    method: 'get',
    params: { query },
  });
}

/**
 * 获取用户详情
 * @param {number} [userId] - 用户ID。如果未传入，则获取当前登录用户的信息。
 * @returns {Promise<any>} - 后端返回的 Result<?> 对象，data 字段为用户详情 (User)
 */
export function getUserDetails(userId) {
  const params = userId ? { id: userId } : {}; // 如果传入 userId，则作为参数
  return request({
    url: `/user/info`, // 对应后端 UserController 的 /user/info 接口
    method: 'get',
    data: params,
  });
}
/**
 * 更新/上传个人头像
 * @param {头像数据} formData 
 * @returns 
 */
export function uploadUserAvatar(formData){
  return request({
    url: `/user/uploadAvatar`,
    method: `post`,
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

export function modifyInfo(editForm){
    return request({
      url: `/user/modifyInfo`,
      method: `post`,
      data: editForm.value,
    });
}

export function updateInfoEmail(email,code){

}
export function getUserData(userId){
      return request({
      url: `/user/info`,
      method: `get`,
      params: {
        id: userId
      }
    });
}
const avatarBaseURL = import.meta.env.VITE_APP_BASE_URL;
const defaultAvatarUrl = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png';
export function getFullAvatarUrl (path) {
    return path
      ? avatarBaseURL + path
      : defaultAvatarUrl;
};