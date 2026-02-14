import { Command } from "commander";
import { addCommand } from "./add.js";
import { listEntries } from "./list.js";

export function registerCommands(program: Command) {
  addCommand(program);
  listEntries(program);
}
