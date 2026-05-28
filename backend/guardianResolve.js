const path = require('path');

function normalizeEmail(e) {
  return String(e || '').trim().toLowerCase();
}

function findUserByEmail(users, email) {
  const n = normalizeEmail(email);
  if (!n) return null;
  return users.find((u) => normalizeEmail(u.email) === n) || null;
}

function loadGuardianLinks(fs, filePath) {
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(raw);
      return Array.isArray(data) ? data : [];
    }
  } catch (err) {
    console.error('加载 guardian-links 失败:', err);
  }
  return [];
}

function saveGuardianLinks(fs, filePath, links) {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(links, null, 2), 'utf8');
  } catch (err) {
    console.error('保存 guardian-links 失败:', err);
  }
}

function upsertGuardianLink(links, payload) {
  const {
    guardianEmail,
    guardianName,
    guardianPhone,
    wardEmail,
    wardName,
    relationship
  } = payload || {};
  const g = normalizeEmail(guardianEmail);
  const w = normalizeEmail(wardEmail);
  if (!g || !w) return Array.isArray(links) ? [...links] : [];
  const base = Array.isArray(links) ? [...links] : [];
  const filtered = base.filter(
    (item) =>
      !(
        normalizeEmail(item.guardianEmail) === g &&
        normalizeEmail(item.wardEmail) === w
      )
  );
  filtered.push({
    guardianEmail: String(guardianEmail).trim(),
    guardianName: guardianName || '',
    guardianPhone: guardianPhone || '',
    wardEmail: String(wardEmail).trim(),
    wardName: wardName || '',
    relationship: relationship || '',
    verifiedAt: new Date().toISOString()
  });
  return filtered;
}

function removeGuardianLink(links, guardianEmail, wardEmail) {
  const g = normalizeEmail(guardianEmail);
  const w = normalizeEmail(wardEmail);
  const base = Array.isArray(links) ? links : [];
  return base.filter(
    (item) =>
      !(
        normalizeEmail(item.guardianEmail) === g &&
        normalizeEmail(item.wardEmail) === w
      )
  );
}

/**
 * 优先使用已绑定监护人，避免在已有绑定时仍创建 guardian_*@example.com 占位账号。
 * @returns {{ guardian: object, guardianCreated: boolean, createdGuardianPassword: string|null, persistUsers: boolean }}
 */
function resolveGuardian({
  fs,
  guardianLinksFile,
  users,
  userEmail,
  userName,
  userPhone,
  nowIso,
  reqBody
}) {
  const now = nowIso || new Date().toISOString();
  const userNameSafe = userName || '用户';
  const wardNorm = normalizeEmail(userEmail);

  const boundFromBody = Array.isArray(reqBody?.boundGuardians)
    ? reqBody.boundGuardians
    : [];

  let guardian = null;
  let guardianCreated = false;
  let createdGuardianPassword = null;
  let persistUsers = false;

  for (const b of boundFromBody) {
    const u = findUserByEmail(users, b?.guardianEmail);
    if (u) {
      guardian = u;
      break;
    }
  }

  if (!guardian && boundFromBody.length > 0 && boundFromBody[0]?.guardianEmail) {
    const b0 = boundFromBody[0];
    guardian = {
      email: String(b0.guardianEmail).trim(),
      name: b0.guardianName || '监护人',
      phone: b0.guardianPhone || '',
      userType: '监护人',
      synthetic: true
    };
  }

  if (!guardian && fs && guardianLinksFile) {
    const links = loadGuardianLinks(fs, guardianLinksFile);
    const match = [...links].reverse().find((l) => normalizeEmail(l.wardEmail) === wardNorm);
    if (match?.guardianEmail) {
      const u = findUserByEmail(users, match.guardianEmail);
      if (u) {
        guardian = u;
      } else {
        guardian = {
          email: String(match.guardianEmail).trim(),
          name: match.guardianName || '监护人',
          phone: match.guardianPhone || '',
          userType: '监护人',
          synthetic: true
        };
      }
    }
  }

  if (!guardian) {
    guardian = users.find(
      (item) =>
        item.userType === '监护人' &&
        normalizeEmail(item.guardedUserEmail) === wardNorm
    );
  }

  if (!guardian) {
    const nextId =
      users.length > 0 ? Math.max(...users.map((item) => item.id || 0)) + 1 : 1;
    createdGuardianPassword = `Guardian@${String(Date.now()).slice(-6)}`;
    guardian = {
      id: nextId,
      username: `guardian_${nextId}`,
      password: createdGuardianPassword,
      email: `guardian_${nextId}@example.com`,
      phone: userPhone || '13800000000',
      name: `${userNameSafe}监护人`,
      userType: '监护人',
      role: '家长',
      guardedUserEmail: userEmail,
      riskLevel: '高风险',
      bio: '系统自动创建的监护人账户',
      createdAt: now,
      updatedAt: now
    };
    users.push(guardian);
    guardianCreated = true;
    persistUsers = true;
  }

  return { guardian, guardianCreated, createdGuardianPassword, persistUsers };
}

module.exports = {
  normalizeEmail,
  findUserByEmail,
  loadGuardianLinks,
  saveGuardianLinks,
  upsertGuardianLink,
  removeGuardianLink,
  resolveGuardian
};
