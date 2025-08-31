import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // 默认阶段：报名
  await prisma.stage.upsert({
    where: { code: 'APPLY' },
    update: { isActive: true, name: '报名' },
    create: { code: 'APPLY', name: '报名', isActive: true }
  });

  // 管理员
  const adminPwd = await bcrypt.hash('Admin@1234', 10);
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      role: 'ADMIN',
      passwordHash: adminPwd,
      mustResetPwd: false
    }
  });

  console.log('✅ Seed done: admin/Admin@1234 & stage APPLY');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
