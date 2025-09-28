#!/usr/bin/env python3
import os
import uuid
import shutil
from datetime import datetime
from app import app, db, Media

def upload_existing_video():
    """上传已存在的视频文件到媒体库"""
    
    video_source_path = "c:/agent/2e66e637d82855f132b87b1d711b11df.mp4"
    
    with app.app_context():
        # 检查源文件是否存在
        if not os.path.exists(video_source_path):
            print(f"❌ 源文件不存在: {video_source_path}")
            return False
        
        # 确保上传目录存在
        videos_dir = os.path.join(app.config['UPLOAD_FOLDER'], 'videos')
        os.makedirs(videos_dir, exist_ok=True)
        
        # 生成唯一ID和文件名
        file_id = str(uuid.uuid4())
        original_filename = os.path.basename(video_source_path)
        new_filename = f"{file_id}_{original_filename}"
        file_path = os.path.join(videos_dir, new_filename)
        
        try:
            # 复制视频文件到上传目录
            shutil.copy2(video_source_path, file_path)
            
            # 获取文件大小
            file_size = os.path.getsize(file_path)
            
            # 创建数据库记录
            media = Media(
                id=file_id,
                filename=new_filename,
                original_filename=original_filename,
                file_type='video',
                file_path=file_path,
                tags='测试,视频,用户上传',
                file_size=file_size
            )
            
            db.session.add(media)
            db.session.commit()
            
            print(f"OK 视频上传成功!")
            print(f"原始文件名: {original_filename}")
            print(f"系统文件名: {new_filename}")
            print(f"文件大小: {file_size / 1024:.2f} KB")
            print(f"标签: 测试,视频,用户上传")
            print(f"文件路径: {file_path}")
            print(f"访问URL: http://localhost:5000/uploads/videos/{new_filename}")
            
            return True
            
        except Exception as e:
            print(f"ERROR 上传失败: {e}")
            return False

def test_video_access():
    """测试视频文件访问"""
    
    with app.app_context():
        # 获取最新的视频记录
        latest_video = Media.query.filter_by(file_type='video').order_by(Media.created_at.desc()).first()
        
        if latest_video:
            print(f"\n=== 测试视频访问 ===")
            print(f"视频文件: {latest_video.original_filename}")
            print(f"文件路径: {latest_video.file_path}")
            print(f"文件存在: {os.path.exists(latest_video.file_path)}")
            print(f"文件大小: {latest_video.file_size} bytes")
            
            # 测试文件访问URL
            filename = os.path.basename(latest_video.file_path)
            encoded_filename = filename.replace('\\', '/')  # 确保路径格式正确
            print(f"访问URL: http://localhost:5000/uploads/videos/{encoded_filename}")
            
            return latest_video
        else:
            print("ERROR 没有找到视频记录")
            return None

if __name__ == "__main__":
    print("=== 上传视频文件 ===")
    
    if upload_existing_video():
        print("\n上传成功! 现在您可以:")
        print("1. 访问网站 http://localhost:8000 查看视频")
        print("2. 点击视频进行播放测试")
        print("3. 使用标签筛选功能")
        
        # 测试视频访问
        test_video_access()
    else:
        print("❌ 上传失败")