<script setup>
import { ref, reactive, watch, computed } from "vue";
import { XCircleIcon, UserPlusIcon, EyeIcon, EyeSlashIcon } from "@heroicons/vue/24/outline";
import Swal from "sweetalert2";
import { createUser, updateUser } from "../services/User";
import {
  PasswordValidator,
  isValidEmail,
  isValidName,
} from "../utils/PasswordValidator";

// Props
const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
  isEditMode: {
    type: Boolean,
    default: false,
  },
  userData: {
    type: Object,
    default: null,
  },
});

// Emits
const emit = defineEmits(["close", "success"]);

// State
const formData = reactive({
  email: "",
  name: "",
  password: "",
  confirmPassword: "",
});

const isLoading = ref(false);
const showPassword = ref(false);
const showConfirmPassword = ref(false);

// Password requirements
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
  showPassword.value = false;
  showConfirmPassword.value = false;
};

/**
 * Watch untuk populate form dengan data user saat edit
 */
watch(
  () => props.userData,
  (newData) => {
    if (newData && props.isEditMode) {
      formData.email = newData.email || newData.Email || "";
      formData.name = newData.name || newData.Nama || "";
      formData.password = ""; // Password dikosongkan, user harus input yang baru
    }
  },
  { immediate: true, deep: true },
);

/**
 * Validasi input data
 * @returns {boolean}
 */
const validateForm = () => {
  // Validasi email kosong
  if (!formData.email.trim()) {
    Swal.fire({
      title: "Validasi Gagal",
      text: "Email tidak boleh kosong",
      icon: "error",
      confirmButtonColor: "#3b82f6",
    });
    return false;
  }

  // Validasi email format
  if (!isValidEmail(formData.email)) {
    Swal.fire({
      title: "Validasi Gagal",
      text: "Format email tidak valid",
      icon: "error",
      confirmButtonColor: "#3b82f6",
    });
    return false;
  }

  // Validasi nama kosong
  if (!formData.name.trim()) {
    Swal.fire({
      title: "Validasi Gagal",
      text: "Nama tidak boleh kosong",
      icon: "error",
      confirmButtonColor: "#3b82f6",
    });
    return false;
  }

  // Validasi nama minimal 2 karakter
  if (!isValidName(formData.name)) {
    Swal.fire({
      title: "Validasi Gagal",
      text: "Nama minimal 2 karakter",
      icon: "error",
      confirmButtonColor: "#3b82f6",
    });
    return false;
  }

  // Password validation: wajib untuk create, opsional untuk edit
  if (!props.isEditMode || (props.isEditMode && formData.password)) {
    // Validasi password kosong
    if (!formData.password) {
      Swal.fire({
        title: "Validasi Gagal",
        text: "Password tidak boleh kosong",
        icon: "error",
        confirmButtonColor: "#3b82f6",
      });
      return false;
    }

    // Validasi confirm password kosong
    if (!formData.confirmPassword) {
      Swal.fire({
        title: "Validasi Gagal",
        text: "Konfirmasi password tidak boleh kosong",
        icon: "error",
        confirmButtonColor: "#3b82f6",
      });
      return false;
    }

    // Validasi password dan confirm password cocok
    if (formData.password !== formData.confirmPassword) {
      Swal.fire({
        title: "Validasi Gagal",
        text: "Password dan konfirmasi password tidak cocok",
        icon: "error",
        confirmButtonColor: "#3b82f6",
      });
      return false;
    }

    // Validasi aturan password
    const passwordValidator = new PasswordValidator(formData.password);
    const validationResult = passwordValidator.validate();

    if (!validationResult.isValid) {
      // Tampilkan semua error password
      const errorMessage = validationResult.errors.join("\n");
      Swal.fire({
        title: "Validasi Password Gagal",
        html: `<div style="text-align: left; white-space: pre-wrap;">${errorMessage}</div>`,
        icon: "error",
        confirmButtonColor: "#3b82f6",
      });
      return false;
    }
  }

  return true;
};

/**
 * Handle submit form
 */
const handleSubmit = async () => {
  // Validasi form dahulu
  if (!validateForm()) {
    return;
  }

  isLoading.value = true;

  try {
    let response;
    const userName = formData.name.trim();

    if (props.isEditMode) {
      // Update user
      const updateData = {
        email: formData.email.trim(),
        name: formData.name.trim(),
      };

      // Hanya include password jika ada yang diinput
      if (formData.password) {
        updateData.password = formData.password;
      }

      response = await updateUser(
        props.userData.id || props.userData.ID,
        updateData,
      );

      // Tampilkan success dialog dan tunggu user klik OK
      await Swal.fire({
        title: "Berhasil!",
        text: `User ${userName} berhasil diperbarui`,
        icon: "success",
        confirmButtonColor: "#3b82f6",
      });
    } else {
      // Create user baru
      response = await createUser({
        email: formData.email.trim(),
        name: formData.name.trim(),
        password: formData.password,
      });

      // Tampilkan success dialog dan tunggu user klik OK
      await Swal.fire({
        title: "Berhasil!",
        text: `User ${userName} berhasil ditambahkan`,
        icon: "success",
        confirmButtonColor: "#3b82f6",
      });
    }

    // Reset form
    resetForm();

    // Emit success event dan close modal setelah user klik OK
    emit("success", response);
    closeModal();
  } catch (error) {
    // Tampilkan error dari API
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Gagal memproses data user. Silahkan coba lagi";

    Swal.fire({
      title: "Gagal!",
      text: errorMessage,
      icon: "error",
      confirmButtonColor: "#3b82f6",
    });
  } finally {
    isLoading.value = false;
  }
};

