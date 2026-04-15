create database random_food
go
use random_food
go
-- 菜品表
if not exists(select * from sysobjects where name = 'category'and xtype = 'U')
create table category(
	categoryid int identity(1,1) primary key,
	category_name varchar(50) not null unique
)
-- 店铺表
if not exists(select * from sysobjects where name = 'shop'and xtype = 'U')
create table shop(
	shopid int identity(101,1) primary key,
	shop_name varchar(50) not null unique,
	address varchar(50)
)
-- 抽取表
if not exists(select * from sysobjects where name = 'food_list'and xtype = 'U')
create table food_list(
	categoryid int not null,
	category_name varchar(50) not null,
	shopid int not null,
	shop_name varchar(50) not null,
	address varchar(50) not null,
	is_available bit default 1,
	primary key(categoryid,shopid),
	score decimal(2,1)not null default 0.0
)
go
create trigger trg_food_list on food_list instead of insert
as
begin
	insert into category(category_name)
	select distinct category_name from inserted
	where category_name not in(select category_name from category)
	insert into shop(shop_name,address)
	select distinct shop_name,address from inserted
	where shop_name not in (select shop_name from shop)
	insert into food_list(categoryid,shopid,category_name,shop_name,address,is_available,score)
	select
		c.categoryid,s.shopid,i.category_name,i.shop_name,i.address,isnull(i.is_available,1),isnull(i.score,0.0)from inserted i
		left join category c on i.category_name = c.category_name
		left join shop s on i.shop_name = s.shop_name
end

