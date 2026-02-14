import { Command } from "commander";
import db from "../db/database.js";
import Table from "cli-table3";
import chalk from "chalk";

interface ListOptions {
  all?: boolean;
  week?: boolean;
  month?: boolean;
}

export function listEntries(program: Command) {
  program
    .command("list")
    .description("List entries")
    .option("-a, --all", "show all entries")
    .option("-w, --week", "this week")
    .option("-m, --month", "this month")
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
          e.impact
        FROM entries e
        LEFT JOIN categories c ON e.category_id = c.id
      `;

  if (options.week) {
    query += " WHERE e.date >= DATE('now', '-7 days')";
  } else if (options.month) {
    query += " WHERE e.date >= DATE('now', 'start of month')";
  } else if (!options.all) {
    // Default: last 7 days
    query += " WHERE e.date >= DATE('now', '-7 days')";
  }

  query += " ORDER BY e.date DESC";

  const entries = db.prepare(query).all();

  if (entries.length === 0) {
    console.log(chalk.yellow("No entries found"));
    return;
  }

  const table = new Table({
    head: ["ID", "Date", "Text", "Category", "Impact"],
    colWidths: [5, 12, 50, 15, 10],
  });

  entries.forEach((entry: any) => {
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
