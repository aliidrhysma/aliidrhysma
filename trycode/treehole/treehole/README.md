# 树洞系统 - 项目源码

> 匿名社交树洞小程序，100万坐标随机匹配，支持文本/图片/15s视频留言

## 📁 项目结构

```
树洞系统/项目源码/
├── backend/          # NestJS 后端服务 (API + 业务逻辑)
├── user-app/         # 用户端 Taro 小程序 (微信/支付宝/抖音)
├── admin-app/        # 运营后台 Taro 小程序
├── sql/
│   └── init.sql      # 数据库初始化脚本 (10张表)
├── docker-compose.yml # 一键部署配置
├── nginx/
│   └── nginx.conf    # Nginx 反向代理配置
└── README.md
```

## 🚀 快速部署

### 方式一：Docker 一键部署（推荐）

```bash
cd 树洞系统/项目源码
docker-compose up -d
```

访问地址：
- API 服务：http://localhost:3000
- Nginx 代理：http://localhost

### 方式二：本地开发

```bash
# 1. 安装依赖
cd backend && npm install
cd ../user-app && npm install
cd ../admin-app && npm install

# 2. 复制并配置环境变量
cd backend
cp .env.example .env
# 编辑 .env 填入真实配置

# 3. 初始化数据库 (确保 MySQL 已运行)
mysql -u root -p < sql/init.sql

# 4. 启动后端
npm run start:dev

# 5. 启动用户端小程序 (微信)
cd ../user-app
npm run dev:weapp
# 用微信开发者工具打开生成的 dist 目录

# 6. 启动运营后台
cd ../admin-app
npm run dev:weapp
```

## 🔑 默认账号

| 角色 | 账号 | 密码 |
|------|------|------|
| 管理员 | admin | admin123 |

## 📱 小程序导入

### 微信小程序
1. 下载 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 项目类型选择「小程序」
3. 导入 `user-app` 或 `admin-app` 目录
4. AppID 填写你自己的小程序 AppID
5. 点击「编译」即可预览

### 支付宝/抖音小程序
1. 分别执行 `npm run dev:alipay` / `npm run dev:tt`
2. 用对应开发者工具导入 `dist` 目录

## 🛠️ 核心功能清单

### 用户端
- [x] 手机号 + 验证码登录
- [x] 坐标随机分配（100万上限）
- [x] 留言发布（文本/图片/15s视频，最多3条/天）
- [x] 坐标留言查看与回复
- [x] 私密回复（仅发送者可看）
- [x] 个人主页（头像、发送/回复记录）
- [x] 举报功能
- [x] 冻结/封禁通知

### 运营后台
- [x] 管理员登录
- [x] 统计看板（用户/留言/举报/活跃）
- [x] 用户管理（列表、封禁/解封）
- [x] 留言管理（列表、删除）
- [x] 举报管理（列表、处理）

### 风控系统
- [x] 同IP注册限制（3个/天）
- [x] 登录失败锁定（5次失败锁30分钟）
- [x] 敏感词过滤
- [x] 防引流检测
- [x] 举报处罚（5次冻5天 → 10次冻10天 → 3次冻结封禁）
- [x] 留言有效期（未读90天 / 已读当天）

## 📊 数据库表

| 表名 | 说明 |
|------|------|
| users | 用户表 |
| coordinates | 坐标表 |
| messages | 留言表 |
| replies | 回复表 |
| reports | 举报表 |
| user_actions | 用户行为日志 |
| ip_registrations | IP注册记录 |
| login_failures | 登录失败记录 |
| admins | 管理员表 |
| sensitive_words | 敏感词库 |

## 🔧 技术栈

| 层级 | 技术 |
|------|------|
| 后端 | NestJS + TypeORM + MySQL + Redis |
| 用户端 | Taro 4 + React + Zustand |
| 运营后台 | Taro 4 + React + Zustand |
| 云存储 | 腾讯云 COS（预留） |
| 部署 | Docker + Nginx |

## 📂 API 概览

### 用户端 `/api/v1/`

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /auth/register | 注册 |
| POST | /auth/login | 登录 |
| POST | /auth/logout | 登出 |
| GET | /user/profile | 获取个人信息 |
| PUT | /user/profile | 更新个人信息 |
| GET | /coordinate/info | 获取当前坐标 |
| GET | /coordinate/refresh | 刷新坐标 |
| POST | /message/send | 发送留言 |
| GET | /message/coordinate | 获取坐标留言 |
| GET | /message/received | 获取收到的留言 |
| GET | /message/:id | 留言详情 |
| POST | /reply/send | 发送回复 |
| GET | /reply/message/:id | 获取留言的回复 |
| POST | /report | 举报 |
| GET | /settings | 获取设置 |

### 运营后台 `/api/admin/`

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /auth/login | 管理员登录 |
| GET | /dashboard/stats | 统计数据 |
| GET | /users | 用户列表 |
| PUT | /users/:id/status | 修改用户状态 |
| GET | /messages | 留言列表 |
| DELETE | /messages/:id | 删除留言 |
| GET | /reports | 举报列表 |
| PUT | /reports/:id | 处理举报 |

## ⚙️ 配置说明

主要环境变量（详见 `.env.example`）：

```bash
# 数据库
DB_HOST=localhost
DB_PASSWORD=your_password

# Redis
REDIS_HOST=localhost
REDIS_PASSWORD=your_redis_password

# JWT
JWT_SECRET=your_secret_key

# 小程序 AppID/Secret
WEIXIN_APP_ID=xxx
ALIPAY_APP_ID=xxx
DOUYIN_APP_ID=xxx

# 腾讯云 COS
COS_SECRET_ID=xxx
COS_BUCKET=treehole-assets
```

## 🧪 测试

```bash
cd backend
npm run test
```

## 📝 项目文档

- [需求规格说明书](../需求规格说明书.md)
- [技术方案设计](../技术方案设计.md)
- [原型图（用户端）](../原型图/树洞系统原型_用户端_v2.drawio)
- [原型图（运营后台）](../原型图/树洞系统原型_运营后台_v2.drawio)

---

**项目完成日期**: 2026-06-03
