import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '@/utils/api';
import type { User, LoginForm, RegisterForm, UserRole } from '@/types';

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string>(localStorage.getItem('token') || '');
  const user = ref<User | null>(JSON.parse(localStorage.getItem('user') || 'null'));

  const isLoggedIn = computed(() => !!token.value);
  const userRole = computed(() => user.value?.role);

  async function login(form: LoginForm) {
    const res: any = await api.post('/auth/login', form);
    token.value = res.access_token;
    user.value = res.user;
    localStorage.setItem('token', res.access_token);
    localStorage.setItem('user', JSON.stringify(res.user));
    return res;
  }

  async function register(form: RegisterForm) {
    const res: any = await api.post('/auth/register', form);
    return res;
  }

  async function fetchProfile() {
    const res: any = await api.get('/auth/profile');
    user.value = res;
    localStorage.setItem('user', JSON.stringify(res));
    return res;
  }

  function logout() {
    token.value = '';
    user.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  return {
    token,
    user,
    isLoggedIn,
    userRole,
    login,
    register,
    fetchProfile,
    logout,
  };
});
