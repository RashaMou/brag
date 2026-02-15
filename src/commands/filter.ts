import { Command } from "commander";
import db from "../db/database.js";
import chalk from "chalk";
import { select } from "@inquirer/prompts";
import Table from "cli-table3";

interface Category {
  id: number;
  name: string;
}

export function filterByCategory(program: Command) {
  program
    .command("filter")
    .description("filter by category")
    .action(async () => {
      await filterCat();
    });
}

async function filterCat() {
  const categories = db
    .prepare("SELECT id, name FROM categories")
    .all() as Category[];

  if (categories.length === 0) {
    console.log(chalk.yellow("⚠ No categories found, add one first"));
    return;
  }

  const categoryId = await select({
    message: "Select a category to filter by:",
    choices: categories.map((cat: Category) => ({
      name: cat.name,
      value: cat.id,
    })),
  });

  const entries = db
    .prepare(
      `SELECT 
      e.id,
      e.text,
      e.date,
      e.impact,
      c.name as category
    FROM entries e
    LEFT JOIN categories c ON e.category_id = c.id
    WHERE e.category_id = ?
    ORDER BY e.date DESC`,
    )
    .all(categoryId);

  if (entries.length === 0) {
    console.log(chalk.yellow("⚠ No entries found under this category"));
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
