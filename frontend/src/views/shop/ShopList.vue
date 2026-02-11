<template>
  <div class="shop-list page-container">
    <h2 class="page-title">商品浏览</h2>

    <!-- 搜索栏 -->
    <el-card shadow="never" class="filter-card">
      <el-row :gutter="16" align="middle">
        <el-col :span="8">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索商品"
            clearable
            @clear="fetchProducts"
            @keyup.enter="fetchProducts"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
        <el-col :span="6">
          <el-input
            v-model="searchCategory"
            placeholder="按分类筛选"
            clearable
            @clear="fetchProducts"
            @keyup.enter="fetchProducts"
          />
        </el-col>
        <el-col :span="4">
          <el-button type="primary" @click="fetchProducts">搜索</el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 商品列表 -->
    <div v-loading="loading">
      <el-row :gutter="20" v-if="products.length > 0">
        <el-col
          v-for="product in products"
          :key="product.id"
          :xs="24"
          :sm="12"
          :md="8"
          :lg="6"
        >
          <el-card shadow="hover" class="product-card" :body-style="{ padding: '0' }">
            <div class="product-image">
              <el-image
                v-if="product.imageUrl"
                :src="product.imageUrl"
                fit="cover"
                style="width: 100%; height: 180px"
              >
                <template #error>
                  <div class="image-placeholder">
                    <el-icon :size="40"><Picture /></el-icon>
                  </div>
                </template>
              </el-image>
              <div v-else class="image-placeholder">
                <el-icon :size="40"><Picture /></el-icon>
              </div>
            </div>
            <div class="product-info">
              <h3 class="product-name">{{ product.name }}</h3>
              <p class="product-desc">{{ product.description || '暂无描述' }}</p>
              <div class="product-meta">
                <span class="product-price">¥{{ Number(product.price).toFixed(2) }}</span>
                <span class="product-stock" :class="{ 'out-of-stock': product.stock <= 0 }">
                  {{ product.stock > 0 ? `库存: ${product.stock}` : '暂无库存' }}
                </span>
              </div>
              <el-button
                type="primary"
                class="buy-btn"
                :disabled="product.stock <= 0"
                @click="openOrderDialog(product)"
              >
                下单
              </el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-empty v-else-if="!loading" description="暂无商品" />

      <!-- 分页 -->
      <div class="pagination-wrapper" v-if="total > pageSize">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[12, 24, 48]"
          :total="total"
          layout="total, sizes, prev, pager, next"
          background
          @size-change="fetchProducts"
          @current-change="fetchProducts"
        />
      </div>
    </div>

    <!-- 下单对话框 -->
    <el-dialog v-model="orderDialogVisible" title="下单" width="500px" destroy-on-close>
      <div v-if="selectedProduct" class="order-product-summary">
        <h4>{{ selectedProduct.name }}</h4>
        <p>单价：¥{{ Number(selectedProduct.price).toFixed(2) }}</p>
      </div>
      <el-form
        ref="orderFormRef"
        :model="orderForm"
        :rules="orderRules"
        label-width="100px"
      >
        <el-form-item label="购买数量" prop="quantity">
          <el-input-number
            v-model="orderForm.quantity"
            :min="1"
            :max="selectedProduct?.stock || 999"
            :step="1"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="收货地址" prop="shippingAddress">
          <el-input v-model="orderForm.shippingAddress" placeholder="请输入收货地址" />
        </el-form-item>
        <el-form-item label="收件人" prop="receiverName">
          <el-input v-model="orderForm.receiverName" placeholder="请输入收件人姓名" />
        </el-form-item>
        <el-form-item label="联系电话" prop="receiverPhone">
          <el-input v-model="orderForm.receiverPhone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="orderForm.remark"
            type="textarea"
            :rows="2"
            placeholder="选填"
          />
        </el-form-item>
        <el-form-item label="合计">
          <span class="order-total">
            ¥{{ orderTotal }}
          </span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="orderDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitOrder">
          确认下单
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { Search, Picture } from '@element-plus/icons-vue';
import { useOrderStore } from '@/stores/order';
import { useAuthStore } from '@/stores/auth';
import type { Product } from '@/types';
import api from '@/utils/api';

const orderStore = useOrderStore();
const authStore = useAuthStore();

