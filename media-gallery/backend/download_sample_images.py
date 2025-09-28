#!/usr/bin/env python3
import os
import requests
import uuid
from datetime import datetime
from app import app, db, Media

def download_images():
    """下载示例图片文件"""
    
    with app.app_context():
        # 确保上传目录存在
        os.makedirs('../uploads/images', exist_ok=True)
        
        # 使用 picsum.photos 生成随机图片
        sample_images = []
        categories = {
            "风景": ["山脉", "森林", "海洋", "湖泊", "日落", "雪景", "秋天", "海滩", "云彩"],
            "人物": ["肖像", "商务", "休闲", "微笑", "思考", "优雅", "友好", "自信"],
            "城市": ["建筑", "夜景", "街道", "摩天大楼", "桥梁", "设计", "市中心", "灯光", "广场"]
        }
        
        print("开始下载示例图片...")
        
        for category, tags_list in categories.items():
            for i, tag in enumerate(tags_list):
                try:
                    print(f"下载 {category} - {tag} 图片...")
                    
                    # 生成唯一ID和文件名
                    file_id = str(uuid.uuid4())
                    filename = f"{category}_{tag}_{i+1}.jpg"
                    new_filename = f"{file_id}_{filename}"
                    file_path = f"../uploads/images/{new_filename}"
                    
                    # 下载图片
                    image_url = f"https://picsum.photos/800/600?random={len(sample_images)+1}"
                    response = requests.get(image_url, timeout=30)
                    
                    if response.status_code == 200:
                        # 保存图片文件
                        with open(file_path, 'wb') as f:
                            f.write(response.content)
                        
                        # 创建数据库记录
                        tags = f"{category},{tag}"
                        media = Media(
                            id=file_id,
                            filename=new_filename,
                            original_filename=filename,
                            file_type='image',
                            file_path=file_path,
                            tags=tags,
                            file_size=len(response.content)
                        )
                        
                        db.session.add(media)
                        sample_images.append(media)
                        print(f"OK 已下载并保存: {filename}")
                    else:
                        print(f"ERROR 下载失败: {filename}")
                        
                except Exception as e:
                    print(f"ERROR 处理 {category} - {tag} 时出错: {e}")
                    continue
        
        # 提交所有更改
        db.session.commit()
        print(f"\n成功下载并创建了 {len(sample_images)} 张示例图片!")
        
        # 显示数据库中的所有记录
        all_media = Media.query.all()
        print(f"\n数据库中现在有 {len(all_media)} 条媒体记录:")
        for media in all_media:
            print(f"- {media.original_filename} (标签: {media.tags})")

if __name__ == "__main__":
    download_images()