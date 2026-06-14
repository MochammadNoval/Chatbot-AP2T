<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
      <!-- Header -->
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-lg font-bold text-gray-800">Share Dokumen</h2>
        <button
          @click="closeModal"
          class="text-white hover:text-gray-700 text-2xl cursor-pointer rounded-full bg-red-500 px-2"
        >
          ×

<!-- <XCircleIcon class="size-7 text-red-500 cursor-pointer"></XCircleIcon> -->

        </button>
      </div>

      <!-- Document Name Display -->
      <p class="text-sm text-gray-600 ">
        Dokumen: <span class="font-semibold">{{ documentName }}</span>
      </p>



      <!-- Form -->
      <div class="space-y-4 mb-6">
        <!-- Password Field -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Password
            <span class="text-gray-500 text-xs">(Opsional)</span>
          </label>
          <input
            v-model="password"
            type="password"
            placeholder="Masukkan password untuk sharing (opsional)"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none text-black focus:ring-2 focus:ring-blue-500"
            :disabled="isLoadingSubmit"
          />
        </div>

        <!-- Expired At Field -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Kadaluwarsa Pada
            <span class="text-gray-500 text-xs">(Opsional)</span> 
          </label>
          <input
            v-model="expiredAt"
            type="datetime-local"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none text-black focus:ring-2 focus:ring-blue-500"
            :disabled="isLoadingSubmit"
          />
          <!-- <p class="text-red-500">{{ SharedUrl  }}</p> -->
        </div>
      </div>

      <p v-if="SharedLink" class="text-black text-xs break-all mb-2">💡Tombol copy bermasalah? Salin link secara manual</p>
      <div v-if="SharedLink" class="py-2 px-4 mb-4 bg-blue-400 rounded-lg">
        <p class="text-white text-sm break-all">{{ shareUrl }}</p>
      </div>

      <!-- Buttons -->
      <div class="flex  justify-end relative">
        <!-- Smart Main Button (Dynamic) -->
        <button
          @click="handleMainAction"
          :class="[
            'px-4 py-2 text-white rounded-l-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed',
            buttonConfig.bgColor
          ]"
          :disabled="buttonConfig.disabled"
        >
          <component 
            :is="buttonConfig.action === 'copy' && isUrlCopied ? CheckIcon : LinkIcon" 
            class="size-4" 
          />
          {{ buttonConfig.action === 'copy' && isUrlCopied ? 'Tersalin!' : buttonConfig.label }}
        </button>

        <!-- Dropdown Toggle Button (Advanced Actions) -->
        <button
          @click="isDropdownOpen = !isDropdownOpen"
          :disabled="!shareUrl"
          class="px-2 py-2 text-white rounded-r-lg transition-colors border-l"
          :class="[
            shareUrl ? 'bg-gray-600 hover:bg-gray-700 border-gray-700 cursor-pointer' : 'bg-gray-400 border-gray-500 cursor-not-allowed'
          ]"
        >
          <svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>

        <!-- Dropdown Menu -->
        <div
          v-if="isDropdownOpen"
          class="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-300 rounded-lg shadow-lg z-10"
        >
          <!-- Disable Option (shown when link is active) -->
          <button
            v-if="isLinkActive"
            @click="() => { handleDisablelink(); isDropdownOpen = false; }"
            :disabled="!shareUrl || isLoadingSubmit"
            class="w-full text-left px-4 py-3 hover:bg-yellow-50 transition-colors flex items-center gap-2 text-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white rounded-t-lg"
          >
            <svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17H5V5h14v6m4-3l-5-5m5 5v5m0-5h5m-5 0h-5" />
            </svg>
            Disable Link
          </button>

          <!-- Enable Option (shown when link is disabled) -->
          <button
            v-if="!isLinkActive"
            @click="() => { handleEnablelink(); isDropdownOpen = false; }"
            :disabled="!shareUrl || isLoadingSubmit"
            class="w-full text-left px-4 py-3 hover:bg-green-50 transition-colors flex items-center gap-2 text-green-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white rounded-t-lg"
          >
            <svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Enable Link
          </button>

          <div class="border-t border-gray-200"></div>

          <!-- Delete Option -->
          <button
            @click="() => { handleDelete(); isDropdownOpen = false; }"
            :disabled="!shareUrl || isLoadingDelete"
            class="w-full text-left px-4 py-3 hover:bg-red-50 transition-colors flex items-center gap-2 text-red-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white rounded-b-lg"
          >
            <TrashIcon class="size-4" />
            Hapus Link
          </button>
        </div>
      </div>

      <!-- Close overlay when clicking outside -->
      <div
        v-if="isDropdownOpen"
        @click="isDropdownOpen = false"
        class="fixed inset-0 z-0"
      ></div>
    </div>
  </div>
</template>

