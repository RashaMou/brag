CREATE TABLE IF NOT EXISTS entries (
    id integer PRIMARY KEY AUTOINCREMENT,
    text text NOT NULL,
    date text NOT NULL, -- ISO8601 format (YYYY-MM-DD)
    created_at text NOT NULL, -- When it was logged
    category_id integer,
    impact text,
    source_id text, -- PR number, ticket ID, etc.
    source_url text, -- Link back to original
    FOREIGN KEY (category_id) REFERENCES categories (id)
);

CREATE TABLE IF NOT EXISTS categories (
    id integer PRIMARY KEY AUTOINCREMENT,
    name text NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS jira_tickets (
    id integer PRIMARY KEY AUTOINCREMENT,
    ticket_key text NOT NULL UNIQUE,
    summary text NOT NULL,
    resolved_at text,
    url text
);

CREATE TABLE IF NOT EXISTS config (
    key TEXT PRIMARY KEY,
    value text NOT NULL
);

