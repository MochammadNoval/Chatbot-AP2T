<script setup>
import CardIndeks from "./CardIndeks.vue";

defineProps({
  title: String,
});
</script>

<template>
  <div
    class="bg-mainblue border border-red-500 rounded-xl p-5 shadow-md shadow-gray-200/90"
  >
    <div class="w-full">
      <h1 class="text-xl text-black font-semibold mb-2">
        {{ title }}
      </h1>
    </div>
  </div>
</template>

<style scoped></style>
