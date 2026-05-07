<script setup>
import { ref, computed, watch } from 'vue';
import { XCircleIcon } from '@heroicons/vue/24/outline';
import CustomMultiSelect from '../CustomMultiSelect.vue';

/**
 * PDF Upload Section Component
 * Menampilkan form khusus untuk upload PDF dengan dukungan tags & indexing
 */

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({ file: null, filename: '' }),
  },
  selectedTags: Array,
  selectedGroupTags: Array,
  filteredTags: Array,
  groupTags: Array,
  tags: Array,
  listTagInFile: Array,
  isDragging: Boolean,
});

const emit = defineEmits(['update:modelValue', 'update:selectedTags', 'update:selectedGroupTags', 'file-selected', 'file-cleared']);

const fileInput = ref(null);
const isIndexed = ref(false);

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

// Handle tag operations
const removeTag = (tagId, tagType = 'tag') => {
  if (tagType === 'groupTag') {
    const updated = props.selectedGroupTags.filter((id) => id !== tagId);
    emit('update:selectedGroupTags', updated);
  } else {
    const updated = props.selectedTags.filter((id) => id !== tagId);
    emit('update:selectedTags', updated);
  }
};

const clearAllGroupTags = () => {
  emit('update:selectedGroupTags', []);
  emit('update:selectedTags', []);
};

const clearAllTags = () => {
  emit('update:selectedTags', []);
};
</script>

<template>
  <div class="space-y-4">
    <!-- File Input -->
    <div>
      <label class="block text-sm font-semibold text-gray-700 mb-2" for="uploadFilePDF">
        Pilih File PDF
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
          aria-label="Upload PDF file"
          id="uploadFilePDF"
          accept=".pdf"
        />
        <div class="pointer-events-none">
          <p class="text-gray-600 text-sm font-semibold">
            {{ formData.file ? formData.file.name : "Drag atau click untuk pilih file" }}
          </p>
          <p class="text-gray-400 text-xs mt-1">
            {{
              formData.file
                ? `${(formData.file.size / 1024 / 1024).toFixed(2)} MB`
                : "Max size 100MB & format PDF"
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

    <!-- Filename Input -->
    <div>
      <span class="flex gap-x-2">
        <label class="block text-sm font-semibold text-gray-700 mb-2">
          Nama File
        </label>
        <p class="text-xs font-semibold text-gray-500 mt-0.5">(opsional)</p>
      </span>
      <input
        v-model="formData.filename"
        type="text"
        placeholder="Masukkan nama file (tanpa extension)"
        class="w-full px-3 py-2 text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <p class="text-xs text-gray-500 mt-1">
        Format: .pdf akan ditambahkan otomatis
      </p>
    </div>

    <!-- Group Tags -->
    <div>
      <!-- Selected group tags display -->
      <div v-if="selectedGroupTags && selectedGroupTags.length > 0" class="mb-3">
        <div class="flex flex-wrap gap-2">
          <div
            v-for="selected in selectedGroupTags"
            :key="selected"
            class="px-3 py-1.5 bg-blue-100 border border-blue-300 text-blue-800 rounded-full text-sm font-medium flex items-center gap-2"
          >
            {{ groupTags.find((t) => t.id === selected)?.name || selected }}
            <button
              @click="removeTag(selected, 'groupTag')"
              class="hover:bg-blue-300 cursor-pointer rounded-full p-0.5 transition-colors"
              type="button"
              title="Hapus tag"
            >
              <svg
                class="size-4 text-blue-800"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <button
            @click="clearAllGroupTags"
            class="ml-auto text-xs cursor-pointer text-red-500 hover:text-gray-700 underline transition-colors"
            type="button"
          >
            Hapus Semua
          </button>
        </div>
      </div>

      <label class="block text-sm font-semibold text-gray-700 mb-2">
        Pilih Group Tags
      </label>
      <CustomMultiSelect
        :modelValue="selectedGroupTags"
        @update:modelValue="(value) => $emit('update:selectedGroupTags', value)"
        :options="groupTags"
        optionLabel="name"
        optionValue="id"
        placeholder="Pilih tags untuk file ini..."
        :multiple="true"
        :hideSelectedItems="true"
      />

      <!-- Selected Tags Display -->
      <div v-if="selectedTags && selectedTags.length > 0" class="flex flex-wrap gap-2 mt-4">
        <div
          v-for="selected in selectedTags"
          :key="selected"
          class="px-3 py-1.5 bg-blue-100 border border-blue-300 text-blue-800 rounded-full text-sm font-medium flex items-center gap-2"
        >
          {{ tags.find((t) => t.id === selected)?.name || selected }}
          <button
            @click="removeTag(selected, 'tag')"
            class="hover:bg-blue-300 cursor-pointer rounded-full p-0.5 transition-colors"
            type="button"
            title="Hapus tag"
          >
            <svg
              class="size-4 text-blue-800"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <button
          @click="clearAllTags"
          class="ml-auto text-xs cursor-pointer text-red-500 hover:text-gray-700 underline transition-colors"
          type="button"
        >
          Hapus Semua
        </button>
      </div>

      <!-- Select Tags berdasarkan GroupTags -->
      <label class="block text-sm font-semibold text-gray-700 mb-2 mt-2">
        Pilih Tags
      </label>
      <CustomMultiSelect
        :modelValue="selectedTags"
        @update:modelValue="(value) => $emit('update:selectedTags', value)"
        :options="filteredTags"
        optionLabel="name"
        optionValue="id"
        placeholder="Pilih tags untuk file ini..."
        :multiple="true"
        :hideSelectedItems="true"
      />
      <p class="text-xs text-gray-500 mt-1">
        {{ selectedTags ? selectedTags.length : 0 }} tag dipilih
      </p>
    </div>

    <!-- Index Document Toggle -->
    <div class="flex justify-between">
      <p class="text-sm font-semibold text-gray-700 mb-2">Index Document</p>
      <button
        @click="formData.is_index = !formData.is_index"
        class="relative w-8 h-5 rounded-full transition-colors duration-300"
        :class="formData.is_index ? 'bg-green-500' : 'bg-gray-300'"
      >
        <span
          class="absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform duration-300"
          :class="formData.is_index ? 'translate-x-3' : 'translate-x-0'"
        />
      </button>
    </div>
  </div>
</template>

<style scoped>
/* No additional styles needed */
</style>
