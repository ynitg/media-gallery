import sqlite3

def update_database_schema():
    """更新数据库架构，添加click_count字段"""
    
    conn = sqlite3.connect('media_gallery.db')
    cursor = conn.cursor()
    
    try:
        # 检查是否已有click_count字段
        cursor.execute("PRAGMA table_info(media)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'click_count' not in columns:
            print("添加click_count字段...")
            cursor.execute("ALTER TABLE media ADD COLUMN click_count INTEGER DEFAULT 0")
            conn.commit()
            print("✅ click_count字段添加成功")
        else:
            print("click_count字段已存在")
            
    except Exception as e:
        print(f"❌ 更新数据库失败: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    print("=== 更新数据库架构 ===")
    update_database_schema()