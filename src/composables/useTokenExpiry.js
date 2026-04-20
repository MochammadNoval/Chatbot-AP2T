import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { getTokenRemainingTime, isTokenExpiringSoon } from '../utils/tokenUtils';

/**
 * Composable untuk track token expiry time secara real-time
 * Return: { remainingSeconds, remainingTime, isExpiringSoon, formattedTime }
 */
export function useTokenExpiry() {
  const remainingSeconds = ref(0);
  let interval = null;

  // Track token state untuk reactive updates
  const hasToken = ref(false);

  // Format remaining time menjadi MM:SS
  const formattedTime = computed(() => {
    const mins = Math.floor(remainingSeconds.value / 60);
    const secs = remainingSeconds.value % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  });

  // Check apakah token akan expired dalam 5 menit
  const isExpiringSoon = computed(() => {
    return remainingSeconds.value < 300; // 5 menit
  });

  // Check apakah token akan expired dalam 1 menit
  const isExpiryCritical = computed(() => {
    return remainingSeconds.value < 60; // 1 menit
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
    
    // Debug log
    // console.log('[useTokenExpiry] Updated:', {
    //   expiryTime,
    //   remaining,
    //   formattedTime: formattedTime.value,
    //   isExpiringSoon: isExpiringSoon.value,
    //   isExpiryCritical: isExpiryCritical.value,
    // });
  };

  // Start interval update setiap detik
  const start = () => {
    if (interval) {
      return;
    }
    updateRemainingTime(); // Update segera
    interval = setInterval(() => {
      updateRemainingTime();
    }, 1000); // Update setiap 1 detik
  };

  // Stop interval
  const stop = () => {
    if (interval) {
      clearInterval(interval);
      interval = null;
    }
  };

  // Lifecycle
  onMounted(() => {
    const token = localStorage.getItem("access_token");
    // console.log('[useTokenExpiry] onMounted, token exists:', !!token);
    
    // Initial check
    updateRemainingTime();
    
    // Start if token exists
    if (token) {
      start();
    }
    
    // Watch untuk perubahan token (login/logout)
    // Gunakan polling untuk detect token changes
    const tokenChangeInterval = setInterval(() => {
      const currentToken = localStorage.getItem("access_token");
      const wasLoggedIn = hasToken.value;
      const isLoggedIn = !!currentToken;
      
      // Jika berubah dari logout → login
      if (!wasLoggedIn && isLoggedIn) {
        updateRemainingTime();
        if (!interval) start();
      }
      
      // Jika berubah dari login → logout
      if (wasLoggedIn && !isLoggedIn) {
        remainingSeconds.value = 0;
        hasToken.value = false;
        stop();
      }
    }, 500); // Check setiap 500ms
    
    return () => {
      clearInterval(tokenChangeInterval);
      stop();
    };
  });

  onUnmounted(() => {
    stop();
  });

  return {
    remainingSeconds,
    formattedTime,
    isExpiringSoon,
    isExpiryCritical,
    hasToken,
    start,
    stop,
    updateRemainingTime
  };
}
