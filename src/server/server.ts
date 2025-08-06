#!/usr/bin/env node

// MCP Server for Document and Prompt Management
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import {
  MemoryDocumentStorage,
  MemoryPromptStorage,
} from "./storage/memory.js";
import {
  CreateDocumentSchema,
  UpdateDocumentSchema,
  CreatePromptSchema,
} from "./types.js";
import { z } from "zod";

// Initialize storage
const documentStorage = new MemoryDocumentStorage();
const promptStorage = new MemoryPromptStorage();

// Create server instance
const server = new Server(
  {
    name: "document-prompt-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      resources: {},
      tools: {},
      prompts: {},
    },
  }
);

// Tool schemas
const CreateDocumentToolSchema = z.object({
  name: z.literal("create_document"),
  arguments: CreateDocumentSchema,
});

const UpdateDocumentToolSchema = z.object({
  name: z.literal("update_document"),
  arguments: UpdateDocumentSchema,
});

const GetDocumentToolSchema = z.object({
  name: z.literal("get_document"),
  arguments: z.object({ id: z.string() }),
});

const DeleteDocumentToolSchema = z.object({
  name: z.literal("delete_document"),
  arguments: z.object({ id: z.string() }),
});

const SearchDocumentsToolSchema = z.object({
  name: z.literal("search_documents"),
  arguments: z.object({
    query: z.string(),
    tags: z.array(z.string()).optional(),
  }),
});

const CreatePromptToolSchema = z.object({
  name: z.literal("create_prompt"),
  arguments: CreatePromptSchema,
});

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "create_document",
        description: "Create a new document",
        inputSchema: {
          type: "object",
          properties: {
            title: { type: "string", description: "Document title" },
            content: { type: "string", description: "Document content" },
            tags: {
              type: "array",
              items: { type: "string" },
              description: "Optional tags for the document",
            },
            metadata: {
              type: "object",
              description: "Optional metadata for the document",
            },
          },
          required: ["title", "content"],
        },
      },
      {
        name: "update_document",
        description: "Update an existing document",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string", description: "Document ID" },
            title: { type: "string", description: "Document title" },
            content: { type: "string", description: "Document content" },
            tags: {
              type: "array",
              items: { type: "string" },
              description: "Tags for the document",
            },
            metadata: {
              type: "object",
              description: "Metadata for the document",
            },
          },
          required: ["id"],
        },
      },
      {
        name: "get_document",
        description: "Get a document by ID",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string", description: "Document ID" },
          },
          required: ["id"],
        },
      },
      {
        name: "delete_document",
        description: "Delete a document by ID",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string", description: "Document ID" },
          },
          required: ["id"],
        },
      },
      {
        name: "search_documents",
        description: "Search documents by query and optional tags",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "Search query" },
            tags: {
              type: "array",
              items: { type: "string" },
              description: "Optional tags to filter by",
            },
          },
          required: ["query"],
        },
      },
      {
        name: "create_prompt",
        description: "Create a new prompt template",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", description: "Prompt name" },
            description: { type: "string", description: "Prompt description" },
            template: {
              type: "string",
              description: "Prompt template with placeholders",
            },
            arguments: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  required: { type: "boolean" },
                },
                required: ["name"],
              },
              description: "Prompt arguments",
            },
            tags: {
              type: "array",
              items: { type: "string" },
              description: "Optional tags for the prompt",
            },
          },
          required: ["name", "template"],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "create_document": {
        const validArgs = CreateDocumentSchema.parse(args);
        const document = await documentStorage.createDocument(validArgs);
        return {
          content: [
            {
              type: "text",
              text: `Document created successfully with ID: ${document.id}`,
            },
            {
              type: "text",
              text: JSON.stringify(document, null, 2),
            },
          ],
        };
      }

      case "update_document": {
        const validArgs = UpdateDocumentSchema.parse(args);
        const document = await documentStorage.updateDocument(validArgs);
        if (!document) {
          return {
            content: [
              {
                type: "text",
                text: `Document with ID ${validArgs.id} not found`,
              },
            ],
          };
        }
        return {
          content: [
            {
              type: "text",
              text: "Document updated successfully",
            },
            {
              type: "text",
              text: JSON.stringify(document, null, 2),
            },
          ],
        };
      }

      case "get_document": {
        const { id } = z.object({ id: z.string() }).parse(args);
        const document = await documentStorage.getDocument(id);
        if (!document) {
          return {
            content: [
              {
                type: "text",
                text: `Document with ID ${id} not found`,
              },
            ],
          };
        }
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(document, null, 2),
            },
          ],
        };
      }

      case "delete_document": {
        const { id } = z.object({ id: z.string() }).parse(args);
        const deleted = await documentStorage.deleteDocument(id);
        return {
          content: [
            {
              type: "text",
              text: deleted
                ? `Document ${id} deleted successfully`
                : `Document ${id} not found`,
            },
          ],
        };
      }

      case "search_documents": {
        const { query, tags } = z
          .object({
            query: z.string(),
            tags: z.array(z.string()).optional(),
          })
          .parse(args);
        const documents = await documentStorage.searchDocuments(query, tags);
        return {
          content: [
            {
              type: "text",
              text: `Found ${
                documents.length
              } documents matching query "${query}"${
                tags ? ` with tags [${tags.join(", ")}]` : ""
              }`,
            },
            {
              type: "text",
              text: JSON.stringify(documents, null, 2),
            },
          ],
        };
      }

      case "create_prompt": {
        const validArgs = CreatePromptSchema.parse(args);
        const prompt = await promptStorage.createPrompt(validArgs);
        return {
          content: [
            {
              type: "text",
              text: `Prompt "${prompt.name}" created successfully`,
            },
            {
              type: "text",
              text: JSON.stringify(prompt, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        },
      ],
      isError: true,
    };
  }
});

