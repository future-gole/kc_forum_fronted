import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/Home.vue'
import BoardView from '@/views/BoardView.vue';
import ArticleDetail from '@/views/ArticleDetail.vue';
import Login from "@/components/Login.vue";
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
    component: Login
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