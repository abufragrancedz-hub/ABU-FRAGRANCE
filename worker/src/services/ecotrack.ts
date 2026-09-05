/**
 * EcoTrack (Anderson) Delivery API Client
 * Ported from frontend src/services/delivery/ecotrack.ts
 * Now runs server-side in Worker — API token NEVER exposed to browser
 */

import { Env, Order } from '../types';

const ECOTRACK_API_URL = 'https://anderson-ecommerce.ecotrack.dz/api/v1';

export interface ShipResult {
  trackingNumber: string;
  labelUrl?: string;
  actualDeliveryType?: string;
  note?: string;
}

/**
 * Search nested API response for a tracking number
 */
function findTrackingInResponse(obj: any): string | null {
  if (!obj) return null;
  const keys = ['tracking', 'tracking_number', 'barcode', 'id', 'ref', 'reference_tracking', 'order_id'];
  for (const key of keys) {
    if (obj[key] && typeof obj[key] === 'string') return obj[key];
    if (obj[key] && typeof obj[key] === 'number') return obj[key].toString();
  }
  if (obj.order) return findTrackingInResponse(obj.order);
  if (obj.data) return findTrackingInResponse(obj.data);
  if (Array.isArray(obj.orders) && obj.orders[0]) return findTrackingInResponse(obj.orders[0]);
  if (Array.isArray(obj) && obj[0]) return findTrackingInResponse(obj[0]);
  return null;
}

/**
 * Make an EcoTrack API call
 */
async function callEcoTrackAPI(
  token: string,
  payload: any,
  endpoint: string = '/create/order',
  method: string = 'POST'
): Promise<{ response: Response; data: any }> {
  const bodyStr = method !== 'GET' ? JSON.stringify(payload) : undefined;

  const response = await fetch(`${ECOTRACK_API_URL}${endpoint}`, {
    method,
    headers: {
      'token': token,
      'api-token': token,
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: bodyStr,
  });
  const data = await response.json().catch(() => ({}));

  return { response, data };
}

/**
 * Build the EcoTrack order payload from our Order object
 */
function buildPayload(order: Order): any {
  const isOffice = order.deliveryType === 'office';

  const targetCommune = (isOffice && order.stopDesk?.commune)
    ? order.stopDesk.commune
    : order.customer.commune;

  const payload: any = {
    reference: (order.orderNumber || order.id).toString(),
    nom_client: order.customer.fullName,
    telephone: order.customer.phone,
    adresse: (isOffice && order.stopDesk?.address)
      ? order.stopDesk.address
      : (order.customer.address || order.customer.commune),
    commune: targetCommune,
    code_wilaya: Number(order.customer.wilayaId || 16),
    montant: Number(order.total),
    produit: order.items.map(i => `${i.name} (${i.selectedSize || 'N/A'})`).join(', '),
    type: 1,
    fragile: 1,
    remarque: 'FRAGILE',
    stop_desk: isOffice ? 1 : 0,
  };

  if (isOffice && order.stopDesk?.id) {
    payload.stop_desk_id = order.stopDesk.id;
  }

  return payload;
}

/**
 * Create an order in EcoTrack delivery system
 * Handles office→domicile fallback automatically
 */
export async function createEcoTrackOrder(order: Order, env: Env): Promise<ShipResult> {
  const token = env.ECOTRACK_API_TOKEN;
  if (!token) {
    throw new Error('EcoTrack API token not configured. Set it in Admin Settings.');
  }

  // Prevent duplicate shipments
  if (order.trackingNumber) {
    throw new Error(`Order #${order.orderNumber} already has tracking number: ${order.trackingNumber}`);
  }

  // Use the confirmed standard API field names (validated via debug endpoint)
  const payload = {
    ...buildPayload(order),
    fragile: 1,
  };

  const { response, data } = await callEcoTrackAPI(token, payload, '/create/order', 'POST');

  // ─── SUCCESS ───
  if (response.ok && data.status !== false) {
    const tracking = findTrackingInResponse(data);
    const label = data.label_url || data.order?.label_url || data.label || '#';

    if (tracking) {
      return { trackingNumber: tracking, labelUrl: label };
    }

    // Check results for plural endpoint
    if (data.results) {
      const ref = (order.orderNumber || order.id).toString();
      const res = data.results[ref] || data.results["0"];
      if (res && res.tracking) {
        return { trackingNumber: res.tracking, labelUrl: res.label_url || '#' };
      }
    }
    throw new Error(`No tracking number in response: ${JSON.stringify(data)}`);
  }

  // ─── 422 with StopDesk issue — Auto-retry as domicile ───
  if (response.status === 422 && order.deliveryType === 'office') {
    const errText = JSON.stringify(data).toLowerCase();
    if (errText.includes('stop') || errText.includes('desk') || errText.includes('disponible') || errText.includes('commune')) {
      // Retry as domicile
      payload.stop_desk = 0;
      payload.commune = order.customer.commune;
      payload.adresse = order.customer.address;
      delete payload.stop_desk_id;

      const retry = await callEcoTrackAPI(token, payload);

      if (retry.response.ok && retry.data.status !== false) {
        const tracking = findTrackingInResponse(retry.data);
        const label = retry.data.label_url || retry.data.order?.label_url || retry.data.label || '#';
        if (tracking) {
          return {
            trackingNumber: tracking,
            labelUrl: label,
            actualDeliveryType: 'domicile',
            note: 'Selected StopDesk was not available. Automatically switched to Domicile.',
          };
        }
      }

      const retryErr = retry.data.message || JSON.stringify(retry.data);
      throw new Error(`StopDesk unavailable & Domicile retry failed: ${retryErr}`);
    }
  }

  // ─── 422 Validation Errors ───
  if (response.status === 422 && data.errors) {
    const errorMsg = Object.entries(data.errors)
      .map(([field, msgs]) => `${field}: ${(msgs as string[]).join(', ')}`)
      .join(' | ');
    throw new Error(`Validation Error: ${errorMsg}`);
  }

  // ─── Generic Error ───
  throw new Error(
    data.message || data.error || data.msg ||
    `EcoTrack API Error (${response.status}): ${JSON.stringify(data)}`
  );
}

/**
 * Check order status from EcoTrack
 * Note: The tracking/info endpoint was returning 404 in the original code.
 * Keeping this as a placeholder for when/if EcoTrack fixes it.
 */
export async function getEcoTrackStatus(
  trackingNumber: string,
  env: Env
): Promise<string | null> {
  const token = env.ECOTRACK_API_TOKEN;
  if (!token) return null;

  try {
    const { response, data } = await callEcoTrackAPI(
      token,
      null,
      `/tracking/info?tracking=${trackingNumber}`,
      'GET'
    );

    if (response.ok && data.status) {
      // Map EcoTrack statuses to our statuses
      const statusMap: Record<string, string> = {
        'livré': 'delivered',
        'livre': 'delivered',
        'delivered': 'delivered',
        'retourné': 'cancelled',
        'retourne': 'cancelled',
        'returned': 'cancelled',
      };
      const normalized = String(data.status).toLowerCase();
      return statusMap[normalized] || null;
    }
  } catch {
    // EcoTrack tracking endpoint may not be available
  }

  return null;
}

