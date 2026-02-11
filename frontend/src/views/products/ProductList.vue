<template>
  <div class="product-list page-container">
    <h2 class="page-title">商品管理</h2>

    <!-- 工具栏 -->
    <el-card shadow="never" class="toolbar-card">
      <el-row :gutter="16" align="middle" justify="space-between">
        <el-col :span="8">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索商品名称"
            clearable
            @clear="fetchData"
            @keyup.enter="fetchData"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
        <el-col :span="4" style="text-align: right">
          <el-button type="primary" :icon="Plus" @click="openCreateDialog">
            添加商品
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 商品表格 -->
    <el-card shadow="never">
      <el-table v-loading="loading" :data="products" stripe style="width: 100%">
        <el-table-column prop="name" label="商品名称" min-width="160" />
        <el-table-column label="价格" width="120" align="right">
          <template #default="{ row }">
            ¥{{ Number(row.price).toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="stock" label="库存" width="100" align="center" />
        <el-table-column prop="category" label="分类" width="120">
          <template #default="{ row }">
            {{ row.category || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'info'" size="small">
              {{ row.isActive ? '上架' : '下架' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="openEditDialog(row)">编辑</el-button>
            <el-button
              size="small"
              :type="row.isActive ? 'warning' : 'success'"
              @click="toggleProductStatus(row)"
            >
              {{ row.isActive ? '下架' : '上架' }}
            </el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
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

    <!-- 添加/编辑商品对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑商品' : '添加商品'"
      width="560px"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="80px"
      >
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入商品名称" />
        </el-form-item>
        <el-form-item label="价格" prop="price">
          <el-input-number
            v-model="form.price"
            :min="0.01"
            :precision="2"
            :step="1"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="库存" prop="stock">
          <el-input-number v-model="form.stock" :min="0" :step="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="分类" prop="category">
          <el-input v-model="form.category" placeholder="请输入商品分类" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入商品描述"
          />
        </el-form-item>
        <el-form-item label="图片链接" prop="imageUrl">
          <el-input v-model="form.imageUrl" placeholder="请输入图片URL（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          {{ isEdit ? '保存' : '添加' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import { Search, Plus } from '@element-plus/icons-vue';
import { useAuthStore } from '@/stores/auth';
import { UserRole } from '@/types';
import type { Product } from '@/types';
import api from '@/utils/api';

const router = useRouter();
const authStore = useAuthStore();

// 非商家用户跳转到商城
if (authStore.userRole === UserRole.CUSTOMER) {
  router.replace('/shop');
}

const loading = ref(false);
const submitting = ref(false);
const products = ref<Product[]>([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);
const searchKeyword = ref('');

const dialogVisible = ref(false);
const isEdit = ref(false);
const editingId = ref<number | null>(null);
const formRef = ref<FormInstance>();

const defaultForm = {
  name: '',
  price: 0,
  stock: 0,
  category: '',
  description: '',
  imageUrl: '',
};

const form = reactive({ ...defaultForm });

const formRules: FormRules = {
  name: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
  price: [{ required: true, message: '请输入价格', trigger: 'blur' }],
  stock: [{ required: true, message: '请输入库存', trigger: 'blur' }],
};

function formatTime(dateStr: string) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('zh-CN');
}

async function fetchData() {
  loading.value = true;
  try {
    const params: any = {
      page: currentPage.value,
      limit: pageSize.value,
    };
    if (searchKeyword.value) params.keyword = searchKeyword.value;
    const res: any = await api.get('/products', { params });
    products.value = res.products || res.data || res;
    total.value = res.total ?? (Array.isArray(res) ? res.length : 0);
  } catch {
    ElMessage.error('获取商品列表失败');
  } finally {
    loading.value = false;
  }
}

function openCreateDialog() {
  isEdit.value = false;
  editingId.value = null;
  Object.assign(form, defaultForm);
  dialogVisible.value = true;
}

function openEditDialog(row: Product) {
  isEdit.value = true;
  editingId.value = row.id;
  Object.assign(form, {
    name: row.name,
    price: row.price,
    stock: row.stock,
    category: row.category || '',
    description: row.description || '',
    imageUrl: row.imageUrl || '',
  });
  dialogVisible.value = true;
}

async function handleSubmit() {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    submitting.value = true;
    try {
      if (isEdit.value && editingId.value) {
        await api.put(`/products/${editingId.value}`, { ...form });
        ElMessage.success('商品已更新');
      } else {
        await api.post('/products', { ...form });
        ElMessage.success('商品已添加');
      }
      dialogVisible.value = false;
      fetchData();
    } catch {
      ElMessage.error(isEdit.value ? '更新失败' : '添加失败');
    } finally {
      submitting.value = false;
    }
  });
}

async function toggleProductStatus(row: Product) {
  const action = row.isActive ? '下架' : '上架';
  try {
    await ElMessageBox.confirm(`确定要${action}该商品吗？`, `${action}商品`, { type: 'warning' });
    await api.put(`/products/${row.id}`, { isActive: !row.isActive });
    ElMessage.success(`商品已${action}`);
    fetchData();
  } catch {
    // cancelled
  }
}

async function handleDelete(row: Product) {
  try {
    await ElMessageBox.confirm('确定要删除该商品吗？此操作不可撤销。', '删除商品', {
      type: 'error',
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
    });
    await api.delete(`/products/${row.id}`);
    ElMessage.success('商品已删除');
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
.product-list {
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
