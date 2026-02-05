<script setup lang="ts">
import { ref } from "vue";
import Sidebar from "../components/sidebar.vue";
const isExpand = ref(true);
</script>

<template>
  <div class="flex">
    <Sidebar
      class="border"
      @toggle="isExpand = !isExpand"
      :class="[
        'transition-all duration-300 ease-in-out',
        isExpand ? 'w-[250px]' : 'w-[90px]',
      ]"
    />
    <div class="flex-1">
      <router-view />
    </div>
  </div>
</template>
