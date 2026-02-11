import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { User } from '../../entities/user.entity';
import { Order } from '../../entities/order.entity';
import { OrderLog } from '../../entities/order-log.entity';
import { OrderStatus } from '../../common/enums';

describe('AdminService', () => {
  let service: AdminService;
  let userRepo: any;
  let orderRepo: any;
  let orderLogRepo: any;

  const mockUserRepo = {
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    findAndCount: jest.fn(),
  };
  const mockOrderRepo = {
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  const mockOrderLogRepo = {
    findAndCount: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: getRepositoryToken(Order), useValue: mockOrderRepo },
        { provide: getRepositoryToken(OrderLog), useValue: mockOrderLogRepo },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    userRepo = mockUserRepo;
    orderRepo = mockOrderRepo;
    orderLogRepo = mockOrderLogRepo;
    jest.clearAllMocks();
  });

  describe('getDashboard', () => {
    it('should return dashboard statistics', async () => {
      userRepo.count.mockResolvedValue(10);
      orderRepo.count
        .mockResolvedValueOnce(50)   // totalOrders
        .mockResolvedValueOnce(5)    // pendingOrders
        .mockResolvedValueOnce(2)    // abnormalOrders
        .mockResolvedValueOnce(30);  // completedOrders

      const mockQb = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([{ role: 'customer', count: '5' }]),
      };
      userRepo.createQueryBuilder.mockReturnValue(mockQb);
      orderRepo.createQueryBuilder.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([{ status: 'pending', count: '5' }]),
      });

      const result = await service.getDashboard();

      expect(result.totalUsers).toBe(10);
      expect(result.totalOrders).toBe(50);
      expect(result.pendingOrders).toBe(5);
      expect(result.abnormalOrders).toBe(2);
      expect(result.completedOrders).toBe(30);
      expect(result.usersByRole).toBeDefined();
      expect(result.ordersByStatus).toBeDefined();
    });
  });

  describe('getAllLogs', () => {
    it('should return paginated logs', async () => {
      const mockQb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[{ id: 1, action: 'test' }], 1]),
      };
      orderLogRepo.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.getAllLogs({ page: 1, limit: 50 });

      expect(result.logs).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should filter logs by action', async () => {
      const mockQb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };
      orderLogRepo.createQueryBuilder.mockReturnValue(mockQb);

      await service.getAllLogs({ page: 1, limit: 50, action: '创建订单' });

      expect(mockQb.where).toHaveBeenCalledWith('log.action = :action', { action: '创建订单' });
    });
  });

  describe('getUsers', () => {
    it('should return paginated user list', async () => {
      userRepo.findAndCount.mockResolvedValue([[{ id: 1, username: 'test' }], 1]);

      const result = await service.getUsers(1, 20);

      expect(result.users).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });
  });
});
