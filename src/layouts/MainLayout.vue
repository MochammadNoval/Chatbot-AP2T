<script setup lang="ts">
import { ref } from "vue";
import Sidebar from "../components/Sidebar.vue";
const isExpand = ref(true);
</script>

<template>
  <div class="h-screen overflow-hidden flex">
    <Sidebar
      class="border overflow-hidden"
      @toggle="isExpand = !isExpand"
      :class="[
        'transition-all duration-300 ease-in-out',
        isExpand ? 'w-[250px]' : 'w-[90px]',
      ]"
    />
    <div class="flex-1 overflow-y-auto">
      <router-view />
    </div>
  </div>
</template>
