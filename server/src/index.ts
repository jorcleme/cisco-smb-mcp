import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";

// Types
interface Article {
  series: string;
  title: string;
  document_id: string;
  category: string;
  url: string;
  objective: string;
  applicable_devices: any[];
  intro: string;
  steps: any[];
}

interface Video {
  title: string;
  video_id: string;
  url: string;
  published_date: string;
  duration: string;
  description: string;
  tags: string[];
  transcript?: string;
  series: string[];
  category: string;
}

interface Prompt {
  id: string;
  name: string;
  description: string;
  template: string;
  category: string;
  tags: string[];
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  tags: string[];
  related_articles: string[];
  related_videos: string[];
  questions: QuizQuestion[];
  passing_score: number;
  time_limit_minutes: number;
}

interface QuizQuestion {
  id: string;
  question: string;
  type: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  points: number;
}

interface Lab {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  estimated_time_minutes: number;
  tags: string[];
  prerequisites: string[];
  related_articles: string[];
  related_videos: string[];
  related_quizzes: string[];
  objectives: string[];
  equipment_required: any[];
  topology: any;
  steps: LabStep[];
  validation: any;
  troubleshooting: any[];
  completion_criteria: string[];
}

interface LabStep {
  step_number: number;
  title: string;
  description: string;
  commands: string[];
  expected_output: string;
  verification: string;
  hints: string[];
}

interface Feedback {
  id: string;
  resource_type: string;
  resource_id: string;
  user_id: string;
  rating: number;
  comment: string;
  feedback_type: string;
  created_at: string;
  status: string;
}

interface UserContext {
  user_id?: string;
  role?: string;
  expertise_level?: string;
  device_model?: string;
  previous_queries?: string[];
  preferences?: any;
}

// Vector embedding utilities
function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

// Simple embedding function (using character frequency as a basic approach)
// In production, you'd use OpenAI, Cohere, or another embedding API
function createSimpleEmbedding(text: string): number[] {
  const normalized = text.toLowerCase();
  const vocab = "abcdefghijklmnopqrstuvwxyz0123456789 ";
  const embedding = new Array(vocab.length).fill(0);

  for (const char of normalized) {
    const idx = vocab.indexOf(char);
    if (idx !== -1) embedding[idx]++;
  }

  const magnitude = Math.sqrt(
    embedding.reduce((sum, val) => sum + val * val, 0)
  );
  return embedding.map((val) => val / (magnitude || 1));
}
const DATA_DIR = path.join(
  "C:",
  "Users",
  "jorcleme",
  "projects",
  "cisco-smb-mcp",
  "data"
);
// Data loading utilities
console.error(`Data directory: ${DATA_DIR}`);
async function loadArticles(): Promise<Article[]> {
  const data = await fs.readFile(path.join(DATA_DIR, "articles.json"), "utf-8");
  return JSON.parse(data);
}

async function loadVideos(): Promise<Video[]> {
  const data = await fs.readFile(path.join(DATA_DIR, "videos.json"), "utf-8");
  return JSON.parse(data);
}

