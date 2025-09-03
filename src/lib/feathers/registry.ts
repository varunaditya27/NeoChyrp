/**
 * Feather Registry and Type System
 * Manages content type definitions (Feathers) for posts
 */

import type { z } from 'zod';

export interface FeatherManifest {
  slug: string;
  name: string;
  version: string;
  description?: string;
  schema: z.ZodSchema; // Zod schema for validation
  fields: FeatherField[];
}

export interface FeatherField {
  name: string;
  type: 'text' | 'textarea' | 'markdown' | 'url' | 'media' | 'select' | 'multiselect' | 'number' | 'boolean' | 'checkbox' | 'file-list';
  label: string;
  required?: boolean;
  placeholder?: string;
  multiple?: boolean; // for file fields
  options?: Array<{ value: string; label: string }>; // for select fields
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface FeatherContext {
  user?: unknown;
  request?: unknown;
}

export interface FeatherRenderer<T = unknown> {
  (payload: T, context: FeatherContext): Promise<string> | string;
}

export interface FeatherExcerptGenerator<T = unknown> {
  (payload: T): string;
}

export interface RegisteredFeather {
  manifest: FeatherManifest;
  render: FeatherRenderer;
  generateExcerpt: FeatherExcerptGenerator;
}

class FeatherRegistryImpl {
  private feathers: Map<string, RegisteredFeather> = new Map();

  /**
   * Register a feather
   */
  register(
    manifest: FeatherManifest,
    render: FeatherRenderer,
    generateExcerpt: FeatherExcerptGenerator
  ): void {
    if (this.feathers.has(manifest.slug)) {
      throw new Error(`Feather ${manifest.slug} is already registered`);
    }

    this.feathers.set(manifest.slug, {
      manifest: manifest as FeatherManifest,
      render: render as FeatherRenderer,
      generateExcerpt: generateExcerpt as FeatherExcerptGenerator,
    });
  }

  /**
   * Get a feather by slug
   */
  getFeather(slug: string): RegisteredFeather | undefined {
    return this.feathers.get(slug);
  }

  /**
   * List all registered feathers
   */
  listFeathers(): Map<string, RegisteredFeather> {
    return new Map(this.feathers);
  }

  /**
   * Validate payload against feather schema
   */
  validatePayload(featherSlug: string, payload: unknown): { success: boolean; data?: unknown; error?: string } {
    const feather = this.feathers.get(featherSlug);
    if (!feather) {
      return { success: false, error: `Feather ${featherSlug} not found` };
    }

    try {
      const data = feather.manifest.schema.parse(payload);
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Validation failed'
      };
    }
  }

  /**
   * Render a post with its feather
   */
  async renderPost(featherSlug: string, payload: unknown, context: FeatherContext = {}): Promise<string> {
    const feather = this.feathers.get(featherSlug);
    if (!feather) {
      throw new Error(`Feather ${featherSlug} not found`);
    }

    // Validate payload first
    const validation = this.validatePayload(featherSlug, payload);
    if (!validation.success) {
      throw new Error(`Invalid payload: ${validation.error}`);
    }

    return await feather.render(validation.data, context);
  }

  /**
   * Generate excerpt for a post
   */
  generateExcerpt(featherSlug: string, payload: unknown): string {
    const feather = this.feathers.get(featherSlug);
    if (!feather) {
      throw new Error(`Feather ${featherSlug} not found`);
    }

    // Validate payload first
    const validation = this.validatePayload(featherSlug, payload);
    if (!validation.success) {
      throw new Error(`Invalid payload: ${validation.error}`);
    }

    return feather.generateExcerpt(validation.data);
  }
}

// Global feather registry
export const featherRegistry = new FeatherRegistryImpl();

/**
 * Helper to register a feather with common patterns
 */
export function registerFeather(
  manifest: FeatherManifest,
  render: FeatherRenderer,
  generateExcerpt: FeatherExcerptGenerator
): void {
  featherRegistry.register(manifest, render, generateExcerpt);
}
