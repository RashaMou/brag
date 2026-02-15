import { Command, Option } from "commander";
import db from "../db/database.js";
import chalk from "chalk";
import { input, select } from "@inquirer/prompts";

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

async function add(text: string, options: AddOptions) {
  const date = options.date || new Date().toISOString().split("T")[0];

  // Interactive category selection if not provided
  let categoryId: number | null = null;
  if (!options.category) {
    const categories = db
      .prepare("SELECT id, name FROM categories ORDER BY name")
      .all() as Array<{ id: number; name: string }>;

    if (categories.length > 0) {
      categoryId = await select({
        message: "Select a category:",
        choices: [
          { name: "Skip", value: null },
          ...categories.map((cat) => ({
            name: cat.name,
            value: cat.id,
          })),
        ],
      });
    }
  } else {
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

  // Interactive impact selection if not provided
  let impact: "low" | "medium" | "high" | null = options.impact || null;

  if (!impact) {
    impact = await select({
      message: "Impact level:",
      choices: [
        { name: "Skip", value: null },
        { name: "Low", value: "low" },
        { name: "Medium", value: "medium" },
        { name: "High", value: "high" },
      ],
    });
  }

  // Interactive details
  const details = await input({
    message: "Additional details (optional):",
  });

  // Interactive source URL if not provided
  let sourceUrl = options.sourceurl || null;
  if (!sourceUrl) {
    const urlInput = await input({
      message: "Source URL (optional):",
    });
    sourceUrl = urlInput || null;
  }

  const stmt = db.prepare(`
    INSERT INTO entries (text, date, created_at, category_id, impact, details, source_url)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    text,
    date,
    new Date().toISOString(),
    categoryId,
    impact || null,
    details || null,
    sourceUrl,
  );

  console.log(chalk.green("✓ Entry added"));
}
