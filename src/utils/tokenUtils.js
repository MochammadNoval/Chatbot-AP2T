/**
 * Decode JWT token tanpa verify signature
 * @param {string} token - JWT token
 * @returns {object|null} Decoded payload atau null jika gagal
 */
export function decodeToken(token) {
  try {
    // Robust null/undefined/empty check
    if (!token || typeof token !== 'string' || token.trim() === '') {
      return null;
    }
    
    // Check JWT structure (harus ada 3 parts separated by dot)
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('Invalid token format: expected 3 parts');
      return null;
    }
    
    const base64Url = parts[1];
    if (!base64Url) {
      console.error('Invalid token format: missing payload');
      return null;
    }
    
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Error decoding token:', e);
    return null;
  }
}

/**
 * Get token expiry time dalam milliseconds
 * @param {string} token - JWT token
 * @returns {number|null} Expiry time dalam milliseconds atau null
 */
export function getTokenExpiryTime(token) {
  if (!token || typeof token !== 'string' || token.trim() === '') return null;
  const payload = decodeToken(token);
  if (!payload || !payload.exp) return null;
  return payload.exp * 1000; // Convert dari seconds ke milliseconds
}

/**
 * Check apakah token sudah expired
 * @param {string|number} expiryTime - Token expiry time (token string atau milliseconds)
 * @returns {boolean} true jika sudah expired
 */
export function isTokenExpired(expiryTime) {
  // Null/undefined/empty check
  if (expiryTime === null || expiryTime === undefined || expiryTime === '') return true;
  
  // Jika input adalah string, cek apakah itu timestamp atau JWT token
  if (typeof expiryTime === 'string') {
    expiryTime = expiryTime.trim();
    
    // Cek apakah string berisi hanya angka (timestamp)
    if (/^\d+$/.test(expiryTime)) {
      expiryTime = parseInt(expiryTime, 10);
    } else if (expiryTime.includes('.')) {
      // Treat sebagai JWT token
      expiryTime = getTokenExpiryTime(expiryTime);
    } else {
      // String tidak valid
      return true;
    }
  }
  
  // Final validation
  if (!expiryTime || isNaN(expiryTime)) return true;
  return Date.now() >= expiryTime;
}


/**
 * Check apakah token akan expired dalam X detik
 * @param {string|number} expiryTime - Token expiry time (token string atau milliseconds)
 * @param {number} secondsThreshold - Threshold dalam detik (default: 60 detik)
 * @returns {boolean} true jika token akan expired dalam threshold
 */
export function isTokenExpiringSoon(expiryTime, secondsThreshold = 60) {
  // Null/undefined/empty check
  if (expiryTime === null || expiryTime === undefined || expiryTime === '') return true;
  
  // Jika input adalah string, cek apakah itu timestamp atau JWT token
  if (typeof expiryTime === 'string') {
    expiryTime = expiryTime.trim();
    
    // Cek apakah string berisi hanya angka (timestamp)
    if (/^\d+$/.test(expiryTime)) {
      expiryTime = parseInt(expiryTime, 10);
    } else if (expiryTime.includes('.')) {
      // Treat sebagai JWT token
      expiryTime = getTokenExpiryTime(expiryTime);
    } else {
      // String tidak valid
      return true;
    }
  }
  
  // Final validation
  if (!expiryTime || isNaN(expiryTime)) return true;
  const now = Date.now();
  const thresholdMs = secondsThreshold * 1000;
  return (expiryTime - now) < thresholdMs;
}

/**
 * Get sisa waktu token dalam detik
 * @param {string|number} expiryTime - Token expiry time (token string atau milliseconds)
 * @returns {number} Sisa waktu dalam detik
 */
export function getTokenRemainingTime(expiryTime) {
  // Null/undefined check
  if (expiryTime === null || expiryTime === undefined || expiryTime === '') return 0;
  
  // Jika input adalah string (bisa token atau timestamp)
  if (typeof expiryTime === 'string') {
    expiryTime = expiryTime.trim();
    
    // Check apakah string berisi hanya angka (timestamp dari localStorage)
    if (/^\d+$/.test(expiryTime)) {
      expiryTime = parseInt(expiryTime, 10);
    } else if (expiryTime.includes('.')) {
      // Treat sebagai JWT token
      expiryTime = getTokenExpiryTime(expiryTime);
    } else {
      // String tidak valid
      return 0;
    }
  }
  
  // Final validation
  if (!expiryTime || isNaN(expiryTime)) return 0;

  const remaining = expiryTime - Date.now();
  return Math.max(0, Math.ceil(remaining / 1000));
}
