import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { User } from '../../entities/user.entity';
import { UserRole, DeliveryStatus } from '../../common/enums';

jest.mock('bcryptjs');

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: any;
  let jwtService: any;

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = mockUserRepository;
    jwtService = mockJwtService;
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const dto = { username: 'newuser', password: '123456', role: UserRole.CUSTOMER };
      userRepository.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      const savedUser = { id: 1, username: 'newuser', password: 'hashed-password', role: UserRole.CUSTOMER };
      userRepository.create.mockReturnValue(savedUser);
      userRepository.save.mockResolvedValue(savedUser);

      const result = await service.register(dto);

      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { username: 'newuser' } });
      expect(bcrypt.hash).toHaveBeenCalledWith('123456', 10);
      expect(result.message).toBe('注册成功');
      expect(result.user).not.toHaveProperty('password');
    });

    it('should throw ConflictException for duplicate username', async () => {
      userRepository.findOne.mockResolvedValue({ id: 1, username: 'existing' });

      await expect(
        service.register({ username: 'existing', password: '123456' } as any),
      ).rejects.toThrow(ConflictException);
    });

    it('should set delivery status for delivery role', async () => {
      const dto = { username: 'driver1', password: '123456', role: UserRole.DELIVERY };
      userRepository.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      userRepository.create.mockImplementation((data: any) => data);
      userRepository.save.mockImplementation((data: any) => ({ id: 1, ...data }));

      await service.register(dto);

      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ deliveryStatus: DeliveryStatus.AVAILABLE }),
      );
    });
  });

  describe('login', () => {
    it('should login and return JWT token', async () => {
      const user = {
        id: 1, username: 'testuser', password: 'hashed', role: UserRole.CUSTOMER,
        isActive: true, realName: 'Test', email: 'test@test.com',
      };
      userRepository.findOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login({ username: 'testuser', password: '123456' });

      expect(result.access_token).toBe('mock-jwt-token');
      expect(result.user.username).toBe('testuser');
      expect(jwtService.sign).toHaveBeenCalledWith({ sub: 1, username: 'testuser', role: UserRole.CUSTOMER });
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.login({ username: 'noone', password: '123456' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      userRepository.findOne.mockResolvedValue({
        id: 1, username: 'testuser', password: 'hashed', isActive: true,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ username: 'testuser', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for disabled user', async () => {
      userRepository.findOne.mockResolvedValue({
        id: 1, username: 'disabled', password: 'hashed', isActive: false,
      });

      await expect(
        service.login({ username: 'disabled', password: '123456' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getProfile', () => {
    it('should return user profile without password', async () => {
      userRepository.findOne.mockResolvedValue({
        id: 1, username: 'test', password: 'hashed', role: UserRole.CUSTOMER,
      });

      const result = await service.getProfile(1);
      expect(result).not.toHaveProperty('password');
      expect(result.username).toBe('test');
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      userRepository.findOne.mockResolvedValue(null);
      await expect(service.getProfile(999)).rejects.toThrow(UnauthorizedException);
    });
  });
});
