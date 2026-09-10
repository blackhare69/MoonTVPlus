import { NextResponse } from 'next/server';

import {
  buildTmdbApiUrl,
  createTmdbResponse,
  fetchTmdb,
} from '@/lib/tmdb-proxy';

type RouteContext = {
  params: {
    path: string[];
  };
};

async function handle(
  request: Request,
  context: RouteContext
): Promise<Response> {
  const targetUrl = buildTmdbApiUrl(
    context.params.path,
    new URL(request.url).searchParams
  );

  if (!targetUrl) {
    return NextResponse.json(
      { error: 'Unsupported TMDB API path' },
      { status: 400 }
    );
  }

  try {
    const upstream = await fetchTmdb(request, targetUrl);
    return createTmdbResponse(upstream, 'public, max-age=300, s-maxage=300');
  } catch (error) {
    console.error('TMDB API proxy request failed:', error);
    return NextResponse.json(
      { error: 'TMDB API proxy request failed' },
      { status: 502 }
    );
  }
}

export async function GET(request: Request, context: RouteContext) {
  return handle(request, context);
}

export async function HEAD(request: Request, context: RouteContext) {
  return handle(request, context);
}
