<script setup>
import { ref } from "vue";

defineProps({
  placeholder: {
    type: String,
    default: "Cari file...",
  },
});

const emit = defineEmits(["search"]);

const searchQuery = ref("");

const handleSearch = (event) => {
  searchQuery.value = event.target.value;
  emit("search", searchQuery.value);
};

const clearSearch = () => {
  searchQuery.value = "";
  emit("search", "");
};
</script>

<template>
  <div>
    <form
      @submit.prevent
      class="bg-mainblue text-black w-full mt-2 mb-4 rounded-lg"
    >
      <label
        for="searchInput"
        class="border border-gray-400/60 rounded-lg px-2 py-1 w-full flex gap-x-1 items-center"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="size-5 text-gray-500 font-semibold"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
          />
        </svg>
        <input
          type="text"
          id="searchInput"
          v-model="searchQuery"
          @input="handleSearch"
          class="text-sm text-gray-400 py-1 px-1 focus:outline-none focus:ring-0 focus:border-transparent w-full"
          :placeholder="placeholder"
        />
        <button
          v-if="searchQuery"
          @click="clearSearch"
          type="button"
          class="text-gray-500 hover:text-gray-700 font-semibold"
          title="Clear search"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="size-5"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M6 18 18 6M6 6l12 12"
            />
          </svg>
        </button>
      </label>
    </form>
  </div>
</template>
