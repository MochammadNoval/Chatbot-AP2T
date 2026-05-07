<script setup>
import { ref, computed } from 'vue';
import { XCircleIcon } from '@heroicons/vue/24/outline';

/**
 * Excel Upload Section Component
 * Menampilkan form sederhana untuk upload Excel
 * No tags, no indexing - hanya file upload
 */

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({ file: null, filename: '' }),
  },
  isDragging: Boolean,
});

const emit = defineEmits(['update:modelValue', 'file-selected', 'file-cleared']);

const fileInput = ref(null);

const formData = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

// Handle drag over
const onDragOver = (event) => {
  event.preventDefault();
  emit('update:modelValue', { ...props.modelValue, isDragging: true });
};

// Handle drag leave
const onDragLeave = (event) => {
  if (event.currentTarget.contains(event.relatedTarget)) return;
  emit('update:modelValue', { ...props.modelValue, isDragging: false });
};

// Handle drop
const onDrop = (event) => {
  event.preventDefault();
  const files = Array.from(event.dataTransfer.files);
  if (files && files[0]) {
    formData.value.file = files[0];
    formData.value.filename = '';
    emit('file-selected', files[0]);
  }
};

// Handle file selection via input
const handleFileChange = (event) => {
  const files = event.target.files;
  if (files && files[0]) {
    formData.value.file = files[0];
    formData.value.filename = '';
    emit('file-selected', files[0]);
    event.target.value = '';
  }
};

// Clear selected file
const clearFile = () => {
  formData.value.file = null;
  formData.value.filename = '';
  if (fileInput.value) {
    fileInput.value.value = '';
  }
  emit('file-cleared');
};
</script>

<template>
  <div class="space-y-4">
    <!-- File Input -->
    <div>
      <label class="block text-sm font-semibold text-gray-700 mb-2" for="uploadFileExcel">
        Pilih File Excel
      </label>
      <div
        class="border-dashed border rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors"
        :class="{
          'border-blue-500': props.isDragging,
          'border-red-500': !props.isDragging,
        }"
        @dragover.prevent="onDragOver"
        @dragleave.prevent="onDragLeave"
        @drop.prevent="onDrop"
        @click.stop="fileInput.click()"
      >
        <input
          ref="fileInput"
          type="file"
          @change="handleFileChange"
          class="hidden"
          aria-label="Upload Excel file"
          id="uploadFileExcel"
          accept=".xlsx,.xls"
        />
        <div class="pointer-events-none">
          <p class="text-gray-600 text-sm font-semibold">
            {{ formData.file ? formData.file.name : "Drag atau click untuk pilih file" }}
          </p>
          <p class="text-gray-400 text-xs mt-1">
            {{
              formData.file
                ? `${(formData.file.size / 1024 / 1024).toFixed(2)} MB`
                : "Max size 50MB & format Excel (.xlsx, .xls)"
            }}
          </p>
        </div>

        <!-- Clear button untuk membatalkan file -->
        <button
          v-if="formData.file"
          @click.stop="clearFile"
          class="mt-3 inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200"
          type="button"
          title="Batalkan file"
        >
          <XCircleIcon class="size-4" />
          Batalkan File
        </button>
      </div>
    </div>

    <!-- Filename Input (Optional) -->
    <div>
      <span class="flex gap-x-2">
        <label class="block text-sm font-semibold text-gray-700 mb-2">
          Nama File (Opsional)
        </label>
        <p class="text-xs font-semibold text-gray-500 mt-0.5">(Opsional)</p>
      </span>
      <input
        v-model="formData.filename"
        type="text"
        placeholder="Masukkan nama file atau kosongkan untuk gunakan nama file asli"
        class="w-full px-3 py-2 text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <p class="text-xs text-gray-500 mt-1">
        Tip: Biarkan kosong untuk gunakan nama file asli
      </p>
    </div>

    <!-- Info Box -->
    <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
      <p class="text-xs text-blue-700 font-medium">
        💡 File Excel akan diupload untuk proses import data. Pastikan format data sudah sesuai dengan template yang ditentukan.
      </p>
    </div>
  </div>
</template>

<style scoped>
/* No additional styles needed */
</style>
