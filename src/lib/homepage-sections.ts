export const HOMEPAGE_SECTION_MAX_LIMIT = 20;
export const HOMEPAGE_SECTION_MAX_COUNT = 20;

export interface HomepageSection {
  id: string;
  title: string;
  source: string;
  categoryId: string;
  enabled: boolean;
  order: number;
  limit: number;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const asTrimmedString = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

const asFiniteInteger = (value: unknown, fallback: number): number => {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
};

const isValidSection = (value: unknown): value is HomepageSection => {
  if (!isRecord(value)) return false;

  const order = typeof value.order === 'number' ? value.order : Number.NaN;
  const limit = typeof value.limit === 'number' ? value.limit : Number.NaN;

  return (
    asTrimmedString(value.id).length > 0 &&
    asTrimmedString(value.title).length > 0 &&
    asTrimmedString(value.source).length > 0 &&
    asTrimmedString(value.categoryId).length > 0 &&
    typeof value.enabled === 'boolean' &&
    Number.isInteger(order) &&
    order >= 0 &&
    Number.isInteger(limit) &&
    limit >= 1 &&
    limit <= HOMEPAGE_SECTION_MAX_LIMIT
  );
};

/**
 * Normalize persisted configuration before exposing it to the homepage.
 * Invalid entries are ignored so a single stale source cannot break the site.
 */
export function normalizeHomepageSections(value: unknown): HomepageSection[] {
  if (!Array.isArray(value)) return [];

  const seenIds = new Set<string>();
  return value
    .map((item, index) => {
      if (!isRecord(item)) return null;

      const section: HomepageSection = {
        id: asTrimmedString(item.id),
        title: asTrimmedString(item.title),
        source: asTrimmedString(item.source),
        categoryId: asTrimmedString(item.categoryId),
        enabled: item.enabled !== false,
        order: Math.max(0, asFiniteInteger(item.order, index)),
        limit: Math.min(
          HOMEPAGE_SECTION_MAX_LIMIT,
          Math.max(1, asFiniteInteger(item.limit, 12))
        ),
      };

      if (!isValidSection(section) || seenIds.has(section.id)) return null;
      seenIds.add(section.id);
      return section;
    })
    .filter((section): section is HomepageSection => section !== null)
    .sort((left, right) => left.order - right.order);
}

/** Return a user-facing validation message, or null for valid input. */
export function validateHomepageSections(value: unknown): string | null {
  if (!Array.isArray(value)) return '首页自定义栏目配置不合法';
  if (value.length > HOMEPAGE_SECTION_MAX_COUNT) {
    return `首页自定义栏目最多配置 ${HOMEPAGE_SECTION_MAX_COUNT} 个`;
  }

  const seenIds = new Set<string>();
  for (const item of value) {
    if (!isValidSection(item)) return '首页自定义栏目配置不合法';
    if (seenIds.has(item.id)) return '首页自定义栏目 ID 不能重复';
    seenIds.add(item.id);
  }

  return null;
}
