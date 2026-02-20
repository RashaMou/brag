import { Command } from "commander";
import { addCommand } from "./add.js";
import { listEntries } from "./list.js";
import { editEntry } from "./edit.js";
import { deleteEntry } from "./deleteEntry.js";
import { filterByCategory } from "./filter.js";
import { configCommand } from "./config.js";
import { jiraCommand } from "./jira.js";
import { categoryCommand } from "./category.js";
import { statsCommand } from "./stats.js";
import { initCommand } from "./init.js";
import { showEntry } from "./show.js";
import { cacheCommand } from "./cache.js";

export function registerCommands(program: Command) {
  addCommand(program);
  listEntries(program);
  editEntry(program);
  deleteEntry(program);
  filterByCategory(program);
  configCommand(program);
  jiraCommand(program);
  categoryCommand(program);
  statsCommand(program);
  initCommand(program);
  showEntry(program);
  cacheCommand(program);
}
