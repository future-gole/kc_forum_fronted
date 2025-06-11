import request from '@/utils/request';

/**
 * 分页获取文章下的顶级评论
 * @param {object} params - { articleId, currentPage, pageSize }
 */
export const getArticleReplies = (params) => {
  return request({
    url: '/articleReply/getArticleReplies',
    method: 'get',
    params,
  });
};

/**
 * 分页获取某条评论下的子回复
 * @param {object} params - { replyId, page, size }
 */
export const getChildrenReplies = (params) => {
  return request({
    url: '/articleReply/getChildrenReplies',
    method: 'get',
    params,
  });
};

/**
 * 发表新评论或回复
 * @param {object} data - { articleId, replyId, postUserId, content }
 */
export const createArticleReply = (data) => {
  return request({
    url: '/articleReply/createArticleReply',
    method: 'post',
    data,
  });
};

/**
 * 删除评论或回复
 * @param {object} params - { articleReplyId, articleId }
 */
export const deleteArticleReply = (params) => {
  return request({
    url: '/articleReply/deleteArticleReply',
    method: 'post', 
    params,
  });
};

/**
 * 点赞评论
 * @param {object} data - { targetId }
 */
export const likeReply = (data) => {
    return request({
        url: '/like/reply', // 假设点赞接口是这个
        method: 'post',
        data
    });
};