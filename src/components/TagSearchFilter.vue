<script setup>
import { ref, computed } from "vue";
import { XMarkIcon, MagnifyingGlassIcon } from "@heroicons/vue/24/outline";

const props = defineProps({
  tags: {
    type: Array,
    default: () => [],
  },
  selectedTags: {
    type: Array,
    default: () => [],
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  placeholder: {
    type: String,
    default: "Cari atau pilih tag...",
  },
});

const emit = defineEmits(["tag-selected", "tag-removed", "search-input"]);

const searchQuery = ref("");
const isOpen = ref(false);
let debounceTimer = null;

// Filter tags based on search query
const filteredTags = computed(() => {
  if (!searchQuery.value.trim()) {
    return props.tags;
  }
  const query = searchQuery.value.toLowerCase();
  return props.tags.filter((tag) => tag.name.toLowerCase().includes(query));
});

// Computed property untuk tags yang belum dipilih
const availableTags = computed(() => {
  return filteredTags.value.filter(
    (tag) => !props.selectedTags.some((selected) => selected.id === tag.id),
  );
});

// Handle input dengan debounce
const handleSearchInput = (value) => {
  searchQuery.value = value;

  // Clear existing timer
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  // Set new timer untuk emit search event dengan debounce
  debounceTimer = setTimeout(() => {
    emit("search-input", searchQuery.value);
  }, 300); // 300ms debounce

  // Show dropdown saat ada input
  if (value.trim()) {
    isOpen.value = true;
  }
};

// Handle tag selection
const selectTag = (tag) => {
  emit("tag-selected", tag);
  searchQuery.value = ""; // Clear search input
  isOpen.value = false; // Close dropdown
};

// Handle tag removal
const removeTag = (tagId) => {
  emit("tag-removed", tagId);
};

// Toggle dropdown
const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
};

// Close dropdown saat click outside (handled by @click.outside)
const closeDropdown = () => {
  isOpen.value = false;
};
</script>

<template>
  <div class="relative w-full">
    <!-- Selected Tags Display -->
    <div v-if="selectedTags.length > 0" class="mb-3 flex flex-wrap gap-2">
      <div
        v-for="tag in selectedTags"
        :key="tag.id"
        class="inline-flex items-center gap-2 bg-blue-500 text-white px-3 py-1 rounded-full text-sm"
      >
        <span>{{ tag.name }}</span>
        <button
          @click="removeTag(tag.id)"
          class="hover:bg-blue-600 rounded-full p-0.5 transition-colors"
          type="button"
        >
          <XMarkIcon class="size-4" />
        </button>
      </div>
    </div>

    <!-- Search Input Container -->
    <div class="relative" @click.outside="closeDropdown">
      <div class="relative">
        <MagnifyingGlassIcon
          class="absolute left-3 top-3 size-5 text-gray-400"
        />
        <input
          type="text"
          :placeholder="placeholder"
          :value="searchQuery"
          @input="handleSearchInput($event.target.value)"
          @focus="isOpen = true"
          @click="toggleDropdown"
          class="w-full pl-10 pr-4 py-2.5 bg-[#F5FAFF] border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium shadow-sm placeholder:text-gray-500 transition-all"
          :class="{ 'focus:ring-2 focus:ring-blue-500': isOpen }"
        />
        <!-- Loading Indicator -->
        <div v-if="isLoading" class="absolute right-3 top-3">
          <div class="animate-spin">
            <svg
              class="size-5 text-blue-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              />
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        </div>
      </div>

      <!-- Dropdown List -->
      <div
        v-if="isOpen"
        class="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden"
      >
        <!-- Empty State -->
        <div v-if="availableTags.length === 0 && !isLoading" class="px-4 py-3">
          <p class="text-gray-500 text-sm">
            {{
              searchQuery.trim()
                ? "Tidak ada tag yang match"
                : "Tidak ada tag tersedia"
            }}
          </p>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="px-4 py-3">
          <p class="text-gray-500 text-sm">Memuat tag...</p>
        </div>

        <!-- Tag List -->
        <div v-if="!isLoading" class="max-h-60 overflow-y-auto">
          <button
            v-for="tag in availableTags"
            :key="tag.id"
            @click="selectTag(tag)"
            type="button"
            class="w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0 focus:outline-none focus:bg-blue-100"
          >
            <div class="flex items-center justify-between">
              <span class="font-medium text-gray-900">{{ tag.name }}</span>
              <span
                v-if="tag.count"
                class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded"
              >
                {{ tag.count }}
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>

    <!-- Info Text -->
    <p class="mt-2 text-xs text-gray-500">
      {{ selectedTags.length }} tag dipilih
    </p>
  </div>
</template>

<style scoped>
/* Custom scrollbar styling for better UX */
.max-h-60::-webkit-scrollbar {
  width: 6px;
}

.max-h-60::-webkit-scrollbar-track {
  background: transparent;
}

.max-h-60::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.max-h-60::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
