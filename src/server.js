const path = require('path');
const fs = require('fs');
const express = require('express');
const session = require('express-session');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

// Admin credentials file
const credentialsFile = path.join(__dirname, '..', 'data', 'credentials.json');

// Ensure upload directories exist
const imagesDir = path.join(__dirname, '..', 'uploads', 'images');
const videosDir = path.join(__dirname, '..', 'uploads', 'videos');
const backgroundsDir = path.join(__dirname, '..', 'uploads', 'backgrounds');
const dataDir = path.join(__dirname, '..', 'data');
fs.mkdirSync(imagesDir, { recursive: true });
fs.mkdirSync(videosDir, { recursive: true });
fs.mkdirSync(backgroundsDir, { recursive: true });
fs.mkdirSync(dataDir, { recursive: true });

// Simple JSON database for metadata
const dbFile = path.join(dataDir, 'media.json');
const settingsFile = path.join(dataDir, 'settings.json');
let mediaDB = [];
let settings = {
  siteTitle: '媒体展示',
  backgroundImage: null,
  analyticsCode: null
};

// Admin credentials management
let adminCredentials = {
  username: 'admin',
  password: 'admin123'
};

// Load credentials from file
function loadCredentials() {
  try {
    if (fs.existsSync(credentialsFile)) {
      const data = fs.readFileSync(credentialsFile, 'utf8');
      adminCredentials = JSON.parse(data);
    } else {
      // Create default credentials file
      saveCredentials();
    }
  } catch (error) {
    console.error('Error loading credentials:', error);
  }
}

// Save credentials to file
function saveCredentials() {
  try {
    fs.writeFileSync(credentialsFile, JSON.stringify(adminCredentials, null, 2));
  } catch (error) {
    console.error('Error saving credentials:', error);
  }
}

// Load credentials on startup
loadCredentials();

// Load database
if (fs.existsSync(dbFile)) {
  try {
    mediaDB = JSON.parse(fs.readFileSync(dbFile, 'utf8'));
  } catch (e) {
    mediaDB = [];
  }
}

// Load settings
if (fs.existsSync(settingsFile)) {
  try {
    settings = { ...settings, ...JSON.parse(fs.readFileSync(settingsFile, 'utf8')) };
  } catch (e) {
    // Use default settings
  }
}

// Save database
function saveDB() {
  fs.writeFileSync(dbFile, JSON.stringify(mediaDB, null, 2));
}

// Save settings
function saveSettings() {
  fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2));
}

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sessions
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'replace-this-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 },
  })
);

// Static files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.use('/static', express.static(path.join(__dirname, '..', 'public')));

// Multer storage for images and videos
const imageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, imagesDir);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^\w\-]+/g, '_');
    cb(null, `${timestamp}_${base}${ext}`);
  },
});

const videoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, videosDir);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^\w\-]+/g, '_');
    cb(null, `${timestamp}_${base}${ext}`);
  },
});

const imageUpload = multer({ storage: imageStorage });
const videoUpload = multer({ storage: videoStorage });

const backgroundStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, backgroundsDir);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^\w\-]+/g, '_');
    cb(null, `background_${timestamp}_${base}${ext}`);
  },
});
const backgroundUpload = multer({ storage: backgroundStorage });

// Auth middleware
function requireAuth(req, res, next) {
  if (req.session && req.session.authed) return next();
  return res.redirect('/admin/login');
}

// Routes
app.get('/', (req, res) => {
  const { tag, type } = req.query;
  let media = [...mediaDB];
  
  // Filter by type if provided
  if (type && type !== 'all') {
    media = media.filter(item => item.type === type);
  }
  
  // Filter by tag if provided
  if (tag) {
    media = media.filter(item => 
      item.tags && item.tags.some(t => t.toLowerCase().includes(tag.toLowerCase()))
    );
  }
  
  // Sort by upload time (newest first)
  media.sort((a, b) => new Date(b.uploadTime) - new Date(a.uploadTime));
  
  // Get all unique tags from all media
  const allTags = [...new Set(mediaDB.flatMap(item => item.tags || []))];
  
  res.render('gallery', { 
    media, 
    tags: allTags,
    loggedIn: !!(req.session && req.session.authed),
    currentTag: tag || '',
    req: req,
    settings: settings
  });
});

app.get('/admin/login', (req, res) => {
  res.render('login', { error: null });
});

app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === adminCredentials.username && password === adminCredentials.password) {
    req.session.authed = true;
    return res.redirect('/admin');
  }
  return res.status(401).render('login', { error: '用户名或密码错误' });
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

app.get('/admin', requireAuth, (req, res) => {
  res.render('admin');
});

