#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
九九乘法表生成器
支持多种显示格式
"""

def print_multiplication_table():
    """打印标准九九乘法表"""
    print("=" * 50)
    print("九九乘法表")
    print("=" * 50)
    
    for i in range(1, 10):
        for j in range(1, i + 1):
            print(f"{j} × {i} = {i*j:2d}", end="  ")
        print()  # 换行

def print_traditional_table():
    """打印传统格式的九九乘法表"""
    print("\n" + "=" * 50)
    print("传统格式九九乘法表")
    print("=" * 50)
    
    for i in range(1, 10):
        line = ""
        for j in range(1, i + 1):
            line += f"{j}×{i}={i*j} "
        print(line)

def print_vertical_table():
    """打印垂直格式的九九乘法表"""
    print("\n" + "=" * 50)
    print("垂直格式九九乘法表")
    print("=" * 50)
    
    for i in range(1, 10):
        print(f"\n{i} 的乘法表:")
        for j in range(1, 10):
            print(f"  {i} × {j} = {i*j}")

def print_square_table():
    """打印正方形格式的九九乘法表"""
    print("\n" + "=" * 50)
    print("正方形格式九九乘法表")
    print("=" * 50)
    
    # 打印表头
    print("   ", end="")
    for i in range(1, 10):
        print(f"{i:4d}", end="")
    print()
    print("   " + "-" * 36)
    
    # 打印表格内容
    for i in range(1, 10):
        print(f"{i:2d}|", end="")
        for j in range(1, 10):
            print(f"{i*j:4d}", end="")
        print()

def interactive_mode():
    """交互模式 - 让用户选择特定数字的乘法表"""
    print("\n" + "=" * 50)
    print("交互模式")
    print("=" * 50)
    
    while True:
        try:
            num = input("\n请输入要查看的数字 (1-9，输入 0 退出): ")
            if num == '0':
                break
            
            num = int(num)
            if 1 <= num <= 9:
                print(f"\n{num} 的乘法表:")
                print("-" * 20)
                for i in range(1, 10):
                    print(f"{num} × {i} = {num * i}")
            else:
                print("请输入 1-9 之间的数字！")
        except ValueError:
            print("请输入有效的数字！")

def main():
    """主函数"""
    print("九九乘法表生成器")
    print("作者: AI Assistant")
    print("=" * 50)
    
    while True:
        print("\n请选择显示格式:")
        print("1. 标准格式")
        print("2. 传统格式")
        print("3. 垂直格式")
        print("4. 正方形格式")
        print("5. 交互模式")
        print("0. 退出")
        
        choice = input("\n请输入选择 (0-5): ")
        
        if choice == '0':
            print("感谢使用！")
            break
        elif choice == '1':
            print_multiplication_table()
        elif choice == '2':
            print_traditional_table()
        elif choice == '3':
            print_vertical_table()
        elif choice == '4':
            print_square_table()
        elif choice == '5':
            interactive_mode()
        else:
            print("无效选择，请重新输入！")

if __name__ == "__main__":
    main()
