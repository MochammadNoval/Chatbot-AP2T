import { ref, reactive, computed, watch } from "vue";
import { PasswordValidator, isValidEmail, isValidName } from "../utils/PasswordValidator";

/**
 * Composable untuk form user management
 * Handles form state, validation, dan reset logic
 */
export function useUserForm() {
  // Role options
  const roleOptions = [
    { value: "admin", label: "Admin" },
    { value: "user", label: "User" },
  ];

  // Form state
  const formData = reactive({
    email: "",
    name: "",
    password: "",
    confirmPassword: "",
    role: "user", // Default role
  });

  const showPassword = ref(false);
  const showConfirmPassword = ref(false);

  /**
   * Password requirements computed property
   */
  const passwordRequirements = computed(() => ({
    minLength: formData.password.length >= 8,
    hasUpperCase: /[A-Z]/.test(formData.password),
    hasNumber: /[0-9]/.test(formData.password),
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password),
  }));

  /**
   * Reset form ke state awal
   */
  const resetForm = () => {
    formData.email = "";
    formData.name = "";
    formData.password = "";
    formData.confirmPassword = "";
    formData.role = "user";
    showPassword.value = false;
    showConfirmPassword.value = false;
  };

  /**
   * Populate form dengan data user untuk edit mode
   * @param {Object} userData - User data dari API
   */
  const populateFormData = (userData) => {
    if (userData) {
      formData.email = userData.email || userData.Email || "";
      formData.name = userData.name || userData.Nama || "";
      formData.role = userData.role || userData.Role || "user";
      formData.password = ""; // Password dikosongkan untuk edit mode
    }
  };

  /**
   * Validasi form dan return result dengan error details
   * @param {boolean} isEditMode - Mode edit atau create
   * @returns {Object} { isValid: boolean, errors: string[] }
   */
  const validateForm = (isEditMode = false) => {
    const errors = [];

    // Validasi email kosong
    if (!formData.email.trim()) {
      errors.push("Email tidak boleh kosong");
    }
    // Validasi email format
    else if (!isValidEmail(formData.email)) {
      errors.push("Format email tidak valid");
    }

    // Validasi nama kosong
    if (!formData.name.trim()) {
      errors.push("Nama tidak boleh kosong");
    }
    // Validasi nama minimal 2 karakter
    else if (!isValidName(formData.name)) {
      errors.push("Nama minimal 2 karakter");
    }

    // Validasi role tidak boleh kosong
    if (!formData.role.trim()) {
      errors.push("Role tidak boleh kosong");
    }

    // Password validation: wajib untuk create, opsional untuk edit
    const shouldValidatePassword = !isEditMode || (isEditMode && formData.password);

    if (shouldValidatePassword) {
      // Validasi password kosong
      if (!formData.password) {
        errors.push("Password tidak boleh kosong");
      }
      // Validasi confirm password kosong
      else if (!formData.confirmPassword) {
        errors.push("Konfirmasi password tidak boleh kosong");
      }
      // Validasi password dan confirm password cocok
      else if (formData.password !== formData.confirmPassword) {
        errors.push("Password dan konfirmasi password tidak cocok");
      }
      // Validasi aturan password
      else {
        const passwordValidator = new PasswordValidator(formData.password);
        const validationResult = passwordValidator.validate();

        if (!validationResult.isValid) {
          errors.push(...validationResult.errors);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  /**
   * Build request payload untuk create user
   * @returns {Object}
   */
  const buildCreatePayload = () => {
    return {
      email: formData.email.trim().toLowerCase(),
      name: formData.name.trim(),
      password: formData.password,
      role: formData.role.trim().toLowerCase(),
    };
  };

  /**
   * Build request payload untuk update user
   * @returns {Object}
   */
  const buildUpdatePayload = () => {
    const payload = {
      email: formData.email.trim().toLowerCase(),
      name: formData.name.trim(),
      role: formData.role.trim().toLowerCase(),
    };

    // Hanya include password jika ada yang diinput
    if (formData.password) {
      payload.password = formData.password;
    }

    return payload;
  };

  return {
    // State
    formData,
    showPassword,
    showConfirmPassword,
    roleOptions,
    passwordRequirements,

    // Methods
    resetForm,
    populateFormData,
    validateForm,
    buildCreatePayload,
    buildUpdatePayload,
  };
}
