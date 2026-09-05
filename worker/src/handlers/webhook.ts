/**
 * Webhook Handler
 * Receives status updates from the confirmation company
 * SECURITY: Validates webhook secret before processing
 */

import { Env, ConfirmationCompanyConfig } from '../types';

// ─── Confirmation Company Webhook ───
export async function handleConfirmationWebhook(request: Request, env: Env): Promise<Response> {
  try {
    // ─── Verify Webhook Secret ───
    const authHeader = request.headers.get('Authorization') || '';
    const webhookToken = request.headers.get('X-Webhook-Secret') || '';
    const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    const providedSecret = webhookToken || bearerToken;

    if (!providedSecret) {
      return new Response(JSON.stringify({
        success: false, error: 'Webhook secret required',
      }), { status: 401 });
    }

    // Get stored webhook secret
    const ccRow = await env.DB.prepare(
      "SELECT value FROM settings WHERE key = 'confirmation_company'"
    ).first<{ value: string }>();

    if (!ccRow) {
      return new Response(JSON.stringify({
        success: false, error: 'Confirmation company not configured',
      }), { status: 404 });
    }

    const ccConfig: ConfirmationCompanyConfig = JSON.parse(ccRow.value);

    if (!ccConfig.webhook_secret || providedSecret !== ccConfig.webhook_secret) {
      return new Response(JSON.stringify({
        success: false, error: 'Invalid webhook secret',
      }), { status: 403 });
    }

    // ─── Parse Webhook Payload ───
    const body = await request.json() as any;

    // Support multiple payload formats the company might use
    const orderRef = body.order_ref || body.order_id || body.reference;
    const newStatus = body.status || body.order_status;
    const trackingNumber = body.tracking_number || body.tracking;
    const carrier = body.carrier || 'ecotrack';

    if (!orderRef) {
      return new Response(JSON.stringify({
        success: false, error: 'order_ref is required',
      }), { status: 400 });
    }

    // ─── Find Order ───
    // Try by order_number first, then by id
    let order = await env.DB.prepare(
      'SELECT id, status, tracking_number FROM orders WHERE order_number = ?'
    ).bind(parseInt(orderRef) || 0).first<{ id: string; status: string; tracking_number: string | null }>();

    if (!order) {
      order = await env.DB.prepare(
        'SELECT id, status, tracking_number FROM orders WHERE id = ?'
      ).bind(orderRef).first<{ id: string; status: string; tracking_number: string | null }>();
    }

    if (!order) {
      return new Response(JSON.stringify({
        success: false, error: `Order not found: ${orderRef}`,
      }), { status: 404 });
    }

    const now = new Date().toISOString();

    // ─── Map incoming status to our statuses ───
    const statusMap: Record<string, string> = {
      'confirmed': 'confirmed',
      'confirm': 'confirmed',
      'cancelled': 'cancelled',
      'canceled': 'cancelled',
      'cancel': 'cancelled',
      'no_answer': 'no_answer',
      'noanswer': 'no_answer',
      'shipped': 'shipped',
      'ship': 'shipped',
      'delivered': 'delivered',
      'deliver': 'delivered',
    };

    const mappedStatus = statusMap[newStatus?.toLowerCase()] || null;

    // ─── Build Update ───
    const updates: string[] = ['updated_at = ?'];
    const values: any[] = [now];

    if (mappedStatus && mappedStatus !== order.status) {
      updates.push('status = ?');
      values.push(mappedStatus);
    }

    if (trackingNumber && !order.tracking_number) {
      updates.push('tracking_number = ?');
      values.push(trackingNumber);
      updates.push('carrier = ?');
      values.push(carrier);

      // If tracking provided, mark as shipped
      if (!mappedStatus || mappedStatus === 'confirmed') {
        updates.push('status = ?');
        values.push('shipped');
      }
    }

    values.push(order.id);

    await env.DB.prepare(
      `UPDATE orders SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...values).run();

    // ─── Log the webhook event ───
    await env.DB.prepare(
      'INSERT INTO order_logs (order_id, action, old_value, new_value, details, actor, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      order.id,
      'webhook_received',
      order.status,
      mappedStatus || order.status,
      JSON.stringify({
        source: 'confirmation_company',
        tracking: trackingNumber || null,
        raw_status: newStatus,
        raw_payload: body,
      }),
      'confirmation_company',
      now,
    ).run();

    return new Response(JSON.stringify({
      success: true,
      data: { message: 'Order updated', orderId: order.id },
    }), { status: 200 });

  } catch (error: any) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({
      success: false, error: error.message || 'Webhook processing failed',
    }), { status: 500 });
  }
}
