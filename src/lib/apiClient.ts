/// <reference types="vite/client" />
import { auth } from './firebase';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://abu-fragrance-api.abufragrancedz.workers.dev';

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = new Headers(options.headers || {});
    
    // Auth token for admin endpoints
    if (endpoint.startsWith('/api/admin')) {
        const user = auth.currentUser;
        if (user) {
            const token = await user.getIdToken();
            headers.set('Authorization', `Bearer ${token}`);
        } else {
            console.warn('apiFetch: Admin endpoint called without authenticated user.');
        }
    }
    
    // Only set Content-Type if we're sending a body and haven't explicitly disabled it (like for FormData)
    if (options.body && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    try {
        const res = await fetch(url, { ...options, headers });
        
        let data;
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            try {
                data = await res.json();
            } catch (err) {
                console.warn('apiFetch: JSON parse error:', err);
                data = { error: 'Invalid JSON response' };
            }
        } else {
            data = { message: await res.text() };
        }

        if (!res.ok) {
            throw new Error(data?.error || `API Error: ${res.status}`);
        }

        // Return the full JSON envelope (including meta, data, trackingNumber, etc)
        // Ensure we always return an object to prevent destructuring/access errors
        return data || { success: true };
    } catch (error) {
        console.error(`apiFetch error for ${endpoint}:`, error);
        throw error;
    }
}
