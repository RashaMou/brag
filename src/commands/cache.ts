import { Command } from "commander";
import { confirm } from "@inquirer/prompts";
import db from "../db/database.js";
import chalk from "chalk";
import { listJiraTickets } from "./jira.js";

export function cacheCommand(program: Command) {
  const cache = program.command("cache").description("Manage cache");

  cache
    .command("clear <key>")
    .description("Clear a specific cached ticket")
    .action((key: string) => {
      clearCacheByKey(key);
    });

  cache
    .command("clear-all")
    .description("Clear all cached tickets")
    .action(async () => {
      await clearAllCache();
    });

  cache
    .command("list")
    .description("List all cached tickets")
    .action(() => {
      listJiraTickets();
    });
}

function clearCacheByKey(key: string) {
  const result = db
    .prepare("DELETE FROM jira_tickets WHERE ticket_key = ?")
    .run(key);

  if (result.changes === 0) {
    console.error(chalk.red(`✗ Error: Ticket ${key} not found in cache`));
  } else {
    console.log(chalk.green(`✓ Removed ${key} from cache`));
  }
}

async function clearAllCache() {
  const count = db
    .prepare("SELECT COUNT(*) as count FROM jira_tickets")
    .pluck()
    .get() as number;

  if (count === 0) {
    console.log(chalk.yellow("⚠ Cache is already empty"));
    return;
  }

  const confirmed = await confirm({
    message: `Are you sure you want to clear all ${count} cached tickets?`,
    default: false,
  });

  if (!confirmed) {
    console.log(chalk.yellow("Cancelled"));
    return;
  }

  db.prepare("DELETE FROM jira_tickets").run();
  console.log(chalk.green(`✓ Cleared ${count} cached tickets`));
}
