import { IsNumber, IsString, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrderDto {
  @ApiProperty({ description: '商品ID' })
  @IsNumber()
  productId: number;

  @ApiProperty({ description: '数量', minimum: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ description: '收货地址' })
  @IsString()
  shippingAddress: string;

  @ApiProperty({ description: '收件人姓名' })
  @IsString()
  receiverName: string;

  @ApiProperty({ description: '收件人手机号' })
  @IsString()
  receiverPhone: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remark?: string;
}
