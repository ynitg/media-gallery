#!/usr/bin/env python3
import sqlite3
import os
import uuid
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

app = Flask(__name__)
CORS(app)  # 启用CORS支持
app.config['UPLOAD_FOLDER'] = 'C:/agent/media-gallery/uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'mp4', 'avi', 'mov', 'wmv'}

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
    conn = sqlite3.connect('media_gallery.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    try:
        cursor.execute('SELECT * FROM media ORDER BY created_at DESC LIMIT 20')
        media_items = cursor.fetchall()
        
        result = []
        for media in media_items:
            result.append({
                'id': media['id'],
                'filename': media['filename'],
                'original_filename': media['original_filename'],
                'file_type': media['file_type'],
                'file_path': media['file_path'],
                'tags': media['tags'],
                'created_at': media['created_at'],
                'file_size': media['file_size'],
                'click_count': media['click_count']
            })
        
        return jsonify({
            'media': result,
            'total': len(result),
            'pages': 1,
            'current_page': 1
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# 管理员登录
@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'error': '用户名和密码不能为空'}), 400
    
    conn = sqlite3.connect('media_gallery.db')
    cursor = conn.cursor()
    
    try:
        cursor.execute('SELECT id, username, password_hash FROM admin WHERE username = ?', (username,))
        admin = cursor.fetchone()
        
        if admin and check_password_hash(admin[2], password):
            return jsonify({
                'message': '登录成功',
                'user': {
                    'id': admin[0],
                    'username': admin[1]
                }
            })
        else:
            return jsonify({'error': '用户名或密码错误'}), 401
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# 管理员退出登录
@app.route('/api/admin/logout', methods=['POST'])
def admin_logout():
    return jsonify({'message': '退出登录成功'})

@app.route('/api/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if file and allowed_file(file.filename):
        file_type = get_file_type(file.filename)
        if file_type == 'unknown':
            return jsonify({'error': 'File type not allowed'}), 400
        
        filename = secure_filename(file.filename)
        file_id = str(uuid.uuid4())
        new_filename = f"{file_id}_{filename}"
        
        if file_type == 'image':
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], 'images', new_filename)
        else:
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], 'videos', new_filename)
        
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        file.save(file_path)
        
        tags = request.form.get('tags', '')
        
        conn = sqlite3.connect('media_gallery.db')
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO media (id, filename, original_filename, file_type, file_path, tags, file_size, click_count)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (file_id, new_filename, filename, file_type, file_path, tags, os.path.getsize(file_path), 0))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'id': file_id,
            'filename': new_filename,
            'original_filename': filename,
            'file_type': file_type,
            'file_path': file_path,
            'tags': tags,
            'file_size': os.path.getsize(file_path)
        }), 201
    
    return jsonify({'error': 'File type not allowed'}), 400

@app.route('/uploads/<path:filename>')
def serve_file(filename):
    response = send_from_directory(app.config['UPLOAD_FOLDER'], filename)
    # 添加CORS头以允许跨域访问静态资源
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    return response

@app.route('/api/tags', methods=['GET'])
def get_tags():
    conn = sqlite3.connect('media_gallery.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    try:
        cursor.execute('SELECT tags, click_count FROM media')
        media_items = cursor.fetchall()
        
        tag_stats = {}
        for media in media_items:
            tags = media['tags']
            if tags:
                for tag in tags.split(','):
                    tag = tag.strip()
                    if tag:
                        if tag not in tag_stats:
                            tag_stats[tag] = {'count': 0, 'clicks': 0}
                        tag_stats[tag]['count'] += 1
                        tag_stats[tag]['clicks'] += media['click_count'] or 0
        
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
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)