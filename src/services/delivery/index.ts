import { DeliveryProvider } from './types';
import { ecotrackProvider } from './ecotrack';

const providers: Record<string, DeliveryProvider> = {
    'ecotrack': ecotrackProvider,
};

export const getDeliveryProvider = (carrierId: string): DeliveryProvider | null => {
    return providers[carrierId] || null;
};
