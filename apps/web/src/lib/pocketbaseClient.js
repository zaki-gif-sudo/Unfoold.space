import Pocketbase from 'pocketbase';

const POCKETBASE_API_URL = import.meta.env.VITE_POCKETBASE_URL || 'https://api.unfoold.space';

const pocketbaseClient = new Pocketbase(POCKETBASE_API_URL);

// Add request timeout to prevent hanging
pocketbaseClient.beforeSend = function(url, init) {
  // Set timeout to 15 seconds for PocketBase requests
  init.timeout = 15000;
  return { url, init };
};

// Better error handling
pocketbaseClient.on('error', (error) => {
  console.error('PocketBase error:', error);
});

export default pocketbaseClient;

export { pocketbaseClient };
