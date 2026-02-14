import Database from "better-sqlite3";
import { readFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import os from "os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(os.homedir(), ".config", "brag", "brag.db");

const dbDir = dirname(dbPath);
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

const schemaPath = join(__dirname, "schema.sql");
const schema = readFileSync(schemaPath, "utf-8");
db.exec(schema);

export default db;
