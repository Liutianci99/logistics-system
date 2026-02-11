<template>
  <div class="order-list page-container">
    <h2 class="page-title">订单列表</h2>

    <!-- 筛选栏 -->
    <el-card shadow="never" class="filter-card">
      <el-row :gutter="16" align="middle">
        <el-col :span="6">
          <el-select
            v-model="filterStatus"
            placeholder="按状态筛选"
            clearable
            @change="handleFilter"
          >
            <el-option
              v-for="(label, value) in OrderStatusMap"
              :key="value"
              :label="label"
              :value="value"
            />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-input
            v-model="filterOrderNo"
            placeholder="搜索订单号"
            clearable
            @clear="handleFilter"
            @keyup.enter="handleFilter"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
        <el-col :span="4">
          <el-button type="primary" @click="handleFilter">查询</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 订单表格 -->
    <el-card shadow="never" class="table-card">
      <el-table
        v-loading="orderStore.loading"
        :data="orderStore.orders"
        stripe
        highlight-current-row
        style="width: 100%"
        @row-click="handleRowClick"
      >
        <el-table-column prop="orderNo" label="订单号" width="200" />
        <el-table-column prop="productName" label="商品名称" min-width="140" />
        <el-table-column prop="quantity" label="数量" width="80" align="center" />
        <el-table-column label="总价" width="120" align="right">
          <template #default="{ row }">
            ¥{{ Number(row.totalPrice).toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="OrderStatusColor[row.status as OrderStatus]" size="small">
              {{ OrderStatusMap[row.status as OrderStatus] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="receiverName" label="收件人" width="120" />
        <el-table-column label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <!-- 商家操作 -->
            <template v-if="authStore.userRole === UserRole.MERCHANT">
              <el-button
                v-if="row.status === OrderStatus.PENDING"
                type="primary"
                size="small"
                @click.stop="handleConfirm(row)"
              >
                确认
              </el-button>
            </template>

            <!-- 顾客操作 -->
            <template v-if="authStore.userRole === UserRole.CUSTOMER">
              <el-button
                v-if="row.status === OrderStatus.DELIVERED"
                type="success"
                size="small"
                @click.stop="handleSign(row)"
              >
                签收
              </el-button>
              <el-button
                v-if="row.status === OrderStatus.PENDING || row.status === OrderStatus.CONFIRMED"
                type="danger"
                size="small"
                @click.stop="handleCancel(row)"
              >
                取消
              </el-button>
            </template>

            <!-- 配送员操作 -->
            <template v-if="authStore.userRole === UserRole.DELIVERY">
              <el-button
                v-if="row.status === OrderStatus.ASSIGNED"
                type="warning"
                size="small"
                @click.stop="handlePickUp(row)"
              >
                取件
              </el-button>
              <el-button
                v-if="row.status === OrderStatus.PICKED_UP"
                type="primary"
                size="small"
                @click.stop="handleStartDelivery(row)"
              >
                开始配送
              </el-button>
              <el-button
                v-if="row.status === OrderStatus.IN_TRANSIT"
                type="success"
                size="small"
                @click.stop="handleDeliver(row)"
              >
                确认送达
              </el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          :total="orderStore.total"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="fetchData"
          @current-change="fetchData"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search } from '@element-plus/icons-vue';
import { useOrderStore } from '@/stores/order';
import { useAuthStore } from '@/stores/auth';
import { OrderStatus, OrderStatusMap, OrderStatusColor, UserRole } from '@/types';
import type { Order } from '@/types';

const router = useRouter();
const orderStore = useOrderStore();
const authStore = useAuthStore();

const currentPage = ref(1);
const pageSize = ref(10);
const filterStatus = ref<string>('');
const filterOrderNo = ref('');

function formatTime(dateStr: string) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('zh-CN');
}

async function fetchData() {
  const params: any = {
    page: currentPage.value,
    limit: pageSize.value,
  };
  if (filterStatus.value) params.status = filterStatus.value;
  if (filterOrderNo.value) params.orderNo = filterOrderNo.value;
  await orderStore.fetchOrders(params);
}

function handleFilter() {
  currentPage.value = 1;
  fetchData();
}

function resetFilter() {
  filterStatus.value = '';
  filterOrderNo.value = '';
  currentPage.value = 1;
  fetchData();
}

function handleRowClick(row: Order) {
  router.push(`/orders/${row.id}`);
}

async function handleConfirm(row: Order) {
  try {
    await ElMessageBox.confirm('确认接受该订单？', '确认操作', { type: 'warning' });
    await orderStore.confirmOrder(row.id);
    ElMessage.success('订单已确认');
    fetchData();
  } catch {
    // cancelled
  }
}

async function handleSign(row: Order) {
  try {
    await ElMessageBox.confirm('确认已收到商品？', '签收确认', { type: 'info' });
    await orderStore.signOrder(row.id);
    ElMessage.success('签收成功');
    fetchData();
  } catch {
    // cancelled
  }
}

async function handleCancel(row: Order) {
  try {
    await ElMessageBox.confirm('确定要取消该订单吗？', '取消订单', { type: 'warning' });
    await orderStore.cancelOrder(row.id);
    ElMessage.success('订单已取消');
    fetchData();
  } catch {
    // cancelled
  }
}

async function handlePickUp(row: Order) {
  try {
    await ElMessageBox.confirm('确认取件？', '取件操作', { type: 'info' });
    await orderStore.pickUpOrder(row.id);
    ElMessage.success('已取件');
    fetchData();
  } catch {
    // cancelled
  }
}

async function handleStartDelivery(row: Order) {
  try {
    await ElMessageBox.confirm('开始配送？', '配送操作', { type: 'info' });
    await orderStore.startDelivery(row.id);
    ElMessage.success('已开始配送');
    fetchData();
  } catch {
    // cancelled
  }
}

async function handleDeliver(row: Order) {
  try {
    await ElMessageBox.confirm('确认已送达？', '送达确认', { type: 'success' });
    await orderStore.deliverOrder(row.id);
    ElMessage.success('已确认送达');
    fetchData();
  } catch {
    // cancelled
  }
}

onMounted(() => {
  fetchData();
});
</script>

<style scoped lang="scss">
.order-list {
  .filter-card {
    margin-bottom: 16px;
  }

  .table-card {
    .el-table {
      cursor: pointer;
    }
  }

  .pagination-wrapper {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
  }
}
</style>
