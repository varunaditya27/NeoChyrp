import { prisma } from '@/src/lib/db';

export interface CreateModuleInput {
  slug: string;
  name: string;
  version?: string;
  description?: string | null;
}

export const modulesService = {
  async list() {
    return prisma.module.findMany({ include: { settings: true }, orderBy: { slug: 'asc' } });
  },
  async getBySlug(slug: string) {
    return prisma.module.findUnique({ where: { slug }, include: { settings: true } });
  },
  async create(data: CreateModuleInput) {
    return prisma.module.create({ data });
  },
  async update(slug: string, data: Partial<CreateModuleInput> & { enabled?: boolean }) {
    return prisma.module.update({ where: { slug }, data });
  },
  async toggle(slug: string, enabled: boolean) {
    return prisma.module.update({ where: { slug }, data: { enabled } });
  },
  async upsertSetting(slug: string, key: string, value: any) {
    const mod = await prisma.module.findUnique({ where: { slug } });
    if (!mod) throw new Error('Module not found');
    return prisma.moduleSetting.upsert({
      where: { moduleId_key: { moduleId: mod.id, key } },
      create: { moduleId: mod.id, key, value },
      update: { value }
    });
  },
  async getSettings(slug: string) {
    const mod = await prisma.module.findUnique({ where: { slug }, include: { settings: true } });
    return mod?.settings || [];
  }
};
