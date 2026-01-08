# MCP Inspector Debug Guide

The [MCP Inspector](https://github.com/modelcontextprotocol/inspector) is an interactive debugging tool for MCP servers. It provides a web-based interface to test your server's tools, resources, and prompts.

## Quick Start

### 1. Build Your Server

```bash
npm run build
```

### 2. Start the Inspector

```bash
npm run inspector
```

This will:

- Start your MCP server
- Launch the MCP Inspector in your browser
- Connect the inspector to your server
- Open at `http://localhost:5173` (or similar)

## Using the Inspector

### Interface Overview

The MCP Inspector provides several tabs:

1. **Tools** - Test your 8 MCP tools interactively
2. **Resources** - Browse available resources
3. **Prompts** - View and test prompt templates
4. **Logs** - See server communication logs
5. **Connection** - Server connection status

### Testing Tools

#### Example 1: Test Semantic Search

1. Go to the **Tools** tab
2. Select `semantic_search` from the dropdown
3. Fill in parameters:
   ```json
   {
     "query": "configure SNMP on switch",
     "resource_types": ["articles"],
     "top_k": 5,
     "min_score": 0.2
   }
   ```
4. Click **Call Tool**
5. View the results in the response panel

#### Example 2: Test Article Retrieval

1. Select `get_article` tool
2. Parameters:
   ```json
   {
     "document_id": "1633639132343299"
   }
   ```
3. Click **Call Tool**
4. View full article with all steps

#### Example 3: Test Statistics

1. Select `get_statistics` tool
2. No parameters needed
3. Click **Call Tool**
4. See resource counts

### Common Test Scenarios

#### Scenario 1: Search and Retrieve Workflow

```
1. Use semantic_search to find articles about VLANs
2. Copy a document_id from results
3. Use get_article with that document_id
4. View full article details
```

#### Scenario 2: Browse Resources

```
1. Use list_articles with series filter "CBS220"
2. Use list_videos with category "Configuration"
3. Compare available content types
```

#### Scenario 3: Test Search Quality

```
1. Try different queries with semantic_search
2. Adjust min_score parameter (0.1 to 0.5)
3. Compare result quality
4. Test different resource_types combinations
```

## Debugging Tips

### View Server Logs

The **Logs** tab shows all communication between the inspector and your server:

- Request messages
- Response messages
- Error messages
- Timing information

### Check Connection Status

The **Connection** tab shows:

- Server connection state
- Server capabilities
- Protocol version
- Connection errors

### Common Issues

#### Issue 1: Server Not Starting

```bash
# Check if server builds correctly
npm run build:server

# Check for errors in dist/
ls server/dist/

# Try running server directly
node server/dist/index.js
```

#### Issue 2: Data Not Loading

```bash
# Verify data files exist
ls data/

# Check you're in the project root
pwd

# Look for errors in server logs (Inspector Logs tab)
```

#### Issue 3: Tools Not Appearing

- Check the Tools tab in Inspector
- Verify server capabilities in Connection tab
- Check console for errors
- Rebuild: `npm run build`

## Advanced Testing

### Test All Tools Systematically

1. **get_statistics**

   ```json
   {}
   ```

2. **semantic_search** (articles only)

   ```json
   {
     "query": "SNMP configuration",
     "resource_types": ["articles"],
     "top_k": 3
   }
   ```

3. **semantic_search** (all resources)

   ```json
   {
     "query": "wireless access point setup",
     "resource_types": ["articles", "videos", "prompts"],
     "top_k": 5
   }
   ```

4. **list_articles**

   ```json
   {
     "series": "CBS220",
     "category": "Configuration"
   }
   ```

5. **get_article**

   ```json
   {
     "document_id": "1633639132343299"
   }
   ```

6. **list_videos**

   ```json
   {
     "category": "Configuration",
     "limit": 10
   }
   ```

7. **get_video**

   ```json
   {
     "video_id": "dMN9TJhB824"
   }
   ```

8. **list_prompts**

   ```json
   {
     "category": "Configuration"
   }
   ```

9. **get_prompt**
   ```json
   {
     "prompt_id": "troubleshoot-network"
   }
   ```

### Performance Testing

#### Test Search Performance

```json
{
  "query": "network troubleshooting wireless configuration security",
  "top_k": 50,
  "min_score": 0.1
}
```

Check response time in the Logs tab.

#### Test Large Result Sets

```json
{
  "query": "cisco business",
  "resource_types": ["articles", "videos"],
  "top_k": 50,
  "min_score": 0.05
}
```

### Edge Cases

#### Empty Results

```json
{
  "query": "xyznonexistentquery123",
  "min_score": 0.9
}
```

Should return empty results gracefully.

#### Invalid Document ID

```json
{
  "document_id": "invalid-id-12345"
}
```

Should return error message.

#### Invalid Parameters

Try missing required parameters or invalid types to test error handling.

## Comparing with Client Code

The Inspector is great for:

- ✅ Quick testing without writing code
- ✅ Debugging tool responses
- ✅ Validating search results
- ✅ Testing edge cases
- ✅ Performance analysis

Your client code (`client/src/index.ts`) is better for:

- ✅ Automated testing
- ✅ Integration testing
- ✅ Scripted workflows
- ✅ Production usage

## MCP Inspector Features

### 1. Interactive Tool Testing

- Select any tool from dropdown
- JSON schema validation for parameters
- Syntax highlighting for JSON
- Copy responses to clipboard

### 2. Real-time Logging

- See all MCP protocol messages
- Filter by message type
- Search logs
- Export logs

### 3. Schema Validation

- Validates tool parameters against Zod schemas
- Shows parameter descriptions
- Highlights required vs optional fields

### 4. Response Formatting

- Pretty-printed JSON responses
- Syntax highlighting
- Collapsible sections for large responses

## Workflow Examples

### Workflow 1: Debugging Search Relevance

1. Start inspector: `npm run inspector`
2. Test search with query: "configure SNMP"
3. Note the similarity scores in results
4. Try variations:
   - "SNMP configuration"
   - "setup SNMP communities"
   - "how to configure SNMP"
5. Compare scores and result quality
6. Adjust `min_score` threshold
7. Document best practices

### Workflow 2: Validating Data Structure

1. Use `get_article` with known document_id
2. Verify all expected fields are present
3. Check step structure
4. Validate URLs and links
5. Confirm applicable_devices format
6. Test with multiple articles

### Workflow 3: Testing Filters

1. Use `list_articles` with no filters → baseline count
2. Add series filter → verify count decreases
3. Add category filter → verify count decreases more
4. Try different combinations
5. Verify filter logic works correctly

## Integration with VS Code

You can also use the MCP Inspector alongside VS Code:

1. Terminal 1: `npm run inspector` (opens browser)
2. Terminal 2: `npm run dev:server` (watch mode)
3. Edit server code → auto-rebuild → refresh inspector

## Alternative: Direct Testing

If you prefer command-line testing:

```bash
# Start server
npm run start:server

# In another terminal, use your client
node client/dist/index.js
```

## Troubleshooting the Inspector

### Inspector Won't Start

```bash
# Clear npm cache
npm cache clean --force

# Try running inspector directly
npx @modelcontextprotocol/inspector node server/dist/index.js
```

### Browser Not Opening

- Manually navigate to `http://localhost:5173`
- Check terminal for actual port number
- Try different browser

### Connection Issues

- Verify server builds: `npm run build:server`
- Check for TypeScript errors
- Look at browser console for errors
- Check server is using stdio transport correctly

## Next Steps

1. **Test all 8 tools** using the inspector
2. **Validate search quality** with various queries
3. **Test edge cases** (invalid IDs, empty results)
4. **Monitor performance** using the Logs tab
5. **Document findings** for optimization

## Resources

- [MCP Inspector GitHub](https://github.com/modelcontextprotocol/inspector)
- [MCP Specification](https://spec.modelcontextprotocol.io)
- Your Tools Reference: `TOOLS_REFERENCE.md`
- Your Implementation: `server/src/index.ts`

---

**Quick Commands:**

```bash
npm run build      # Build everything
npm run inspector  # Launch inspector (interactive debugging)
node client/dist/index.js  # Run example client (automated testing)
```
