import { Command } from "commander";
import db from "../db/database.js";
import chalk from "chalk";

export function configCommand(program: Command) {
  const config = program.command("config").description("Set config values");

  config
    .command("set <key> <value>")
    .description("Set a config value (e.g., jira.url, jira.email)")
    .action((key: string, value: string) => {
      setConfig(key, value);
    });

  config
    .command("get <key>")
    .description("Get a config value")
    .action((key: string) => {
      getConfig(key);
    });

  config
    .command("list")
    .description("List all config values")
    .action(() => {
      listConfig();
    });
}

function setConfig(key: string, value: string) {
  db.prepare("INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)").run(
    key,
    value,
  );
  console.log(chalk.green(`✓ Config '${key}' set to '${value}'`));
}

function getConfig(key: string) {
  const result = db
    .prepare("SELECT value FROM config WHERE key = ?")
    .pluck()
    .get(key) as string | undefined;
  if (result) {
    console.log(chalk.blue(key) + ": " + chalk.white(result));
  } else {
    console.log(chalk.yellow(`⚠ Config '${key}' not found`));
  }
}

function listConfig() {
  const configs = db.prepare("SELECT key, value FROM config").all() as Array<{
    key: string;
    value: string;
  }>;
  if (configs.length === 0) {
    console.log(chalk.yellow("⚠ No config values set"));
    return;
  }
  console.log(chalk.blue("\nConfiguration:"));
  console.log(chalk.gray("─".repeat(60)));

  configs.forEach((c) => {
    // Mask sensitive values (tokens, passwords)
    const displayValue =
      c.key.includes("token") || c.key.includes("password")
        ? "***" + c.value.slice(-4) // Show last 4 chars
        : c.value;

    console.log(
      `  ${chalk.cyan(c.key.padEnd(20))} ${chalk.white(displayValue)}`,
    );
  });

  console.log(chalk.gray("─".repeat(60)));
  console.log(chalk.gray(`\nTotal: ${configs.length} config values\n`));
}
