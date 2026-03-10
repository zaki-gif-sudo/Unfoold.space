import Pocketbase from 'pocketbase';

const POCKETBASE_API_URL = import.meta.env.VITE_POCKETBASE_URL || 'https://api.unfoold.space';

const pocketbaseClient = new Pocketbase(POCKETBASE_API_URL);

// Add request timeout using AbortController
pocketbaseClient.beforeSend = function(url, init) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
  
  const originalFetch = init?.fetch || fetch;
  init.fetch = async (req) => {
    try {
      const response = await originalFetch(req);
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  };
  
  return { url, init };
};

export default pocketbaseClient;

export { pocketbaseClient };
