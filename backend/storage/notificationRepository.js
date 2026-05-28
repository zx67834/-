const { createPool } = require('../db/connection');

function mysqlEnabled() {
  return String(process.env.STORAGE_DRIVER || '').toLowerCase() === 'mysql';
}

function json(value, fallback) {
  if (value === undefined) return JSON.stringify(fallback);
  return JSON.stringify(value);
}

function toIso(value) {
  if (!value) return new Date().toISOString();
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeRow(row) {
  return {
    id: Number(row.legacy_id || row.id),
    type: row.type || '',
    to: normalizeEmail(row.to_email),
    userEmail: normalizeEmail(row.user_email),
    guardianEmail: normalizeEmail(row.guardian_email),
    title: row.title || '',
    content: row.content || '',
    read: Boolean(row.read_status),
    riskEventId: row.risk_event_legacy_id ? Number(row.risk_event_legacy_id) : undefined,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at)
  };
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
  const [rows] = await pool.query('SELECT COALESCE(MAX(legacy_id), 0) + 1 AS nextId FROM af_notifications');
  return Number(rows[0]?.nextId || 1);
}

async function list() {
  return withPool(async (pool) => {
    const [rows] = await pool.query(`
      SELECT *
      FROM af_notifications
      ORDER BY COALESCE(created_at, updated_at) DESC, COALESCE(legacy_id, id) DESC
    `);
    return rows.map(normalizeRow);
  });
}

async function create(input) {
  return withPool(async (pool) => {
    const legacyId = input.id || await nextLegacyId(pool);
    const createdAt = input.createdAt ? new Date(input.createdAt) : new Date();
    const updatedAt = input.updatedAt ? new Date(input.updatedAt) : createdAt;
    const to = normalizeEmail(input.to || input.toEmail);
    const userEmail = normalizeEmail(input.userEmail || input.wardEmail);
    const guardianEmail = normalizeEmail(input.guardianEmail || (input.type === 'guardian-notify' ? to : ''));
    const riskEventId = input.riskEventId || input.riskEventLegacyId || null;

    await pool.execute(
      `INSERT INTO af_notifications
        (legacy_id, type, to_email, user_email, guardian_email, title, content,
         read_status, risk_event_legacy_id, raw_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CAST(? AS JSON), ?, ?)
       ON DUPLICATE KEY UPDATE
        type = VALUES(type),
        to_email = VALUES(to_email),
        user_email = VALUES(user_email),
        guardian_email = VALUES(guardian_email),
        title = VALUES(title),
        content = VALUES(content),
        read_status = VALUES(read_status),
        risk_event_legacy_id = VALUES(risk_event_legacy_id),
        raw_json = VALUES(raw_json),
        updated_at = VALUES(updated_at)`,
      [
        legacyId,
        input.type || '',
        to,
        userEmail,
        guardianEmail,
        input.title || '',
        input.content || '',
        input.read || input.readStatus ? 1 : 0,
        riskEventId,
        json({ ...input, id: legacyId }, {}),
        createdAt,
        updatedAt
      ]
    );

    const [rows] = await pool.execute(
      'SELECT * FROM af_notifications WHERE legacy_id = ? OR id = ? LIMIT 1',
      [legacyId, legacyId]
    );
    return rows[0] ? normalizeRow(rows[0]) : { ...input, id: legacyId };
  });
}

module.exports = {
  create,
  list,
  mysqlEnabled
};
