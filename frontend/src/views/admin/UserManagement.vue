<template>
  <div class="user-management page-container">
    <h2 class="page-title">用户管理</h2>

    <!-- 工具栏 -->
    <el-card shadow="never" class="toolbar-card">
      <el-row :gutter="16" align="middle">
        <el-col :span="8">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索用户名 / 姓名"
            clearable
            @clear="fetchData"
            @keyup.enter="fetchData"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
        <el-col :span="6">
          <el-select
            v-model="filterRole"
            placeholder="按角色筛选"
            clearable
            @change="handleFilterChange"
          >
            <el-option
              v-for="(label, value) in RoleMap"
              :key="value"
              :label="label"
              :value="value"
            />
          </el-select>
        </el-col>
      </el-row>
    </el-card>

    <!-- 用户表格 -->
    <el-card shadow="never">
      <el-table v-loading="loading" :data="users" stripe style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="username" label="用户名" min-width="120" />
        <el-table-column label="姓名" min-width="120">
          <template #default="{ row }">
            {{ row.realName || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="角色" width="120" align="center">
          <template #default="{ row }">
            <el-tag size="small">{{ RoleMap[row.role as UserRole] || row.role }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="邮箱" min-width="180">
          <template #default="{ row }">
            {{ row.email || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="手机号" width="140">
          <template #default="{ row }">
            {{ row.phone || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-switch
              :model-value="row.isActive"
              :loading="togglingId === row.id"
              @change="handleToggleActive(row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right" align="center">
          <template #default="{ row }">
            <el-button
              size="small"
              :type="row.isActive ? 'warning' : 'success'"
              @click="handleToggleActive(row)"
            >
              {{ row.isActive ? '禁用' : '启用' }}
            </el-button>
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
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search } from '@element-plus/icons-vue';
import { UserRole, RoleMap } from '@/types';
import type { User } from '@/types';
import api from '@/utils/api';

const loading = ref(false);
const users = ref<User[]>([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);
const searchKeyword = ref('');
const filterRole = ref<UserRole | ''>('');
const togglingId = ref<number | null>(null);

function formatTime(dateStr: string) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('zh-CN');
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
    if (searchKeyword.value) params.keyword = searchKeyword.value;
    if (filterRole.value) params.role = filterRole.value;

    const res: any = await api.get('/users', { params });
    users.value = res.users || res.data || res;
    total.value = res.total ?? (Array.isArray(res) ? res.length : 0);
  } catch {
    ElMessage.error('获取用户列表失败');
  } finally {
    loading.value = false;
  }
}

async function handleToggleActive(row: User) {
  const action = row.isActive ? '禁用' : '启用';
  try {
    await ElMessageBox.confirm(
      `确定要${action}用户「${row.username}」吗？`,
      `${action}用户`,
      { type: 'warning' },
    );
    togglingId.value = row.id;
    await api.put(`/users/${row.id}/toggle-active`);
    ElMessage.success(`用户已${action}`);
    fetchData();
  } catch {
    // cancelled or error
  } finally {
    togglingId.value = null;
  }
}

onMounted(() => {
  fetchData();
});
</script>

<style scoped lang="scss">
.user-management {
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
