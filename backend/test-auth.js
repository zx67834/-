const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 7008;

// 配置 CORS，允许所有来源（开发环境）
app.use(cors({
  origin: '*',
  credentials: false
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 用户账号管理
const USERS_FILE = path.join(__dirname, '../data/users.json');

// 加载用户数据
function loadUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, 'utf8');
      const users = JSON.parse(data);
      console.log(`从文件加载了 ${users.length} 个用户`);
      return users;
    } else {
      console.log('用户文件不存在，将使用空数组');
    }
  } catch (error) {
    console.error('加载用户文件失败:', error);
  }
  return [];
}

// 保存用户数据
function saveUsers(users) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
  } catch (error) {
    console.error('保存用户文件失败:', error);
  }
}

let users = loadUsers();

// 登录API
app.post('/api/auth/login', express.json(), (req, res) => {
  console.log('收到登录请求:', req.body);
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: '缺少邮箱或密码' });
  }
  
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) {
    return res.status(401).json({ success: false, error: '邮箱或密码错误' });
  }
  
  res.json({ 
    success: true, 
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      riskLevel: user.riskLevel
    }
  });
});

// 注册API
app.post('/api/auth/register', express.json(), (req, res) => {
  console.log('收到注册请求:', req.body);
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, error: '缺少必要字段' });
  }
  
  if (users.some(u => u.email === email)) {
    return res.status(400).json({ success: false, error: '该邮箱已被注册' });
  }
  
  const newUser = {
    id: `USER_${Date.now()}`,
    name,
    email,
    password,
    role: role || '普通用户',
    risk