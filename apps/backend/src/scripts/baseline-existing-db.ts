import AppDataSource from '../data-source';

const INITIAL_MIGRATION = {
  timestamp: 1775552661411,
  name: 'InitialSchema1775552661411',
};

async function baselineExistingDatabase() {
  await AppDataSource.initialize();

  const tableCheck = await AppDataSource.query(
    `SELECT COUNT(*) AS count
     FROM information_schema.tables
     WHERE table_schema = DATABASE()
       AND table_name IN ('users', 'posts', 'works')`,
  );

  const existingTables = Number(tableCheck[0]?.count ?? 0);
  if (existingTables === 0) {
    throw new Error(
      'Current database looks empty. Do not run baseline on a fresh database; use migration:run instead.',
    );
  }

  await AppDataSource.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id int NOT NULL AUTO_INCREMENT,
      timestamp bigint NOT NULL,
      name varchar(255) NOT NULL,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB
  `);

  const rows = await AppDataSource.query(
    'SELECT id FROM migrations WHERE timestamp = ? AND name = ? LIMIT 1',
    [INITIAL_MIGRATION.timestamp, INITIAL_MIGRATION.name],
  );

  if (rows.length === 0) {
    await AppDataSource.query(
      'INSERT INTO migrations (timestamp, name) VALUES (?, ?)',
      [INITIAL_MIGRATION.timestamp, INITIAL_MIGRATION.name],
    );
    console.log(
      `Baselined existing database with migration ${INITIAL_MIGRATION.name}.`,
    );
  } else {
    console.log(
      `Migration ${INITIAL_MIGRATION.name} is already marked as applied.`,
    );
  }

  await AppDataSource.destroy();
}

baselineExistingDatabase().catch(async (error) => {
  console.error(error instanceof Error ? error.message : error);
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
  process.exit(1);
});
