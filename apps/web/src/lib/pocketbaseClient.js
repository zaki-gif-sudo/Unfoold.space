import Pocketbase from 'pocketbase';

let POCKETBASE_API_URL = import.meta.env.VITE_POCKETBASE_URL || 'https://api.unfoold.space';

const pocketbaseClient = new Pocketbase(POCKETBASE_API_URL);

// Wrap fetch with timeout to prevent hanging requests
const originalFetch = fetch;
window.fetch = function(...args) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000); // 8 second timeout
  
  return originalFetch
    .apply(this, [args[0], { ...(args[1] || {}), signal: controller.signal }])
    .finally(() => clearTimeout(timeout))
    .catch(error => {
      if (error.name === 'AbortError') {
        console.warn('Request timeout - API may be unresponsive');
        throw new Error('Request timeout. Please check your connection.');
      }
      throw error;
    });
};

export default pocketbaseClient;

export { pocketbaseClient };
