export const getWibTime = (date = new Date()) => {
    // Explicitly add +7 hours to server UTC time to get WIB time for Vercel production
    return new Date(date.getTime() + (7 * 60 * 60 * 1000));
};

export const getWibMidnight = (date = new Date()) => {
    const wibTime = getWibTime(date);
    const wibYMD = `${wibTime.getUTCFullYear()}-${String(wibTime.getUTCMonth() + 1).padStart(2, '0')}-${String(wibTime.getUTCDate()).padStart(2, '0')}`;
    return new Date(`${wibYMD}T00:00:00.000Z`);
};