<script setup>
import Swal from "sweetalert2";
import { ref, computed, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import { CheckIcon, LinkIcon, TrashIcon } from '@heroicons/vue/24/outline';
import { shareDocumentLink, deleteShareLink, getShareLink, updateShareLink } from '../services/FileServices';


const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
  documentId: {
    type: Number,
    required: true,
  },
  documentName: {
    type: String,
    default: 'Dokumen',
  },
});

const emit = defineEmits(['close', 'shared']);

const toast = useToast();

// Form state
const password = ref(null);
const expiredAt = ref('');
const shareUrl = ref(null);
const isLoadingSubmit = ref(false);
const isUrlCopied = ref(false);
const isUrlCopying = ref(false);
const isLoadingDelete = ref(false);
const isLinkActive = ref(true); // Track if link is active/disabled

const SharedLink = ref(null);

// Helper untuk membuat share URL secara fleksibel (menggunakan Env Variable atau origin browser)
const getShareUrl = (token) => {
  const baseUrl = import.meta.env.VITE_SHARE_BASE_URL || window.location.origin;
  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  return `${cleanBaseUrl}/share/${token}`;
};

// Track original values for change detection
const originalPassword = ref(null);
const originalExpiredAt = ref('');

// Dropdown state
const isDropdownOpen = ref(false);

// Computed: Detect if user has made changes
const hasChanges = computed(() => {
  return password.value !== originalPassword.value || 
         expiredAt.value !== originalExpiredAt.value;
});

// Computed: Button configuration based on state
const buttonConfig = computed(() => {
  if (!shareUrl.value) {
    return {
      label: 'Generate Link',
      icon: '⚡',
      action: 'generate',
      disabled: isLoadingSubmit.value,
      bgColor: 'bg-blue-600 hover:bg-blue-700',
    };
  }
  
  if (shareUrl.value && !isLinkActive.value) {
    return {
      label: 'Link Disabled',
      icon: '⛔',
      action: 'disabled',
      disabled: true,
      bgColor: 'bg-gray-400 cursor-not-allowed',
    };
  }
  
  if (shareUrl.value && hasChanges.value) {
    return {
      label: 'Update Link',
      icon: '💾',
      action: 'update',
      disabled: isLoadingSubmit.value,
      bgColor: 'bg-orange-600 hover:bg-orange-700',
    };
  }
  
  return {
    label: 'Copy Link',
    icon: '📋',
    action: 'copy',
    disabled: !shareUrl.value || !isLinkActive.value,
    bgColor: 'bg-green-600 hover:bg-green-700',
  };
});

// Computed
// const isFormValid = computed(() => {
//   return password.value.trim() !== '' && expiredAt.value !== '';
// });

// Methods
const loadShareLink = async () => {
  try {
    const response = await getShareLink(props.documentId);

    if (response && response.share_token) {
      // Ambil share_token dari response
      const token = response.share_token;
      
      // Generate full URL secara dinamis/konfigurasi
      shareUrl.value = getShareUrl(token);
      SharedLink.value = token;
      
      // Track original values dari response untuk deteksi perubahan
      originalPassword.value = response.password || null;
      originalExpiredAt.value = response.expires_at || '';
      
      // Set form values dengan nilai dari response
      password.value = response.password || null;
      expiredAt.value = response.expires_at ? new Date(response.expires_at).toISOString().slice(0, 16) : '';
      
      // Track link's active status
      isLinkActive.value = response.is_active !== false;
    }
  } catch (error) {
    // Jika tidak ada share link, biarkan shareUrl tetap null
    console.log('No existing share link');
  }
};

// Watch untuk load share link saat modal dibuka
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    loadShareLink();
  }
}, { immediate: true });



const closeModal = () => {
  resetForm();
  emit('close');
};

const resetForm = () => {
  password.value = '';
  expiredAt.value = '';
  originalPassword.value = null;
  originalExpiredAt.value = '';
  // shareUrl.value = null;
  isUrlCopied.value = false;
  isDropdownOpen.value = false;
  isLinkActive.value = true;
};


