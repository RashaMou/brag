import chalk from "chalk";
import db from "../db/database.js";

export function getConfig(key: string): string | undefined {
  const result = db
    .prepare("SELECT value FROM config WHERE key = ?")
    .pluck()
    .get(key) as string | undefined;

  if (!result) {
    console.log(chalk.yellow(`⚠ Config '${key}' not found`));
    return;
  }

  return result;
}
