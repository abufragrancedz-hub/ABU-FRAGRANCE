import { DeliveryProvider, DeliveryAPICredentials, DeliveryStatus } from './types';
import { Order } from '../../types';
import { getDHDDeliveryPrice } from '../../data/dhd_wilayas';

/**
 * DHD Delivery Provider
 * Uses the EcoTrack system but with a different API.
 * API integration is PENDING — we do not have the API key yet.
 * For now, this provider only calculates fees locally (no real API calls).
 * When the API key is available, implement createOrder using the DHD endpoint.
 */
export const dhdProvider: DeliveryProvider = {
    id: 'dhd-ecotrack',
    name: 'DHD Delivery',

    getStopDesks: async (_wilayaId: number) => {
        // DHD stop desks not available yet — will be added when API is ready
        return [];
    },

    createOrder: async (_order: Order, _credentials?: DeliveryAPICredentials) => {
        // TODO: Implement when DHD API key is available
        // DHD uses EcoTrack system — endpoint and credentials TBD
        console.warn('[DHD] API key not configured yet. Cannot create order automatically.');
        throw new Error('DHD API not yet configured. Please add the order manually in the DHD dashboard.');
    },

    getOrderStatus: async (_trackingNumber: string, _credentials?: DeliveryAPICredentials): Promise<DeliveryStatus> => {
        // TODO: Implement when DHD API key is available
        return 'shipped' as DeliveryStatus;
    }
};

// Re-export fee helper so it can be used directly in UI
export { getDHDDeliveryPrice };
