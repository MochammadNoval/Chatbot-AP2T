<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useTokenExpiry } from '../composables/useTokenExpiry';
import Swal from 'sweetalert2';

import { useAuthStores } from '../stores/Auth';
import axios from 'axios';
import { useToast } from 'primevue/usetoast';
import { Toast } from 'primevue';
import { useRouter } from 'vue-router';


const auth = useAuthStores();
const toast = useToast();
const router = useRouter()
const { formattedTime, isExpiringSoon, isExpiryCritical, isUserActive, autoRefreshToken } = useTokenExpiry();
const showAlert = ref(false);
const isRefreshing = ref(false);
const popupShown = ref(false); // Track if popup sudah ditampilkan
const isAwaitingUserAction = ref(false); // Track saat Swal.fire() pending waiting user action
const shouldAutoClose = ref(false); // Signal untuk auto-close & auto-refresh (user resumed activity)
const isPopupClosing = ref(false); // Track saat Swal.close() sedang dijalankan

/**
 * STATE MANAGEMENT:
 * - NORMAL: Token ≥ 1 min → No action
 * - EXPIRING_ACTIVE: Token < 1 min + User aktif → Auto refresh (silent)
 * - EXPIRING_IDLE: Token < 1 min + User idle → Show popup
 * - EXPIRING_IDLE_RESUMED: Popup shown + User becomes active → Auto close + Auto refresh
 */

// Determine current state
const currentState = computed(() => {
  const isLoggedIn = !!localStorage.getItem("access_token");
  if (!isLoggedIn) return 'LOGOUT';
  
  if (!isExpiringSoon.value) {
    popupShown.value = false; // Reset saat token aman
    return 'NORMAL';
  }
  
  // Token < 1 min
  const state = isUserActive.value ? 'EXPIRING_ACTIVE' : 'EXPIRING_IDLE';
  // console.log(`[TokenExpiryAlert] currentState computed: isExpiringSoon=${isExpiringSoon.value}, isUserActive=${isUserActive.value} → ${state}`);
  return state;
});

// Watch untuk perubahan state dan handle setiap state
watch(currentState, async (newState, oldState) => {
  // console.log(`[TokenExpiryAlert] State: ${oldState} → ${newState}`);
  
  if (newState === 'NORMAL' || newState === 'LOGOUT') {
    // Exit critical zone
    showAlert.value = false;
    popupShown.value = false;
    return;
  }
  
  if (newState === 'EXPIRING_ACTIVE') {
    // User aktif & token expiring → Auto refresh (silent)
    if (!isRefreshing.value && !popupShown.value) {
      isRefreshing.value = true;
      const success = await autoRefreshToken();
      isRefreshing.value = false;
      
      // if (!success) {
      //   console.error('[TokenExpiryAlert] Auto refresh failed');
      // }
    }
    // FIX: Jika popup sudah shown & masih pending user action → close & auto-refresh
    else if (popupShown.value && isAwaitingUserAction.value && !isPopupClosing.value) {
      // console.log('[TokenExpiryAlert] User resumed while popup pending → Closing popup');
      isPopupClosing.value = true;       // Set flag: sedang menutup popup
      shouldAutoClose.value = true;      // Signal popup result handler untuk auto-refresh
      await Swal.close();                // Close popup agar promise selesai
      // DON'T reset popupShown here - let result handler do it
      return;
    }
    // Jika popup already closed (result already handled) - do nothing
    else if (popupShown.value && !isAwaitingUserAction.value) {
      // Popup sudah selesai ditangani, no action needed
      return;
    }
  }
  
  if (newState === 'EXPIRING_IDLE' && !popupShown.value) {
    // User idle & token expiring & popup belum ditampilkan → Show popup ONCE

    // RESET ALL FLAGS - Ensure clean state
    popupShown.value = true;
    isAwaitingUserAction.value = true;  // Mark: popup pending
    shouldAutoClose.value = false;      // Reset flag
    
    let updateTimer = null;
    
    const result = await Swal.fire({
      title: "Session akan habis",
      html: `Anda tidak aktif selama beberapa saat. <br>Sisa waktu: <strong style="color: #dc2626;">${formattedTime.value}</strong>`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Perpanjang Session",
      cancelButtonText: "Logout",
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        // Update countdown di popup setiap detik
        updateTimer = setInterval(() => {
          const htmlContent = `Anda tidak aktif selama beberapa saat. <br>Sisa waktu: <strong style="color: #dc2626;">${formattedTime.value}</strong>`;
          Swal.update({ html: htmlContent });
        }, 1000);
      },

      willClose: () => {
        // Cleanup timer saat popup ditutup
        if (updateTimer) {
          clearInterval(updateTimer);
          updateTimer = null;
        }
      }
    });

    isAwaitingUserAction.value = false;  // Done waiting for user action
    
    if (result.isConfirmed) {
      // User memilih untuk refresh token
      // console.log('[TokenExpiryAlert] User clicked Perpanjang Session');
      isRefreshing.value = true;
      const success = await autoRefreshToken();
      isRefreshing.value = false;

      if (success) {
        Swal.fire({
          title: "Berhasil!",
          text: "Session Anda telah diperpanjang",
          icon: "success",
          timer: 2000,
        });
        popupShown.value = false;
      } else {
        Swal.fire({
          title: "Gagal!",
          text: "Gagal memperpanjang session, silakan login kembali",
          icon: "error",
        });
        auth.logout();
        router.push("/login");
      }
    } else if (result.isDismissed) {
      // FIX: Check if auto-close (user resumed) vs user manual dismiss
      if (shouldAutoClose.value) {
        // Program closed it (user resumed activity) → Auto-refresh tanpa logout
        // console.log('[TokenExpiryAlert] Popup auto-closed (user resumed) → Auto-refreshing');
        
        // NOW reset flags - AFTER handling the close
        isPopupClosing.value = false;   // Reset: no longer closing
        shouldAutoClose.value = false;   // Reset flag
        popupShown.value = false;        // Reset: popup no longer shown
        
        if (!isRefreshing.value) {
          isRefreshing.value = true;
          const success = await autoRefreshToken();
          isRefreshing.value = false;
          
          // if (!success) {
          //   console.error('[TokenExpiryAlert] Auto refresh failed after resume');
          // }
        }
      } else {
        // User memilih logout (manual dismiss)
        // console.log('[TokenExpiryAlert] User manually dismissed → Logout');
        popupShown.value = false;  // Reset flag sebelum logout
        auth.logout();
        router.push("/login");
      }
    }
  }
}, { immediate: false });

onMounted(() => {
  const token = localStorage.getItem("access_token");
  if (token) {
    showAlert.value = isExpiringSoon.value;
  }
});
</script>

<template>
  <!-- Toast container untuk error messages jika diperlukan -->
  <div class=" ">
    <Toast />
  </div>
</template>

<style scoped>
/* No styles needed - using SweetAlert2 for popup */
</style>
