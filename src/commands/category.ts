// src/commands/category.ts
import { Command } from "commander";
import { select, input, confirm } from "@inquirer/prompts";
import db from "../db/database.js";
import chalk from "chalk";

type Category = {
  id: number;
  name: string;
};

export function categoryCommand(program: Command) {
  const category = program.command("category").description("Manage categories");

  category
    .command("add <name>")
    .description("Add a new category")
    .action((name: string) => {
      addCategory(name);
    });

  category
    .command("list")
    .description("List all categories")
    .action(() => {
      listCategories();
    });

  category
    .command("rename")
    .description("Rename a category")
    .action(async () => {
      await renameCategory();
    });

  category
    .command("delete")
    .description("Delete a category")
    .action(async () => {
      await deleteCategory();
    });
}

function addCategory(name: string) {
  const existing = db
    .prepare("SELECT id FROM categories WHERE name = ?")
    .get(name);

  if (existing) {
    console.error(chalk.red(`✗ Error: Category '${name}' already exists`));
    return;
  }

  const result = db
    .prepare("INSERT INTO categories (name) VALUES (?)")
    .run(name);

  if (result.changes === 0) {
    console.error(chalk.red("✗ Error: Failed to add category"));
  } else {
    console.log(chalk.green(`✓ Category '${name}' added`));
  }
}

function listCategories() {
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

async function renameCategory() {
  const categories = db
    .prepare("SELECT id, name FROM categories")
    .all() as Category[];

  if (categories.length === 0) {
    console.log(chalk.yellow("⚠ No categories found, add one first"));
    return;
  }

  const categoryId = await select({
    message: "Select a category to rename:",
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

async function deleteCategory() {
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
