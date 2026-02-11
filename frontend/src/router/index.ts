import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { UserRole } from '@/types';

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/dashboard',
      },
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
      },
      // 订单相关
      {
        path: 'orders',
        name: 'Orders',
        component: () => import('@/views/orders/OrderList.vue'),
      },
      {
        path: 'orders/:id',
        name: 'OrderDetail',
        component: () => import('@/views/orders/OrderDetail.vue'),
      },
      // 商品管理（商家）
      {
        path: 'products',
        name: 'Products',
        component: () => import('@/views/products/ProductList.vue'),
      },
      // 配送管理（配送员）
      {
        path: 'delivery',
        name: 'Delivery',
        component: () => import('@/views/delivery/DeliveryTasks.vue'),
        meta: { roles: [UserRole.DELIVERY] },
      },
      // 商品浏览（顾客下单）
      {
        path: 'shop',
        name: 'Shop',
        component: () => import('@/views/shop/ShopList.vue'),
        meta: { roles: [UserRole.CUSTOMER] },
      },
      // 管理员
      {
        path: 'admin/users',
        name: 'AdminUsers',
        component: () => import('@/views/admin/UserManagement.vue'),
        meta: { roles: [UserRole.ADMIN] },
      },
      {
        path: 'admin/logs',
        name: 'AdminLogs',
        component: () => import('@/views/admin/LogManagement.vue'),
        meta: { roles: [UserRole.ADMIN] },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 导航守卫
router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore();

  if (to.meta.requiresAuth !== false && !authStore.isLoggedIn) {
    next('/login');
    return;
  }

  if (to.meta.roles) {
    const allowedRoles = to.meta.roles as UserRole[];
    if (!allowedRoles.includes(authStore.userRole as UserRole)) {
      next('/dashboard');
      return;
    }
  }

  next();
});

export default router;