/**
 * Handle close modal
 */
const closeModal = () => {
  resetForm();
  emit("close");
};
</script>

<template>
  <!-- Modal Backdrop -->
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black/30 bg-opacity-30 z-40 transition-opacity"
    :class="{ 'pointer-events-none': isLoading }"
    @click="!isLoading && closeModal()"
  ></div>

  <!-- Modal -->
  <div
    v-if="isOpen"
    class="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl z-50 w-full max-w-md overflow-y-auto max-h-[90vh]"
  >
    <!-- Modal Header -->
    <div class="flex items-center justify-between p-6 border-b border-gray-200">
      <h2 class="text-xl font-bold text-gray-900">
        {{ isEditMode ? "Edit Pengguna" : "Tambah Pengguna Baru" }}
      </h2>
      <button
        @click="closeModal"
        class="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="isLoading"
        title="Close"
      >
        <XCircleIcon
          class="size-6 text-red-500"
          :class="{ 'opacity-50': isLoading }"
        ></XCircleIcon>
      </button>
    </div>

    <!-- Modal Body -->
    <div class="p-6 space-y-4">
      <!-- Email Field -->
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-2">
          Email <span class="text-red-500">*</span>
        </label>
        <input
          v-model="formData.email"
          type="email"
          :placeholder="
            isEditMode
              ? `Email saat ini: ${userData?.email || userData?.Email || ''}`
              : 'contoh@email.com'
          "
          class="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          :disabled="isLoading"
        />
      </div>

      <!-- Name Field -->
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-2">
          Nama Lengkap <span class="text-red-500">*</span>
        </label>
        <input
          v-model="formData.name"
          type="text"
          :placeholder="
            isEditMode
              ? `Nama saat ini: ${userData?.name || userData?.Nama || ''}`
              : 'Masukkan nama lengkap'
          "
          class="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          :disabled="isLoading"
        />
      </div>

      <!-- Password Field -->
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-2">
          Password
          <span v-if="!isEditMode" class="text-red-500">*</span>
          <span v-else class="text-gray-500 text-xs"
            >(Opsional - kosongkan jika tidak ingin mengubah)</span
          >
        </label>
        <div class="relative">
          <input
            v-model="formData.password"
            :type="showPassword ? 'text' : 'password'"
            :placeholder="
              isEditMode
                ? 'Kosongkan jika tidak ingin mengubah password'
                : 'Masukkan password (min. 8 karakter)'
            "
            class="w-full px-3 py-2 pr-10 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            :disabled="isLoading"
          />
          <button
            type="button"
            @click="showPassword = !showPassword"
            :disabled="isLoading"
            class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            :title="showPassword ? 'Sembunyikan password' : 'Tampilkan password'"
          >
            <EyeIcon v-if="!showPassword" class="size-5" />
            <EyeSlashIcon v-else class="size-5" />
          </button>
        </div>
        <p class="text-xs text-gray-500 mt-2">
          Password harus mengandung:<br />
          <span class="inline-block mt-1">
            <div :class="passwordRequirements.minLength ? 'text-green-600' : 'text-red-600'">
              ✓ Minimal 8 karakter
            </div>
            <div :class="passwordRequirements.hasUpperCase ? 'text-green-600' : 'text-red-600'">
              ✓ Huruf kapital (A-Z)
            </div>
            <div :class="passwordRequirements.hasNumber ? 'text-green-600' : 'text-red-600'">
              ✓ Angka (0-9)
            </div>
            <div :class="passwordRequirements.hasSpecialChar ? 'text-green-600' : 'text-red-600'">
              ✓ Simbol khusus (!@#$%^&* dll)
            </div>
          </span>
        </p>
      </div>

      <!-- Confirm Password Field -->
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-2">
          Konfirmasi Password
          <span v-if="!isEditMode" class="text-red-500">*</span>
          <span v-else class="text-gray-500 text-xs"
            >(Opsional - kosongkan jika tidak ingin mengubah)</span
          >
        </label>
        <div class="relative">
          <input
            v-model="formData.confirmPassword"
            :type="showConfirmPassword ? 'text' : 'password'"
            :placeholder="
              isEditMode
                ? 'Kosongkan jika tidak ingin mengubah password'
                : 'Ulangi password'
            "
            class="w-full px-3 py-2 pr-10 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            :disabled="isLoading"
          />
          <button
            type="button"
            @click="showConfirmPassword = !showConfirmPassword"
            :disabled="isLoading"
            class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            :title="showConfirmPassword ? 'Sembunyikan password' : 'Tampilkan password'"
          >
            <EyeIcon v-if="!showConfirmPassword" class="size-5" />
            <EyeSlashIcon v-else class="size-5" />
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Footer -->
    <div class="flex gap-3 justify-end p-6 border-t border-gray-200">
      <button
        @click="closeModal"
        :disabled="isLoading"
        class="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors font-medium"
      >
        Batal
      </button>

      <button
        @click="handleSubmit"
        :disabled="isLoading"
        class="px-4 py-2 flex gap-2 items-center justify-center bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium min-w-37.5"
      >
        <UserPlusIcon v-if="!isLoading" class="size-5"></UserPlusIcon>
        <span v-if="isLoading">Loading...</span>
        <span v-else>{{
          isEditMode ? "Simpan Perubahan" : "Tambah Pengguna"
        }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Prevent body scroll when modal is open */
:global(body.modal-open) {
  overflow: hidden;
}
</style>
