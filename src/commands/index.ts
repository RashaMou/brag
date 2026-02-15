import { Command } from "commander";
import { addCommand } from "./add.js";
import { listEntries } from "./list.js";
import { editEntry } from "./edit.js";
import { editCategory } from "./editCategory.js";
import { listCategories } from "./listCategories.js";
import { deleteCategory } from "./deleteCategory.js";
import { deleteEntry } from "./deleteEntry.js";
import { filterByCategory } from "./filter.js";
import { configCommand } from "./config.js";
import { jiraCommand } from "./jira.js";

export function registerCommands(program: Command) {
  addCommand(program);
  listEntries(program);
  editEntry(program);
  editCategory(program);
  listCategories(program);
  deleteCategory(program);
  deleteEntry(program);
  filterByCategory(program);
  configCommand(program);
  jiraCommand(program);
}
