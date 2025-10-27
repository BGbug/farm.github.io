/**
 * API helper for fetching data
 * In production (static export), fetches from /data/*.json files
 * In development, uses API routes
 */

const isProduction = process.env.NODE_ENV === 'production';
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

export const getApiUrl = (endpoint: string): string => {
  if (isProduction) {
    // Map API endpoints to static JSON files
    const endpointMap: Record<string, string> = {
      '/api/crops': `${basePath}/data/crops.json`,
      '/api/fields': `${basePath}/data/fields.json`,
      '/api/livestock': `${basePath}/data/livestock.json`,
      '/api/egg-logs': `${basePath}/data/egg-logs.json`,
      '/api/harvests': `${basePath}/data/harvests.json`,
      '/api/transactions': `${basePath}/data/transactions.json`,
      '/api/alerts': `${basePath}/data/alerts.json`,
      '/api/users': `${basePath}/data/users.json`,
      '/api/recent-activities': `${basePath}/data/recent-activities.json`,
      '/api/backup-history': `${basePath}/data/backup-history.json`,
    };
    
    return endpointMap[endpoint] || endpoint;
  }
  
  return endpoint;
};

export const apiFetcher = async (url: string) => {
  const apiUrl = getApiUrl(url);
  const response = await fetch(apiUrl);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  // Extract the actual data array from the JSON structure
  // e.g., { "crops": [...] } -> [...]
  if (data && typeof data === 'object') {
    const keys = Object.keys(data);
    if (keys.length === 1 && Array.isArray(data[keys[0]])) {
      return data[keys[0]];
    }
  }
  
  return data;
};

