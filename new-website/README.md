# IP管理系统

一个功能完整的IP地址管理系统，支持IP录入、分割和合并功能。

## 功能特性

### 🔐 用户认证
- 管理员登录/登出
- 密码加密存储
- Session管理
- 权限控制

### 📊 IP管理
- IP地址录入和管理
- IP段信息展示（网络地址、广播地址等）
- IP状态管理（活跃/非活跃）
- 批量操作支持

### 🔀 IP分割
- 将IP段分割成多个子网
- 支持2-256个子网分割
- 实时预览分割结果
- 分割历史记录

### 🔗 IP合并
- 合并相邻的IP段
- 智能检测合并可行性
- 合并预览功能
- 合并历史记录

### 🎨 用户界面
- 现代化响应式设计
- Tailwind CSS样式
- 直观的操作界面
- 实时数据更新

## 技术栈

- **后端**: Node.js + Express
- **数据库**: SQLite
- **前端**: EJS模板 + Tailwind CSS
- **认证**: Express Session + bcryptjs
- **IP处理**: ip + netmask库

## 安装和运行

### 1. 安装依赖

```bash
npm install
```

### 2. 构建CSS样式

```bash
npm run build:css
```

### 3. 启动服务器

```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

### 4. 访问系统

打开浏览器访问: http://localhost:3001

**默认管理员账户:**
- 用户名: `admin`
- 密码: `admin123`

## 项目结构

```
new-website/
├── src/
│   ├── models/
│   │   └── database.js          # 数据库模型和初始化
│   ├── routes/
│   │   ├── authRoutes.js        # 认证路由
│   │   └── ipRoutes.js          # IP管理路由
│   ├── middleware/
│   │   └── auth.js              # 认证中间件
│   ├── utils/
│   │   └── ipUtils.js           # IP处理工具函数
│   └── styles/
│       └── input.css            # Tailwind CSS输入文件
├── views/
│   ├── login.ejs                # 登录页面
│   ├── dashboard.ejs            # 仪表板
│   ├── ip-management.ejs       # IP管理页面
│   ├── ip-split.ejs            # IP分割页面
│   ├── ip-merge.ejs            # IP合并页面
│   ├── settings.ejs            # 设置页面
│   ├── 404.ejs                 # 404错误页面
│   └── error.ejs               # 500错误页面
├── public/
│   ├── css/
│   │   └── style.css           # 编译后的CSS文件
│   ├── js/                     # JavaScript文件
│   └── images/                 # 图片资源
├── data/
│   └── ip_management.db        # SQLite数据库文件
├── server.js                   # 主服务器文件
├── package.json                # 项目配置
├── tailwind.config.js          # Tailwind配置
└── README.md                   # 项目说明
```

## API接口

### 认证接口
- `POST /login` - 用户登录
- `GET /logout` - 用户登出
- `POST /update-password` - 更新密码

### IP管理接口
- `GET /api/ips` - 获取IP列表
- `POST /api/ips` - 创建IP记录
- `PUT /api/ips/:id` - 更新IP记录
- `DELETE /api/ips/:id` - 删除IP记录
- `GET /api/ips/:id/details` - 获取IP详细信息

### IP操作接口
- `POST /api/ips/split` - IP分割
- `POST /api/ips/merge` - IP合并

## 数据库结构

### admins表
- `id` - 主键
- `username` - 用户名
- `password` - 加密密码
- `email` - 邮箱
- `created_at` - 创建时间

### ip_records表
- `id` - 主键
- `ip_address` - IP地址
- `subnet_mask` - 子网掩码
- `network_address` - 网络地址
- `broadcast_address` - 广播地址
- `gateway` - 网关
- `description` - 描述
- `status` - 状态
- `created_by` - 创建者
- `created_at` - 创建时间
- `updated_at` - 更新时间

### ip_splits表
- `id` - 主键
- `parent_ip_id` - 父IP ID
- `child_ip_id` - 子IP ID
- `split_type` - 分割类型
- `split_value` - 分割值
- `created_at` - 创建时间

### ip_merges表
- `id` - 主键
- `merged_ip_id` - 合并后IP ID
- `source_ip_ids` - 源IP IDs
- `merge_type` - 合并类型
- `created_at` - 创建时间

## 使用说明

### 1. 登录系统
使用默认账户 `admin/admin123` 登录系统。

### 2. 添加IP记录
- 进入"IP管理"页面
- 点击"添加IP"按钮
- 填写IP地址、子网掩码等信息
- 保存记录

### 3. IP分割操作
- 进入"IP分割"页面
- 选择要分割的IP段
- 设置分割数量
- 预览分割结果
- 执行分割操作

### 4. IP合并操作
- 进入"IP合并"页面
- 选择要合并的IP段（至少2个）
- 预览合并结果
- 执行合并操作

### 5. 系统设置
- 进入"设置"页面
- 修改密码
- 查看系统信息

## 开发说明

### 添加新功能
1. 在 `src/routes/` 中添加路由文件
2. 在 `src/models/` 中添加数据模型
3. 在 `views/` 中添加页面模板
4. 更新 `server.js` 中的路由配置

### 样式修改
1. 修改 `src/styles/input.css`
2. 运行 `npm run build:css` 重新编译
3. 刷新浏览器查看效果

### 数据库修改
1. 修改 `src/models/database.js` 中的表结构
2. 删除 `data/ip_management.db` 文件
3. 重启服务器自动创建新数据库

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request来改进这个项目。

## 联系方式

如有问题或建议，请通过GitHub Issues联系。




