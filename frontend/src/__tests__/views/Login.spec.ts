import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import Login from '@/views/Login.vue';
import { useAuthStore } from '@/stores/auth';

vi.mock('@/utils/api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  createRouter: vi.fn(),
  createWebHistory: vi.fn(),
}));

vi.mock('element-plus', () => ({
  ElMessage: {
    success: vi.fn(),
    error: vi.fn(),
  },
  ElCard: { name: 'ElCard', template: '<div><slot /><slot name="header" /></div>' },
  ElForm: {
    name: 'ElForm',
    template: '<form><slot /></form>',
    methods: { validate: (cb: any) => cb(true) },
  },
  ElFormItem: { name: 'ElFormItem', template: '<div><slot /></div>' },
  ElInput: { name: 'ElInput', template: '<input />', props: ['modelValue'] },
  ElButton: { name: 'ElButton', template: '<button><slot /></button>', props: ['loading'] },
}));

describe('Login.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('should render login form', () => {
    const wrapper = mount(Login, {
      global: {
        plugins: [createPinia()],
        stubs: {
          'router-link': { template: '<a><slot /></a>' },
          'el-card': { template: '<div><slot /><slot name="header" /></div>' },
          'el-form': { template: '<form><slot /></form>' },
          'el-form-item': { template: '<div><slot /></div>' },
          'el-input': { template: '<input />', props: ['modelValue'] },
          'el-button': { template: '<button><slot /></button>' },
        },
      },
    });

    expect(wrapper.find('.login-container').exists()).toBe(true);
    expect(wrapper.text()).toContain('物流管理系统');
    expect(wrapper.text()).toContain('用户登录');
  });

  it('should render username and password fields', () => {
    const wrapper = mount(Login, {
      global: {
        plugins: [createPinia()],
        stubs: {
          'router-link': { template: '<a><slot /></a>' },
          'el-card': { template: '<div><slot /><slot name="header" /></div>' },
          'el-form': { template: '<form><slot /></form>' },
          'el-form-item': { template: '<div class="form-item"><slot /></div>' },
          'el-input': { template: '<input />', props: ['modelValue'] },
          'el-button': { template: '<button><slot /></button>' },
        },
      },
    });

    expect(wrapper.text()).toContain('登 录');
    expect(wrapper.text()).toContain('还没有账号');
  });

  it('should have a link to register page', () => {
    const wrapper = mount(Login, {
      global: {
        plugins: [createPinia()],
        stubs: {
          'router-link': { template: '<a class="register-link"><slot /></a>', props: ['to'] },
          'el-card': { template: '<div><slot /><slot name="header" /></div>' },
          'el-form': { template: '<form><slot /></form>' },
          'el-form-item': { template: '<div><slot /></div>' },
          'el-input': { template: '<input />', props: ['modelValue'] },
          'el-button': { template: '<button><slot /></button>' },
        },
      },
    });

    expect(wrapper.find('.register-link').exists()).toBe(true);
    expect(wrapper.text()).toContain('立即注册');
  });
});
