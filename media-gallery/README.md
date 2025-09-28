# 媒体分享网站

一个功能完整的媒体分享网站，支持图片和视频上传、标签分类、瀑布流展示和预览功能。

## 功能特性

- 📸 **多媒体上传**: 支持图片（PNG、JPG、JPEG、GIF）和视频（MP4、AVI、MOV、WMV）上传
- 🏷️ **标签分类**: 可以为每个媒体文件添加标签，如风景、人物等
- 🌊 **瀑布流展示**: 响应式网格布局，自适应不同屏幕尺寸
- 🔍 **标签筛选**: 按标签筛选媒体文件
- 📱 **点击预览**: 点击媒体文件放大查看，视频自动播放
- 📱 **响应式设计**: 适配桌面和移动设备
- 🚀 **无限滚动**: 滚动到底部自动加载更多内容

## 项目结构

```
media-gallery/
├── backend/
│   ├── app.py              # Flask后端应用
│   └── requirements.txt    # Python依赖
├── frontend/
│   ├── index.html          # 主页面
│   ├── styles.css          # 样式文件
│   └── script.js           # 前端JavaScript
├── uploads/
│   ├── images/             # 图片存储目录
│   └── videos/             # 视频存储目录
└── README.md               # 项目说明
```

## 安装和运行

### 1. 安装后端依赖

```bash
cd backend
pip install -r requirements.txt
```

### 2. 运行后端服务器

```bash
cd backend
python app.py
```

后端将在 `http://localhost:5000` 运行

### 3. 运行前端

将前端文件放在Web服务器中，或使用Python的简单HTTP服务器：

```bash
cd frontend
python -m http.server 8000
```

前端将在 `http://localhost:8000` 运行

## API接口

### 上传媒体文件
- **POST** `/api/upload`
- **参数**: 
  - `file`: 媒体文件
  - `tags`: 标签（逗号分隔）

### 获取媒体列表
- **GET** `/api/media`
- **参数**:
  - `page`: 页码
  - `per_page`: 每页数量
  - `tag`: 标签筛选

### 获取单个媒体
- **GET** `/api/media/<media_id>`

### 获取所有标签
- **GET** `/api/tags`

### 文件访问
- **GET** `/uploads/<path:filename>`

## 使用说明

1. **上传媒体**: 点击"上传媒体"按钮，选择文件并添加标签
2. **浏览媒体**: 在瀑布流中查看所有媒体文件
3. **筛选标签**: 使用下拉菜单按标签筛选
4. **预览媒体**: 点击媒体文件查看大图或播放视频

## 技术栈

- **后端**: Flask, SQLAlchemy, SQLite
- **前端**: HTML, CSS, JavaScript (原生)
- **数据库**: SQLite
- **文件存储**: 本地文件系统

## 注意事项

- 文件大小限制：100MB
- 支持的图片格式：PNG, JPG, JPEG, GIF
- 支持的视频格式：MP4, AVI, MOV, WMV
- 上传目录会自动创建
- 数据库文件会在首次运行时创建