// List available resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  const documents = await documentStorage.getAllDocuments();
  const prompts = await promptStorage.getAllPrompts();

  return {
    resources: [
      ...documents.map((doc) => ({
        uri: `document://${doc.id}`,
        mimeType: "text/plain",
        name: doc.title,
        description: `Document: ${doc.title}${
          doc.tags && doc.tags.length > 0
            ? ` (tags: ${doc.tags.join(", ")})`
            : ""
        }`,
      })),
      ...prompts.map((prompt) => ({
        uri: `prompt://${prompt.name}`,
        mimeType: "text/plain",
        name: prompt.name,
        description: prompt.description || `Prompt template: ${prompt.name}`,
      })),
      {
        uri: "documents://list",
        mimeType: "application/json",
        name: "All Documents",
        description: "List of all stored documents",
      },
      {
        uri: "prompts://list",
        mimeType: "application/json",
        name: "All Prompts",
        description: "List of all stored prompt templates",
      },
    ],
  };
});

// Handle resource reading
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  try {
    if (uri.startsWith("document://")) {
      const id = uri.replace("document://", "");
      const document = await documentStorage.getDocument(id);
      if (!document) {
        throw new Error(`Document with ID ${id} not found`);
      }
      return {
        contents: [
          {
            uri,
            mimeType: "text/plain",
            text: document.content,
          },
        ],
      };
    }

    if (uri.startsWith("prompt://")) {
      const name = uri.replace("prompt://", "");
      const prompt = await promptStorage.getPrompt(name);
      if (!prompt) {
        throw new Error(`Prompt with name ${name} not found`);
      }
      return {
        contents: [
          {
            uri,
            mimeType: "text/plain",
            text: prompt.template,
          },
        ],
      };
    }

    if (uri === "documents://list") {
      const documents = await documentStorage.getAllDocuments();
      return {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: JSON.stringify(documents, null, 2),
          },
        ],
      };
    }

    if (uri === "prompts://list") {
      const prompts = await promptStorage.getAllPrompts();
      return {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: JSON.stringify(prompts, null, 2),
          },
        ],
      };
    }

    throw new Error(`Unknown resource URI: ${uri}`);
  } catch (error) {
    throw new Error(
      `Failed to read resource ${uri}: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
});

// List available prompts
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  const prompts = await promptStorage.getAllPrompts();

  return {
    prompts: prompts.map((prompt) => ({
      name: prompt.name,
      description: prompt.description,
      arguments: prompt.arguments?.map((arg) => ({
        name: arg.name,
        description: arg.description,
        required: arg.required || false,
      })),
    })),
  };
});

// Get specific prompt
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: promptArgs } = request.params;

  const prompt = await promptStorage.getPrompt(name);
  if (!prompt) {
    throw new Error(`Prompt '${name}' not found`);
  }

  // Simple template replacement
  let processedTemplate = prompt.template;
  if (promptArgs) {
    for (const [key, value] of Object.entries(promptArgs)) {
      const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      processedTemplate = processedTemplate.replace(placeholder, String(value));
    }
  }

  return {
    description: prompt.description,
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: processedTemplate,
        },
      },
    ],
  };
});

// Error handling
server.onerror = (error) => {
  console.error("[MCP Error]", error);
};

process.on("SIGINT", async () => {
  await server.close();
  process.exit(0);
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Document & Prompt MCP Server running on stdio");

  // Add some sample data
  try {
    await documentStorage.createDocument({
      title: "Welcome Document",
      content:
        "Welcome to the MCP Document Storage Server! This is a sample document.",
      tags: ["welcome", "sample"],
    });

    await promptStorage.createPrompt({
      name: "summarize",
      description: "Summarize a given text",
      template:
        "Please summarize the following text in {{length}} sentences:\n\n{{text}}",
      arguments: [
        { name: "text", description: "Text to summarize", required: true },
        {
          name: "length",
          description: "Number of sentences for summary",
          required: false,
        },
      ],
      tags: ["text", "summary"],
    });

    await promptStorage.createPrompt({
      name: "code_review",
      description: "Review code and provide feedback",
      template:
        "Please review the following {{language}} code and provide constructive feedback:\n\n```{{language}}\n{{code}}\n```\n\nFocus on: {{focus_areas}}",
      arguments: [
        { name: "code", description: "Code to review", required: true },
        {
          name: "language",
          description: "Programming language",
          required: true,
        },
        {
          name: "focus_areas",
          description: "Areas to focus on during review",
          required: false,
        },
      ],
      tags: ["code", "review", "programming"],
    });

    console.error("Sample data loaded successfully");
  } catch (error) {
    console.error("Error loading sample data:", error);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