app.post('/admin/upload/image', requireAuth, imageUpload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('未选择图片文件');
  }
  
  const { tags } = req.body;
  const tagList = tags ? tags.split(',').map(t => t.trim()).filter(t => t) : [];
  
  const mediaItem = {
    id: Date.now().toString(),
    type: 'image',
    filename: req.file.filename,
    originalName: req.file.originalname,
    path: `/uploads/images/${req.file.filename}`,
    tags: tagList,
    uploadTime: new Date().toISOString()
  };
  
  mediaDB.push(mediaItem);
  saveDB();
  res.redirect('/admin');
});

app.post('/admin/upload/video', requireAuth, videoUpload.single('video'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('未选择视频文件');
  }
  
  const { tags } = req.body;
  const tagList = tags ? tags.split(',').map(t => t.trim()).filter(t => t) : [];
  
  const mediaItem = {
    id: Date.now().toString(),
    type: 'video',
    filename: req.file.filename,
    originalName: req.file.originalname,
    path: `/uploads/videos/${req.file.filename}`,
    tags: tagList,
    uploadTime: new Date().toISOString()
  };
  
  mediaDB.push(mediaItem);
  saveDB();
  res.redirect('/admin');
});

// Batch upload images
app.post('/admin/upload/images', requireAuth, imageUpload.array('images', 20), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).send('未选择图片文件');
  }
  
  const { tags } = req.body;
  const tagList = tags ? tags.split(',').map(t => t.trim()).filter(t => t) : [];
  
  const uploadedItems = [];
  
  req.files.forEach(file => {
    const mediaItem = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      type: 'image',
      filename: file.filename,
      originalName: file.originalname,
      path: `/uploads/images/${file.filename}`,
      tags: tagList,
      uploadTime: new Date().toISOString()
    };
    
    mediaDB.push(mediaItem);
    uploadedItems.push(mediaItem);
  });
  
  saveDB();
  res.json({ 
    success: true, 
    message: `成功上传 ${uploadedItems.length} 张图片`,
    uploaded: uploadedItems.map(item => item.originalName)
  });
});

// Batch upload videos
app.post('/admin/upload/videos', requireAuth, videoUpload.array('videos', 10), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).send('未选择视频文件');
  }
  
  const { tags } = req.body;
  const tagList = tags ? tags.split(',').map(t => t.trim()).filter(t => t) : [];
  
  const uploadedItems = [];
  
  req.files.forEach(file => {
    const mediaItem = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      type: 'video',
      filename: file.filename,
      originalName: file.originalname,
      path: `/uploads/videos/${file.filename}`,
      tags: tagList,
      uploadTime: new Date().toISOString()
    };
    
    mediaDB.push(mediaItem);
    uploadedItems.push(mediaItem);
  });
  
  saveDB();
  res.json({ 
    success: true, 
    message: `成功上传 ${uploadedItems.length} 个视频`,
    uploaded: uploadedItems.map(item => item.originalName)
  });
});

// Get all unique tags for filtering
app.get('/api/tags', (req, res) => {
  const allTags = [...new Set(mediaDB.flatMap(item => item.tags || []))];
  res.json(allTags);
});

// Delete media item
app.delete('/admin/media/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const mediaItem = mediaDB.find(item => item.id === id);
  
  if (!mediaItem) {
    return res.status(404).json({ error: '媒体文件不存在' });
  }
  
  try {
    // Delete file from filesystem
    const filePath = path.join(__dirname, '..', mediaItem.path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Remove from database
    mediaDB = mediaDB.filter(item => item.id !== id);
    saveDB();
    
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    res.status(500).json({ error: '删除失败: ' + error.message });
  }
});

// Batch delete media items
app.delete('/admin/media/batch', requireAuth, (req, res) => {
  const { ids } = req.body;
  
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: '请选择要删除的文件' });
  }
  
  const deletedItems = [];
  const errors = [];
  
  ids.forEach(id => {
    const mediaItem = mediaDB.find(item => item.id === id);
    if (!mediaItem) {
      errors.push(`文件 ${id} 不存在`);
      return;
    }
    
    try {
      // Delete file from filesystem
      const filePath = path.join(__dirname, '..', mediaItem.path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      // Remove from database
      mediaDB = mediaDB.filter(item => item.id !== id);
      deletedItems.push(mediaItem.originalName);
    } catch (error) {
      errors.push(`删除 ${mediaItem.originalName} 失败: ${error.message}`);
    }
  });
  
  if (deletedItems.length > 0) {
    saveDB();
  }
  
  res.json({ 
    success: deletedItems.length > 0, 
    deleted: deletedItems,
    errors: errors,
    message: `成功删除 ${deletedItems.length} 个文件${errors.length > 0 ? `，${errors.length} 个失败` : ''}`
  });
});

// Settings management
app.get('/admin/settings', requireAuth, (req, res) => {
  res.render('admin-settings', { 
    settings: settings,
    loggedIn: true
  });
});

