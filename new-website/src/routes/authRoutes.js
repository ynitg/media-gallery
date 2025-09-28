const express = require('express');
const router = express.Router();
const AuthMiddleware = require('../middleware/auth');

class AuthRoutes {
    /**
     * 显示登录页面
     */
    static showLogin(req, res) {
        res.render('login', {
            title: '管理员登录',
            error: req.query.error || null
        });
    }

    /**
     * 处理登录请求
     */
    static async handleLogin(req, res) {
        try {
            const { username, password } = req.body;
            
            if (!username || !password) {
                return res.redirect('/login?error=用户名和密码不能为空');
            }
            
            const admin = await AuthMiddleware.authenticateAdmin(username, password);
            
            if (admin) {
                req.session.admin = admin;
                res.redirect('/dashboard');
            } else {
                res.redirect('/login?error=用户名或密码错误');
            }
        } catch (error) {
            console.error('登录错误:', error);
            res.redirect('/login?error=登录失败，请稍后重试');
        }
    }

    /**
     * 处理登出请求
     */
    static handleLogout(req, res) {
        req.session.destroy((err) => {
            if (err) {
                console.error('登出错误:', err);
            }
            res.redirect('/login');
        });
    }

    /**
     * 显示仪表板
     */
    static showDashboard(req, res) {
        res.render('dashboard', {
            title: 'IP管理系统 - 仪表板',
            admin: req.session.admin
        });
    }

    /**
     * 显示IP管理页面
     */
    static showIPManagement(req, res) {
        res.render('ip-management', {
            title: 'IP管理',
            admin: req.session.admin
        });
    }

    /**
     * 显示IP分割页面
     */
    static showIPSplit(req, res) {
        res.render('ip-split', {
            title: 'IP分割',
            admin: req.session.admin
        });
    }

    /**
     * 显示IP合并页面
     */
    static showIPMerge(req, res) {
        res.render('ip-merge', {
            title: 'IP合并',
            admin: req.session.admin
        });
    }

    /**
     * 显示设置页面
     */
    static showSettings(req, res) {
        res.render('settings', {
            title: '系统设置',
            admin: req.session.admin
        });
    }

    /**
     * 显示机房管理页面
     */
    static showServerRoom(req, res) {
        res.render('server-room', {
            title: '机房管理',
            admin: req.session.admin
        });
    }

    /**
     * 更新密码
     */
    static async updatePassword(req, res) {
        try {
            const { currentPassword, newPassword, confirmPassword } = req.body;
            
            if (!currentPassword || !newPassword || !confirmPassword) {
                return res.json({
                    success: false,
                    message: '所有字段都是必填的'
                });
            }
            
            if (newPassword !== confirmPassword) {
                return res.json({
                    success: false,
                    message: '新密码和确认密码不匹配'
                });
            }
            
            if (newPassword.length < 6) {
                return res.json({
                    success: false,
                    message: '新密码长度至少6位'
                });
            }
            
            // 验证当前密码
            const admin = await AuthMiddleware.authenticateAdmin(
                req.session.admin.username, 
                currentPassword
            );
            
            if (!admin) {
                return res.json({
                    success: false,
                    message: '当前密码错误'
                });
            }
            
            // 更新密码
            const success = await AuthMiddleware.updatePassword(admin.id, newPassword);
            
            if (success) {
                res.json({
                    success: true,
                    message: '密码更新成功'
                });
            } else {
                res.json({
                    success: false,
                    message: '密码更新失败'
                });
            }
        } catch (error) {
            console.error('更新密码错误:', error);
            res.json({
                success: false,
                message: '更新密码失败，请稍后重试'
            });
        }
    }
}

// 路由定义
router.get('/login', AuthRoutes.showLogin);
router.post('/login', AuthRoutes.handleLogin);
router.get('/logout', AuthRoutes.handleLogout);
router.get('/dashboard', AuthRoutes.showDashboard);
router.get('/ip-management', AuthRoutes.showIPManagement);
router.get('/ip-split', AuthRoutes.showIPSplit);
router.get('/ip-merge', AuthRoutes.showIPMerge);
router.get('/settings', AuthRoutes.showSettings);
router.get('/server-room', AuthRoutes.showServerRoom);
router.post('/update-password', AuthRoutes.updatePassword);

module.exports = router;




