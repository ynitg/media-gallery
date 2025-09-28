#!/usr/bin/env python3
import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, request, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.utils import secure_filename
import uuid
from datetime import datetime

app = Flask(__name__)
CORS(app)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///media_gallery.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'C:/agent/media-gallery/uploads'
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'mp4', 'avi', 'mov', 'wmv'}

db = SQLAlchemy(app)

class Media(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    filename = db.Column(db.String(255), nullable=False)
    original_filename = db.Column(db.String(255), nullable=False)
    file_type = db.Column(db.String(50), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    tags = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    file_size = db.Column(db.Integer, nullable=False)
    click_count = db.Column(db.Integer, default=0)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_file_type(filename):
    ext = filename.rsplit('.', 1)[1].lower()
    if ext in ['png', 'jpg', 'jpeg', 'gif']:
        return 'image'
    elif ext in ['mp4', 'avi', 'mov', 'wmv']:
        return 'video'
    return 'unknown'

@app.route('/api/media', methods=['GET'])
def get_media():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    tag_filter = request.args.get('tag', '')
    
    query = Media.query
    if tag_filter:
        query = query.filter(Media.tags.contains(tag_filter))
    
    media_items = query.order_by(Media.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    result = []
    for media in media_items.items:
        result.append({
            'id': media.id,
            'filename': media.filename,
            'original_filename': media.original_filename,
            'file_type': media.file_type,
            'file_path': media.file_path,
            'tags': media.tags,
            'created_at': media.created_at.isoformat(),
            'file_size': media.file_size,
            'click_count': media.click_count
        })
    
    return jsonify({
        'media': result,
        'total': media_items.total,
        'pages': media_items.pages,
        'current_page': media_items.page
    })

@app.route('/api/media/<media_id>', methods=['GET'])
def get_media_item(media_id):
    media = Media.query.get_or_404(media_id)
    # 增加点击计数
    media.click_count += 1
    db.session.commit()
    return jsonify({
        'id': media.id,
        'filename': media.filename,
        'original_filename': media.original_filename,
        'file_type': media.file_type,
        'file_path': media.file_path,
        'tags': media.tags,
        'created_at': media.created_at.isoformat(),
        'file_size': media.file_size,
        'click_count': media.click_count
    })

@app.route('/uploads/<path:filename>')
def serve_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/api/tags', methods=['GET'])
def get_tags():
    media_items = Media.query.all()
    tag_stats = {}
    
    for media in media_items:
        if media.tags:
            for tag in media.tags.split(','):
                tag = tag.strip()
                if tag:
                    if tag not in tag_stats:
                        tag_stats[tag] = {'count': 0, 'clicks': 0}
                    tag_stats[tag]['count'] += 1
                    tag_stats[tag]['clicks'] += media.click_count
    
    # 计算标签权重
    tags_with_weight = []
    for tag, stats in tag_stats.items():
        weight = stats['clicks'] + (stats['count'] * 5)
        tags_with_weight.append({
            'tag': tag,
            'weight': weight,
            'count': stats['count'],
            'clicks': stats['clicks']
        })
    
    return jsonify({'tags': sorted(tags_with_weight, key=lambda x: x['weight'], reverse=True)})

# 创建示例数据
def create_sample_data():
    with app.app_context():
        # 检查是否已有数据
        try:
            if Media.query.count() > 0:
                print('Sample data already exists')
                return
        except Exception as e:
            print(f'Error checking existing data: {e}')
            return
            
        sample_data = [
            {'filename': 'sample1.jpg', 'original_filename': '风景_山脉_1.jpg', 'file_type': 'image', 'tags': '风景,山脉,自然', 'click_count': 25},
            {'filename': 'sample2.jpg', 'original_filename': '人物_肖像_1.jpg', 'file_type': 'image', 'tags': '人物,肖像,摄影', 'click_count': 15},
            {'filename': 'sample3.jpg', 'original_filename': '城市_建筑_1.jpg', 'file_type': 'image', 'tags': '城市,建筑,现代', 'click_count': 8},
            {'filename': 'sample4.jpg', 'original_filename': '风景_海洋_1.jpg', 'file_type': 'image', 'tags': '风景,海洋,自然', 'click_count': 32},
            {'filename': 'sample5.jpg', 'original_filename': '人物_生活_1.jpg', 'file_type': 'image', 'tags': '人物,生活,日常', 'click_count': 12},
            {'filename': 'sample6.jpg', 'original_filename': '风景_森林_1.jpg', 'file_type': 'image', 'tags': '风景,森林,自然', 'click_count': 18},
            {'filename': 'sample7.jpg', 'original_filename': '城市_夜景_1.jpg', 'file_type': 'image', 'tags': '城市,夜景,灯光', 'click_count': 22},
            {'filename': 'sample8.jpg', 'original_filename': '人物_运动_1.jpg', 'file_type': 'image', 'tags': '人物,运动,活力', 'click_count': 5},
            {'filename': 'sample9.jpg', 'original_filename': '风景_日落_1.jpg', 'file_type': 'image', 'tags': '风景,日落,天空', 'click_count': 45},
            {'filename': 'sample10.jpg', 'original_filename': '动物_猫_1.jpg', 'file_type': 'image', 'tags': '动物,猫,可爱', 'click_count': 38}
        ]
        
        print('创建示例数据...')
        for data in sample_data:
            file_id = str(uuid.uuid4())
            new_filename = f'{file_id}_{data["filename"]}'
            file_path = f'uploads/images/{new_filename}'
            
            media = Media(
                id=file_id,
                filename=new_filename,
                original_filename=data['original_filename'],
                file_type=data['file_type'],
                file_path=file_path,
                tags=data['tags'],
                file_size=1024,
                click_count=data['click_count']
            )
            db.session.add(media)
            print(f'创建: {data["original_filename"]} (点击数: {data["click_count"]})')
        
        db.session.commit()
        print(f'成功创建 {len(sample_data)} 条示例数据')

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        create_sample_data()
    app.run(debug=True, host='0.0.0.0', port=5000)