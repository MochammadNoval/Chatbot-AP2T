<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useTokenExpiry } from '../composables/useTokenExpiry';

import { useAuthStores } from '../stores/Auth';
import axios from 'axios';
import { useToast } from 'primevue/usetoast';
import { Toast } from 'primevue';
import { useRouter } from 'vue-router';

const auth = useAuthStores();
const toast = useToast();
const router = useRouter()
const { formattedTime, isExpiringSoon, isExpiryCritical } = useTokenExpiry();
const showAlert = ref(false);
const dismissedWarning = ref(false);
const isRefreshing = ref(false);

// Show alert hanya jika:
// 1. User sedang login
// 2. Token expiring soon atau critical
// 3. Alert belum di-dismiss (untuk warning state)
const shouldShowAlert = computed(() => {
  const isLoggedIn = !!localStorage.getItem("access_token");
    
  if (isExpiryCritical.value) return isLoggedIn; // Always show critical

  if (isExpiringSoon.value && !dismissedWarning.value) return isLoggedIn; // Show warning unless dismissed
  
  return false;
});

// Watch untuk update showAlert - IMMEDIATE true untuk trigger on computed change
watch(shouldShowAlert, (newVal) => {
  // console.log('[TokenExpiryAlert] shouldShowAlert changed to:', newVal);
  showAlert.value = newVal;
}, { immediate: true });

onMounted(() => {
  const token = localStorage.getItem("access_token");
  const expiryTime = localStorage.getItem("token_expiry_time");
  // console.log('[TokenExpiryAlert] onMounted:', { token: !!token, expiryTime });
  
  if (token) {
    // Trigger computed immediately
    showAlert.value = shouldShowAlert.value;
  }
});

// Handle dismiss warning
const handleDismiss = () => {
  dismissedWarning.value = true;
  showAlert.value = false;
  // Reset after 2 menit atau saat user membuka alert lagi
  setTimeout(() => {
    dismissedWarning.value = false;
  }, 2 * 60 * 1000);
};

// Handle refresh token
const handleRefresh = async () => {
  if (isRefreshing.value) return; // Prevent multiple clicks
  
  isRefreshing.value = true;
  
  try {
    // Call any protected endpoint untuk trigger auto-refresh di interceptor
    // atau call refresh endpoint secara langsung
    const response = await axios.get("/api/auth/me");
    
    if (response.status === 200) {
      // Token refresh berhasil
      toast.add({
        severity: "success",
        summary: "Success",
        detail: "Token telah di-refresh, session diperpanjang!",
        life: 3000,
      });
      
      // Reset alert
      dismissedWarning.value = false;
      showAlert.value = false;
    }
  } catch (error) {
    console.error("Token refresh failed:", error);
    
    // Jika 401, berarti token sudah expired dan tidak bisa refresh
    if (error.response?.status === 401) {
      toast.add({
        severity: "error",
        summary: "Session Expired",
        detail: "Session Anda telah habis, silakan login kembali",
        life: 4000,
      });
      
      // Logout dan redirect ke login
      auth.logout();
      router.push("/login")
      window.dispatchEvent(new CustomEvent("auth:expired"));
    } else {
      toast.add({
        severity: "error",
        summary: "Error",
        detail: error.message || "Gagal refresh token",
        life: 3000,
      });
    }
  } finally {
    isRefreshing.value = false;
  }
};
</script>

<template>
  <div v-if="showAlert" class="fixed bottom-6 right-6 z-50 animate-pulse">
    <Toast />
    <!-- Critical Alert (< 1 menit) -->
    <div
      v-if="isExpiryCritical"
      class="bg-red-500 text-white rounded-lg shadow-lg p-4 flex items-center gap-3 max-w-sm"
    >
      <svg class="w-6 h-6 shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path
          fill-rule="evenodd"
          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
          clip-rule="evenodd"
        />
      </svg>
      <div class="flex-1">
        <p class="font-bold text-sm">Token Expired Soon!</p>
        <p class="text-xs opacity-90">Silakan refresh atau login kembali</p>
        <p class="text-xl font-mono font-bold mt-2">{{ formattedTime }}</p>
      </div>
      <button
        @click="handleRefresh"
        :disabled="isRefreshing"
        class="bg-white text-red-500 font-bold px-3 py-1 rounded text-xs hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {{ isRefreshing ? 'Refreshing...' : 'Refresh' }}
      </button>
    </div>

    <!-- Warning Alert (< 5 menit) -->
    <div
      v-else-if="isExpiringSoon"
      class="bg-yellow-500 text-white rounded-lg shadow-lg p-4 flex items-center gap-3 max-w-sm"
    >
      <svg class="w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path
          fill-rule="evenodd"
          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
          clip-rule="evenodd"
        />
      </svg>
      <div class="flex-1">
        <p class="font-bold text-sm">Session akan habis</p>
        <p class="text-xs opacity-90">Sisa waktu token Anda:</p>
        <p class="text-lg font-mono font-bold mt-1">{{ formattedTime }}</p>
      </div>
      <button
        @click="handleDismiss"
        class="text-xl hover:opacity-75 transition"
      >
        ✕
      </button>
    </div>

    <!-- Info Alert (Normal - optional, bisa diremove) -->
    <div
      v-else
      class="bg-blue-500 text-white rounded-lg shadow-lg p-3 flex items-center gap-2 text-xs max-w-xs"
    >
      <svg class="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path
          fill-rule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
          clip-rule="evenodd"
        />
      </svg>
      <div>
        <p class="font-bold">Token Expiry</p>
        <p class="opacity-90">Sisa: {{ formattedTime }}</p>
      </div>
    </div>
  </div>
</template>



<style scoped>
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
