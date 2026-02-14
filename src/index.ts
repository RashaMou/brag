import { Command } from "commander";

const program = new Command();

program
  .name("brag")
  .description("A CLI tool to brag about your achievements")
  .version("1.0.0");

program
  .command("list")
  .description("List all items")
  .action(() => {
    console.log("Listing items...");
  });

program.parse();
