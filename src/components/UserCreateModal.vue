<script setup>
import { ref, reactive, watch } from "vue";
import { XCircleIcon, UserPlusIcon } from "@heroicons/vue/24/outline";
import Toast from "./Toast.vue";
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
});

const isLoading = ref(false);
const showToast = ref(false);
const toastMessage = ref("");
const toastType = ref("info"); // success | error | warning | info

/**
 * Reset form ke state awal
 */
const resetForm = () => {
  formData.email = "";
  formData.name = "";
  formData.password = "";
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
 * Tampilkan toast notification
 */
const showNotification = (message, type = "info") => {
  toastMessage.value = message;
  toastType.value = type;
  showToast.value = true;
};

/**
 * Validasi input data
 * @returns {boolean}
 */
const validateForm = () => {
  // Validasi email kosong
  if (!formData.email.trim()) {
    showNotification("Email tidak boleh kosong", "error");
    return false;
  }

  // Validasi email format
  if (!isValidEmail(formData.email)) {
    showNotification("Format email tidak valid", "error");
    return false;
  }

  // Validasi nama kosong
  if (!formData.name.trim()) {
    showNotification("Nama tidak boleh kosong", "error");
    return false;
  }

  // Validasi nama minimal 2 karakter
  if (!isValidName(formData.name)) {
    showNotification("Nama minimal 2 karakter", "error");
    return false;
  }

  // Password validation: wajib untuk create, opsional untuk edit
  if (!props.isEditMode || (props.isEditMode && formData.password)) {
    // Validasi password kosong
    if (!formData.password) {
      showNotification("Password tidak boleh kosong", "error");
      return false;
    }

    // Validasi aturan password
    const passwordValidator = new PasswordValidator(formData.password);
    const validationResult = passwordValidator.validate();

    if (!validationResult.isValid) {
      // Tampilkan semua error password dalam satu pesan
      const errorMessage = validationResult.errors.join("\n");
      showNotification(errorMessage, "error");
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
      showNotification(`User ${formData.name} berhasil diperbarui`, "success");
    } else {
      // Create user baru
      response = await createUser({
        email: formData.email.trim(),
        name: formData.name.trim(),
        password: formData.password,
      });
      showNotification(`User ${formData.name} berhasil ditambahkan`, "success");
    }

    // Reset form
    resetForm();

    // Emit success event (untuk parent component bisa refresh data)
    setTimeout(() => {
      emit("success", response);
      closeModal();
    }, 1500);
  } catch (error) {
    // Tampilkan error dari API
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Gagal memproses data user. Silahkan coba lagi";

    showNotification(errorMessage, "error");
  } finally {
    isLoading.value = false;
  }
};

/**
 * Handle close modal
 */
const closeModal = () => {
  resetForm();
  showToast.value = false;
  emit("close");
};
</script>

<template>
  <!-- Toast Notification -->
  <Toast
    v-if="showToast"
    :message="toastMessage"
    :type="toastType"
    :duration="5000"
  />

  <!-- Modal Backdrop -->
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black/30 bg-opacity-30 z-40 transition-opacity"
    @click="closeModal"
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
        class="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
        :disabled="isLoading"
      >
        <XCircleIcon class="size-6 text-red-500"></XCircleIcon>
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
        <input
          v-model="formData.password"
          type="password"
          :placeholder="
            isEditMode
              ? 'Kosongkan jika tidak ingin mengubah password'
              : 'Masukkan password (min. 8 karakter)'
          "
          class="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          :disabled="isLoading"
        />
        <p class="text-xs text-gray-500 mt-2">
          Password harus mengandung:<br />
          <span class="inline-block mt-1">
            ✓ Minimal 8 karakter<br />
            ✓ Huruf kapital (A-Z)<br />
            ✓ Angka (0-9)<br />
            ✓ Simbol khusus (!@#$%^&* dll)
          </span>
        </p>
      </div>
    </div>

    <!-- Modal Footer -->
    <div class="flex gap-3 justify-end p-6 border-t border-gray-200">
      <button
        @click="closeModal"
        :disabled="isLoading"
        class="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
      >
        Batal
      </button>

      <button
        @click="handleSubmit"
        :disabled="isLoading"
        class="px-4 py-2 flex gap-2 items-center justify-center bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium min-w-[150px]"
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
