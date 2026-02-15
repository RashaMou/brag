import { Command, Option } from "commander";
import db from "../db/database.js";
import chalk from "chalk";

interface AddOptions {
  category?: string;
  date?: string;
  impact?: "low" | "medium" | "high";
  sourceurl?: string;
}

export function addCommand(program: Command) {
  program
    .command("add <text>")
    .description("Add a new entry")
    .option("-c, --category <name>", "category name")
    .option("-s, --sourceurl <url>", "source url")
    .option("-d, --date <date>", "date (defaults to today, format: YYYY-MM-DD)")
    .addOption(
      new Option("-i, --impact <level>", "impact level").choices([
        "low",
        "medium",
        "high",
      ]),
    )
    .action((text: string, options: AddOptions) => {
      add(text, options);
    });
}

function add(text: string, options: AddOptions) {
  const date = options.date || new Date().toISOString().split("T")[0];
  let categoryId: number | null = null;

  if (options.category) {
    const result = db
      .prepare("SELECT id FROM categories WHERE name = ?")
      .pluck()
      .get(options.category) as number | undefined;

    if (result === undefined) {
      console.log(
        chalk.yellow(`⚠ Category '${options.category}' not found, skipping`),
      );
    } else {
      categoryId = result;
    }
  }

  const stmt = db.prepare(`
    INSERT INTO entries (text, date, created_at, category_id, impact, source_url)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    text,
    date,
    new Date().toISOString(),
    categoryId,
    options.impact || null,
    options.sourceurl || null,
  );

  console.log(chalk.green("✓ Entry added"));
}
