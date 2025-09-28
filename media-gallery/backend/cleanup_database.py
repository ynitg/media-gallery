#!/usr/bin/env python3
import os
from app import app, db, Media

def cleanup_database():
    """清理数据库中无效的记录"""
    
    with app.app_context():
        print("=== 清理无效记录 ===")
        
        # 获取实际存在的文件
        images_dir = os.path.join(app.config['UPLOAD_FOLDER'], 'images')
        existing_files = set()
        
        if os.path.exists(images_dir):
            for filename in os.listdir(images_dir):
                existing_files.add(filename)
        
        print(f"Found {len(existing_files)} existing files")
        
        # 查找并删除无效记录
        media_items = Media.query.all()
        invalid_count = 0
        
        for media in media_items:
            if media.filename not in existing_files:
                print(f"Deleting invalid record: {media.filename}")
                db.session.delete(media)
                invalid_count += 1
        
        # 提交更改
        if invalid_count > 0:
            db.session.commit()
            print(f"Successfully deleted {invalid_count} invalid records")
        else:
            print("No invalid records found")
        
        # 显示最终结果
        print(f"\n=== 最终结果 ===")
        final_count = Media.query.count()
        print(f"Total valid records: {final_count}")
        
        # 验证所有记录
        media_items = Media.query.limit(3).all()
        for media in media_items:
            print(f"ID: {media.id}")
            print(f"Filename: {media.filename}")
            print(f"File path: {media.file_path}")
            print(f"File exists: {os.path.exists(media.file_path)}")
            print("---")

if __name__ == "__main__":
    cleanup_database()