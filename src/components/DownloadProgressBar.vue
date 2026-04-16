<script setup>
import { computed } from "vue";
import { XMarkIcon } from "@heroicons/vue/24/outline";

const props = defineProps({
  fileName: {
    type: String,
    required: true,
  },
  progress: {
    type: Number,
    required: true,
    validator: (value) => value >= 0 && value <= 100,
  },
  fileSize: {
    type: Number,
    default: 0,
  },
  downloadedSize: {
    type: Number,
    default: 0,
  },
  startTime: {
    type: Number,
    default: 0,
  },
});

const emit = defineEmits(["cancel-request"]);

// Format bytes to readable format
const formatBytes = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
};

// Calculate download speed (KB/s)
const downloadSpeed = computed(() => {
  if (!props.startTime) return 0;
  const elapsedSeconds = (Date.now() - props.startTime) / 1000;
  if (elapsedSeconds === 0) return 0;
  return Math.round((props.downloadedSize / 1024) / elapsedSeconds);
});

// Calculate estimated time remaining (seconds)
const estimatedTimeRemaining = computed(() => {
  if (downloadSpeed.value === 0 || props.progress === 100) return 0;
  const remainingBytes = props.fileSize - props.downloadedSize;
  const secondsRemaining = remainingBytes / (downloadSpeed.value * 1024);
  return Math.max(0, Math.ceil(secondsRemaining));
});

// Format time display
const formatTime = (seconds) => {
  if (seconds === 0) return "Menghitung...";
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
};

const handleCancel = () => {
  // Emit cancel-request, let parent handle confirmation
  emit("cancel-request");
};
</script>

<template>
  <div class="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 min-w-80 z-50 border border-gray-200">
    <!-- Header dengan Close Button -->
    <div class="flex justify-between items-start mb-3">
      <div class="flex-1">
        <p class="text-sm font-semibold text-gray-800 truncate">{{ fileName }}</p>
        <p class="text-xs text-gray-500 mt-1">
          {{ formatBytes(downloadedSize) }} / {{ formatBytes(fileSize) }}
        </p>
      </div>
    </div>

    <!-- Progress Bar -->
    <div class="w-full bg-gray-200 rounded-full h-2 mb-3 overflow-hidden">
      <div
        class="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-300"
        :style="{ width: `${progress}%` }"
      ></div>
    </div>

    <!-- Progress Info -->
    <div class="flex justify-between items-center mb-3">
      <div class="flex gap-4">
        <div>
          <p class="text-xs text-gray-500">Progress</p>
          <p class="text-sm font-semibold text-gray-800">{{ progress }}%</p>
        </div>
        <div>
          <p class="text-xs text-gray-500">Estimasi Waktu</p>
          <p class="text-sm font-semibold text-gray-800">{{ formatTime(estimatedTimeRemaining) }}</p>
        </div>
      </div>
    </div>

    <!-- Cancel Button -->
    <button
      @click="handleCancel"
      class="w-full bg-red-50 hover:bg-red-100 text-red-600 font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
    >
      <XMarkIcon class="w-4 h-4" />
      Batalkan Download
    </button>
  </div>
</template>
