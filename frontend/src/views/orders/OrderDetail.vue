<template>
  <div class="order-detail page-container">
    <!-- 头部 -->
    <div class="page-header">
      <el-button @click="router.push('/orders')" :icon="ArrowLeft">返回订单列表</el-button>
      <h2 class="page-title" style="margin-left: 16px">订单详情</h2>
    </div>

    <div v-loading="loading">
      <template v-if="order">
        <!-- 订单基本信息 -->
        <el-card shadow="never" class="detail-card">
          <template #header>
            <div class="card-header">
              <span>基本信息</span>
              <el-tag
                :type="OrderStatusColor[order.status as OrderStatus]"
                size="large"
              >
                {{ OrderStatusMap[order.status as OrderStatus] }}
              </el-tag>
            </div>
          </template>

          <el-descriptions :column="2" border>
            <el-descriptions-item label="订单号">{{ order.orderNo }}</el-descriptions-item>
            <el-descriptions-item label="商品名称">{{ order.productName }}</el-descriptions-item>
            <el-descriptions-item label="数量">{{ order.quantity }}</el-descriptions-item>
            <el-descriptions-item label="总价">¥{{ Number(order.totalPrice).toFixed(2) }}</el-descriptions-item>
            <el-descriptions-item label="收件人">{{ order.receiverName }}</el-descriptions-item>
            <el-descriptions-item label="收件人电话">{{ order.receiverPhone }}</el-descriptions-item>
            <el-descriptions-item label="收货地址" :span="2">{{ order.shippingAddress }}</el-descriptions-item>
            <el-descriptions-item label="发货地址" :span="2">{{ order.senderAddress || '-' }}</el-descriptions-item>
            <el-descriptions-item label="备注" :span="2">{{ order.remark || '-' }}</el-descriptions-item>
            <el-descriptions-item label="商家">{{ order.merchant?.username || '-' }}</el-descriptions-item>
            <el-descriptions-item label="配送员">{{ order.deliveryPerson?.username || '-' }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ formatTime(order.createdAt) }}</el-descriptions-item>
            <el-descriptions-item label="确认时间">{{ formatTime(order.confirmedAt) }}</el-descriptions-item>
            <el-descriptions-item label="送达时间">{{ formatTime(order.deliveredAt) }}</el-descriptions-item>
            <el-descriptions-item label="签收时间">{{ formatTime(order.signedAt) }}</el-descriptions-item>
            <el-descriptions-item v-if="order.abnormalReason" label="异常原因" :span="2">
              <el-text type="danger">{{ order.abnormalReason }}</el-text>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 操作按钮 -->
        <el-card shadow="never" class="action-card" v-if="showActions">
          <template #header>
            <span>操作</span>
          </template>
          <el-space wrap>
            <!-- 商家操作 -->
            <template v-if="authStore.userRole === UserRole.MERCHANT">
              <el-button
                v-if="order.status === OrderStatus.PENDING"
                type="primary"
                @click="handleConfirm"
              >
                确认订单
              </el-button>
            </template>

            <!-- 顾客操作 -->
            <template v-if="authStore.userRole === UserRole.CUSTOMER">
              <el-button
                v-if="order.status === OrderStatus.DELIVERED"
                type="success"
                @click="handleSign"
              >
                确认签收
              </el-button>
              <el-button
                v-if="order.status === OrderStatus.PENDING || order.status === OrderStatus.CONFIRMED"
                type="danger"
                @click="handleCancel"
              >
                取消订单
              </el-button>
            </template>

            <!-- 配送员操作 -->
            <template v-if="authStore.userRole === UserRole.DELIVERY">
              <el-button
                v-if="order.status === OrderStatus.ASSIGNED"
                type="warning"
                @click="handlePickUp"
              >
                取件
              </el-button>
              <el-button
                v-if="order.status === OrderStatus.PICKED_UP"
                type="primary"
                @click="handleStartDelivery"
              >
                开始配送
              </el-button>
              <el-button
                v-if="order.status === OrderStatus.IN_TRANSIT"
                type="success"
                @click="handleDeliver"
              >
                确认送达
              </el-button>
            </template>

            <!-- 标记异常 (商家 & 配送员) -->
            <el-button
              v-if="canMarkAbnormal"
              type="danger"
              plain
              @click="handleAbnormal"
            >
              标记异常
            </el-button>
          </el-space>
        </el-card>

        <!-- 订单日志时间线 -->
        <el-card shadow="never" class="timeline-card">
          <template #header>
            <span>订单跟踪</span>
          </template>

          <el-timeline v-if="order.logs && order.logs.length > 0">
            <el-timeline-item
              v-for="log in sortedLogs"
              :key="log.id"
              :timestamp="formatTime(log.createdAt)"
              placement="top"
              :type="getTimelineItemType(log)"
            >
              <el-card shadow="never" class="timeline-log-card">
                <h4>{{ log.action }}</h4>
                <p>{{ log.detail }}</p>
                <p class="log-meta">
                  <span>操作人：{{ log.operator?.username || `用户#${log.operatorId}` }}</span>
                  <span v-if="log.fromStatus && log.toStatus" style="margin-left: 12px;">
                    <el-tag size="small" type="info">{{ OrderStatusMap[log.fromStatus as OrderStatus] || log.fromStatus }}</el-tag>
                    →
                    <el-tag size="small" :type="OrderStatusColor[log.toStatus as OrderStatus]">{{ OrderStatusMap[log.toStatus as OrderStatus] || log.toStatus }}</el-tag>
                  </span>
                </p>
              </el-card>
            </el-timeline-item>
          </el-timeline>
          <el-empty v-else description="暂无日志记录" />
        </el-card>
      </template>

      <el-empty v-else-if="!loading" description="订单不存在" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ArrowLeft } from '@element-plus/icons-vue';
