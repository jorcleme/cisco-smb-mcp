// Simple MCP client test using direct stdio communication
import { spawn } from "child_process";
import { EventEmitter } from "events";

class SimpleMCPClient extends EventEmitter {
  private serverProcess: any;
  private messageId = 1;
  private pendingRequests = new Map();

  constructor() {
    super();
  }

  async connect() {
    console.log("🚀 Starting MCP Document Server...");

    this.serverProcess = spawn("tsx", ["src/server/server.ts"], {
      stdio: ["pipe", "pipe", "inherit"],
      cwd: process.cwd(),
    });

    let buffer = "";
    this.serverProcess.stdout.on("data", (data: Buffer) => {
      buffer += data.toString();
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.trim()) {
          try {
            const message = JSON.parse(line);
            this.handleMessage(message);
          } catch (error) {
            // Ignore non-JSON output (like stderr messages)
          }
        }
      }
    });

    this.serverProcess.on("error", (error: Error) => {
      console.error("Server process error:", error);
    });

    // Initialize connection
    await this.sendRequest("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {
        roots: { listChanged: false },
        sampling: {},
      },
      clientInfo: {
        name: "test-client",
        version: "1.0.0",
      },
    });

    console.log("✅ Connected to MCP server");
  }

  private handleMessage(message: any) {
    if (message.id && this.pendingRequests.has(message.id)) {
      const resolve = this.pendingRequests.get(message.id);
      this.pendingRequests.delete(message.id);
      resolve(message);
    }
  }

  private sendRequest(method: string, params: any = {}): Promise<any> {
    return new Promise((resolve, reject) => {
      const id = this.messageId++;
      const request = {
        jsonrpc: "2.0",
        id,
        method,
        params,
      };

      this.pendingRequests.set(id, resolve);

      // Set timeout
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`Request timeout for method: ${method}`));
        }
      }, 10000);

      this.serverProcess.stdin.write(JSON.stringify(request) + "\n");
    });
  }

  async listTools() {
    const response = await this.sendRequest("tools/list");
    return response.result;
  }

  async callTool(name: string, args: any) {
    const response = await this.sendRequest("tools/call", {
      name,
      arguments: args,
    });
    return response.result;
  }

  async listResources() {
    const response = await this.sendRequest("resources/list");
    return response.result;
  }

  async listPrompts() {
    const response = await this.sendRequest("prompts/list");
    return response.result;
  }

  async getPrompt(name: string, args: any = {}) {
    const response = await this.sendRequest("prompts/get", {
      name,
      arguments: args,
    });
    return response.result;
  }

  async close() {
    if (this.serverProcess) {
      this.serverProcess.kill();
    }
  }
}

async function runTests() {
  const client = new SimpleMCPClient();

  try {
    // Connect to server
    await client.connect();

    // Wait a moment for the server to fully initialize
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Test 1: List tools
    console.log("\n🔧 Testing available tools...");
    const tools = await client.listTools();
    console.log("Available tools:", tools.tools?.map((t: any) => t.name) || []);

    // Test 2: Create a document
    console.log("\n📝 Testing document creation...");
    const createResult = await client.callTool("create_document", {
      title: "Test Document from Client",
      content: "This document was created by the simple MCP client test.",
      tags: ["test", "client", "demo"],
      metadata: { source: "simple-client" },
    });
    console.log("✅ Document created");

    // Test 3: Search documents
    console.log("\n🔍 Testing document search...");
    const searchResult = await client.callTool("search_documents", {
      query: "test",
      tags: ["demo"],
    });
    console.log("✅ Search completed, found documents");

    // Test 4: List resources
    console.log("\n📚 Testing available resources...");
    const resources = await client.listResources();
    console.log("Available resources:", resources.resources?.length || 0);

    // Test 5: List prompts
    console.log("\n🎯 Testing available prompts...");
    const prompts = await client.listPrompts();
    console.log(
      "Available prompts:",
      prompts.prompts?.map((p: any) => p.name) || []
    );

    // Test 6: Use a prompt
    if (prompts.prompts && prompts.prompts.length > 0) {
      console.log("\n📋 Testing prompt usage...");
      const promptResult = await client.getPrompt("summarize", {
        text: "This is a sample text that needs to be summarized.",
        length: "2",
      });
      console.log("✅ Prompt processed successfully");
    }

    // Test 7: Create a custom prompt
    console.log("\n✨ Testing custom prompt creation...");
    await client.callTool("create_prompt", {
      name: "greeting",
      description: "Generate a personalized greeting",
      template:
        "Hello {{name}}! Welcome to our {{service}}. Have a great {{time_of_day}}!",
      arguments: [
        { name: "name", description: "Person's name", required: true },
        { name: "service", description: "Service name", required: true },
        { name: "time_of_day", description: "Time of day", required: false },
      ],
      tags: ["greeting", "personalization"],
    });
    console.log("✅ Custom prompt created");

    console.log("\n🎉 All tests completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await client.close();
  }
}

// Run the tests
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}
