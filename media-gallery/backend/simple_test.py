#!/usr/bin/env python3
import requests
import json

def test_api():
    """测试API是否正常工作"""
    
    base_url = "http://localhost:5000"
    
    print("测试API端点...")
    
    # 测试获取媒体列表
    try:
        response = requests.get(f"{base_url}/api/media?per_page=5")
        if response.status_code == 200:
            data = response.json()
            print(f"OK 获取媒体列表成功，共 {data['total']} 条记录")
            print(f"  当前页: {data['current_page']}/{data['pages']}")
            print(f"  显示 {len(data['media'])} 条记录")
            
            # 显示前几条记录
            for i, media in enumerate(data['media'][:3]):
                print(f"  {i+1}. {media['original_filename']} ({media['file_type']})")
                print(f"     标签: {media['tags']}")
        else:
            print(f"ERROR 获取媒体列表失败: {response.status_code}")
    except Exception as e:
        print(f"ERROR API连接失败: {e}")
    
    # 测试获取标签
    try:
        response = requests.get(f"{base_url}/api/tags")
        if response.status_code == 200:
            data = response.json()
            print(f"OK 获取标签成功，共 {len(data['tags'])} 个标签")
            print(f"  标签列表: {', '.join(data['tags'][:10])}...")
        else:
            print(f"ERROR 获取标签失败: {response.status_code}")
    except Exception as e:
        print(f"ERROR 获取标签失败: {e}")

if __name__ == "__main__":
    test_api()