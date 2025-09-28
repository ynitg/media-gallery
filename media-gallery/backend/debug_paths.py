#!/usr/bin/env python3
import os
from app import app, db, Media

def debug_paths():
    """调试文件路径问题"""
    
    with app.app_context():
        print("=== 调试文件路径 ===")
        print(f"UPLOAD_FOLDER: {app.config['UPLOAD_FOLDER']}")
        print(f"UPLOAD_FOLDER exists: {os.path.exists(app.config['UPLOAD_FOLDER'])}")
        
        images_dir = os.path.join(app.config['UPLOAD_FOLDER'], 'images')
        print(f"Images directory: {images_dir}")
        print(f"Images directory exists: {os.path.exists(images_dir)}")
        
        if os.path.exists(images_dir):
            files = os.listdir(images_dir)
            print(f"Files in images directory: {len(files)}")
            print(f"First few files: {files[:5]}")
        
        # 检查数据库中的记录
        print("\n=== 数据库记录 ===")
        media_items = Media.query.limit(3).all()
        for media in media_items:
            print(f"ID: {media.id}")
            print(f"Filename: {media.filename}")
            print(f"File path: {media.file_path}")
            print(f"File path exists: {os.path.exists(media.file_path)}")
            print(f"Expected path: {os.path.join(app.config['UPLOAD_FOLDER'], 'images', media.filename)}")
            print(f"Expected path exists: {os.path.exists(os.path.join(app.config['UPLOAD_FOLDER'], 'images', media.filename))}")
            print("---")

if __name__ == "__main__":
    debug_paths()