// api/user.js
import request from '@/utils/request'; // 确保这里的路径正确

/**
 * 修改用户密码
 * @param {String} password 
 * @param {String} repeatPassword 
 * @returns 
 */
export function modifyPassword(password,repeatPassword){
  return request({
    url: `/user/modifyPassword`,
    method: `post`,
    params: {
      password: password,
      repeatPassword: repeatPassword
    }
  })
};

/**
 * 发送邮箱验证码
 * @param {String} userEmail 
 * @returns 
 */
export function sendVerificationCode(userEmail){
  return request({
    url: `/email/sendVerificationCode`,
    method: `get`,
    params: {
      email : userEmail
    }
  })
};

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
const avatarBaseURL = import.meta.env.VITE_APP_AVATER_URL;
const defaultAvatarUrl = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png';
export function getFullAvatarUrl (path) {
    return path
      ? avatarBaseURL + path
      : defaultAvatarUrl;
};