/**
 * DHD Delivery API Client
 * DHD runs on the same EcoTrack engine as Anderson.
 * Uses identical request format: JSON body + same headers.
 * Only difference: different base URL and API token.
 */

import { Order } from '../types';

export interface ShipResult {
  trackingNumber: string;
  labelUrl?: string;
  actualDeliveryType?: string;
  note?: string;
}

// ─── Shared Utility: find tracking number anywhere in response ───
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

// ─── API Call (identical to EcoTrack pattern) ───
async function callDHDAPI(
  baseUrl: string,
  token: string,
  payload: any,
  endpoint: string = '/create/order',
  method: string = 'POST'
): Promise<{ response: Response; data: any }> {
  const bodyStr = method !== 'GET' ? JSON.stringify(payload) : undefined;

  const response = await fetch(`${baseUrl}/api/v1${endpoint}`, {
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
  console.log(`[DHD] ${method} ${baseUrl}/api/v1${endpoint} → ${response.status}: ${JSON.stringify(data).substring(0, 300)}`);
  return { response, data };
}

// ─── Build Payload (identical structure to EcoTrack) ───
function buildDHDPayload(order: Order): any {
  const isOffice = order.deliveryType === 'office';

  const payload: any = {
    reference: (order.orderNumber || order.id).toString(),
    nom_client: order.customer.fullName,
    telephone: order.customer.phone,
    adresse: (isOffice && order.stopDesk?.address)
      ? order.stopDesk.address
      : (order.customer.address || order.customer.commune),
    commune: (isOffice && order.stopDesk?.commune)
      ? order.stopDesk.commune
      : order.customer.commune,
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
 * Create an order in DHD delivery system.
 * Token is read from DB delivery_config (Admin Settings > DHD Delivery > API Token).
 */
export async function createDHDOrder(order: Order, token: string, baseUrl: string = 'https://platform.dhd-dz.com'): Promise<ShipResult> {
  const cleanToken = token.trim();
  const cleanUrl = baseUrl.replace(/\/$/, '');

  const payload = buildDHDPayload(order);
  const { response, data } = await callDHDAPI(cleanUrl, cleanToken, payload, '/create/order', 'POST');

  // ─── SUCCESS ───
  if (response.ok && data.status !== false) {
    const tracking = findTrackingInResponse(data);
    const label = data.label_url || data.order?.label_url || data.label || '#';

    if (tracking) {
      return { trackingNumber: tracking, labelUrl: label };
    }

    if (data.results) {
      const ref = (order.orderNumber || order.id).toString();
      const res = data.results[ref] || data.results['0'];
      if (res?.tracking) {
        return { trackingNumber: res.tracking, labelUrl: res.label_url || '#' };
      }
    }

    throw new Error(`DHD success but no tracking number found. Response: ${JSON.stringify(data)}`);
  }

  // ─── 422 StopDesk unavailable → Auto-retry as domicile ───
  if (response.status === 422 && order.deliveryType === 'office') {
    const errText = JSON.stringify(data).toLowerCase();
    if (errText.includes('stop') || errText.includes('desk') || errText.includes('commune')) {
      payload.stop_desk = 0;
      payload.commune = order.customer.commune;
      payload.adresse = order.customer.address;
      delete payload.stop_desk_id;

      const retry = await callDHDAPI(cleanUrl, cleanToken, payload);
      if (retry.response.ok && retry.data.status !== false) {
        const tracking = findTrackingInResponse(retry.data);
        if (tracking) {
          return {
            trackingNumber: tracking,
            labelUrl: retry.data.label_url || '#',
            actualDeliveryType: 'domicile',
            note: 'StopDesk unavailable, automatically switched to Domicile delivery.',
          };
        }
      }
      throw new Error(`StopDesk unavailable & Domicile retry failed: ${retry.data.message || JSON.stringify(retry.data)}`);
    }
  }

  // ─── 422 Validation Errors ───
  if (response.status === 422 && data.errors) {
    const errorMsg = Object.entries(data.errors)
      .map(([field, msgs]) => `${field}: ${(msgs as string[]).join(', ')}`)
      .join(' | ');
    throw new Error(`DHD Validation Error: ${errorMsg}`);
  }

  // ─── 401 Unauthenticated ───
  if (response.status === 401) {
    throw new Error('DHD API: Unauthenticated. Check that your DHD_API_KEY secret is correct.');
  }

  // ─── Generic Error ───
  throw new Error(
    data.message || data.error || data.msg ||
    `DHD API Error (${response.status}): ${JSON.stringify(data)}`
  );
}

/**
 * Check order status from DHD
 */
export async function getDHDStatus(trackingNumber: string, token: string, baseUrl: string = 'https://platform.dhd-dz.com'): Promise<string | null> {
  if (!token) return null;
  const cleanUrl = baseUrl.replace(/\/$/, '');
  const cleanToken = token.trim();

  try {
    const { response, data } = await callDHDAPI(
      cleanUrl, cleanToken, null,
      `/tracking/info?tracking=${trackingNumber}`, 'GET'
    );
    if (response.ok && data.status) {
      const statusMap: Record<string, string> = {
        'livré': 'delivered', 'livre': 'delivered', 'delivered': 'delivered',
        'retourné': 'cancelled', 'retourne': 'cancelled', 'returned': 'cancelled',
      };
      return statusMap[String(data.status).toLowerCase()] || null;
    }
  } catch {
    // Tracking endpoint may not be available
  }
  return null;
}
