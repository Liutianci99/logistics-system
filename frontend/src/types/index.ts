export interface User {
  id: number;
  username: string;
  email?: string;
  phone?: string;
  realName?: string;
  role: UserRole;
  isActive: boolean;
  address?: string;
  shopName?: string;
  deliveryStatus?: DeliveryStatus;
  createdAt: string;
}

export enum UserRole {
  CUSTOMER = 'customer',
  MERCHANT = 'merchant',
  DELIVERY = 'delivery',
  ADMIN = 'admin',
}

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  ASSIGNED = 'assigned',
  PICKED_UP = 'picked_up',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  SIGNED = 'signed',
  CANCELLED = 'cancelled',
  ABNORMAL = 'abnormal',
}

export enum DeliveryStatus {
  AVAILABLE = 'available',
  BUSY = 'busy',
  OFFLINE = 'offline',
}

export interface Order {
  id: number;
  orderNo: string;
  customerId: number;
  merchantId: number;
  deliveryPersonId?: number;
  status: OrderStatus;
  productName: string;
  quantity: number;
  totalPrice: number;
  shippingAddress: string;
  receiverName: string;
  receiverPhone: string;
  senderAddress?: string;
  remark?: string;
  abnormalReason?: string;
  createdAt: string;
  confirmedAt?: string;
  deliveredAt?: string;
  signedAt?: string;
  customer?: User;
  merchant?: User;
  deliveryPerson?: User;
  logs?: OrderLog[];
}

export interface OrderLog {
  id: number;
  orderId: number;
  operatorId: number;
  action: string;
  detail: string;
  fromStatus?: string;
  toStatus?: string;
  createdAt: string;
  operator?: User;
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  stock: number;
  imageUrl?: string;
  category?: string;
  merchantId: number;
  isActive: boolean;
  createdAt: string;
  merchant?: User;
}

export interface LoginForm {
  username: string;
  password: string;
}

export interface RegisterForm {
  username: string;
  password: string;
  email?: string;
  phone?: string;
  realName?: string;
  role: UserRole;
  shopName?: string;
}

export interface PaginatedResponse<T> {
  total: number;
  page: number;
  limit: number;
  [key: string]: any;
}

export const OrderStatusMap: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: '待确认',
  [OrderStatus.CONFIRMED]: '已确认',
  [OrderStatus.ASSIGNED]: '已分配配送员',
  [OrderStatus.PICKED_UP]: '已取件',
  [OrderStatus.IN_TRANSIT]: '配送中',
  [OrderStatus.DELIVERED]: '已送达',
  [OrderStatus.SIGNED]: '已签收',
  [OrderStatus.CANCELLED]: '已取消',
  [OrderStatus.ABNORMAL]: '异常',
};

export type TagType = 'info' | 'primary' | 'warning' | 'success' | 'danger';

export const OrderStatusColor: Record<OrderStatus, TagType> = {
  [OrderStatus.PENDING]: 'info',
  [OrderStatus.CONFIRMED]: 'primary',
  [OrderStatus.ASSIGNED]: 'primary',
  [OrderStatus.PICKED_UP]: 'warning',
  [OrderStatus.IN_TRANSIT]: 'warning',
  [OrderStatus.DELIVERED]: 'success',
  [OrderStatus.SIGNED]: 'success',
  [OrderStatus.CANCELLED]: 'danger',
  [OrderStatus.ABNORMAL]: 'danger',
};

export const RoleMap: Record<UserRole, string> = {
  [UserRole.CUSTOMER]: '顾客',
  [UserRole.MERCHANT]: '商家',
  [UserRole.DELIVERY]: '配送员',
  [UserRole.ADMIN]: '管理员',
};
