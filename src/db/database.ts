import Database from "better-sqlite3";
import { readFileSync } from "fs";
import { join } from "path";

const dbPath = join(process.env.HOME!, ".config/brag/brag.db");
const db = new Database(dbPath);

const schemaPath = join(__dirname, "schema.sql");
const schema = readFileSync(schemaPath, "utf-8");
db.exec(schema);

export default db;
