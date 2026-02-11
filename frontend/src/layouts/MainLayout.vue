<template>
  <el-container class="main-layout">
    <!-- 侧边栏 -->
    <el-aside :width="isCollapsed ? '64px' : '220px'" class="sidebar">
      <div class="logo" @click="router.push('/dashboard')">
        <el-icon :size="24"><Box /></el-icon>
        <span v-show="!isCollapsed" class="logo-text">物流管理系统</span>
      </div>
      <el-menu
        :default-active="route.path"
        :collapse="isCollapsed"
        :router="true"
        background-color="#001529"
        text-color="#ffffffa6"
        active-text-color="#ffffff"
        class="sidebar-menu"
      >
        <!-- 顾客菜单 -->
        <template v-if="authStore.userRole === UserRole.CUSTOMER">
          <el-menu-item index="/shop">
            <el-icon><ShoppingBag /></el-icon>
            <template #title>商品浏览</template>
          </el-menu-item>
          <el-menu-item index="/orders">
            <el-icon><List /></el-icon>
            <template #title>我的订单</template>
          </el-menu-item>
        </template>

        <!-- 商家菜单 -->
        <template v-if="authStore.userRole === UserRole.MERCHANT">
          <el-menu-item index="/products">
            <el-icon><Goods /></el-icon>
            <template #title>商品管理</template>
          </el-menu-item>
          <el-menu-item index="/orders">
            <el-icon><List /></el-icon>
            <template #title>订单管理</template>
          </el-menu-item>
        </template>

        <!-- 配送员菜单 -->
        <template v-if="authStore.userRole === UserRole.DELIVERY">
          <el-menu-item index="/delivery">
            <el-icon><Van /></el-icon>
            <template #title>配送任务</template>
          </el-menu-item>
          <el-menu-item index="/orders">
            <el-icon><List /></el-icon>
            <template #title>订单管理</template>
          </el-menu-item>
        </template>

        <!-- 管理员菜单 -->
        <template v-if="authStore.userRole === UserRole.ADMIN">
          <el-menu-item index="/dashboard">
            <el-icon><DataAnalysis /></el-icon>
            <template #title>仪表盘</template>
          </el-menu-item>
          <el-menu-item index="/orders">
            <el-icon><List /></el-icon>
            <template #title>订单管理</template>
          </el-menu-item>
          <el-menu-item index="/admin/users">
            <el-icon><User /></el-icon>
            <template #title>用户管理</template>
          </el-menu-item>
          <el-menu-item index="/admin/logs">
            <el-icon><Document /></el-icon>
            <template #title>操作日志</template>
          </el-menu-item>
        </template>
      </el-menu>
    </el-aside>

    <el-container>
      <!-- 头部 -->
      <el-header class="header">
        <div class="header-left">
          <el-icon
            class="collapse-btn"
            :size="20"
            @click="isCollapsed = !isCollapsed"
          >
            <Fold v-if="!isCollapsed" />
            <Expand v-else />
          </el-icon>
        </div>
        <div class="header-right">
          <span class="user-info">
            <el-icon><User /></el-icon>
            <span class="username">{{ authStore.user?.username }}</span>
            <el-tag size="small" type="info" class="role-tag">
              {{ authStore.userRole ? RoleMap[authStore.userRole] : '' }}
            </el-tag>
          </span>
          <el-button type="danger" text @click="handleLogout">
            <el-icon><SwitchButton /></el-icon>
            退出登录
          </el-button>
        </div>
      </el-header>

      <!-- 主体内容 -->
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { UserRole, RoleMap } from '@/types';
import {
  Box,
  ShoppingBag,
  List,
  Goods,
  Van,
  DataAnalysis,
  User,
  Document,
  Fold,
  Expand,
  SwitchButton,
} from '@element-plus/icons-vue';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const isCollapsed = ref(false);

function handleLogout() {
  authStore.logout();
  router.push('/login');
}
</script>

<style scoped lang="scss">
.main-layout {
  height: 100vh;
}

.sidebar {
  background-color: #001529;
  transition: width 0.3s;
  overflow: hidden;
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 60px;
  color: #fff;
  cursor: pointer;
  gap: 8px;
  white-space: nowrap;
  overflow: hidden;

  .logo-text {
    font-size: 16px;
    font-weight: 600;
  }
}

.sidebar-menu {
  border-right: none;

  &:not(.el-menu--collapse) {
    width: 220px;
  }
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  padding: 0 20px;
  height: 60px;
}

.header-left {
  display: flex;
  align-items: center;
}

.collapse-btn {
  cursor: pointer;
  color: #333;
  transition: color 0.2s;

  &:hover {
    color: #409eff;
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #333;
  font-size: 14px;
}

.role-tag {
  margin-left: 4px;
}

.main-content {
  background-color: #f5f7fa;
  min-height: 0;
  overflow-y: auto;
}
</style>
