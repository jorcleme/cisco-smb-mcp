# MCP Inspector - Quick Reference

## 🚀 Current Session

**Inspector URL:**

```
http://localhost:6274/?MCP_PROXY_AUTH_TOKEN=020dd33b07bfeea2e7a66037ec5ad1fb132794df57bdca19ebba94059ea26109
```

**Proxy Server:** `localhost:6277`

**Session Token:** `020dd33b07bfeea2e7a66037ec5ad1fb132794df57bdca19ebba94059ea26109`

---

## 📋 Quick Test Checklist

Copy and paste these into the Inspector to test each tool:

### ✅ 1. Get Statistics

```json
{}
```

### ✅ 2. Semantic Search (Articles)

```json
{
  "query": "configure SNMP communities on switch",
  "resource_types": ["articles"],
  "top_k": 5,
  "min_score": 0.2
}
```

### ✅ 3. Semantic Search (All Resources)

```json
{
  "query": "wireless access point setup",
  "resource_types": ["articles", "videos", "prompts"],
  "top_k": 5,
  "min_score": 0.15
}
```

### ✅ 4. List Articles (CBS220)

```json
{
  "series": "CBS220",
  "category": "Configuration"
}
```

### ✅ 5. Get Article

```json
{
  "document_id": "1633639132343299"
}
```

### ✅ 6. List Videos

```json
{
  "category": "Configuration",
  "limit": 10
}
```

### ✅ 7. Get Video

```json
{
  "video_id": "dMN9TJhB824"
}
```

### ✅ 8. List Prompts

```json
{
  "category": "Configuration"
}
```

### ✅ 9. Get Prompt

```json
{
  "prompt_id": "troubleshoot-network"
}
```

---

## 🔍 Test Scenarios

### Scenario 1: Search & Retrieve Workflow

1. Run semantic_search with query: "VLAN configuration"
2. Copy a document_id from the results
3. Run get_article with that document_id
4. Verify full article details appear

### Scenario 2: Browse Resources

1. Run get_statistics (note counts)
2. Run list_articles with series "CBS220"
3. Run list_videos with category "Configuration"
4. Compare available content

### Scenario 3: Test Search Quality

1. Run semantic_search with query: "network security"
2. Note the similarity scores
3. Change min_score to 0.3
4. Compare how many results you get

---

## 💡 What to Look For

### In the Tools Tab:

- All 8 tools appear in dropdown
- Parameters show descriptions
- Required vs optional fields marked
- JSON validation works

### In the Response:

- Results are properly formatted JSON
- Similarity scores are between 0 and 1
- Document IDs are valid
- URLs are complete and correct
- Arrays contain expected items

### In the Logs Tab:

- Request/response pairs match
- No error messages
- Response times reasonable (< 1-2 seconds)
- Server is responding consistently

---

## 🐛 Common Issues & Fixes

### Tool Not Working?

1. Check Logs tab for error messages
2. Verify parameter format (must be valid JSON)
3. Check required fields are included
4. Try with simpler parameters first

### Empty Results?

- Increase top_k parameter
- Decrease min_score parameter
- Try broader search query
- Use get_statistics to verify data loaded

### Server Not Responding?

1. Check Connection tab - should show "Connected"
2. Close and restart inspector: `npm run inspector`
3. Rebuild server: `npm run build`
4. Check server logs in Logs tab

---

## 📊 Expected Results

### get_statistics

```json
{
  "articles": { "total": 3500+, "series_count": 45+, ... },
  "videos": { "total": 250+, "series_count": 12+, ... },
  "prompts": { "total": 10 }
}
```

### semantic_search

```json
{
  "query": "...",
  "total_results": <number>,
  "returned_results": <number>,
  "results": [
    {
      "type": "article|video|prompt",
      "score": 0.xxx,
      "item": { ... }
    }
  ]
}
```

### list_articles

```json
{
  "total_count": <number>,
  "filters": { ... },
  "articles": [ { document_id, title, series, category, url } ]
}
```

---

## 🎯 Next Steps

1. ✅ Test all 8 tools systematically
2. ✅ Verify search quality and relevance
3. ✅ Test edge cases (invalid IDs, empty results)
4. ✅ Monitor performance in Logs tab
5. ✅ Document any issues found
6. ✅ Compare with client results for consistency

---

## 📝 Notes

- Inspector runs in browser, server in terminal
- Changes to server code require rebuild + restart
- Session token is unique per inspector session
- Use Logs tab to see all MCP protocol messages
- Copy responses to save test results

---

**Commands:**

```bash
npm run inspector    # Start inspector (this session)
npm run build        # Rebuild after code changes
Ctrl+C              # Stop inspector (in terminal)
```
