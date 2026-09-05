export type Carrier = 'ecotrack' | 'dhd';

export const CARRIERS: { id: Carrier; name: string; urlPattern?: string }[] = [
    { id: 'ecotrack', name: 'EcoTrack (Anderson)', urlPattern: 'https://anderson-ecommerce-ecotrack.com/tracking/{tracking}' },
    { id: 'dhd',      name: 'DHD Delivery',        urlPattern: 'https://platform.dhd-dz.com/tracking/{tracking}' },
];

export const getTrackingUrl = (carrier: Carrier | undefined, trackingNumber: string | undefined): string | null => {
    if (!carrier || !trackingNumber) return null;
    const carrierDef = CARRIERS.find(c => c.id === carrier);
    if (carrierDef?.urlPattern) {
        return carrierDef.urlPattern.replace('{tracking}', trackingNumber);
    }
    return null;
};
