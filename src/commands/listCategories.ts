import { Command } from "commander";
import db from "../db/database.js";
import chalk from "chalk";

export function listCategories(program: Command) {
  program
    .command("list-categories")
    .description("List categories")
    .action(() => {
      listCat();
    });
}

function listCat() {
  const categories = db.prepare("SELECT name FROM categories").all() as Array<{
    name: string;
  }>;

  if (categories.length === 0) {
    console.log(chalk.yellow("⚠ No categories found, add one first"));
    return;
  }

  console.log(chalk.blue("\nCategories:"));
  categories.forEach((cat) => {
    console.log(`  • ${cat.name}`);
  });

  console.log(chalk.gray(`\nTotal: ${categories.length} categories\n`));
}