async function loadPrompts(): Promise<Prompt[]> {
  try {
    const data = await fs.readFile(
      path.join(DATA_DIR, "prompts.json"),
      "utf-8"
    );
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function loadQuizzes(): Promise<Quiz[]> {
  try {
    const data = await fs.readFile(
      path.join(DATA_DIR, "quizzes.json"),
      "utf-8"
    );
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function loadLabs(): Promise<Lab[]> {
  try {
    const data = await fs.readFile(path.join(DATA_DIR, "labs.json"), "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function loadFeedback(): Promise<Feedback[]> {
  try {
    const data = await fs.readFile(
      path.join(DATA_DIR, "feedback.json"),
      "utf-8"
    );
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function saveFeedback(feedback: Feedback[]): Promise<void> {
  await fs.writeFile(
    path.join(DATA_DIR, "feedback.json"),
    JSON.stringify(feedback, null, 2),
    "utf-8"
  );
}

// Create server instance
const server = new McpServer({
  name: "cisco-smb-mcp-server",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
    prompts: {},
  },
});

// Tool: Semantic Search with Vector Embeddings
server.tool(
  "semantic_search",
  "Search across articles, videos, and prompts using semantic similarity with vector embeddings",
  {
    query: z.string().describe("The search query to find relevant content"),
    resource_types: z
      .array(z.enum(["articles", "videos", "prompts"]))
      .optional()
      .describe("Types of resources to search (default: all)"),
    top_k: z
      .number()
      .min(1)
      .max(50)
      .default(5)
      .describe("Number of top results to return"),
    min_score: z
      .number()
      .min(0)
      .max(1)
      .default(0.1)
      .describe("Minimum similarity score threshold (0-1)"),
  },
  async ({
    query,
    resource_types = ["articles", "videos", "prompts"],
    top_k = 5,
    min_score = 0.1,
  }) => {
    const queryEmbedding = createSimpleEmbedding(query);
    const results: Array<{ type: string; score: number; item: any }> = [];

    // Search articles
    if (resource_types.includes("articles")) {
      const articles = await loadArticles();
      for (const article of articles) {
        const text = `${article.title} ${article.objective} ${article.intro} ${article.series}`;
        const embedding = createSimpleEmbedding(text);
        const score = cosineSimilarity(queryEmbedding, embedding);

        if (score >= min_score) {
          results.push({
            type: "article",
            score,
            item: {
              title: article.title,
              series: article.series,
              category: article.category,
              url: article.url,
              objective: article.objective,
              document_id: article.document_id,
            },
          });
        }
      }
    }

    // Search videos
    if (resource_types.includes("videos")) {
      const videos = await loadVideos();
      for (const video of videos) {
        const text = `${video.title} ${video.description} ${video.tags.join(
          " "
        )} ${video.series.join(" ")}`;
        const embedding = createSimpleEmbedding(text);
        const score = cosineSimilarity(queryEmbedding, embedding);

        if (score >= min_score) {
          results.push({
            type: "video",
            score,
            item: {
              title: video.title,
              video_id: video.video_id,
              url: video.url,
              duration: video.duration,
              series: video.series,
              category: video.category,
              published_date: video.published_date,
            },
          });
        }
      }
    }

    // Search prompts
    if (resource_types.includes("prompts")) {
      const prompts = await loadPrompts();
      for (const prompt of prompts) {
        const text = `${prompt.name} ${prompt.description} ${prompt.tags.join(
          " "
        )}`;
        const embedding = createSimpleEmbedding(text);
        const score = cosineSimilarity(queryEmbedding, embedding);

        if (score >= min_score) {
          results.push({
            type: "prompt",
            score,
            item: {
              id: prompt.id,
              name: prompt.name,
              description: prompt.description,
              category: prompt.category,
              tags: prompt.tags,
            },
          });
        }
      }
    }

    // Sort by score and take top_k
    results.sort((a, b) => b.score - a.score);
    const topResults = results.slice(0, top_k);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              query,
              total_results: results.length,
              returned_results: topResults.length,
              results: topResults,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// Tool: Get Article by Document ID
server.tool(
  "get_article",
  "Retrieve a specific article by its document ID with full details including steps",
  {
    document_id: z.string().describe("The document ID of the article"),
  },
  async ({ document_id }) => {
    const articles = await loadArticles();
    const article = articles.find((a) => a.document_id === document_id);

    if (!article) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { error: "Article not found", document_id },
              null,
              2
            ),
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(article, null, 2),
        },
      ],
    };
  }
);

// Tool: List Articles by Series
server.tool(
  "list_articles",
  "List articles filtered by series, category, or device",
  {
    series: z.string().optional().describe("Filter by series name"),
    category: z
      .string()
      .optional()
      .describe("Filter by category (e.g., Configuration, Troubleshooting)"),
    device: z.string().optional().describe("Filter by device model"),
  },
  async ({ series, category, device }) => {
    let articles = await loadArticles();

    if (series) {
      articles = articles.filter((a) =>
        a.series.toLowerCase().includes(series.toLowerCase())
      );
    }

    if (category) {
      articles = articles.filter(
        (a) => a.category.toLowerCase() === category.toLowerCase()
      );
    }

    if (device) {
      articles = articles.filter((a) =>
        a.applicable_devices.some((d) =>
          d.device.toLowerCase().includes(device.toLowerCase())
        )
      );
    }

    const summary = articles.map((a) => ({
      document_id: a.document_id,
      title: a.title,
      series: a.series,
      category: a.category,
      url: a.url,
    }));

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              total_count: summary.length,
              filters: { series, category, device },
              articles: summary,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// Tool: Get Video by ID
server.tool(
  "get_video",
  "Retrieve a specific video by its video ID with full details",
  {
    video_id: z.string().describe("The YouTube video ID"),
  },
  async ({ video_id }) => {
    const videos = await loadVideos();
    const video = videos.find((v) => v.video_id === video_id);

    if (!video) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { error: "Video not found", video_id },
              null,
              2
            ),
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(video, null, 2),
        },
      ],
    };
  }
);

// Tool: List Videos
server.tool(
  "list_videos",
  "List videos filtered by series, category, or tags",
  {
    series: z.string().optional().describe("Filter by series name"),
    category: z.string().optional().describe("Filter by category"),
    tag: z.string().optional().describe("Filter by tag"),
    limit: z
      .number()
      .min(1)
      .max(100)
      .default(20)
      .describe("Maximum number of results"),
  },
  async ({ series, category, tag, limit = 20 }) => {
    let videos = await loadVideos();

    if (series) {
      videos = videos.filter((v) =>
        v.series.some((s) => s.toLowerCase().includes(series.toLowerCase()))
      );
    }

    if (category) {
      videos = videos.filter(
        (v) => v.category.toLowerCase() === category.toLowerCase()
      );
    }

    if (tag) {
      videos = videos.filter((v) =>
        v.tags.some((t) => t.toLowerCase().includes(tag.toLowerCase()))
      );
    }

    const summary = videos.slice(0, limit).map((v) => ({
      video_id: v.video_id,
      title: v.title,
      url: v.url,
      duration: v.duration,
      series: v.series,
      category: v.category,
      published_date: v.published_date,
    }));

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              total_count: videos.length,
              returned_count: summary.length,
              filters: { series, category, tag },
              videos: summary,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// Tool: Get Prompt by ID
server.tool(
  "get_prompt",
  "Retrieve a specific prompt template by its ID",
  {
    prompt_id: z.string().describe("The prompt ID"),
  },
  async ({ prompt_id }) => {
    const prompts = await loadPrompts();
    const prompt = prompts.find((p) => p.id === prompt_id);

    if (!prompt) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { error: "Prompt not found", prompt_id },
              null,
              2
            ),
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(prompt, null, 2),
        },
      ],
    };
  }
);

// Tool: List Prompts
server.tool(
  "list_prompts",
  "List all available prompt templates, optionally filtered by category or tag",
  {
    category: z.string().optional().describe("Filter by category"),
    tag: z.string().optional().describe("Filter by tag"),
  },
  async ({ category, tag }) => {
    let prompts = await loadPrompts();

    if (category) {
      prompts = prompts.filter(
        (p) => p.category.toLowerCase() === category.toLowerCase()
      );
    }

    if (tag) {
      prompts = prompts.filter((p) =>
        p.tags.some((t) => t.toLowerCase().includes(tag.toLowerCase()))
      );
    }

    const summary = prompts.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      category: p.category,
      tags: p.tags,
    }));

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              total_count: summary.length,
              filters: { category, tag },
              prompts: summary,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// Tool: Get Statistics
