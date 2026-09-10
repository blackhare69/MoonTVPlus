import {
  mergeHomepageSectionResults,
  normalizeHomepageSections,
  validateHomepageSections,
} from './homepage-sections';
import type { SearchResult } from './types';

describe('homepage section configuration', () => {
  it('sorts valid sections and drops invalid entries', () => {
    const sections = normalizeHomepageSections([
      {
        id: 'series',
        title: '剧集专区',
        sources: [{ source: 'source-b', categoryId: '2' }],
        enabled: true,
        order: 2,
        limit: 12,
      },
      {
        id: 'missing-category',
        title: '无效栏目',
        source: '',
        categoryId: '1',
        enabled: true,
        order: 1,
        limit: 12,
      },
      {
        id: 'movies',
        title: '电影专区',
        sources: [
          { source: 'source-a', categoryId: '' },
          { source: 'source-b', categoryId: '1' },
        ],
        enabled: true,
        order: 1,
        limit: 8,
      },
    ]);

    expect(sections.map((section) => section.id)).toEqual(['movies', 'series']);
    expect(sections[0].sources).toEqual([
      { source: 'source-a', categoryId: '' },
      { source: 'source-b', categoryId: '1' },
    ]);
    expect(sections[1].sources).toEqual([
      { source: 'source-b', categoryId: '2' },
    ]);
  });

  it('rejects duplicate ids and limits outside the supported range', () => {
    expect(
      validateHomepageSections([
        {
          id: 'same',
          title: '栏目一',
          sources: [{ source: 'source-a', categoryId: '1' }],
          enabled: true,
          order: 0,
          limit: 12,
        },
        {
          id: 'same',
          title: '栏目二',
          sources: [{ source: 'source-b', categoryId: '2' }],
          enabled: true,
          order: 1,
          limit: 0,
        },
      ])
    ).toContain('不合法');
  });

  it('accepts an empty list so the feature can be disabled', () => {
    expect(validateHomepageSections([])).toBeNull();
  });

  it('keeps legacy single-source sections readable', () => {
    expect(
      normalizeHomepageSections([
        {
          id: 'legacy',
          title: '旧栏目',
          source: 'source-a',
          categoryId: '3',
          enabled: true,
          order: 0,
          limit: 6,
        },
      ])[0].sources
    ).toEqual([{ source: 'source-a', categoryId: '3' }]);
  });

  it('merges results from multiple sources, removes duplicate titles, and applies the limit', () => {
    const result = mergeHomepageSectionResults(
      [
        {
          source: 'source-a',
          results: [
            { id: '1', title: '同一部电影', source: 'source-a' },
            { id: '2', title: '第一部', source: 'source-a' },
          ] as SearchResult[],
        },
        {
          source: 'source-b',
          results: [
            { id: '9', title: '同一部电影', source: 'source-b' },
            { id: '3', title: '第二部', source: 'source-b' },
          ] as SearchResult[],
        },
      ],
      3
    );

    expect(result.map((item) => item.title)).toEqual([
      '同一部电影',
      '第一部',
      '第二部',
    ]);
  });
});
