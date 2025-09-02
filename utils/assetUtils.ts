/**
 * Returns the asset URL. Cache-busting logic has been removed as it was causing
 * issues with font loading.
 * @param url The original asset URL.
 * @returns The original URL.
 */
export const getAssetUrl = (url: string): string => {
    return url;
};
