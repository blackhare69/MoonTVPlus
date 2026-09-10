/* eslint-disable no-console */

'use client';

import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import {
  HOMEPAGE_SECTION_MAX_LIMIT,
  HomepageSection,
} from '@/lib/homepage-sections';

interface ApiSource {
  key: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
}

interface HomepageSectionsEditorProps {
  value: HomepageSection[];
  onChange: (sections: HomepageSection[]) => void;
}

const createSectionId = () =>
  `homepage-section-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export default function HomepageSectionsEditor({
  value,
  onChange,
}: HomepageSectionsEditorProps) {
  const [sources, setSources] = useState<ApiSource[]>([]);
  const [categories, setCategories] = useState<Record<string, Category[]>>({});
  const [loadingSources, setLoadingSources] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState<
    Record<string, boolean>
  >({});
  const [error, setError] = useState('');

  const loadCategories = useCallback(async (sourceKey: string) => {
    if (!sourceKey) return [];

    setLoadingCategories((current) => ({ ...current, [sourceKey]: true }));
    try {
      const response = await fetch(
        `/api/source-search/categories?source=${encodeURIComponent(sourceKey)}`
      );
      if (!response.ok) throw new Error('分类加载失败');
      const data = await response.json();
      const nextCategories = Array.isArray(data.categories)
        ? (data.categories as Category[])
        : [];
      setCategories((current) => ({
        ...current,
        [sourceKey]: nextCategories,
      }));
      return nextCategories;
    } catch (loadError) {
      console.error('加载首页栏目分类失败:', loadError);
      setError('部分播放源分类加载失败，请稍后重试。');
      return [];
    } finally {
      setLoadingCategories((current) => ({
        ...current,
        [sourceKey]: false,
      }));
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadSources = async () => {
      setLoadingSources(true);
      try {
        const response = await fetch('/api/source-search/sources');
        if (!response.ok) throw new Error('播放源加载失败');
        const data = await response.json();
        if (!cancelled) {
          setSources(Array.isArray(data.sources) ? data.sources : []);
        }
      } catch (loadError) {
        console.error('加载首页栏目播放源失败:', loadError);
        if (!cancelled) setError('播放源加载失败，请刷新后台页面重试。');
      } finally {
        if (!cancelled) setLoadingSources(false);
      }
    };

    void loadSources();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const sourceKeys = new Set(value.map((section) => section.source));
    for (const sourceKey of Array.from(sourceKeys)) {
      if (sourceKey && categories[sourceKey] === undefined) {
        void loadCategories(sourceKey);
      }
    }
  }, [categories, loadCategories, value]);

  const updateSection = (id: string, patch: Partial<HomepageSection>) => {
    onChange(
      value.map((section) =>
        section.id === id ? { ...section, ...patch } : section
      )
    );
  };

  const handleSourceChange = async (
    section: HomepageSection,
    source: string
  ) => {
    const nextCategories = await loadCategories(source);
    updateSection(section.id, {
      source,
      categoryId: nextCategories[0]?.id || '',
    });
  };

  const addSection = () => {
    const source = sources[0];
    if (!source) {
      setError('当前没有可用播放源，无法新增栏目。');
      return;
    }

    const sourceCategories = categories[source.key] || [];
    onChange([
      ...value,
      {
        id: createSectionId(),
        title: `${source.name}推荐`,
        source: source.key,
        categoryId: sourceCategories[0]?.id || '',
        enabled: true,
        order: value.length,
        limit: 12,
      },
    ]);
  };

  const moveSection = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= value.length) return;
    const next = [...value];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    onChange(next.map((section, order) => ({ ...section, order })));
  };

  const removeSection = (id: string) => {
    onChange(
      value
        .filter((section) => section.id !== id)
        .map((section, order) => ({ ...section, order }))
    );
  };

  return (
    <div className='space-y-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <div>
          <h4 className='text-sm font-semibold text-gray-900 dark:text-gray-100'>
            首页自定义栏目
          </h4>
          <p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
            每个栏目选择一个播放源和分类，保存后对所有访问者生效。
          </p>
        </div>
        <button
          type='button'
          onClick={addSection}
          disabled={loadingSources}
          className='inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50'
        >
          <Plus className='h-4 w-4' />
          新增栏目
        </button>
      </div>

      {error && (
        <p className='rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-900/20 dark:text-amber-300'>
          {error}
        </p>
      )}

      {value.length === 0 ? (
        <p className='rounded-md bg-gray-50 px-3 py-3 text-sm text-gray-500 dark:bg-gray-800 dark:text-gray-400'>
          还没有自定义栏目，点击“新增栏目”开始配置。
        </p>
      ) : (
        value.map((section, index) => {
          const sourceCategories = categories[section.source] || [];
          const categoryLoading = loadingCategories[section.source];
          const hasSavedCategory =
            section.categoryId &&
            !sourceCategories.some(
              (category) => category.id === section.categoryId
            );

          return (
            <div
              key={section.id}
              className='space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800'
            >
              <div className='flex items-center justify-between gap-2'>
                <span className='text-sm font-medium text-gray-700 dark:text-gray-200'>
                  栏目 {index + 1}
                </span>
                <div className='flex items-center gap-1'>
                  <button
                    type='button'
                    onClick={() => moveSection(index, -1)}
                    disabled={index === 0}
                    className='rounded p-1.5 text-gray-500 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-gray-700'
                    title='上移'
                  >
                    <ArrowUp className='h-4 w-4' />
                  </button>
                  <button
                    type='button'
                    onClick={() => moveSection(index, 1)}
                    disabled={index === value.length - 1}
                    className='rounded p-1.5 text-gray-500 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-gray-700'
                    title='下移'
                  >
                    <ArrowDown className='h-4 w-4' />
                  </button>
                  <button
                    type='button'
                    onClick={() => removeSection(section.id)}
                    className='rounded p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                    title='删除'
                  >
                    <Trash2 className='h-4 w-4' />
                  </button>
                </div>
              </div>

              <div className='grid gap-3 md:grid-cols-2'>
                <label className='space-y-1'>
                  <span className='text-xs font-medium text-gray-600 dark:text-gray-400'>
                    栏目名称
                  </span>
                  <input
                    type='text'
                    value={section.title}
                    onChange={(event) =>
                      updateSection(section.id, { title: event.target.value })
                    }
                    className='w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100'
                    placeholder='例如：精选剧集'
                  />
                </label>

                <label className='space-y-1'>
                  <span className='text-xs font-medium text-gray-600 dark:text-gray-400'>
                    显示数量
                  </span>
                  <input
                    type='number'
                    min={1}
                    max={HOMEPAGE_SECTION_MAX_LIMIT}
                    value={section.limit}
                    onChange={(event) =>
                      updateSection(section.id, {
                        limit: Math.min(
                          HOMEPAGE_SECTION_MAX_LIMIT,
                          Math.max(1, Number(event.target.value) || 1)
                        ),
                      })
                    }
                    className='w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100'
                  />
                </label>

                <label className='space-y-1'>
                  <span className='text-xs font-medium text-gray-600 dark:text-gray-400'>
                    播放源
                  </span>
                  <select
                    value={section.source}
                    onChange={(event) =>
                      void handleSourceChange(section, event.target.value)
                    }
                    className='w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100'
                  >
                    {sources.length === 0 && (
                      <option value={section.source}>{section.source}</option>
                    )}
                    {sources.map((source) => (
                      <option key={source.key} value={source.key}>
                        {source.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className='space-y-1'>
                  <span className='text-xs font-medium text-gray-600 dark:text-gray-400'>
                    分类
                  </span>
                  <select
                    value={section.categoryId}
                    disabled={categoryLoading}
                    onChange={(event) =>
                      updateSection(section.id, {
                        categoryId: event.target.value,
                      })
                    }
                    className='w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-60 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100'
                  >
                    {!section.categoryId && (
                      <option value=''>请选择分类</option>
                    )}
                    {hasSavedCategory && (
                      <option value={section.categoryId}>
                        已保存分类（{section.categoryId}）
                      </option>
                    )}
                    {sourceCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className='inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300'>
                <input
                  type='checkbox'
                  checked={section.enabled}
                  onChange={(event) =>
                    updateSection(section.id, {
                      enabled: event.target.checked,
                    })
                  }
                  className='rounded border-gray-300 text-green-600 focus:ring-green-500'
                />
                启用此栏目
              </label>

              {!section.categoryId && (
                <p className='text-xs text-red-600 dark:text-red-400'>
                  请为此栏目选择分类后再保存。
                </p>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
