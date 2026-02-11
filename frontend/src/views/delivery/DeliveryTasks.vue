<template>
  <div class="delivery-tasks page-container">
    <h2 class="page-title">配送任务</h2>

    <!-- 状态切换 & 统计 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="总配送单" :value="stats.total" />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="进行中" :value="stats.inProgress" />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="已完成" :value="stats.completed" />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="status-card">
          <div class="status-toggle">
            <span class="status-label">当前状态</span>
            <el-select
              v-model="deliveryStatus"
              :loading="statusLoading"
              @change="handleStatusChange"
              style="width: 140px"
            >
              <el-option label="可接单" value="available">
                <el-badge is-dot type="success" /> 可接单
              </el-option>
              <el-option label="忙碌" value="busy">
                <el-badge is-dot type="warning" /> 忙碌
              </el-option>
              <el-option label="离线" value="offline">
                <el-badge is-dot type="info" /> 离线
              </el-option>
            </el-select>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 筛选 -->
    <el-card shadow="never" class="filter-card">
      <el-row :gutter="16" align="middle">
        <el-col :span="6">
          <el-select
            v-model="filterStatus"
            placeholder="按任务状态筛选"
            clearable
            @change="fetchTasks"
          >
            <el-option label="已分配" value="assigned" />
            <el-option label="已取件" value="picked_up" />
            <el-option label="配送中" value="in_transit" />
            <el-option label="已送达" value="delivered" />
            <el-option label="已签收" value="signed" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-button @click="fetchTasks">刷新</el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 任务列表 -->
    <div v-loading="loading" class="tasks-container">
      <template v-if="tasks.length > 0">
        <el-card
          v-for="task in tasks"
          :key="task.id"
          shadow="hover"
          class="task-card"
          @click="goToDetail(task.id)"
        >
          <template #header>
            <div class="task-header">
              <span class="order-no">{{ task.orderNo }}</span>
              <el-tag :type="OrderStatusColor[task.status as OrderStatus]" size="small">
                {{ OrderStatusMap[task.status as OrderStatus] }}
              </el-tag>
            </div>
          </template>

          <el-descriptions :column="2" size="small">
            <el-descriptions-item label="商品">{{ task.productName }}</el-descriptions-item>
            <el-descriptions-item label="数量">{{ task.quantity }}</el-descriptions-item>
            <el-descriptions-item label="收件人">{{ task.receiverName }}</el-descriptions-item>
            <el-descriptions-item label="电话">{{ task.receiverPhone }}</el-descriptions-item>
            <el-descriptions-item label="收货地址" :span="2">
              {{ task.shippingAddress }}
            </el-descriptions-item>
            <el-descriptions-item label="发货地址" :span="2">
              {{ task.senderAddress || '-' }}
            </el-descriptions-item>
          </el-descriptions>

          <div class="task-actions">
            <el-button
              v-if="task.status === OrderStatus.ASSIGNED"
              type="warning"
              size="small"
              @click.stop="handlePickUp(task)"
            >
              取件
            </el-button>
            <el-button
              v-if="task.status === OrderStatus.PICKED_UP"
              type="primary"
              size="small"
              @click.stop="handleStartDelivery(task)"
            >
              开始配送
            </el-button>
            <el-button
              v-if="task.status === OrderStatus.IN_TRANSIT"
              type="success"
              size="small"
              @click.stop="handleDeliver(task)"
            >
              确认送达
            </el-button>
            <el-button
              v-if="canMarkAbnormal(task)"
              type="danger"
              size="small"
              plain
              @click.stop="handleAbnormal(task)"
            >
              标记异常
            </el-button>
          </div>
        </el-card>
      </template>

      <el-empty v-else-if="!loading" description="暂无配送任务" />

      <!-- 分页 -->
      <div class="pagination-wrapper" v-if="total > pageSize">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          :total="total"
          layout="total, prev, pager, next"
          background
          @size-change="fetchTasks"
          @current-change="fetchTasks"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useAuthStore } from '@/stores/auth';
import { useOrderStore } from '@/stores/order';
import { OrderStatus, OrderStatusMap, OrderStatusColor } from '@/types';
import type { Order } from '@/types';
import api from '@/utils/api';

const router = useRouter();
const authStore = useAuthStore();
const orderStore = useOrderStore();

