import axios from "axios";
import api from "./Api";
import { useAuthStores } from "../stores/Auth";

export async function Login(user) {
  const useAuth = useAuthStores();
  try {
    const response = await api.post("/auth/login", user);

    const accessToken = response.data?.access_token;

    if (!accessToken) {
      throw new Error("Login gagal: access_token tidak ada");
    }

    // simpan token
    localStorage.setItem("access_token", accessToken);

    // ambil data user
    const userData = await getCurrentUser();

    useAuth.login(userData);

    return {
      userData,
      responseData: response.data,
    };
  } catch (error) {
    //console.error("Login error:", error);
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