const handleSubmit = async () => {
  try {
    isLoadingSubmit.value = true;

    // Convert datetime-local to ISO 8601 format jika ada value
    const isoExpiredAt = expiredAt.value ? new Date(expiredAt.value).toISOString() : null;
    
    // Check if creating new link or updating existing
    if (!shareUrl.value) {
      // CREATE NEW LINK
      const response = await shareDocumentLink(props.documentId, {
        password: password.value || null,
        expires_at: isoExpiredAt,
      });

      if (response && response.share_token) {
        const token = response.share_token;
        shareUrl.value = getShareUrl(token);
        SharedLink.value = token;
        
        // Update original values setelah create
        originalPassword.value = password.value || null;
        originalExpiredAt.value = isoExpiredAt || '';
        
        toast.add({
          severity: 'success',
          summary: 'Sukses',
          detail: 'Link sharing berhasil dibuat',
          life: 3000,
        });
        emit('shared', response);
      } else {
        throw new Error('Tidak ada share URL di response');
      }
    } else if (hasChanges.value) {
      // UPDATE EXISTING LINK
      const updatePayload = {};
      
      // Only send changed fields
      if (password.value !== originalPassword.value) {
        updatePayload.password = password.value || null;
      }
      if (isoExpiredAt !== originalExpiredAt.value) {
        updatePayload.expires_at = isoExpiredAt || null;
      }
      
      const response = await updateShareLink(props.documentId, updatePayload);
      
      if (response) {
        // Update original values setelah update
        originalPassword.value = password.value || null;
        originalExpiredAt.value = isoExpiredAt || '';
        
        toast.add({
          severity: 'success',
          summary: 'Sukses',
          detail: 'Link sharing berhasil diupdate',
          life: 3000,
        });
        emit('shared', response);
      }
    }
  } catch (error) {
    console.error('Share link error:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Gagal membuat share link',
      life: 3000,
    });
  } finally {
    isLoadingSubmit.value = false;
  }
};

// Unified handler untuk main button berdasarkan state
const handleMainAction = async () => {
  const action = buttonConfig.value.action;
  
  if (action === 'generate' || action === 'update') {
    await handleSubmit();
  } else if (action === 'copy') {
    await handleCopyToClipboard();
  }
};

const handleDisablelink = async () => {
  try {
    console.log(props.documentId)
    isLoadingSubmit.value = true;
    
    const response = await updateShareLink(props.documentId, {
      is_active: false
    });

    if(response) {
      // Update link status
      isLinkActive.value = false;
      
      toast.add({
        severity: 'success',
        summary: 'Sukses',
        detail: 'Link berhasil non aktif kan!',
        life: 3000,
      });
    }

  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Gagal mengupdate share link',
      life: 3000,
    });
  } finally {
    isLoadingSubmit.value = false;
  }
};

const handleEnablelink = async () => {
  try {
    console.log(props.documentId)
    isLoadingSubmit.value = true;
    
    const response = await updateShareLink(props.documentId, {
      is_active: true
    });

    if(response) {
      // Update link status
      isLinkActive.value = true;
      
      toast.add({
        severity: 'success',
        summary: 'Sukses',
        detail: 'Link berhasil diaktifkan!',
        life: 3000,
      });
    }

  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Gagal mengupdate share link',
      life: 3000,
    });
  } finally {
    isLoadingSubmit.value = false;
  }
};

const copyToClipboardFallback = (text) => {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  
  // Hindari scrolling dan visual layout shift
  textArea.style.top = "0";
  textArea.style.left = "0";
  textArea.style.position = "fixed";
  textArea.style.opacity = "0";
  
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  
  try {
    const successful = document.execCommand("copy");
    if (!successful) {
      throw new Error("Copy command failed");
    }
  } catch (err) {
    console.error("Fallback copy failed:", err);
    throw err;
  } finally {
    document.body.removeChild(textArea);
  }
};

const handleCopyToClipboard = async () => {
  // console.log('copied')
  //if (!shareUrl.value) return;
  try {
    isUrlCopying.value = true;
    
    // Gunakan navigator.clipboard jika dalam secure context (HTTPS/localhost), jika tidak pakai fallback
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      await navigator.clipboard.writeText(shareUrl.value);
    } else {
      copyToClipboardFallback(shareUrl.value);
    }
    
    isUrlCopied.value = true;
    toast.add({
      severity: 'success',
      summary: 'Tersalin',
      detail: 'Link berhasil disalin ke clipboard',
      life: 2000,
    });

    // Reset icon after 2 seconds
    setTimeout(() => {
      isUrlCopied.value = false;
    }, 2000);
  } catch (error) {
    console.error('Copy to clipboard error:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Gagal menyalin ke clipboard',
      life: 3000,
    });
  } finally {
    isUrlCopying.value = false;
  }
};


const handleDelete = async () => {
  
  try {
     const result = await Swal.fire({
      title: "Hapus Data?",
      text: "Apakah anda yakin ingin hapus dokumen?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      cancelButtonText: "Batal",
      confirmButtonText: "Ya, Hapus!",
    });
    isLoadingDelete.value = true;
    if (result.isConfirmed) {
      await deleteShareLink(props.documentId);

      Swal.fire({
        title: "Berhasil!",
        text: "Share link berhasil dihapus!",
        icon: "success",
      });
      resetForm();
      emit('close');
    }

  } catch (error) {
    console.error('Delete share link error:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Gagal menghapus share link',
      life: 3000,
    });
  } finally {
    isLoadingDelete.value = false;
  }
};
</script>

<style scoped>
/* Smooth transitions for button states */
button {
  transition: all 0.2s ease-in-out;
}
</style>
