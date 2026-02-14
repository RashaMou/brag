import { Command } from "commander";
import db from "../db/database.js";
import chalk from "chalk";

interface EditOptions {
  name?: string;
  category?: string;
  source?: string;
  sourceid?: string;
  sourceurl?: string;
  impact?: string;
}

export function editEntry(program: Command) {
  program
    .command("edit <id>")
    .description("Edit entry by id")
    .option("-n, --name <value>", "edit name")
    .option("-m, --impact <level>", "edit impact level (low/medium/high)")
    .option("-c, --category <value>", "edit category")
    .option("-s, --source <value>", "edit source")
    .option("-i, --sourceid <value>", "edit source id")
    .option("-u, --sourceurl <value>", "edit source url")
    .action((id: string, options: EditOptions) => {
      edit(id, options);
    });
}

function edit(id: string, options: EditOptions) {
  const updates: string[] = [];
  const values: any[] = [];

  if (options.category) {
    const result = db
      .prepare("SELECT id FROM categories WHERE name = ?")
      .pluck()
      .get(options.category) as number | undefined;

    if (result === undefined) {
      console.error(
        chalk.red(`✗ Error: Category '${options.category}' not found`),
      );
      return;
    }

    updates.push("category_id = ?");
    values.push(result);
  }

  if (options.name) {
    updates.push("text = ?");
    values.push(options.name);
  }

  if (options.impact) {
    updates.push("impact = ?");
    values.push(options.impact);
  }

  if (options.source) {
    updates.push("source = ?");
    values.push(options.source);
  }

  if (options.sourceid) {
    updates.push("source_id = ?");
    values.push(options.sourceid);
  }

  if (options.sourceurl) {
    updates.push("source_url = ?");
    values.push(options.sourceurl);
  }

  const query = `UPDATE entries SET ${updates.join(", ")} WHERE id = ?`;
  values.push(id);

  const result = db.prepare(query).run(...values);

  if (result.changes === 0) {
    console.error(chalk.red(`✗ Error: Entry with id ${id} not found`));
  } else {
    console.log(chalk.green(`✓ Entry ${id} updated`));
  }
}
