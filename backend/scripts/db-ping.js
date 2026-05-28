require('dotenv').config();

const { getDbConfig, pingDatabase } = require('../db/connection');

async function main() {
  const config = getDbConfig();
  const info = await pingDatabase();
  console.log(`MySQL connected: ${config.host}:${config.port}/${info.db}`);
  console.log(`Server version: ${info.version}`);
}

main().catch((error) => {
  console.error('MySQL connection failed:', error.message);
  process.exitCode = 1;
});
