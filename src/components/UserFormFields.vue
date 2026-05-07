<script setup>
import { EyeIcon, EyeSlashIcon } from "@heroicons/vue/24/outline";

// Props
const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  isEditMode: {
    type: Boolean,
    default: false,
  },
  userData: {
    type: Object,
    default: null,
  },
  passwordRequirements: {
    type: Object,
    required: true,
  },
  roleOptions: {
    type: Array,
    required: true,
  },
  showPassword: {
    type: Boolean,
    required: true,
  },
  showConfirmPassword: {
    type: Boolean,
    required: true,
  },
});

// Emits
const emit = defineEmits([
  "update:modelValue",
  "update:showPassword",
  "update:showConfirmPassword",
]);

// Helper untuk update formData
const updateFormData = (field, value) => {
  emit("update:modelValue", {
    ...props.modelValue,
    [field]: value,
  });
};

const toggleShowPassword = () => {
  emit("update:showPassword", !props.showPassword);
};

const toggleShowConfirmPassword = () => {
  emit("update:showConfirmPassword", !props.showConfirmPassword);
};
</script>

<template>
  <!-- Email Field -->
  <div>
    <label class="block text-sm font-semibold text-gray-700 mb-2">
      Email <span class="text-red-500">*</span>
    </label>
    <input
      :value="modelValue.email"
      @input="updateFormData('email', $event.target.value)"
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
      :value="modelValue.name"
      @input="updateFormData('name', $event.target.value)"
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

  <!-- Role Field -->
  <div>
    <label class="block text-sm font-semibold text-gray-700 mb-2">
      Role <span class="text-red-500">*</span>
    </label>
    <select
      :value="modelValue.role"
      @input="updateFormData('role', $event.target.value)"
      class="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors bg-white"
      :disabled="isLoading"
    >
      <option value="">-- Pilih Role --</option>
      <option v-for="role in roleOptions" :key="role.value" :value="role.value">
        {{ role.label }}
      </option>
    </select>
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
        :value="modelValue.password"
        @input="updateFormData('password', $event.target.value)"
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
        @click="toggleShowPassword"
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
        :value="modelValue.confirmPassword"
        @input="updateFormData('confirmPassword', $event.target.value)"
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
        @click="toggleShowConfirmPassword"
        :disabled="isLoading"
        class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        :title="showConfirmPassword ? 'Sembunyikan password' : 'Tampilkan password'"
      >
        <EyeIcon v-if="!showConfirmPassword" class="size-5" />
        <EyeSlashIcon v-else class="size-5" />
      </button>
    </div>
  </div>
</template>
