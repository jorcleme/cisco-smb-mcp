// Type definitions for the MCP Document Storage Server
import { z } from "zod";

// Document schemas
export const DocumentSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  tags: z.array(z.string()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  metadata: z.record(z.any()).optional(),
});

export const CreateDocumentSchema = z.object({
  title: z.string(),
  content: z.string(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
});

export const UpdateDocumentSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  content: z.string().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
});

// Prompt schemas
export const PromptSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  arguments: z
    .array(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        required: z.boolean().optional(),
      })
    )
    .optional(),
  template: z.string(),
  tags: z.array(z.string()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreatePromptSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  arguments: z
    .array(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        required: z.boolean().optional(),
      })
    )
    .optional(),
  template: z.string(),
  tags: z.array(z.string()).optional(),
});

// Type exports
export type Document = z.infer<typeof DocumentSchema>;
export type CreateDocument = z.infer<typeof CreateDocumentSchema>;
export type UpdateDocument = z.infer<typeof UpdateDocumentSchema>;
export type Prompt = z.infer<typeof PromptSchema>;
export type CreatePrompt = z.infer<typeof CreatePromptSchema>;

// Storage interface
export interface IDocumentStorage {
  getDocument(id: string): Promise<Document | null>;
  getAllDocuments(): Promise<Document[]>;
  createDocument(doc: CreateDocument): Promise<Document>;
  updateDocument(doc: UpdateDocument): Promise<Document | null>;
  deleteDocument(id: string): Promise<boolean>;
  searchDocuments(query: string, tags?: string[]): Promise<Document[]>;
}

export interface IPromptStorage {
  getPrompt(name: string): Promise<Prompt | null>;
  getAllPrompts(): Promise<Prompt[]>;
  createPrompt(prompt: CreatePrompt): Promise<Prompt>;
  updatePrompt(prompt: Prompt): Promise<Prompt | null>;
  deletePrompt(name: string): Promise<boolean>;
}
