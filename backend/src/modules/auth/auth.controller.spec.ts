import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    register: jest.fn().mockResolvedValue({ message: '注册成功', user: { id: 1, username: 'test' } }),
    login: jest.fn().mockResolvedValue({ message: '登录成功', access_token: 'test_token' }),
    getProfile: jest.fn().mockResolvedValue({ id: 1, username: 'test' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should register a user', async () => {
    const result = await controller.register({ username: 'test', password: 'password123' });
    expect(result.message).toBe('注册成功');
  });

  it('should login a user', async () => {
    const result = await controller.login({ username: 'test', password: 'password123' });
    expect(result.access_token).toBe('test_token');
  });
});
