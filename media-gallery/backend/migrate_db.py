#!/usr/bin/env python3
import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import app, db, Media

def migrate_database():
    """为现有数据库记录添加click_count字段"""
    
    with app.app_context():
        # 检查是否已有click_count字段
        try:
            # 尝试访问click_count字段
            test_media = Media.query.first()
            if hasattr(test_media, 'click_count'):
                print("click_count字段已存在，无需迁移")
                return True
            
            print("ERROR: click_count字段不存在，需要手动更新数据库结构")
            return False
            
        except Exception as e:
            print(f"检查数据库时出错: {e}")
            return False

def add_click_counts():
    """为所有现有媒体记录添加点击计数"""
    
    with app.app_context():
        try:
            media_items = Media.query.all()
            print(f"找到 {len(media_items)} 个媒体记录")
            
            for media in media_items:
                if not hasattr(media, 'click_count') or media.click_count is None:
                    media.click_count = 0
                    print(f"为媒体 {media.original_filename} 设置点击计数为 0")
            
            db.session.commit()
            print("数据库迁移完成！")
            return True
            
        except Exception as e:
            print(f"迁移失败: {e}")
            db.session.rollback()
            return False

if __name__ == "__main__":
    print("=== 数据库迁移 ===")
    
    if add_click_counts():
        print("✅ 迁移成功")
    else:
        print("❌ 迁移失败")