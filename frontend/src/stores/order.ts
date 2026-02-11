import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '@/utils/api';
import type { Order } from '@/types';

export const useOrderStore = defineStore('order', () => {
  const orders = ref<Order[]>([]);
  const currentOrder = ref<Order | null>(null);
  const total = ref(0);
  const loading = ref(false);

  async function fetchOrders(params: any = {}) {
    loading.value = true;
    try {
      const res: any = await api.get('/orders', { params });
      orders.value = res.orders;
      total.value = res.total;
    } finally {
      loading.value = false;
    }
  }

  async function fetchOrderDetail(id: number) {
    const res: any = await api.get(`/orders/${id}`);
    currentOrder.value = res;
    return res;
  }

  async function createOrder(data: any) {
    return api.post('/orders', data);
  }

  async function confirmOrder(id: number) {
    return api.put(`/orders/${id}/confirm`);
  }

  async function pickUpOrder(id: number) {
    return api.put(`/orders/${id}/pickup`);
  }

  async function startDelivery(id: number) {
    return api.put(`/orders/${id}/start-delivery`);
  }

  async function deliverOrder(id: number) {
    return api.put(`/orders/${id}/deliver`);
  }

  async function signOrder(id: number) {
    return api.put(`/orders/${id}/sign`);
  }

  async function cancelOrder(id: number) {
    return api.put(`/orders/${id}/cancel`);
  }

  async function markAbnormal(id: number, reason: string) {
    return api.put(`/orders/${id}/abnormal`, { reason });
  }

  return {
    orders,
    currentOrder,
    total,
    loading,
    fetchOrders,
    fetchOrderDetail,
    createOrder,
    confirmOrder,
    pickUpOrder,
    startDelivery,
    deliverOrder,
    signOrder,
    cancelOrder,
    markAbnormal,
  };
});