server.tool(
  "get_statistics",
  "Get statistics about available resources (articles, videos, prompts, quizzes, labs)",
  {},
  async () => {
    const articles = await loadArticles();
    const videos = await loadVideos();
    const prompts = await loadPrompts();
    const quizzes = await loadQuizzes();
    const labs = await loadLabs();
    const feedback = await loadFeedback();

    const articleSeries = new Set(articles.map((a) => a.series));
    const articleCategories = new Set(articles.map((a) => a.category));
    const videoSeries = new Set(videos.flatMap((v) => v.series));
    const videoCategories = new Set(videos.map((v) => v.category));
    const quizCategories = new Set(quizzes.map((q) => q.category));
    const labCategories = new Set(labs.map((l) => l.category));

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              articles: {
                total: articles.length,
                series: Array.from(articleSeries),
                categories: Array.from(articleCategories),
              },
              videos: {
                total: videos.length,
                series: Array.from(videoSeries),
                categories: Array.from(videoCategories),
              },
              prompts: {
                total: prompts.length,
              },
              quizzes: {
                total: quizzes.length,
                categories: Array.from(quizCategories),
              },
              labs: {
                total: labs.length,
                categories: Array.from(labCategories),
              },
              feedback: {
                total: feedback.length,
              },
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// Tool: Compose Guide
server.tool(
  "compose_guide",
  "Combine multiple resources (articles, videos, prompts) into a single formatted guide",
  {
    resource_ids: z
      .array(
        z.object({
          type: z.enum(["article", "video", "prompt"]),
          id: z.string(),
        })
      )
      .describe("Array of resource identifiers to include in the guide"),
    format: z
      .enum(["markdown", "html", "json"])
      .default("markdown")
      .describe("Output format for the guide"),
    title: z.string().optional().describe("Optional title for the guide"),
    description: z
      .string()
      .optional()
      .describe("Optional description for the guide"),
  },
  async ({ resource_ids, format = "markdown", title, description }) => {
    const articles = await loadArticles();
    const videos = await loadVideos();
    const prompts = await loadPrompts();

    const compiledResources: any[] = [];

    // Fetch each requested resource
    for (const resource of resource_ids) {
      if (resource.type === "article") {
        const article = articles.find((a) => a.document_id === resource.id);
        if (article) compiledResources.push({ type: "article", data: article });
      } else if (resource.type === "video") {
        const video = videos.find((v) => v.video_id === resource.id);
        if (video) compiledResources.push({ type: "video", data: video });
      } else if (resource.type === "prompt") {
        const prompt = prompts.find((p) => p.id === resource.id);
        if (prompt) compiledResources.push({ type: "prompt", data: prompt });
      }
    }

    // Format the guide based on requested format
    let formattedGuide = "";

    if (format === "markdown") {
      if (title) formattedGuide += `# ${title}\n\n`;
      if (description) formattedGuide += `${description}\n\n`;

      for (const resource of compiledResources) {
        if (resource.type === "article") {
          const a = resource.data;
          formattedGuide += `## Article: ${a.title}\n\n`;
          formattedGuide += `**Series:** ${a.series}\n`;
          formattedGuide += `**Category:** ${a.category}\n`;
          formattedGuide += `**URL:** [${a.url}](${a.url})\n\n`;
          formattedGuide += `**Objective:** ${a.objective}\n\n`;
          if (a.intro) formattedGuide += `${a.intro}\n\n`;
          formattedGuide += `---\n\n`;
        } else if (resource.type === "video") {
          const v = resource.data;
          formattedGuide += `## Video: ${v.title}\n\n`;
          formattedGuide += `**Duration:** ${v.duration}\n`;
          formattedGuide += `**URL:** [${v.url}](${v.url})\n`;
          formattedGuide += `**Published:** ${v.published_date}\n\n`;
          formattedGuide += `${v.description}\n\n`;
          formattedGuide += `---\n\n`;
        } else if (resource.type === "prompt") {
          const p = resource.data;
          formattedGuide += `## Prompt: ${p.name}\n\n`;
          formattedGuide += `${p.description}\n\n`;
          formattedGuide += `\`\`\`\n${p.template}\n\`\`\`\n\n`;
          formattedGuide += `---\n\n`;
        }
      }
    } else if (format === "html") {
      formattedGuide = "<html><body>";
      if (title) formattedGuide += `<h1>${title}</h1>`;
      if (description) formattedGuide += `<p>${description}</p>`;

      for (const resource of compiledResources) {
        if (resource.type === "article") {
          const a = resource.data;
          formattedGuide += `<h2>Article: ${a.title}</h2>`;
          formattedGuide += `<p><strong>Series:</strong> ${a.series}</p>`;
          formattedGuide += `<p><strong>Category:</strong> ${a.category}</p>`;
          formattedGuide += `<p><strong>URL:</strong> <a href="${a.url}">${a.url}</a></p>`;
          formattedGuide += `<p><strong>Objective:</strong> ${a.objective}</p>`;
          if (a.intro) formattedGuide += `<p>${a.intro}</p>`;
          formattedGuide += `<hr/>`;
        } else if (resource.type === "video") {
          const v = resource.data;
          formattedGuide += `<h2>Video: ${v.title}</h2>`;
          formattedGuide += `<p><strong>Duration:</strong> ${v.duration}</p>`;
          formattedGuide += `<p><strong>URL:</strong> <a href="${v.url}">${v.url}</a></p>`;
          formattedGuide += `<p>${v.description}</p>`;
          formattedGuide += `<hr/>`;
        } else if (resource.type === "prompt") {
          const p = resource.data;
          formattedGuide += `<h2>Prompt: ${p.name}</h2>`;
          formattedGuide += `<p>${p.description}</p>`;
          formattedGuide += `<pre>${p.template}</pre>`;
          formattedGuide += `<hr/>`;
        }
      }
      formattedGuide += "</body></html>";
    } else {
      // JSON format
      formattedGuide = JSON.stringify(
        {
          title,
          description,
          resources: compiledResources,
        },
        null,
        2
      );
    }

    return {
      content: [
        {
          type: "text",
          text: formattedGuide,
        },
      ],
    };
  }
);

// Tool: Get Quiz
server.tool(
  "get_quiz",
  "Retrieve a specific quiz by ID with all questions and metadata",
  {
    quiz_id: z.string().describe("The quiz ID"),
    include_answers: z
      .boolean()
      .default(false)
      .describe("Include correct answers (for grading mode)"),
  },
  async ({ quiz_id, include_answers = false }) => {
    const quizzes = await loadQuizzes();
    const quiz = quizzes.find((q) => q.id === quiz_id);

    if (!quiz) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ error: "Quiz not found", quiz_id }, null, 2),
          },
        ],
      };
    }

    // Hide correct answers unless explicitly requested
    const sanitizedQuiz = {
      ...quiz,
      questions: quiz.questions.map((q) => ({
        id: q.id,
        question: q.question,
        type: q.type,
        options: q.options,
        points: q.points,
        ...(include_answers && {
          correct_answer: q.correct_answer,
          explanation: q.explanation,
        }),
      })),
    };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(sanitizedQuiz, null, 2),
        },
      ],
    };
  }
);

