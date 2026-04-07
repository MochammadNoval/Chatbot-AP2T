<script setup>
import { computed } from "vue";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  EllipsisHorizontalIcon,
} from "@heroicons/vue/24/outline";

const props = defineProps({
  currentPage: {
    type: Number,
    default: 1,
    validator: (value) => value >= 1,
  },
  totalItems: {
    type: Number,
    required: true,
    validator: (value) => value >= 0,
  },
  itemsPerPage: {
    type: Number,
    default: 10,
    validator: (value) => value > 0,
  },
  maxVisiblePages: {
    type: Number,
    default: 5,
    validator: (value) => value > 0,
  },
});

const emit = defineEmits(["page-change"]);

// Computed properties untuk pagination logic
const totalPages = computed(() => {
  return Math.ceil(props.totalItems / props.itemsPerPage);
});

const startItem = computed(() => {
  return (props.currentPage - 1) * props.itemsPerPage + 1;
});

const endItem = computed(() => {
  const end = props.currentPage * props.itemsPerPage;
  return end > props.totalItems ? props.totalItems : end;
});

const pageNumbers = computed(() => {
  const pages = [];
  const totalPagesValue = totalPages.value;
  const maxVisible = props.maxVisiblePages;
  const currentPage = props.currentPage;

  if (totalPagesValue <= maxVisible) {
    // Jika total pages <= max visible, tampilkan semua
    for (let i = 1; i <= totalPagesValue; i++) {
      pages.push(i);
    }
  } else {
    // Hitung range untuk menampilkan pages
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPagesValue, start + maxVisible - 1);

    // Jika di awal, adjust end
    if (start === 1) {
      end = Math.min(totalPagesValue, maxVisible);
    }
    // Jika di akhir, adjust start
    if (end === totalPagesValue) {
      start = Math.max(1, totalPagesValue - maxVisible + 1);
    }

    // Tambah page numbers
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    // Tambah ellipsis dan first page jika diperlukan
    if (start > 1) {
      pages.unshift("ellipsis-start");
      pages.unshift(1);
    }

    // Tambah ellipsis dan last page jika diperlukan
    if (end < totalPagesValue) {
      pages.push("ellipsis-end");
      pages.push(totalPagesValue);
    }
  }

  return pages;
});

const isFirstPage = computed(() => props.currentPage === 1);
const isLastPage = computed(() => props.currentPage === totalPages.value);

// Methods
const goToPage = (page) => {
  if (page !== props.currentPage && page >= 1 && page <= totalPages.value) {
    emit("page-change", page);
  }
};

const goToPreviousPage = () => {
  if (!isFirstPage.value) {
    goToPage(props.currentPage - 1);
  }
};

const goToNextPage = () => {
  if (!isLastPage.value) {
    goToPage(props.currentPage + 1);
  }
};
</script>

<template>
  <div
    v-if="totalPages > 1"
    class="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 px-4 py-3 bg-white rounded-lg shadow"
  >
    <!-- Info Text -->
    <div class="text-sm text-gray-600">
      Menampilkan
      <span class="font-semibold text-gray-900">{{ startItem }}</span>
      hingga
      <span class="font-semibold text-gray-900">{{ endItem }}</span>
      dari
      <span class="font-semibold text-gray-900">{{ totalItems }}</span>
      data
    </div>

    <!-- Pagination Controls -->
    <div class="flex items-center gap-2">
      <!-- Previous Button -->
      <button
        @click="goToPreviousPage"
        :disabled="isFirstPage"
        class="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
        title="Halaman Sebelumnya"
      >
        <ChevronLeftIcon class="size-4" />
        <span class="hidden sm:inline">Sebelumnya</span>
      </button>

      <!-- Page Numbers -->
      <div class="flex items-center gap-1">
        <template v-for="(page, index) in pageNumbers" :key="index">
          <!-- Ellipsis -->
          <span
            v-if="page === 'ellipsis-start' || page === 'ellipsis-end'"
            class="px-2 py-2 text-gray-500"
          >
            <EllipsisHorizontalIcon class="size-4" />
          </span>

          <!-- Page Number Button -->
          <button
            v-else
            @click="goToPage(page)"
            :class="[
              'px-3 py-2 text-sm font-medium rounded-lg transition-colors',
              currentPage === page
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50',
            ]"
            :disabled="currentPage === page"
          >
            {{ page }}
          </button>
        </template>
      </div>

      <!-- Next Button -->
      <button
        @click="goToNextPage"
        :disabled="isLastPage"
        class="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
        title="Halaman Berikutnya"
      >
        <span class="hidden sm:inline">Selanjutnya</span>
        <ChevronRightIcon class="size-4" />
      </button>
    </div>
  </div>
</template>
