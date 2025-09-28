#!/usr/bin/env python3
import os
import sqlite3
import uuid
from datetime import datetime

def scan_and_add_uploads():
    # 连接数据库
    conn = sqlite3.connect('media_gallery.db')
    cursor = conn.cursor()
    
    # 确保表存在
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS media (
            id TEXT PRIMARY KEY,
            filename TEXT NOT NULL,
            original_filename TEXT NOT NULL,
            file_type TEXT NOT NULL,
            file_path TEXT NOT NULL,
            tags TEXT,
            file_size INTEGER,
            click_count INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # 扫描图片文件夹
    images_dir = 'C:/agent/media-gallery/uploads/images'
    videos_dir = 'C:/agent/media-gallery/uploads/videos'
    
    added_count = 0
    
    # 处理图片文件
    for filename in os.listdir(images_dir):
        if filename.endswith(('.jpg', '.jpeg', '.png', '.gif')):
            file_path = os.path.join(images_dir, filename)
            file_size = os.path.getsize(file_path)
            
            # 从文件名中提取标签
            # 文件名格式: uuid_标签1_标签2_..._原始名.jpg
            parts = filename.replace('.jpg', '').replace('.jpeg', '').replace('.png', '').replace('.gif', '').split('_')
            
            # 提取UUID（第一个部分）
            file_id = parts[0]
            
            # 提取标签（中间部分）
            tags = []
            original_name_parts = []
            
            # 跳过UUID，遍历剩余部分
            for part in parts[1:]:
                # 如果包含数字且后缀，可能是原始文件名的一部分
                if part.isdigit() and len(part) <= 2:
                    original_name_parts.append(part)
                elif part in ['jpg', 'jpeg', 'png', 'gif']:
                    continue
                else:
                    # 可能是标签或原始文件名
                    if len(part) <= 10 and not any(c.isdigit() for c in part):
                        tags.append(part)
                    else:
                        original_name_parts.append(part)
            
            # 如果没有找到标签，从文件名推断
            if not tags:
                if any(keyword in filename.lower() for keyword in ['风景', '山脉', '湖泊', '海洋', '海滩', '森林', '日落', '秋天', '云彩']):
                    tags = ['风景']
                elif any(keyword in filename.lower() for keyword in ['人物', '肖像', '微笑', '友好', '优雅', '自信', '思考', '商务']):
                    tags = ['人物']
                elif any(keyword in filename.lower() for keyword in ['城市', '建筑', '桥梁', '街道', '夜景', '广场', '灯光', '摩天大楼', '市中心', '设计']):
                    tags = ['城市']
                else:
                    tags = ['其他']
            
            # 构建原始文件名
            original_filename = '_'.join(original_name_parts) if original_name_parts else filename
            
            # 检查是否已存在
            cursor.execute('SELECT id FROM media WHERE id = ?', (file_id,))
            if cursor.fetchone():
                print(f'文件已存在: {filename}')
                continue
            
            # 插入数据库
            cursor.execute('''
                INSERT INTO media (id, filename, original_filename, file_type, file_path, tags, file_size, click_count)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (file_id, filename, original_filename, 'image', file_path, ','.join(tags), file_size, 0))
            
            print(f'添加图片: {filename} - 标签: {tags}')
            added_count += 1
    
    # 处理视频文件
    for filename in os.listdir(videos_dir):
        if filename.endswith(('.mp4', '.avi', '.mov', '.wmv')):
            file_path = os.path.join(videos_dir, filename)
            file_size = os.path.getsize(file_path)
            
            # 从文件名中提取UUID
            parts = filename.split('_')
            file_id = parts[0]
            
            # 构建原始文件名
            original_filename = '_'.join(parts[1:]) if len(parts) > 1 else filename
            
            # 检查是否已存在
            cursor.execute('SELECT id FROM media WHERE id = ?', (file_id,))
            if cursor.fetchone():
                print(f'文件已存在: {filename}')
                continue
            
            # 插入数据库
            cursor.execute('''
                INSERT INTO media (id, filename, original_filename, file_type, file_path, tags, file_size, click_count)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (file_id, filename, original_filename, 'video', file_path, '视频', file_size, 0))
            
            print(f'添加视频: {filename}')
            added_count += 1
    
    conn.commit()
    conn.close()
    
    print(f'完成！共添加了 {added_count} 个媒体文件到数据库')

if __name__ == '__main__':
    scan_and_add_uploads()