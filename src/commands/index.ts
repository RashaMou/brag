import { Command } from "commander";
import { addCommand } from "./add.js";
import { listEntries } from "./list.js";
import { editEntry } from "./edit.js";

export function registerCommands(program: Command) {
  addCommand(program);
  listEntries(program);
  editEntry(program);
}
