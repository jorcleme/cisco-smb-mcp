# cisco-smb-mcp

A Model Context Protocol (MCP) server for managing documents and prompt templates. This server provides a standardized interface for storing, retrieving, and managing documents and prompts that can be used by AI applications.

## Features

### Document Management

- ✅ Create, read, update, and delete documents
- ✅ Full-text search across document titles and content
- ✅ Tag-based filtering and organization
- ✅ Metadata support for custom properties
- ✅ Unique document IDs with timestamps

### Prompt Templates

- ✅ Create and manage reusable prompt templates
- ✅ Support for template variables with `{{placeholder}}` syntax
- ✅ Argument definitions with descriptions and requirements
- ✅ Tag-based organization
- ✅ Built-in sample prompts (summarize, code_review)

### MCP Protocol Support

- ✅ **Tools**: Document and prompt management operations
- ✅ **Resources**: Access to stored documents and prompts
- ✅ **Prompts**: Template-based prompt generation with variable substitution
- ✅ **Standard MCP protocol** compatibility

> **Note**: This server uses the stable `Server` class from `@modelcontextprotocol/sdk/server/index.js` (SDK v1.17.1). While the MCP documentation may reference newer `McpServer` class from `mcp.js`, this implementation uses the proven stable API that's fully compatible with all MCP clients.

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run the server
npm start
```

### Development

```bash
# Run in development mode with hot reload
npm run dev

# Run tests with the simple client
npx tsx src/simple-client.ts
```

## Usage

### As MCP Server

The server can be used with any MCP-compatible client. Configure your client to connect to this server:

```json
{
  "servers": {
    "document-prompt-server": {
      "type": "stdio",
      "command": "node",
      "args": ["dist/server.js"]
    }
  }
}
```

### Available Tools

#### Document Tools

- **`create_document`** - Create a new document
- **`update_document`** - Update an existing document
- **`get_document`** - Retrieve a document by ID
- **`delete_document`** - Delete a document
- **`search_documents`** - Search documents by content and tags

#### Prompt Tools

- **`create_prompt`** - Create a new prompt template

### Sample Usage

#### Creating a Document

```javascript
await client.callTool("create_document", {
  title: "Meeting Notes",
  content: "Discussion about project roadmap...",
  tags: ["meeting", "project"],
  metadata: { date: "2024-01-15", attendees: 5 },
});
```

#### Searching Documents

```javascript
await client.callTool("search_documents", {
  query: "project roadmap",
  tags: ["meeting"],
});
```

#### Creating a Prompt Template

```javascript
await client.callTool("create_prompt", {
  name: "email_draft",
  description: "Draft a professional email",
  template:
    "Subject: {{subject}}\\n\\nDear {{recipient}},\\n\\n{{message}}\\n\\nBest regards,\\n{{sender}}",
  arguments: [
    { name: "subject", description: "Email subject", required: true },
    { name: "recipient", description: "Recipient name", required: true },
    { name: "message", description: "Email body", required: true },
    { name: "sender", description: "Sender name", required: true },
  ],
  tags: ["email", "communication"],
});
```

### Available Resources

The server exposes several resource URIs:

- **`document://<id>`** - Individual document content
- **`prompt://<name>`** - Individual prompt template
- **`documents://list`** - JSON list of all documents
- **`prompts://list`** - JSON list of all prompt templates

### Built-in Prompts

The server comes with sample prompts:

1. **`summarize`** - Summarize text in specified number of sentences
2. **`code_review`** - Review code and provide feedback

## Project Structure

```
src/
├── server/
│   ├── server.ts      # Main MCP server implementation
│   ├── types.ts       # TypeScript type definitions and schemas
│   └── storage/
│       └── memory.ts  # In-memory storage implementations
└── client/
    ├── simple-client.ts   # Test client for development
    └── client.ts          # Advanced client example (work in progress)

.vscode/
├── mcp.json           # VS Code MCP server configuration
├── launch.json        # Debug configurations
└── tasks.json         # Build and test tasks

.github/
└── copilot-instructions.md  # GitHub Copilot instructions
```

## Development Notes

### Storage

Currently uses in-memory storage for simplicity. For production use, consider implementing:

- File-based storage
- Database storage (SQLite, PostgreSQL, etc.)
- External storage services

### Error Handling

The server includes comprehensive error handling and validation using Zod schemas.

### Extensibility

The modular design makes it easy to:

- Add new storage backends
- Implement additional tools
- Extend document/prompt schemas
- Add new resource types

## VS Code Integration

This project includes VS Code configuration for debugging MCP servers:

1. The `.vscode/mcp.json` file configures the server for VS Code MCP extension
2. Use the VS Code MCP debugging features to test the server interactively

## API Reference

### Document Schema

```typescript
{
  id: string;           // Unique identifier
  title: string;        // Document title
  content: string;      // Document content
  tags?: string[];      // Optional tags
  metadata?: object;    // Optional metadata
  createdAt: Date;      // Creation timestamp
  updatedAt: Date;      // Last update timestamp
}
```

### Prompt Schema

```typescript
{
  name: string;         // Unique prompt name
  description?: string; // Optional description
  template: string;     // Template with {{placeholders}}
  arguments?: Array<{   // Template arguments
    name: string;
    description?: string;
    required?: boolean;
  }>;
  tags?: string[];      // Optional tags
  createdAt: Date;      // Creation timestamp
  updatedAt: Date;      // Last update timestamp
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Run the test client to verify functionality
6. Submit a pull request

## License

ISC License - see LICENSE file for details.

## Learn More

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [MCP SDK Documentation](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCP Servers Repository](https://github.com/modelcontextprotocol/servers)
