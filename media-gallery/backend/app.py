from flask import Flask, request, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
from datetime import datetime
import uuid
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
CORS(app)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///media_gallery.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'C:/agent/media-gallery/uploads'
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB max file size
app.config['SECRET_KEY'] = 'your-secret-key-here-change-in-production'  # 用于session管理

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'mp4', 'avi', 'mov', 'wmv'}

db = SQLAlchemy(app)
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'admin_login'

class Admin(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(120), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

@login_manager.user_loader
def load_user(user_id):
    return Admin.query.get(int(user_id))

class Media(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    filename = db.Column(db.String(255), nullable=False)
    original_filename = db.Column(db.String(255), nullable=False)
    file_type = db.Column(db.String(50), nullable=False)  # 'image' or 'video'
    file_path = db.Column(db.String(500), nullable=False)
    tags = db.Column(db.String(255), nullable=False)  # comma-separated tags
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    file_size = db.Column(db.Integer, nullable=False)
    click_count = db.Column(db.Integer, default=0)

class Settings(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(100), unique=True, nullable=False)
    value = db.Column(db.Text, nullable=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)  # 点击统计

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_file_type(filename):
    ext = filename.rsplit('.', 1)[1].lower()
    if ext in ['png', 'jpg', 'jpeg', 'gif']:
        return 'image'
    elif ext in ['mp4', 'avi', 'mov', 'wmv']:
        return 'video'
    return 'unknown'

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
        
        media = Media(
            filename=new_filename,
            original_filename=filename,
            file_type=file_type,
            file_path=file_path,
            tags=tags,
            file_size=os.path.getsize(file_path)
        )
        
        db.session.add(media)
        db.session.commit()
        
        return jsonify({
            'id': media.id,
            'filename': media.filename,
            'original_filename': media.original_filename,
            'file_type': media.file_type,
            'file_path': media.file_path,
            'tags': media.tags,
            'created_at': media.created_at.isoformat(),
            'file_size': media.file_size
        }), 201
    
    return jsonify({'error': 'File type not allowed'}), 400

@app.route('/api/media', methods=['GET'])
def get_media():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    tag_filter = request.args.get('tag', '')
    type_filter = request.args.get('type', '')
    
    query = Media.query
    if tag_filter:
        query = query.filter(Media.tags.contains(tag_filter))
    if type_filter:
        query = query.filter(Media.file_type == type_filter)
    
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
    
    # 计算标签热度（基于点击次数和出现频率）
    tags_with_weight = []
    for tag, stats in tag_stats.items():
        weight = stats['clicks'] + (stats['count'] * 5)  # 点击次数权重更高
        tags_with_weight.append({
            'tag': tag,
            'weight': weight,
            'count': stats['count'],
            'clicks': stats['clicks']
        })
    
    return jsonify({'tags': sorted(tags_with_weight, key=lambda x: x['weight'], reverse=True)})

# 管理员登录API
@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'error': '用户名和密码不能为空'}), 400
    
    admin = Admin.query.filter_by(username=username).first()
    
    if admin and admin.check_password(password):
        login_user(admin)
        return jsonify({
            'message': '登录成功',
            'user': {
                'id': admin.id,
                'username': admin.username
            }
        })
    else:
        return jsonify({'error': '用户名或密码错误'}), 401

# 管理员退出登录
@app.route('/api/admin/logout', methods=['POST'])
@login_required
def admin_logout():
    logout_user()
    return jsonify({'message': '退出登录成功'})

# 检查管理员登录状态
@app.route('/api/admin/check', methods=['GET'])
def admin_check():
    if current_user.is_authenticated:
        return jsonify({
            'logged_in': True,
            'user': {
                'id': current_user.id,
                'username': current_user.username
            }
        })
    else:
        return jsonify({'logged_in': False})

