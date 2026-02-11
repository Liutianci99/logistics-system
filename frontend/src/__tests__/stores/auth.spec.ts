import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from '@/stores/auth';

vi.mock('@/utils/api', () => ({
  default: { post: vi.fn(), get: vi.fn() },
}));

import api from '@/utils/api';

describe('Auth Store', () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('should have default state', () => {
    const store = useAuthStore();
    expect(store.token).toBe('');
    expect(store.user).toBeNull();
    expect(store.isLoggedIn).toBe(false);
  });

  it('should login successfully', async () => {
    const res = { access_token: 'tok', user: { id: 1, username: 'u', role: 'customer' } };
    vi.mocked(api.post).mockResolvedValue(res);
    const store = useAuthStore();
    await store.login({ username: 'u', password: '123456' });
    expect(store.token).toBe('tok');
    expect(store.user).toEqual(res.user);
    expect(store.isLoggedIn).toBe(true);
    expect(localStorage.setItem).toHaveBeenCalledWith('token', 'tok');
  });

  it('should throw on login failure', async () => {
    vi.mocked(api.post).mockRejectedValue(new Error('fail'));
    const store = useAuthStore();
    await expect(store.login({ username: 'x', password: 'x' })).rejects.toThrow();
    expect(store.token).toBe('');
  });

  it('should register successfully', async () => {
    const res = { message: '注册成功', user: { id: 1 } };
    vi.mocked(api.post).mockResolvedValue(res);
    const store = useAuthStore();
    const r = await store.register({ username: 'n', password: '123456', role: 'customer' as any });
    expect(r).toEqual(res);
  });

  it('should throw on duplicate registration', async () => {
    vi.mocked(api.post).mockRejectedValue(new Error('exists'));
    const store = useAuthStore();
    await expect(store.register({ username: 'e', password: '1', role: 'customer' as any })).rejects.toThrow();
  });

  it('should clear state on logout', async () => {
    vi.mocked(api.post).mockResolvedValue({ access_token: 't', user: { id: 1, username: 'u', role: 'customer' } });
    const store = useAuthStore();
    await store.login({ username: 'u', password: '1' });
    store.logout();
    expect(store.token).toBe('');
    expect(store.user).toBeNull();
    expect(localStorage.removeItem).toHaveBeenCalledWith('token');
    expect(localStorage.removeItem).toHaveBeenCalledWith('user');
  });

  it('should read token from localStorage on init', () => {
    localStorage.setItem('token', 'persisted');
    localStorage.setItem('user', JSON.stringify({ id: 1, username: 't', role: 'customer' }));
    setActivePinia(createPinia());
    const store = useAuthStore();
    expect(store.token).toBe('persisted');
    expect(store.isLoggedIn).toBe(true);
  });
});
