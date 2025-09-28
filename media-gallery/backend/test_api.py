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
            print(f"✓ 获取媒体列表成功，共 {data['total']} 条记录")
            print(f"  当前页: {data['current_page']}/{data['pages']}")
            print(f"  显示 {len(data['media'])} 条记录")
            
            # 显示前几条记录
            for i, media in enumerate(data['media'][:3]):
                print(f"  {i+1}. {media['original_filename']} ({media['file_type']})")
                print(f"     标签: {media['tags']}")
        else:
            print(f"✗ 获取媒体列表失败: {response.status_code}")
    except Exception as e:
        print(f"✗ API连接失败: {e}")
    
    # 测试获取标签
    try:
        response = requests.get(f"{base_url}/api/tags")
        if response.status_code == 200:
            data = response.json()
            print(f"✓ 获取标签成功，共 {len(data['tags'])} 个标签")
            print(f"  标签列表: {', '.join(data['tags'][:10])}...")
        else:
            print(f"✗ 获取标签失败: {response.status_code}")
    except Exception as e:
        print(f"✗ 获取标签失败: {e}")
    
    # 测试文件访问
    try:
        # 获取一个媒体项
        response = requests.get(f"{base_url}/api/media?per_page=1")
        if response.status_code == 200:
            data = response.json()
            if data['media']:
                media = data['media'][0]
                file_path = media['file_path'].replace('../', '')
                file_url = f"{base_url}/{file_path}"
                
                print(f"测试文件访问: {file_url}")
                file_response = requests.head(file_url)
                if file_response.status_code == 200:
                    print("✓ 文件访问成功")
                else:
                    print(f"✗ 文件访问失败: {file_response.status_code}")
    except Exception as e:
        print(f"✗ 文件访问测试失败: {e}")

if __name__ == "__main__":
    test_api()