insert into food_list(category_name,shop_name,address,score) values
--快餐炒菜
('快餐炒菜', '食全食美', '一餐一楼',4.0),
('快餐炒菜', '自选快餐贵宾厅', '二餐一楼',4.1),
('快餐炒菜', '响叮当擂椒拌饭', '二餐二楼',4.2),
('快餐炒菜', '清真盖浇饭', '二餐一楼',4.3),
('快餐炒菜', '小伙夫', '二餐二楼',4.4),
('快餐炒菜', '津味快餐', '一餐二楼',4.5),
('快餐炒菜', '华姐', '一餐三楼',4.6),
('快餐炒菜', '小陌', '一餐三楼',4.7),
('快餐炒菜', '米状元', '二餐二楼',4.8),
--早餐
('早餐', '玉米', '一餐一楼',4.0),
('早餐', '季先生煎饼', '二餐一楼',4.1),
('早餐', '杂粮煎饼', '生活广场',4.2),
('早餐', '煎饼', '一餐一楼',4.3),
('早餐', '小笼包', '一餐一楼',4.4),
('早餐', '红薯', '一餐一楼',4.5),
('早餐', '蒸饺', '一餐一楼',4.6),
('早餐', '烧饼', '一餐一楼',4.7),
('早餐', '粥豆浆', '一餐一楼',4.8),
('早餐', '丑四喜大包子', '一餐二楼',3.9),
--烤冷面
('烤冷面', '烤冷面杂粮煎饼', '生活广场',3.7),
('烤冷面', '季先生烤冷面', '生活广场',3.8),
--汉堡
('炸鸡汉堡', '吉胜克', '一餐二楼',4.6),
('炸鸡汉堡', '正新鸡排', '生活广场',4.4),
('炸鸡汉堡', '唐门汉堡', '生活广场',4.0),
('炸鸡汉堡', '德克士', '生活广场',3.8),
('炸鸡汉堡', '塔斯汀', '二餐一楼',4.7),
('炸鸡汉堡', '鸡柳大人', '生活广场',3.9),
('炸鸡汉堡', '炸鸡大全', '生活广场',3.8),
--麻辣烫
('麻辣烫', '刘文祥麻辣烫', '二餐二楼',4.5),
('麻辣烫', '金汤麻辣烫', '一餐二楼',4.5),
('麻辣烫', '东北老式麻辣烫', '二餐一楼',4.6),
('麻辣烫', '范佳兴麻辣烫', '生活广场',3.9),
('麻辣烫', '美食城东北老式麻辣烫', '美食城',4.1),
('麻辣烫', '东北烧烤+麻辣烫', '美食城',3.6),
('麻辣烫', '沪姐姐麻辣拌麻辣烫', '校医院东',3.7),
--麻辣拌
('麻辣拌', '正宗抚顺麻辣拌', '一餐二楼',4.3),
('麻辣拌', '食运来麻辣香锅麻辣拌', '一餐二楼',4.6),
('麻辣拌', '福多多', '二餐二楼',3.9),
('麻辣拌', '刘文祥麻辣烫', '二餐二楼',3.9),
('麻辣拌', '沪姐姐麻辣拌麻辣烫', '校医院东',3.5),
--麻辣香锅
('麻辣香锅', '食运来麻辣香锅麻辣拌', '一餐二楼',3.6),
('麻辣香锅', '麻辣香锅火锅鸡', '二餐一楼',4.3),
('麻辣香锅', '福多多', '二餐二楼',4.5),
('麻辣香锅', '麻辣香锅鸭脯肉', '二餐一楼',4.7),
('麻辣香锅', '舌尖奇妙麻辣香锅', '一餐二楼',3.5),
--炸串
('炸串', '黑逵炸串', '美食城',4.6),
('炸串', '小馋猫炸串', '美食城',4.6),
('炸串', '小吃货炸串', '美食城',4.3),
--面
('面', '粉面世家', '一餐二楼',3.7),
('面', '春晓板面', '一餐二楼',3.8),
('面', '过桥米线', '一餐三楼',3.4),
('面', '巧心婆猪肘面', '二餐二楼',4.6),
('面', '五谷渔粉', '美食城',4.2),
('面', '藤椒鸡面', '一餐二楼',4.4),
('面', '淮南牛肉汤', '一餐二楼',3.7),
('面', '缘落阿朵妹土豆粉', '二餐一楼',3.5),
('面', '粉面掌柜', '二餐一楼',3.5),
('面', '美食城锡纸花甲粉', '美食城',3.6),
--鸡公煲
('鸡公煲', '御品德鸡公煲', '一餐二楼',4.7),
('鸡公煲', '重庆鸡公煲', '生活广场',4.5),
--滑蛋饭
('滑蛋饭', '北极星滑蛋饭', '一餐二楼',4.6),
('滑蛋饭', '西安盖浇面', '一餐二楼',3.6),
('滑蛋饭', '岩溶咖喱蛋包饭', '一餐二楼',3.3),
('滑蛋饭', '芮儿滑蛋饭', '二餐二楼',3.6),
('滑蛋饭', '永乐港式滑蛋饭', '二餐一楼',4.6),
--烤鸭饭
('烤鸭饭', '烤鸭饭鸡排卤肉饭美食城', '美食城',3.3),
('烤鸭饭', '焖喜娃', '二餐二楼',3.6),
('烤鸭饭', '烤鸡拌饭烤鸭饭', '二餐一楼',3.6),
('烤鸭饭', '18号烤鸭拌饭', '二餐一楼',3.8),
('烤鸭饭', '烤鸭饭卤肉饭美食城', '美食城',4.1),
('烤鸭饭', '大碗烧肉饭', '二餐二楼',3.8),
--卤肉饭
('卤肉饭', '烤鸭饭鸡排卤肉饭美食城', '美食城',3.6),
('卤肉饭', '隆江猪脚饭猪肘饭', '美食城',3.5),
('卤肉饭', '烤鸭饭卤肉饭美食城', '美食城',4.2),
('卤肉饭', '私房焖肉饭', '一餐二楼',3.9),
('卤肉饭', '烧肉饭', '一餐二楼',3.1),
('卤肉饭', '壹家拌面·米饭套餐', '美食城',3.5),
--烤肉拌饭
('烤肉拌饭', '香满座烤肉拌饭', '一餐二楼',3.9),
('烤肉拌饭', '小馋猫烤肉拌饭', '二餐一楼',3.6),
('烤肉拌饭', '烤肉拌饭脆皮鸡', '二餐一楼',3.3),
--其他
('其他', '瓦香鸡米饭', '一餐二楼',3.6),
('其他', '茶香鸡米饭', '一餐二楼',3.2),
--轻食简餐
('轻食简餐', '西式简餐', '一餐二楼',3.6),
('轻食简餐', '轻食美学', '二餐二楼',3.9),
--饮品
('饮品', '瑞幸咖啡', '生活广场',4.1),
('饮品', '库迪咖啡', '生活广场',4.2),
('饮品', '幸运咖', '百阳超市',4.3),
('饮品', '益禾堂', '生活广场',4.4),
('饮品', '蜜雪冰城', '一餐一楼',4.5),
('饮品', '制茶青年', '一餐二楼',4.6),
('饮品', '沪上阿姨', '生活广场',4.7),
('饮品', '诺杯茉莉鲜奶茶', '生活广场',4.8),
('饮品', '冰晓童', '生活广场',4.9),
('饮品', '乐悠悠', '生活广场',3.8),
('饮品', '臻甜手作酸奶', '生活广场',3.9)
--管理员表
if not exists(select * from sysobjects where name = 'admins'and xtype = 'U')
create table admins(
	id int identity(100,1)primary key,
	admin_account varchar(20) not null unique,
	admin_pwd varchar(255) not null, --加密密码
	admin_phone varchar(11) not null unique,
	create_time datetime default getdate()
)
-- 管理员验证码表
if not exists(select * from sysobjects where name = 'admin_codes'and xtype = 'U')
create table admin_codes(
	id int identity(1,1)primary key,
	admin_phone varchar(11)not null unique,
	code varchar(6)not null,
	create_time datetime default getdate(),
	expires_at datetime not null, --验证码过期时间
	is_used bit default 0,
	index idx_phone(admin_phone),
	index idx_expires(expires_at)
)
insert into admins(admin_account,admin_pwd,admin_phone) values
('admin','$2b$12$v5/FbGTNfNFFJ5C0xzZuSOCAgvZ8fFflxRIReMziN4LBbYr4Q2/ES','18731786900')--admin123加密密文

