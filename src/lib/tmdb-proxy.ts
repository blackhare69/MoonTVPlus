const TMDB_API_HOST = 'api.themoviedb.org';
const TMDB_IMAGE_HOST = 'image.tmdb.org';

function isSafePathSegment(segment: string): boolean {
  return (
    segment.length > 0 &&
    segment !== '.' &&
    segment !== '..' &&
    !segment.includes('/') &&
    !segment.includes('\\') &&
    !/[\u0000-\u001f]/.test(segment)
  );
}

function encodePathSegments(segments: string[]): string | null {
  if (segments.length === 0 || !segments.every(isSafePathSegment)) {
    return null;
  }

  return `/${segments.map((segment) => encodeURIComponent(segment)).join('/')}`;
}

export function buildTmdbApiUrl(
  pathSegments: string[],
  searchParams: URLSearchParams
): URL | null {
  if (pathSegments[0] !== '3') {
    return null;
  }

  const path = encodePathSegments(pathSegments);
  if (!path || !path.startsWith('/3/')) {
    return null;
  }

  const url = new URL(`https://${TMDB_API_HOST}${path}`);
  searchParams.forEach((value, key) => url.searchParams.append(key, value));
  return url;
}

export function buildTmdbImageUrl(pathSegments: string[]): URL | null {
  if (pathSegments[0] !== 't' || pathSegments[1] !== 'p') {
    return null;
  }

  const path = encodePathSegments(pathSegments);
  if (!path || !path.startsWith('/t/p/')) {
    return null;
  }

  return new URL(`https://${TMDB_IMAGE_HOST}${path}`);
}

export function createTmdbResponse(
  upstream: Response,
  cacheControl: string
): Response {
  const headers = new Headers();

  for (const name of ['content-type', 'etag', 'last-modified']) {
    const value = upstream.headers.get(name);
    if (value) {
      headers.set(name, value);
    }
  }

  headers.set('Cache-Control', cacheControl);

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  });
}

export async function fetchTmdb(
  request: Request,
  targetUrl: URL
): Promise<Response> {
  const headers = new Headers();
  const accept = request.headers.get('accept');
  if (accept) {
    headers.set('accept', accept);
  }

  return fetch(targetUrl, {
    method: request.method,
    headers,
    redirect: 'follow',
    signal: AbortSignal.timeout(15000),
  });
}
