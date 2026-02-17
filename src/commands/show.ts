import { Command } from "commander";
import db from "../db/database.js";
import chalk from "chalk";
import { printField } from "../lib/printFields.js";

type EntryRow = {
  id: number;
  date: string;
  text: string;
  category: string | null;
  impact: string | null;
  details: string | null;
  source_id: string | null;
  source_url: string | null;
};

export function showEntry(program: Command) {
  program
    .command("show <id>")
    .description("Show a single entry")
    .action((id: string) => {
      showSingleEntry(parseInt(id, 10));
    });
}

export function showSingleEntry(id: number) {
  const stmt = db.prepare<[number], EntryRow>(
    `
      SELECT 
        e.id, 
        e.date, 
        e.text, 
        c.name as category,
        e.impact,
        e.details,
        e.source_id,
        e.source_url
      FROM entries e
      LEFT JOIN categories c ON e.category_id = c.id
      WHERE e.id = ?
    `,
  );

  const entry = stmt.get(id);

  if (!entry) {
    console.log(chalk.yellow("Entry not found"));
    return;
  }

  printField(`Entry #${entry.id} (${entry.date})`, undefined, {
    header: true,
  });
  printField("Text", entry.text);
  printField("Category", entry.category || "");
  printField("Impact", entry.impact || "");
  printField("Details", entry.details || "");
  printField("Source ID", entry.source_id || "");
  printField("Source URL", entry.source_url || "");
}