const loading = ref(false);
const statusLoading = ref(false);
const tasks = ref<Order[]>([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);
const filterStatus = ref('');
const deliveryStatus = ref(authStore.user?.deliveryStatus || 'available');

const stats = reactive({
  total: 0,
  inProgress: 0,
  completed: 0,
});

async function fetchTasks() {
  loading.value = true;
  try {
    const params: any = {
      page: currentPage.value,
      limit: pageSize.value,
    };
    if (filterStatus.value) params.status = filterStatus.value;
    const res: any = await api.get('/delivery/tasks', { params });
    tasks.value = res.orders || res.tasks || res.data || res;
    total.value = res.total ?? (Array.isArray(tasks.value) ? tasks.value.length : 0);
  } catch {
    ElMessage.error('获取配送任务失败');
  } finally {
    loading.value = false;
  }
}

async function fetchStats() {
  try {
    const res: any = await api.get('/delivery/stats');
    stats.total = res.total || 0;
    stats.inProgress = res.inProgress || 0;
    stats.completed = res.completed || 0;
  } catch {
    // 静默处理
  }
}

async function handleStatusChange(status: string) {
  statusLoading.value = true;
  try {
    await api.put('/delivery/status', { status });
    ElMessage.success('状态已更新');
    // 同步到 authStore
    if (authStore.user) {
      authStore.user.deliveryStatus = status as any;
      localStorage.setItem('user', JSON.stringify(authStore.user));
    }
  } catch {
    ElMessage.error('状态更新失败');
    // 回退
    deliveryStatus.value = authStore.user?.deliveryStatus || 'available';
  } finally {
    statusLoading.value = false;
  }
}

function goToDetail(id: number) {
  router.push(`/orders/${id}`);
}

function canMarkAbnormal(task: Order) {
  const s = task.status as OrderStatus;
  return (
    s !== OrderStatus.SIGNED &&
    s !== OrderStatus.CANCELLED &&
    s !== OrderStatus.ABNORMAL
  );
}

async function handlePickUp(task: Order) {
  try {
    await ElMessageBox.confirm('确认取件？', '取件操作', { type: 'info' });
    await orderStore.pickUpOrder(task.id);
    ElMessage.success('已取件');
    fetchTasks();
    fetchStats();
  } catch { /* cancelled */ }
}

async function handleStartDelivery(task: Order) {
  try {
    await ElMessageBox.confirm('开始配送？', '配送操作', { type: 'info' });
    await orderStore.startDelivery(task.id);
    ElMessage.success('已开始配送');
    fetchTasks();
    fetchStats();
  } catch { /* cancelled */ }
}

async function handleDeliver(task: Order) {
  try {
    await ElMessageBox.confirm('确认已送达？', '送达确认', { type: 'success' });
    await orderStore.deliverOrder(task.id);
    ElMessage.success('已确认送达');
    fetchTasks();
    fetchStats();
  } catch { /* cancelled */ }
}

async function handleAbnormal(task: Order) {
  try {
    const result = await ElMessageBox.prompt('请输入异常原因', '标记异常', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPattern: /\S+/,
      inputErrorMessage: '请输入异常原因',
      type: 'warning',
    });
    const reason = (result as any).value as string;
    await orderStore.markAbnormal(task.id, reason);
    ElMessage.success('已标记异常');
    fetchTasks();
    fetchStats();
  } catch { /* cancelled */ }
}

onMounted(() => {
  fetchTasks();
  fetchStats();
});
</script>

<style scoped lang="scss">
.delivery-tasks {
  .stats-row {
    margin-bottom: 20px;
  }

  .status-card {
    :deep(.el-card__body) {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 78px;
    }
  }

  .status-toggle {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;

    .status-label {
      font-size: 13px;
      color: #909399;
    }
  }

  .filter-card {
    margin-bottom: 16px;
  }

  .tasks-container {
    .task-card {
      margin-bottom: 16px;
      cursor: pointer;
      transition: box-shadow 0.2s;

      &:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }
    }

    .task-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .order-no {
        font-weight: 600;
        font-size: 15px;
      }
    }

    .task-actions {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #ebeef5;
      display: flex;
      gap: 8px;
    }
  }

  .pagination-wrapper {
    display: flex;
    justify-content: center;
    margin-top: 20px;
  }
}
</style>