-- 用户表
if not exists(select * from sysobjects where name = 'users'and xtype = 'U')
create table users(
	userid int identity(1,1)primary key,
	user_phone varchar(11)not null unique,
	user_pwd varchar(255)not null,
	create_time datetime default getdate()
)
-- 用户验证码表
if not exists(select * from sysobjects where name = 'verification_codes'and xtype = 'U')
create table verification_codes(
	id int identity(1,1)primary key,
	user_phone varchar(11)not null unique,
	code varchar(6)not null,
	create_time datetime default getdate(),
	expires_at datetime not null, --验证码过期时间
	is_used bit default 0,
	index idx_phone(user_phone),
	index idx_expires(expires_at)
)
-- 收藏店铺表
if not exists(select * from sysobjects where name = 'user_collect'and xtype = 'U')
create table user_collect(
	id int identity(1,1)primary key,
	userid int not null foreign key(userid)references users(userid),
	shopid int not null foreign key(shopid)references shop(shopid),
	constraint uk_user_shop unique(userid,shopid)
)
-- 反馈记录表
if not exists(select * from sysobjects where name = 'feedback'and xtype = 'U')
create table feedback(
    id int identity(1,1)primary key,
    content nvarchar(max)not null,
    email nvarchar(100)null
)
-- 抽取记录表
create table food_draw_record (
    id int identity(1,1) primary key,
    userid int not null,
    category_name nvarchar(100),
    shop_name nvarchar(200),
    address nvarchar(500),
    shopid int,
    draw_time datetime default getdate()
)
-- 标签表
if not exists(select * from sysobjects where name = 'scene_tags'and xtype = 'U')
create table scene_tags (
    tag_id int identity(1,1) primary key,
    tag_name varchar(50) not null unique
)
-- 店铺-标签关联表
if not exists(select * from sysobjects where name = 'shop_scene_tags'and xtype = 'U')
create table shop_scene_tags (
    shopid int not null,
    tag_id int not null,
    primary key (shopid, tag_id),
    foreign key (shopid) references shop(shopid),
    foreign key (tag_id) references scene_tags(tag_id)
)
insert into scene_tags (tag_name) values
('快餐'),
('面食'),
('低脂'),
('饮品'),
('暖胃'),
('煲类'),
('家常菜'),
('甜品'),
('解暑'),
('麻辣'),
('清淡')
insert into shop_scene_tags (shopid, tag_id)
select distinct
    f.shopid,
    t.tag_id
from food_list f join scene_tags t on 1=1
where 
    (t.tag_name = '面食' and f.category_name in ('面', '烤冷面'))
    or (t.tag_name = '饮品' and f.category_name = '饮品')
    or (t.tag_name = '暖胃' and f.category_name in ('麻辣烫', '麻辣拌', '麻辣香锅', '鸡公煲', '快餐炒菜'))
    or (t.tag_name = '煲类' and f.category_name = '鸡公煲')
    or (t.tag_name = '家常菜' and f.category_name = '快餐炒菜')
    or (t.tag_name = '解暑' and f.category_name in ('饮品', '轻食简餐'))
    or (t.tag_name = '麻辣' and f.category_name in ('麻辣烫', '麻辣拌', '麻辣香锅'))
    or (t.tag_name = '清淡' and f.category_name in ('轻食简餐', '早餐'))
    or (t.tag_name = '低脂' and f.category_name = '轻食简餐')
    or (t.tag_name = '甜品' and f.category_name = '饮品')
    or (t.tag_name = '快餐' and f.category_name != '饮品')