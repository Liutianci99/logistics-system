import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { Product } from '../../entities/product.entity';

describe('ProductsService', () => {
  let service: ProductsService;
  let productRepo: any;

  const mockProductRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
    findAndCount: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: getRepositoryToken(Product), useValue: mockProductRepo },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    productRepo = mockProductRepo;
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a product', async () => {
      const dto = { name: 'Widget', price: 9.99, stock: 100 };
      const product = { id: 1, ...dto, merchantId: 1 };
      productRepo.create.mockReturnValue(product);
      productRepo.save.mockResolvedValue(product);

      const result = await service.create(1, dto as any);
      expect(result).toEqual(product);
      expect(productRepo.create).toHaveBeenCalledWith({ ...dto, merchantId: 1 });
    });
  });

  describe('update', () => {
    it('should update a product owned by merchant', async () => {
      const existing = { id: 1, name: 'Old', merchantId: 1 };
      productRepo.findOne.mockResolvedValue(existing);
      productRepo.save.mockResolvedValue({ ...existing, name: 'New' });

      const result = await service.update(1, 1, { name: 'New' } as any);
      expect(result.name).toBe('New');
    });

    it('should throw NotFoundException for non-existent product', async () => {
      productRepo.findOne.mockResolvedValue(null);
      await expect(service.update(1, 999, {} as any)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if not owner', async () => {
      productRepo.findOne.mockResolvedValue({ id: 1, merchantId: 2 });
      await expect(service.update(1, 1, {} as any)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should soft-delete a product by setting isActive to false', async () => {
      const product = { id: 1, merchantId: 1, isActive: true };
      productRepo.findOne.mockResolvedValue(product);
      productRepo.save.mockResolvedValue({ ...product, isActive: false });

      const result = await service.remove(1, 1);
      expect(result.message).toBe('商品已下架');
      expect(productRepo.save).toHaveBeenCalledWith(expect.objectContaining({ isActive: false }));
    });

    it('should throw ForbiddenException if not owner', async () => {
      productRepo.findOne.mockResolvedValue({ id: 1, merchantId: 2 });
      await expect(service.remove(1, 1)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('toggleActive', () => {
    it('should toggle product from active to inactive', async () => {
      const product = { id: 1, merchantId: 1, isActive: true };
      productRepo.findOne.mockResolvedValue(product);
      productRepo.save.mockResolvedValue({ ...product, isActive: false });

      const result = await service.toggleActive(1, 1);
      expect(result.message).toBe('商品已下架');
      expect(result.isActive).toBe(false);
    });

    it('should toggle product from inactive to active', async () => {
      const product = { id: 1, merchantId: 1, isActive: false };
      productRepo.findOne.mockResolvedValue(product);
      productRepo.save.mockResolvedValue({ ...product, isActive: true });

      const result = await service.toggleActive(1, 1);
      expect(result.message).toBe('商品已上架');
      expect(result.isActive).toBe(true);
    });

    it('should throw NotFoundException for non-existent product', async () => {
      productRepo.findOne.mockResolvedValue(null);
      await expect(service.toggleActive(1, 999)).rejects.toThrow(NotFoundException);
    });
  });
});
