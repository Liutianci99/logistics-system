import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import Dashboard from '@/views/Dashboard.vue';
import { useAuthStore } from '@/stores/auth';
import { UserRole } from '@/types';

vi.mock('@/utils/api', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ total: 0, orders: [] }),
    post: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

const stubs = {
  'el-row': { template: '<div class="el-row"><slot /></div>' },
  'el-col': { template: '<div class="el-col"><slot /></div>' },
  'el-card': { template: '<div class="el-card"><slot /></div>' },
  'el-statistic': {
    template: '<div class="el-statistic">{{ title }}: {{ value }}<slot name="suffix" /></div>',
    props: ['title', 'value'],
  },
};

describe('Dashboard.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  function mountWithRole(role: UserRole, username = 'testuser') {
    const pinia = createPinia();
    setActivePinia(pinia);
    const store = useAuthStore();
    store.user = { id: 1, username, role, isActive: true, createdAt: '' } as any;
    store.token = 'test-token';

    return mount(Dashboard, {
      global: { plugins: [pinia], stubs },
    });
  }

  it('should display greeting with username', () => {
    const wrapper = mountWithRole(UserRole.CUSTOMER, 'alice');
    expect(wrapper.text()).toContain('alice');
  });

  it('should show customer dashboard for customer role', () => {
    const wrapper = mountWithRole(UserRole.CUSTOMER);
    expect(wrapper.text()).toContain('我的订单');
    expect(wrapper.text()).toContain('待收货');
    expect(wrapper.text()).toContain('已完成');
  });

  it('should show merchant dashboard for merchant role', () => {
    const wrapper = mountWithRole(UserRole.MERCHANT);
    expect(wrapper.text()).toContain('待处理订单');
    expect(wrapper.text()).toContain('商品数量');
    expect(wrapper.text()).toContain('总订单数');
  });

  it('should show delivery dashboard for delivery role', () => {
    const wrapper = mountWithRole(UserRole.DELIVERY);
    expect(wrapper.text()).toContain('待配送任务');
    expect(wrapper.text()).toContain('已完成配送');
    expect(wrapper.text()).toContain('总配送单');
  });

  it('should show admin dashboard for admin role', () => {
    const wrapper = mountWithRole(UserRole.ADMIN);
    expect(wrapper.text()).toContain('总用户数');
    expect(wrapper.text()).toContain('总订单数');
    expect(wrapper.text()).toContain('异常订单');
    expect(wrapper.text()).toContain('今日订单');
  });
});
