# Cisco SMB MCP Server

A Model Context Protocol (MCP) server providing semantic search and resource management for Cisco Small Business documentation, videos, and prompt templates.

## Features

### 🔍 Semantic Search with Vector Embeddings

- Search across articles, videos, and prompts using vector similarity
- Configurable result count and similarity thresholds
- Returns ranked results with similarity scores

### 📚 Resource Management

- **Articles**: Configuration guides, troubleshooting docs, and how-tos
- **Videos**: Tutorial videos from Cisco SMB YouTube channel
- **Prompts**: Pre-built templates for common network tasks

### 🛠️ Available Tools

#### 1. **semantic_search**

Search across all resources using semantic similarity with vector embeddings.

**Parameters:**

- `query` (string): Search query
- `resource_types` (array, optional): Types to search - ["articles", "videos", "prompts"]
- `top_k` (number, default: 5): Number of results to return
- `min_score` (number, default: 0.1): Minimum similarity threshold (0-1)

**Example:**

```json
{
  "query": "configure SNMP on switch",
  "resource_types": ["articles"],
  "top_k": 10,
  "min_score": 0.2
}
```

#### 2. **get_article**

Retrieve a specific article by document ID with full details.

**Parameters:**

- `document_id` (string): The article's document ID

#### 3. **list_articles**

List articles with optional filters.

**Parameters:**

- `series` (string, optional): Filter by series name
- `category` (string, optional): Filter by category
- `device` (string, optional): Filter by device model

#### 4. **get_video**

Retrieve a specific video by its YouTube video ID.

**Parameters:**

- `video_id` (string): YouTube video ID

#### 5. **list_videos**

List videos with optional filters.

**Parameters:**

- `series` (string, optional): Filter by series
- `category` (string, optional): Filter by category
- `tag` (string, optional): Filter by tag
- `limit` (number, default: 20): Max results

#### 6. **get_prompt**

Retrieve a specific prompt template by ID.

**Parameters:**

- `prompt_id` (string): The prompt ID

#### 7. **list_prompts**

List all prompt templates with optional filters.

**Parameters:**

- `category` (string, optional): Filter by category
- `tag` (string, optional): Filter by tag

#### 8. **get_statistics**

Get statistics about available resources.

**Returns:** Counts and categories for all resource types.

## Data Structure

### Articles

Located in `data/articles.json`. Each article contains:

- Series, title, document_id, category, URL
- Objective and introduction
- Applicable devices with datasheets and software links
- Step-by-step instructions with images

### Videos

Located in `data/videos.json`. Each video contains:

- Title, video_id, URL, duration
- Description, tags, transcript
- Series, category, publication date
- Engagement metrics (views, likes, comments)

### Prompts

Located in `data/prompts.json`. Each prompt contains:

- ID, name, description
- Template with placeholders ({{variable}})
- Category and tags

## Installation

```bash
# Install dependencies
npm install

# Build the server
npm run build

# Start the server
npm run start:server

# Development mode (watch)
npm run dev:server
```

## Testing & Debugging

### MCP Inspector (Recommended)

The easiest way to test and debug your MCP server is using the [MCP Inspector](https://github.com/modelcontextprotocol/inspector):

```bash
# Build and launch the inspector
npm run build
npm run inspector
```

This will:

- Start your MCP server
- Launch an interactive web interface
- Let you test all 8 tools with a GUI
- Show real-time logs and responses

**See `MCP_INSPECTOR_GUIDE.md` for detailed usage instructions.**

### Example Client

Run the included example client to see all tools in action:

```bash
npm run build
node client/dist/index.js
```

This demonstrates:

- Getting statistics
- Semantic search
- Listing and retrieving resources
- Working with prompt templates

## Vector Search Implementation

The current implementation uses a simple character frequency-based embedding for demonstration.

**For production use, integrate a proper embedding API:**

- OpenAI Embeddings API
- Cohere Embeddings
- Sentence Transformers (local)
- Azure OpenAI Embeddings

Replace the `createSimpleEmbedding()` function with calls to your chosen embedding service.

## Architecture

```
cisco-smb-mcp/
├── client/          # MCP client implementation
├── server/          # MCP server implementation
│   ├── src/
│   │   └── index.ts # Main server code
│   └── tsconfig.json
├── data/           # Resource data files
│   ├── articles.json
│   ├── videos.json
│   └── prompts.json
└── package.json
```

## Usage Example

```typescript
// Using the MCP client
const result = await client.callTool("semantic_search", {
  query: "troubleshoot wireless connectivity issues",
  resource_types: ["articles", "videos"],
  top_k: 5,
});

// Results include similarity scores
console.log(result.results);
/*
[
  {
    type: "article",
    score: 0.847,
    item: {
      title: "Troubleshoot Wireless Connectivity...",
      ...
    }
  },
  ...
]
*/
```

## Future Enhancements

- [ ] Implement proper embedding API integration
- [ ] Add caching for embeddings
- [ ] Support for incremental data updates
- [ ] Advanced filtering and faceting
- [ ] Full-text search fallback
- [ ] Resource recommendations
- [ ] Analytics and usage tracking

## License

ISC
