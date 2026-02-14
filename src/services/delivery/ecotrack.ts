import { DeliveryProvider, DeliveryAPICredentials, DeliveryStatus } from './types';
import { Order } from '../../types';

// Use a proxy-friendly URL to bypass CORS in development
// The actual mapping is in vite.config.js
const ECOTRACK_API_URL = '/api/ecotrack/v1';

// Helper: aggressively search for tracking number in API response
const findTrackingInResponse = (obj: any): string | null => {
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
};

// Helper: make the actual API call
const callEcoTrackAPI = async (token: string, payload: any): Promise<{ response: Response; data: any }> => {
    const response = await fetch(`${ECOTRACK_API_URL}/create/order`, {
        method: 'POST',
        headers: {
            'token': token,
            'api-token': token,
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => ({}));
    return { response, data };
};

export const ecotrackProvider: DeliveryProvider = {
    id: 'ecotrack',
    name: 'EcoTrack (Anderson)',
    createOrder: async (order: Order, credentials?: DeliveryAPICredentials) => {
        const token = credentials?.apiToken || 'cd0AorC5etAC2Trj84hLzg47N9e7OoaxPJg9cwDVDMe489SHP87yHObCVo58';

        // Defensive wilaya lookup: if wilayaId is missing (old orders), find it by name
        let wilayaCodeNum = order.customer.wilayaId;
        if (!wilayaCodeNum) {
            const wilayasDefault = [
                { id: 1, name: "Adrar" }, { id: 2, name: "Chlef" }, { id: 3, name: "Laghouat" }, { id: 4, name: "Oum El Bouaghi" },
                { id: 5, name: "Batna" }, { id: 6, name: "Béjaïa" }, { id: 7, name: "Biskra" }, { id: 8, name: "Béchar" },
                { id: 9, name: "Blida" }, { id: 10, name: "Bouira" }, { id: 11, name: "Tamanrasset" }, { id: 12, name: "Tébessa" },
                { id: 13, name: "Tlemcen" }, { id: 14, name: "Tiaret" }, { id: 15, name: "Tizi Ouzou" }, { id: 16, name: "Algiers" },
                { id: 16, name: "Alger" }, { id: 17, name: "Djelfa" }, { id: 18, name: "Jijel" }, { id: 19, name: "Sétif" },
                { id: 20, name: "Saïda" }, { id: 21, name: "Skikda" }, { id: 22, name: "Sidi Bel Abbès" }, { id: 23, name: "Annaba" },
                { id: 24, name: "Guelma" }, { id: 25, name: "Constantine" }, { id: 26, name: "Médéa" }, { id: 27, name: "Mostaganem" },
                { id: 28, name: "M'Sila" }, { id: 29, name: "Mascara" }, { id: 30, name: "Ouargla" }, { id: 31, name: "Oran" },
                { id: 32, name: "El Bayadh" }, { id: 33, name: "Illizi" }, { id: 34, name: "Bordj Bou Arréridj" }, { id: 35, name: "Boumerdès" },
                { id: 36, name: "El Tarf" }, { id: 37, name: "Tindouf" }, { id: 38, name: "Tissemsilt" }, { id: 39, name: "El Oued" },
                { id: 40, name: "Khenchela" }, { id: 41, name: "Souk Ahras" }, { id: 42, name: "Tipaza" }, { id: 43, name: "Mila" },
                { id: 44, name: "Aïn Defla" }, { id: 45, name: "Naâma" }, { id: 46, name: "Aïn Témouchent" }, { id: 47, name: "Ghardaïa" },
                { id: 48, name: "Relizane" }, { id: 49, name: "Timimoun" }, { id: 50, name: "Bordj Badji Mokhtar" }, { id: 51, name: "Ouled Djellal" },
                { id: 52, name: "Béni Abbès" }, { id: 53, name: "In Salah" }, { id: 54, name: "In Guezzam" }, { id: 55, name: "Touggourt" },
                { id: 56, name: "Djanet" }, { id: 57, name: "El M'Ghair" }, { id: 58, name: "El Menia" }
            ];
            const found = wilayasDefault.find(w => w.name.toLowerCase() === order.customer.wilaya.toLowerCase());
            wilayaCodeNum = found ? found.id : 16;
        }

        const wilayaCode = wilayaCodeNum.toString().padStart(2, '0');
        const isOffice = order.deliveryType === 'office';

        const payload: any = {
            reference: order.id,
            nom_client: order.customer.fullName,
            telephone: order.customer.phone,
            adresse: order.customer.address,
            commune: order.customer.commune,
            code_wilaya: wilayaCode,
            montant: Number(order.total),
            produit: order.items.map(i => `${i.name} (${i.selectedSize || 'N/A'})`).join(', '),
            type: 1,
            stop_desk: isOffice ? 1 : 0
        };

        console.log("=== ECOTRACK PAYLOAD ===", JSON.stringify(payload, null, 2));

        try {
            const { response, data } = await callEcoTrackAPI(token, payload);
            console.log("=== ECOTRACK RESPONSE ===", response.status, JSON.stringify(data, null, 2));

            // SUCCESS
            if (response.ok && data.status !== false) {
                const tracking = findTrackingInResponse(data);
                const label = data.label_url || data.order?.label_url || data.label || '#';
                if (tracking) return { trackingNumber: tracking, labelUrl: label };
                throw new Error(`No tracking number in response: ${JSON.stringify(data)}`);
            }

            // 422 ERROR — check if it's a StopDesk issue
            if (response.status === 422 && isOffice) {
                const errText = JSON.stringify(data).toLowerCase();
                if (errText.includes('stop') || errText.includes('desk') || errText.includes('disponible') || errText.includes('commune')) {
                    throw new Error(
                        `⚠️ Stop Desk (Office Pickup) is NOT available for this commune "${order.customer.commune}". ` +
                        `Please switch to "Domicile" delivery and sync again, or contact the customer.`
                    );
                }
            }

            // Generic error handling
            if (response.status === 422 && data.errors) {
                const errorMsg = Object.entries(data.errors)
                    .map(([field, msgs]) => `${field}: ${(msgs as string[]).join(', ')}`)
                    .join(' | ');
                throw new Error(`Validation Error: ${errorMsg}`);
            }
            throw new Error(data.message || data.error || data.msg || `Delivery API Error (${response.status}): ${JSON.stringify(data)}`);

        } catch (error) {
            console.error("EcoTrack Order Creation Error:", error);
            throw error;
        }
    },
    getOrderStatus: async (trackingNumber: string, credentials?: DeliveryAPICredentials) => {
        const token = credentials?.apiToken || 'cd0AorC5etAC2Trj84hLzg47N9e7OoaxPJg9cwDVDMe489SHP87yHObCVo58';

        try {
            const response = await fetch(`${ECOTRACK_API_URL}/tracking/info/${trackingNumber}`, {
                headers: {
                    'api-token': token,
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) return 'shipped';

            const data = await response.json();
            const statusMap: Record<string, string> = {
                'Livré': 'delivered',
                'Retourné': 'returned',
                'En cours de livraison': 'shipped',
                'Expédié': 'shipped',
                'Annulé': 'cancelled'
            };

            return (statusMap[data.status] || 'shipped') as DeliveryStatus;
        } catch (error) {
            console.error("EcoTrack Status Error:", error);
            return 'shipped' as DeliveryStatus;
        }
    }
};
