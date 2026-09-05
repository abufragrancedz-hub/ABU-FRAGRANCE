import { DeliveryProvider } from './types';
import { ecotrackProvider } from './ecotrack';
import { dhdProvider } from './dhd';

const providers: Record<string, DeliveryProvider> = {
    'ecotrack': ecotrackProvider,
    'dhd-ecotrack': dhdProvider,
};

export const getDeliveryProvider = (carrierId: string): DeliveryProvider | null => {
    return providers[carrierId] || null;
};
