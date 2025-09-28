const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3001;

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 文件上传配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// 模拟数据库
let users = [{ username: 'admin', password: 'admin123' }];
let media = [];
let tags = [];

// 路由
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  
  if (user) {
    res.json({ success: true, message: '登录成功' });
  } else {
    res.status(401).json({ success: false, message: '用户名或密码错误' });
  }
});

app.post('/upload', upload.single('file'), (req, res) => {
  const { type, tags } = req.body;
  const fileUrl = `http://localhost:${PORT}/${req.file.path}`;
  
  const newMedia = {
    id: media.length + 1,
    type,
    url: fileUrl,
    tags: tags.split(','),
    uploadTime: new Date().toISOString()
  };
  
  media.push(newMedia);
  res.json({ success: true, data: newMedia });
});

app.get('/content', (req, res) => {
  const { type, tag } = req.query;
  let filteredMedia = media;
  
  if (type) {
    filteredMedia = filteredMedia.filter(m => m.type === type);
  }
  
  if (tag) {
    filteredMedia = filteredMedia.filter(m => m.tags.includes(tag));
  }
  
  res.json({ success: true, data: filteredMedia });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});