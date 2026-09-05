/**
 * Admin Orders Handler
 * List, search, update, delete orders — all admin-only
 */

import { Env, OrderRow, orderRowToOrder } from '../types';

// ─── List Orders (paginated, searchable, filterable) ───
export async function listOrders(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '50')));
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search')?.trim();
    const offset = (page - 1) * limit;

    // Build query dynamically
    const conditions: string[] = [];
    const params: any[] = [];

    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }

    if (search) {
      const firstChar = search[0];
      if (firstChar === '#') {
        // Search by order number or ID
        const searchId = search.slice(1);
        if (searchId) {
          conditions.push('(CAST(order_number AS TEXT) LIKE ? OR id LIKE ?)');
          params.push(`%${searchId}%`, `%${searchId}%`);
        }
      } else if (/[0-9]/.test(firstChar)) {
        // Search by phone number
        conditions.push('customer_phone LIKE ?');
        params.push(`%${search}%`);
      } else {
        // Search by name
        conditions.push('customer_name LIKE ?');
        params.push(`%${search}%`);
      }
    }

    const whereClause = conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    // Get total count
    const countResult = await env.DB.prepare(
      `SELECT COUNT(*) as total FROM orders ${whereClause}`
    ).bind(...params).first<{ total: number }>();
    const total = countResult?.total || 0;

    // Get paginated results
    const { results } = await env.DB.prepare(
      `SELECT * FROM orders ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`
    ).bind(...params, limit, offset).all<OrderRow>();

    const orders = (results || []).map(orderRowToOrder);

    return new Response(JSON.stringify({
      success: true,
      data: orders,
      meta: {
        page,
        limit,
        total,
        hasMore: offset + orders.length < total,
      },
    }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), { status: 500 });
  }
}

// ─── Get Single Order ───
export async function getOrder(request: Request, env: Env, id: string): Promise<Response> {
  try {
    const row = await env.DB.prepare(
      'SELECT * FROM orders WHERE id = ?'
    ).bind(id).first<OrderRow>();

    if (!row) {
      return new Response(JSON.stringify({
        success: false, error: 'Order not found',
      }), { status: 404 });
    }

    // Also get logs
    const { results: logs } = await env.DB.prepare(
      'SELECT * FROM order_logs WHERE order_id = ? ORDER BY created_at DESC LIMIT 50'
    ).bind(id).all();

    return new Response(JSON.stringify({
      success: true,
      data: { ...orderRowToOrder(row), logs: logs || [] },
    }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false, error: error.message,
    }), { status: 500 });
  }
}

// ─── Update Order Status ───
export async function updateOrderStatus(request: Request, env: Env, id: string): Promise<Response> {
  try {
    const body = await request.json() as any;
    const newStatus = body.status;

    const validStatuses = ['pending', 'sent_to_company', 'confirmed', 'no_answer', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(newStatus)) {
      return new Response(JSON.stringify({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      }), { status: 400 });
    }

    // Get current order
    const current = await env.DB.prepare(
      'SELECT id, status FROM orders WHERE id = ?'
    ).bind(id).first<{ id: string; status: string }>();

    if (!current) {
      return new Response(JSON.stringify({
        success: false, error: 'Order not found',
      }), { status: 404 });
    }

    if (current.status === newStatus) {
      return new Response(JSON.stringify({
        success: true, data: { message: 'Status unchanged' },
      }), { status: 200 });
    }

    const now = new Date().toISOString();

    // Update order
    await env.DB.prepare(
      'UPDATE orders SET status = ?, updated_at = ? WHERE id = ?'
    ).bind(newStatus, now, id).run();

    // Log the change
    await env.DB.prepare(
      'INSERT INTO order_logs (order_id, action, old_value, new_value, actor, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(id, 'status_changed', current.status, newStatus, 'admin', now).run();

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false, error: error.message,
    }), { status: 500 });
  }
}

// ─── Delete Order ───
export async function deleteOrder(request: Request, env: Env, id: string): Promise<Response> {
  try {
    const result = await env.DB.prepare(
      'DELETE FROM orders WHERE id = ?'
    ).bind(id).run();

    if (result.meta.changes === 0) {
      return new Response(JSON.stringify({
        success: false, error: 'Order not found',
      }), { status: 404 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false, error: error.message,
    }), { status: 500 });
  }
}

// ─── Export All Orders (for Excel/PDF generation on frontend) ───
export async function exportOrders(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');

    let query = 'SELECT * FROM orders';
    const params: any[] = [];

    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';

    const { results } = await env.DB.prepare(query).bind(...params).all<OrderRow>();
    const orders = (results || []).map(orderRowToOrder);

    return new Response(JSON.stringify({
      success: true,
      data: orders,
    }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false, error: error.message,
    }), { status: 500 });
  }
}

// ─── Dashboard Stats ───
export async function getDashboardStats(request: Request, env: Env): Promise<Response> {
  try {
    const stats = await env.DB.prepare(`
      SELECT
        COUNT(*) as total_orders,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
        SUM(CASE WHEN status = 'shipped' THEN 1 ELSE 0 END) as shipped,
        SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
        SUM(CASE WHEN status = 'no_answer' THEN 1 ELSE 0 END) as no_answer,
        SUM(CASE WHEN status = 'sent_to_company' THEN 1 ELSE 0 END) as sent_to_company,
        SUM(total) as total_revenue
      FROM orders
    `).first();

    const productCount = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM products'
    ).first<{ count: number }>();

    return new Response(JSON.stringify({
      success: true,
      data: {
        orders: stats,
        productCount: productCount?.count || 0,
      },
    }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false, error: error.message,
    }), { status: 500 });
  }
}
