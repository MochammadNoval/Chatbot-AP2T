/**
 * Extract pesan error asli dari server response atau fallback ke custom message
 * @param {Error} error - Error object dari axios
 * @param {string} fallbackMessage - Pesan default jika tidak ada response dari server
 * @returns {string} Error message dari server atau fallback message
 */
export function extractErrorMessage(error, fallbackMessage = "Terjadi kesalahan, silahkan coba lagi") {
  // Jika ada response dari server, coba extract message dengan berbagai format
  if (error.response?.data) {
    const { data } = error.response;

    // Format 1: { message: "..." }
    if (data.message && typeof data.message === "string") {
      return data.message;
    }

    // Format 2: { error: "..." }
    if (data.error && typeof data.error === "string") {
      return data.error;
    }

    // Format 3: { errors: [{ message: "..." }] } untuk form validation
    if (Array.isArray(data.errors) && data.errors[0]?.message) {
      return data.errors[0].message;
    }

    // Format 4: { detail: "..." }
    if (data.detail && typeof data.detail === "string") {
      return data.detail;
    }

    // Format 5: Response langsung adalah string
    if (typeof data === "string") {
      return data;
    }
  }

  // Fallback: gunakan fallback message yang diberikan
  return fallbackMessage;
}

/**
 * Handle API errors dengan pesan yang sesuai konteks
 * @param {Error} error - Error object dari axios
 * @param {string} operation - Nama operasi untuk logging (contoh: "addGroupTags")
 * @returns {string} User-friendly error message
 */
export function handleApiError(error, operation = "Operation") {
  console.error(`[${operation}]`, error);

  if (error.response) {
    // Server merespons dengan status code error - ambil message asli
    const { status, data } = error.response;
    const serverMessage = extractErrorMessage(error, "Server error");
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
