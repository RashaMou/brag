import { Command } from "commander";
import db from "../db/database.js";
import chalk from "chalk";
import { select, confirm } from "@inquirer/prompts";

interface Category {
  id: number;
  name: string;
}

export function deleteCategory(program: Command) {
  program
    .command("delete-category")
    .description("delete a category")
    .action(async () => {
      await deleteCat();
    });
}

async function deleteCat() {
  const categories = db
    .prepare("SELECT id, name FROM categories")
    .all() as Category[];

  if (categories.length === 0) {
    console.log(chalk.yellow("⚠ No categories found, add one first"));
    return;
  }

  const category = await select({
    message: "Select a category to delete:",
    choices: categories.map((cat: Category) => ({
      name: cat.name,
      value: cat,
    })),
  });

  const inUse = db
    .prepare("SELECT COUNT(*) as count FROM entries WHERE category_id = ?")
    .pluck()
    .get(category.id) as number;

  if (inUse > 0) {
    console.error(
      chalk.red(
        `✗ Error: Cannot delete '${category.name}' - it's used by ${inUse} ${inUse === 1 ? "entry" : "entries"}`,
      ),
    );
    return;
  }

  const confirmed = await confirm({
    message: "Are you sure you want to delete this category?",
  });

  if (!confirmed) {
    console.log(chalk.yellow("Cancelled"));
    return;
  }

  const result = db
    .prepare("DELETE FROM categories WHERE id = ?")
    .run(category.id);

  if (result.changes === 0) {
    console.error(chalk.red("✗ Error: Update failed"));
  } else {
    console.log(chalk.green(`✓ Category ${category.name} deleted`));
  }
}
