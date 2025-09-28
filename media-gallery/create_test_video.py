#!/usr/bin/env python3
import cv2
import numpy as np
import os

def create_test_video():
    """创建一个简单的测试视频"""
    
    # 确保输出目录存在
    os.makedirs('uploads/videos', exist_ok=True)
    
    # 视频参数
    width, height = 640, 480
    fps = 30
    duration = 10  # 10秒
    total_frames = fps * duration
    
    # 创建视频写入器
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    output_path = 'uploads/videos/test_video.mp4'
    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
    
    print(f"正在创建测试视频: {output_path}")
    
    try:
        for frame_num in range(total_frames):
            # 创建一个渐变背景
            progress = frame_num / total_frames
            
            # 背景颜色从蓝色渐变到红色
            blue = int(255 * (1 - progress))
            red = int(255 * progress)
            green = int(128 * np.sin(progress * np.pi * 4))
            
            # 创建背景
            frame = np.full((height, width, 3), [blue, green, red], dtype=np.uint8)
            
            # 添加移动的圆圈
            center_x = int(width * progress)
            center_y = int(height / 2 + height / 4 * np.sin(progress * np.pi * 8))
            radius = 30
            cv2.circle(frame, (center_x, center_y), radius, (255, 255, 255), -1)
            
            # 添加文字
            text = f"测试视频 - 第 {frame_num + 1} 帧"
            cv2.putText(frame, text, (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
            
            # 添加时间戳
            time_text = f"时间: {frame_num / fps:.1f}s"
            cv2.putText(frame, time_text, (50, 100), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
            
            # 写入帧
            out.write(frame)
            
            if frame_num % 30 == 0:
                print(f"进度: {frame_num / total_frames * 100:.1f}%")
        
        print("视频创建完成!")
        
    except Exception as e:
        print(f"创建视频时出错: {e}")
    finally:
        out.release()
    
    # 检查文件是否创建成功
    if os.path.exists(output_path):
        file_size = os.path.getsize(output_path)
        print(f"视频文件大小: {file_size / 1024 / 1024:.2f} MB")
        return output_path
    else:
        print("视频文件创建失败")
        return None

if __name__ == "__main__":
    video_path = create_test_video()
    if video_path:
        print(f"测试视频已创建: {video_path}")
        print("您现在可以通过网站上传这个视频来测试视频播放功能")
    else:
        print("视频创建失败")