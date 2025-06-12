import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/Home.vue'
import BoardView from '@/views/BoardView.vue';
import ArticleDetail from '@/views/ArticleDetail.vue';
import EditView from '@/views/EditView.vue';
import User from '@/views/User.vue';

import MobileLogin from '@/components/MobileLogin.vue';
import DesktopLogin from '@/components/Login.vue';

const routes = [
  {
    path: '/',
    redirect: () => {
      const isMobile = window.innerWidth < 768;
      return isMobile ? { name: 'LoginMobile' } : { name: 'LoginDesktop' };
    }
  },
  {
    path: '/login-mobile',
    name: 'LoginMobile',
    component: MobileLogin // 直接使用已导入的组件
  },
  {
    path: '/login-desktop',
    name: 'LoginDesktop',
    component: DesktopLogin // 直接使用已导入的组件
  },
  {
    path: '/home',
    name: 'Home',
    component: Home,
    children: [
      {
        path: 'board/:boardId',
        name: 'Board',
        component: BoardView,
        props: true
      },
      {
        path: 'article/:articleId',
        name: 'ArticleDetail',
        component: ArticleDetail,
        props: true
      },
      // 添加创建文章的路由，使用 props 传递 boardId
      {
        path: 'create-article/:boardId',
        name: 'CreateArticle',
        component: EditView,
        props: true // 启用 props 传递路由参数
      },
      // 添加编辑文章的路由，使用 props 传递 boardId 和 articleId
      {
        path: 'edit-article/:boardId/:articleId',
        name: 'EditArticle',
        component: EditView,
        props: true
      },
      {
        path: 'user-profile/:userId',
        name: 'User',
        component: User,
        props: true
      }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 路由守卫：检查需要登录的路由
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');
  const loginPaths = ['/login-mobile', '/login-desktop']; // 或者使用路由名称 ['LoginMobile', 'LoginDesktop'] 和 to.name

  // 如果目标路径不是登录页，并且没有 token
  if (!loginPaths.includes(to.path) && !token) {
    // 用户未登录且访问的是需要登录的页面
    if (window.innerWidth < 768) {
      next({ name: 'LoginMobile' }); // 使用 name 进行导航更健壮
    } else {
      next({ name: 'LoginDesktop' });
    }
  } else if (loginPaths.includes(to.path) && token) {
    // 如果用户已登录，但尝试访问登录页，则重定向到首页 (可选，但推荐)
    next({ name: 'Home' });
  } else {
    // 其他情况（如：访问登录页且未登录，或访问其他页且已登录）正常放行
    next();
  }
});
export default router;