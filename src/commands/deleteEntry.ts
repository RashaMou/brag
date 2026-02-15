import { Command } from "commander";
import db from "../db/database.js";
import chalk from "chalk";
import { select, confirm } from "@inquirer/prompts";

interface Entry {
  id: number;
  text: string;
  date: string;
}

export function deleteEntry(program: Command) {
  program
    .command("delete [id]")
    .description("Delete an entry")
    .action(async (id?: string) => {
      await deleteEntryFn(id);
    });
}

async function deleteEntryFn(id?: string) {
  let entryId: number;
  let entryText: string;

  if (id) {
    // Direct deletion by ID
    const entry = db
      .prepare("SELECT id, text FROM entries WHERE id = ?")
      .get(id) as Entry | undefined;

    if (!entry) {
      console.error(chalk.red(`✗ Error: Entry with id ${id} not found`));
      return;
    }

    entryId = entry.id;
    entryText = entry.text;
  } else {
    // Interactive selection
    const entries = db
      .prepare("SELECT id, text, date FROM entries ORDER BY date DESC")
      .all() as Entry[];

    if (entries.length === 0) {
      console.log(chalk.yellow("⚠ No entries found"));
      return;
    }

    const entry = await select({
      message: "Select an entry to delete:",
      choices: entries.map((e) => ({
        name: `${e.date} - ${e.text.substring(0, 50)}${e.text.length > 50 ? "..." : ""}`,
        value: e,
      })),
    });

    entryId = entry.id;
    entryText = entry.text;
  }

  const confirmed = await confirm({
    message: `Are you sure you want to delete: "${entryText.substring(0, 50)}"?`,
  });

  if (!confirmed) {
    console.log(chalk.yellow("Cancelled"));
    return;
  }

  const result = db.prepare("DELETE FROM entries WHERE id = ?").run(entryId);

  if (result.changes === 0) {
    console.error(chalk.red("✗ Error: Delete failed"));
  } else {
    console.log(chalk.green(`✓ Entry deleted`));
  }
}
