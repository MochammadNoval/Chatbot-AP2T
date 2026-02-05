<script setup>
const props = defineProps({
  category: String,
  title: String,
  desc: String,
  value: String,
});
</script>

<template>
  <div
    class="flex rounded-xl p-4 mt-3"
    :class="{
      'bg-blue-100/60': props.category === 'active',
      'bg-red-100/60': props.category === 'hapus',
      'bg-gray-100/60': props.category === 'rata',
    }"
  >
    <div class="flex gap-x-4 items-center w-full">
      <div class="rounded-full p-2 bg-blue-300/50">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="size-6 text-blue-500"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
          />
        </svg>
      </div>
      <span>
        <p class="text-black font-semibold">{{ title }}</p>
        <p class="text-slate-500/90 font-normal">{{ desc }}</p>
      </span>
      <p
        class="font-semibold text-2xl ms-auto"
        :class="{
          'text-blue-500': props.category === 'active',
          'text-red-500': props.category === 'hapus',
          'text-black': props.category === 'rata',
        }"
      >
        {{ value }}
      </p>
    </div>
  </div>
</template>
