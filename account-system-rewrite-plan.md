# 账户系统改写方案：区分监护人端和用户端

## 1. 系统分析

### 1.1 当前系统现状

**后端**：
- 用户数据结构包含基本字段：id, username, password, email, phone, name, role, riskLevel, bio, createdAt, updatedAt
- 角色类型：admin, 普通用户
- 登录/注册 API 已实现，但未区分用户端和监护人端
- 无监护关系管理机制

**前端**：
- 已分为用户端 (/user/*) 和监护人端 (/guardian/*) 路由结构
- 界面布局已分离，但后端权限控制未同步

### 1.2 需求分析

- 账户系统需明确区分"监护人端"和"用户端"
- 需建立监护关系（监护人关联被监护人）
- 需实现基于角色的权限控制
- 需确保数据隔离与安全访问

## 2. 详细改写方案

### 2.1 账户数据结构设计

#### 2.1.1 用户数据结构扩展

```javascript
// 用户数据结构
{
  "id": 1,
  "username": "user1",
  "password": "hashed_password",
  "email": "user1@example.com",
  "phone": "13900139000",
  "name": "王小明",
  "role": "user", // user, guardian, admin
  "riskLevel": "中风险",
  "bio": "个人简介",
  "createdAt": "2025-01-02T00:00:00.000Z",
  "updatedAt": "2025-01-02T00:00:00.000Z",
  "guardianId": 2, // 被监护人关联的监护人ID（可选）
  "wardIds": [3, 4] // 监护人关联的被监护人ID数组（可选）
}
```

#### 2.1.2 监护关系数据结构

```javascript
// 监护关系数据结构（可选，独立存储）
[
  {
    "id": 1,
    "guardianId": 2,
    "wardId": 3,
    "relationship": "父子",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "status": "active"
  }
]
```

### 2.2 权限控制体系

#### 2.2.1 后端权限控制

**API 权限矩阵**：

| API 端点 | 用户端 | 监护人端 | 管理员 |
|---------|--------|----------|--------|
| /api/auth/login | ✓ | ✓ | ✓ |
| /api/auth/register | ✓ | ✓ | ✓ |
| /api/auth/user | ✓ (自身) | ✓ (自身+被监护人) | ✓ |
| /api/guardian/* | ✗ | ✓ | ✓ |
| /api/user/* | ✓ | ✗ | ✓ |
| /api/reports | ✓ (自身) | ✓ (自身+被监护人) | ✓ |
| /api/knowledge | ✓ | ✓ | ✓ |

**权限验证中间件**：

```javascript
// 权限验证中间件
function authorize(roles = []) {
  return (req, res, next) => {
    const user = req.user; // 从JWT或session中获取
    if (!user) {
      return res.status(401).json({ success: false, error: '未授权' });
    }
    
    if (!roles.includes(user.role)) {
      return res.status(403).json({ success: false, error: '权限不足' });
    }
    
    next();
  };
}

// 监护关系验证中间件
function verifyGuardianRelationship(req, res, next) {
  const userId = req.params.userId || req.body.userId;
  const currentUser = req.user;
  
  // 管理员可以访问所有
  if (currentUser.role === 'admin') {
    return next();
  }
  
  // 监护人可以访问自己和被监护人
  if (currentUser.role === 'guardian') {
    if (currentUser.id === parseInt(userId) || 
        currentUser.wardIds?.includes(parseInt(userId))) {
      return next();
    }
  }
  
  // 用户只能访问自己
  if (currentUser.role === 'user' && currentUser.id === parseInt(userId)) {
    return next();
  }
  
  return res.status(403).json({ success: false, error: '无权访问此资源' });
}
```

#### 2.2.2 前端权限控制

**路由守卫**：

```javascript
// 路由守卫
router.beforeEach((to, from, next) => {
  const user = store.state.user;
  
  // 公开路由
  if (to.path === '/' || to.path === '/quickstart') {
    return next();
  }
  
  // 需要登录的路由
  if (!user) {
    return next('/');
  }
  
  // 用户端路由
  if (to.path.startsWith('/user/') && user.role === 'user') {
    return next();
  }
  
  // 监护人端路由
  if (to.path.startsWith('/guardian/') && user.role === 'guardian') {
    return next();
  }
  
  // 管理员可以访问所有
  if (user.role === 'admin') {
    return next();
  }
  
  // 权限不足，重定向到首页
  next('/');
});
```

### 2.3 界面交互逻辑

#### 2.3.1 注册流程

1. **角色选择**：
   - 注册页面增加角色选择（用户/监护人）
   - 监护人注册需额外填写监护关系信息

2. **注册 API 调整**：
   - 接收 role 参数（user/guardian）
   - 监护人注册时可选择关联被监护人

#### 2.3.2 登录流程

1. **登录验证**：
   - 验证用户身份
   - 返回用户信息，包含角色和监护关系

2. **登录后跳转**：
   - 根据用户角色自动跳转到对应端的仪表盘
   - 用户 → /user/dashboard
   - 监护人 → /guardian/dashboard

#### 2.3.3 个人中心差异化

**用户端个人中心**：
- 显示个人基本信息
- 显示风险等级和安全建议
- 管理个人设置

**监护人端个人中心**：
- 显示个人基本信息
- 显示关联的被监护人列表
- 管理监护关系
- 查看被监护人的安全状态

### 2.4 数据隔离机制

#### 2.4.1 API 数据过滤

- **用户 API**：只返回当前用户数据
- **监护人 API**：返回监护人和被监护人数据
- **管理员 API**：返回所有用户数据

#### 2.4.2 数据库查询优化

- 为监护人查询添加 wardIds 过滤
- 为用户查询添加 id 过滤
- 确保数据访问的安全性

### 2.5 业务流程适配

#### 2.5.1 核心功能模块权限控制

**智能分析模块**：
- 用户：只能分析自己的内容
- 监护人：可以分析自己和被监护人的内容
- 管理员：可以分析所有内容

**预警中心模块**：
- 用户：只能查看自己的预警
- 监护人：可以查看自己和被监护人的预警
- 管理员：可以查看所有预警

**安全报告模块**：
- 用户：只能查看和生成自己的报告
- 监护人：可以查看和生成自己和被监护人的报告
- 管理员：可以查看和生成所有报告

**监护人管理模块**：
- 用户：无权限访问
- 监护人：可以管理监护关系
- 管理员：可以管理所有监护关系

#### 2.5.2 API 接口扩展

**新增 API 端点**：

1. **监护关系管理**：
   - POST /api/guardian/relationships - 创建监护关系
   - GET /api/guardian/relationships - 获取监护关系
   - PUT /api/guardian/relationships/:id - 更新监护关系
   - DELETE /api/guardian/relationships/:id - 删除监护关系

2. **被监护人管理**：
   - GET /api/guardian/wards - 获取被监护人列表
   - GET /api/guardian/wards/:id - 获取被监护人详情
   - PUT /api/guardian/wards/:id - 更新被监护人信息

3. **权限相关**：
   - GET /api/auth/roles - 获取角色列表
   - GET /api/auth/permissions - 获取权限列表

### 2.6 安全性与一致性

#### 2.6.1 安全性措施

- **JWT 认证**：使用 JSON Web Token 进行身份验证
- **密码加密**：使用 bcrypt 等库加密存储密码
- **HTTPS**：确保所有 API 调用使用 HTTPS
- **输入验证**：对所有用户输入进行严格验证
- **权限校验**：在所有敏感 API 上添加权限校验

#### 2.6.2 一致性保障

- **数据同步**：确保监护关系数据与用户数据保持同步
- **事务处理**：在关键操作中使用事务确保数据一致性
- **日志记录**：记录所有关键操作的日志
- **错误处理**：统一处理错误，确保系统稳定性

### 2.7 角色切换机制

- **管理员角色**：可以在用户端和监护人端之间切换查看
- **角色升级**：用户可以申请成为监护人，需经过验证
- **临时访问**：监护人可以临时以被监护人身份登录（需验证）

## 3. 实施计划

### 3.1 后端改造

1. **数据结构调整**：
   - 更新 users.json 数据结构，添加 role, guardianId, wardIds 字段
   - 可选：创建 guardianships.json 存储监护关系

2. **API 改造**：
   - 更新登录/注册 API，支持角色选择
   - 新增监护关系管理 API
   - 添加权限验证中间件
   - 更新现有 API，支持权限控制

3. **认证机制**：
   - 实现 JWT 认证
   - 添加密码加密

### 3.2 前端改造

1. **路由调整**：
   - 更新路由配置，添加权限控制
   - 实现路由守卫

2. **界面改造**：
   - 更新注册页面，添加角色选择
   - 更新登录页面，优化登录后跳转逻辑
   - 差异化用户端和监护人端的个人中心
   - 添加监护关系管理界面

3. **状态管理**：
   - 实现用户状态管理，包含角色和权限信息
   - 实现监护关系状态管理

### 3.3 测试与验证

1. **功能测试**：
   - 测试注册流程（用户/监护人）
   - 测试登录流程（不同角色）
   - 测试权限控制（不同角色访问不同资源）
   - 测试监护关系管理

2. **安全测试**：
   - 测试权限越界访问
   - 测试密码安全性
   - 测试 API 接口安全性

3. **性能测试**：
   - 测试系统响应速度
   - 测试数据处理能力

## 4. 预期效果

- **清晰的角色分离**：用户端和监护人端功能明确分离
- **严格的权限控制**：确保不同角色只能访问对应资源
- **流畅的用户体验**：登录后自动跳转到对应端，无需手动刷新
- **安全的数据访问**：确保数据隔离和权限校验
- **完整的监护关系管理**：支持监护人管理被监护人

## 5. 技术栈

- **后端**：Node.js, Express, JSON Web Token, bcrypt
- **前端**：Vue 3, Vue Router, Vuex/Pinia
- **数据存储**：JSON 文件存储（生产环境建议使用数据库）

## 6. 风险评估

- **数据迁移风险**：现有用户数据需要迁移到新结构
- **权限控制风险**：权限校验逻辑可能存在漏洞
- **兼容性风险**：现有功能可能受影响
- **性能风险**：权限校验可能增加系统负载

**缓解措施**：
- 制定详细的数据迁移计划
- 进行全面的安全测试
- 保持向后兼容
- 优化权限校验逻辑