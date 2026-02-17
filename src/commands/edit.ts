import { Command } from "commander";
import { select, input } from "@inquirer/prompts";
import db from "../db/database.js";
import chalk from "chalk";
import { printField } from "../lib/printFields.js";

interface EditOptions {
  name?: string;
  category?: string;
  sourceid?: string;
  sourceurl?: string;
  impact?: string;
  details?: string;
}

interface Entry {
  id: number;
  text: string;
  date: string;
  category_id: number | null;
  impact: string | null;
  source_id: string | null;
  source_url: string | null;
  details: string | null;
}

export function editEntry(program: Command) {
  program
    .command("edit <id>")
    .description("Edit entry by id")
    .option("-n, --name <value>", "edit text")
    .option("-m, --impact <level>", "edit impact level (low/medium/high)")
    .option("-c, --category <value>", "edit category")
    .option("-i, --sourceid <value>", "edit source id")
    .option("-u, --sourceurl <value>", "edit source url")
    .option("-d, --details <value>", "edit details")
    .action(async (id: string, options: EditOptions) => {
      await edit(id, options);
    });
}

async function edit(id: string, options: EditOptions) {
  // Check if any options were passed
  const hasOptions = Object.values(options).some((val) => val !== undefined);

  if (!hasOptions) {
    // Interactive mode - fetch current entry first
    const entry = db.prepare("SELECT * FROM entries WHERE id = ?").get(id) as
      | Entry
      | undefined;

    if (!entry) {
      console.error(chalk.red(`✗ Error: Entry with id ${id} not found`));
      return;
    }

    // Get category name if exists
    let currentCategoryName = null;
    if (entry.category_id) {
      const cat = db
        .prepare("SELECT name FROM categories WHERE id = ?")
        .get(entry.category_id) as { name: string } | undefined;
      currentCategoryName = cat?.name;
    }

    printField(`Entry #${entry.id} (${entry.date})`, undefined, {
      header: true,
    });
    printField("Text", entry.text, { fieldColor: chalk.gray });
    printField("Category", currentCategoryName || "", {
      fieldColor: chalk.gray,
    });
    printField("Impact", entry.impact || "", { fieldColor: chalk.gray });
    printField("Details", entry.details || "", { fieldColor: chalk.gray });
    printField("Source ID", entry.source_id || "", { fieldColor: chalk.gray });
    printField("Source URL", entry.source_url || "", {
      fieldColor: chalk.gray,
    });
    console.log();

    // Ask what to edit
    const fieldToEdit = await select({
      message: "What would you like to edit?",
      choices: [
        { name: "Text", value: "text" },
        { name: "Category", value: "category" },
        { name: "Impact", value: "impact" },
        { name: "Details", value: "details" },
        { name: "Source ID", value: "source_id" },
        { name: "Source URL", value: "source_url" },
        { name: "Cancel", value: "cancel" },
      ],
    });

    if (fieldToEdit === "cancel") {
      console.log(chalk.yellow("Cancelled"));
      return;
    }

    const updates: string[] = [];
    const values: any[] = [];

    switch (fieldToEdit) {
      case "text":
        const newText = await input({
          message: "Enter new text:",
          default: entry.text,
        });
        updates.push("text = ?");
        values.push(newText);
        break;

      case "category":
        const categories = db
          .prepare("SELECT id, name FROM categories ORDER BY name")
          .all() as Array<{ id: number; name: string }>;

        const newCategoryId = await select({
          message: "Select new category:",
          choices: [
            { name: "None", value: null },
            ...categories.map((cat) => ({
              name: cat.name,
              value: cat.id,
            })),
          ],
          default: entry.category_id,
        });
        updates.push("category_id = ?");
        values.push(newCategoryId);
        break;

      case "impact":
        const newImpact = await select({
          message: "Select impact level:",
          choices: [
            { name: "None", value: null },
            { name: "Low", value: "low" },
            { name: "Medium", value: "medium" },
            { name: "High", value: "high" },
          ],
          default: entry.impact,
        });
        updates.push("impact = ?");
        values.push(newImpact);
        break;

      case "details":
        const newDetails = await input({
          message: "Enter new details:",
          default: entry.details || "",
        });
        updates.push("details = ?");
        values.push(newDetails || null);
        break;

      case "source_id":
        const newSourceId = await input({
          message: "Enter new source ID:",
          default: entry.source_id || "",
        });
        updates.push("source_id = ?");
        values.push(newSourceId || null);
        break;

      case "source_url":
        const newSourceUrl = await input({
          message: "Enter new source URL:",
          default: entry.source_url || "",
        });
        updates.push("source_url = ?");
        values.push(newSourceUrl || null);
        break;
    }

    const query = `UPDATE entries SET ${updates.join(", ")} WHERE id = ?`;
    values.push(id);

    const result = db.prepare(query).run(...values);

    if (result.changes === 0) {
      console.error(chalk.red(`✗ Error: Update failed`));
    } else {
      console.log(chalk.green(`✓ Entry ${id} updated`));
    }
  } else {
    // Flag-based mode
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

    if (options.sourceid) {
      updates.push("source_id = ?");
      values.push(options.sourceid);
    }

    if (options.sourceurl) {
      updates.push("source_url = ?");
      values.push(options.sourceurl);
    }

    if (options.details) {
      updates.push("details = ?");
      values.push(options.details);
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
}
