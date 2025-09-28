class MediaGallery {
    constructor() {
        this.currentPage = 1;
        this.currentTag = '';
        this.currentType = 'all';
        this.isLoading = false;
        this.allMedia = [];
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadMedia();
        this.loadTags();
        this.loadBackground();
    }

    bindEvents() {
        // 关闭模态框
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                e.target.closest('.modal').style.display = 'none';
            });
        });

        // 点击模态框外部关闭
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });

        // 类型标签筛选
        document.querySelectorAll('.type-tag').forEach(tag => {
            tag.addEventListener('click', (e) => {
                // 更新激活状态
                document.querySelectorAll('.type-tag').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                
                // 设置当前类型
                this.currentType = e.target.dataset.type;
                this.currentPage = 1;
                this.allMedia = [];
                this.loadMedia();
            });
        });

        // 标签筛选
        document.getElementById('tagFilter').addEventListener('change', (e) => {
            this.currentTag = e.target.value;
            this.currentPage = 1;
            this.allMedia = [];
            this.loadMedia();
        });

        // 滚动加载更多
        window.addEventListener('scroll', () => {
            if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100) {
                this.loadMedia();
            }
        });
    }

    async loadMedia() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        document.getElementById('loading').style.display = 'block';

        try {
            const params = new URLSearchParams({
                page: this.currentPage,
                per_page: 20
            });

            if (this.currentTag) {
                params.append('tag', this.currentTag);
            }

            if (this.currentType && this.currentType !== 'all') {
                params.append('type', this.currentType);
            }

            const response = await fetch(`http://localhost:5000/api/media?${params}`);
            const data = await response.json();

            if (data.media.length > 0) {
                this.allMedia = [...this.allMedia, ...data.media];
                this.renderMedia();
                this.currentPage++;
            }
        } catch (error) {
            console.error('加载媒体失败:', error);
            alert('加载媒体失败，请重试');
        } finally {
            this.isLoading = false;
            document.getElementById('loading').style.display = 'none';
        }
    }

    async loadTags() {
        try {
            const response = await fetch('http://localhost:5000/api/tags');
            const data = await response.json();
            
            // 更新标签筛选器
            const tagFilter = document.getElementById('tagFilter');
            tagFilter.innerHTML = '<option value="">所有标签</option>';
            
            // 生成标签云
            this.renderTagCloud(data.tags);
            
            // 填充标签筛选器选项
            data.tags.forEach(tagData => {
                const option = document.createElement('option');
                option.value = tagData.tag;
                option.textContent = tagData.tag;
                tagFilter.appendChild(option);
            });
        } catch (error) {
            console.error('加载标签失败:', error);
        }
    }

    renderTagCloud(tagsData) {
        const tagCloud = document.getElementById('tagCloud');
        tagCloud.innerHTML = '';
        
        // 首先添加类型标签
        const typeTags = [
            { tag: '📷 图片', type: 'image', count: 0, weight: 0.5 },
            { tag: '🎥 视频', type: 'video', count: 0, weight: 0.5 }
        ];
        
        typeTags.forEach(typeTag => {
            const tagElement = document.createElement('span');
            tagElement.className = 'tag tag-size-large';
            tagElement.textContent = typeTag.tag;
            tagElement.title = `点击查看所有${typeTag.type === 'image' ? '图片' : '视频'}`;
            tagElement.style.background = 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)';
            
            // 添加点击事件
            tagElement.addEventListener('click', () => {
                this.currentType = typeTag.type;
                this.currentTag = '';
                this.currentPage = 1;
                this.allMedia = [];
                
                // 更新筛选器
                document.getElementById('tagFilter').value = '';
                
                // 更新类型标签激活状态
                document.querySelectorAll('.type-tag').forEach(t => t.classList.remove('active'));
                document.querySelector(`[data-type="${typeTag.type}"]`).classList.add('active');
                
                // 重新加载媒体
                this.loadMedia();
                
                // 滚动到顶部
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
            
            tagCloud.appendChild(tagElement);
        });
        
        // 添加分隔线
        const separator = document.createElement('div');
        separator.style.cssText = 'width: 100%; height: 1px; background: rgba(255,255,255,0.2); margin: 10px 0;';
        tagCloud.appendChild(separator);
        
        if (tagsData.length === 0) {
            tagCloud.innerHTML += '<p style="color: rgba(255,255,255,0.6); text-align: center;">暂无标签</p>';
            return;
        }
        
        // 计算权重范围
        const weights = tagsData.map(tag => tag.weight);
        const minWeight = Math.min(...weights);
        const maxWeight = Math.max(...weights);
        const weightRange = maxWeight - minWeight || 1;
        
        tagsData.forEach(tagData => {
            const tagElement = document.createElement('span');
            tagElement.className = 'tag';
            tagElement.textContent = tagData.tag;
            tagElement.title = `点击次数: ${tagData.clicks}, 出现次数: ${tagData.count}`;
            
            // 根据权重设置标签大小
            const normalizedWeight = (tagData.weight - minWeight) / weightRange;
            if (normalizedWeight >= 0.8) {
                tagElement.classList.add('tag-size-xxlarge');
            } else if (normalizedWeight >= 0.6) {
                tagElement.classList.add('tag-size-xlarge');
            } else if (normalizedWeight >= 0.4) {
                tagElement.classList.add('tag-size-large');
            } else if (normalizedWeight >= 0.2) {
                tagElement.classList.add('tag-size-medium');
            } else {
                tagElement.classList.add('tag-size-small');
            }
            
            // 添加点击事件
            tagElement.addEventListener('click', () => {
                this.currentTag = tagData.tag;
                this.currentPage = 1;
                this.allMedia = [];
                
                // 更新筛选器
                document.getElementById('tagFilter').value = tagData.tag;
                
                // 重新加载媒体
                this.loadMedia();
                
                // 滚动到顶部
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
            
            tagCloud.appendChild(tagElement);
        });
    }

    renderMedia() {
        const mediaGrid = document.getElementById('mediaGrid');
        
        // 清空现有内容，避免重复
        if (this.currentPage === 1) {
            mediaGrid.innerHTML = '';
        }
        
        this.allMedia.forEach(media => {
            const mediaItem = document.createElement('div');
            mediaItem.className = 'media-item';
            mediaItem.dataset.mediaId = media.id;
            
            let mediaElement;
            if (media.file_type === 'image') {
                mediaElement = document.createElement('img');
                // URL encode the filename to handle Chinese characters
                const encodedFilename = encodeURIComponent(media.filename);
                mediaElement.src = `http://localhost:5000/uploads/${media.file_type}s/${encodedFilename}`;
                mediaElement.alt = media.original_filename;
                mediaElement.loading = 'lazy'; // 懒加载
            } else if (media.file_type === 'video') {
                mediaElement = document.createElement('video');
                const encodedFilename = encodeURIComponent(media.filename);
                mediaElement.src = `http://localhost:5000/uploads/${media.file_type}s/${encodedFilename}`;
                mediaElement.muted = true;
                mediaElement.loop = true;
                mediaElement.playsInline = true;
            }
            
            const mediaInfo = document.createElement('div');
            mediaInfo.className = 'media-info';
            const tagsHtml = media.tags ? 
                media.tags.split(',').map(tag => `<span class="tag">${tag.trim()}</span>`).join('') : 
                '<span class="tag">无标签</span>';
            
            mediaInfo.innerHTML = `
                <div class="tags">${tagsHtml}</div>
            `;
            
            mediaItem.appendChild(mediaElement);
            mediaItem.appendChild(mediaInfo);
            
            mediaItem.addEventListener('click', () => {
                this.showPreview(media);
            });
            
            mediaGrid.appendChild(mediaItem);
        });
    }

    async uploadFile() {
        const form = document.getElementById('uploadForm');
        const formData = new FormData();
        
        const fileInput = document.getElementById('fileInput');
        const tagInput = document.getElementById('tagInput');
        
        if (!fileInput.files[0]) {
            alert('请选择文件');
            return;
        }
        
        formData.append('file', fileInput.files[0]);
        formData.append('tags', tagInput.value);
        
        try {
            const response = await fetch('http://localhost:5000/api/upload', {
                method: 'POST',
                body: formData
            });
            
            if (response.ok) {
                const result = await response.json();
                
                // 重置表单
                form.reset();
                document.getElementById('uploadModal').style.display = 'none';
                
                // 重新加载媒体列表
                this.currentPage = 1;
                this.allMedia = [];
                document.getElementById('mediaGrid').innerHTML = '';
                this.loadMedia();
                this.loadTags();
                
                alert('上传成功！');
            } else {
                const error = await response.json();
                alert(`上传失败: ${error.error}`);
            }
        } catch (error) {
            console.error('上传失败:', error);
            alert('上传失败，请重试');
        }
    }

    showPreview(media) {
        const previewModal = document.getElementById('previewModal');
        const previewContainer = document.getElementById('previewContainer');
        const previewInfo = document.getElementById('previewInfo');
        
        let mediaElement;
        if (media.file_type === 'image') {
            mediaElement = document.createElement('img');
            const encodedFilename = encodeURIComponent(media.filename);
            mediaElement.src = `http://localhost:5000/uploads/${media.file_type}s/${encodedFilename}`;
            mediaElement.alt = media.original_filename;
        } else if (media.file_type === 'video') {
            mediaElement = document.createElement('video');
            const encodedFilename = encodeURIComponent(media.filename);
            mediaElement.src = `http://localhost:5000/uploads/${media.file_type}s/${encodedFilename}`;
            mediaElement.controls = true;
            mediaElement.autoplay = true;
            mediaElement.muted = false;
        }
        
        previewContainer.innerHTML = '';
        previewContainer.appendChild(mediaElement);
        
        previewInfo.innerHTML = `
            <h3>${media.original_filename}</h3>
            <p><strong>类型:</strong> ${media.file_type === 'image' ? '图片' : '视频'}</p>
            <p><strong>大小:</strong> ${this.formatFileSize(media.file_size)}</p>
            <p><strong>标签:</strong> ${media.tags || '无'}</p>
            <p><strong>上传时间:</strong> ${new Date(media.created_at).toLocaleString('zh-CN')}</p>
        `;
        
        previewModal.style.display = 'block';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async loadBackground() {
        try {
            const response = await fetch('http://localhost:5000/api/settings/background');
            const data = await response.json();
            
            if (data.background_image) {
                const backgroundArea = document.getElementById('backgroundArea');
                backgroundArea.style.backgroundImage = `url('http://localhost:5000${data.background_image}')`;
            }
        } catch (error) {
            console.error('加载背景图片失败:', error);
        }
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new MediaGallery();
});