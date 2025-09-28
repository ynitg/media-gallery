#!/usr/bin/env python3
import sqlite3
import requests
import os

# 下载一个测试图片
def download_test_images():
    image_urls = [
        "https://via.placeholder.com/300x200/667eea/ffffff?text=风景+山脉",
        "https://via.placeholder.com/300x200/764ba2/ffffff?text=人物+肖像", 
        "https://via.placeholder.com/300x200/f093fb/ffffff?text=城市+建筑",
        "https://via.placeholder.com/300x200/4facfe/ffffff?text=风景+海洋",
        "https://via.placeholder.com/300x200/43e97b/ffffff?text=人物+生活"
    ]
    
    os.makedirs('C:/agent/media-gallery/uploads/images', exist_ok=True)
    
    conn = sqlite3.connect('C:/agent/media-gallery/backend/media_gallery.db')
    cursor = conn.cursor()
    
    # 获取现有的媒体记录
    cursor.execute('SELECT id, filename FROM media LIMIT 5')
    media_items = cursor.fetchall()
    
    for i, (media_id, filename) in enumerate(media_items):
        if i < len(image_urls):
            try:
                # 下载图片
                response = requests.get(image_urls[i])
                if response.status_code == 200:
                    # 保存图片
                    image_path = f'C:/agent/media-gallery/uploads/images/{filename}'
                    with open(image_path, 'wb') as f:
                        f.write(response.content)
                    print(f'下载图片: {filename}')
            except Exception as e:
                print(f'下载图片失败 {filename}: {e}')
    
    conn.close()
    print('图片下载完成')

if __name__ == '__main__':
    download_test_images()