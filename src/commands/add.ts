import { Command } from "commander";
import db from "../db/database.js";
import chalk from "chalk";

export function addCommand(program: Command) {
  program
    .command("add <text>")
    .description("Add a new entry")
    .option("-c, --category <name>", "category name")
    .option("-i, --impact <level>", "impact level (low/medium/high)")
    .option("-d, --date <date>", "date (defaults to today, format: YYYY-MM-DD)")
    .action((text: string, options) => {
      const date = options.date || new Date().toISOString().split("T")[0];

      let categoryId: number | null = null;

      if (options.category) {
        const result = db
          .prepare("SELECT id FROM categories WHERE name = ?")
          .pluck()
          .get(options.category) as number | undefined;

        if (result === undefined) {
          console.log(
            chalk.yellow(
              `⚠ Category '${options.category}' not found, skipping`,
            ),
          );
        } else {
          categoryId = result;
        }
      }

      const stmt = db.prepare(`
        INSERT INTO entries (text, date, created_at, category_id, impact, source)
        VALUES (?, ?, ?, ?, ?, 'manual')
      `);

      stmt.run(
        text,
        date,
        new Date().toISOString(),
        categoryId,
        options.impact || null,
      );
      console.log(chalk.green("✓ Entry added"));
    });
}
