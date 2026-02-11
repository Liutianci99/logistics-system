import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAll(page = 1, limit = 20) {
    const [users, total] = await this.userRepository.findAndCount({
      select: ['id', 'username', 'email', 'phone', 'realName', 'role', 'isActive', 'shopName', 'deliveryStatus', 'createdAt'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return { users, total, page, limit };
  }

  async findOne(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'username', 'email', 'phone', 'realName', 'role', 'isActive', 'address', 'shopName', 'deliveryStatus', 'createdAt'],
    });
    if (!user) throw new NotFoundException('用户不存在');
    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.findOne(id);
    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }

  async toggleActive(id: number) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('用户不存在');
    user.isActive = !user.isActive;
    await this.userRepository.save(user);
    return { message: user.isActive ? '已启用' : '已禁用', isActive: user.isActive };
  }

  async findAvailableDeliveryPerson() {
    return this.userRepository.findOne({
      where: { role: 'delivery' as any, deliveryStatus: 'available' as any, isActive: true },
    });
  }
}