import { useOrderStore } from '@/stores/order';
import { useAuthStore } from '@/stores/auth';
import { OrderStatus, OrderStatusMap, OrderStatusColor, UserRole } from '@/types';
import type { Order, OrderLog } from '@/types';

const route = useRoute();
const router = useRouter();
const orderStore = useOrderStore();
const authStore = useAuthStore();

const loading = ref(false);
const order = ref<Order | null>(null);

const orderId = computed(() => Number(route.params.id));

const sortedLogs = computed(() => {
  if (!order.value?.logs) return [];
  return [...order.value.logs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
});

const showActions = computed(() => {
  if (!order.value) return false;
  const s = order.value.status as OrderStatus;
  if (s === OrderStatus.SIGNED || s === OrderStatus.CANCELLED) return false;
  return true;
});

const canMarkAbnormal = computed(() => {
  if (!order.value) return false;
  const role = authStore.userRole;
  const s = order.value.status as OrderStatus;
  if (s === OrderStatus.SIGNED || s === OrderStatus.CANCELLED || s === OrderStatus.ABNORMAL) return false;
  return role === UserRole.MERCHANT || role === UserRole.DELIVERY;
});

function formatTime(dateStr?: string) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('zh-CN');
}

function getTimelineItemType(log: OrderLog): '' | 'primary' | 'success' | 'warning' | 'danger' | 'info' {
  if (log.toStatus === OrderStatus.CANCELLED || log.toStatus === OrderStatus.ABNORMAL) return 'danger';
  if (log.toStatus === OrderStatus.SIGNED || log.toStatus === OrderStatus.DELIVERED) return 'success';
  if (log.toStatus === OrderStatus.IN_TRANSIT || log.toStatus === OrderStatus.PICKED_UP) return 'warning';
  return 'primary';
}

async function fetchDetail() {
  loading.value = true;
  try {
    order.value = await orderStore.fetchOrderDetail(orderId.value);
  } catch {
    ElMessage.error('获取订单详情失败');
  } finally {
    loading.value = false;
  }
}

async function handleConfirm() {
  try {
    await ElMessageBox.confirm('确认接受该订单？', '确认操作', { type: 'warning' });
    await orderStore.confirmOrder(orderId.value);
    ElMessage.success('订单已确认');
    fetchDetail();
  } catch { /* cancelled */ }
}

async function handleSign() {
  try {
    await ElMessageBox.confirm('确认已收到商品？', '签收确认', { type: 'info' });
    await orderStore.signOrder(orderId.value);
    ElMessage.success('签收成功');
    fetchDetail();
  } catch { /* cancelled */ }
}

async function handleCancel() {
  try {
    await ElMessageBox.confirm('确定要取消该订单吗？', '取消订单', { type: 'warning' });
    await orderStore.cancelOrder(orderId.value);
    ElMessage.success('订单已取消');
    fetchDetail();
  } catch { /* cancelled */ }
}

async function handlePickUp() {
  try {
    await ElMessageBox.confirm('确认取件？', '取件操作', { type: 'info' });
    await orderStore.pickUpOrder(orderId.value);
    ElMessage.success('已取件');
    fetchDetail();
  } catch { /* cancelled */ }
}

async function handleStartDelivery() {
  try {
    await ElMessageBox.confirm('开始配送？', '配送操作', { type: 'info' });
    await orderStore.startDelivery(orderId.value);
    ElMessage.success('已开始配送');
    fetchDetail();
  } catch { /* cancelled */ }
}

async function handleDeliver() {
  try {
    await ElMessageBox.confirm('确认已送达？', '送达确认', { type: 'success' });
    await orderStore.deliverOrder(orderId.value);
    ElMessage.success('已确认送达');
    fetchDetail();
  } catch { /* cancelled */ }
}

async function handleAbnormal() {
  try {
    const result = await ElMessageBox.prompt('请输入异常原因', '标记异常', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPattern: /\S+/,
      inputErrorMessage: '请输入异常原因',
      type: 'warning',
    });
    const reason = (result as any).value as string;
    await orderStore.markAbnormal(orderId.value, reason);
    ElMessage.success('已标记异常');
    fetchDetail();
  } catch { /* cancelled */ }
}

onMounted(() => {
  fetchDetail();
});
</script>

<style scoped lang="scss">
.order-detail {
  .page-header {
    display: flex;
    align-items: center;
    margin-bottom: 20px;
  }

  .detail-card,
  .action-card,
  .timeline-card {
    margin-bottom: 16px;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .timeline-log-card {
    h4 {
      margin: 0 0 8px 0;
      font-size: 15px;
    }
    p {
      margin: 0;
      color: #666;
      font-size: 13px;
    }
    .log-meta {
      margin-top: 6px;
      color: #999;
      font-size: 12px;
    }
  }
}
</style>
