#!/usr/bin/env python3
import os
import uuid
from datetime import datetime
from app import app, db, Media
import requests

def create_sample_video_record():
    """创建一个示例视频记录（使用网络视频URL）"""
    
    with app.app_context():
        # 确保上传目录存在
        os.makedirs('../uploads/videos', exist_ok=True)
        
        # 使用一个公开可访问的视频URL
        video_url = "https://www.w3schools.com/html/mov_bbb.mp4"
        
        try:
            # 下载视频文件
            print("正在下载示例视频...")
            response = requests.get(video_url, timeout=30)
            
            if response.status_code == 200:
                # 生成唯一ID和文件名
                file_id = str(uuid.uuid4())
                filename = "big_buck_bunny.mp4"
                new_filename = f"{file_id}_{filename}"
                file_path = f"../uploads/videos/{new_filename}"
                
                # 保存视频文件
                with open(file_path, 'wb') as f:
                    f.write(response.content)
                
                # 创建数据库记录
                media = Media(
                    id=file_id,
                    filename=new_filename,
                    original_filename=filename,
                    file_type='video',
                    file_path=file_path,
                    tags='测试,视频,卡通',
                    file_size=len(response.content)
                )
                
                db.session.add(media)
                db.session.commit()
                
                print(f"✅ 示例视频创建成功!")
                print(f"文件名: {filename}")
                print(f"文件大小: {len(response.content) / 1024:.2f} KB")
                print(f"标签: 测试,视频,卡通")
                
                return True
            else:
                print(f"❌ 视频下载失败: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ 创建视频时出错: {e}")
            return False

def create_test_video_from_local():
    """如果没有网络，创建一个简单的视频文件记录用于测试"""
    
    with app.app_context():
        # 确保上传目录存在
        os.makedirs('../uploads/videos', exist_ok=True)
        
        # 创建一个小的测试视频文件（模拟）
        file_id = str(uuid.uuid4())
        filename = "test_video.mp4"
        new_filename = f"{file_id}_{filename}"
        file_path = f"../uploads/videos/{new_filename}"
        
        # 创建一个简单的文件（实际项目中应该是真实的视频文件）
        with open(file_path, 'wb') as f:
            # 写入一些模拟数据（这只是用于测试的占位符）
            f.write(b'fake_video_data_for_testing_purposes')
        
        # 创建数据库记录
        media = Media(
            id=file_id,
            filename=new_filename,
            original_filename=filename,
            file_type='video',
            file_path=file_path,
            tags='测试,视频,示例',
            file_size=1024  # 模拟文件大小
        )
        
        db.session.add(media)
        db.session.commit()
        
        print(f"✅ 测试视频记录创建成功!")
        print(f"文件名: {filename}")
        print(f"标签: 测试,视频,示例")
        print("注意: 这是一个测试记录，实际视频文件需要您手动上传")

if __name__ == "__main__":
    print("=== 创建示例视频 ===")
    
    # 首先尝试从网络下载
    if create_sample_video_record():
        print("网络视频创建成功!")
    else:
        print("网络视频创建失败，创建本地测试记录...")
        create_test_video_from_local()
    
    # 显示数据库中的视频记录
    print("\n=== 数据库中的视频记录 ===")
    videos = Media.query.filter_by(file_type='video').all()
    for video in videos:
        print(f"- {video.original_filename} (标签: {video.tags})")
        print(f"  文件路径: {video.file_path}")
        print(f"  文件大小: {video.file_size} bytes")
        print(f"  文件存在: {os.path.exists(video.file_path)}")
        print()