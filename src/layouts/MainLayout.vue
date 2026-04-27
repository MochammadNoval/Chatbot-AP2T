<script setup lang="ts">
import { ref } from "vue";
import Sidebar from "../components/Sidebar.vue";
import TokenExpiryAlert from "../components/TokenExpiryAlert.vue";
const isExpand = ref(true);
</script>

<template>
  <div class="h-screen overflow-hidden flex">
    <Sidebar
      class="border overflow-hidden"
      @toggle="isExpand = !isExpand"
      :class="[
        'transition-all duration-300 ease-in-out',
        isExpand ? 'w-62.5' : 'w-22.5',
      ]"
    />
    <div class="flex-1 overflow-y-auto">
      <TokenExpiryAlert />
      <router-view />
    </div>
  </div>
</template>
