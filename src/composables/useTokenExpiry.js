import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { getTokenRemainingTime, isTokenExpiringSoon } from '../utils/tokenUtils';
import axios from 'axios';
import api from './../services/Api'

/**
 * Composable untuk track token expiry time dengan LAZY LOAD strategy
 * - Countdown interval HANYA dimulai saat token < 1 min
 * - Activity tracking HANYA dimulai saat token < 1 min
 * - Minimal resource usage saat token masih aman
 */

export function useTokenExpiry() {
  const remainingSeconds = ref(0);
  let countdownInterval = null;           // Lazy: starts only when < 1 min
  let activityTimeout = null;
  let removeActivityListeners = null;     // Cleanup function

  // Track token state untuk reactive updates
  const hasToken = ref(false);
  
  // Track user activity - true jika ada activity dalam 30 detik terakhir
  const isUserActive = ref(false);
  const ACTIVITY_TIMEOUT = 30 * 1000; // 30 detik (was 10)

  // Format remaining time menjadi MM:SS
  const formattedTime = computed(() => {
    const mins = Math.floor(remainingSeconds.value / 60);
    const secs = remainingSeconds.value % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  });

  // Check apakah token akan expired dalam 1 menit (CRITICAL THRESHOLD)
  const isExpiringSoon = computed(() => {
    return remainingSeconds.value < 30; // 1 menit
  });

  // Alias untuk consistency
  const isExpiryCritical = computed(() => {
    return remainingSeconds.value < 30; // 1 menit
  });

  // Update remaining time
  const updateRemainingTime = () => {
    const expiryTime = localStorage.getItem("token_expiry_time");
    const token = localStorage.getItem("access_token");
    
    // Update hasToken state
    hasToken.value = !!token;
    
    if (!token) {
      remainingSeconds.value = 0;
      return;
    }
    
    const remaining = getTokenRemainingTime(expiryTime);
    remainingSeconds.value = Math.max(0, remaining);
    console.log(`[useTokenExpiry] updateRemainingTime: ${remaining} seconds (${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')})`);
  };

  /**
   * START CRITICAL MONITORING - Only called when token < 1 min
   * Lazy: Countdown + Activity tracking dimulai di sini
   */
  const startCriticalMonitoring = () => {
    if (countdownInterval) return; // Already running
    
    console.log('[useTokenExpiry] 🔴 Entering CRITICAL zone - Starting countdown & activity tracking');
    
    // Start countdown interval
    countdownInterval = setInterval(() => {
      updateRemainingTime();
    }, 1000); // Update setiap 1 detik
    
    // Start activity tracking (only in critical state)
    removeActivityListeners = startActivityTracking();
  };

  /**
   * STOP CRITICAL MONITORING - Called when token ≥ 1 min or logout
   * Lazy: Clean up countdown + activity tracking
   */
  const stopCriticalMonitoring = () => {
    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
    
    if (removeActivityListeners) {
      removeActivityListeners();
      removeActivityListeners = null;
    }
    
    // Reset activity state saat keluar critical
    isUserActive.value = false;
    if (activityTimeout) {
      clearTimeout(activityTimeout);
      activityTimeout = null;
    }
    
    console.log('[useTokenExpiry] 🟢 Exiting CRITICAL zone - Stopping countdown & activity tracking');
  };

  // Track user activity (only called during critical monitoring)
  const startActivityTracking = () => {
    const events = ["mousemove", "mousedown", "keypress", "scroll", "touchstart"];
    
    const handleActivity = () => {
      isUserActive.value = true;
      console.log('[useTokenExpiry] User ACTIVE detected');
      
      // Clear existing timeout
      if (activityTimeout) {
        clearTimeout(activityTimeout);
      }
      
      // Set timeout untuk mark user as inactive setelah ACTIVITY_TIMEOUT
      activityTimeout = setTimeout(() => {
        isUserActive.value = false;
        console.log('[useTokenExpiry] User marked as IDLE (30 sec no activity)');
      }, ACTIVITY_TIMEOUT);
    };
    
    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });
    
    console.log('[useTokenExpiry] Activity tracking started');
    
    // Return cleanup function
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      if (activityTimeout) {
        clearTimeout(activityTimeout);
        activityTimeout = null;
      }
      console.log('[useTokenExpiry] Activity tracking stopped');
    };
  };

  // Auto refresh token (silent - no toast)
  const autoRefreshToken = async () => {
    try {
      
      const refreshToken = localStorage.getItem("refresh_token");
      if (!refreshToken) {
        console.error('[useTokenExpiry] ❌ No refresh token available');
        return false;
      }
      
      console.log('[useTokenExpiry] 🔄 Attempting auto-refresh...');
      
      // Use axios directly to bypass Api interceptors
      const response = await axios.post("/api/auth/refresh", {
        refresh_token: refreshToken
      });
      
      if (response.status === 200 && response.data.access_token) {
        const { access_token, refresh_token: newRefreshToken, expires_in } = response.data;
        
        // Calculate new expiry time - use backend value directly
        if (!expires_in) {
          console.error('[useTokenExpiry] ❌ Backend tidak mengirim expires_in', response.data);
          throw new Error('Backend response tidak valid: expires_in tidak ada');
        }
        const expiryTime = Date.now() + (expires_in * 1000);
        
        // Update localStorage
        localStorage.setItem("access_token", access_token);
        localStorage.setItem("token_expiry_time", expiryTime.toString());
        
        if (newRefreshToken) {
          localStorage.setItem("refresh_token", newRefreshToken);
        }
        
        // Trigger storage event for other tabs
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'access_token',
          newValue: access_token,
          storageArea: localStorage
        }));
        
        console.log('[useTokenExpiry] ✅ Token auto-refreshed successfully');
        updateRemainingTime();
        return true;
      }
    } catch (error) {
      console.error('[useTokenExpiry] ❌ Auto refresh failed:', error);
      return false;
    }
  };

  // Lifecycle
  onMounted(() => {
    const token = localStorage.getItem("access_token");
    
    // Initial check
    updateRemainingTime();
    
    // Check jika token sudah < 60 saat mount
    if (remainingSeconds.value < 60 && remainingSeconds.value > 0) {
      console.log('[useTokenExpiry] Token sudah < 60 saat mount, starting critical monitoring');
      startCriticalMonitoring();
    }
    
    // Non-critical monitoring: Update remainingSeconds every 10 seconds
    // This ensures we catch when token drops below 60 seconds
    const nonCriticalInterval = setInterval(() => {
      updateRemainingTime();
    }, 10 * 1000); // Update setiap 10 detik saat token masih aman
    
    // Watch untuk changes di remainingSeconds
    // Trigger critical monitoring saat < 1 min
    const unwatchRemaining = watch(remainingSeconds, (newVal) => {
      console.log('[useTokenExpiry] remainingSeconds changed:', newVal);
      if (newVal < 60 && newVal > 0) {
        // Entering critical zone
        console.log('[useTokenExpiry] Entering critical via watch');
        startCriticalMonitoring();
      } else if (newVal >= 60) {
        // Exiting critical zone
        console.log('[useTokenExpiry] Exiting critical via watch');
        stopCriticalMonitoring();
      }
    });
    
    // Watch untuk perubahan token (login/logout)
    // Gunakan polling untuk detect token changes
    const tokenChangeInterval = setInterval(() => {
      const currentToken = localStorage.getItem("access_token");
      const wasLoggedIn = hasToken.value;
      const isLoggedIn = !!currentToken;
      
      // Jika berubah dari logout → login
      if (!wasLoggedIn && isLoggedIn) {
        updateRemainingTime();
        // Critical monitoring akan otomatis start via watch jika < 1 min
      }
      
      // Jika berubah dari login → logout
      if (wasLoggedIn && !isLoggedIn) {
        remainingSeconds.value = 0;
        hasToken.value = false;
        stopCriticalMonitoring();
      }
    }, 500); // Check setiap 500ms
    
    return () => {
      unwatchRemaining();
      clearInterval(nonCriticalInterval);
      clearInterval(tokenChangeInterval);
      stopCriticalMonitoring();
    };
  });

  onUnmounted(() => {
    stopCriticalMonitoring();
  });

  return {
    remainingSeconds,
    formattedTime,
    isExpiringSoon,
    isExpiryCritical,
    hasToken,
    isUserActive,
    updateRemainingTime,
    autoRefreshToken,
  };
}
