<script setup>
import { ref, watch } from "vue";
import { XCircleIcon, UserPlusIcon } from "@heroicons/vue/24/outline";
import Swal from "sweetalert2";
import { createUser, updateUser } from "../services/User";
import { useUserForm } from "../composables/useUserForm";
import UserFormFields from "./UserFormFields.vue";

// Props
const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
  mode: {
    type: String,
    enum: ["create", "update"],
    required: true,
  },
  userData: {
    type: Object,
    default: null,
  },
});

// Emits
const emit = defineEmits(["close", "success"]);

// Composable
const {
  formData,
  showPassword,
  showConfirmPassword,
  roleOptions,
  passwordRequirements,
  resetForm,
  populateFormData,
  validateForm,
  buildCreatePayload,
  buildUpdatePayload,
} = useUserForm();

// Local state
const isLoading = ref(false);

/**
 * Populate form dengan data yang sesuai saat modal dibuka atau mode berubah
 */
const populateForm = () => {
  if (props.mode === "update" && props.userData) {
    populateFormData(props.userData);
  } else if (props.mode === "create") {
    resetForm();
  }
};

/**
 * Watch untuk populate form saat isOpen atau mode berubah
 */
watch(
  () => [props.isOpen, props.mode, props.userData],
  () => {
    if (props.isOpen) {
      populateForm();
    }
  },
  { deep: true },
);

/**
 * Handle submit form
 */
const handleSubmit = async () => {
  // Validasi form dahulu
  const validation = validateForm(props.mode === "update");

  if (!validation.isValid) {
    // Tampilkan semua error dalam satu dialog
    const errorMessage = validation.errors.join("\n");
    Swal.fire({
      title: "Validasi Gagal",
      html: `<div style="text-align: left; white-space: pre-wrap;">${errorMessage}</div>`,
      icon: "error",
      confirmButtonColor: "#3b82f6",
    });
    return;
  }

  isLoading.value = true;

  try {
    let response;
    const userName = formData.name.trim();
    const isUpdateMode = props.mode === "update";

    if (isUpdateMode) {
      // Update user
      const updateData = buildUpdatePayload();
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
      const createData = buildCreatePayload();
      response = await createUser(createData);

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
        {{ mode === "update" ? "Edit Pengguna" : "Tambah Pengguna Baru" }}
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
      <UserFormFields
        :model-value="formData"
        @update:model-value="Object.assign(formData, $event)"
        :is-loading="isLoading"
        :is-edit-mode="mode === 'update'"
        :user-data="userData"
        :password-requirements="passwordRequirements"
        :role-options="roleOptions"
        :show-password="showPassword"
        :show-confirm-password="showConfirmPassword"
        @update:show-password="showPassword = $event"
        @update:show-confirm-password="showConfirmPassword = $event"
      />
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
          mode === "update" ? "Simpan Perubahan" : "Tambah Pengguna"
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
