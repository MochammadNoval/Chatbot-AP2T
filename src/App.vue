<script setup>
import { computed, watch, onMounted } from "vue";
import LoadingSpinner from "./components/LoadingSpinner.vue";
import { Toast } from "primevue";
import { useAuthStores } from "./stores/Auth";
import { useToast } from "primevue";

const auth = useAuthStores();
const toast = useToast();

onMounted(() => {
  auth.initialize();
});

watch(
  () => auth.message,
  (newMessage) => {
    if (newMessage) {
      toast.add({
        severity: "error",
        summary: "Error",
        detail: auth.message,
        life: 2500,
      });
    }
  },
);
</script>

<template>
  <div>
    <LoadingSpinner />
    <Toast />
    <router-view />
  </div>
</template>

<style scoped></style>
