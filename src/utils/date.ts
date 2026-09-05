export function formatOrderDate(rawDate: any, order?: any): string {
    // If rawDate is missing, try to find it in the order object if provided
    let dateToParse = rawDate;
    if (!dateToParse && order) {
        dateToParse = order.date || order.createdAt || order.created_at;
    }

    if (!dateToParse) return 'Date unavailable';

    let parsedDate: Date | null = null;
    try {
        if (dateToParse instanceof Date) {
            parsedDate = dateToParse;
        } else if (typeof dateToParse === 'number') {
            parsedDate = new Date(dateToParse);
        } else if (typeof dateToParse === 'string') {
            parsedDate = new Date(dateToParse);
        } else if (typeof dateToParse === 'object') {
            if (typeof dateToParse.toDate === 'function') {
                parsedDate = dateToParse.toDate();
            } else if (dateToParse.seconds) {
                parsedDate = new Date(dateToParse.seconds * 1000);
            } else if (dateToParse._seconds) {
                parsedDate = new Date(dateToParse._seconds * 1000);
            }
        }

        if (parsedDate && !isNaN(parsedDate.getTime())) {
            const dd = String(parsedDate.getDate()).padStart(2, '0');
            const mm = String(parsedDate.getMonth() + 1).padStart(2, '0');
            const yyyy = parsedDate.getFullYear();
            const hh = String(parsedDate.getHours()).padStart(2, '0');
            const min = String(parsedDate.getMinutes()).padStart(2, '0');
            
            return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
        }
    } catch (e) {
        console.error("Date parsing error:", e);
    }
    
    return 'Date unavailable';
}
