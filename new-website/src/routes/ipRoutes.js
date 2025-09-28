const express = require('express');
const router = express.Router();
const database = require('../models/database');
const IPUtils = require('../utils/ipUtils');

class IPRoutes {
    /**
     * 获取所有IP记录
     */
    static async getAllIPs(req, res) {
        try {
            const db = database.getConnection();
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const offset = (page - 1) * limit;
            
            db.all(
                `SELECT ir.*, a.username as created_by_name, sr.name as server_room_name 
                 FROM ip_records ir 
                 LEFT JOIN admins a ON ir.created_by = a.id 
                 LEFT JOIN server_rooms sr ON ir.server_room_id = sr.id 
                 ORDER BY ir.created_at DESC 
                 LIMIT ? OFFSET ?`,
                [limit, offset],
                (err, rows) => {
                    if (err) {
                        throw err;
                    }
                    
                    // 获取总数
                    db.get(
                        "SELECT COUNT(*) as total FROM ip_records",
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
                message: '获取IP记录失败',
                error: error.message
            });
        }
    }

    /**
     * 创建新的IP记录
     */
    static async createIP(req, res) {
        try {
            const { ip_address, subnet_mask, gateway, description, server_room_id, vlan_id } = req.body;
            
            // 验证必填字段
            if (!ip_address || !subnet_mask) {
                return res.status(400).json({
                    success: false,
                    message: 'IP地址和子网掩码是必填字段'
                });
            }
            
            // 验证IP地址
            if (!IPUtils.isValidIP(ip_address)) {
                return res.status(400).json({
                    success: false,
                    message: '无效的IP地址格式'
                });
            }

            // 处理子网掩码格式（支持/24或24格式）
            let maskValue = subnet_mask;
            if (!maskValue.startsWith('/')) {
                maskValue = '/' + maskValue;
            }

            // 解析IP信息
            const ipInfo = IPUtils.parseIPInfo(ip_address, maskValue);
            
            const db = database.getConnection();
            db.run(
                `INSERT INTO ip_records 
                 (ip_address, subnet_mask, network_address, broadcast_address, gateway, description, server_room_id, vlan_id, created_by) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [ip_address, maskValue.replace('/', ''), ipInfo.network, ipInfo.broadcast, gateway || '', description || '', server_room_id || null, vlan_id || '', req.session.admin.id],
                function(err) {
                    if (err) {
                        console.error('数据库插入错误:', err);
                        return res.status(500).json({
                            success: false,
                            message: '创建IP记录失败',
                            error: err.message
                        });
                    }
                    
                    res.json({
                        success: true,
                        message: 'IP记录创建成功',
                        data: {
                            id: this.lastID,
                            ip_address,
                            subnet_mask: maskValue.replace('/', ''),
                            network_address: ipInfo.network,
                            broadcast_address: ipInfo.broadcast,
                            gateway: gateway || '',
                            description: description || '',
                            server_room_id: server_room_id || null,
                            vlan_id: vlan_id || ''
                        }
                    });
                }
            );
        } catch (error) {
            console.error('创建IP记录错误:', error);
            res.status(500).json({
                success: false,
                message: '创建IP记录失败',
                error: error.message
            });
        }
    }

    /**
     * 更新IP记录
     */
    static async updateIP(req, res) {
        try {
            const { id } = req.params;
            const { ip_address, subnet_mask, gateway, description, status, server_room_id, vlan_id } = req.body;
            
            // 验证IP地址
            if (ip_address && !IPUtils.isValidIP(ip_address)) {
                return res.status(400).json({
                    success: false,
                    message: '无效的IP地址格式'
                });
            }

            const db = database.getConnection();
            
            // 构建更新字段
            const updateFields = [];
            const updateValues = [];
            
            if (ip_address) {
                updateFields.push('ip_address = ?');
                updateValues.push(ip_address);
            }
            if (subnet_mask) {
                updateFields.push('subnet_mask = ?');
                updateValues.push(subnet_mask);
            }
            if (gateway !== undefined) {
                updateFields.push('gateway = ?');
                updateValues.push(gateway);
            }
            if (description !== undefined) {
                updateFields.push('description = ?');
                updateValues.push(description);
            }
            if (status) {
                updateFields.push('status = ?');
                updateValues.push(status);
            }
            if (server_room_id !== undefined) {
                updateFields.push('server_room_id = ?');
                updateValues.push(server_room_id || null);
            }
            if (vlan_id !== undefined) {
                updateFields.push('vlan_id = ?');
                updateValues.push(vlan_id || '');
            }
            
            updateFields.push('updated_at = CURRENT_TIMESTAMP');
            updateValues.push(id);
            
            db.run(
                `UPDATE ip_records SET ${updateFields.join(', ')} WHERE id = ?`,
                updateValues,
                function(err) {
                    if (err) {
                        throw err;
                    }
                    
                    if (this.changes === 0) {
                        return res.status(404).json({
                            success: false,
                            message: 'IP记录不存在'
                        });
                    }
                    
                    res.json({
                        success: true,
                        message: 'IP记录更新成功'
                    });
                }
            );
        } catch (error) {
            res.status(500).json({
                success: false,
                message: '更新IP记录失败',
                error: error.message
            });
        }
    }

    /**
     * 删除IP记录
     */
    static async deleteIP(req, res) {
        try {
            const { id } = req.params;
            const db = database.getConnection();
            
            db.run(
                "DELETE FROM ip_records WHERE id = ?",
                [id],
                function(err) {
                    if (err) {
                        throw err;
                    }
                    
                    if (this.changes === 0) {
                        return res.status(404).json({
                            success: false,
                            message: 'IP记录不存在'
                        });
                    }
                    
                    res.json({
                        success: true,
                        message: 'IP记录删除成功'
                    });
                }
            );
        } catch (error) {
            res.status(500).json({
                success: false,
                message: '删除IP记录失败',
                error: error.message
            });
        }
    }

    /**
     * 分割IP段
     */
    static async splitIP(req, res) {
        try {
            const { parent_ip_id, split_count } = req.body;
            
            if (!parent_ip_id || !split_count) {
                return res.status(400).json({
                    success: false,
                    message: '缺少必要参数'
                });
            }

            const db = database.getConnection();
            
            // 获取父IP信息
            db.get(
                "SELECT * FROM ip_records WHERE id = ?",
                [parent_ip_id],
                (err, parentIP) => {
                    if (err) {
                        throw err;
                    }
                    
                    if (!parentIP) {
                        return res.status(404).json({
                            success: false,
                            message: '父IP记录不存在'
                        });
                    }
                    
                    // 构建CIDR格式
                    const parentCIDR = `${parentIP.ip_address}/${parentIP.subnet_mask}`;
                    
                    // 分割IP段
                    const subnets = IPUtils.splitIPRange(parentCIDR, parseInt(split_count));
                    
                    // 保存分割记录
                    const insertPromises = subnets.map(subnet => {
                        return new Promise((resolve, reject) => {
                            db.run(
                                `INSERT INTO ip_records 
                                 (ip_address, subnet_mask, network_address, broadcast_address, description, created_by) 
                                 VALUES (?, ?, ?, ?, ?, ?)`,
                                [
                                    subnet.network,
                                    subnet.bitmask,
                                    subnet.network,
                                    subnet.broadcast,
                                    `分割自IP记录 #${parent_ip_id}`,
                                    req.session.admin.id
                                ],
                                function(err) {
                                    if (err) {
                                        reject(err);
                                        return;
                                    }
                                    
                                    // 记录分割关系
                                    db.run(
                                        "INSERT INTO ip_splits (parent_ip_id, child_ip_id, split_type, split_value) VALUES (?, ?, ?, ?)",
                                        [parent_ip_id, this.lastID, 'equal_split', split_count],
                                        (err) => {
                                            if (err) {
                                                reject(err);
                                                return;
                                            }
                                            resolve(this.lastID);
                                        }
                                    );
                                }
                            );
                        });
                    });
                    
                    Promise.all(insertPromises)
                        .then(() => {
                            res.json({
                                success: true,
                                message: 'IP段分割成功',
                                data: {
                                    parent_id: parent_ip_id,
                                    subnets: subnets,
                                    split_count: split_count
                                }
                            });
                        })
                        .catch(error => {
                            throw error;
                        });
                }
            );
        } catch (error) {
            res.status(500).json({
                success: false,
                message: '分割IP段失败',
                error: error.message
            });
        }
    }

    /**
     * 合并IP段
     */
    static async mergeIPs(req, res) {
        try {
            const { ip_ids } = req.body;
            
            if (!Array.isArray(ip_ids) || ip_ids.length < 2) {
                return res.status(400).json({
                    success: false,
                    message: '至少需要选择两个IP段进行合并'
                });
            }

            const db = database.getConnection();
            
            // 获取要合并的IP信息
            const placeholders = ip_ids.map(() => '?').join(',');
            db.all(
                `SELECT * FROM ip_records WHERE id IN (${placeholders})`,
                ip_ids,
                (err, ipRecords) => {
                    if (err) {
                        throw err;
                    }
                    
                    if (ipRecords.length !== ip_ids.length) {
                        return res.status(400).json({
                            success: false,
                            message: '部分IP记录不存在'
                        });
                    }
                    
                    // 构建CIDR数组
                    const cidrArray = ipRecords.map(record => 
                        `${record.ip_address}/${record.subnet_mask}`
                    );
                    
                    // 合并IP段
                    const mergedRanges = IPUtils.mergeIPRanges(cidrArray);
                    
                    // 保存合并后的IP记录
                    const insertPromises = mergedRanges.map(range => {
                        return new Promise((resolve, reject) => {
                            db.run(
                                `INSERT INTO ip_records 
                                 (ip_address, subnet_mask, network_address, broadcast_address, description, created_by) 
                                 VALUES (?, ?, ?, ?, ?, ?)`,
                                [
                                    range.network,
                                    range.bitmask,
                                    range.network,
                                    range.broadcast,
                                    `合并自IP记录 #${ip_ids.join(', #')}`,
                                    req.session.admin.id
                                ],
                                function(err) {
                                    if (err) {
                                        reject(err);
                                        return;
                                    }
                                    
                                    // 记录合并关系
                                    db.run(
                                        "INSERT INTO ip_merges (merged_ip_id, source_ip_ids, merge_type) VALUES (?, ?, ?)",
                                        [this.lastID, ip_ids.join(','), 'auto_merge'],
                                        (err) => {
                                            if (err) {
                                                reject(err);
                                                return;
                                            }
                                            resolve(this.lastID);
                                        }
                                    );
                                }
                            );
                        });
                    });
                    
                    Promise.all(insertPromises)
                        .then(() => {
                            res.json({
                                success: true,
                                message: 'IP段合并成功',
                                data: {
                                    source_ids: ip_ids,
                                    merged_ranges: mergedRanges
                                }
                            });
                        })
                        .catch(error => {
                            throw error;
                        });
                }
            );
        } catch (error) {
            res.status(500).json({
                success: false,
                message: '合并IP段失败',
                error: error.message
            });
        }
    }

    /**
     * 获取IP段详细信息
     */
    static async getIPDetails(req, res) {
        try {
            const { id } = req.params;
            const db = database.getConnection();
            
            db.get(
                `SELECT ir.*, a.username as created_by_name 
                 FROM ip_records ir 
                 LEFT JOIN admins a ON ir.created_by = a.id 
                 WHERE ir.id = ?`,
                [id],
                (err, row) => {
                    if (err) {
                        throw err;
                    }
                    
                    if (!row) {
                        return res.status(404).json({
                            success: false,
                            message: 'IP记录不存在'
                        });
                    }
                    
                    // 获取详细信息
                    const cidr = `${row.ip_address}/${row.subnet_mask}`;
                    const details = IPUtils.getIPRangeDetails(cidr);
                    
                    res.json({
                        success: true,
                        data: {
                            ...row,
                            details: details
                        }
                    });
                }
            );
        } catch (error) {
            res.status(500).json({
                success: false,
                message: '获取IP详细信息失败',
                error: error.message
            });
        }
    }
}

// 路由定义
router.get('/', IPRoutes.getAllIPs);
router.post('/', IPRoutes.createIP);
router.put('/:id', IPRoutes.updateIP);
router.delete('/:id', IPRoutes.deleteIP);
router.post('/split', IPRoutes.splitIP);
router.post('/merge', IPRoutes.mergeIPs);
router.get('/:id/details', IPRoutes.getIPDetails);

module.exports = router;

