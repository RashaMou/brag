import { Command } from "commander";
import db from "../db/database.js";
import chalk from "chalk";
import { select, input } from "@inquirer/prompts";

interface Category {
  id: number;
  name: string;
}

export function editCategory(program: Command) {
  program
    .command("edit-category")
    .description("Edit a category")
    .action(async () => {
      await editCat();
    });
}

async function editCat() {
  const categories = db
    .prepare("SELECT id, name FROM categories")
    .all() as Category[];

  if (categories.length === 0) {
    console.log(chalk.yellow("⚠ No categories found, add one first"));
    return;
  }

  const categoryId = await select({
    message: "Select a category to edit:",
    choices: categories.map((cat: Category) => ({
      name: cat.name,
      value: cat.id,
    })),
  });

  const newName = await input({
    message: "Enter new category name:",
  });

  const result = db
    .prepare("UPDATE categories SET name = ? WHERE id = ?")
    .run(newName, categoryId);

  if (result.changes === 0) {
    console.error(chalk.red("✗ Error: Update failed"));
  } else {
    console.log(chalk.green(`✓ Category updated to '${newName}'`));
  }
}
