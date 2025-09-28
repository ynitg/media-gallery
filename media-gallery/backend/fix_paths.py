#!/usr/bin/env python3
import os
import glob
from app import app, db, Media

def fix_database_paths():
    """修复数据库中的文件路径"""
    
    with app.app_context():
        print("=== 修复数据库文件路径 ===")
        
        # 获取实际存在的文件
        images_dir = os.path.join(app.config['UPLOAD_FOLDER'], 'images')
        existing_files = set()
        
        if os.path.exists(images_dir):
            for filename in os.listdir(images_dir):
                existing_files.add(filename)
        
        print(f"Found {len(existing_files)} existing files")
        
        # 更新数据库记录
        media_items = Media.query.all()
        fixed_count = 0
        
        for media in media_items:
            # 检查是否是实际存在的文件
            if media.filename in existing_files:
                # 更新文件路径为绝对路径
                old_path = media.file_path
                new_path = os.path.join(app.config['UPLOAD_FOLDER'], 'images', media.filename)
                
                if old_path != new_path:
                    media.file_path = new_path
                    fixed_count += 1
                    print(f"Fixed: {media.filename}")
            else:
                # 如果文件不存在，尝试匹配
                print(f"File not found: {media.filename}")
        
        # 提交更改
        if fixed_count > 0:
            db.session.commit()
            print(f"Successfully fixed {fixed_count} file paths")
        else:
            print("No paths needed fixing")
        
        # 验证修复结果
        print("\n=== 验证修复结果 ===")
        media_items = Media.query.limit(3).all()
        for media in media_items:
            print(f"ID: {media.id}")
            print(f"Filename: {media.filename}")
            print(f"File path: {media.file_path}")
            print(f"File exists: {os.path.exists(media.file_path)}")
            print("---")

if __name__ == "__main__":
    fix_database_paths()