const loading = ref(false);
const submitting = ref(false);
const products = ref<Product[]>([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(12);
const searchKeyword = ref('');
const searchCategory = ref('');

const orderDialogVisible = ref(false);
const selectedProduct = ref<Product | null>(null);
const orderFormRef = ref<FormInstance>();

const orderForm = reactive({
  quantity: 1,
  shippingAddress: '',
  receiverName: '',
  receiverPhone: '',
  remark: '',
});

const orderRules: FormRules = {
  quantity: [{ required: true, message: '请输入购买数量', trigger: 'blur' }],
  shippingAddress: [{ required: true, message: '请输入收货地址', trigger: 'blur' }],
  receiverName: [{ required: true, message: '请输入收件人姓名', trigger: 'blur' }],
  receiverPhone: [{ required: true, message: '请输入联系电话', trigger: 'blur' }],
};

const orderTotal = computed(() => {
  if (!selectedProduct.value) return '0.00';
  return (selectedProduct.value.price * orderForm.quantity).toFixed(2);
});

async function fetchProducts() {
  loading.value = true;
  try {
    const params: any = {
      page: currentPage.value,
      limit: pageSize.value,
    };
    if (searchKeyword.value) params.keyword = searchKeyword.value;
    if (searchCategory.value) params.category = searchCategory.value;
    const res: any = await api.get('/products', { params });
    products.value = res.products || res.data || res;
    total.value = res.total ?? (Array.isArray(res) ? res.length : 0);
  } catch {
    ElMessage.error('获取商品列表失败');
  } finally {
    loading.value = false;
  }
}

function openOrderDialog(product: Product) {
  selectedProduct.value = product;
  orderForm.quantity = 1;
  orderForm.shippingAddress = authStore.user?.address || '';
  orderForm.receiverName = authStore.user?.realName || '';
  orderForm.receiverPhone = authStore.user?.phone || '';
  orderForm.remark = '';
  orderDialogVisible.value = true;
}

async function submitOrder() {
  if (!orderFormRef.value || !selectedProduct.value) return;
  await orderFormRef.value.validate(async (valid) => {
    if (!valid) return;
    submitting.value = true;
    try {
      await orderStore.createOrder({
        productId: selectedProduct.value!.id,
        quantity: orderForm.quantity,
        shippingAddress: orderForm.shippingAddress,
        receiverName: orderForm.receiverName,
        receiverPhone: orderForm.receiverPhone,
        remark: orderForm.remark || undefined,
      });
      ElMessage.success('下单成功！');
      orderDialogVisible.value = false;
      fetchProducts(); // 刷新库存
    } catch {
      ElMessage.error('下单失败');
    } finally {
      submitting.value = false;
    }
  });
}

onMounted(() => {
  fetchProducts();
});
</script>

<style scoped lang="scss">
.shop-list {
  .filter-card {
    margin-bottom: 20px;
  }

  .product-card {
    margin-bottom: 20px;
    transition: transform 0.2s;

    &:hover {
      transform: translateY(-4px);
    }

    .product-image {
      height: 180px;
      overflow: hidden;
      background-color: #f5f7fa;
    }

    .image-placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 180px;
      background-color: #f5f7fa;
      color: #c0c4cc;
    }

    .product-info {
      padding: 16px;

      .product-name {
        margin: 0 0 8px;
        font-size: 16px;
        font-weight: 600;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .product-desc {
        margin: 0 0 12px;
        font-size: 13px;
        color: #909399;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .product-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;

        .product-price {
          font-size: 20px;
          font-weight: 700;
          color: #f56c6c;
        }

        .product-stock {
          font-size: 12px;
          color: #909399;

          &.out-of-stock {
            color: #f56c6c;
          }
        }
      }

      .buy-btn {
        width: 100%;
      }
    }
  }

  .pagination-wrapper {
    display: flex;
    justify-content: center;
    margin-top: 20px;
  }

  .order-product-summary {
    margin-bottom: 16px;
    padding: 12px 16px;
    background: #f5f7fa;
    border-radius: 8px;

    h4 {
      margin: 0 0 4px;
    }
    p {
      margin: 0;
      color: #f56c6c;
      font-weight: 600;
    }
  }

  .order-total {
    font-size: 22px;
    font-weight: 700;
    color: #f56c6c;
  }
}
</style>
