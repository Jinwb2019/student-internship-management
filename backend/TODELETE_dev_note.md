### 备忘录

服务器与路由：backend/src/server.js


种子数据：backend/prisma/seed.js


启动：
npm run dev

Server running on http://localhost:5000


## 测试

### 1) 健康检查
Invoke-RestMethod -Uri http://localhost:5000/health -Method GET

### 2) 登录（admin / Admin@1234）
$resp = Invoke-RestMethod -Uri http://localhost:5000/auth/login -Method POST `
  -ContentType "application/json" `
  -Body '{"username":"admin","password":"Admin@1234"}'
$resp

### 3) 带 token 调用 /stage
$token = $resp.token
Invoke-RestMethod -Uri http://localhost:5000/stage -Headers @{Authorization="Bearer $token"} -Method GET

### 4) 切换阶段（管理员）
Invoke-RestMethod -Uri http://localhost:5000/stage/switch -Headers @{Authorization="Bearer $token"} `
  -Method POST -ContentType "application/json" -Body '{"code":"ASSIGN","name":"分配企业"}'

