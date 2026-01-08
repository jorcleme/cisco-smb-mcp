# Quick Start Guide

## Prerequisites

- Node.js 18+ installed
- npm or yarn

## Installation

```bash
# Navigate to project directory
cd cisco-smb-mcp

# Install dependencies
npm install

# Build the project
npm run build
```

## Running the Server

```bash
# Start the MCP server
npm run start:server
```

The server will start and listen on stdio for MCP client connections.

## Running the Example Client

```bash
# In a new terminal, run the example client
node client/dist/index.js
```

The client will demonstrate all 8 tools:

1. Get statistics
2. Semantic search for SNMP articles
3. List configuration videos
4. List prompt templates
5. Get specific prompt
6. Search across all resource types

## Quick Examples

### Search for Content

```javascript
// Search articles about SNMP
const result = await client.callTool({
  name: "semantic_search",
  arguments: {
    query: "configure SNMP communities on switch",
    resource_types: ["articles"],
    top_k: 5,
  },
});
```

### Get Article Details

```javascript
// Get full article with steps
const article = await client.callTool({
  name: "get_article",
  arguments: {
    document_id: "1633639132343299",
  },
});
```

### List Resources

```javascript
// List CBS220 articles
const articles = await client.callTool({
  name: "list_articles",
  arguments: {
    series: "CBS220",
    category: "Configuration",
  },
});

// List configuration videos
const videos = await client.callTool({
  name: "list_videos",
  arguments: {
    category: "Configuration",
    limit: 10,
  },
});
```

### Use Prompt Templates

```javascript
// Get troubleshooting prompt
const prompt = await client.callTool({
  name: "get_prompt",
  arguments: {
    prompt_id: "troubleshoot-network",
  },
});

// Fill in template variables
const filled = prompt.template
  .replace("{{device_model}}", "CBS220")
  .replace("{{symptoms}}", "packet loss");
```

## Development Mode

```bash
# Watch mode for server (auto-rebuild on changes)
npm run dev:server
```

## Project Structure

```
cisco-smb-mcp/
├── client/              # Example MCP client
│   └── src/index.ts     # Client demos
├── server/              # MCP server
│   └── src/index.ts     # Server with 8 tools
├── data/                # JSON data files
│   ├── articles.json    # 3500+ articles
│   ├── videos.json      # 250+ videos
│   └── prompts.json     # 10 templates
└── package.json         # Build scripts
```

## Next Steps

1. **Explore Tools**: See `TOOLS_REFERENCE.md` for detailed API docs
2. **Customize Search**: Adjust `min_score` and `top_k` parameters
3. **Add Prompts**: Edit `data/prompts.json` to add templates
4. **Upgrade Embeddings**: Replace simple embeddings with OpenAI/Cohere

## Troubleshooting

### Build Errors

```bash
# Clean and rebuild
rm -rf client/dist server/dist
npm run build
```

### Module Not Found

```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

### Data Not Loading

- Ensure you're in the project root when running
- Check that `data/*.json` files exist
- Verify file paths in server logs

## Documentation

- `README.md` - Overview and features
- `TOOLS_REFERENCE.md` - Complete API documentation
- `IMPLEMENTATION_SUMMARY.md` - Technical details
- This file - Quick start guide

## Support

For issues or questions:

1. Check the documentation
2. Review example client code
3. Verify data files are present
4. Check server logs for errors
