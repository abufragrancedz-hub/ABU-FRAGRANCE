/**
 * Communes data - sourced from EcoTrack's official API
 * to ensure commune names exactly match what the delivery provider expects.
 * 
 * Fallback: algeria_cities.json is used for wilayas not covered by EcoTrack.
 */
import ecotrackCommunesData from './ecotrack_communes.json';
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

// EcoTrack commune structure: { nom, wilaya_id, code_postal, has_stop_desk }
interface EcoTrackCommuneEntry {
    nom: string;
    wilaya_id: number;
    code_postal: string;
    has_stop_desk: number;
}

interface EcoTrackWilayaData {
    wilaya_id: number;
    wilaya_name: string;
    communes: EcoTrackCommuneEntry[];
}

// Type the imported data
const ecotrackCommunes = ecotrackCommunesData as Record<string, EcoTrackWilayaData>;

// Old data as fallback
interface OldCityEntry {
    id: number;
    commune_name_ascii: string;
    commune_name: string;
    daira_name_ascii: string;
    daira_name: string;
    wilaya_code: string;
    wilaya_name_ascii: string;
    wilaya_name: string;
}
const oldCities = citiesData as OldCityEntry[];

export const getCommunesByWilayaId = (wilayaId: number): Commune[] => {
    const key = wilayaId.toString();
    
    // Try EcoTrack data first (official source)
    const ecoData = ecotrackCommunes[key];
    if (ecoData && ecoData.communes && ecoData.communes.length > 0) {
        return ecoData.communes
            .map((c, index) => ({
                id: Number(c.code_postal) || (wilayaId * 100 + index),
                commune_name_ascii: c.nom,   // This is the EXACT name EcoTrack expects
                commune_name: c.nom,          // Use same for display
                daira_name_ascii: '',
                daira_name: '',
                wilaya_code: key.padStart(2, '0'),
                wilaya_name_ascii: ecoData.wilaya_name,
                wilaya_name: ecoData.wilaya_name
            }))
            .sort((a, b) => a.commune_name_ascii.localeCompare(b.commune_name_ascii));
    }
    
    // Fallback to old algeria_cities.json for wilayas not in EcoTrack
    const code = key.padStart(2, '0');
    const result = oldCities.filter(c => c.wilaya_code === code);
    
    return result.sort((a, b) => a.commune_name_ascii.localeCompare(b.commune_name_ascii));
};
