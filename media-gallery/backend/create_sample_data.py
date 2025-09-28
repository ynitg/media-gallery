#!/usr/bin/env python3
import os
import sys
import requests
import uuid
from datetime import datetime
from app import app, db, Media

# 示例图片URL列表 (使用免费的图片服务)
SAMPLE_IMAGES = [
    {
        "url": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop",
        "filename": "mountain_landscape.jpg",
        "tags": "风景,自然,山脉",
        "category": "风景"
    },
    {
        "url": "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop",
        "filename": "forest_path.jpg",
        "tags": "风景,自然,森林",
        "category": "风景"
    },
    {
        "url": "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&h=600&fit=crop",
        "filename": "ocean_waves.jpg",
        "tags": "风景,自然,海洋",
        "category": "风景"
    },
    {
        "url": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop",
        "filename": "alpine_lake.jpg",
        "tags": "风景,自然,湖泊",
        "category": "风景"
    },
    {
        "url": "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&h=600&fit=crop",
        "filename": "sunset_sky.jpg",
        "tags": "风景,自然,日落",
        "category": "风景"
    },
    {
        "url": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop",
        "filename": "snow_mountain.jpg",
        "tags": "风景,自然,雪景",
        "category": "风景"
    },
    {
        "url": "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop",
        "filename": "autumn_forest.jpg",
        "tags": "风景,自然,秋天",
        "category": "风景"
    },
    {
        "url": "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&h=600&fit=crop",
        "filename": "beach_sunset.jpg",
        "tags": "风景,自然,海滩",
        "category": "风景"
    },
    {
        "url": "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&h=600&fit=crop",
        "filename": "cloudy_sky.jpg",
        "tags": "风景,自然,云彩",
        "category": "风景"
    },
    {
        "url": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop",
        "filename": "mountain_range.jpg",
        "tags": "风景,自然,山脉",
        "category": "风景"
    },
    {
        "url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop",
        "filename": "portrait_man.jpg",
        "tags": "人物,肖像,男性",
        "category": "人物"
    },
    {
        "url": "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=800&h=600&fit=crop",
        "filename": "portrait_woman.jpg",
        "tags": "人物,肖像,女性",
        "category": "人物"
    },
    {
        "url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop",
        "filename": "business_man.jpg",
        "tags": "人物,商务,男性",
        "category": "人物"
    },
    {
        "url": "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=800&h=600&fit=crop",
        "filename": "professional_woman.jpg",
        "tags": "人物,职业,女性",
        "category": "人物"
    },
    {
        "url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop",
        "filename": "casual_man.jpg",
        "tags": "人物,休闲,男性",
        "category": "人物"
    },
    {
        "url": "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=800&h=600&fit=crop",
        "filename": "smiling_woman.jpg",
        "tags": "人物,微笑,女性",
        "category": "人物"
    },
    {
        "url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop",
        "filename": "thoughtful_man.jpg",
        "tags": "人物,思考,男性",
        "category": "人物"
    },
    {
        "url": "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=800&h=600&fit=crop",
        "filename": "elegant_woman.jpg",
        "tags": "人物,优雅,女性",
        "category": "人物"
    },
    {
        "url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop",
        "filename": "friendly_man.jpg",
        "tags": "人物,友好,男性",
        "category": "人物"
    },
    {
        "url": "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=800&h=600&fit=crop",
        "filename": "confident_woman.jpg",
        "tags": "人物,自信,女性",
        "category": "人物"
    },
    {
        "url": "https://images.unsplash.com/photo-1464822759844-d150baec0494?w=800&h=600&fit=crop",
        "filename": "city_skyline.jpg",
        "tags": "城市,建筑,夜景",
        "category": "城市"
    },
    {
        "url": "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&h=600&fit=crop",
        "filename": "modern_building.jpg",
        "tags": "城市,建筑,现代",
        "category": "城市"
    },
    {
        "url": "https://images.unsplash.com/photo-1464822759844-d150baec0494?w=800&h=600&fit=crop",
        "filename": "urban_street.jpg",
        "tags": "城市,街道,都市",
        "category": "城市"
    },
    {
        "url": "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&h=600&fit=crop",
        "filename": "skyscrapers.jpg",
        "tags": "城市,摩天大楼,建筑",
        "category": "城市"
    },
    {
        "url": "https://images.unsplash.com/photo-1464822759844-d150baec0494?w=800&h=600&fit=crop",
        "filename": "city_bridge.jpg",
        "tags": "城市,桥梁,夜景",
        "category": "城市"
    },
    {
        "url": "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&h=600&fit=crop",
        "filename": "architecture.jpg",
        "tags": "城市,建筑,设计",
        "category": "城市"
    },
    {
        "url": "https://images.unsplash.com/photo-1464822759844-d150baec0494?w=800&h=600&fit=crop",
        "filename": "downtown_city.jpg",
        "tags": "城市,市中心,都市",
        "category": "城市"
    },
    {
        "url": "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&h=600&fit=crop",
        "filename": "glass_building.jpg",
        "tags": "城市,玻璃建筑,现代",
        "category": "城市"
    },
    {
        "url": "https://images.unsplash.com/photo-1464822759844-d150baec0494?w=800&h=600&fit=crop",
        "filename": "city_lights.jpg",
        "tags": "城市,灯光,夜景",
        "category": "城市"
    },
    {
        "url": "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&h=600&fit=crop",
        "filename": "urban_plaza.jpg",
        "tags": "城市,广场,公共空间",
        "category": "城市"
    }
]

def download_and_create_samples():
    """下载示例图片并创建数据库记录"""
    
    with app.app_context():
        # 确保上传目录存在
        os.makedirs('../uploads/images', exist_ok=True)
        
        print("开始创建示例数据...")
        
        for i, img_data in enumerate(SAMPLE_IMAGES):
            try:
                print(f"处理第 {i+1}/{len(SAMPLE_IMAGES)} 张图片: {img_data['filename']}")
                
                # 生成唯一ID和文件名
                file_id = str(uuid.uuid4())
                new_filename = f"{file_id}_{img_data['filename']}"
                file_path = f"../uploads/images/{new_filename}"
                
                # 下载数据库记录（不下载实际文件，使用URL）
                media = Media(
                    id=file_id,
                    filename=new_filename,
                    original_filename=img_data['filename'],
                    file_type='image',
                    file_path=file_path,
                    tags=img_data['tags'],
                    file_size=102400  # 假设文件大小
                )
                
                db.session.add(media)
                
            except Exception as e:
                print(f"处理图片 {img_data['filename']} 时出错: {e}")
                continue
        
        # 提交所有更改
        db.session.commit()
        print(f"成功创建了 {len(SAMPLE_IMAGES)} 条示例数据记录!")
        
        # 显示数据库中的所有记录
        all_media = Media.query.all()
        print(f"\n数据库中现在有 {len(all_media)} 条媒体记录:")
        for media in all_media:
            print(f"- {media.original_filename} (标签: {media.tags})")

if __name__ == "__main__":
    download_and_create_samples()