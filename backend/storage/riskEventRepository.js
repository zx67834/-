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
    severity: row.severity || '',
    userEmail: normalizeEmail(row.user_email),
    userName: row.user_name || '',
    summary: row.summary || '',
    risks: parseJson(row.risks_json, []),
    reportId: row.report_legacy_id ? Number(row.report_legacy_id) : undefined,
    handled: Boolean(row.handled),
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
  const [rows] = await pool.query('SELECT COALESCE(MAX(legacy_id), 0) + 1 AS nextId FROM af_risk_events');
  return Number(rows[0]?.nextId || 1);
}

async function list() {
  return withPool(async (pool) => {
    const [rows] = await pool.query(`
      SELECT *
      FROM af_risk_events
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
    const reportId = input.reportId || input.reportLegacyId || null;

    await pool.execute(
      `INSERT INTO af_risk_events
        (legacy_id, user_email, user_name, severity, summary, risks_json, report_legacy_id,
         handled, raw_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, CAST(? AS JSON), ?, ?, CAST(? AS JSON), ?, ?)
       ON DUPLICATE KEY UPDATE
        user_email = VALUES(user_email),
        user_name = VALUES(user_name),
        severity = VALUES(severity),
        summary = VALUES(summary),
        risks_json = VALUES(risks_json),
        report_legacy_id = VALUES(report_legacy_id),
        handled = VALUES(handled),
        raw_json = VALUES(raw_json),
        updated_at = VALUES(updated_at)`,
      [
        legacyId,
        normalizeEmail(input.userEmail),
        input.userName || '',
        input.severity || '',
        input.summary || '',
        json(input.risks, []),
        reportId,
        input.handled ? 1 : 0,
        json({ ...input, id: legacyId }, {}),
        createdAt,
        updatedAt
      ]
    );

    const [rows] = await pool.execute(
      'SELECT * FROM af_risk_events WHERE legacy_id = ? OR id = ? LIMIT 1',
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
