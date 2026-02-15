# Brag

A personal CLI tool to track work accomplishments for performance reviews and
self-reflection.

## What is this?

I built this for myself as a support engineer to track work I often forget:

- Customer issues I've resolved
- Documentation I've written
- Investigations and troubleshooting
- General work accomplishments

It integrates with Jira to pull closed tickets and lets me manually log other
work. At review time, I can export everything to show what I've accomplished.

**Note:** This is built specifically for my workflow and uses Jira. Feel free to
fork and adapt it for Linear, GitHub Issues, or whatever you use.

## Features

- ✅ Track accomplishments with categories and impact levels
- 📋 Jira integration - sync and import closed tickets
- 📊 Stats and reporting (daily, weekly, monthly, yearly)
- 🔍 Filter and search entries
- 💾 Local SQLite database (your data stays on your machine)

## Installation

```bash
git clone https://github.com/yourusername/brag
cd brag
npm install
npm run build
npm link  # Makes 'brag' available globally
```

Or create a symlink:

```bash
ln -s /path/to/brag/bin/brag.js ~/bin/brag
```

## Setup

```bash
brag init
```

This will:

1. Create the database at `~/.config/brag/brag.db`
2. Set up default categories
3. Optionally configure Jira integration (URL, email, API token)

## Usage

### Basic Commands

**Add an entry:**

```bash
brag add "Fixed authentication timeout for enterprise customers"
# Interactive prompts for category, impact, details, URL
```

**List entries:**

```bash
brag list           # Last 7 days (default)
brag list --week    # This week
brag list --month   # This month
brag list --all     # Everything
```

**View stats:**

```bash
brag stats          # All time
brag stats --week   # This week
brag stats --month  # This month
brag stats --year   # This year
```

**Edit/Delete:**

```bash
brag edit 5
brag delete 10
```

### Categories

```bash
brag category list
brag category add performance
brag category rename
brag category delete
```

### Jira Integration

**Sync closed tickets:**

```bash
brag jira sync
```

**View cached tickets:**

```bash
brag jira list
```

**Import a ticket:**

```bash
brag jira import PROJ-123
# Prompts to edit title, select category, add impact
```

**Import all tickets:**

```bash
brag jira import-all
# Goes through each ticket with Import/Skip/Quit options
```

### Configuration

```bash
brag config list
brag config set jira.url https://company.atlassian.net
brag config set jira.email you@company.com
brag config set jira.token your-api-token
brag config get jira.url
```

## Database

Everything is stored locally in `~/.config/brag/brag.db`. Your data never leaves your machine.

**To back up:**

```bash
cp ~/.config/brag/brag.db ~/backups/
```

**To reset:**

```bash
rm ~/.config/brag/brag.db
brag init
```

## Customization

This is built for my specific needs. To adapt it:

- **Different ticket system:** Modify `src/commands/jira.ts` or create a new
  integration
- **Different categories:** Edit `src/db/schema.sql` seed data
- **Add fields:** Update the database schema and relevant commands
- **Change date filters:** Modify the SQL in `src/commands/list.ts`

## Tech Stack

- TypeScript
- Commander.js (CLI framework)
- better-sqlite3 (database)
- Inquirer (interactive prompts)
- Chalk (terminal colors)

## License

MIT - do whatever you want with it
