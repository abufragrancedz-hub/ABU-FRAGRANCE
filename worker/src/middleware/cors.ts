/**
 * CORS Middleware
 * Restricts API access to allowed origins only
 */

import { Env } from '../types';

export function getCorsHeaders(request: Request, env: Env): Record<string, string> {
  const origin = request.headers.get('Origin') || '';
  const allowedOrigins = env.ALLOWED_ORIGINS.split(',').map(o => o.trim());

  // Allow localhost in development and Cloudflare Pages preview URLs
  const isLocalhost = origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:');
  const isPagesPreview = origin.endsWith('.abu-fragrance.pages.dev');
  const isAllowed = allowedOrigins.includes(origin) || isLocalhost || isPagesPreview;

  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0],
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json',
  };
}

export function handleOptions(request: Request, env: Env): Response {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(request, env),
  });
}

/**
 * Wrap a Response with CORS headers
 */
export function withCors(response: Response, request: Request, env: Env): Response {
  const corsHeaders = getCorsHeaders(request, env);
  const newHeaders = new Headers(response.headers);
  for (const [key, value] of Object.entries(corsHeaders)) {
    newHeaders.set(key, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}
