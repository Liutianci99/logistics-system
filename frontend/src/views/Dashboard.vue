<template>
  <div class="dashboard page-container">
    <h2 class="page-title">
      {{ greeting }}，{{ authStore.user?.username }}
    </h2>

    <!-- 顾客仪表盘 -->
    <template v-if="authStore.userRole === UserRole.CUSTOMER">
      <el-row :gutter="20">
        <el-col :span="8">
          <el-card shadow="hover">
            <el-statistic title="我的订单" :value="stats.totalOrders" />
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card shadow="hover">
            <el-statistic title="待收货" :value="stats.pendingOrders" />
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card shadow="hover">
            <el-statistic title="已完成" :value="stats.completedOrders" />
          </el-card>
        </el-col>
      </el-row>
    </template>

    <!-- 商家仪表盘 -->
    <template v-if="authStore.userRole === UserRole.MERCHANT">
      <el-row :gutter="20">
        <el-col :span="8">
          <el-card shadow="hover">
            <el-statistic title="待处理订单" :value="stats.pendingOrders" />
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card shadow="hover">
            <el-statistic title="商品数量" :value="stats.productCount" />
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card shadow="hover">
            <el-statistic title="总订单数" :value="stats.totalOrders" />
          </el-card>
        </el-col>
      </el-row>
    </template>

    <!-- 配送员仪表盘 -->
    <template v-if="authStore.userRole === UserRole.DELIVERY">
      <el-row :gutter="20">
        <el-col :span="8">
          <el-card shadow="hover">
            <el-statistic title="待配送任务" :value="stats.activeTasks" />
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card shadow="hover">
            <el-statistic title="已完成配送" :value="stats.completedDeliveries" />
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card shadow="hover">
            <el-statistic title="总配送单" :value="stats.totalDeliveries" />
          </el-card>
        </el-col>
      </el-row>
    </template>

    <!-- 管理员仪表盘 -->
    <template v-if="authStore.userRole === UserRole.ADMIN">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card shadow="hover">
            <el-statistic title="总用户数" :value="stats.totalUsers" />
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover">
            <el-statistic title="总订单数" :value="stats.totalOrders" />
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover">
            <el-statistic title="异常订单" :value="stats.abnormalOrders">
              <template #suffix>
                <span v-if="stats.abnormalOrders > 0" style="color: #f56c6c; font-size: 14px">
                  ⚠
                </span>
              </template>
            </el-statistic>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover">
            <el-statistic title="今日订单" :value="stats.todayOrders" />
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20" class="mt-20">
        <el-col :span="8">
          <el-card shadow="hover">
            <el-statistic title="顾客数" :value="stats.customerCount" />
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card shadow="hover">
            <el-statistic title="商家数" :value="stats.merchantCount" />
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card shadow="hover">
            <el-statistic title="配送员数" :value="stats.deliveryCount" />
          </el-card>
        </el-col>
      </el-row>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { UserRole } from '@/types';
import api from '@/utils/api';

const authStore = useAuthStore();

const greeting = computed(() => {
  const hour = new Date().getHours();
  if (hour < 6) return '夜深了';
  if (hour < 12) return '早上好';
  if (hour < 18) return '下午好';
  return '晚上好';
});

const stats = reactive<Record<string, number>>({
  totalOrders: 0,
  pendingOrders: 0,
  completedOrders: 0,
  productCount: 0,
  activeTasks: 0,
  completedDeliveries: 0,
  totalDeliveries: 0,
  totalUsers: 0,
  abnormalOrders: 0,
  todayOrders: 0,
  customerCount: 0,
  merchantCount: 0,
  deliveryCount: 0,
});

async function fetchDashboardData() {
  try {
    const role = authStore.userRole;

    if (role === UserRole.CUSTOMER) {
      const res: any = await api.get('/orders', { params: { limit: 1 } });
      stats.totalOrders = res.total ?? 0;
      const pendingRes: any = await api.get('/orders', {
        params: { status: 'in_transit', limit: 1 },
      });
      stats.pendingOrders = pendingRes.total ?? 0;
      const completedRes: any = await api.get('/orders', {
        params: { status: 'signed', limit: 1 },
      });
      stats.completedOrders = completedRes.total ?? 0;
    } else if (role === UserRole.MERCHANT) {
      const ordersRes: any = await api.get('/orders', { params: { limit: 1 } });
      stats.totalOrders = ordersRes.total ?? 0;
      const pendingRes: any = await api.get('/orders', {
        params: { status: 'pending', limit: 1 },
      });
      stats.pendingOrders = pendingRes.total ?? 0;
      const productsRes: any = await api.get('/products', { params: { limit: 1 } });
      stats.productCount = productsRes.total ?? 0;
    } else if (role === UserRole.DELIVERY) {
      const activeRes: any = await api.get('/delivery/tasks', {
        params: { status: 'in_transit', limit: 1 },
      });
      stats.activeTasks = activeRes.total ?? 0;
      const completedRes: any = await api.get('/delivery/tasks', {
        params: { status: 'delivered', limit: 1 },
      });
      stats.completedDeliveries = completedRes.total ?? 0;
      const totalRes: any = await api.get('/delivery/tasks', { params: { limit: 1 } });
      stats.totalDeliveries = totalRes.total ?? 0;
    } else if (role === UserRole.ADMIN) {
      const res: any = await api.get('/admin/dashboard');
      Object.assign(stats, res);
    }
  } catch {
    // 错误已由 api 拦截器统一处理
  }
}

onMounted(() => {
  fetchDashboardData();
});
</script>

<style scoped lang="scss">
.dashboard {
  .page-title {
    font-size: 22px;
    color: #303133;
    margin-bottom: 24px;
    font-weight: 500;
  }

  .el-card {
    border-radius: 8px;
    transition: transform 0.2s;

    &:hover {
      transform: translateY(-2px);
    }
  }
}

.mt-20 {
  margin-top: 20px;
}
</style>
