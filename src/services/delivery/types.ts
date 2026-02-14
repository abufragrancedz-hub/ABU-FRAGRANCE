import { Order } from '../../types';

export interface DeliveryProvider {
    id: string;
    name: string;
    createOrder(order: Order, credentials?: DeliveryAPICredentials): Promise<{ trackingNumber: string; labelUrl?: string }>;
    getOrderStatus(trackingNumber: string, credentials?: DeliveryAPICredentials): Promise<DeliveryStatus>;
}

export type DeliveryStatus = 'pending' | 'shipped' | 'delivered' | 'cancelled' | 'returned';

export interface DeliveryAPICredentials {
    apiId: string;
    apiToken: string;
}
