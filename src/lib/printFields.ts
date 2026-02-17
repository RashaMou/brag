import chalk from "chalk";
import wrapAnsi from "wrap-ansi";

const MAX_WIDTH = 80;
const LABEL_WIDTH = 10;

export function printField(
  label: string,
  value?: string,
  options?: { header?: boolean; fieldColor?: (text: string) => string },
) {
  if (options?.header) {
    console.log();
    console.log(chalk.blue.bold(label));
    console.log(chalk.gray("─".repeat(MAX_WIDTH)));

    return;
  }

  const paddedLabel = label.padEnd(LABEL_WIDTH);
  const labelPart = `${paddedLabel}: `;

  const labelStyled = chalk.bold.cyan(labelPart);
  const safeValue = value || "None";

  const wrapWidth = MAX_WIDTH - labelPart.length;
  const wrapped = wrapAnsi(safeValue, wrapWidth);

  const lines = wrapped.split("\n");

  const colorFn = options?.fieldColor ?? chalk.white;

  console.log(labelStyled + colorFn(lines[0]));

  const indent = " ".repeat(labelPart.length);

  for (let i = 1; i < lines.length; i++) {
    console.log(indent + colorFn(lines[i]));
  }
}
