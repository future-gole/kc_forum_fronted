import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/Home.vue'
import BoardView from '@/views/BoardView.vue';
import ArticleDetail from '@/views/ArticleDetail.vue';
import EditView from '@/views/EditView.vue';
import User from '@/views/User.vue';



const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
  path: '/login',
  name: 'Login',
  component: () => {
    const isMobile = window.innerWidth < 768;
    // 无论哪个组件，都用 Promise.resolve 包装一下，或者直接用动态 import
    // 为了更符合异步组件的模式，推荐使用动态 import
    return isMobile ? import('@/components/MobileLogin.vue') : import('@/components/Login.vue');
  }
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
  if (to.path !== '/login' && !token) {
    next('/login');
  } else {
    next();
  }
});
export default router;