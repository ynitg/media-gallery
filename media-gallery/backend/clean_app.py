#!/usr/bin/env python3
import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, request, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import sqlite3
from datetime import datetime
import uuid

app = Flask(__name__)
CORS(app)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///media_gallery.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'C:/agent/media-gallery/uploads'

db = SQLAlchemy(app)

# Simple Media model that matches the database schema
class Media(db.Model):
    __tablename__ = 'media'
    
    id = db.Column(db.String(36), primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    original_filename = db.Column(db.String(255), nullable=False)
    file_type = db.Column(db.String(50), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    tags = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    file_size = db.Column(db.Integer, nullable=False)
    click_count = db.Column(db.Integer, default=0)

@app.route('/api/media', methods=['GET'])
def get_media():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    tag_filter = request.args.get('tag', '')
    
    # Use direct SQL connection to avoid SQLAlchemy model caching issues
    conn = sqlite3.connect('media_gallery.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Build query
    if tag_filter:
        cursor.execute('''
            SELECT * FROM media 
            WHERE tags LIKE ? 
            ORDER BY created_at DESC 
            LIMIT ? OFFSET ?
        ''', (f'%{tag_filter}%', per_page, (page - 1) * per_page))
    else:
        cursor.execute('''
            SELECT * FROM media 
            ORDER BY created_at DESC 
            LIMIT ? OFFSET ?
        ''', (per_page, (page - 1) * per_page))
    
    media_items = cursor.fetchall()
    
    # Get total count
    if tag_filter:
        cursor.execute('SELECT COUNT(*) FROM media WHERE tags LIKE ?', (f'%{tag_filter}%',))
    else:
        cursor.execute('SELECT COUNT(*) FROM media')
    
    total = cursor.fetchone()[0]
    
    # Convert to JSON
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
    
    conn.close()
    
    return jsonify({
        'media': result,
        'total': total,
        'pages': (total + per_page - 1) // per_page,
        'current_page': page
    })

@app.route('/api/media/<media_id>', methods=['GET'])
def get_media_item(media_id):
    conn = sqlite3.connect('media_gallery.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Get media item
    cursor.execute('SELECT * FROM media WHERE id = ?', (media_id,))
    media = cursor.fetchone()
    
    if not media:
        conn.close()
        return jsonify({'error': 'Media not found'}), 404
    
    # Increment click count
    cursor.execute('UPDATE media SET click_count = click_count + 1 WHERE id = ?', (media_id,))
    conn.commit()
    
    result = {
        'id': media['id'],
        'filename': media['filename'],
        'original_filename': media['original_filename'],
        'file_type': media['file_type'],
        'file_path': media['file_path'],
        'tags': media['tags'],
        'created_at': media['created_at'],
        'file_size': media['file_size'],
        'click_count': media['click_count'] + 1
    }
    
    conn.close()
    return jsonify(result)

@app.route('/api/tags', methods=['GET'])
def get_tags():
    conn = sqlite3.connect('media_gallery.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Get all media items
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
    
    # Calculate tag weights
    tags_with_weight = []
    for tag, stats in tag_stats.items():
        weight = stats['clicks'] + (stats['count'] * 5)
        tags_with_weight.append({
            'tag': tag,
            'weight': weight,
            'count': stats['count'],
            'clicks': stats['clicks']
        })
    
    conn.close()
    return jsonify({'tags': sorted(tags_with_weight, key=lambda x: x['weight'], reverse=True)})

@app.route('/uploads/<path:filename>')
def serve_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)