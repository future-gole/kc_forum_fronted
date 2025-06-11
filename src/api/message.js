import request from '@/utils/request';

/**
 * 发送站内信
 * @param {object} data - 消息请求体
 * @param {number} data.receiveUserId - 接收用户的ID
 * @param {string} data.content - 消息内容
 * @returns {Promise<any>} - 后端返回的 Result 对象
 */
export function sendMessage(data) {
  return request({
    url: '/message/send',
    method: 'post',
    data: data,
  });
}

/**
 * 获取当前用户未读消息数
 * @returns {Promise<any>} - 后端返回的 Result 对象，data 字段为未读消息数
 */
export function getUnreadCount() {
  return request({
    url: '/message/getUnreadCount',
    method: 'get',
  });
}

/**
 * 获取当前两个用户的会话消息（当前用户作为接收者，查询与指定发送者的消息）
 * @param {number} postUserId - 发送者的ID
 * @returns {Promise<any>} - 后端返回的 List<MessageResponse>
 */
export function getAllMessagesByUserId(postUserId) {
  return request({
    url: '/message/getAllMessagesByUserId',
    method: 'get',
    params: {
      postUserId: postUserId,
    },
  });
}
/**
 * 获取当前用户最近会话列表
 * @returns {Promise<any>} - 后端返回的 Result<?> 对象，data 字段为 List<RecentConversationsResponse>
 */
export function getRecentConversations(){
    return request({
        url: '/message/getRecentConversations',
        method: "get",
    })
}