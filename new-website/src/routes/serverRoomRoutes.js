const express = require('express');
const router = express.Router();
const database = require('../models/database');

class ServerRoomRoutes {
    /**
     * 获取所有机房记录
     */
    static async getAllServerRooms(req, res) {
        try {
            const db = database.getConnection();
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const offset = (page - 1) * limit;
            
            db.all(
                `SELECT sr.*, a.username as created_by_name 
                 FROM server_rooms sr 
                 LEFT JOIN admins a ON sr.created_by = a.id 
                 ORDER BY sr.created_at DESC 
                 LIMIT ? OFFSET ?`,
                [limit, offset],
                (err, rows) => {
                    if (err) {
                        throw err;
                    }
                    
                    // 获取总数
                    db.get(
                        "SELECT COUNT(*) as total FROM server_rooms",
                        (err, countRow) => {
                            if (err) {
                                throw err;
                            }
                            
                            res.json({
                                success: true,
                                data: rows,
                                pagination: {
                                    page: page,
                                    limit: limit,
                                    total: countRow.total,
                                    pages: Math.ceil(countRow.total / limit)
                                }
                            });
                        }
                    );
                }
            );
        } catch (error) {
            res.status(500).json({
                success: false,
                message: '获取机房记录失败',
                error: error.message
            });
        }
    }

    /**
     * 创建新的机房记录
     */
    static async createServerRoom(req, res) {
        try {
            const { name, location, description } = req.body;
            
            if (!name) {
                return res.status(400).json({
                    success: false,
                    message: '机房名称是必填字段'
                });
            }
            
            const db = database.getConnection();
            db.run(
                `INSERT INTO server_rooms (name, location, description, created_by) 
                 VALUES (?, ?, ?, ?)`,
                [name, location || '', description || '', req.session.admin.id],
                function(err) {
                    if (err) {
                        console.error('数据库插入错误:', err);
                        return res.status(500).json({
                            success: false,
                            message: '创建机房记录失败',
                            error: err.message
                        });
                    }
                    
                    res.json({
                        success: true,
                        message: '机房记录创建成功',
                        data: {
                            id: this.lastID,
                            name,
                            location: location || '',
                            description: description || ''
                        }
                    });
                }
            );
        } catch (error) {
            console.error('创建机房记录错误:', error);
            res.status(500).json({
                success: false,
                message: '创建机房记录失败',
                error: error.message
            });
        }
    }

    /**
     * 更新机房记录
     */
    static async updateServerRoom(req, res) {
        try {
            const { id } = req.params;
            const { name, location, description, status } = req.body;
            
            const db = database.getConnection();
            
            // 构建更新字段
            const updateFields = [];
            const updateValues = [];
            
            if (name) {
                updateFields.push('name = ?');
                updateValues.push(name);
            }
            if (location !== undefined) {
                updateFields.push('location = ?');
                updateValues.push(location);
            }
            if (description !== undefined) {
                updateFields.push('description = ?');
                updateValues.push(description);
            }
            if (status) {
                updateFields.push('status = ?');
                updateValues.push(status);
            }
            
            updateFields.push('updated_at = CURRENT_TIMESTAMP');
            updateValues.push(id);
            
            db.run(
                `UPDATE server_rooms SET ${updateFields.join(', ')} WHERE id = ?`,
                updateValues,
                function(err) {
                    if (err) {
                        throw err;
                    }
                    
                    if (this.changes === 0) {
                        return res.status(404).json({
                            success: false,
                            message: '机房记录不存在'
                        });
                    }
                    
                    res.json({
                        success: true,
                        message: '机房记录更新成功'
                    });
                }
            );
        } catch (error) {
            res.status(500).json({
                success: false,
                message: '更新机房记录失败',
                error: error.message
            });
        }
    }

    /**
     * 删除机房记录
     */
    static async deleteServerRoom(req, res) {
        try {
            const { id } = req.params;
            const db = database.getConnection();
            
            // 检查是否有IP记录使用此机房
            db.get(
                "SELECT COUNT(*) as count FROM ip_records WHERE server_room_id = ?",
                [id],
                (err, row) => {
                    if (err) {
                        throw err;
                    }
                    
                    if (row.count > 0) {
                        return res.status(400).json({
                            success: false,
                            message: '该机房下还有IP记录，无法删除'
                        });
                    }
                    
                    // 删除机房记录
                    db.run(
                        "DELETE FROM server_rooms WHERE id = ?",
                        [id],
                        function(err) {
                            if (err) {
                                throw err;
                            }
                            
                            if (this.changes === 0) {
                                return res.status(404).json({
                                    success: false,
                                    message: '机房记录不存在'
                                });
                            }
                            
                            res.json({
                                success: true,
                                message: '机房记录删除成功'
                            });
                        }
                    );
                }
            );
        } catch (error) {
            res.status(500).json({
                success: false,
                message: '删除机房记录失败',
                error: error.message
            });
        }
    }

    /**
     * 获取所有活跃的机房（用于下拉选择）
     */
    static async getActiveServerRooms(req, res) {
        try {
            const db = database.getConnection();
            
            db.all(
                "SELECT id, name, location FROM server_rooms WHERE status = 'active' ORDER BY name",
                (err, rows) => {
                    if (err) {
                        throw err;
                    }
                    
                    res.json({
                        success: true,
                        data: rows
                    });
                }
            );
        } catch (error) {
            res.status(500).json({
                success: false,
                message: '获取机房列表失败',
                error: error.message
            });
        }
    }
}

// 路由定义
router.get('/', ServerRoomRoutes.getAllServerRooms);
router.post('/', ServerRoomRoutes.createServerRoom);
router.put('/:id', ServerRoomRoutes.updateServerRoom);
router.delete('/:id', ServerRoomRoutes.deleteServerRoom);
router.get('/active', ServerRoomRoutes.getActiveServerRooms);

module.exports = router;








