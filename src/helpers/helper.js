export function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("id-ID");
}

/**
 * Debounce function untuk delay execution
 * @param {Function} func - Function yang akan di-debounce
 * @param {number} delay - Delay dalam milliseconds (default: 300ms)
 * @returns {Function} Debounced function
 */
export function debounce(func, delay = 300) {
  let timeoutId = null;
  return function debounced(...args) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}
