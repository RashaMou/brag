import { Command } from "commander";
import { input, confirm, select } from "@inquirer/prompts";
import { existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import os from "os";
import db from "../db/database.js";
import chalk from "chalk";

export function initCommand(program: Command) {
  program
    .command("init")
    .description("Initialize brag configuration")
    .action(async () => {
      await init();
    });
}

async function init() {
  console.log(chalk.blue("\n👋 Welcome to Brag!\n"));
  console.log("A CLI tool to track your work accomplishments.\n");

  const dbPath = join(os.homedir(), ".config", "brag", "brag.db");

  // Check if already initialized
  if (existsSync(dbPath)) {
    console.log(chalk.yellow("⚠ Brag is already initialized at:"));
    console.log(chalk.gray(dbPath));

    const continueAnyway = await confirm({
      message: "Do you want to reconfigure?",
      default: false,
    });

    if (!continueAnyway) {
      console.log(chalk.gray("\nCancelled. Your existing setup is unchanged."));
      return;
    }
  }

  // Create directory if needed
  const dbDir = dirname(dbPath);
  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true });
    console.log(chalk.green(`✓ Created config directory: ${dbDir}`));
  }

  // Database is auto-initialized by database.ts when imported
  console.log(chalk.green(`✓ Database initialized`));

  // Check categories
  const categoryCount = db
    .prepare("SELECT COUNT(*) as count FROM categories")
    .pluck()
    .get() as number;

  console.log(chalk.green(`✓ Loaded ${categoryCount} default categories`));

  // Optional Jira setup
  console.log(chalk.blue("\n📋 Jira Integration (optional)\n"));

  const setupJira = await confirm({
    message: "Do you want to configure Jira integration?",
    default: false,
  });

  if (setupJira) {
    const jiraUrl = await input({
      message: "Jira URL (e.g., https://company.atlassian.net):",
      validate: (value) => {
        if (!value.startsWith("http")) {
          return "URL must start with http:// or https://";
        }
        return true;
      },
    });

    const jiraEmail = await input({
      message: "Jira email:",
      validate: (value) => {
        if (!value.includes("@")) {
          return "Please enter a valid email";
        }
        return true;
      },
    });

    console.log(chalk.gray("\nTo generate a Jira API token:"));
    console.log(
      chalk.gray(
        "1. Go to https://id.atlassian.com/manage-profile/security/api-tokens",
      ),
    );
    console.log(chalk.gray("2. Click 'Create API token'"));
    console.log(chalk.gray("3. Copy the token\n"));

    const jiraToken = await input({
      message: "Jira API token:",
    });

    // Save to config
    db.prepare("INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)").run(
      "jira.url",
      jiraUrl,
    );
    db.prepare("INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)").run(
      "jira.email",
      jiraEmail,
    );
    db.prepare("INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)").run(
      "jira.token",
      jiraToken,
    );

    console.log(chalk.green("\n✓ Jira configuration saved"));
  }

  // Success message
  console.log(chalk.green("\n✅ Setup complete!\n"));
  console.log(chalk.cyan("Next steps:"));
  console.log(
    chalk.white("  • brag add 'your first entry'") +
      chalk.gray(" - Add an accomplishment"),
  );
  console.log(
    chalk.white("  • brag list") + chalk.gray(" - View your entries"),
  );
  console.log(
    chalk.white("  • brag category list") +
      chalk.gray(" - See available categories"),
  );

  if (setupJira) {
    console.log(
      chalk.white("  • brag jira sync") + chalk.gray(" - Fetch Jira tickets"),
    );
  }

  console.log(
    chalk.white("  • brag --help") + chalk.gray(" - See all commands\n"),
  );

  // Optional: Add first entry
  const addFirstEntry = await confirm({
    message: "Would you like to add your first entry now?",
    default: true,
  });

  if (addFirstEntry) {
    const text = await input({
      message: "What did you accomplish?",
    });

    const categories = db
      .prepare("SELECT id, name FROM categories ORDER BY name")
      .all() as Array<{ id: number; name: string }>;

    const categoryId = await select({
      message: "Select a category:",
      choices: [
        { name: "Skip", value: null },
        ...categories.map((cat) => ({
          name: cat.name,
          value: cat.id,
        })),
      ],
    });

    db.prepare(
      `
      INSERT INTO entries (text, date, created_at, category_id)
      VALUES (?, ?, ?, ?)
    `,
    ).run(
      text,
      new Date().toISOString().split("T")[0],
      new Date().toISOString(),
      categoryId,
    );

    console.log(chalk.green("\n✓ First entry added! 🎉\n"));
    console.log(chalk.gray("Run 'brag list' to see it.\n"));
  } else {
    console.log(chalk.gray("\nHappy bragging! 🚀\n"));
  }
}