// Tool: List Quizzes
server.tool(
  "list_quizzes",
  "List available quizzes with optional filtering",
  {
    category: z.string().optional().describe("Filter by category"),
    difficulty: z
      .string()
      .optional()
      .describe("Filter by difficulty (beginner, intermediate, advanced)"),
    tag: z.string().optional().describe("Filter by tag"),
  },
  async ({ category, difficulty, tag }) => {
    let quizzes = await loadQuizzes();

    if (category) {
      quizzes = quizzes.filter(
        (q) => q.category.toLowerCase() === category.toLowerCase()
      );
    }

    if (difficulty) {
      quizzes = quizzes.filter(
        (q) => q.difficulty.toLowerCase() === difficulty.toLowerCase()
      );
    }

    if (tag) {
      quizzes = quizzes.filter((q) =>
        q.tags.some((t) => t.toLowerCase().includes(tag.toLowerCase()))
      );
    }

    const summary = quizzes.map((q) => ({
      id: q.id,
      title: q.title,
      description: q.description,
      category: q.category,
      difficulty: q.difficulty,
      question_count: q.questions.length,
      passing_score: q.passing_score,
      time_limit_minutes: q.time_limit_minutes,
      tags: q.tags,
    }));

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              total_count: summary.length,
              filters: { category, difficulty, tag },
              quizzes: summary,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// Tool: Get Lab
server.tool(
  "get_lab",
  "Retrieve a specific hands-on lab exercise by ID",
  {
    lab_id: z.string().describe("The lab ID"),
  },
  async ({ lab_id }) => {
    const labs = await loadLabs();
    const lab = labs.find((l) => l.id === lab_id);

    if (!lab) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ error: "Lab not found", lab_id }, null, 2),
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(lab, null, 2),
        },
      ],
    };
  }
);

