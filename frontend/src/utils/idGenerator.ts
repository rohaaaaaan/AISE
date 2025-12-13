/**
 * Generates a SysML v2 compliant unique identifier.
 * Primarily uses UUID v4 to ensure global uniqueness.
 * 
 * @param prefix Optional prefix to make the ID more debug-friendly (e.g. 'block', 'port')
 * @returns A string in the format "prefix-UUID" or just "UUID"
 */
export const generateSysMLId = (prefix?: string): string => {
    let uuid = '';

    // Use crypto API if available (Modern Browsers / Node)
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        uuid = crypto.randomUUID();
    } else {
        // Fallback for older environments
        uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    if (prefix) {
        return `${prefix}-${uuid}`;
    }
    return uuid;
};
