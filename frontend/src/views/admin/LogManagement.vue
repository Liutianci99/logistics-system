<template>
  <div class="log-management page-container">
    <h2 class="page-title">操作日志</h2>

    <!-- Tab 切换 -->
    <el-tabs v-model="activeTab" @tab-change="handleTabChange">
      <el-tab-pane label="全部日志" name="all" />
      <el-tab-pane label="异常日志" name="abnormal" />
    </el-tabs>

    <!-- 工具栏 -->
    <el-card shadow="never" class="toolbar-card">
      <el-row :gutter="16" align="middle">
        <el-col :span="6">
          <el-select
            v-model="filterAction"
            placeholder="按操作类型筛选"
            clearable
            @change="handleFilterChange"
          >
            <el-option
              v-for="action in actionOptions"
              :key="action"
              :label="action"
              :value="action"
            />
          </el-select>
        </el-col>
      </el-row>
    </el-card>

    <!-- 日志表格 -->
    <el-card shadow="never">
      <el-table v-loading="loading" :data="logs" stripe style="width: 100%">
        <el-table-column label="时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="订单号" min-width="160">
          <template #default="{ row }">
            {{ row.order?.orderNo || row.orderNo || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作人" width="120">
          <template #default="{ row }">
            {{ row.operator?.username || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="action" label="操作" width="140" />
        <el-table-column label="详情" min-width="200">
          <template #default="{ row }">
            {{ row.detail || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="原状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.fromStatus" size="small" type="info">
              {{ row.fromStatus }}
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="新状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.toStatus" size="small">
              {{ row.toStatus }}
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          :total="total"
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
import { ElMessage } from 'element-plus';
import type { OrderLog } from '@/types';
import api from '@/utils/api';

interface LogRecord extends OrderLog {
  order?: { orderNo: string };
  orderNo?: string;
}

const loading = ref(false);
const logs = ref<LogRecord[]>([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);
const activeTab = ref('all');
const filterAction = ref('');

const actionOptions = [
  '创建订单',
  '确认订单',
  '分配配送员',
  '取件',
  '配送中',
  '已送达',
  '已签收',
  '取消订单',
  '标记异常',
];

function formatTime(dateStr: string) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('zh-CN');
}

function handleTabChange() {
  currentPage.value = 1;
  fetchData();
}

function handleFilterChange() {
  currentPage.value = 1;
  fetchData();
}

async function fetchData() {
  loading.value = true;
  try {
    const params: any = {
      page: currentPage.value,
      limit: pageSize.value,
    };
    if (filterAction.value) params.action = filterAction.value;

    const endpoint =
      activeTab.value === 'abnormal' ? '/admin/abnormal-logs' : '/admin/logs';

    const res: any = await api.get(endpoint, { params });
    logs.value = res.logs || res.data || res;
    total.value = res.total ?? (Array.isArray(res) ? res.length : 0);
  } catch {
    ElMessage.error('获取日志列表失败');
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchData();
});
</script>

<style scoped lang="scss">
.log-management {
  .toolbar-card {
    margin-bottom: 16px;
  }

  .pagination-wrapper {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
  }
}
</style>
