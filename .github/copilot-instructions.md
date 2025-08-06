# Copilot Instructions

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

This is a Model Context Protocol (MCP) server project written in TypeScript.

## Key Guidelines:

- Use the @modelcontextprotocol/sdk for all MCP implementations
- Follow MCP protocol specifications for resources, tools, and prompts
- Implement proper error handling and validation using Zod schemas
- Use TypeScript with strict type checking
- Follow the MCP server patterns for resource management

## Resources:

- You can find more info and examples at https://modelcontextprotocol.io/llms-full.txt
- SDK Reference: https://github.com/modelcontextprotocol/create-python-server
- Official MCP Documentation: https://modelcontextprotocol.io/

## Project Structure:

- `/src/server/server.ts` - Main MCP server implementation
- `/src/server/types.ts` - TypeScript type definitions
- `/src/server/storage/` - Document and prompt storage implementations
- `/src/client/simple-client.ts` - Test client for development
- `/src/client/client.ts` - Advanced client example
