/**
 * Products API Handlers
 * Public: read from KV cache (fast, free)
 * Admin: CRUD from D1 (source of truth)
 */

import { Env, ProductRow, productRowToProduct, ApiResponse } from '../types';

// ─── PUBLIC: Get all products (with pagination & KV cache) ───
export async function getProducts(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '50')));
    const offset = (page - 1) * limit;

    // Try KV cache first (< 10ms, globally distributed)
    const cached = await env.PRODUCTS_KV.get('products:all');
    let products: any[] = [];
    let source = 'cache';

    if (cached) {
      products = JSON.parse(cached);
    } else {
      // Fallback to D1 if KV is empty
      const { results } = await env.DB.prepare(
        'SELECT * FROM products ORDER BY sort_order ASC, name ASC'
      ).all<ProductRow>();
      products = (results || []).map(productRowToProduct);
      source = 'database';

      // Async: populate KV cache for next request
      try {
        await env.PRODUCTS_KV.put('products:all', JSON.stringify(products), {
          expirationTtl: 3600, // 1 hour
        });
      } catch {}
    }

    // Paginate in memory (since KV is a full list)
    const paginated = products.slice(offset, offset + limit);
    const total = products.length;

    return new Response(JSON.stringify({
      success: true,
      data: paginated,
      meta: { 
        source,
        total,
        page,
        limit,
        hasMore: offset + paginated.length < total
      },
    }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to fetch products',
    }), { status: 500 });
  }
}

// ─── PUBLIC: Get single product ───
export async function getProduct(request: Request, env: Env, id: string): Promise<Response> {
  try {
    const row = await env.DB.prepare(
      'SELECT * FROM products WHERE id = ?'
    ).bind(id).first<ProductRow>();

    if (!row) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Product not found',
      }), { status: 404 });
    }

    return new Response(JSON.stringify({
      success: true,
      data: productRowToProduct(row),
    }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), { status: 500 });
  }
}

// ─── ADMIN: Get all products from D1 (always fresh) ───
export async function adminGetProducts(request: Request, env: Env): Promise<Response> {
  try {
    const { results } = await env.DB.prepare(
      'SELECT * FROM products ORDER BY sort_order ASC, name ASC'
    ).all<ProductRow>();

    return new Response(JSON.stringify({
      success: true,
      data: (results || []).map(productRowToProduct),
    }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), { status: 500 });
  }
}

// ─── ADMIN: Create product ───
export async function createProduct(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json() as any;

    if (!body.name?.trim()) {
      return new Response(JSON.stringify({
        success: false, error: 'Product name is required',
      }), { status: 400 });
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await env.DB.prepare(`
      INSERT INTO products (id, name, description, price, old_price, category, image, images, sizes, is_promo, free_delivery, delivery_company, stop_desk_enabled, sort_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      body.name.trim(),
      body.description || '',
      Number(body.price) || 0,
      body.oldPrice ? Number(body.oldPrice) : null,
      body.category || 'General',
      body.image || '',
      JSON.stringify(body.images || []),
      JSON.stringify(body.sizes || []),
      body.isPromo ? 1 : 0,
      body.freeDelivery ? 1 : 0,
      body.deliveryCompany || 'anderson',
      body.stopDeskEnabled !== false ? 1 : 0,
      body.sortOrder || 0,
      now,
      now,
    ).run();

    // Auto-sync KV cache
    await syncProductsToKV(env);

    return new Response(JSON.stringify({
      success: true,
      data: { id },
    }), { status: 201 });
  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), { status: 500 });
  }
}

// ─── ADMIN: Update product ───
export async function updateProduct(request: Request, env: Env, id: string): Promise<Response> {
  try {
    const body = await request.json() as any;
    const now = new Date().toISOString();

    // Build dynamic UPDATE query with only provided fields
    const updates: string[] = [];
    const values: any[] = [];

    const fieldMap: Record<string, string> = {
      name: 'name',
      description: 'description',
      price: 'price',
      oldPrice: 'old_price',
      category: 'category',
      image: 'image',
      deliveryCompany: 'delivery_company',
    };

    for (const [jsKey, dbKey] of Object.entries(fieldMap)) {
      if (body[jsKey] !== undefined) {
        updates.push(`${dbKey} = ?`);
        values.push(jsKey === 'price' || jsKey === 'oldPrice' ? Number(body[jsKey]) : body[jsKey]);
      }
    }

    // JSON fields
    if (body.images !== undefined) {
      updates.push('images = ?');
      values.push(JSON.stringify(body.images));
    }
    if (body.sizes !== undefined) {
      updates.push('sizes = ?');
      values.push(JSON.stringify(body.sizes));
    }
    // Boolean fields
    if (body.isPromo !== undefined) {
      updates.push('is_promo = ?');
      values.push(body.isPromo ? 1 : 0);
    }
    if (body.freeDelivery !== undefined) {
      updates.push('free_delivery = ?');
      values.push(body.freeDelivery ? 1 : 0);
    }
    if (body.stopDeskEnabled !== undefined) {
      updates.push('stop_desk_enabled = ?');
      values.push(body.stopDeskEnabled ? 1 : 0);
    }
    if (body.sortOrder !== undefined) {
      updates.push('sort_order = ?');
      values.push(Number(body.sortOrder));
    }

    if (updates.length === 0) {
      return new Response(JSON.stringify({
        success: false, error: 'No fields to update',
      }), { status: 400 });
    }

    updates.push('updated_at = ?');
    values.push(now);
    values.push(id);

    const result = await env.DB.prepare(
      `UPDATE products SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...values).run();

    if (result.meta.changes === 0) {
      return new Response(JSON.stringify({
        success: false, error: 'Product not found',
      }), { status: 404 });
    }

    // Auto-sync KV cache
    await syncProductsToKV(env);

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), { status: 500 });
  }
}

// ─── ADMIN: Delete product ───
export async function deleteProduct(request: Request, env: Env, id: string): Promise<Response> {
  try {
    const result = await env.DB.prepare(
      'DELETE FROM products WHERE id = ?'
    ).bind(id).run();

    if (result.meta.changes === 0) {
      return new Response(JSON.stringify({
        success: false, error: 'Product not found',
      }), { status: 404 });
    }

    // Auto-sync KV cache
    await syncProductsToKV(env);

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), { status: 500 });
  }
}

// ─── Sync D1 products → KV cache ───
export async function syncProductsToKV(env: Env): Promise<void> {
  try {
    const { results } = await env.DB.prepare(
      'SELECT * FROM products ORDER BY sort_order ASC, name ASC'
    ).all<ProductRow>();

    const products = (results || []).map(productRowToProduct);

    await env.PRODUCTS_KV.put('products:all', JSON.stringify(products), {
      expirationTtl: 86400, // 24 hours
    });
    await env.PRODUCTS_KV.put('cache:timestamp', new Date().toISOString());
  } catch (error) {
    console.error('Failed to sync products to KV:', error);
  }
}

// ─── ADMIN: Manual KV sync endpoint ───
export async function adminSyncCache(request: Request, env: Env): Promise<Response> {
  try {
    // Also sync marketing settings
    const marketingRow = await env.DB.prepare(
      "SELECT value FROM settings WHERE key = 'marketing'"
    ).first<{ value: string }>();

    if (marketingRow) {
      await env.PRODUCTS_KV.put('marketing', marketingRow.value, {
        expirationTtl: 86400,
      });
    }

    await syncProductsToKV(env);

    return new Response(JSON.stringify({
      success: true,
      data: { message: 'Cache synced successfully' },
    }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), { status: 500 });
  }
}
