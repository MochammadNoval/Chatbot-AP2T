<script setup>
import { computed, watch, onMounted } from "vue";
import LoadingSpinner from "./components/LoadingSpinner.vue";
import { Toast } from "primevue";
import { useAuthStores } from "./stores/Auth";
import { useToast } from "primevue";
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

// NOTE: Token expiry & idle timeout dihandle oleh useTokenExpiry composable
// di composables/useTokenExpiry.js. Include:
// - Activity tracking saat token <= 30 detik
// - Auto-refresh saat user active di critical zone
// - Auto-logout saat idle 30 detik di critical zone
// Jangan add idle timeout di sini untuk avoid duplicate/conflicting logic!

</script>

<template>
  <div>
    <LoadingSpinner />
    <Toast />
    <router-view />
  </div>
</template>

<style scoped></style>
