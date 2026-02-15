import { Command } from "commander";
import db from "../db/database.js";
import chalk from "chalk";

interface StatsOptions {
  week?: boolean;
  month?: boolean;
  year?: boolean;
}

export function statsCommand(program: Command) {
  program
    .command("stats")
    .description("Show entry statistics")
    .option("-w, --week", "this week's stats")
    .option("-m, --month", "this month's stats")
    .option("-y, --year", "this year's stats")
    .action((options: StatsOptions) => {
      showStats(options);
    });
}

function showStats(options: StatsOptions) {
  let dateFilter = "";
  let period = "All Time";

  if (options.week) {
    dateFilter = "WHERE date >= DATE('now', '-7 days')";
    period = "This Week";
  } else if (options.month) {
    dateFilter = "WHERE date >= DATE('now', 'start of month')";
    period = "This Month";
  } else if (options.year) {
    dateFilter = "WHERE date >= DATE('now', 'start of year')";
    period = "This Year";
  }

  // Total entries
  const totalEntries = db
    .prepare(`SELECT COUNT(*) as count FROM entries ${dateFilter}`)
    .pluck()
    .get() as number;

  // Entries by category
  const byCategory = db
    .prepare(
      `
      SELECT c.name, COUNT(*) as count
      FROM entries e
      LEFT JOIN categories c ON e.category_id = c.id
      ${dateFilter}
      GROUP BY c.name
      ORDER BY count DESC
    `,
    )
    .all() as Array<{ name: string | null; count: number }>;

  // Entries by impact
  const byImpact = db
    .prepare(
      `
      SELECT impact, COUNT(*) as count
      FROM entries
      ${dateFilter}
      GROUP BY impact
      ORDER BY 
        CASE impact
          WHEN 'high' THEN 1
          WHEN 'medium' THEN 2
          WHEN 'low' THEN 3
          ELSE 4
        END
    `,
    )
    .all() as Array<{ impact: string | null; count: number }>;

  // Display
  console.log(chalk.blue(`\n📊 Stats - ${period}\n`));
  console.log(chalk.cyan("Total Entries:"), chalk.white(totalEntries));

  if (byCategory.length > 0) {
    console.log(chalk.cyan("\nBy Category:"));
    byCategory.forEach((cat) => {
      const name = cat.name || "Uncategorized";
      console.log(`  ${name.padEnd(25)} ${chalk.white(cat.count)}`);
    });
  }

  if (byImpact.length > 0) {
    console.log(chalk.cyan("\nBy Impact:"));
    byImpact.forEach((impact) => {
      const level = impact.impact || "None";

      const paddedLevel = level.padEnd(25);
      const displayLevel =
        level === "high"
          ? chalk.red(paddedLevel)
          : level === "medium"
            ? chalk.yellow(paddedLevel)
            : level === "low"
              ? chalk.green(paddedLevel)
              : chalk.gray(paddedLevel);

      console.log(`  ${displayLevel}${chalk.white(impact.count)}`);
    });
  }
  console.log();
}
