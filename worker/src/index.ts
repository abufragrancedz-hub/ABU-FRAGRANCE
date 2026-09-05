/**
 * Main Cloudflare Worker Entrypoint
 * Routes incoming requests to appropriate handlers and applies middleware
 */

import { Env, AuthUser } from './types';
import { handleOptions, withCors } from './middleware/cors';
import { requireAdmin } from './auth';

// Handlers
import { getProducts, getProduct, adminGetProducts, createProduct, updateProduct, deleteProduct, adminSyncCache } from './handlers/products';
import { createOrder } from './handlers/orders-public';
import { listOrders, getOrder, updateOrderStatus, deleteOrder, exportOrders, getDashboardStats } from './handlers/orders-admin';
import { shipOrder, batchShipOrders, checkOrderStatuses } from './handlers/shipping';
import { getSettings, getPublicSetting, updateSetting } from './handlers/settings';
import { handleConfirmationWebhook } from './handlers/webhook';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;
    const path = url.pathname;

    // Handle Preflight OPTIONS
    if (method === 'OPTIONS') {
      return handleOptions(request, env);
    }

    try {
      // ─── PUBLIC ENDPOINTS ───
      // Used by storefront browser clients

      if (path === '/api/products' && method === 'GET') {
        const res = await getProducts(request, env);
        return withCors(res, request, env);
      }
      
      if (path.startsWith('/api/products/') && method === 'GET') {
        const id = path.split('/')[3];
        if (id) {
          const res = await getProduct(request, env, id);
          return withCors(res, request, env);
        }
      }

      if (path === '/api/orders' && method === 'POST') {
        const res = await createOrder(request, env);
        return withCors(res, request, env);
      }

      if (path === '/api/settings/marketing' && method === 'GET') {
        const res = await getPublicSetting(request, env, 'marketing');
        return withCors(res, request, env);
      }

      // ─── WEBHOOKS ───
      // Used by third-party services

      if (path === '/api/webhook/confirmation' && method === 'POST') {
        const res = await handleConfirmationWebhook(request, env);
        return res;
      }

      // ─── ADMIN ENDPOINTS ───
      // Require Authentication
      if (path.startsWith('/api/admin/')) {
        const authResult = await requireAdmin(request, env);
        if (authResult instanceof Response) {
          // It's an error response (401/403)
          return withCors(authResult, request, env);
        }

        // Passed Auth
        const _admin = authResult as AuthUser;
        let res: Response;

        // Admin Products
        if (path === '/api/admin/products' && method === 'GET') {
          res = await adminGetProducts(request, env);
        } else if (path === '/api/admin/products' && method === 'POST') {
          res = await createProduct(request, env);
        } else if (path.match(/^\/api\/admin\/products\/[^/]+$/)) {
          const id = path.split('/')[4];
          if (method === 'PUT') res = await updateProduct(request, env, id);
          else if (method === 'DELETE') res = await deleteProduct(request, env, id);
          else res = new Response('Method Not Allowed', { status: 405 });
        } else if (path === '/api/admin/sync-cache' && method === 'POST') {
          res = await adminSyncCache(request, env);
        }

        // Admin Orders
        else if (path === '/api/admin/orders' && method === 'GET') {
          res = await listOrders(request, env);
        } else if (path === '/api/admin/orders/export' && method === 'GET') {
          res = await exportOrders(request, env);
        } else if (path === '/api/admin/orders/stats' && method === 'GET') {
          res = await getDashboardStats(request, env);
        } else if (path === '/api/admin/orders/batch-ship' && method === 'POST') {
          res = await batchShipOrders(request, env);
        } else if (path === '/api/admin/orders/check-statuses' && method === 'POST') {
          res = await checkOrderStatuses(request, env);
        } else if (path.match(/^\/api\/admin\/orders\/[^/]+$/)) {
          const id = path.split('/')[4];
          if (method === 'GET') res = await getOrder(request, env, id);
          else if (method === 'DELETE') res = await deleteOrder(request, env, id);
          else res = new Response('Method Not Allowed', { status: 405 });
        } else if (path.match(/^\/api\/admin\/orders\/[^/]+\/status$/) && method === 'PUT') {
          const id = path.split('/')[4];
          res = await updateOrderStatus(request, env, id);
        } else if (path.match(/^\/api\/admin\/orders\/[^/]+\/ship$/) && method === 'POST') {
          const id = path.split('/')[4];
          res = await shipOrder(request, env, id);
        }

        // Admin Settings
        else if (path === '/api/admin/settings' && method === 'GET') {
          res = await getSettings(request, env);
        } else if (path.match(/^\/api\/admin\/settings\/[^/]+$/) && method === 'PUT') {
          const key = path.split('/')[4];
          res = await updateSetting(request, env, key);
        }
        
        // Debug EcoTrack (temporary - remove after fixing fragile)
        else if (path === '/api/admin/debug-ecotrack' && method === 'POST') {
          const rawResult = await debugEcoTrackCall(env);
          res = new Response(JSON.stringify(rawResult, null, 2), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        // Debug EcoTrack (temporary - remove after fixing fragile)
        else if (path === '/api/admin/debug-ecotrack' && method === 'POST') {
          const rawResult = await debugEcoTrackCall(env);
          res = new Response(JSON.stringify(rawResult, null, 2), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        else {
          res = new Response('Not Found', { status: 404 });
        }

        return withCors(res, request, env);
      }

      // Default Not Found
      return withCors(new Response(JSON.stringify({ error: 'Endpoint not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      }), request, env);

    } catch (error: any) {
      console.error('Unhandled Server Error: ', error);
      return withCors(new Response(JSON.stringify({ error: 'Internal Server Error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }), request, env);
    }
  },
};
