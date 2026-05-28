require('dotenv').config();

const { createPool, getDbConfig } = require('../db/connection');

function quoteIdentifier(value) {
  return `\`${String(value).replace(/`/g, '``')}\``;
}

async function main() {
  const config = getDbConfig();
  const pool = createPool({ database: null });
  try {
    await pool.query(
      `CREATE DATABASE IF NOT EXISTS ${quoteIdentifier(config.database)}
       CHARACTER SET utf8mb4
       COLLATE utf8mb4_unicode_ci`
    );
    console.log(`Database ready: ${config.host}:${config.port}/${config.database}`);
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error('Create database failed:', error.message);
  process.exitCode = 1;
});
