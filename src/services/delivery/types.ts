import { Order, StopDesk } from '../../types';

export interface DeliveryProvider {
    id: string;
    name: string;
    createOrder(order: Order, credentials?: DeliveryAPICredentials): Promise<{ trackingNumber: string; labelUrl?: string; actualDeliveryType?: string; note?: string }>;
    getOrderStatus(trackingNumber: string, credentials?: DeliveryAPICredentials): Promise<DeliveryStatus>;
    getStopDesks?(wilayaId: number): Promise<StopDesk[]>;
}

export type DeliveryStatus = 'pending' | 'shipped' | 'delivered' | 'cancelled' | 'returned';

export interface DeliveryAPICredentials {
    apiId: string;
    apiToken: string;
}
