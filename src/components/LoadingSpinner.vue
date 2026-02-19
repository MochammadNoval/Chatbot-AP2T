<script setup>
import { computed } from "vue";
import { useAuthStores } from "../stores/Auth";

const authStore = useAuthStores();
const isLoading = computed(() => authStore.isLoading);
</script>

<template>
  <!-- Backdrop -->
  <div v-if="isLoading" class="loading-backdrop">
    <!-- Loading Spinner Container -->
    <div class="loading-container">
      <!-- Animated Circle/Border -->
      <div class="spinner-ring"></div>

      <!-- Logo -->
      <div class="logo-wrapper">
        <img
          src="./../image/logo-pln-plus.svg"
          alt="PLN Plus Logo"
          class="logo"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Backdrop */
.loading-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

/* Loading Container */
.loading-container {
  position: relative;
  width: 120px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Animated Ring */
.spinner-ring {
  position: absolute;
  width: 120px;
  height: 120px;
  border: 4px solid transparent;
  border-radius: 50%;
  border-top-color: #0066cc;
  border-right-color: #0066cc;
  animation: spin 1.5s ease-in-out infinite;
  box-shadow: 0 0 15px rgba(0, 102, 204, 0.3);
}

/* Logo Wrapper */
.logo-wrapper {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  background-color: white;
  border-radius: 50%;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

/* Logo */
.logo {
  width: 60px;
  height: 60px;
  object-fit: contain;
}

/* Spin Animation */
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
