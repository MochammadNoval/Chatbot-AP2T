<script setup>
import { ref } from "vue";
import Sidebar from "./components/sidebar.vue";
const isExpand = ref(true);
console.log(isExpand.value);
</script>

<template>
  <div>
    <router-view />
  </div>
</template>

<style scoped></style>
