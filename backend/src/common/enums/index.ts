export enum UserRole {
  CUSTOMER = 'customer',
  MERCHANT = 'merchant',
  DELIVERY = 'delivery',
  ADMIN = 'admin',
}

export enum OrderStatus {
  PENDING = 'pending',           // 待确认
  CONFIRMED = 'confirmed',       // 商家已确认
  ASSIGNED = 'assigned',         // 已分配配送员
  PICKED_UP = 'picked_up',      // 已取件
  IN_TRANSIT = 'in_transit',    // 配送中
  DELIVERED = 'delivered',       // 已送达
  SIGNED = 'signed',             // 已签收
  CANCELLED = 'cancelled',       // 已取消
  ABNORMAL = 'abnormal',         // 异常
}

export enum DeliveryStatus {
  AVAILABLE = 'available',       // 空闲
  BUSY = 'busy',                 // 配送中
  OFFLINE = 'offline',           // 离线
}
