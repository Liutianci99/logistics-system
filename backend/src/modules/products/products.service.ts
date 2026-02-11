import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../../entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async create(merchantId: number, createProductDto: CreateProductDto) {
    const product = this.productRepository.create({
      ...createProductDto,
      merchantId,
    });
    return this.productRepository.save(product);
  }

  async findAll(query: any) {
    const { page = 1, limit = 20, category, merchantId } = query;
    const qb = this.productRepository.createQueryBuilder('product')
      .leftJoinAndSelect('product.merchant', 'merchant')
      .where('product.isActive = :isActive', { isActive: true });

    if (category) qb.andWhere('product.category = :category', { category });
    if (merchantId) qb.andWhere('product.merchantId = :merchantId', { merchantId });

    qb.orderBy('product.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [products, total] = await qb.getManyAndCount();
    return { products, total, page: +page, limit: +limit };
  }

  async findOne(id: number) {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['merchant'],
    });
    if (!product) throw new NotFoundException('商品不存在');
    return product;
  }

  async findByMerchant(merchantId: number, query: any) {
    const { page = 1, limit = 20 } = query;
    const [products, total] = await this.productRepository.findAndCount({
      where: { merchantId },
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return { products, total, page: +page, limit: +limit };
  }

  async update(merchantId: number, id: number, updateProductDto: UpdateProductDto) {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) throw new NotFoundException('商品不存在');
    if (product.merchantId !== merchantId) throw new ForbiddenException('无权操作');

    Object.assign(product, updateProductDto);
    return this.productRepository.save(product);
  }

  async remove(merchantId: number, id: number) {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) throw new NotFoundException('商品不存在');
    if (product.merchantId !== merchantId) throw new ForbiddenException('无权操作');

    product.isActive = false;
    await this.productRepository.save(product);
    return { message: '商品已下架' };
  }

  async toggleActive(merchantId: number, id: number) {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) throw new NotFoundException('商品不存在');
    if (product.merchantId !== merchantId) throw new ForbiddenException('无权操作');

    product.isActive = !product.isActive;
    await this.productRepository.save(product);
    return { message: product.isActive ? '商品已上架' : '商品已下架', isActive: product.isActive };
  }
}
