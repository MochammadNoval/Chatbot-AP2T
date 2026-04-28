import axios from "axios";
import api from "./Api";
import { useAuthStores } from "../stores/Auth";
import { calculateTokenExpiryTime } from "../utils/tokenUtils";

/**
 * Login dengan email dan password
 * Menangani response: { access_token, refresh_token, expires_in }
 */
export async function Login(user) {
  const useAuth = useAuthStores();
  try {
    // Clear stale tokens sebelum login baru
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("token_expiry_time");
    useAuth.logout();
    
    // POST ke /auth/login
    const response = await api.post("/auth/login", user);
    const { access_token, refresh_token, expires_in } = response.data;

    if (!access_token) {
      throw new Error("Login gagal: Backend tidak return access_token");
    }

    // Calculate expiry time: gunakan expires_in dari backend (dalam detik)
    // MUST receive expires_in from backend, no fallback
    if (!expires_in) {
      console.error('[Login] ❌ Backend tidak mengirim expires_in. Token tidak dapat diproses.', response.data);
      throw new Error('Backend response tidak valid: expires_in tidak ada');
    }
    
    // Use utility function untuk calculate expiry time
    const expiryTime = calculateTokenExpiryTime(expires_in);
    if (!expiryTime) {
      throw new Error('Failed to calculate token expiry time');
    }

    console.log('[Login] 🔐 Token received:', {
      expires_in,
      expiryTime,
      expiryDate: new Date(expiryTime).toLocaleString()
    });

    // Simpan tokens ke localStorage
    localStorage.setItem("access_token", access_token);
    localStorage.setItem("token_expiry_time", expiryTime.toString());
    localStorage.setItem("token_expires_in", expires_in.toString());  // Store original expires_in
    
    // Simpan refresh_token jika ada
    if (refresh_token) {
      localStorage.setItem("refresh_token", refresh_token);
    }
    
    console.log('[Login] ✅ Tokens saved to localStorage');

    // Ambil user data dari /auth/me
    const userData = await getCurrentUser();

    // Update Pinia auth store
    useAuth.login(userData, {
      access_token,
      refresh_token,
      expires_in
    });

    return {
      userData,
      responseData: response.data,
    };
  } catch (error) {
    throw error;
  }
}

export async function getCurrentUser() {
  try {
    const response = await api.get("/auth/me");
    return response.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Refresh access token menggunakan refresh token
 * Mengembalikan: { access_token, refresh_token, expires_in }
 */
export async function refreshToken(refreshTokenValue) {
  try {
    if (!refreshTokenValue) {
      throw new Error("Refresh token tidak ada");
    }

    // Bypass Api interceptor dengan axios langsung untuk avoid infinite loop
    const response = await axios.post("/api/auth/refresh", {
      refresh_token: refreshTokenValue
    });

    const { access_token, refresh_token, expires_in } = response.data;

    if (!access_token) {
      throw new Error("Token refresh gagal: Backend tidak return access_token");
    }

    return {
      access_token,
      refresh_token,
      expires_in
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Validasi password
 * Requirements:
 * - Minimal 8 karakter
 * - Minimal 1 huruf kapital (A-Z)
 * - Minimal 1 simbol (!@#$%^&*)
 * @param {string} password - Password yang akan divalidasi
 * @returns {object} { isValid: boolean, message: string }
 */
export function validatePassword(password) {
  if (!password) {
    return {
      isValid: false,
      message: "Password tidak boleh kosong",
    };
  }

  // Cek panjang minimal 8 karakter
  if (password.length < 8) {
    return {
      isValid: false,
      message: "Password minimal harus 8 karakter",
    };
  }

  // Cek ada minimal 1 huruf kapital
  if (!/[A-Z]/.test(password)) {
    return {
      isValid: false,
      message: "Password harus mengandung minimal 1 huruf besar (A-Z)",
    };
  }

  // Cek ada minimal 1 simbol
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return {
      isValid: false,
      message: "Password harus mengandung minimal 1 simbol (!@#$%^&*...)",
    };
  }

  return {
    isValid: true,
    message: "Password valid",
  };
}

/**
 * Register user baru
 * @param {object} userData - Data user { email, name, password }
 * @returns {Promise<object>} Response data dari server
 * @throws {Error} Jika request gagal atau validasi tidak lolos
 *
 * @example
 * try {
 *   const result = await registerUser({
 *     email: "user@example.com",
 *     name: "John Doe",
 *     password: "SecurePass@123"
 *   });
 *   console.log(result);
 * } catch (error) {
 *   console.error(error.message);
 * }
 */
export async function registerUser(userData) {
  try {
    // Validasi input ada atau tidak
    if (!userData || typeof userData !== "object") {
      throw new Error("Data user harus berupa object");
    }

    // Validasi email
    if (
      !userData.email ||
      typeof userData.email !== "string" ||
      userData.email.trim() === ""
    ) {
      throw new Error("Email tidak boleh kosong");
    }

    // Validasi format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      throw new Error("Format email tidak valid");
    }

    // Validasi name
    if (
      !userData.name ||
      typeof userData.name !== "string" ||
      userData.name.trim() === ""
    ) {
      throw new Error("Nama tidak boleh kosong");
    }

    // Validasi password
    const passwordValidation = validatePassword(userData.password);
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.message);
    }

    // Normalisasi data
    const normalizedData = {
      email: userData.email.trim().toLowerCase(),
      name: userData.name.trim(),
      password: userData.password,
    };

    // Request ke server
    const response = await api.post("/auth/register", normalizedData);

    if (!response.data) {
      throw new Error("Response dari server tidak valid");
    }

    return response.data;
  } catch (error) {
    // Jika error dari validasi input
    if (error instanceof Error && !error.response) {
      throw error;
    }

    // Error dari API
    throw error;
  }
}

