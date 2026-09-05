/**
 * Settings Handler
 * Admin-only: manage marketing pixels, delivery config, confirmation company
 */

import { Env } from '../types';

// ─── Get All Settings ───
export async function getSettings(request: Request, env: Env): Promise<Response> {
  try {
    const { results } = await env.DB.prepare(
      'SELECT key, value, updated_at FROM settings'
    ).all<{ key: string; value: string; updated_at: string }>();

    const settings: Record<string, any> = {};
    for (const row of results || []) {
      try {
        settings[row.key] = JSON.parse(row.value);
      } catch {
        settings[row.key] = row.value;
      }
    }

    // Never expose sensitive tokens fully — mask them
    if (settings.delivery_config?.ecotrack?.api_token) {
      const token = settings.delivery_config.ecotrack.api_token;
      settings.delivery_config.ecotrack.api_token_masked =
        token.length > 8 ? `${token.slice(0, 4)}...${token.slice(-4)}` : '****';
      settings.delivery_config.ecotrack.has_token = !!token;
    }

    if (settings.confirmation_company?.api_token) {
      const token = settings.confirmation_company.api_token;
      settings.confirmation_company.api_token_masked =
        token.length > 8 ? `${token.slice(0, 4)}...${token.slice(-4)}` : '****';
      settings.confirmation_company.has_token = !!token;
    }

    return new Response(JSON.stringify({
      success: true,
      data: settings,
    }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false, error: error.message,
    }), { status: 500 });
  }
}

// ─── Get Single Setting (for public marketing settings) ───
export async function getPublicSetting(request: Request, env: Env, key: string): Promise<Response> {
  // Only allow public access to marketing settings
  if (key !== 'marketing') {
    return new Response(JSON.stringify({
      success: false, error: 'Not found',
    }), { status: 404 });
  }

  try {
    // Try KV cache first
    const cached = await env.PRODUCTS_KV.get('marketing');
    if (cached) {
      return new Response(JSON.stringify({
        success: true,
        data: JSON.parse(cached),
      }), { status: 200 });
    }

    const row = await env.DB.prepare(
      "SELECT value FROM settings WHERE key = ?"
    ).bind(key).first<{ value: string }>();

    if (!row) {
      return new Response(JSON.stringify({
        success: true,
        data: { facebook_pixel_id: '', tiktok_pixel_id: '' },
      }), { status: 200 });
    }

    return new Response(JSON.stringify({
      success: true,
      data: JSON.parse(row.value),
    }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false, error: error.message,
    }), { status: 500 });
  }
}

// ─── Update Setting ───
export async function updateSetting(request: Request, env: Env, key: string): Promise<Response> {
  try {
    const body = await request.json() as any;
    const now = new Date().toISOString();

    // Validate allowed keys
    const allowedKeys = ['marketing', 'delivery_config', 'confirmation_company'];
    if (!allowedKeys.includes(key)) {
      return new Response(JSON.stringify({
        success: false, error: `Invalid setting key. Allowed: ${allowedKeys.join(', ')}`,
      }), { status: 400 });
    }

    // For confirmation_company, auto-generate webhook secret if not set
    if (key === 'confirmation_company' && body.enabled && !body.webhook_secret) {
      const existing = await env.DB.prepare(
        "SELECT value FROM settings WHERE key = 'confirmation_company'"
      ).first<{ value: string }>();

      if (existing) {
        const current = JSON.parse(existing.value);
        if (!current.webhook_secret) {
          // Generate a secure webhook secret
          const array = new Uint8Array(32);
          crypto.getRandomValues(array);
          body.webhook_secret = 'whsec_' + Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
        } else {
          body.webhook_secret = current.webhook_secret;
        }
      }
    }

    const value = JSON.stringify(body);

    await env.DB.prepare(
      'INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = ?'
    ).bind(key, value, now, value, now).run();

    // If marketing settings changed, update KV cache
    if (key === 'marketing') {
      try {
        await env.PRODUCTS_KV.put('marketing', value, { expirationTtl: 86400 });
      } catch { }
    }

    return new Response(JSON.stringify({
      success: true,
      data: { message: 'Setting updated' },
    }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false, error: error.message,
    }), { status: 500 });
  }
}
