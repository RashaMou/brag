import { Command } from "commander";
import db from "../db/database.js";
import Table from "cli-table3";
import chalk from "chalk";
import { printField } from "../lib/printFields.js";
import { showSingleEntry } from "./show.js";

interface ListOptions {
  all?: boolean;
  week?: boolean;
  month?: boolean;
  verbose?: boolean;
  id?: number;
}

export function listEntries(program: Command) {
  program
    .command("list")
    .description("List entries")
    .option("--id <id>", "show specific entry by id")
    .option("-a, --all", "show all entries")
    .option("-w, --week", "this week")
    .option("-m, --month", "this month")
    .option("-v, --verbose", "show full entry details")
    .action((options: ListOptions) => {
      list(options);
    });
}

function list(options: ListOptions) {
  let query = `
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
  `;

  if (options.id) {
    showSingleEntry(options.id);
    return;
  }

  if (options.week) {
    query += " WHERE e.date >= DATE('now', '-7 days')";
  } else if (options.month) {
    query += " WHERE e.date >= DATE('now', 'start of month')";
  } else if (!options.all) {
    // Default: last 7 days
    query += " WHERE e.date >= DATE('now', '-7 days')";
  }

  query += " ORDER BY e.date DESC";

  const entries = db.prepare(query).all() as Array<{
    id: number;
    date: string;
    text: string;
    category: string | null;
    impact: string | null;
    details: string | null;
    source_id: string | null;
    source_url: string | null;
  }>;

  if (entries.length === 0) {
    console.log(chalk.yellow("No entries found"));
    return;
  }

  if (options.verbose) {
    // Verbose mode - show full details
    entries.forEach((entry, index) => {
      if (index > 0) console.log();

      printField(`Entry #${entry.id} (${entry.date})`, undefined, {
        header: true,
      });
      printField("Text", entry.text);
      printField("Category", entry.category || "");
      printField("Impact", entry.impact || "");
      printField("Details", entry.details || "");
      printField("Source ID", entry.source_id || "");
      printField("Source URL", entry.source_url || "");
    });

    console.log(chalk.gray(`\nTotal: ${entries.length} entries`));
  } else {
    // Table mode - compact view
    const table = new Table({
      head: ["ID", "Date", "Text", "Category", "Impact"],
      colWidths: [5, 12, 50, 15, 10],
    });

    entries.forEach((entry) => {
      table.push([
        entry.id,
        entry.date,
        entry.text.substring(0, 47) + (entry.text.length > 47 ? "..." : ""),
        entry.category || "-",
        entry.impact || "-",
      ]);
    });

    console.log(table.toString());
    console.log(chalk.gray(`\nTotal: ${entries.length} entries`));
  }
}