app.post('/admin/settings/title', requireAuth, (req, res) => {
  const { siteTitle } = req.body;
  if (siteTitle && siteTitle.trim()) {
    settings.siteTitle = siteTitle.trim();
    saveSettings();
    res.json({ success: true, message: '标题更新成功' });
  } else {
    res.status(400).json({ error: '标题不能为空' });
  }
});

app.post('/admin/settings/analytics', requireAuth, (req, res) => {
  const { analyticsCode } = req.body;
  // Allow empty analytics code to remove it
  settings.analyticsCode = analyticsCode ? analyticsCode.trim() : null;
  saveSettings();
  res.json({ success: true, message: '统计代码更新成功' });
});

app.post('/admin/settings/background', requireAuth, backgroundUpload.single('background'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '未选择背景图片' });
  }
  
  // Delete old background if exists
  if (settings.backgroundImage) {
    const oldPath = path.join(__dirname, '..', settings.backgroundImage);
    if (fs.existsSync(oldPath)) {
      fs.unlinkSync(oldPath);
    }
  }
  
  settings.backgroundImage = `/uploads/backgrounds/${req.file.filename}`;
  saveSettings();
  
  res.json({ 
    success: true, 
    message: '背景图片更新成功',
    backgroundImage: settings.backgroundImage
  });
});

app.delete('/admin/settings/background', requireAuth, (req, res) => {
  if (settings.backgroundImage) {
    const filePath = path.join(__dirname, '..', settings.backgroundImage);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    settings.backgroundImage = null;
    saveSettings();
    res.json({ success: true, message: '背景图片已删除' });
  } else {
    res.status(404).json({ error: '没有设置背景图片' });
  }
});

// Admin credentials management routes
app.get('/admin/credentials', requireAuth, (req, res) => {
  res.render('admin-credentials', {
    credentials: adminCredentials,
    loggedIn: true
  });
});

app.post('/admin/credentials/update', requireAuth, (req, res) => {
  const { currentUsername, currentPassword, newUsername, newPassword, confirmPassword } = req.body;
  
  // Validate current credentials
  if (currentUsername !== adminCredentials.username || currentPassword !== adminCredentials.password) {
    return res.status(400).json({ error: '当前用户名或密码错误' });
  }
  
  // Validate new credentials
  if (!newUsername || !newPassword) {
    return res.status(400).json({ error: '新用户名和密码不能为空' });
  }
  
  if (newPassword !== confirmPassword) {
    return res.status(400).json({ error: '新密码和确认密码不匹配' });
  }
  
  if (newUsername.length < 3) {
    return res.status(400).json({ error: '用户名至少需要3个字符' });
  }
  
  if (newPassword.length < 6) {
    return res.status(400).json({ error: '密码至少需要6个字符' });
  }
  
  // Update credentials
  adminCredentials.username = newUsername;
  adminCredentials.password = newPassword;
  saveCredentials();
  
  res.json({ success: true, message: '凭据更新成功，请重新登录' });
});

// Get all media for admin
app.get('/admin/media', requireAuth, (req, res) => {
  const { search, sort, type, page = 1, limit = 12 } = req.query;
  let filteredMedia = [...mediaDB];
  
  // Search filter
  if (search) {
    const searchLower = search.toLowerCase();
    filteredMedia = filteredMedia.filter(item => 
      item.originalName.toLowerCase().includes(searchLower) ||
      (item.tags && item.tags.some(tag => tag.toLowerCase().includes(searchLower)))
    );
  }
  
  // Type filter
  if (type && type !== 'all') {
    filteredMedia = filteredMedia.filter(item => item.type === type);
  }
  
  // Sort
  switch (sort) {
    case 'name-asc':
      filteredMedia.sort((a, b) => a.originalName.localeCompare(b.originalName));
      break;
    case 'name-desc':
      filteredMedia.sort((a, b) => b.originalName.localeCompare(a.originalName));
      break;
    case 'date-asc':
      filteredMedia.sort((a, b) => new Date(a.uploadTime) - new Date(b.uploadTime));
      break;
    case 'date-desc':
    default:
      filteredMedia.sort((a, b) => new Date(b.uploadTime) - new Date(a.uploadTime));
      break;
  }
  
  // Pagination
  const totalItems = filteredMedia.length;
  const totalPages = Math.ceil(totalItems / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedMedia = filteredMedia.slice(startIndex, endIndex);
  
  res.render('admin-media', { 
    media: paginatedMedia,
    loggedIn: true,
    pagination: {
      currentPage: parseInt(page),
      totalPages: totalPages,
      totalItems: totalItems,
      limit: parseInt(limit),
      hasNext: page < totalPages,
      hasPrev: page > 1
    },
    filters: {
      search: search || '',
      sort: sort || 'date-desc',
      type: type || 'all'
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});


