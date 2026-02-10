import { z } from "zod";
import { tool } from "@langchain/core/tools";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

// MCP Client for fetching tools from local server
let mcpClient: Client | null = null;
let mcpTools: any[] = [];
let isInitializing = false;

async function initializeMCPClient() {
  if (mcpClient) {
    console.log("✓ MCP client already initialized");
    return;
  }

  if (isInitializing) {
    console.log("⏳ MCP client initialization in progress, waiting...");
    while (isInitializing) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return;
  }

  isInitializing = true;

  try {
    console.log("🔧 Initializing MCP client...");
    
    // Create transport to connect to the Python MCP server using uv
    const transport = new StdioClientTransport({
      command: "C:\\Users\\MD TAUFIQ HUDA\\AppData\\Local\\Programs\\Python\\Python313\\Scripts\\uv.exe",
      args: ["run", "main.py"], 
      cwd: "D:\\Taufiq\\jobb\\WWS\\WWS-mcp-server", 
    });

    // // Create transport to connect to the deployed MCP server
    // const transport = new StreamableHTTPClientTransport(
    //   new URL("https://world-wise-scholars.fastmcp.app/mcp"),
    //   {
    //     requestInit: {
    //       headers: {
    //         Authorization: "Bearer YOUR_FASTMCP_API_KEY",
    //       },
    //     },
    //   }
    // );
    // Create client
    mcpClient = new Client(
      {
        name: "wws-idp-client",
        version: "1.0.0",
      }
    );

    // Connect with extended timeout
    console.log("⏳ Connecting to MCP server ...");
    
    const connectPromise = mcpClient.connect(transport);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Connection timeout after 60s")), 60000)
    );

    await Promise.race([connectPromise, timeoutPromise]);

    const response = await mcpClient.listTools();
    
    console.log(`✓ Tools in response: ${response.tools?.length || 0}`);

    if (response.tools && response.tools.length > 0) {
      console.log("\n🔧 Converting MCP tools to LangChain tools:");
      
      // Convert MCP tools to LangChain tools
      for (const mcpTool of response.tools) {
        const langchainTool = tool(
          async (input: any) => {
            if (!mcpClient) throw new Error("MCP client not initialized");

            const result = await mcpClient.callTool({
              name: mcpTool.name,
              arguments: input,
            });
            if (result.content && Array.isArray(result.content) && result.content.length > 0) {
              const textContent = result.content.find((c: any) => c.type === "text");
              return textContent ? textContent.text : JSON.stringify(result.content);
            }
            
            return "Tool executed successfully";
          },
          {
            name: mcpTool.name,
            description: mcpTool.description || `MCP tool: ${mcpTool.name}`,
            schema: buildZodSchema(mcpTool.inputSchema),
          }
        );
        
        mcpTools.push(langchainTool);
        console.log(`   ✓ Added: ${mcpTool.name}`);
      }
      
    } else {
      console.warn("⚠️ No tools found in MCP server response");
    }
    
  } catch (error) {
    console.error("\n❌ Failed to initialize MCP client");
    console.error("Error:", error instanceof Error ? error.message : String(error));
    
    if (error instanceof Error && error.stack) {
      console.error("Stack trace:", error.stack);
    }
        
    mcpClient = null;
  } finally {
    isInitializing = false;
  }
}

// Helper function to build Zod schema from JSON Schema
function buildZodSchema(inputSchema: any): z.ZodObject<any> {
  if (!inputSchema || !inputSchema.properties) {
    return z.object({});
  }

  const schemaFields: Record<string, z.ZodTypeAny> = {};

  for (const [key, value] of Object.entries(inputSchema.properties)) {
    const prop = value as any;
    let fieldSchema: z.ZodTypeAny;

    switch (prop.type) {
      case "string":
        fieldSchema = z.string();
        break;
      case "number":
      case "integer":
        fieldSchema = z.number();
        break;
      case "boolean":
        fieldSchema = z.boolean();
        break;
      case "array":
        fieldSchema = z.array(z.any());
        break;
      case "object":
        fieldSchema = z.object({});
        break;
      default:
        fieldSchema = z.any();
    }

    if (prop.description) {
      fieldSchema = fieldSchema.describe(prop.description);
    }

    const required = inputSchema.required || [];
    if (!required.includes(key)) {
      fieldSchema = fieldSchema.optional();
    }

    schemaFields[key] = fieldSchema;
  }

  return z.object(schemaFields);
}

// Export function to get all tools (including MCP tools)
export async function getAllTools() {
  await initializeMCPClient();
  
  // Wait for tools to actually be populated
  let waitCount = 0;
  const maxWait = 30; // 3 seconds max (30 * 100ms)
  while (mcpTools.length === 0 && waitCount < maxWait) {
    await new Promise(resolve => setTimeout(resolve, 100));
    waitCount++;
  }
  
  if (mcpTools.length === 0) {
    console.warn("⚠️  No MCP tools available after waiting");
  } else {
    console.log(`✅ Returning ${mcpTools.length} MCP tools`);
  }
  
  return [...mcpTools];
}

// Cleanup function to close MCP connection
export async function closeMCPClient() {
  if (mcpClient) {
    console.log("🧹 Closing MCP client...");
    try {
      await mcpClient.close();
      console.log("✅ Closed successfully");
    } catch (error) {
      console.error("❌ Error closing:", error);
    }
    mcpClient = null;
    mcpTools = [];
  }
}

// Export function to check connection status
export function getMCPStatus() {
  return {
    connected: mcpClient !== null,
    toolCount: mcpTools.length,
    isInitializing,
  };
}
