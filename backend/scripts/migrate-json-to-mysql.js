require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { createPool, getDbConfig } = require('../db/connection');

const rootDir = path.resolve(__dirname, '..', '..');
const dataDir = path.join(rootDir, 'data');
const schemaFile = path.join(__dirname, '..', 'db', 'schema.sql');

function readJson(name) {
  const file = path.join(dataDir, name);
  if (!fs.existsSync(file)) return [];
  const raw = fs.readFileSync(file, 'utf8');
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : [];
}

function sqlDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function jsonValue(value) {
  return value === undefined ? null : JSON.stringify(value);
}

function stringValue(value) {
  if (value === undefined || value === null) return null;
  return String(value);
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function splitSqlStatements(sql) {
  return sql
    .split(/;\s*(?:\r?\n|$)/)
    .map((item) => item.trim())
    .filter(Boolean);
}

async function runSchema(pool) {
  const sql = fs.readFileSync(schemaFile, 'utf8');
  for (const statement of splitSqlStatements(sql)) {
    await pool.query(statement);
  }
}

async function migrateUsers(pool, items) {
  for (const item of items) {
    const email = normalizeEmail(item.email);
    if (!email) continue;
    await pool.execute(
      `INSERT INTO af_users
        (legacy_id, username, password_hash, email, phone, name, user_type, role, risk_level, bio, guarded_user_email, raw_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CAST(? AS JSON), COALESCE(?, CURRENT_TIMESTAMP), COALESCE(?, CURRENT_TIMESTAMP))
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
        item.id || null,
        stringValue(item.username),
        stringValue(item.password),
        email,
        stringValue(item.phone),
        stringValue(item.name),
        stringValue(item.userType),
        stringValue(item.role),
        stringValue(item.riskLevel),
        stringValue(item.bio),
        normalizeEmail(item.guardedUserEmail) || null,
        jsonValue(item),
        sqlDate(item.createdAt),
        sqlDate(item.updatedAt || item.createdAt)
      ]
    );
  }
  return items.length;
}

async function migrateGuardianLinks(pool, items) {
  let count = 0;
  for (const item of items) {
    const guardianEmail = normalizeEmail(item.guardianEmail);
    const wardEmail = normalizeEmail(item.wardEmail);
    if (!guardianEmail || !wardEmail) continue;
    count += 1;
    await pool.execute(
      `INSERT INTO af_guardian_links
        (guardian_email, guardian_name, guardian_phone, ward_email, ward_name, relationship, status, verified_at, raw_json)
       VALUES (?, ?, ?, ?, ?, ?, 'active', ?, CAST(? AS JSON))
       ON DUPLICATE KEY UPDATE
        guardian_name = VALUES(guardian_name),
        guardian_phone = VALUES(guardian_phone),
        ward_name = VALUES(ward_name),
        relationship = VALUES(relationship),
        status = VALUES(status),
        verified_at = VALUES(verified_at),
        raw_json = VALUES(raw_json)`,
      [
        guardianEmail,
        stringValue(item.guardianName),
        stringValue(item.guardianPhone),
        wardEmail,
        stringValue(item.wardName),
        stringValue(item.relationship),
        sqlDate(item.verifiedAt),
        jsonValue(item)
      ]
    );
  }
  return count;
}

async function migrateReports(pool, items) {
  for (const item of items) {
    await pool.execute(
      `INSERT INTO af_reports
        (legacy_id, user_email, user_name, title, severity, modality, content, summary, risks_json, actions_json,
         image_url, video_url, audio_url, file_info_json, transcription, events_count, raw_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, CAST(? AS JSON), CAST(? AS JSON), ?, ?, ?, CAST(? AS JSON), ?, ?, CAST(? AS JSON), COALESCE(?, CURRENT_TIMESTAMP), COALESCE(?, CURRENT_TIMESTAMP))
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
        item.id || null,
        normalizeEmail(item.userEmail || item.authorEmail) || null,
        stringValue(item.userName || item.authorName),
        stringValue(item.title),
        stringValue(item.severity || item.riskLevel),
        stringValue(item.modality || item.type),
        stringValue(item.content),
        stringValue(item.summary),
        jsonValue(item.risks || item.reasons || []),
        jsonValue(item.actions || item.suggestions || []),
        stringValue(item.imageUrl),
        stringValue(item.videoUrl),
        stringValue(item.audioUrl),
        jsonValue(item.fileInfo || {}),
        stringValue(item.transcription),
        item.events === undefined ? null : Number(item.events),
        jsonValue(item),
        sqlDate(item.date || item.createdAt),
        sqlDate(item.updatedAt || item.date || item.createdAt)
      ]
    );
  }
  return items.length;
}

