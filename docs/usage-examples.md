# Using the MCP Document Server

This document provides examples of how to use the MCP Document & Prompt Server with various AI applications.

## Configuration Examples

### Claude Desktop Configuration

Add this to your Claude Desktop configuration file (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "document-server": {
      "command": "node",
      "args": ["/path/to/your/project/dist/server.js"],
      "env": {}
    }
  }
}
```

### VS Code Configuration

The server is already configured for VS Code in `.vscode/mcp.json`. To use it:

1. Install the MCP extension in VS Code
2. The server will be automatically detected
3. Use the MCP panel to interact with documents and prompts

### Direct Command Line Usage

```bash
# Start the server
npm start

# Or in development mode
npm run dev

# Test the server
npm test
```

## Example Workflows

### Document Management Workflow

1. **Create a knowledge base document**:

   ```
   Tool: create_document
   Arguments:
   - title: "Project Requirements"
   - content: "Our new web application needs to support user authentication, data visualization, and real-time updates..."
   - tags: ["requirements", "project", "web-app"]
   ```

2. **Search for relevant documents**:

   ```
   Tool: search_documents
   Arguments:
   - query: "authentication"
   - tags: ["requirements"]
   ```

3. **Update documentation as project evolves**:
   ```
   Tool: update_document
   Arguments:
   - id: "doc-id-from-step-1"
   - content: "Updated requirements including mobile support..."
   - tags: ["requirements", "project", "web-app", "mobile"]
   ```

### Prompt Template Workflow

1. **Create a code review prompt**:

   ````
   Tool: create_prompt
   Arguments:
   - name: "security_review"
   - description: "Review code for security vulnerabilities"
   - template: "Please review this {{language}} code for security vulnerabilities:\\n\\n```{{language}}\\n{{code}}\\n```\\n\\nFocus specifically on: {{security_areas}}"
   - arguments: [
       {"name": "code", "required": true},
       {"name": "language", "required": true},
       {"name": "security_areas", "required": false}
     ]
   ````

2. **Use the prompt template**:
   ```
   Prompt: security_review
   Arguments:
   - code: "const user = req.query.user; db.query(`SELECT * FROM users WHERE name = '${user}'`)"
   - language: "javascript"
   - security_areas: "SQL injection, input validation"
   ```

### Resource Access Examples

Access stored content directly via resources:

- `document://abc-123-def` - Get specific document content
- `prompt://security_review` - Get prompt template
- `documents://list` - List all documents as JSON
- `prompts://list` - List all prompts as JSON

## Integration Benefits

- **Persistent Knowledge**: Store important information that persists across AI conversations
- **Reusable Prompts**: Create standardized prompt templates for consistent results
- **Searchable Content**: Find relevant information quickly with full-text search
- **Organized Storage**: Use tags and metadata to organize your content
- **Cross-Platform**: Use the same knowledge base across different AI applications
