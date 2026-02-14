import { Command } from "commander";
import { registerCommands } from "./commands/index.js";

const program = new Command();

program
  .name("brag")
  .description("A CLI tool to brag about your achievements")
  .version("1.0.0");

registerCommands(program);

program.parse();
