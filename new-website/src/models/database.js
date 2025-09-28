const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
    constructor() {
        this.db = new sqlite3.Database(path.join(__dirname, '../../data/ip_management.db'));
        this.init();
    }

    init() {
        // 创建管理员表
        this.db.run(`
            CREATE TABLE IF NOT EXISTS admins (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                email TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) {
                console.error('创建管理员表失败:', err);
            } else {
                console.log('✅ 管理员表创建成功');
                this.createServerRoomsTable();
            }
        });
    }

    createServerRoomsTable() {
        // 创建机房表
        this.db.run(`
            CREATE TABLE IF NOT EXISTS server_rooms (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                location TEXT,
                description TEXT,
                status TEXT DEFAULT 'active',
                created_by INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (created_by) REFERENCES admins (id)
            )
        `, (err) => {
            if (err) {
                console.error('创建机房表失败:', err);
            } else {
                console.log('✅ 机房表创建成功');
                this.createIPRecordsTable();
            }
        });
    }

    createIPRecordsTable() {
        // 创建IP记录表
        this.db.run(`
            CREATE TABLE IF NOT EXISTS ip_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ip_address TEXT NOT NULL,
                subnet_mask TEXT,
                network_address TEXT,
                broadcast_address TEXT,
                gateway TEXT,
                description TEXT,
                server_room_id INTEGER,
                vlan_id TEXT,
                status TEXT DEFAULT 'active',
                created_by INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (created_by) REFERENCES admins (id),
                FOREIGN KEY (server_room_id) REFERENCES server_rooms (id)
            )
        `, (err) => {
            if (err) {
                console.error('创建IP记录表失败:', err);
            } else {
                console.log('✅ IP记录表创建成功');
                this.createOtherTables();
            }
        });
    }

    createOtherTables() {
        // 创建IP分割记录表
        this.db.run(`
            CREATE TABLE IF NOT EXISTS ip_splits (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                parent_ip_id INTEGER NOT NULL,
                child_ip_id INTEGER NOT NULL,
                split_type TEXT NOT NULL,
                split_value TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (parent_ip_id) REFERENCES ip_records (id),
                FOREIGN KEY (child_ip_id) REFERENCES ip_records (id)
            )
        `, (err) => {
            if (err) {
                console.error('创建IP分割表失败:', err);
            } else {
                console.log('✅ IP分割表创建成功');
            }
        });

        // 创建IP合并记录表
        this.db.run(`
            CREATE TABLE IF NOT EXISTS ip_merges (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                merged_ip_id INTEGER NOT NULL,
                source_ip_ids TEXT NOT NULL,
                merge_type TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (merged_ip_id) REFERENCES ip_records (id)
            )
        `, (err) => {
            if (err) {
                console.error('创建IP合并表失败:', err);
            } else {
                console.log('✅ IP合并表创建成功');
                this.createDefaultAdmin();
            }
        });
    }

    createDefaultAdmin() {
        // 插入默认管理员账户
        this.db.get("SELECT COUNT(*) as count FROM admins", (err, row) => {
            if (err) {
                console.error('检查管理员账户时出错:', err);
                return;
            }
            
            if (row.count === 0) {
                const bcrypt = require('bcryptjs');
                const hashedPassword = bcrypt.hashSync('admin123', 10);
                
                this.db.run(
                    "INSERT INTO admins (username, password, email) VALUES (?, ?, ?)",
                    ['admin', hashedPassword, 'admin@example.com'],
                    function(err) {
                        if (err) {
                            console.error('创建默认管理员账户时出错:', err);
                        } else {
                            console.log('✅ 默认管理员账户已创建 - 用户名: admin, 密码: admin123');
                        }
                    }
                );
            } else {
                console.log('✅ 管理员账户已存在');
            }
        });
    }

    // 获取数据库连接
    getConnection() {
        return this.db;
    }

    // 关闭数据库连接
    close() {
        this.db.close();
    }
}

module.exports = new Database();







