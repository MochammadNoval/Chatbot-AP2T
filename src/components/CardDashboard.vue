<script setup>
defineProps({
  title: String,
  value: String,
  desc: String,
  icon: Object,
});
</script>

<template>
  <div
    class="bg-mainblue grid grid-cols-[2fr_1fr] rounded-xl p-5 shadow-md shadow-gray-200/90 border border-slate-300/40"
  >
    <div>
      <p class="text-slate-600 font-semibold mb-2">{{ title }}</p>
      <p class="text-black font-bold text-2xl">{{ value }}</p>
      <p class="text-slate-700/80 text-md">{{ desc }}</p>
    </div>
    <component :is="icon" class="text-blue-500 w-9 mx-auto" />
  </div>
</template>

<style scoped></style>
