import { describe, it, expect } from 'vitest';
import App from '../App.vue';

describe('App', () => {
  it('should exist as a module', () => {
    expect(App).toBeTruthy();
  });

  it('should be a valid Vue component', () => {
    expect(typeof App).toBe('object');
  });
});
