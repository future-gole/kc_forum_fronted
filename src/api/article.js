import request from "@/utils/request";
export function getAllArticlesByUserId(userId){
      return request({
      url: `/article/getAllArticlesByUserId`,
      method: `get`,
      params: {
        userId: userId
      }
    });
}

/**
 * 分页获取指定板块下的文章列表
 * @param {object} params - 请求参数
 * @param {number} params.boardId - 板块ID
 * @param {number} params.currentPage - 当前页码
 * @param {number} params.pageSize - 每页数量
 * @param {boolean} [params.onlyTop] - 是否只看置顶 (可选, 如果后端支持此参数)
 * @returns {Promise}
 */
export function getArticlesPageByBoardId(params) {
  return request({
    url: `/article/getArticlesPageByBoardId`, // 确保这个URL与后端Controller中的@GetMapping匹配
    method: 'get',
    params: params // 直接传递 params 对象，axios会自动处理
  });
}

export function deleteArticle(params){
  return request({
    url: `/article/deleteArticle`, // 确保这个URL与后端Controller中的@GetMapping匹配
    method: 'post',
    params: params // 直接传递 params 对象，axios会自动处理
  });
}

/**
 * 根据ID获取文章详情
 * @param {number} articleId - 文章ID
 * @returns {Promise}
 */
export const getArticleDetailById = (articleId) => {
  return request({
    url: `/article/getArticleDetailById`,
    method: 'get',
    params: {
      articleId
    }
  });
};