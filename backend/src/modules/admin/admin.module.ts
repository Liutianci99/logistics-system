import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { User } from '../../entities/user.entity';
import { Order } from '../../entities/order.entity';
import { OrderLog } from '../../entities/order-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Order, OrderLog])],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
