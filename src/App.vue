<script setup>
import { computed, watch, onMounted } from "vue";
import LoadingSpinner from "./components/LoadingSpinner.vue";
import { Toast } from "primevue";
import { useAuthStores } from "./stores/Auth";
import { useToast } from "primevue";
import { useIdleTimeOut } from "./composables/useIdleTimeout";
import { useRouter } from "vue-router";

const auth = useAuthStores();
const toast = useToast();
const router  = useRouter()

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

const logout = ()=>{
  auth.logout();
  router.push("/login");
};

// NEW: Calculate idle timeout dari expires_in backend
// expires_in dalam detik → convert ke milliseconds
const idleTimeout = 2 * 60 * 1000; // 1 minute

// Use idle timeout
useIdleTimeOut(idleTimeout, logout);

</script>

<template>
  <div>
    <LoadingSpinner />
    <Toast />
    <router-view />
  </div>
</template>

<style scoped></style>
