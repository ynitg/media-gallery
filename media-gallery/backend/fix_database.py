#!/usr/bin/env python3
"""
修复数据库架构问题
为Media表添加click_count字段，为Settings表添加updated_at字段
"""
import sqlite3
import os

def fix_database():
    db_path = 'media_gallery.db'
    
    if not os.path.exists(db_path):
        print("数据库文件不存在，将创建新的数据库")
        return
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # 检查Media表的列
        cursor.execute("PRAGMA table_info(media)")
        columns = [column[1] for column in cursor.fetchall()]
        
        # 添加click_count字段（如果不存在）
        if 'click_count' not in columns:
            print("添加click_count字段到Media表...")
            cursor.execute("ALTER TABLE media ADD COLUMN click_count INTEGER DEFAULT 0")
            print("OK: click_count字段添加成功")
        else:
            print("OK: click_count字段已存在")
        
        # 检查Settings表是否存在
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='settings'")
        settings_table_exists = cursor.fetchone()
        
        if not settings_table_exists:
            print("创建Settings表...")
            cursor.execute('''
                CREATE TABLE settings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    key VARCHAR(100) UNIQUE NOT NULL,
                    value TEXT,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            print("OK: Settings表创建成功")
        else:
            print("OK: Settings表已存在")
            
            # 检查Settings表的列
            cursor.execute("PRAGMA table_info(settings)")
            settings_columns = [column[1] for column in cursor.fetchall()]
            
            # 添加updated_at字段（如果不存在）
            if 'updated_at' not in settings_columns:
                print("添加updated_at字段到Settings表...")
                cursor.execute("ALTER TABLE settings ADD COLUMN updated_at DATETIME")
                print("OK: updated_at字段添加成功")
            else:
                print("OK: updated_at字段已存在")
        
        # 更新现有记录的click_count为0
        cursor.execute("UPDATE media SET click_count = 0 WHERE click_count IS NULL")
        print("OK: 更新现有记录的click_count为0")
        
        conn.commit()
        conn.close()
        
        print("数据库修复完成！")
        
    except Exception as e:
        print(f"修复数据库时出错: {e}")
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    fix_database()