async function migrateRiskEvents(pool, items) {
  for (const item of items) {
    await pool.execute(
      `INSERT INTO af_risk_events
        (legacy_id, user_email, user_name, severity, summary, risks_json, report_legacy_id, handled, raw_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, CAST(? AS JSON), ?, ?, CAST(? AS JSON), COALESCE(?, CURRENT_TIMESTAMP), COALESCE(?, CURRENT_TIMESTAMP))
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
        item.id || null,
        normalizeEmail(item.userEmail) || null,
        stringValue(item.userName),
        stringValue(item.severity),
        stringValue(item.summary),
        jsonValue(item.risks || []),
        item.reportId || item.reportLegacyId || null,
        item.handled ? 1 : 0,
        jsonValue(item),
        sqlDate(item.createdAt),
        sqlDate(item.updatedAt || item.createdAt)
      ]
    );
  }
  return items.length;
}

async function migrateNotifications(pool, items) {
  for (const item of items) {
    await pool.execute(
      `INSERT INTO af_notifications
        (legacy_id, type, to_email, user_email, guardian_email, title, content, read_status, risk_event_legacy_id, raw_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CAST(? AS JSON), COALESCE(?, CURRENT_TIMESTAMP), COALESCE(?, CURRENT_TIMESTAMP))
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
        item.id || null,
        stringValue(item.type),
        normalizeEmail(item.to || item.toEmail) || null,
        normalizeEmail(item.userEmail) || null,
        normalizeEmail(item.guardianEmail) || null,
        stringValue(item.title),
        stringValue(item.content || item.message),
        item.read || item.readStatus ? 1 : 0,
        item.riskEventId || item.riskEventLegacyId || null,
        jsonValue(item),
        sqlDate(item.createdAt),
        sqlDate(item.updatedAt || item.createdAt)
      ]
    );
  }
  return items.length;
}

async function migrateKnowledge(pool, items) {
  for (const item of items) {
    await pool.execute(
      `INSERT INTO af_knowledge_items
        (legacy_id, title, description, content, category, source, icon, icon_color, tags_json, raw_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, CAST(? AS JSON), CAST(? AS JSON), COALESCE(?, CURRENT_TIMESTAMP), COALESCE(?, CURRENT_TIMESTAMP))
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
        item.id || null,
        stringValue(item.title) || `knowledge-${item.id || Date.now()}`,
        stringValue(item.description),
        stringValue(item.content),
        stringValue(item.category),
        stringValue(item.source),
        stringValue(item.icon),
        stringValue(item.iconColor),
        jsonValue(item.tags || []),
        jsonValue(item),
        sqlDate(item.createdAt),
        sqlDate(item.updatedAt || item.createdAt)
      ]
    );
  }
  return items.length;
}

async function main() {
  const pool = createPool({ multipleStatements: false });
  const config = getDbConfig();
  try {
    await runSchema(pool);
    const counts = {
      users: await migrateUsers(pool, readJson('users.json')),
      guardianLinks: await migrateGuardianLinks(pool, readJson('guardian-links.json')),
      reports: await migrateReports(pool, readJson('reports.json')),
      riskEvents: await migrateRiskEvents(pool, readJson('risk-events.json')),
      notifications: await migrateNotifications(pool, readJson('notifications.json')),
      knowledgeItems: await migrateKnowledge(pool, readJson('knowledge.json'))
    };
    console.log(`Migrated JSON data into MySQL ${config.host}:${config.port}/${config.database}`);
    console.table(counts);
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error('Migration failed:', error);
  process.exitCode = 1;
});
