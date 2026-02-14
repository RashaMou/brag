https://github.com/lirantal/nodejs-cli-apps-best-practices

# Core entry management

brag add <text> # Quick add accomplishment
brag add --category <cat> <text> # Add with category
brag add --impact <level> <text> # Add with impact level (low/medium/high)
brag add --type <type> <text> # Add with type (investigation/escalation/documentation/etc)

brag list # Show recent entries (last 7 days)
brag list --all # Show all entries
brag list --week # This week
brag list --month # This month
brag list --date <YYYY-MM-DD> # Specific date

brag show <id> # Show full details of entry

brag edit <id> # Edit entry (opens $EDITOR)
brag delete <id> # Delete entry

brag search <keyword> # Search all entries
brag filter --category <cat> # Filter by category
brag filter --impact <level> # Filter by impact level
brag filter --type <type> # Filter by type

# Stats and reporting

brag stats # Overall stats
brag stats --week # This week's stats
brag stats --month # This month's stats
brag stats --year # This year's stats

brag export --format md # Export to markdown
brag export --format pdf # Export to PDF
brag export --start <date> --end <date> # Export date range

brag review # Interactive review (opens editor with untagged entries)

# Categories

brag categories # List all categories
brag category add <name> # Add new category
brag category rename <old> <new> # Rename category

# GitHub integration

brag github sync # Fetch recent merged PRs, cache locally
brag github list # Show cached PRs
brag github import <pr-id> # Import specific PR as entry

# Jira integration

brag jira sync # Fetch recent tickets, cache locally
brag jira list # Show cached tickets
brag jira import <ticket-id> # Import specific ticket as entry
brag jira auto-import # Batch create entries for closed tickets
brag jira auto-import --dry-run # Show what would be imported

# Docs tracking

brag docs add <url> <description> # Log a docs contribution with link
brag docs sync # Fetch doc PRs if using GitHub for docs

# Cache management

brag cache clear # Clear all cached data
brag cache clear --github # Clear only GitHub cache
brag cache clear --jira # Clear only Jira cache
brag cache stats # Show cache size/age

# Configuration

brag init # Initialize config/database
brag config # Show current config
brag config set <key> <value> # Update config (tokens, URLs, etc)

## Config Keys

brag config set github.token <token>
brag config set jira.url https://yourcompany.atlassian.net
brag config set jira.username you@company.com
brag config set jira.token <api-token>
brag config set jira.auto-import.statuses "Done,Resolved,Closed"
brag config set docs.repo owner/docs-repo
