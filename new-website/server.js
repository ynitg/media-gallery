const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const session = require('express-session');

// 导入路由和中间件
const authRoutes = require('./src/routes/authRoutes');
const ipRoutes = require('./src/routes/ipRoutes');
const serverRoomRoutes = require('./src/routes/serverRoomRoutes');
const AuthMiddleware = require('./src/middleware/auth');

// 初始化数据库
require('./src/models/database');

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件配置
app.use(helmet({
    contentSecurityPolicy: false // 禁用CSP以便使用内联样式
}));
app.use(compression());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session配置
app.use(session({
    secret: 'ip-management-system-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // 在生产环境中应该设置为true（需要HTTPS）
        maxAge: 24 * 60 * 60 * 1000 // 24小时
    }
}));

// 静态文件服务
app.use(express.static(path.join(__dirname, 'public')));

// 设置模板引擎
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 根路由 - 重定向到登录页面
app.get('/', (req, res) => {
    if (req.session && req.session.admin) {
        res.redirect('/dashboard');
    } else {
        res.redirect('/login');
    }
});

// 认证路由
app.use('/', authRoutes);

// API路由 - 需要认证
app.use('/api/ips', AuthMiddleware.requireAuth, ipRoutes);
app.use('/api/server-rooms', AuthMiddleware.requireAuth, serverRoomRoutes);

// API状态检查
app.get('/api/status', (req, res) => {
    res.json({ 
        status: 'success', 
        message: 'IP管理系统API运行正常',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// 404 处理
app.use((req, res) => {
    res.status(404).render('404', { 
        title: '页面未找到',
        message: '抱歉，您访问的页面不存在',
        admin: req.session ? req.session.admin : null
    });
});

// 错误处理
app.use((err, req, res, next) => {
    console.error('服务器错误:', err.stack);
    res.status(500).render('error', { 
        title: '服务器错误',
        message: '服务器内部错误，请稍后再试',
        admin: req.session ? req.session.admin : null
    });
});

app.listen(PORT, () => {
    console.log('🌐 IP管理系统启动成功!');
    console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
    console.log(`📁 项目目录: ${__dirname}`);
    console.log(`🔐 默认管理员账户: admin / admin123`);
    console.log(`📊 管理后台: http://localhost:${PORT}/dashboard`);
});
