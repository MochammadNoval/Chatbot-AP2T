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

        <!-- Share Link Delete Button -->
        <button
          @click="handleDelete"
          class="px-4 py-2 mt-2 text-white rounded-lg transition-colors flex items-center gap-2 mb-2"
          :class="shareUrl ? 'bg-red-600 hover:bg-red-700 cursor-pointer' : 'bg-gray-300 text-gray-500 cursor-not-allowed'"
          :disabled="!shareUrl || isLoadingDelete || isUrlCopying"
        >
          <TrashIcon class="size-4" />
          {{ isLoadingDelete ? 'Menghapus...' : 'Hapus share Link' }}
        </button>

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
            Kedaluwarsa Pada
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

      <!-- Buttons -->
      <div class="flex gap-2 justify-end">
        <!-- Close Button -->
        <button
          @click="closeModal"
          class="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
          :disabled="isLoadingSubmit"
        >
          Tutup
        </button>

        <!-- Submit Button -->
        <button
          @click="handleSubmit"
          v-if="!shareUrl"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="isLoadingSubmit"
        >
          {{ isLoadingSubmit ? 'Loading...' : 'Submit' }}
        </button>

        <!-- Share URL Button (appears after submit) -->
        <button
          @click="handleCopyToClipboard"
          class="px-4 py-2  text-white rounded-lg  transition-colors flex items-center gap-2"
          :class = "shareUrl ? 'bg-green-600 hover:bg-green-700': 'bg-gray-300 text-gray-500 cursor-not-allowed'"
          :disabled="!shareUrl"
          
        >
          <component :is="isUrlCopied ? CheckIcon : LinkIcon" class="size-4" />
          {{ isUrlCopied ? 'Tersalin!' : 'Bagikan URL' }}
        </button>

       
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import { CheckIcon, LinkIcon, TrashIcon, ArrowUpOnSquareStackIcon } from '@heroicons/vue/24/outline';
import { shareDocumentLink, deleteShareLink, getShareLink } from '../services/FileServices';


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

const SharedLink = ref(null);

// Computed
// const isFormValid = computed(() => {
//   return password.value.trim() !== '' && expiredAt.value !== '';
// });

// Methods
const loadShareLink = async () => {
  try {
    const response = await getShareLink(props.documentId);
    
    console.log(response);

    if (response && response.share_token) {
      // Ambil share_token dari response
      const token = response.share_token;
      
      // Generate full URL dengan format yang diminta
      shareUrl.value = `http://localhost:5170/api/files/public/shares/${token}/download/`;
      SharedLink.value = token;
      
      console.log('Share Link Loaded:', shareUrl.value);
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
  // shareUrl.value = null;
  isUrlCopied.value = false;
};

const handleSubmit = async () => {
  // Validasi expiredAt wajib
  if (!expiredAt.value) {
    toast.add({
      severity: 'warn',
      summary: 'Validasi',
      detail: 'Tanggal kedaluwarsa diperlukan',
      life: 3000,
    });
    return;
  }

  try {
    isLoadingSubmit.value = true;

    const response = await shareDocumentLink(props.documentId, {
      password: password.value || null,
      expired_at: expiredAt.value,
    });

    if (response && response.share_token) {
      // Ambil share_token dari response
      const token = response.share_token;
      
      // Generate full URL dengan format yang diminta
      shareUrl.value = `/api/files/public/shares/${token}/download/`;
      SharedLink.value = token;
      console.log(SharedLink.value)
      console.log(shareUrl.value)
      
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

const handleCopyToClipboard = async () => {
  // console.log('copied')
  //if (!shareUrl.value) return;
  try {
    console.log('copied')
    isUrlCopying.value = true;
    
    // shareUrl sudah dalam format full URL
    await navigator.clipboard.writeText(shareUrl.value);
    
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
    if (confirm('Apakah Anda yakin ingin menghapus share link ini?')) {
      isLoadingDelete.value = true;
      
      await deleteShareLink(props.documentId);
      
      toast.add({
        severity: 'success',
        summary: 'Sukses',
        detail: 'Share link berhasil dihapus',
        life: 3000,
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
