/**
 * Shipping Handler
 * Send orders to EcoTrack delivery — single and batch
 * All API tokens stay server-side, never exposed to browser
 */

import { Env, OrderRow, orderRowToOrder } from '../types';
import { createEcoTrackOrder, getEcoTrackStatus } from '../services/ecotrack';
import { createDHDOrder, getDHDStatus } from '../services/dhd';

// ─── Ship Single Order ───
export async function shipOrder(request: Request, env: Env, id: string): Promise<Response> {
  try {
    // Get order from D1
    const row = await env.DB.prepare(
      'SELECT * FROM orders WHERE id = ?'
    ).bind(id).first<OrderRow>();

    if (!row) {
      return new Response(JSON.stringify({
        success: false, error: 'Order not found',
      }), { status: 404 });
    }

    const order = orderRowToOrder(row);

    // Prevent duplicate shipments
    if (order.trackingNumber) {
      return new Response(JSON.stringify({
        success: false,
        error: `Order already has tracking number: ${order.trackingNumber}`,
      }), { status: 409 });
    }

    // Only ship confirmed or pending orders
    if (!['confirmed', 'pending', 'sent_to_company'].includes(order.status)) {
      return new Response(JSON.stringify({
        success: false,
        error: `Cannot ship order with status: ${order.status}`,
      }), { status: 400 });
    }

    // Optionally override delivery type from request body
    const body = await request.json().catch(() => ({})) as any;
    if (body.deliveryType) {
      order.deliveryType = body.deliveryType;
    }
    if (body.isFragile !== undefined) {
      (order as any).isFragile = !!body.isFragile;
    }

    // Determine carrier (either from request body or order history)
    const carrier = body.carrier || order.carrier || 'ecotrack';

    // Fetch delivery_config from DB to get carrier tokens stored via Admin Settings UI
    let deliveryConfig: any = {};
    try {
      const configRow = await env.DB.prepare(
        "SELECT value FROM settings WHERE key = 'delivery_config'"
      ).first<{ value: string }>();
      if (configRow?.value) deliveryConfig = JSON.parse(configRow.value);
    } catch { /* ignore - will use env fallback */ }

    // Call appropriate API
    let result;
    if (carrier === 'dhd') {
      // DHD token is stored in DB delivery_config.dhd.api_token (set via Admin Settings)
      const dhdToken = deliveryConfig?.dhd?.api_token || env.DHD_API_KEY || '';
      const dhdUrl = 'https://platform.dhd-dz.com';
      if (!dhdToken) {
        throw new Error('DHD API token not configured. Go to Admin > Settings and add your DHD token.');
      }
      result = await createDHDOrder(order, dhdToken, dhdUrl);
    } else {
      result = await createEcoTrackOrder(order, env);
    }

    const now = new Date().toISOString();
    const finalDeliveryType = result.actualDeliveryType || order.deliveryType;

    // Update order in D1
    await env.DB.prepare(`
      UPDATE orders SET 
        status = 'shipped',
        carrier = ?,
        tracking_number = ?,
        delivery_type = ?,
        updated_at = ?
      WHERE id = ?
    `).bind(carrier, result.trackingNumber, finalDeliveryType, now, id).run();

    // Log the shipment
    await env.DB.prepare(
      'INSERT INTO order_logs (order_id, action, new_value, details, actor, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(
      id,
      'shipped',
      'shipped',
      JSON.stringify({
        tracking: result.trackingNumber,
        carrier: carrier,
        deliveryType: finalDeliveryType,
        note: result.note || null,
      }),
      'admin',
      now,
    ).run();

    return new Response(JSON.stringify({
      success: true,
      data: {
        trackingNumber: result.trackingNumber,
        deliveryType: finalDeliveryType,
        note: result.note,
        labelUrl: result.labelUrl,
      },
    }), { status: 200 });

  } catch (error: any) {
    console.error('Ship order error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to ship order',
    }), { status: 500 });
  }
}

