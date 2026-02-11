import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { Order } from '../../entities/order.entity';
import { OrderLog } from '../../entities/order-log.entity';
import { User } from '../../entities/user.entity';
import { Product } from '../../entities/product.entity';
import { OrderStatus, UserRole, DeliveryStatus } from '../../common/enums';

describe('OrdersService', () => {
  let service: OrdersService;
  let orderRepo: any;
  let orderLogRepo: any;
  let userRepo: any;
  let productRepo: any;

  const mockOrderRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  const mockOrderLogRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findAndCount: jest.fn(),
  };
  const mockUserRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
  };
  const mockProductRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: getRepositoryToken(Order), useValue: mockOrderRepo },
        { provide: getRepositoryToken(OrderLog), useValue: mockOrderLogRepo },
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: getRepositoryToken(Product), useValue: mockProductRepo },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    orderRepo = mockOrderRepo;
    orderLogRepo = mockOrderLogRepo;
    userRepo = mockUserRepo;
    productRepo = mockProductRepo;
    jest.clearAllMocks();
    // Default: log creation always succeeds
    orderLogRepo.create.mockReturnValue({});
    orderLogRepo.save.mockResolvedValue({});
  });

  describe('createOrder', () => {
    it('should create an order successfully', async () => {
      const product = { id: 1, name: 'Widget', price: 10, stock: 100, merchantId: 2 };
      productRepo.findOne.mockResolvedValue(product);
      userRepo.findOne.mockResolvedValue({ id: 2, address: 'Merchant Addr' });
      const savedOrder = { id: 1, orderNo: 'ORD001', status: OrderStatus.PENDING };
      orderRepo.create.mockReturnValue(savedOrder);
      orderRepo.save.mockResolvedValue(savedOrder);
      productRepo.save.mockResolvedValue({ ...product, stock: 98 });

      const result = await service.createOrder(1, {
        productId: 1, quantity: 2, shippingAddress: 'addr',
        receiverName: 'Bob', receiverPhone: '123',
      });

      expect(result).toEqual(savedOrder);
      expect(productRepo.save).toHaveBeenCalledWith(expect.objectContaining({ stock: 98 }));
    });

    it('should throw NotFoundException for non-existent product', async () => {
      productRepo.findOne.mockResolvedValue(null);

      await expect(
        service.createOrder(1, { productId: 999, quantity: 1, shippingAddress: 'a', receiverName: 'b', receiverPhone: 'c' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for insufficient stock', async () => {
      productRepo.findOne.mockResolvedValue({ id: 1, stock: 1, price: 10, merchantId: 2 });

      await expect(
        service.createOrder(1, { productId: 1, quantity: 5, shippingAddress: 'a', receiverName: 'b', receiverPhone: 'c' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('confirmOrder', () => {
    it('should confirm order and auto-assign delivery', async () => {
      const order = { id: 1, merchantId: 2, status: OrderStatus.PENDING };
      orderRepo.findOne.mockResolvedValueOnce(order);
      orderRepo.save.mockResolvedValue(order);
      // autoAssignDelivery: find available delivery person
      const deliveryPerson = { id: 5, role: UserRole.DELIVERY, deliveryStatus: DeliveryStatus.AVAILABLE, isActive: true, username: 'driver' };
      userRepo.findOne.mockResolvedValue(deliveryPerson);
      userRepo.save.mockResolvedValue(deliveryPerson);

      const result = await service.confirmOrder(2, 1);

      expect(orderRepo.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException if order is not pending', async () => {
      orderRepo.findOne.mockResolvedValue({ id: 1, merchantId: 2, status: OrderStatus.CONFIRMED });

      await expect(service.confirmOrder(2, 1)).rejects.toThrow(BadRequestException);
    });
  });

  describe('pickUpOrder', () => {
    it('should pick up an assigned order', async () => {
      const order = { id: 1, deliveryPersonId: 5, status: OrderStatus.ASSIGNED };
      orderRepo.findOne.mockResolvedValue(order);
      orderRepo.save.mockResolvedValue({ ...order, status: OrderStatus.PICKED_UP });

      const result = await service.pickUpOrder(5, 1);
      expect(orderRepo.save).toHaveBeenCalledWith(expect.objectContaining({ status: OrderStatus.PICKED_UP }));
    });

    it('should throw if order is not assigned', async () => {
      orderRepo.findOne.mockResolvedValue({ id: 1, deliveryPersonId: 5, status: OrderStatus.PENDING });
      await expect(service.pickUpOrder(5, 1)).rejects.toThrow(BadRequestException);
    });
  });

  describe('startDelivery', () => {
    it('should start delivery for picked up order', async () => {
      const order = { id: 1, deliveryPersonId: 5, status: OrderStatus.PICKED_UP };
      orderRepo.findOne.mockResolvedValue(order);
      orderRepo.save.mockResolvedValue({ ...order, status: OrderStatus.IN_TRANSIT });

      await service.startDelivery(5, 1);
      expect(orderRepo.save).toHaveBeenCalledWith(expect.objectContaining({ status: OrderStatus.IN_TRANSIT }));
    });
  });

  describe('deliverOrder', () => {
    it('should mark order as delivered', async () => {
      const order = { id: 1, deliveryPersonId: 5, status: OrderStatus.IN_TRANSIT };
      orderRepo.findOne.mockResolvedValue(order);
      orderRepo.save.mockResolvedValue({ ...order, status: OrderStatus.DELIVERED });

      await service.deliverOrder(5, 1);
      expect(orderRepo.save).toHaveBeenCalledWith(expect.objectContaining({ status: OrderStatus.DELIVERED }));
    });
  });

  describe('signOrder', () => {
    it('should sign order and release delivery person', async () => {
      const order = { id: 1, customerId: 1, deliveryPersonId: 5, status: OrderStatus.DELIVERED };
      orderRepo.findOne.mockResolvedValue(order);
      orderRepo.save.mockResolvedValue({ ...order, status: OrderStatus.SIGNED });
      const deliveryPerson = { id: 5, deliveryStatus: DeliveryStatus.BUSY };
      userRepo.findOne.mockResolvedValue(deliveryPerson);
      userRepo.save.mockResolvedValue({ ...deliveryPerson, deliveryStatus: DeliveryStatus.AVAILABLE });

      await service.signOrder(1, 1);
      expect(userRepo.save).toHaveBeenCalledWith(expect.objectContaining({ deliveryStatus: DeliveryStatus.AVAILABLE }));
    });
  });

  describe('cancelOrder', () => {
    it('should cancel a pending order', async () => {
      const order = { id: 1, customerId: 1, status: OrderStatus.PENDING };
      orderRepo.findOne.mockResolvedValue(order);
      orderRepo.save.mockResolvedValue({ ...order, status: OrderStatus.CANCELLED });

      await service.cancelOrder(1, 1, UserRole.CUSTOMER);
      expect(orderRepo.save).toHaveBeenCalledWith(expect.objectContaining({ status: OrderStatus.CANCELLED }));
    });

    it('should throw ForbiddenException if customer cancels another user order', async () => {
      orderRepo.findOne.mockResolvedValue({ id: 1, customerId: 2, status: OrderStatus.PENDING });
      await expect(service.cancelOrder(1, 1, UserRole.CUSTOMER)).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if order is in transit', async () => {
      orderRepo.findOne.mockResolvedValue({ id: 1, customerId: 1, status: OrderStatus.IN_TRANSIT });
      await expect(service.cancelOrder(1, 1, UserRole.CUSTOMER)).rejects.toThrow(BadRequestException);
    });
  });

  describe('markAbnormal', () => {
    it('should mark order as abnormal', async () => {
      const order = { id: 1, status: OrderStatus.IN_TRANSIT };
      orderRepo.findOne.mockResolvedValue(order);
      orderRepo.save.mockResolvedValue({ ...order, status: OrderStatus.ABNORMAL, abnormalReason: 'damaged' });

      await service.markAbnormal(5, 1, 'damaged');
      expect(orderRepo.save).toHaveBeenCalledWith(expect.objectContaining({
        status: OrderStatus.ABNORMAL,
        abnormalReason: 'damaged',
      }));
    });

    it('should throw NotFoundException for non-existent order', async () => {
      orderRepo.findOne.mockResolvedValue(null);
      await expect(service.markAbnormal(5, 999, 'reason')).rejects.toThrow(NotFoundException);
    });
  });
});
