// MCP Client example for testing the document server

import { spawn } from "child_process";

import { Anthropic } from "@anthropic-ai/sdk";
import {
  MessageParam,
  Tool,
} from "@anthropic-ai/sdk/resources/messages/messages.mjs";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import readline from "readline/promises";
import dotenv from "dotenv";
import { join } from "path";

const __dirname = new URL(".", import.meta.url).pathname;

dotenv.config({ path: join(__dirname, "../../.env") });

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!ANTHROPIC_API_KEY) {
  throw new Error("ANTHROPIC_API_KEY is not set in the environment variables.");
}

class MCPClient {
  private mcp: Client;
  private anthropic: Anthropic;
  private transport: StdioClientTransport | null = null;
  private tools: Tool[] = [];

  constructor() {
    this.anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
    this.mcp = new Client({ name: "mcp-client", version: "1.0.0" });
  }

  async connect(serverpath: string) {
    try {
      console.log("🚀 Starting MCP Document Server...");

      const isJS = serverpath.endsWith(".js");
      const isPY = serverpath.endsWith(".py");

      if (!isJS && !isPY) {
        throw new Error("Server path must end with .js or .py");
      }

      const command = isPY
        ? process.platform === "win32"
          ? "python"
          : "python3"
        : process.execPath;

      this.transport = new StdioClientTransport({
        command,
        args: [serverpath],
      });

      await this.mcp.connect(this.transport);
      console.log("✅ Connected to MCP server");
      const toolResults = await this.mcp.listTools();

      this.tools = toolResults.tools.map((tool) => {
        return {
          name: tool.name,
          description: tool.description,
          input_schema: tool.inputSchema,
        } as Tool;
      });

      console.log("Available tools:", this.tools.map((t) => t.name).join(", "));
    } catch (error) {
      console.error("Error connecting to MCP server:", error);
      throw error;
    }
  }

  async processQuery(query: string) {
    const messages: MessageParam[] = [
      {
        role: "user",
        content: query,
      },
    ];

    const response = await this.anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1000,
      messages,
      tools: this.tools,
    });

    const finalText: string[] = [];

    for (const content of response.content) {
      if (content.type === "text") {
        finalText.push(content.text);
      } else if (content.type === "tool_use") {
        const toolName = content.name;
        const toolArgs = content.input as { [x: string]: unknown } | undefined;

        const result = await this.mcp.callTool({
          name: toolName,
          arguments: toolArgs,
        });

        finalText.push(
          `[Calling tool ${toolName} with args ${JSON.stringify(toolArgs)}]`
        );

        messages.push({
          role: "user",
          content: result.content as string,
        });

        const response = await this.anthropic.messages.create({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 1000,
          messages,
        });

        finalText.push(
          response.content[0]?.type === "text" ? response.content[0].text : ""
        );
      }
    }

    return finalText.join("\n");
  }

  async chat() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    try {
      console.log("\nMCP Client Started.");
      console.log("Type your queries below (type 'exit' to quit):");

      while (true) {
        const message = await rl.question("\nQuery: ");
        if (message.toLowerCase() === "exit") {
          break;
        }

        const response = await this.processQuery(message);
        console.log("\n" + response);
      }
    } catch (error) {
      console.error("Error during chat:", error);
    } finally {
      rl.close();
    }
  }

  async cleanup() {
    await this.mcp.close();
  }
}

async function main() {
  if (process.argv.length < 3) {
    console.error(
      "Usage: node ./dist/client/client.js ./dist/server/server.js"
    );
    return;
  }

  const mcpClient = new MCPClient();

  try {
    await mcpClient.connect(process.argv[2] as string);
    await mcpClient.chat();
  } finally {
    await mcpClient.cleanup();
    console.log("✅ MCP Client closed.");
    process.exit(0);
  }
}

main().catch((error) => {
  console.error("Error in MCP Client:", error);
  process.exit(1);
});