// ─── Batch Ship Orders ───
export async function batchShipOrders(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json() as any;
    const orderIds: string[] = body.order_ids;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return new Response(JSON.stringify({
        success: false, error: 'order_ids array is required',
      }), { status: 400 });
    }

    if (orderIds.length > 50) {
      return new Response(JSON.stringify({
        success: false, error: 'Maximum 50 orders per batch',
      }), { status: 400 });
    }

    const results: { success: any[]; failed: any[] } = { success: [], failed: [] };

    for (const orderId of orderIds) {
      try {
        // Get order
        const row = await env.DB.prepare(
          'SELECT * FROM orders WHERE id = ?'
        ).bind(orderId).first<OrderRow>();

        if (!row) {
          results.failed.push({ id: orderId, error: 'Not found' });
          continue;
        }

        const order = orderRowToOrder(row);

        // Skip already shipped
        if (order.trackingNumber) {
          results.failed.push({ id: orderId, error: 'Already has tracking number' });
          continue;
        }

        // Determine carrier
        const carrier = order.carrier || 'ecotrack';

        // Call appropriate API
        let result;
        if (carrier === 'dhd') {
          result = await createDHDOrder(order, env);
        } else {
          result = await createEcoTrackOrder(order, env);
        }
        const now = new Date().toISOString();
        const finalDeliveryType = result.actualDeliveryType || order.deliveryType;

        // Update D1
        await env.DB.prepare(`
          UPDATE orders SET 
            status = 'shipped',
            carrier = ?,
            tracking_number = ?,
            delivery_type = ?,
            updated_at = ?
          WHERE id = ?
        `).bind(carrier, result.trackingNumber, finalDeliveryType, now, orderId).run();

        // Log
        await env.DB.prepare(
          'INSERT INTO order_logs (order_id, action, new_value, details, actor, created_at) VALUES (?, ?, ?, ?, ?, ?)'
        ).bind(orderId, 'shipped', 'shipped', JSON.stringify({ tracking: result.trackingNumber }), 'admin', now).run();

        results.success.push({
          id: orderId,
          orderNumber: order.orderNumber,
          trackingNumber: result.trackingNumber,
        });

      } catch (error: any) {
        results.failed.push({
          id: orderId,
          error: error.message || 'Unknown error',
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      data: results,
    }), { status: 200 });

  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false, error: error.message,
    }), { status: 500 });
  }
}

// ─── Check Delivery Statuses (for shipped orders) ───
export async function checkOrderStatuses(request: Request, env: Env): Promise<Response> {
  try {
    const { results } = await env.DB.prepare(
      "SELECT * FROM orders WHERE status = 'shipped' AND tracking_number IS NOT NULL LIMIT 100"
    ).all<OrderRow>();

    if (!results || results.length === 0) {
      return new Response(JSON.stringify({
        success: true, data: { checked: 0, updated: 0 },
      }), { status: 200 });
    }

    let updated = 0;
    const now = new Date().toISOString();

    for (const row of results) {
      try {
        let newStatus = null;
        if (row.carrier === 'dhd') {
          newStatus = await getDHDStatus(row.tracking_number!, env);
        } else {
          newStatus = await getEcoTrackStatus(row.tracking_number!, env);
        }

        if (newStatus && newStatus !== row.status) {
          await env.DB.prepare(
            'UPDATE orders SET status = ?, updated_at = ? WHERE id = ?'
          ).bind(newStatus, now, row.id).run();

          await env.DB.prepare(
            'INSERT INTO order_logs (order_id, action, old_value, new_value, actor, created_at) VALUES (?, ?, ?, ?, ?, ?)'
          ).bind(row.id, 'status_changed', row.status, newStatus, 'system', now).run();

          updated++;
        }
      } catch (err) {
        console.error(`Status check failed for ${row.id}:`, err);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      data: { checked: results.length, updated },
    }), { status: 200 });

  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false, error: error.message,
    }), { status: 500 });
  }
}
