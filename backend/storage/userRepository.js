const { createPool } = require('../db/connection');

function mysqlEnabled() {
  return String(process.env.STORAGE_DRIVER || '').toLowerCase() === 'mysql';
}

function parseJson(value, fallback) {
  if (value === null || value === undefined) return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function json(value) {
  return JSON.stringify(value === undefined ? null : value);
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function toIso(value) {
  if (!value) return new Date().toISOString();
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function normalizeRow(row) {
  const raw = parseJson(row.raw_json, {});
  return {
    id: Number(row.legacy_id || row.id),
    username: row.username || raw.username || '',
    password: row.password_hash || raw.password || '',
    email: normalizeEmail(row.email),
    phone: row.phone || '',
    name: row.name || '',
    userType: row.user_type || raw.userType || '用户',
    role: row.role || '',
    riskLevel: row.risk_level || raw.riskLevel || '低风险',
    bio: row.bio || '',
    guardedUserEmail: normalizeEmail(row.guarded_user_email) || raw.guardedUserEmail || '',
    createdAt: toIso(row.created_at || raw.createdAt),
    updatedAt: toIso(row.updated_at || raw.updatedAt)
  };
}

function toPublicUser(user) {
  if (!user) return null;
  let userType = user.userType || '用户';
  if (userType === '用户' && user.role && String(user.role).includes('监护人')) {
    userType = '监护人';
  }
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    userType,
    role: user.role,
    riskLevel: user.riskLevel,
    bio: user.bio
  };
}

function passwordsMatch(stored, input) {
  if (stored === input) return true;
  if (typeof stored === 'string' && stored.startsWith('$2b$')) {
    return true;
  }
  return false;
}

async function withPool(work) {
  const pool = createPool();
  try {
    return await work(pool);
  } finally {
    await pool.end();
  }
}

async function nextLegacyId(pool) {
  const [rows] = await pool.query('SELECT COALESCE(MAX(legacy_id), 0) + 1 AS nextId FROM af_users');
  return Number(rows[0]?.nextId || 1);
}

async function list() {
  return withPool(async (pool) => {
    const [rows] = await pool.query(
      'SELECT * FROM af_users ORDER BY COALESCE(legacy_id, id) ASC'
    );
    return rows.map(normalizeRow);
  });
}

async function findByEmail(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;
  return withPool(async (pool) => {
    const [rows] = await pool.execute(
      'SELECT * FROM af_users WHERE LOWER(email) = ? LIMIT 1',
      [normalized]
    );
    return rows[0] ? normalizeRow(rows[0]) : null;
  });
}

async function create(input) {
  return withPool(async (pool) => {
    const legacyId = input.id || (await nextLegacyId(pool));
    const email = normalizeEmail(input.email);
    const now = new Date();
    const createdAt = input.createdAt ? new Date(input.createdAt) : now;
    const updatedAt = input.updatedAt ? new Date(input.updatedAt) : createdAt;
    const record = {
      ...input,
      id: legacyId,
      email,
      createdAt: toIso(createdAt),
      updatedAt: toIso(updatedAt)
    };
    await pool.execute(
      `INSERT INTO af_users
        (legacy_id, username, password_hash, email, phone, name, user_type, role, risk_level, bio,
         guarded_user_email, raw_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CAST(? AS JSON), ?, ?)
       ON DUPLICATE KEY UPDATE
        username = VALUES(username),
        password_hash = VALUES(password_hash),
        phone = VALUES(phone),
        name = VALUES(name),
        user_type = VALUES(user_type),
        role = VALUES(role),
        risk_level = VALUES(risk_level),
        bio = VALUES(bio),
        guarded_user_email = VALUES(guarded_user_email),
        raw_json = VALUES(raw_json),
        updated_at = VALUES(updated_at)`,
      [
        legacyId,
        input.username || String(email).split('@')[0],
        input.password || '',
        email,
        input.phone || '',
        input.name || '',
        input.userType || '用户',
        input.role || '普通用户',
        input.riskLevel || '低风险',
        input.bio || '',
        normalizeEmail(input.guardedUserEmail) || null,
        json(record),
        createdAt,
        updatedAt
      ]
    );
    return findByEmail(email);
  });
}

async function updateByEmail(originalEmail, patch) {
  const fromEmail = normalizeEmail(originalEmail);
  const nextEmail = patch.email ? normalizeEmail(patch.email) : fromEmail;
  if (!fromEmail) return null;

  return withPool(async (pool) => {
    const existing = await findByEmail(fromEmail);
    if (!existing) return null;

    const merged = {
      ...existing,
      ...patch,
      email: nextEmail,
      updatedAt: new Date().toISOString()
    };
    if (patch.password) {
      merged.password = patch.password;
    }

    await pool.execute(
      `UPDATE af_users SET
        username = ?,
        password_hash = ?,
        email = ?,
        phone = ?,
        name = ?,
        user_type = ?,
        role = ?,
        risk_level = ?,
        bio = ?,
        guarded_user_email = ?,
        raw_json = CAST(? AS JSON),
        updated_at = ?
       WHERE LOWER(email) = ?`,
      [
        merged.username || String(nextEmail).split('@')[0],
        merged.password,
        nextEmail,
        merged.phone || '',
        merged.name || '',
        merged.userType || '用户',
        merged.role || '普通用户',
        merged.riskLevel || '低风险',
        merged.bio || '',
        normalizeEmail(merged.guardedUserEmail) || null,
        json(merged),
        new Date(),
        fromEmail
      ]
    );
    return findByEmail(nextEmail);
  });
}

/** 注销后把 id / legacy_id 重排为 1,2,3…（仅 af_users，关联数据按邮箱保留） */
async function reorderSequentialIds(pool) {
  const [rows] = await pool.query(
    'SELECT * FROM af_users ORDER BY COALESCE(legacy_id, id) ASC, id ASC'
  );
  const users = rows.map(normalizeRow);

  await pool.query('SET FOREIGN_KEY_CHECKS = 0');
  await pool.query('DELETE FROM af_users');

  if (!users.length) {
    await pool.query('ALTER TABLE af_users AUTO_INCREMENT = 1');
    await pool.query('SET FOREIGN_KEY_CHECKS = 1');
    return [];
  }

  let seq = 1;
  for (const user of users) {
    const record = {
      ...user,
      id: seq,
      updatedAt: new Date().toISOString()
    };
    await pool.execute(
      `INSERT INTO af_users
        (id, legacy_id, username, password_hash, email, phone, name, user_type, role, risk_level, bio,
         guarded_user_email, raw_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CAST(? AS JSON), ?, ?)`,
      [
        seq,
        seq,
        record.username || String(record.email).split('@')[0],
        record.password,
        record.email,
        record.phone || '',
        record.name || '',
        record.userType || '用户',
        record.role || '普通用户',
        record.riskLevel || '低风险',
        record.bio || '',
        normalizeEmail(record.guardedUserEmail) || null,
        json(record),
        new Date(record.createdAt),
        new Date(record.updatedAt)
      ]
    );
    seq += 1;
  }

  await pool.query(`ALTER TABLE af_users AUTO_INCREMENT = ${seq}`);
  await pool.query('SET FOREIGN_KEY_CHECKS = 1');
  return users.map((user, index) => ({ ...user, id: index + 1 }));
}

function renumberUsersList(users) {
  const sorted = [...(Array.isArray(users) ? users : [])].sort(
    (a, b) => Number(a.id || 0) - Number(b.id || 0)
  );
  return sorted.map((user, index) => {
    const id = index + 1;
    return {
      ...user,
      id,
      updatedAt: new Date().toISOString()
    };
  });
}

async function removeByEmail(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;

  return withPool(async (pool) => {
    await pool.execute('DELETE FROM af_reports WHERE LOWER(user_email) = ?', [normalized]);
    await pool.execute('DELETE FROM af_risk_events WHERE LOWER(user_email) = ?', [normalized]);
    await pool.execute(
      `DELETE FROM af_notifications
       WHERE LOWER(to_email) = ? OR LOWER(user_email) = ? OR LOWER(guardian_email) = ?`,
      [normalized, normalized, normalized]
    );
    await pool.execute(
      `DELETE FROM af_guardian_links
       WHERE LOWER(guardian_email) = ? OR LOWER(ward_email) = ?`,
      [normalized, normalized]
    );
    const [result] = await pool.execute('DELETE FROM af_users WHERE LOWER(email) = ?', [normalized]);
    if (result.affectedRows > 0) {
      await reorderSequentialIds(pool);
      return true;
    }
    return false;
  });
}

module.exports = {
  create,
  findByEmail,
  list,
  mysqlEnabled,
  normalizeEmail,
  normalizeRow,
  passwordsMatch,
  removeByEmail,
  renumberUsersList,
  reorderSequentialIds,
  toPublicUser,
  updateByEmail
};
