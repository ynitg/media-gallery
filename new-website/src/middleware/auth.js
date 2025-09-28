const bcrypt = require('bcryptjs');
const database = require('../models/database');

class AuthMiddleware {
    /**
     * 验证管理员登录
     * @param {string} username - 用户名
     * @param {string} password - 密码
     * @returns {Promise<object|null>} 用户信息或null
     */
    static async authenticateAdmin(username, password) {
        return new Promise((resolve, reject) => {
            const db = database.getConnection();
            
            db.get(
                "SELECT * FROM admins WHERE username = ?",
                [username],
                (err, row) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    
                    if (!row) {
                        resolve(null);
                        return;
                    }
                    
                    // 验证密码
                    bcrypt.compare(password, row.password, (err, isMatch) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        
                        if (isMatch) {
                            resolve({
                                id: row.id,
                                username: row.username,
                                email: row.email,
                                createdAt: row.created_at
                            });
                        } else {
                            resolve(null);
                        }
                    });
                }
            );
        });
    }

    /**
     * 检查用户是否已登录
     */
    static requireAuth(req, res, next) {
        if (req.session && req.session.admin) {
            next();
        } else {
            res.redirect('/login');
        }
    }

    /**
     * 检查用户是否未登录（用于登录页面）
     */
    static requireGuest(req, res, next) {
        if (req.session && req.session.admin) {
            res.redirect('/dashboard');
        } else {
            next();
        }
    }

    /**
     * 创建管理员账户
     * @param {string} username - 用户名
     * @param {string} password - 密码
     * @param {string} email - 邮箱
     * @returns {Promise<object>} 创建结果
     */
    static async createAdmin(username, password, email = '') {
        return new Promise((resolve, reject) => {
            const db = database.getConnection();
            
            // 检查用户名是否已存在
            db.get(
                "SELECT id FROM admins WHERE username = ?",
                [username],
                (err, row) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    
                    if (row) {
                        reject(new Error('用户名已存在'));
                        return;
                    }
                    
                    // 加密密码
                    const hashedPassword = bcrypt.hashSync(password, 10);
                    
                    // 创建新管理员
                    db.run(
                        "INSERT INTO admins (username, password, email) VALUES (?, ?, ?)",
                        [username, hashedPassword, email],
                        function(err) {
                            if (err) {
                                reject(err);
                                return;
                            }
                            
                            resolve({
                                id: this.lastID,
                                username: username,
                                email: email
                            });
                        }
                    );
                }
            );
        });
    }

    /**
     * 更新管理员密码
     * @param {number} adminId - 管理员ID
     * @param {string} newPassword - 新密码
     * @returns {Promise<boolean>} 更新结果
     */
    static async updatePassword(adminId, newPassword) {
        return new Promise((resolve, reject) => {
            const db = database.getConnection();
            const hashedPassword = bcrypt.hashSync(newPassword, 10);
            
            db.run(
                "UPDATE admins SET password = ? WHERE id = ?",
                [hashedPassword, adminId],
                function(err) {
                    if (err) {
                        reject(err);
                        return;
                    }
                    
                    resolve(this.changes > 0);
                }
            );
        });
    }
}

module.exports = AuthMiddleware;