# 管理员上传文件（需要登录）
@app.route('/api/admin/upload', methods=['POST'])
@login_required
def admin_upload_file():
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
        
        media = Media(
            filename=new_filename,
            original_filename=filename,
            file_type=file_type,
            file_path=file_path,
            tags=tags,
            file_size=os.path.getsize(file_path)
        )
        
        db.session.add(media)
        db.session.commit()
        
        return jsonify({
            'id': media.id,
            'filename': media.filename,
            'original_filename': media.original_filename,
            'file_type': media.file_type,
            'file_path': media.file_path,
            'tags': media.tags,
            'created_at': media.created_at.isoformat(),
            'file_size': media.file_size
        }), 201
    
    return jsonify({'error': 'File type not allowed'}), 400

# 管理员删除媒体文件
@app.route('/api/admin/media/<media_id>', methods=['DELETE'])
@login_required
def admin_delete_media(media_id):
    media = Media.query.get_or_404(media_id)
    
    # 删除文件
    try:
        if os.path.exists(media.file_path):
            os.remove(media.file_path)
    except Exception as e:
        print(f"删除文件失败: {e}")
    
    # 删除数据库记录
    db.session.delete(media)
    db.session.commit()
    
    return jsonify({'message': '删除成功'})

# 获取背景图片设置
@app.route('/api/settings/background', methods=['GET'])
def get_background():
    setting = Settings.query.filter_by(key='background_image').first()
    if setting and setting.value:
        return jsonify({'background_image': setting.value})
    return jsonify({'background_image': None})

# 上传背景图片
@app.route('/api/admin/background', methods=['POST'])
@login_required
def upload_background():
    if 'file' not in request.files:
        return jsonify({'error': '没有选择文件'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': '没有选择文件'}), 400
    
    if file and allowed_file(file.filename):
        # 只允许图片文件作为背景
        if not file.filename.lower().endswith(('.png', '.jpg', '.jpeg', '.gif')):
            return jsonify({'error': '只支持图片文件作为背景'}), 400
        
        filename = secure_filename(file.filename)
        # 使用background_前缀避免与其他文件冲突
        background_filename = f"background_{filename}"
        background_path = os.path.join(app.config['UPLOAD_FOLDER'], 'backgrounds', background_filename)
        
        # 确保背景文件夹存在
        os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'backgrounds'), exist_ok=True)
        
        # 删除旧背景文件
        old_setting = Settings.query.filter_by(key='background_image').first()
        if old_setting and old_setting.value:
            old_path = old_setting.value.replace('/uploads/', '')
            old_full_path = os.path.join(app.config['UPLOAD_FOLDER'], old_path)
            if os.path.exists(old_full_path):
                os.remove(old_full_path)
        
        # 保存新背景文件
        file.save(background_path)
        
        # 更新数据库设置
        setting = Settings.query.filter_by(key='background_image').first()
        if not setting:
            setting = Settings(key='background_image')
            db.session.add(setting)
        
        setting.value = f'/uploads/backgrounds/{background_filename}'
        db.session.commit()
        
        return jsonify({'message': '背景图片上传成功', 'background_image': setting.value})
    
    return jsonify({'error': '文件类型不支持'}), 400

# 删除背景图片
@app.route('/api/admin/background', methods=['DELETE'])
@login_required
def delete_background():
    setting = Settings.query.filter_by(key='background_image').first()
    if setting and setting.value:
        # 删除文件
        file_path = setting.value.replace('/uploads/', '')
        full_path = os.path.join(app.config['UPLOAD_FOLDER'], file_path)
        if os.path.exists(full_path):
            os.remove(full_path)
        
        # 删除数据库记录
        db.session.delete(setting)
        db.session.commit()
        
        return jsonify({'message': '背景图片删除成功'})
    
    return jsonify({'message': '没有背景图片需要删除'})

# 创建默认管理员账户
def create_default_admin():
    with app.app_context():
        if Admin.query.filter_by(username='admin').first() is None:
            admin = Admin(username='admin')
            admin.set_password('admin123')  # 默认密码，生产环境应修改
            db.session.add(admin)
            db.session.commit()
            print("默认管理员账户创建成功: 用户名: admin, 密码: admin123")

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        create_default_admin()
    app.run(debug=True, host='0.0.0.0', port=5000)