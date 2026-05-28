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
    title: row.title || '',
    severity: row.severity || '',
    risks: parseJson(row.risks_json, []),
    actions: parseJson(row.actions_json, []),
    summary: row.summary || '',
    modality: row.modality || 'text',
    content: row.content || '',
    imageUrl: row.image_url || '',
    videoUrl: row.video_url || '',
    audioUrl: row.audio_url || '',
    fileInfo: parseJson(row.file_info_json, {}),
    transcription: row.transcription || '',
    authorEmail: normalizeEmail(row.user_email),
    authorName: row.user_name || '',
    date: toIso(row.created_at),
    events: row.events_count || 0
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
  const [rows] = await pool.query('SELECT COALESCE(MAX(legacy_id), 0) + 1 AS nextId FROM af_reports');
  return Number(rows[0]?.nextId || 1);
}

async function list() {
  return withPool(async (pool) => {
    const [rows] = await pool.query(`
      SELECT *
      FROM af_reports
      ORDER BY COALESCE(created_at, updated_at) DESC, COALESCE(legacy_id, id) DESC
    `);
    return rows.map(normalizeRow);
  });
}

async function findById(id) {
  return withPool(async (pool) => {
    const [rows] = await pool.execute(
      'SELECT * FROM af_reports WHERE legacy_id = ? OR id = ? LIMIT 1',
      [id, id]
    );
    return rows[0] ? normalizeRow(rows[0]) : null;
  });
}

async function create(input) {
  return withPool(async (pool) => {
    const legacyId = input.id || await nextLegacyId(pool);
    const createdAt = input.date ? new Date(input.date) : new Date();
    const updatedAt = input.updatedAt ? new Date(input.updatedAt) : createdAt;
    await pool.execute(
      `INSERT INTO af_reports
        (legacy_id, user_email, user_name, title, severity, modality, content, summary,
         risks_json, actions_json, image_url, video_url, audio_url, file_info_json,
         transcription, events_count, raw_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, CAST(? AS JSON), CAST(? AS JSON), ?, ?, ?, CAST(? AS JSON), ?, ?, CAST(? AS JSON), ?, ?)
       ON DUPLICATE KEY UPDATE
        user_email = VALUES(user_email),
        user_name = VALUES(user_name),
        title = VALUES(title),
        severity = VALUES(severity),
        modality = VALUES(modality),
        content = VALUES(content),
        summary = VALUES(summary),
        risks_json = VALUES(risks_json),
        actions_json = VALUES(actions_json),
        image_url = VALUES(image_url),
        video_url = VALUES(video_url),
        audio_url = VALUES(audio_url),
        file_info_json = VALUES(file_info_json),
        transcription = VALUES(transcription),
        events_count = VALUES(events_count),
        raw_json = VALUES(raw_json),
        updated_at = VALUES(updated_at)`,
      [
        legacyId,
        normalizeEmail(input.authorEmail || input.userEmail),
        input.authorName || input.userName || '',
        input.title,
        input.severity,
        input.modality || 'text',
        input.content || '',
        input.summary || '',
        json(input.risks, []),
        json(input.actions, []),
        input.imageUrl || '',
        input.videoUrl || '',
        input.audioUrl || '',
        json(input.fileInfo, {}),
        input.transcription || '',
        Number.isFinite(Number(input.events)) ? Number(input.events) : 0,
        json({ ...input, id: legacyId }, {}),
        createdAt,
        updatedAt
      ]
    );
    return findById(legacyId);
  });
}

async function remove(id) {
  return withPool(async (pool) => {
    const [result] = await pool.execute(
      'DELETE FROM af_reports WHERE legacy_id = ? OR id = ?',
      [id, id]
    );
    return result.affectedRows > 0;
  });
}

module.exports = {
  create,
  findById,
  list,
  mysqlEnabled,
  remove
};
