import chalk from "chalk";
import { getConfig } from "../lib/config.js";
import { Command } from "commander";
import db from "../db/database.js";
import Table from "cli-table3";
import { input, select } from "@inquirer/prompts";

type JiraIssue = {
  id: string;
  key: string;
  fields: {
    summary: string;
    resolved: string | null;
    resolutiondate: string | null;
  };
};

type JiraTicket = {
  ticket_key: string;
  summary: string;
  resolved_at: string | null;
  url: string;
};

export function jiraCommand(program: Command) {
  const jira = program.command("jira").description("Jira integration commands");

  jira
    .command("sync")
    .description("Fetch recent closed tickets from Jira")
    .action(async () => {
      await syncJira();
    });

  jira
    .command("list")
    .description("Show cached Jira tickets")
    .action(() => {
      listJiraTickets();
    });

  jira
    .command("import <ticket-id>")
    .description("Import a Jira ticket as an entry")
    .action(async (ticketId: string) => {
      await importJiraTicket(ticketId);
    });

  jira
    .command("import-all")
    .description("Import all cached Jira tickets one by one")
    .action(async () => {
      await importAllJiraTickets();
    });
}

async function syncJira() {
  console.log("Syncing Jira tickets...");

  const jql = `
    assignee WAS currentUser()
    AND status IN (Done, Closed, Resolved)
    AND resolved >= -30d
  `.trim();

  const jiraUrl = getConfig("jira.url");
  const jiraToken = getConfig("jira.token");
  const email = getConfig("email");

  const response = await fetch(`${jiraUrl}/rest/api/3/search/jql`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${email}:${jiraToken}`).toString("base64")}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      jql,
      maxResults: 100,
      fields: ["summary", "resolutiondate", "status"],
    }),
  });

  if (!response.ok) {
    throw new Error(`Jira error: ${response.status}`);
  }

  const data = await response.json();

  const issues = (data.issues ?? []).map((issue: JiraIssue) => ({
    key: issue.key,
    summary: issue.fields?.summary ?? "",
    completedAt: issue.fields?.resolutiondate ?? null,
    url: `${jiraUrl}/browse/${issue.key}`,
  }));

  const insert = db.prepare(`
  INSERT OR IGNORE INTO jira_tickets
  (ticket_key, summary, resolved_at, url)
  VALUES (?, ?, ?, ?)
`);

  const insertMany = db.transaction((issues) => {
    for (const issue of issues) {
      insert.run(issue.key, issue.summary, issue.completedAt, issue.url);
    }
  });

  insertMany(issues);

  console.log(chalk.green(`✓ Cached ${issues.length} Jira tickets`));
}

function listJiraTickets() {
  const tickets = db
    .prepare("SELECT * FROM jira_tickets ORDER BY resolved_at DESC")
    .all() as JiraTicket[];

  if (tickets.length === 0) {
    console.log(
      chalk.yellow("⚠ No cached Jira tickets. Run 'brag jira sync' first."),
    );
    return;
  }

  const table = new Table({
    head: ["Key", "Summary", "Resolved"],
    colWidths: [15, 60, 15],
  });

  tickets.forEach((ticket) => {
    table.push([
      chalk.cyan(ticket.ticket_key),
      ticket.summary.substring(0, 57) +
        (ticket.summary.length > 57 ? "..." : ""),
      ticket.resolved_at ? ticket.resolved_at.split("T")[0] : "-",
    ]);
  });

  console.log(table.toString());
  console.log(chalk.gray(`\nTotal: ${tickets.length} cached tickets`));
}

async function importJiraTicket(ticketId: string) {
  // Get ticket from cache
  const ticket = db
    .prepare("SELECT * FROM jira_tickets WHERE ticket_key = ?")
    .get(ticketId) as JiraTicket | undefined;

  if (!ticket) {
    console.error(chalk.red(`✗ Error: Ticket ${ticketId} not found in cache`));
    console.log(chalk.gray("Run 'brag jira sync' first"));
    return;
  }

  const existing = db
    .prepare("SELECT id FROM entries WHERE source_id = ?")
    .get(ticketId);

  if (existing) {
    console.log(chalk.yellow(`⚠ Ticket ${ticketId} already imported`));
    return;
  }

  const text = await input({
    message: "Entry text:",
    default: ticket.summary,
  });

  // Let user select category
  const categories = db
    .prepare("SELECT id, name FROM categories ORDER BY name")
    .all() as Array<{ id: number; name: string }>;

  let categoryId: number | null = null;

  if (categories.length > 0) {
    const wantsCategory = await select({
      message: "Add a category?",
      choices: [
        { name: "Skip", value: null },
        ...categories.map((cat) => ({
          name: cat.name,
          value: cat.id,
        })),
      ],
    });
    categoryId = wantsCategory;
  }

  const impact = await select({
    message: "Impact level:",
    choices: [
      { name: "Skip", value: null },
      { name: "Low", value: "low" },
      { name: "Medium", value: "medium" },
      { name: "High", value: "high" },
    ],
  });

  const stmt = db.prepare(`
    INSERT INTO entries (text, date, created_at, category_id, impact, source_id, source_url)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    text,
    ticket.resolved_at
      ? ticket.resolved_at.split("T")[0]
      : new Date().toISOString().split("T")[0],
    new Date().toISOString(),
    categoryId,
    impact,
    ticket.ticket_key,
    ticket.url,
  );

  db.prepare("DELETE FROM jira_tickets WHERE ticket_key = ?").run(ticketId);

  console.log(chalk.green(`✓ Imported ${ticketId} as entry`));
}

async function importAllJiraTickets() {
  const tickets = db
    .prepare("SELECT * FROM jira_tickets ORDER BY resolved_at DESC")
    .all() as JiraTicket[];

  if (tickets.length === 0) {
    console.log(
      chalk.yellow("⚠ No cached Jira tickets. Run 'brag jira sync' first."),
    );
    return;
  }

  console.log(chalk.blue(`Found ${tickets.length} tickets to import\n`));

  for (const ticket of tickets) {
    // Check if already imported (in case list is stale)
    const existing = db
      .prepare("SELECT id FROM entries WHERE source_id = ?")
      .get(ticket.ticket_key);

    if (existing) {
      console.log(
        chalk.gray(`Skipping ${ticket.ticket_key} (already imported)`),
      );
      continue;
    }

    console.log(chalk.cyan(`\n[${ticket.ticket_key}] ${ticket.summary}`));

    const action = await select({
      message: "What do you want to do?",
      choices: [
        { name: "Import this ticket", value: "import" },
        { name: "Skip this ticket", value: "skip" },
        { name: "Quit (stop importing)", value: "quit" },
      ],
    });

    if (action === "quit") {
      console.log(chalk.yellow("\nStopped importing"));
      return;
    }

    if (action === "skip") {
      console.log(chalk.gray("Skipped\n"));
      continue;
    }

    await importJiraTicket(ticket.ticket_key);
  }

  console.log(chalk.green("\n✓ Finished importing all tickets"));
}
