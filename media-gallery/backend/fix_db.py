#!/usr/bin/env python3
import sqlite3
import os

def fix_database_schema():
    db_path = 'media_gallery.db'
    
    if not os.path.exists(db_path):
        print("Database file does not exist")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check if click_count column exists
    cursor.execute("PRAGMA table_info(media)")
    columns = [column[1] for column in cursor.fetchall()]
    
    print(f"Current columns: {columns}")
    
    if 'click_count' not in columns:
        print("Adding click_count column...")
        cursor.execute("ALTER TABLE media ADD COLUMN click_count INTEGER DEFAULT 0")
        conn.commit()
        print("Column added successfully")
    else:
        print("click_count column already exists")
    
    # Check if admin table exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='admin'")
    if not cursor.fetchone():
        print("Creating admin table...")
        cursor.execute('''
            CREATE TABLE admin (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username VARCHAR(80) UNIQUE NOT NULL,
                password_hash VARCHAR(120) NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        conn.commit()
        print("Admin table created successfully")
    else:
        print("Admin table already exists")
    
    conn.close()
    print("Database schema fix completed")

if __name__ == '__main__':
    fix_database_schema()