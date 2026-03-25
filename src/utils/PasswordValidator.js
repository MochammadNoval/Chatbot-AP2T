/**
 * PasswordValidator - Utility untuk validasi password
 * Mengecek aturan-aturan password sesuai requirements
 */

export class PasswordValidator {
  constructor(password) {
    this.password = password;
  }

  /**
   * Cek jika password minimal 8 karakter
   * @returns {boolean}
   */
  hasMinimumLength() {
    return this.password.length >= 8;
  }

  /**
   * Cek jika password mengandung huruf kapital (A-Z)
   * @returns {boolean}
   */
  hasUpperCase() {
    return /[A-Z]/.test(this.password);
  }

  /**
   * Cek jika password mengandung angka (0-9)
   * @returns {boolean}
   */
  hasNumber() {
    return /[0-9]/.test(this.password);
  }

  /**
   * Cek jika password mengandung simbol khusus
   * Simbol yang dianggap khusus: !@#$%^&*()_+-=[]{}|;:'",.<>?/\~`
   * @returns {boolean}
   */
  hasSpecialCharacter() {
    return /[!@#$%^&*()_+\-=\[\]{}|;:'",.<>?/\\~`]/.test(this.password);
  }

  /**
   * Validasi lengkap password
   * @returns {Object} - { isValid: boolean, errors: string[] }
   */
  validate() {
    const errors = [];

    if (!this.hasMinimumLength()) {
      errors.push("Password minimal 8 karakter");
    }

    if (!this.hasUpperCase()) {
      errors.push("Password harus mengandung huruf kapital (A-Z)");
    }

    if (!this.hasNumber()) {
      errors.push("Password harus mengandung angka (0-9)");
    }

    if (!this.hasSpecialCharacter()) {
      errors.push("Password harus mengandung simbol khusus (!@#$%^&* dll)");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Hitung kekuatan password (weak, medium, strong)
   * @returns {string}
   */
  getStrength() {
    let score = 0;

    if (this.hasMinimumLength()) score++;
    if (this.password.length >= 12) score++;
    if (this.hasUpperCase()) score++;
    if (this.hasNumber()) score++;
    if (this.hasSpecialCharacter()) score++;

    if (score <= 2) return "weak";
    if (score <= 3) return "medium";
    return "strong";
  }
}

/**
 * Fungsi helper untuk validasi email
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Fungsi helper untuk validasi nama (tidak boleh kosong dan minimal 2 karakter)
 * @param {string} name
 * @returns {boolean}
 */
export function isValidName(name) {
  return name.trim().length >= 2;
}
