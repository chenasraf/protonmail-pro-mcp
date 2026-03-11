# Proton Mail MCP Server

An MCP server for Proton Mail via Proton Bridge. Supports reading, searching, sending, and
organizing emails.

## Prerequisites

1. **Proton Mail account** with valid credentials
2. **[Proton Bridge](https://protonmail.com/bridge)** installed and running (provides local
   IMAP/SMTP)
3. **Node.js** >= 18

## Setup

```bash
pnpm install
pnpm run build
```

### Environment Variables

| Variable               | Required | Default     | Description                                                 |
| ---------------------- | -------- | ----------- | ----------------------------------------------------------- |
| `PROTONMAIL_USERNAME`  | Yes      |             | Proton Mail email address                                   |
| `PROTONMAIL_PASSWORD`  | Yes      |             | Proton Bridge password                                      |
| `PROTONMAIL_IMAP_HOST` | No       | `127.0.0.1` | IMAP host                                                   |
| `PROTONMAIL_IMAP_PORT` | No       | `1143`      | IMAP port                                                   |
| `PROTONMAIL_SMTP_HOST` | No       | `127.0.0.1` | SMTP host                                                   |
| `PROTONMAIL_SMTP_PORT` | No       | `1025`      | SMTP port                                                   |
| `READ_ONLY_MODE`       | No       | `true`      | Set to `false` to enable write operations                   |
| `DEBUG`                | No       | `false`     | Enable debug logging                                        |
| `LOG_FILE`             | No       |             | Path to log file (relative paths resolve from project root) |

### Claude Code

```bash
claude mcp add protonmail \
  -s project \
  -e PROTONMAIL_USERNAME=you@pm.me \
  -e PROTONMAIL_PASSWORD=your-bridge-password \
  -e READ_ONLY_MODE=false \
  -- node /path/to/protonmail-pro-mcp/dist/index.js
```

### Claude Desktop

Add to your MCP configuration:

```json
{
  "mcpServers": {
    "protonmail": {
      "command": "node",
      "args": ["/path/to/protonmail-pro-mcp/dist/index.js"],
      "env": {
        "PROTONMAIL_USERNAME": "you@pm.me",
        "PROTONMAIL_PASSWORD": "your-bridge-password",
        "READ_ONLY_MODE": "false"
      }
    }
  }
}
```

## Available Tools

### Read-only tools (always available)

| Tool                    | Description                                                                                                                  |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `get_emails`            | Get emails from a folder with pagination. Params: `folder`, `limit`, `offset`                                                |
| `get_email_by_id`       | Get a specific email by ID                                                                                                   |
| `search_emails`         | Search emails with filters: `query`, `folder`, `from`, `to`, `subject`, `isRead`, `isStarred`, `dateFrom`, `dateTo`, `limit` |
| `get_folders`           | List all email folders/labels                                                                                                |
| `get_email_stats`       | Get email statistics                                                                                                         |
| `get_contacts`          | Get contact list with interaction counts                                                                                     |
| `get_connection_status` | Check IMAP/SMTP connection status                                                                                            |
| `sync_emails`           | Sync emails from a folder                                                                                                    |

### Write tools (requires `READ_ONLY_MODE=false`)

| Tool              | Description                                                                     |
| ----------------- | ------------------------------------------------------------------------------- |
| `send_email`      | Send an email. Params: `to`, `cc`, `bcc`, `subject`, `body`, `isHtml`           |
| `delete_email`    | Delete an email by ID                                                           |
| `move_email`      | Move an email to a different folder (replaces current folder, preserves labels) |
| `label_email`     | Add a label to an email without removing it from its current folder             |
| `unlabel_email`   | Remove a label from an email                                                    |
| `mark_email_read` | Mark an email as read or unread                                                 |
| `star_email`      | Star or unstar an email                                                         |

## Proton Bridge: Labels vs Folders

In Proton Bridge, labels appear as IMAP folders under `Labels/`. Key behaviors:

- **Labeling**: Use `label_email` -- copies the message to the label, keeping it in its current
  folder
- **Moving to a folder**: Use `move_email` -- copies the message to the target folder, preserving
  existing labels
- **Removing a label**: Use `unlabel_email` -- removes the message from the label folder only

See [Proton Bridge docs](https://proton.me/support/bridge) for more details.

## License

MIT
