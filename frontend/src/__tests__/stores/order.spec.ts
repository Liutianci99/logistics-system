import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useOrderStore } from '@/stores/order';

vi.mock('@/utils/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

import api from '@/utils/api';

describe('Order Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  describe('fetchOrders', () => {
    it('should fetch orders and update state', async () => {
      const mockData = {
        orders: [{ id: 1, orderNo: 'ORD001', status: 'pending' }],
        total: 1,
      };
      vi.mocked(api.get).mockResolvedValue(mockData);

      const store = useOrderStore();
      await store.fetchOrders({ page: 1 });

      expect(api.get).toHaveBeenCalledWith('/orders', { params: { page: 1 } });
      expect(store.orders).toEqual(mockData.orders);
      expect(store.total).toBe(1);
      expect(store.loading).toBe(false);
    });

    it('should set loading to false even on error', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('fail'));

      const store = useOrderStore();
      await expect(store.fetchOrders()).rejects.toThrow();
      expect(store.loading).toBe(false);
    });
  });

  describe('createOrder', () => {
    it('should call api to create order', async () => {
      const orderData = { productId: 1, quantity: 2, shippingAddress: 'addr', receiverName: 'name', receiverPhone: '123' };
      vi.mocked(api.post).mockResolvedValue({ id: 1 });

      const store = useOrderStore();
      await store.createOrder(orderData);

      expect(api.post).toHaveBeenCalledWith('/orders', orderData);
    });
  });

  describe('order status transitions', () => {
    it('should confirm order', async () => {
      vi.mocked(api.put).mockResolvedValue({ id: 1, status: 'confirmed' });
      const store = useOrderStore();
      await store.confirmOrder(1);
      expect(api.put).toHaveBeenCalledWith('/orders/1/confirm');
    });

    it('should pick up order', async () => {
      vi.mocked(api.put).mockResolvedValue({ id: 1, status: 'picked_up' });
      const store = useOrderStore();
      await store.pickUpOrder(1);
      expect(api.put).toHaveBeenCalledWith('/orders/1/pickup');
    });

    it('should start delivery', async () => {
      vi.mocked(api.put).mockResolvedValue({ id: 1, status: 'in_transit' });
      const store = useOrderStore();
      await store.startDelivery(1);
      expect(api.put).toHaveBeenCalledWith('/orders/1/start-delivery');
    });

    it('should deliver order', async () => {
      vi.mocked(api.put).mockResolvedValue({ id: 1, status: 'delivered' });
      const store = useOrderStore();
      await store.deliverOrder(1);
      expect(api.put).toHaveBeenCalledWith('/orders/1/deliver');
    });

    it('should sign order', async () => {
      vi.mocked(api.put).mockResolvedValue({ id: 1, status: 'signed' });
      const store = useOrderStore();
      await store.signOrder(1);
      expect(api.put).toHaveBeenCalledWith('/orders/1/sign');
    });

    it('should cancel order', async () => {
      vi.mocked(api.put).mockResolvedValue({ id: 1, status: 'cancelled' });
      const store = useOrderStore();
      await store.cancelOrder(1);
      expect(api.put).toHaveBeenCalledWith('/orders/1/cancel');
    });

    it('should mark order as abnormal', async () => {
      vi.mocked(api.put).mockResolvedValue({ id: 1, status: 'abnormal' });
      const store = useOrderStore();
      await store.markAbnormal(1, 'damaged');
      expect(api.put).toHaveBeenCalledWith('/orders/1/abnormal', { reason: 'damaged' });
    });
  });
});
