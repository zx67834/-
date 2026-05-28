const { createPool } = require('../db/connection');

function mysqlEnabled() {
  return String(process.env.STORAGE_DRIVER || '').toLowerCase() === 'mysql';
}

function json(value, fallback) {
  if (value === undefined) return JSON.stringify(fallback);
  return JSON.stringify(value);
}

function normalizeRow(row) {
  return {
    id: Number(row.legacy_id || row.id),
    title: row.title || '',
    description: row.description || '',
    content: row.content || '',
    category: row.category || '',
    source: row.source || '',
    icon: row.icon || 'mdi-book',
    iconColor: row.icon_color || 'blue',
    tags: parseJson(row.tags_json, []),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at)
  };
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

function toIso(value) {
  if (!value) return new Date().toISOString();
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
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
  const [rows] = await pool.query('SELECT COALESCE(MAX(legacy_id), 0) + 1 AS nextId FROM af_knowledge_items');
  return Number(rows[0]?.nextId || 1);
}

async function list(filters = {}) {
  return withPool(async (pool) => {
    const values = [];
    const where = [];

    if (filters.category && filters.category !== '鍏ㄩ儴') {
      where.push('category = ?');
      values.push(filters.category);
    }
    if (filters.source && filters.source !== '鍏ㄩ儴') {
      where.push('source = ?');
      values.push(filters.source);
    }
    if (filters.search) {
      where.push('(LOWER(title) LIKE ? OR LOWER(description) LIKE ? OR LOWER(content) LIKE ?)');
      const q = `%${String(filters.search).toLowerCase()}%`;
      values.push(q, q, q);
    }

    const sql = `
      SELECT *
      FROM af_knowledge_items
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      ORDER BY COALESCE(legacy_id, id) ASC
    `;
    const [rows] = await pool.execute(sql, values);
    return rows.map(normalizeRow);
  });
}

async function findById(id) {
  return withPool(async (pool) => {
    const [rows] = await pool.execute(
      'SELECT * FROM af_knowledge_items WHERE legacy_id = ? OR id = ? LIMIT 1',
      [id, id]
    );
    return rows[0] ? normalizeRow(rows[0]) : null;
  });
}

async function create(input) {
  return withPool(async (pool) => {
    const legacyId = input.id || await nextLegacyId(pool);
    const now = new Date();
    await pool.execute(
      `INSERT INTO af_knowledge_items
        (legacy_id, title, description, content, category, source, icon, icon_color, tags_json, raw_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, CAST(? AS JSON), CAST(? AS JSON), ?, ?)
       ON DUPLICATE KEY UPDATE
        title = VALUES(title),
        description = VALUES(description),
        content = VALUES(content),
        category = VALUES(category),
        source = VALUES(source),
        icon = VALUES(icon),
        icon_color = VALUES(icon_color),
        tags_json = VALUES(tags_json),
        raw_json = VALUES(raw_json),
        updated_at = VALUES(updated_at)`,
      [
        legacyId,
        input.title,
        input.description || '',
        input.content || '',
        input.category,
        input.source,
        input.icon || 'mdi-book',
        input.iconColor || 'blue',
        json(input.tags, []),
        json({ ...input, id: legacyId }, {}),
        input.createdAt ? new Date(input.createdAt) : now,
        input.updatedAt ? new Date(input.updatedAt) : now
      ]
    );
    return findById(legacyId);
  });
}

async function update(id, input) {
  return withPool(async (pool) => {
    const current = await findById(id);
    if (!current) return null;
    const next = {
      ...current,
      ...input,
      id,
      updatedAt: new Date().toISOString()
    };
    await pool.execute(
      `UPDATE af_knowledge_items
       SET title = ?, description = ?, content = ?, category = ?, source = ?, icon = ?, icon_color = ?,
           tags_json = CAST(? AS JSON), raw_json = CAST(? AS JSON), updated_at = ?
       WHERE legacy_id = ? OR id = ?`,
      [
        next.title,
        next.description || '',
        next.content || '',
        next.category,
        next.source,
        next.icon || 'mdi-book',
        next.iconColor || 'blue',
        json(next.tags, []),
        json(next, {}),
        new Date(next.updatedAt),
        id,
        id
      ]
    );
    return findById(id);
  });
}

async function remove(id) {
  return withPool(async (pool) => {
    const [result] = await pool.execute(
      'DELETE FROM af_knowledge_items WHERE legacy_id = ? OR id = ?',
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
  remove,
  update
};