// Tool: List Labs
server.tool(
  "list_labs",
  "List available lab exercises with optional filtering",
  {
    category: z.string().optional().describe("Filter by category"),
    difficulty: z
      .string()
      .optional()
      .describe("Filter by difficulty (beginner, intermediate, advanced)"),
    tag: z.string().optional().describe("Filter by tag"),
    max_time: z
      .number()
      .optional()
      .describe("Filter by maximum estimated time in minutes"),
  },
  async ({ category, difficulty, tag, max_time }) => {
    let labs = await loadLabs();

    if (category) {
      labs = labs.filter(
        (l) => l.category.toLowerCase() === category.toLowerCase()
      );
    }

    if (difficulty) {
      labs = labs.filter(
        (l) => l.difficulty.toLowerCase() === difficulty.toLowerCase()
      );
    }

    if (tag) {
      labs = labs.filter((l) =>
        l.tags.some((t) => t.toLowerCase().includes(tag.toLowerCase()))
      );
    }

    if (max_time) {
      labs = labs.filter((l) => l.estimated_time_minutes <= max_time);
    }

    const summary = labs.map((l) => ({
      id: l.id,
      title: l.title,
      description: l.description,
      category: l.category,
      difficulty: l.difficulty,
      estimated_time_minutes: l.estimated_time_minutes,
      tags: l.tags,
      prerequisites: l.prerequisites,
    }));

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              total_count: summary.length,
              filters: { category, difficulty, tag, max_time },
              labs: summary,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// Tool: Submit Feedback
server.tool(
  "submit_feedback",
  "Submit user feedback for any resource (article, video, quiz, lab, prompt)",
  {
    resource_type: z
      .enum(["article", "video", "quiz", "lab", "prompt"])
      .describe("Type of resource being rated"),
    resource_id: z.string().describe("ID of the resource"),
    user_id: z.string().describe("User identifier"),
    rating: z
      .number()
      .min(1)
      .max(5)
      .optional()
      .describe("Rating from 1-5 stars"),
    comment: z.string().optional().describe("Optional text feedback"),
    feedback_type: z
      .enum(["rating", "comment", "flag"])
      .default("rating")
      .describe("Type of feedback being submitted"),
  },
  async ({
    resource_type,
    resource_id,
    user_id,
    rating,
    comment,
    feedback_type = "rating",
  }) => {
    const feedbackList = await loadFeedback();

    const newFeedback: Feedback = {
      id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      resource_type,
      resource_id,
      user_id,
      rating: rating || 0,
      comment: comment || "",
      feedback_type,
      created_at: new Date().toISOString(),
      status: "active",
    };

    feedbackList.push(newFeedback);
    await saveFeedback(feedbackList);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: true,
              feedback_id: newFeedback.id,
              message: "Feedback submitted successfully",
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// Tool: Get Recommendations
server.tool(
  "get_recommendations",
  "Get personalized resource recommendations based on user context and preferences",
  {
    user_context: z
      .object({
        user_id: z.string().optional(),
        role: z.string().optional(),
        expertise_level: z
          .enum(["beginner", "intermediate", "advanced"])
          .optional(),
        device_model: z.string().optional(),
        previous_queries: z.array(z.string()).optional(),
      })
      .optional()
      .describe("User context for personalization"),
    limit: z
      .number()
      .min(1)
      .max(20)
      .default(5)
      .describe("Number of recommendations to return"),
  },
  async ({ user_context, limit = 5 }) => {
    const articles = await loadArticles();
    const videos = await loadVideos();
    const quizzes = await loadQuizzes();
    const labs = await loadLabs();
    const feedback = await loadFeedback();

    const recommendations: Array<{
      type: string;
      id: string;
      title: string;
      relevance_score: number;
      reason: string;
    }> = [];

    // Calculate average ratings for resources
    const ratings = new Map<string, { sum: number; count: number }>();
    for (const fb of feedback) {
      if (fb.rating > 0) {
        const key = `${fb.resource_type}_${fb.resource_id}`;
        const current = ratings.get(key) || { sum: 0, count: 0 };
        ratings.set(key, {
          sum: current.sum + fb.rating,
          count: current.count + 1,
        });
      }
    }

    // Recommend based on expertise level
    if (user_context?.expertise_level) {
      // Recommend quizzes matching expertise
      const matchingQuizzes = quizzes.filter(
        (q) =>
          q.difficulty.toLowerCase() ===
          user_context.expertise_level?.toLowerCase()
      );
      for (const quiz of matchingQuizzes.slice(0, 2)) {
        const key = `quiz_${quiz.id}`;
        const rating = ratings.get(key);
        const avgRating = rating ? rating.sum / rating.count : 3;

        recommendations.push({
          type: "quiz",
          id: quiz.id,
          title: quiz.title,
          relevance_score: avgRating / 5,
          reason: `Matches your ${user_context.expertise_level} skill level`,
        });
      }

      // Recommend labs matching expertise
      const matchingLabs = labs.filter(
        (l) =>
          l.difficulty.toLowerCase() ===
          user_context.expertise_level?.toLowerCase()
      );
      for (const lab of matchingLabs.slice(0, 2)) {
        const key = `lab_${lab.id}`;
        const rating = ratings.get(key);
        const avgRating = rating ? rating.sum / rating.count : 3;

        recommendations.push({
          type: "lab",
          id: lab.id,
          title: lab.title,
          relevance_score: avgRating / 5,
          reason: `Hands-on practice for ${user_context.expertise_level} level`,
        });
      }
    }

    // Recommend based on device model
    if (user_context?.device_model) {
      const matchingArticles = articles.filter((a) =>
        a.applicable_devices.some((d) =>
          d.device
            .toLowerCase()
            .includes(user_context.device_model!.toLowerCase())
        )
      );
      for (const article of matchingArticles.slice(0, 2)) {
        const key = `article_${article.document_id}`;
        const rating = ratings.get(key);
        const avgRating = rating ? rating.sum / rating.count : 3;

        recommendations.push({
          type: "article",
          id: article.document_id,
          title: article.title,
          relevance_score: avgRating / 5,
          reason: `Relevant to your ${user_context.device_model} device`,
        });
      }
    }

    // Recommend based on previous queries
    if (
      user_context?.previous_queries &&
      user_context.previous_queries.length > 0
    ) {
      const lastQuery =
        user_context.previous_queries[user_context.previous_queries.length - 1];
      const queryEmbedding = createSimpleEmbedding(lastQuery);

      // Find related videos
      for (const video of videos) {
        const text = `${video.title} ${video.description}`;
        const embedding = createSimpleEmbedding(text);
        const score = cosineSimilarity(queryEmbedding, embedding);

        if (score > 0.3) {
          const key = `video_${video.video_id}`;
          const rating = ratings.get(key);
          const avgRating = rating ? rating.sum / rating.count : 3;

          recommendations.push({
            type: "video",
            id: video.video_id,
            title: video.title,
            relevance_score: (score + avgRating / 5) / 2,
            reason: "Related to your recent searches",
          });
        }
      }
    }

    // Sort by relevance and take top results
    recommendations.sort((a, b) => b.relevance_score - a.relevance_score);
    const topRecommendations = recommendations.slice(0, limit);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              user_context,
              total_recommendations: recommendations.length,
              returned_count: topRecommendations.length,
              recommendations: topRecommendations,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Cisco SMB MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
