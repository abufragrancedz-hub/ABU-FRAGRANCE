import citiesData from './algeria_cities.json';

export interface Commune {
    id: number;
    commune_name_ascii: string;
    commune_name: string;
    daira_name_ascii: string;
    daira_name: string;
    wilaya_code: string;
    wilaya_name_ascii: string;
    wilaya_name: string;
}

const communes: Commune[] = citiesData as Commune[];

// Helper for new wilayas 59-69 which might not differ from their main city in this context
const newWilayaCommunes: Record<string, { ar: string, en: string }> = {
    "59": { ar: "أفلو", en: "Aflou" },
    "60": { ar: "بريكة", en: "Barika" },
    "61": { ar: "قصر الشلالة", en: "Ksar Chellala" },
    "62": { ar: "مسعد", en: "Messaad" },
    "63": { ar: "عين وسارة", en: "Aïn Oussera" },
    "64": { ar: "بوسعادة", en: "Boussaâda" },
    "65": { ar: "الأبيض سيدي الشيخ", en: "El Abiodh Sidi Cheikh" },
    "66": { ar: "القنطرة", en: "El Kantara" },
    "67": { ar: "بئر العاتر", en: "Bir El Ater" },
    "68": { ar: "قصر البخاري", en: "Ksar El Boukhari" },
    "69": { ar: "العريشة", en: "El Aricha" }
};

export const getCommunesByWilayaId = (wilayaId: number): Commune[] => {
    // The JSON uses string "01", "02" etc for wilaya_code.
    const code = wilayaId.toString().padStart(2, '0');

    let result = communes.filter(c => c.wilaya_code === code);

    // If no communes found for new wilayas (59-69), inject default
    if (result.length === 0 && wilayaId >= 59 && newWilayaCommunes[code]) {
        return [{
            id: Number(code + "01"),
            commune_name_ascii: newWilayaCommunes[code].en,
            commune_name: newWilayaCommunes[code].ar,
            daira_name_ascii: newWilayaCommunes[code].en,
            daira_name: newWilayaCommunes[code].ar,
            wilaya_code: code,
            wilaya_name_ascii: newWilayaCommunes[code].en,
            wilaya_name: newWilayaCommunes[code].ar
        }];
    }

    return result.sort((a, b) => a.commune_name_ascii.localeCompare(b.commune_name_ascii));
};
