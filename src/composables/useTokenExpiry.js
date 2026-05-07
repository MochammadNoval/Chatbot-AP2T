import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { getTokenRemainingTime, isTokenExpiringSoon, calculateTokenExpiryTime, getStoredExpiresIn } from '../utils/tokenUtils';
import { useAuthStores } from '../stores/Auth';
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
  let autoRefreshDebounce = false;        // Prevent multiple auto-refresh attempts
  let idleLogoutTimeout = null;           // Track idle timeout untuk auto-logout

  // Track token state untuk reactive updates
  const hasToken = ref(false);
  
  // Track user activity - true jika ada activity dalam 30 detik terakhir
  const isUserActive = ref(false);
  const ACTIVITY_TIMEOUT = 30 * 1000; // 30 detik (was 10)
  const CRITICAL_THRESHOLD = 30; // Token ≤ 30 detik = CRITICAL state
  const WARNING_THRESHOLD = 60;  // 60 detik ≥ token > 30 detik = WARNING state

  // Format remaining time menjadi MM:SS
  const formattedTime = computed(() => {
    const mins = Math.floor(remainingSeconds.value / 60);
    const secs = remainingSeconds.value % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  });

  // Check apakah token akan expired dalam 1 menit (WARNING zone)
  const isExpiringSoon = computed(() => {
    return remainingSeconds.value < WARNING_THRESHOLD; // < 60 detik
  });

  // Check apakah sudah masuk CRITICAL zone (< 30 detik)
  const isExpiryCritical = computed(() => {
    return remainingSeconds.value <= CRITICAL_THRESHOLD; // ≤ 30 detik
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
    // console.log(`[useTokenExpiry] updateRemainingTime: ${remaining} seconds (${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')})`);
  };

  /**
   * START COUNTDOWN (WARNING state) - Called when 60 > token > 30 detik
   * Lazy: Hanya countdown, activity tracking belum aktif
   */
  const startCountdownMonitoring = () => {
    if (countdownInterval) return; // Already running
    
    // console.log('[useTokenExpiry] 🟡 Entering WARNING zone - Starting countdown (no activity tracking yet)');
    
    // Start countdown interval
    countdownInterval = setInterval(() => {
      updateRemainingTime();
    }, 1000); // Update setiap 1 detik
  };

  /**
   * START CRITICAL MONITORING - Only called when token ≤ 30 detik
   * Lazy: Countdown + Activity tracking dimulai di sini
   */
  const startCriticalMonitoring = () => {
    if (removeActivityListeners) return; // Already running activity tracking
    
    // console.log('[useTokenExpiry] 🔴 Entering CRITICAL zone - Starting activity tracking');
    
    // Start activity tracking (only when <= 30 seconds)
    removeActivityListeners = startActivityTracking();
  };

  /**
   * STOP COUNTDOWN - Called when token >= 60 atau logout
   */
  const stopCountdownMonitoring = () => {
    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
    // console.log('[useTokenExpiry] 🟢 Exiting WARNING zone - Stopped countdown');
  };

  /**
   * STOP CRITICAL MONITORING - Called when token > 30 detik atau logout
   * Lazy: Clean up activity tracking + idle logout timeout
   */
  const stopCriticalMonitoring = () => {
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
    
    // Clear idle logout timeout
    if (idleLogoutTimeout) {
      clearTimeout(idleLogoutTimeout);
      idleLogoutTimeout = null;
    }
    
    // Reset debounce flag
    autoRefreshDebounce = false;
    
    // console.log('[useTokenExpiry] 🟢 Exiting CRITICAL zone - Stopped activity tracking');
  };

  /**
   * Trigger auto-logout saat idle di CRITICAL state
   * Hanya dipanggil saat token ≤ 30 detik dan user IDLE
   */
  const scheduleIdleLogout = () => {
    if (idleLogoutTimeout) {
      clearTimeout(idleLogoutTimeout);
    }
    
    // Set timeout untuk auto-logout setelah ACTIVITY_TIMEOUT (30 detik idle)
    idleLogoutTimeout = setTimeout(() => {
      // console.log('[useTokenExpiry] ⏰ Auto-logout triggered - User idle untuk 30 detik di critical zone');
      autoLogout();
    }, ACTIVITY_TIMEOUT);
  };

  /**
   * Auto logout dan redirect ke login page
   */
  const autoLogout = () => {
    try {
      const useAuth = useAuthStores();
      useAuth.logout();
      // console.log('[useTokenExpiry] ✅ Auto-logout completed');
      
      // Redirect ke login page
      window.location.href = '/login';
    } catch (error) {
      // console.error('[useTokenExpiry] ❌ Auto-logout error:', error);
      // Fallback: clear localStorage dan redirect
      localStorage.clear();
      window.location.href = '/login';
    }
  };

  // Track user activity (only called during critical monitoring - token <= 30 detik)
  const startActivityTracking = () => {
    const events = ["mousemove", "mousedown", "keypress", "scroll", "touchstart"];
    
    const handleActivity = () => {
      isUserActive.value = true;
      // console.log('[useTokenExpiry] 👤 User ACTIVE detected (activity at critical zone)');
      
      // Clear existing timeouts
      if (activityTimeout) {
        clearTimeout(activityTimeout);
      }
      if (idleLogoutTimeout) {
        clearTimeout(idleLogoutTimeout);
        idleLogoutTimeout = null;
      }
      
      // TRIGGER AUTO-REFRESH TOKEN
      if (!autoRefreshDebounce) {
        autoRefreshDebounce = true;
        // console.log('[useTokenExpiry] 🔄 Detected activity - Triggering auto-refresh');
        autoRefreshToken().finally(() => {
          // Reset debounce setelah 2 detik untuk prevent spam
          setTimeout(() => {
            autoRefreshDebounce = false;
          }, 2000);
        });
      }
      
      // Set timeout untuk mark user as inactive setelah ACTIVITY_TIMEOUT (30 detik)
      activityTimeout = setTimeout(() => {
        isUserActive.value = false;
        // console.log('[useTokenExpiry] 💤 User marked as IDLE (30 sec no activity)');
        
        // Jika masih di critical zone, schedule idle logout
        if (remainingSeconds.value <= CRITICAL_THRESHOLD) {
          scheduleIdleLogout();
        }
      }, ACTIVITY_TIMEOUT);
    };
    
    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });
    
    // console.log('[useTokenExpiry] Activity tracking started (critical zone)');
    
    // Initial: schedule logout setelah 30 detik jika tidak ada activity
    scheduleIdleLogout();
    
    // Return cleanup function
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      if (activityTimeout) {
        clearTimeout(activityTimeout);
        activityTimeout = null;
      }
      if (idleLogoutTimeout) {
        clearTimeout(idleLogoutTimeout);
        idleLogoutTimeout = null;
      }
      // console.log('[useTokenExpiry] Activity tracking stopped');
    };
  };

  // Auto refresh token (silent - no toast)
  const autoRefreshToken = async () => {
    try {
      
      const refreshToken = localStorage.getItem("refresh_token");
      if (!refreshToken) {
        // console.error('[useTokenExpiry] ❌ No refresh token available');
        return false;
      }
      
      // console.log('[useTokenExpiry] 🔄 Attempting auto-refresh...');
      
      // Use axios directly to bypass Api interceptors
      const response = await axios.post("/api/auth/refresh", {
        refresh_token: refreshToken
      });
      
      if (response.status === 200 && response.data.access_token) {
        const { access_token, refresh_token: newRefreshToken, expires_in } = response.data;
        
        // Calculate new expiry time using utility function
        if (!expires_in) {
          // console.error('[useTokenExpiry] ❌ Backend tidak mengirim expires_in', response.data);
          throw new Error('Backend response tidak valid: expires_in tidak ada');
        }
        const expiryTime = calculateTokenExpiryTime(expires_in);
        
        if (!expiryTime) {
          throw new Error('Failed to calculate token expiry time');
        }
        
        // Update localStorage
        localStorage.setItem("access_token", access_token);
        localStorage.setItem("token_expiry_time", expiryTime.toString());
        localStorage.setItem("token_expires_in", expires_in.toString());  // Store original expires_in
        
        if (newRefreshToken) {
          localStorage.setItem("refresh_token", newRefreshToken);
        }
        
        // console.log('[useTokenExpiry] ✅ Token auto-refreshed successfully', {
        //   expires_in: expires_in,
        //   new_expiry_time: expiryTime,
        //   new_expiry_date: new Date(expiryTime).toLocaleString()
        // });
        
        // Trigger storage event for other tabs
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'access_token',
          newValue: access_token,
          storageArea: localStorage
        }));
        
        updateRemainingTime();
        return true;
      }
    } catch (error) {
      // console.error('[useTokenExpiry] ❌ Auto refresh failed:', error);
      return false;
    }
  };

  // Lifecycle
  onMounted(() => {
    const token = localStorage.getItem("access_token");
    const storedExpiresIn = getStoredExpiresIn();
    
    // Initial check
    updateRemainingTime();
    
    // Log token expiry info
    // if (storedExpiresIn) {
    //   console.log('[useTokenExpiry] 🎯 onMounted: Token info -', {
    //     expires_in: storedExpiresIn,
    //     remaining_seconds: remainingSeconds.value,
    //     expiry_time: localStorage.getItem("token_expiry_time"),
    //     expiry_date: new Date(parseInt(localStorage.getItem("token_expiry_time"))).toLocaleString()
    //   });
    // }
    
    // Check initial state saat mount
    if (remainingSeconds.value <= CRITICAL_THRESHOLD && remainingSeconds.value > 0) {
      // console.log('[useTokenExpiry] Token sudah <= 30 detik saat mount, starting CRITICAL monitoring');
      startCountdownMonitoring();
      startCriticalMonitoring();
    } else if (remainingSeconds.value < WARNING_THRESHOLD && remainingSeconds.value > CRITICAL_THRESHOLD) {
      // console.log('[useTokenExpiry] Token sudah di WARNING zone saat mount, starting countdown');
      startCountdownMonitoring();
    }
    
    // Non-critical monitoring: Update remainingSeconds every 10 seconds
    // This ensures we catch when token drops below 60 seconds
    const nonCriticalInterval = setInterval(() => {
      updateRemainingTime();
    }, 10 * 1000); // Update setiap 10 detik saat token masih aman
    
    // Watch untuk changes di remainingSeconds
    // Separate logic untuk WARNING (60-30 detik) dan CRITICAL (≤ 30 detik)
    const unwatchRemaining = watch(remainingSeconds, (newVal) => {
      // console.log('[useTokenExpiry] remainingSeconds changed:', newVal);
      
      // CRITICAL ZONE: token <= 30 detik
      if (newVal <= CRITICAL_THRESHOLD && newVal > 0) {
        // console.log('[useTokenExpiry] Entering CRITICAL zone (≤ 30 sec) via watch');
        // Ensure countdown is running
        if (!countdownInterval) {
          startCountdownMonitoring();
        }
        // Start activity tracking
        startCriticalMonitoring();
      }
      // WARNING ZONE: 60 > token > 30 detik (countdown only, no activity tracking)
      else if (newVal < WARNING_THRESHOLD && newVal > CRITICAL_THRESHOLD) {
        // console.log('[useTokenExpiry] Entering WARNING zone (30-60 sec) via watch');
        // Start countdown monitoring
        if (!countdownInterval) {
          startCountdownMonitoring();
        }
        // Stop critical monitoring if any
        stopCriticalMonitoring();
      }
      // NORMAL ZONE: token >= 60 detik
      else if (newVal >= WARNING_THRESHOLD) {
        // console.log('[useTokenExpiry] Exiting WARNING zone (≥ 60 sec) via watch');
        stopCountdownMonitoring();
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
