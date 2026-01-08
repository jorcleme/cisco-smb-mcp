# MCP Server Tools Reference

## Overview

This document provides detailed information about all available tools in the Cisco SMB MCP Server.

---

## 🔍 semantic_search

**Description:** Search across articles, videos, and prompts using semantic similarity with vector embeddings.

**Use Case:** Finding relevant content when you don't know the exact keywords or want to discover related resources.

**Parameters:**

| Parameter        | Type   | Required | Default                             | Description                        |
| ---------------- | ------ | -------- | ----------------------------------- | ---------------------------------- |
| `query`          | string | Yes      | -                                   | The search query text              |
| `resource_types` | array  | No       | `["articles", "videos", "prompts"]` | Types of resources to search       |
| `top_k`          | number | No       | `5`                                 | Number of results to return (1-50) |
| `min_score`      | number | No       | `0.1`                               | Minimum similarity score (0.0-1.0) |

**Example Request:**

```json
{
  "query": "configure VLANs on business switch",
  "resource_types": ["articles"],
  "top_k": 5,
  "min_score": 0.2
}
```

**Example Response:**

```json
{
  "query": "configure VLANs on business switch",
  "total_results": 15,
  "returned_results": 5,
  "results": [
    {
      "type": "article",
      "score": 0.847,
      "item": {
        "title": "Configure VLAN Settings on CBS220",
        "series": "Cisco Business 220 Series Smart Switches",
        "category": "Configuration",
        "url": "http://...",
        "objective": "...",
        "document_id": "1234567"
      }
    }
  ]
}
```

---

## 📄 get_article

**Description:** Retrieve a complete article with all details including step-by-step instructions.

**Use Case:** Getting full documentation after finding an article via search.

**Parameters:**

| Parameter     | Type   | Required | Description        |
| ------------- | ------ | -------- | ------------------ |
| `document_id` | string | Yes      | unique document ID |

**Example Request:**

```json
{
  "document_id": "1633639132343299"
}
```

**Response Fields:**

- `series`, `title`, `document_id`, `category`, `url`
- `objective`, `intro`
- `applicable_devices` (array with device, software version, datasheet URL)
- `steps` (array with step number, text, images, notes)

---

## 📋 list_articles

**Description:** List and filter articles by series, category, or device.

**Use Case:** Browsing available documentation for specific product lines or categories.

**Parameters:**

| Parameter  | Type   | Required | Description                            |
| ---------- | ------ | -------- | -------------------------------------- |
| `series`   | string | No       | Filter by series name (partial match)  |
| `category` | string | No       | Filter by category (exact match)       |
| `device`   | string | No       | Filter by device model (partial match) |

**Example Request:**

```json
{
  "series": "CBS220",
  "category": "Configuration"
}
```

**Example Response:**

```json
{
  "total_count": 42,
  "filters": {
    "series": "CBS220",
    "category": "Configuration"
  },
  "articles": [
    {
      "document_id": "1234567",
      "title": "Configure SNMP Communities...",
      "series": "Cisco Business 220 Series",
      "category": "Configuration",
      "url": "http://..."
    }
  ]
}
```

---

## 🎥 get_video

**Description:** Retrieve complete video details including description and transcript.

**Use Case:** Getting full information about a specific video tutorial.

**Parameters:**

| Parameter  | Type   | Required | Description      |
| ---------- | ------ | -------- | ---------------- |
| `video_id` | string | Yes      | YouTube video ID |

**Example Request:**

```json
{
  "video_id": "dMN9TJhB824"
}
```

**Response Fields:**

- `title`, `video_id`, `url`, `duration`
- `description`, `tags`, `transcript`
- `series` (array), `category`
- `published_date`, `views`, `likes`, `comments`

---

## 🎬 list_videos

**Description:** List and filter video tutorials.

**Use Case:** Browsing video content for learning and troubleshooting.

**Parameters:**

| Parameter  | Type   | Required | Default | Description           |
| ---------- | ------ | -------- | ------- | --------------------- |
| `series`   | string | No       | -       | Filter by series name |
| `category` | string | No       | -       | Filter by category    |
| `tag`      | string | No       | -       | Filter by tag         |
| `limit`    | number | No       | `20`    | Max results (1-100)   |

**Example Request:**

```json
{
  "category": "Configuration",
  "limit": 10
}
```

---

## 💬 get_prompt

**Description:** Retrieve a specific prompt template with variables.

**Use Case:** Getting templates for common network configuration and troubleshooting tasks.

**Parameters:**

| Parameter   | Type   | Required | Description              |
| ----------- | ------ | -------- | ------------------------ |
| `prompt_id` | string | Yes      | Unique prompt identifier |

**Example Request:**

```json
{
  "prompt_id": "troubleshoot-network"
}
```

**Example Response:**

```json
{
  "id": "troubleshoot-network",
  "name": "Network Troubleshooting Assistant",
  "description": "Help diagnose network issues...",
  "category": "Troubleshooting",
  "tags": ["network", "connectivity", "diagnosis"],
  "template": "I'm experiencing network issues with {{device_model}}..."
}
```

---

## 📝 list_prompts

**Description:** List all available prompt templates with optional filtering.

**Use Case:** Discovering available templates for specific tasks.

**Parameters:**

| Parameter  | Type   | Required | Description        |
| ---------- | ------ | -------- | ------------------ |
| `category` | string | No       | Filter by category |
| `tag`      | string | No       | Filter by tag      |

**Example Request:**

```json
{
  "category": "Configuration"
}
```

**Available Categories:**

- Configuration
- Troubleshooting
- Security
- Maintenance
- Optimization

---

## 📊 get_statistics

**Description:** Get summary statistics about all available resources.

**Use Case:** Understanding the scope of available documentation and resources.

**Parameters:** None

**Example Response:**

```json
{
  "articles": {
    "total": 3500,
    "series_count": 45,
    "categories": ["Configuration", "Troubleshooting", "Design", ...]
  },
  "videos": {
    "total": 250,
    "series_count": 12,
    "categories": ["Configuration", "Demo", "Tech Talk", ...]
  },
  "prompts": {
    "total": 10
  }
}
```

---

## Common Workflows

### 1. Find and Retrieve Article

```
1. semantic_search({ query: "SNMP configuration" })
2. get_article({ document_id: "<id_from_search>" })
```

### 2. Browse Series Documentation

```
1. list_articles({ series: "CBS220" })
2. get_article({ document_id: "<chosen_id>" })
```

### 3. Find Related Videos

```
1. semantic_search({
     query: "wireless setup",
     resource_types: ["videos"]
   })
2. get_video({ video_id: "<id_from_search>" })
```

### 4. Get Task Template

```
1. list_prompts({ category: "Configuration" })
2. get_prompt({ prompt_id: "<chosen_id>" })
```

---

## Performance Tips

1. **Adjust `min_score`**: Higher values (0.3-0.5) give more precise results; lower values (0.1-0.2) give more results
2. **Use specific queries**: "configure VLAN on CBS220" vs "network setup"
3. **Filter resource types**: Search only articles or videos when you know what format you need
4. **Start with statistics**: Use `get_statistics` to understand available categories and series
