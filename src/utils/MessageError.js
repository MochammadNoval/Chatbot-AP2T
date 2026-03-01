/**
 * Handle API errors dengan pesan yang sesuai konteks
 * @param {Error} error - Error object dari axios
 * @param {string} operation - Nama operasi untuk logging (contoh: "addGroupTags")
 * @returns {string} User-friendly error message
 */
export function handleApiError(error, operation = "Operation") {
  console.error(`[${operation}]`, error);

  if (error.response) {
    // Server merespons dengan status code error
    const { status, data } = error.response;
    const serverMessage = data || "Server error";
    console.error(`[${operation}] Server error (${status}):`, data);
    return serverMessage;
  }

  if (error.request) {
    // Request dibuat tapi tidak ada response
    console.error(`[${operation}] No response from server`);
    return "Periksa koneksi internet Anda!";
  }

  // Error lain (setup/config)
  console.error(`[${operation}] Error:`, error.message);
  return "Aplikasi error! Silahkan coba lagi nanti.";
}
