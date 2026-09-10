import { NextResponse } from 'next/server';

import {
  buildTmdbImageUrl,
  createTmdbResponse,
  fetchTmdb,
} from '@/lib/tmdb-proxy';

export const runtime = 'edge';

type RouteContext = {
  params: {
    path: string[];
  };
};

async function handle(
  request: Request,
  context: RouteContext
): Promise<Response> {
  const targetUrl = buildTmdbImageUrl(context.params.path);

  if (!targetUrl) {
    return NextResponse.json(
      { error: 'Unsupported TMDB image path' },
      { status: 400 }
    );
  }

  try {
    const upstream = await fetchTmdb(request, targetUrl);
    return createTmdbResponse(
      upstream,
      'public, max-age=31536000, s-maxage=31536000, immutable'
    );
  } catch (error) {
    console.error('TMDB image proxy request failed:', error);
    return NextResponse.json(
      { error: 'TMDB image proxy request failed' },
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
