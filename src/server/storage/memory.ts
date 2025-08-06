// In-memory storage implementations for documents and prompts
import {
  Document,
  CreateDocument,
  UpdateDocument,
  IDocumentStorage,
} from "../types.js";
import { Prompt, CreatePrompt, IPromptStorage } from "../types.js";
import { randomUUID } from "crypto";

export class MemoryDocumentStorage implements IDocumentStorage {
  private documents: Map<string, Document> = new Map();

  async getDocument(id: string): Promise<Document | null> {
    return this.documents.get(id) || null;
  }

  async getAllDocuments(): Promise<Document[]> {
    return Array.from(this.documents.values());
  }

  async createDocument(doc: CreateDocument): Promise<Document> {
    const id = randomUUID();
    const now = new Date();
    const document: Document = {
      id,
      title: doc.title,
      content: doc.content,
      tags: doc.tags || [],
      metadata: doc.metadata || {},
      createdAt: now,
      updatedAt: now,
    };

    this.documents.set(id, document);
    return document;
  }

  async updateDocument(doc: UpdateDocument): Promise<Document | null> {
    const existing = this.documents.get(doc.id);
    if (!existing) return null;

    const updated: Document = {
      ...existing,
      title: doc.title ?? existing.title,
      content: doc.content ?? existing.content,
      tags: doc.tags ?? existing.tags,
      metadata: doc.metadata ?? existing.metadata,
      updatedAt: new Date(),
    };

    this.documents.set(doc.id, updated);
    return updated;
  }

  async deleteDocument(id: string): Promise<boolean> {
    return this.documents.delete(id);
  }

  async searchDocuments(query: string, tags?: string[]): Promise<Document[]> {
    const allDocs = Array.from(this.documents.values());
    const lowerQuery = query.toLowerCase();

    return allDocs.filter((doc) => {
      // Search in title and content
      const matchesQuery =
        doc.title.toLowerCase().includes(lowerQuery) ||
        doc.content.toLowerCase().includes(lowerQuery);

      // Filter by tags if provided
      const matchesTags =
        !tags ||
        tags.length === 0 ||
        tags.some((tag) => doc.tags?.includes(tag));

      return matchesQuery && matchesTags;
    });
  }
}

export class MemoryPromptStorage implements IPromptStorage {
  private prompts: Map<string, Prompt> = new Map();

  async getPrompt(name: string): Promise<Prompt | null> {
    return this.prompts.get(name) || null;
  }

  async getAllPrompts(): Promise<Prompt[]> {
    return Array.from(this.prompts.values());
  }

  async createPrompt(prompt: CreatePrompt): Promise<Prompt> {
    if (this.prompts.has(prompt.name)) {
      throw new Error(`Prompt with name '${prompt.name}' already exists`);
    }

    const now = new Date();
    const newPrompt: Prompt = {
      name: prompt.name,
      description: prompt.description,
      arguments: prompt.arguments || [],
      template: prompt.template,
      tags: prompt.tags || [],
      createdAt: now,
      updatedAt: now,
    };

    this.prompts.set(prompt.name, newPrompt);
    return newPrompt;
  }

  async updatePrompt(prompt: Prompt): Promise<Prompt | null> {
    if (!this.prompts.has(prompt.name)) return null;

    const updated = {
      ...prompt,
      updatedAt: new Date(),
    };

    this.prompts.set(prompt.name, updated);
    return updated;
  }

  async deletePrompt(name: string): Promise<boolean> {
    return this.prompts.delete(name);
  }
}
