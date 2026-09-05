/**
 * Public Orders Handler
 * Handles customer order placement (checkout)
 * Rate-limited, no auth required
 */

import { Env, OrderRow, orderRowToOrder, ConfirmationCompanyConfig } from '../types';
import { isRateLimited, getClientIP } from '../middleware/rate-limit';

// ─── PUBLIC: Create Order (Customer Checkout) ───
export async function createOrder(request: Request, env: Env): Promise<Response> {
  try {
    // ─── Rate Limit: max 10 orders per IP per hour ───
    const clientIP = getClientIP(request);
    if (await isRateLimited(env, `order:${clientIP}`, 10, 3600)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Too many orders. Please try again later.',
      }), { status: 429 });
    }

    const body = await request.json() as any;

    // ─── Validate Required Fields ───
    if (!body.customer?.fullName?.trim()) {
      return new Response(JSON.stringify({ success: false, error: 'Customer name is required' }), { status: 400 });
    }
    if (!body.customer?.phone?.trim()) {
      return new Response(JSON.stringify({ success: false, error: 'Phone number is required' }), { status: 400 });
    }
    if (!body.customer?.wilaya?.trim()) {
      return new Response(JSON.stringify({ success: false, error: 'Wilaya is required' }), { status: 400 });
    }
    if (!body.customer?.commune?.trim()) {
      return new Response(JSON.stringify({ success: false, error: 'Commune is required' }), { status: 400 });
    }
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return new Response(JSON.stringify({ success: false, error: 'At least one item is required' }), { status: 400 });
    }
    if (!body.total || body.total <= 0) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid total amount' }), { status: 400 });
    }

    // ─── Generate Order ID and Number ───
    const orderId = crypto.randomUUID();
    const now = new Date().toISOString();

    // Atomic order number increment
    const counterRow = await env.DB.prepare(
      "SELECT value FROM settings WHERE key = 'order_counter'"
    ).first<{ value: string }>();

    let lastNumber = 0;
    if (counterRow) {
      lastNumber = JSON.parse(counterRow.value).last_number || 0;
    }
    const orderNumber = lastNumber + 1;

    // Update counter
    await env.DB.prepare(
      "UPDATE settings SET value = ?, updated_at = ? WHERE key = 'order_counter'"
    ).bind(JSON.stringify({ last_number: orderNumber }), now).run();

    // ─── Insert Order ───
    await env.DB.prepare(`
      INSERT INTO orders (
        id, order_number,
        customer_name, customer_phone, customer_address,
        customer_wilaya, customer_wilaya_id, customer_commune,
        items, total, delivery_fee, delivery_type,
        stop_desk_id, stop_desk_name, stop_desk_address, stop_desk_commune,
        status, delivery_company, processed_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      orderId,
      orderNumber,
      body.customer.fullName.trim(),
      body.customer.phone.trim(),
      body.customer.address?.trim() || '',
      body.customer.wilaya.trim(),
      body.customer.wilayaId || null,
      body.customer.commune.trim(),
      JSON.stringify(body.items),
      Number(body.total),
      Number(body.deliveryFee) || 0,
      body.deliveryType || 'domicile',
      body.stopDesk?.id || null,
      body.stopDesk?.name || null,
      body.stopDesk?.address || null,
      body.stopDesk?.commune || null,
      'pending',
      body.deliveryCompany || 'anderson',
      'manual',
      now,
      now,
    ).run();

    // ─── Log order creation ───
    await env.DB.prepare(
      'INSERT INTO order_logs (order_id, action, new_value, actor, created_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(orderId, 'created', 'pending', 'customer', now).run();

    // ─── Auto-send to confirmation company if enabled ───
    try {
      const ccRow = await env.DB.prepare(
        "SELECT value FROM settings WHERE key = 'confirmation_company'"
      ).first<{ value: string }>();

      if (ccRow) {
        const ccConfig: ConfirmationCompanyConfig = JSON.parse(ccRow.value);
        if (ccConfig.enabled && ccConfig.api_token && ccConfig.api_url) {
          // Send to confirmation company in the background
          // We don't await — order is already saved in D1
        }
      }
    } catch (e) {
      console.error('Error checking confirmation company config:', e);
    }

    // ─── Auto-send to DHD if enabled ───
    if (body.deliveryCompany === 'dhd' && env.DHD_API_KEY) {
      sendToDHD(env, orderId, orderNumber, body).catch(err => {
        console.error(`Failed to send order ${orderNumber} to DHD:`, err);
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: { id: orderId, orderNumber },
    }), { status: 201 });

  } catch (error: any) {
    console.error('Order creation error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to create order. Please try again.',
    }), { status: 500 });
  }
}

/**
 * Send order to confirmation company API (non-blocking)
 */
async function sendToConfirmationCompany(
  env: Env,
  orderId: string,
  orderNumber: number,
  orderData: any,
  config: ConfirmationCompanyConfig,
): Promise<void> {
  const now = new Date().toISOString();

  try {
    const payload = {
      order_ref: orderNumber.toString(),
      customer_name: orderData.customer.fullName,
      customer_phone: orderData.customer.phone,
      customer_address: orderData.customer.address || '',
      customer_wilaya: orderData.customer.wilaya,
      customer_commune: orderData.customer.commune,
      items: orderData.items.map((i: any) => ({
        name: i.name,
        size: i.selectedSize,
        quantity: i.quantity,
        price: i.finalPrice,
      })),
      total: orderData.total,
      delivery_fee: orderData.deliveryFee || 0,
      delivery_type: orderData.deliveryType || 'domicile',
    };

    const response = await fetch(config.api_url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.api_token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      // Update order status to sent_to_company
      await env.DB.prepare(
        "UPDATE orders SET status = 'sent_to_company', processed_by = 'confirmation_company', updated_at = ? WHERE id = ?"
      ).bind(now, orderId).run();

      await env.DB.prepare(
        'INSERT INTO order_logs (order_id, action, old_value, new_value, actor, created_at) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(orderId, 'sent_to_company', 'pending', 'sent_to_company', 'system', now).run();
    } else {
      const errData = await response.text().catch(() => 'Unknown error');
      console.error(`Confirmation company API error (${response.status}):`, errData);

      // Log the failure but keep order as pending — admin can handle manually
      await env.DB.prepare(
        'INSERT INTO order_logs (order_id, action, details, actor, created_at) VALUES (?, ?, ?, ?, ?)'
      ).bind(orderId, 'company_send_failed', JSON.stringify({ status: response.status, error: errData }), 'system', now).run();
    }
  } catch (error: any) {
    console.error('Confirmation company send error:', error);

    await env.DB.prepare(
      'INSERT INTO order_logs (order_id, action, details, actor, created_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(orderId, 'company_send_failed', JSON.stringify({ error: error.message }), 'system', now).run();
  }
}

/**
 * Send order to DHD Delivery API (non-blocking)
 */
async function sendToDHD(
  env: Env,
  orderId: string,
  orderNumber: number,
  orderData: any,
): Promise<void> {
  const now = new Date().toISOString();

  try {
    const productNames = orderData.items.map((i: any) => `${i.name} (${i.selectedSize})`).join(', ');
    
    // Construct DHD API parameters
    const params = new URLSearchParams({
      api_token: env.DHD_API_KEY,
      reference: orderNumber.toString(),
      nom_client: orderData.customer.fullName,
      telephone: orderData.customer.phone,
      adresse: orderData.customer.address || '',
      commune: orderData.customer.commune,
      code_wilaya: orderData.customer.wilayaId.toString(),
      montant: orderData.total.toString(),
      type: '1', // 1 = Livraison
      stop_desk: orderData.deliveryType === 'office' ? '1' : '0',
      produit: productNames,
      stock: '0',
    });

    const url = `${env.DHD_API_URL || 'https://platform.dhd-dz.com'}/api/v1/create/order?${params.toString()}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
      },
    });

    const result = await response.json() as any;

    if (result.success || result.tracking) {
      const trackingNumber = result.tracking || '';
      
      // Update order status and tracking
      await env.DB.prepare(
        "UPDATE orders SET status = 'shipped', tracking_number = ?, carrier = 'DHD', updated_at = ? WHERE id = ?"
      ).bind(trackingNumber, now, orderId).run();

      await env.DB.prepare(
        'INSERT INTO order_logs (order_id, action, details, actor, created_at) VALUES (?, ?, ?, ?, ?)'
      ).bind(orderId, 'sent_to_dhd', JSON.stringify({ tracking: trackingNumber }), 'system', now).run();
    } else {
      console.error(`DHD API error:`, result);
      
      await env.DB.prepare(
        'INSERT INTO order_logs (order_id, action, details, actor, created_at) VALUES (?, ?, ?, ?, ?)'
      ).bind(orderId, 'dhd_send_failed', JSON.stringify(result), 'system', now).run();
    }
  } catch (error: any) {
    console.error('DHD send error:', error);
    await env.DB.prepare(
      'INSERT INTO order_logs (order_id, action, details, actor, created_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(orderId, 'dhd_send_failed', JSON.stringify({ error: error.message }), 'system', now).run();
  }
}
