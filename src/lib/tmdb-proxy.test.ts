import { buildTmdbApiUrl, buildTmdbImageUrl } from '@/lib/tmdb-proxy';

describe('TMDB proxy URL builders', () => {
  it('builds an API URL and preserves query parameters', () => {
    const url = buildTmdbApiUrl(
      ['3', 'search', 'multi'],
      new URLSearchParams({ query: 'Dune', language: 'zh-CN' })
    );

    expect(url?.toString()).toBe(
      'https://api.themoviedb.org/3/search/multi?query=Dune&language=zh-CN'
    );
  });

  it('builds an image URL only for TMDB image paths', () => {
    const url = buildTmdbImageUrl(['t', 'p', 'w500', 'poster.jpg']);

    expect(url?.toString()).toBe('https://image.tmdb.org/t/p/w500/poster.jpg');
  });

  it('rejects paths outside the supported TMDB prefixes', () => {
    expect(
      buildTmdbApiUrl(['configuration'], new URLSearchParams())
    ).toBeNull();
    expect(buildTmdbImageUrl(['robots.txt'])).toBeNull();
  });

  it('rejects traversal-like path segments', () => {
    expect(
      buildTmdbApiUrl(['3', '..', 'admin'], new URLSearchParams())
    ).toBeNull();
    expect(buildTmdbImageUrl(['t', 'p', '..', 'secret'])).toBeNull();
  });
});
