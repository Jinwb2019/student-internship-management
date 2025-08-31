import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

dotenv.config();
const app = express();
const prisma = new PrismaClient();

// ---- 全局中间件 ----
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));

// 健康检查
app.get('/health', (_req, res) => res.json({ ok: true }));

// ---- 工具函数/中间件 ----
const signToken = (user) =>
  jwt.sign({ uid: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '2h' });

const authGuard = (roles = []) => (req, res, next) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (roles.length && !roles.includes(payload.role)) {
      return res.status(403).json({ msg: 'forbidden' });
    }
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ msg: 'unauthorized' });
  }
};

// ---- Auth：登录 ----
app.post('/auth/login', async (req, res) => {
  try {
    const schema = z.object({ username: z.string(), password: z.string().min(6) });
    const { username, password } = schema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return res.status(400).json({ msg: 'invalid credentials' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(400).json({ msg: 'invalid credentials' });

    const token = signToken(user);
    res.json({ token, mustResetPwd: user.mustResetPwd });
  } catch (e) {
    if (e?.issues) return res.status(400).json({ msg: 'bad request', issues: e.issues });
    res.status(500).json({ msg: 'server error' });
  }
});

// ---- 首登修改密码 + 绑定手机号 ----
app.post('/auth/first-setup', authGuard(), async (req, res) => {
  try {
    const schema = z.object({
      newPassword: z.string().min(8),
      phone: z.string().regex(/^1\d{10}$|^\d{10,15}$/)
    });
    const { newPassword, phone } = schema.parse(req.body);

    await prisma.user.update({
      where: { id: req.user.uid },
      data: {
        passwordHash: await bcrypt.hash(newPassword, 10),
        phone,
        mustResetPwd: false
      }
    });
    res.json({ ok: true });
  } catch (e) {
    if (e?.issues) return res.status(400).json({ msg: 'bad request', issues: e.issues });
    res.status(500).json({ msg: 'server error' });
  }
});

// ---- 管理员创建用户 ----
app.post('/admin/users', authGuard(['ADMIN']), async (req, res) => {
  try {
    const schema = z.object({
      username: z.string(),
      role: z.enum([
        'ADMIN','EDU_SECRETARY','COMPANY_MGR','STUDENT','LEAD_TEACHER','COMPANY_MENTOR','EXPERT'
      ]),
      initialPassword: z.string().min(8)
    });
    const { username, role, initialPassword } = schema.parse(req.body);

    const user = await prisma.user.create({
      data: {
        username,
        role,
        passwordHash: await bcrypt.hash(initialPassword, 10)
      }
    });
    res.json({ id: user.id });
  } catch (e) {
    if (e?.code === 'P2002') return res.status(409).json({ msg: 'username or phone already exists' });
    if (e?.issues) return res.status(400).json({ msg: 'bad request', issues: e.issues });
    res.status(500).json({ msg: 'server error' });
  }
});

// ---- 阶段控制 ----
app.get('/stage', authGuard(), async (_req, res) => {
  const s = await prisma.stage.findFirst({ where: { isActive: true } });
  res.json(s);
});

app.post('/stage/switch', authGuard(['ADMIN']), async (req, res) => {
  try {
    const schema = z.object({ code: z.string(), name: z.string().optional() });
    const { code, name } = schema.parse(req.body);

    await prisma.stage.updateMany({ data: { isActive: false }, where: { isActive: true } });
    const s = await prisma.stage.upsert({
      where: { code },
      create: { code, name: name || code, isActive: true },
      update: { isActive: true, name: name || code }
    });
    res.json(s);
  } catch (e) {
    if (e?.issues) return res.status(400).json({ msg: 'bad request', issues: e.issues });
    res.status(500).json({ msg: 'server error' });
  }
});

// ---- 个人信息 & 待办 ----
app.get('/me', authGuard(), async (req, res) => {
  const me = await prisma.user.findUnique({
    where: { id: req.user.uid },
    select: { id: true, username: true, role: true, phone: true, mustResetPwd: true }
  });
  res.json(me);
});

app.get('/todos', authGuard(), async (req, res) => {
  const todos = await prisma.todo.findMany({ where: { userId: req.user.uid } });
  res.json(todos);
});

// ---- 全局错误兜底（可选） ----
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ msg: 'server error' });
});

// ---- 启动 ----
const PORT = process.env.PORT || 5000;
if (!process.env.JWT_SECRET) {
  console.warn('⚠️  JWT_SECRET 未设置，将导致鉴权失败。请在 .env 设置 JWT_SECRET。');
}
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
