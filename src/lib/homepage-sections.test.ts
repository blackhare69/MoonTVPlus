import {
  normalizeHomepageSections,
  validateHomepageSections,
} from './homepage-sections';

describe('homepage section configuration', () => {
  it('sorts valid sections and drops invalid entries', () => {
    const sections = normalizeHomepageSections([
      {
        id: 'series',
        title: '剧集专区',
        source: 'source-b',
        categoryId: '2',
        enabled: true,
        order: 2,
        limit: 12,
      },
      {
        id: 'missing-category',
        title: '无效栏目',
        source: 'source-a',
        categoryId: '',
        enabled: true,
        order: 1,
        limit: 12,
      },
      {
        id: 'movies',
        title: '电影专区',
        source: 'source-a',
        categoryId: '1',
        enabled: true,
        order: 1,
        limit: 8,
      },
    ]);

    expect(sections.map((section) => section.id)).toEqual(['movies', 'series']);
  });

  it('rejects duplicate ids and limits outside the supported range', () => {
    expect(
      validateHomepageSections([
        {
          id: 'same',
          title: '栏目一',
          source: 'source-a',
          categoryId: '1',
          enabled: true,
          order: 0,
          limit: 12,
        },
        {
          id: 'same',
          title: '栏目二',
          source: 'source-b',
          categoryId: '2',
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
});
