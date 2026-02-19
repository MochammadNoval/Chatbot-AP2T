<script setup>
const props = defineProps({
  category: String,
  title: String,
  desc: String,
  value: String,
  icon: Object,
});
</script>

<template>
  <div
    class="flex rounded-xl p-4 mt-3 border border-slate-200/80"
    :class="{
      'bg-blue-100/60': props.category === 'active',
      'bg-red-100/60': props.category === 'hapus',
      'bg-gray-100/60': props.category === 'rata',
    }"
  >
    <div class="flex gap-x-4 items-center w-full">
      <div class="rounded-full p-2 bg-blue-300/50">
        <component :is="icon" class="size-6 text-blue-500"> </component>
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
