import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

/**
 * Example MCP client for interacting with the Cisco SMB MCP Server
 */
async function main() {
  // Create client instance
  const client = new Client(
    {
      name: "cisco-smb-client",
      version: "1.0.0",
    },
    {
      capabilities: {},
    }
  );

  // Connect to server using stdio transport
  const transport = new StdioClientTransport({
    command: "node",
    args: ["server/dist/index.js"],
  });

  await client.connect(transport);
  console.log("Connected to Cisco SMB MCP Server");

  try {
    // Example 1: Get server statistics
    console.log("\n=== Getting Statistics ===");
    const statsResult = await client.callTool({
      name: "get_statistics",
      arguments: {},
    });
    console.log(JSON.parse(((statsResult as any).content[0] as any).text));

    // Example 2: Semantic search for SNMP articles
    console.log("\n=== Semantic Search: SNMP Configuration ===");
    const searchResult = await client.callTool({
      name: "semantic_search",
      arguments: {
        query: "configure SNMP communities on switch",
        resource_types: ["articles"],
        top_k: 3,
        min_score: 0.1,
      },
    });
    const searchData = JSON.parse(
      ((searchResult as any).content[0] as any).text
    );
    console.log(
      `Found ${searchData.total_results} results (showing top ${searchData.returned_results}):`
    );
    searchData.results.forEach((result: any, idx: number) => {
      console.log(
        `\n${idx + 1}. ${result.item.title} (score: ${result.score.toFixed(3)})`
      );
      console.log(`   Series: ${result.item.series}`);
      console.log(`   URL: ${result.item.url}`);
    });

    // Example 3: List videos by category
    console.log("\n=== List Videos: Configuration Category ===");
    const videosResult = await client.callTool({
      name: "list_videos",
      arguments: {
        category: "Configuration",
        limit: 5,
      },
    });
    const videosData = JSON.parse(
      ((videosResult as any).content[0] as any).text
    );
    console.log(`Total configuration videos: ${videosData.total_count}`);
    videosData.videos.slice(0, 3).forEach((video: any, idx: number) => {
      console.log(`\n${idx + 1}. ${video.title}`);
      console.log(`   Duration: ${video.duration}`);
      console.log(`   URL: ${video.url}`);
    });

    // Example 4: List all prompts
    console.log("\n=== Available Prompt Templates ===");
    const promptsResult = await client.callTool({
      name: "list_prompts",
      arguments: {},
    });
    const promptsData = JSON.parse(
      ((promptsResult as any).content[0] as any).text
    );
    console.log(`Total prompts: ${promptsData.total_count}`);
    promptsData.prompts.slice(0, 5).forEach((prompt: any, idx: number) => {
      console.log(`\n${idx + 1}. ${prompt.name}`);
      console.log(`   Category: ${prompt.category}`);
      console.log(`   Description: ${prompt.description}`);
    });

    // Example 5: Get a specific prompt
    console.log("\n=== Get Specific Prompt: Troubleshoot Network ===");
    const promptResult = await client.callTool({
      name: "get_prompt",
      arguments: {
        prompt_id: "troubleshoot-network",
      },
    });
    const promptData = JSON.parse(
      ((promptResult as any).content[0] as any).text
    );
    console.log(`Name: ${promptData.name}`);
    console.log(`Template: ${promptData.template}`);

    // Example 6: Search across all resource types
    console.log(
      "\n=== Semantic Search: Wireless Access Points (All Resources) ==="
    );
    const multiSearchResult = await client.callTool({
      name: "semantic_search",
      arguments: {
        query: "wireless access point setup configuration",
        resource_types: ["articles", "videos", "prompts"],
        top_k: 5,
        min_score: 0.15,
      },
    });
    const multiSearchData = JSON.parse(
      ((multiSearchResult as any).content[0] as any).text
    );
    console.log(
      `Found ${multiSearchData.total_results} results across all resources:`
    );
    multiSearchData.results.forEach((result: any, idx: number) => {
      console.log(
        `\n${idx + 1}. [${result.type.toUpperCase()}] ${
          result.item.title || result.item.name
        } (score: ${result.score.toFixed(3)})`
      );
    });

    // Example 7: List available quizzes
    console.log("\n=== Available Quizzes ===");
    const quizzesResult = await client.callTool({
      name: "list_quizzes",
      arguments: {},
    });
    const quizzesData = JSON.parse(
      ((quizzesResult as any).content[0] as any).text
    );
    console.log(`Total quizzes: ${quizzesData.total_count}`);
    if (quizzesData.quizzes.length > 0) {
      quizzesData.quizzes.forEach((quiz: any, idx: number) => {
        console.log(`\n${idx + 1}. ${quiz.title}`);
        console.log(`   Difficulty: ${quiz.difficulty}`);
        console.log(`   Questions: ${quiz.question_count}`);
        console.log(`   Passing Score: ${quiz.passing_score}%`);
      });
    }

    // Example 8: Get a specific quiz
    if (quizzesData.quizzes.length > 0) {
      console.log("\n=== Get Quiz Details ===");
      const quizResult = await client.callTool({
        name: "get_quiz",
        arguments: {
          quiz_id: quizzesData.quizzes[0].id,
          include_answers: false,
        },
      });
      const quizData = JSON.parse(((quizResult as any).content[0] as any).text);
      console.log(`Title: ${quizData.title}`);
      console.log(`Description: ${quizData.description}`);
      console.log(`Questions: ${quizData.questions.length}`);
    }

    // Example 9: List available labs
    console.log("\n=== Available Labs ===");
    const labsResult = await client.callTool({
      name: "list_labs",
      arguments: {},
    });
    const labsData = JSON.parse(((labsResult as any).content[0] as any).text);
    console.log(`Total labs: ${labsData.total_count}`);
    if (labsData.labs.length > 0) {
      labsData.labs.forEach((lab: any, idx: number) => {
        console.log(`\n${idx + 1}. ${lab.title}`);
        console.log(`   Difficulty: ${lab.difficulty}`);
        console.log(`   Estimated Time: ${lab.estimated_time_minutes} minutes`);
      });
    }

    // Example 10: Submit feedback
    console.log("\n=== Submit Feedback ===");
    const feedbackResult = await client.callTool({
      name: "submit_feedback",
      arguments: {
        resource_type: "article",
        resource_id: "sample_article_123",
        user_id: "demo_user",
        rating: 5,
        comment: "Very helpful article!",
        feedback_type: "rating",
      },
    });
    const feedbackData = JSON.parse(
      ((feedbackResult as any).content[0] as any).text
    );
    console.log(`Feedback submitted: ${feedbackData.message}`);
    console.log(`Feedback ID: ${feedbackData.feedback_id}`);

    // Example 11: Get recommendations
    console.log("\n=== Get Personalized Recommendations ===");
    const recommendationsResult = await client.callTool({
      name: "get_recommendations",
      arguments: {
        user_context: {
          user_id: "demo_user",
          expertise_level: "intermediate",
          device_model: "CBS350",
          previous_queries: ["VLAN configuration", "port security"],
        },
        limit: 5,
      },
    });
    const recommendationsData = JSON.parse(
      ((recommendationsResult as any).content[0] as any).text
    );
    console.log(
      `Total recommendations: ${recommendationsData.total_recommendations}`
    );
    if (recommendationsData.recommendations.length > 0) {
      recommendationsData.recommendations.forEach((rec: any, idx: number) => {
        console.log(
          `\n${idx + 1}. [${rec.type.toUpperCase()}] ${
            rec.title
          } (score: ${rec.relevance_score.toFixed(3)})`
        );
        console.log(`   Reason: ${rec.reason}`);
      });
    }

    // Example 12: Compose a guide
    console.log("\n=== Compose Guide ===");
    const guideResult = await client.callTool({
      name: "compose_guide",
      arguments: {
        resource_ids: [
          { type: "article", id: "kmimages_1877_en_v1" },
          { type: "prompt", id: "troubleshoot-network" },
        ],
        format: "markdown",
        title: "VLAN Configuration Guide",
        description:
          "A comprehensive guide to configuring VLANs on Cisco switches",
      },
    });
    const guideData = ((guideResult as any).content[0] as any).text;
    console.log("Guide generated:");
    console.log(guideData.substring(0, 500) + "...");
  } catch (error) {
    console.error("Error calling tools:", error);
  } finally {
    await client.close();
    console.log("\n\nDisconnected from server");
  }
}

// Run the client
main().catch((error) => {
  console.error("Client error:", error);
  process.exit(1);
});
