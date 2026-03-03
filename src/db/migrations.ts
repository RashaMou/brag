import Database from "better-sqlite3";

interface Migration {
  version: number;
  description: string;
  up: string;
}

const migrations: Migration[] = [
  {
    version: 1,
    description: "Add status column to jira_tickets",
    up: `ALTER TABLE jira_tickets ADD COLUMN status TEXT CHECK(status IN ('imported', 'skipped') OR status IS NULL)`,
  },
];

export function runMigrations(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      description TEXT NOT NULL,
      applied_at TEXT NOT NULL
    );
  `);

  const currentVersion = db
    .prepare("SELECT MAX(version) as version FROM schema_migrations")
    .pluck()
    .get() as number | null;

  const version = currentVersion || 0;

  const pending = migrations.filter((m) => m.version > version);

  if (pending.length === 0) {
    return;
  }

  console.log(`Running ${pending.length} migration(s)...`);

  pending.forEach((migration) => {
    console.log(
      `  Applying migration ${migration.version}: ${migration.description}`,
    );

    db.exec(migration.up);

    db.prepare(
      `
      INSERT INTO schema_migrations (version, description, applied_at)
      VALUES (?, ?, ?)
    `,
    ).run(migration.version, migration.description, new Date().toISOString());
  });

  console.log("Migrations complete!");
}
