const bcrypt = require('bcryptjs');
const fs = require('fs');

const hash = bcrypt.hashSync('123456', 10);
const adminHash = bcrypt.hashSync('admin123', 10);

// Helper functions
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = arr => arr[rand(0, arr.length - 1)];
const randDate = (daysAgo) => {
  const d = new Date();
  d.setDate(d.getDate() - rand(0, daysAgo));
  d.setHours(rand(6, 22), rand(0, 59), rand(0, 59));
  return d.toISOString().slice(0, 19).replace('T', ' ');
};
const esc = s => s.replace(/'/g, "\\'");

const surnames = ['张','李','王','刘','陈','杨','赵','黄','周','吴','徐','孙','胡','朱','高','林','何','郭','马','罗'];
const names = ['伟','芳','娜','秀英','敏','静','丽','强','磊','洋','艳','勇','军','杰','娟','涛','明','超','秀兰','霞','平','刚','桂英','文','华'];
const cities = ['北京市','上海市','广州市','深圳市','杭州市','南京市','成都市','武汉市','重庆市','西安市','苏州市','天津市','长沙市','郑州市','青岛市'];
const districts = ['朝阳区','海淀区','浦东新区','天河区','南山区','西湖区','玄武区','武侯区','江汉区','渝中区','雁塔区','姑苏区','和平区','岳麓区','金水区'];
const streets = ['中山路','人民路','解放路','建设路','和平路','文化路','科技路','创新大道','学院路','花园路','长安街','南京路','淮海路','天府大道','珠江路'];

const randName = () => pick(surnames) + pick(names) + (rand(0,1) ? pick(names) : '');
const randPhone = () => '1' + pick(['3','5','7','8','9']) + String(rand(100000000, 999999999));
const randAddr = () => `${pick(cities)}${pick(districts)}${pick(streets)}${rand(1,200)}号${rand(1,30)}栋${rand(1,30)}层${rand(1,4)}0${rand(1,9)}室`;

const shopNames = [
  '京东数码旗舰店','天猫超市官方店','苏宁易购自营','华为官方旗舰店','小米之家',
  '三只松鼠旗舰店','良品铺子官方店','优衣库官方店','耐克官方旗舰店','海尔官方店',
  '美的生活电器','格力空调专卖','百草味零食店','周大福珠宝','屈臣氏官方店'
];

let sql = '-- Seed data for logistics system\nSET NAMES utf8mb4;\n\n';

// ===== USERS =====
sql += '-- Users\n';
const users = [];
let uid = 2; // admin is id=1

// Merchants (id 2-11)
for (let i = 0; i < 10; i++) {
  const name = randName();
  const uname = `merchant${i+1}`;
  users.push({ id: uid, username: uname, role: 'merchant', realName: name, shopName: shopNames[i] || `${name}的店铺` });
  sql += `INSERT INTO users (username, password, email, phone, realName, role, isActive, shopName, address) VALUES ('${uname}', '${hash}', '${uname}@shop.com', '${randPhone()}', '${esc(name)}', 'merchant', 1, '${esc(shopNames[i] || name+"的店铺")}', '${esc(randAddr())}');\n`;
  uid++;
}

// Customers (id 12-31)
for (let i = 0; i < 20; i++) {
  const name = randName();
  const uname = `customer${i+1}`;
  users.push({ id: uid, username: uname, role: 'customer', realName: name });
  sql += `INSERT INTO users (username, password, email, phone, realName, role, isActive, address) VALUES ('${uname}', '${hash}', '${uname}@mail.com', '${randPhone()}', '${esc(name)}', 'customer', 1, '${esc(randAddr())}');\n`;
  uid++;
}

// Delivery persons (id 32-39)
const deliveryStatuses = ['available','busy','offline'];
for (let i = 0; i < 8; i++) {
  const name = randName();
  const uname = `delivery${i+1}`;
  const ds = pick(deliveryStatuses);
  users.push({ id: uid, username: uname, role: 'delivery', realName: name });
  sql += `INSERT INTO users (username, password, email, phone, realName, role, isActive, deliveryStatus, address) VALUES ('${uname}', '${hash}', '${uname}@express.com', '${randPhone()}', '${esc(name)}', 'delivery', 1, '${ds}', '${esc(randAddr())}');\n`;
  uid++;
}

// Inactive users
for (let i = 0; i < 3; i++) {
  const name = randName();
  const uname = `inactive${i+1}`;
  sql += `INSERT INTO users (username, password, email, phone, realName, role, isActive, address) VALUES ('${uname}', '${hash}', '${uname}@mail.com', '${randPhone()}', '${esc(name)}', 'customer', 0, '${esc(randAddr())}');\n`;
  uid++;
}

sql += '\n';

// ===== PRODUCTS =====
sql += '-- Products\n';
const productData = [
  { cat: '数码电子', items: [
    ['iPhone 15 Pro Max 256GB', '苹果最新旗舰手机，A17 Pro芯片，钛金属设计', 9999],
    ['MacBook Pro 14英寸 M3', '搭载M3芯片，16GB内存，512GB存储', 14999],
    ['iPad Air 5 WiFi 256GB', '10.9英寸全面屏，M1芯片，支持Apple Pencil', 5499],
    ['AirPods Pro 2代', '主动降噪，自适应通透模式，MagSafe充电盒', 1899],
    ['华为Mate 60 Pro', '麒麟9000S芯片，卫星通话，超可靠玄武架构', 6999],
    ['小米14 Ultra', '骁龙8 Gen3，徕卡光学镜头，5000mAh电池', 5999],
    ['Sony WH-1000XM5 头戴式耳机', '行业领先降噪，30小时续航，多点连接', 2699],
    ['Nintendo Switch OLED', '7英寸OLED屏幕，64GB存储，加宽可调支架', 2599],
    ['DJI Mini 4 Pro 无人机', '4K/60fps HDR视频，全向避障，34分钟续航', 5788],
    ['罗技MX Master 3S鼠标', '8K DPI传感器，静音点击，多设备切换', 749],
  ]},
  { cat: '服装鞋帽', items: [
    ['Nike Air Force 1 07', '经典白色低帮运动鞋，皮革鞋面，Air缓震', 899],
    ['优衣库轻薄羽绒服', '640蓬松度优质白鸭绒，轻便保暖可收纳', 499],
    ['Levi\'s 501经典直筒牛仔裤', '原创直筒版型，纽扣门襟，100%棉', 699],
    ['阿迪达斯三叶草卫衣', '经典三条纹设计，纯棉面料，宽松版型', 599],
    ['波司登极寒系列羽绒服', '鹅绒填充，-30℃抗寒，防风防水面料', 1999],
    ['New Balance 574 复古跑鞋', 'ENCAP中底技术，麂皮网面拼接', 769],
  ]},
  { cat: '食品饮料', items: [
    ['三只松鼠坚果大礼包', '每日坚果混合装，含核桃腰果巴旦木等，1.5kg', 168],
    ['农夫山泉天然矿泉水 24瓶装', '天然弱碱性水，550ml*24瓶', 39.9],
    ['瑞幸咖啡挂耳包 30袋装', '精品阿拉比卡豆，中度烘焙，黑咖啡', 129],
    ['良品铺子肉松饼 1kg', '传统糕点，酥松可口，独立包装', 49.9],
    ['蒙牛特仑苏纯牛奶 24盒', '3.8g优质乳蛋白，250ml*24盒', 79.9],
    ['百草味猪肉脯 500g', '靖江特产，蜜汁味，原切猪肉', 59.9],
  ]},
  { cat: '家居生活', items: [
    ['戴森V15 Detect无线吸尘器', '激光探测灰尘，240AW吸力，60分钟续航', 4990],
    ['美的智能电饭煲 4L', 'IH电磁加热，24小时预约，多功能菜单', 599],
    ['格力新一级能效空调 1.5匹', '变频冷暖，自清洁，WiFi智控', 3299],
    ['小米扫地机器人S10+', 'LDS激光导航，4000Pa吸力，自动集尘', 2499],
    ['九阳破壁机 Y1', '1200W大功率，预约免滤，自动清洗', 899],
    ['海尔10公斤滚筒洗衣机', '直驱变频，蒸汽除菌，525mm大筒径', 2999],
  ]},
  { cat: '美妆个护', items: [
    ['兰蔻小黑瓶精华液 50ml', '第二代小黑瓶，微生态护肤，修护肌底', 980],
    ['SK-II神仙水 230ml', 'PITERA精华，改善肤质，提亮肤色', 1540],
    ['欧莱雅玻尿酸面膜 30片', '三重玻尿酸，深层补水，急救保湿', 149],
    ['戴森Supersonic吹风机', '智能温控，快速干发，不伤发质', 3190],
    ['资生堂红腰子精华 75ml', '免疫力精华，强韧肌肤屏障', 790],
  ]},
  { cat: '图书文具', items: [
    ['《三体》全集精装版', '刘慈欣科幻巨著，雨果奖获奖作品', 108],
    ['《人类简史》', '尤瓦尔·赫拉利著，全球畅销2000万册', 49.9],
    ['得力办公文具套装', '含签字笔、笔记本、文件夹等20件', 89],
    ['Moleskine经典笔记本', '意大利品牌，硬面大号横线本', 198],
    ['《代码大全》第2版', '软件开发经典著作，程序员必读', 128],
  ]},
];

let pid = 1;
const products = [];
for (const cat of productData) {
  for (const [name, desc, price] of cat.items) {
    const merchantId = rand(2, 11);
    const stock = rand(10, 500);
    const isActive = rand(0, 20) > 1 ? 1 : 0;
    const created = randDate(60);
    products.push({ id: pid, name, price, merchantId, stock });
    sql += `INSERT INTO products (name, description, price, stock, category, merchantId, isActive, createdAt, updatedAt) VALUES ('${esc(name)}', '${esc(desc)}', ${price}, ${stock}, '${cat.cat}', ${merchantId}, ${isActive}, '${created}', '${created}');\n`;
    pid++;
  }
}

sql += '\n-- Orders\n';

const orderStatuses = ['pending','confirmed','assigned','picked_up','in_transit','delivered','signed','cancelled','abnormal'];
const remarks = ['请尽快发货','周末送货','放门卫处即可','请打电话再送','易碎品请轻拿轻放','不要放快递柜','送货前请电话联系','','','','',''];

let oid = 1;
const ordersList = [];

for (let i = 0; i < 150; i++) {
  const customerId = rand(12, 31);
  const product = pick(products);
  const qty = rand(1, 5);
  const total = (product.price * qty).toFixed(2);
  const orderNo = `ORD${String(Date.now()).slice(-8)}${String(oid).padStart(4, '0')}`;
  const receiverName = randName();
  const receiverPhone = randPhone();
  const shippingAddr = randAddr();
  const senderAddr = randAddr();
  const remark = pick(remarks);

  // Determine status and timeline
  const statusIdx = rand(0, 8);
  const status = orderStatuses[statusIdx];
  const createdDaysAgo = rand(1, 90);
  const createdDate = new Date();
  createdDate.setDate(createdDate.getDate() - createdDaysAgo);
  createdDate.setHours(rand(6, 22), rand(0, 59), rand(0, 59));
  const created = createdDate.toISOString().slice(0, 19).replace('T', ' ');

  let confirmedAt = 'NULL';
  let deliveredAt = 'NULL';
  let signedAt = 'NULL';
  let deliveryPersonId = 'NULL';
  let abnormalReason = 'NULL';

  if (statusIdx >= 1 && status !== 'cancelled') {
    const d = new Date(createdDate);
    d.setHours(d.getHours() + rand(1, 12));
    confirmedAt = `'${d.toISOString().slice(0, 19).replace('T', ' ')}'`;
  }
  if (statusIdx >= 2 && status !== 'cancelled') {
    deliveryPersonId = rand(32, 39);
  }
  if (statusIdx >= 5 && status !== 'cancelled') {
    const d = new Date(createdDate);
    d.setDate(d.getDate() + rand(1, 3));
    deliveredAt = `'${d.toISOString().slice(0, 19).replace('T', ' ')}'`;
  }
  if (statusIdx >= 6 && status === 'signed') {
    const d = new Date(createdDate);
    d.setDate(d.getDate() + rand(2, 5));
    signedAt = `'${d.toISOString().slice(0, 19).replace('T', ' ')}'`;
  }
  if (status === 'abnormal') {
    const reasons = ['包裹破损','地址不存在，无法配送','收件人拒收','快递丢失，正在调查','配送超时，客户投诉','货物与订单不符'];
    abnormalReason = `'${pick(reasons)}'`;
    deliveryPersonId = rand(32, 39);
  }
  if (status === 'cancelled') {
    deliveryPersonId = 'NULL';
    confirmedAt = 'NULL';
  }

  ordersList.push({ id: oid, status, customerId, merchantId: product.merchantId });
  sql += `INSERT INTO orders (orderNo, customerId, merchantId, deliveryPersonId, status, productName, quantity, totalPrice, shippingAddress, receiverName, receiverPhone, senderAddress, remark, abnormalReason, createdAt, updatedAt, confirmedAt, deliveredAt, signedAt) VALUES ('${orderNo}', ${customerId}, ${product.merchantId}, ${deliveryPersonId}, '${status}', '${esc(product.name)}', ${qty}, ${total}, '${esc(shippingAddr)}', '${esc(receiverName)}', '${receiverPhone}', '${esc(senderAddr)}', ${remark ? `'${esc(remark)}'` : 'NULL'}, ${abnormalReason}, '${created}', '${created}', ${confirmedAt}, ${deliveredAt}, ${signedAt});\n`;
  oid++;
}

sql += '\n-- Order Logs\n';

const actionMap = {
  'pending': { action: '创建订单', detail: '顾客提交了新订单' },
  'confirmed': { action: '确认订单', detail: '商家确认了订单' },
  'assigned': { action: '分配配送员', detail: '系统自动分配了配送员' },
  'picked_up': { action: '取件', detail: '配送员已取件' },
  'in_transit': { action: '开始配送', detail: '包裹正在配送中' },
  'delivered': { action: '确认送达', detail: '包裹已送达目的地' },
  'signed': { action: '签收', detail: '顾客已签收包裹' },
  'cancelled': { action: '取消订单', detail: '订单已被取消' },
  'abnormal': { action: '标记异常', detail: '订单被标记为异常状态' },
};

for (const order of ordersList) {
  const statusIdx = orderStatuses.indexOf(order.status);
  const prevStatuses = order.status === 'cancelled'
    ? ['pending', 'cancelled']
    : order.status === 'abnormal'
    ? orderStatuses.slice(0, rand(2, 5)).concat(['abnormal'])
    : orderStatuses.slice(0, statusIdx + 1);

  for (let i = 0; i < prevStatuses.length; i++) {
    const s = prevStatuses[i];
    const prev = i === 0 ? 'NULL' : `'${prevStatuses[i-1]}'`;
    const info = actionMap[s];
    let operatorId = order.customerId;
    if (['confirmed'].includes(s)) operatorId = order.merchantId;
    if (['assigned','picked_up','in_transit','delivered'].includes(s)) operatorId = rand(32, 39);
    if (s === 'abnormal') operatorId = rand(32, 39);

    sql += `INSERT INTO order_logs (orderId, operatorId, action, detail, fromStatus, toStatus) VALUES (${order.id}, ${operatorId}, '${info.action}', '${info.detail}', ${prev}, '${s}');\n`;
  }
}

fs.writeFileSync('/Users/ltc/Desktop/vibe/backend/sql/seed.sql', sql);
console.log(`Generated: ${uid-1} users, ${pid-1} products, ${oid-1} orders`);
