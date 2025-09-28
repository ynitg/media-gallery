#!/usr/bin/env python3
from PIL import Image, ImageDraw, ImageFont
import os
import sqlite3

def create_test_images():
    # 创建uploads/images目录
    os.makedirs('C:/agent/media-gallery/uploads/images', exist_ok=True)
    
    # 连接数据库获取媒体记录
    conn = sqlite3.connect('C:/agent/media-gallery/backend/media_gallery.db')
    cursor = conn.cursor()
    
    cursor.execute('SELECT id, filename, original_filename, tags FROM media')
    media_items = cursor.fetchall()
    
    # 为每个媒体记录创建对应的测试图片
    for media_id, filename, original_filename, tags in media_items:
        try:
            # 解析标签用于图片内容
            tag_list = tags.split(',') if tags else []
            main_tag = tag_list[0] if tag_list else "测试"
            
            # 创建图片
            img = Image.new('RGB', (300, 200), color=(102, 126, 234))
            draw = ImageDraw.Draw(img)
            
            # 尝试使用系统字体
            try:
                font = ImageFont.truetype("arial.ttf", 20)
            except:
                font = ImageFont.load_default()
            
            # 在图片上绘制文字
            text = main_tag
            bbox = draw.textbbox((0, 0), text, font=font)
            text_width = bbox[2] - bbox[0]
            text_height = bbox[3] - bbox[1]
            
            # 居中绘制文字
            x = (300 - text_width) / 2
            y = (200 - text_height) / 2
            draw.text((x, y), text, fill=(255, 255, 255), font=font)
            
            # 保存图片
            image_path = f'C:/agent/media-gallery/uploads/images/{filename}'
            img.save(image_path, 'JPEG')
            print(f'创建测试图片: {filename} - {text}')
            
        except Exception as e:
            print(f'创建图片失败 {filename}: {e}')
    
    conn.close()
    print('所有测试图片创建完成')

if __name__ == '__main__':
    create_test_images()