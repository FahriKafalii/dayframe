import { z } from "zod";
import { AppError } from "@dayframe/lib";
import { categoryRepository } from "@dayframe/repositories";
import type { Category, CategoryType } from "@dayframe/models";
import type { CategoryDto, CategoryTreeNode } from "@dayframe/types";

const CATEGORY_TYPES: CategoryType[] = ["income", "expense", "transfer", "saving"];

export const createCategorySchema = z.object({
  parent_id: z.string().uuid().nullable().optional(),
  type: z.enum(CATEGORY_TYPES as [CategoryType, ...CategoryType[]]),
  name: z.string().trim().min(1).max(80),
  emoji: z.string().max(40).optional(),
  color: z.string().max(20).optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  emoji: z.string().max(40).optional(),
  color: z.string().max(20).optional(),
  sort_order: z.number().int().min(0).optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

export type Locale = "tr" | "en";

function humanizeKey(key: string): string {
  // Last-resort fallback when i18n is missing for a category. Convert
  // `housing_rent` → `Housing Rent`, strip the user-prefix `u_` if present.
  // Better than showing snake_case to the end user.
  const stripped = key.startsWith("u_") ? key.slice(2) : key;
  return stripped
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function toDto(cat: Category, locale: Locale): CategoryDto {
  const i18n = (cat.i18n ?? {}) as { tr?: { name: string }; en?: { name: string } };
  const name =
    i18n[locale]?.name ?? i18n.en?.name ?? i18n.tr?.name ?? humanizeKey(cat.key);
  return {
    id: cat.id,
    parent_id: cat.parent_id,
    key: cat.key,
    type: cat.type,
    emoji: cat.emoji,
    color: cat.color,
    sort_order: cat.sort_order,
    is_system: cat.is_system,
    excluded_from_reports: cat.excluded_from_reports,
    name,
  };
}

function slugify(name: string): string {
  return name
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ı/g, "i")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export const categoryService = {
  async listFlat(userId: string, locale: Locale, type?: CategoryType): Promise<CategoryDto[]> {
    const cats = await categoryRepository.findAllByUser(userId, type);
    return cats.map((c) => toDto(c, locale));
  },

  async listTree(userId: string, locale: Locale, type?: CategoryType): Promise<CategoryTreeNode[]> {
    const cats = await categoryRepository.findAllByUser(userId, type);
    const byParent = new Map<string | null, Category[]>();
    for (const c of cats) {
      const key = c.parent_id ?? null;
      const arr = byParent.get(key) ?? [];
      arr.push(c);
      byParent.set(key, arr);
    }
    const build = (parent: string | null): CategoryTreeNode[] => {
      const list = byParent.get(parent) ?? [];
      return list.map((c) => ({
        ...toDto(c, locale),
        children: build(c.id),
      }));
    };
    return build(null);
  },

  async create(userId: string, input: CreateCategoryInput) {
    if (input.parent_id) {
      const parent = await categoryRepository.findByIdAndUser(input.parent_id, userId);
      if (!parent) throw new AppError("VALIDATION", "Parent category not found");
      if (parent.parent_id) {
        throw new AppError("VALIDATION", "Categories cannot be nested deeper than 2 levels");
      }
      if (parent.type !== input.type) {
        throw new AppError("VALIDATION", "Child category type must match parent");
      }
    }
    const baseKey = `u_${slugify(input.name)}`;
    let key = baseKey;
    let suffix = 1;
    while (await categoryRepository.findByKeyAndUser(key, userId)) {
      key = `${baseKey}_${suffix++}`;
    }
    return categoryRepository.create({
      user_id: userId,
      parent_id: input.parent_id ?? null,
      key,
      type: input.type,
      kind_default: null,
      emoji: input.emoji ?? null,
      color: input.color ?? null,
      sort_order: 9999,
      is_system: false,
      excluded_from_reports: false,
      i18n: { tr: { name: input.name }, en: { name: input.name } },
    });
  },

  async update(id: string, userId: string, input: UpdateCategoryInput) {
    const existing = await categoryRepository.findByIdAndUser(id, userId);
    if (!existing) throw new AppError("NOT_FOUND", "Category not found");

    const patch: Record<string, unknown> = {};
    if (input.emoji !== undefined) patch.emoji = input.emoji;
    if (input.color !== undefined) patch.color = input.color;
    if (input.sort_order !== undefined) patch.sort_order = input.sort_order;
    if (input.name !== undefined) {
      // System categories: only the rendered name changes (i18n), key stays.
      patch.i18n = {
        ...(existing.i18n ?? {}),
        tr: { name: input.name },
        en: { name: input.name },
      };
    }

    if (existing.is_system) {
      // System rows can be renamed/recolored via direct update bypassing the user-only repo guard.
      const { Category } = await import("@dayframe/models");
      await Category.update(patch, { where: { id, user_id: userId } });
      const reloaded = await categoryRepository.findByIdAndUser(id, userId);
      if (!reloaded) throw new AppError("NOT_FOUND", "Category not found");
      return reloaded;
    }

    const updated = await categoryRepository.updateByIdAndUser(id, userId, patch);
    if (!updated) throw new AppError("NOT_FOUND", "Category not found");
    return updated;
  },

  async remove(id: string, userId: string) {
    const cat = await categoryRepository.findByIdAndUser(id, userId);
    if (!cat) throw new AppError("NOT_FOUND", "Category not found");
    if (cat.is_system) {
      throw new AppError("FORBIDDEN", "System categories cannot be deleted");
    }
    const ok = await categoryRepository.deleteByIdAndUser(id, userId);
    if (!ok) throw new AppError("NOT_FOUND", "Category not found");
  },

  toDto,
};
