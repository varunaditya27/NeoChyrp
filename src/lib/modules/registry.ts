/**
 * Module Registry and Management System
 * Handles registration, activation, and lifecycle of NeoChyrp modules
 */

import type { EventSubscription } from '../events/index';

export interface ModuleContext {
  // Services available to modules
  db: unknown; // Prisma client
  cache: unknown; // Cache service
  logger: unknown; // Logger service
  settings: unknown; // Settings service
  events: unknown; // Event bus
  storage: unknown; // File storage service
}

export interface ModuleManifest {
  slug: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  dependencies?: string[]; // Other module slugs
  config?: {
    schema: unknown; // Zod schema for configuration
    defaults: Record<string, unknown>;
  };
}

export interface ModuleInstance {
  manifest: ModuleManifest;
  activate(ctx: ModuleContext): Promise<void> | void;
  deactivate?(): Promise<void> | void;
  config?: Record<string, unknown>;
  subscriptions?: EventSubscription[];
}

export interface RegisteredModule {
  instance: ModuleInstance;
  active: boolean;
  config: Record<string, unknown>;
  activatedAt?: Date;
  error?: string;
}

class ModuleRegistryImpl {
  private modules: Map<string, RegisteredModule> = new Map();
  private context?: ModuleContext;

  /**
   * Set the module context (services)
   */
  setContext(ctx: ModuleContext): void {
    this.context = ctx;
  }

  /**
   * Register a module
   */
  register(module: ModuleInstance): void {
    const { slug } = module.manifest;

    if (this.modules.has(slug)) {
      throw new Error(`Module ${slug} is already registered`);
    }

    this.modules.set(slug, {
      instance: module,
      active: false,
      config: module.config || {},
    });
  }

  /**
   * Activate a module
   */
  async activate(slug: string): Promise<void> {
    const registered = this.modules.get(slug);
    if (!registered) {
      throw new Error(`Module ${slug} is not registered`);
    }

    if (registered.active) {
      return; // Already active
    }

    if (!this.context) {
      throw new Error('Module context not set');
    }

    try {
      // Check dependencies
      const deps = registered.instance.manifest.dependencies || [];
      for (const dep of deps) {
        const depModule = this.modules.get(dep);
        if (!depModule || !depModule.active) {
          throw new Error(`Dependency ${dep} is not active`);
        }
      }

      await registered.instance.activate(this.context);

      registered.active = true;
      registered.activatedAt = new Date();
      registered.error = undefined;
    } catch (error) {
      registered.error = error instanceof Error ? error.message : String(error);
      throw error;
    }
  }

  /**
   * Deactivate a module
   */
  async deactivate(slug: string): Promise<void> {
    const registered = this.modules.get(slug);
    if (!registered || !registered.active) {
      return;
    }

    try {
      // Clean up event subscriptions
      if (registered.instance.subscriptions) {
        registered.instance.subscriptions.forEach(sub => sub.unsubscribe());
        registered.instance.subscriptions = [];
      }

      if (registered.instance.deactivate) {
        await registered.instance.deactivate();
      }

      registered.active = false;
      registered.activatedAt = undefined;
      registered.error = undefined;
    } catch (error) {
      registered.error = error instanceof Error ? error.message : String(error);
      throw error;
    }
  }

  /**
   * Get module status
   */
  getModule(slug: string): RegisteredModule | undefined {
    return this.modules.get(slug);
  }

  /**
   * List all modules
   */
  listModules(): Map<string, RegisteredModule> {
    return new Map(this.modules);
  }

  /**
   * Get active modules
   */
  getActiveModules(): RegisteredModule[] {
    return Array.from(this.modules.values()).filter(m => m.active);
  }

  /**
   * Update module configuration
   */
  updateConfig(slug: string, config: Record<string, unknown>): void {
    const registered = this.modules.get(slug);
    if (!registered) {
      throw new Error(`Module ${slug} is not registered`);
    }

    // TODO: Validate against schema if provided
    registered.config = { ...registered.config, ...config };
    registered.instance.config = registered.config;
  }
}

// Global module registry
export const moduleRegistry = new ModuleRegistryImpl();

/**
 * Decorator for easy module registration
 */
export function registerModule(module: ModuleInstance): void {
  moduleRegistry.register(module);
}

/**
 * Helper to create a module with common patterns
 */
export function createModule(
  manifest: ModuleManifest,
  handlers: {
    activate: (ctx: ModuleContext) => Promise<void> | void;
    deactivate?: () => Promise<void> | void;
  }
): ModuleInstance {
  return {
    manifest,
    activate: handlers.activate,
    deactivate: handlers.deactivate,
    subscriptions: [],
  };
}
