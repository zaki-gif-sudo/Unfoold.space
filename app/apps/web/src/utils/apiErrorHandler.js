/**
 * Wraps an API call (Promise-returning function) with retry logic, timeout, and error formatting.
 */
export const withRetry = async (apiCallFn, retries = 3, delay = 1000) => {
  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), 30000)
    );
    return await Promise.race([apiCallFn(), timeoutPromise]);
  } catch (error) {
    const isGatewayError = error.status === 502 || error.status === 503 || error.status === 504;
    const isTimeout = error.message === 'Request timeout';
    const isNetworkError = error.message === 'Failed to fetch' || !navigator.onLine;

    if (retries > 0 && (isGatewayError || isTimeout || isNetworkError)) {
      console.warn(`API Error (${error.status || error.message}). Retrying in ${delay}ms... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(apiCallFn, retries - 1, delay * 2);
    }
    
    // Enhance error message for UI
    if (isNetworkError) {
      error.userMessage = 'Network error. Please check your connection.';
    } else if (isTimeout) {
      error.userMessage = 'Request timed out. Please try again.';
    } else if (isGatewayError) {
      error.userMessage = 'Server is temporarily unavailable. Please try again later.';
    } else {
      error.userMessage = error.message || 'An unexpected error occurred.';
    }
    
    console.error('API Call Failed:', error);
    throw error;
  }
};