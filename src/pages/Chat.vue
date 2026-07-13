<script setup>
import { ref, onMounted, computed } from "vue";
import logoPLN from "./../image/pln.svg";
import Swal from "sweetalert2";
import {
  sendChatMessage,
  getChatSessions,
  getChatSessionMessages,
  deleteSession,
} from "./../services/ChatService";
import LoadingSpinner from "./../components/LoadingSpinner.vue";
import PreviewDocumentModal from "../components/PreviewDocumentModal.vue";
import { usePreviewModal } from "../composables/usePreviewModal";
import api from "../services/Api";
import { ArrowPathIcon } from "@heroicons/vue/24/outline";
import { useAuthStores } from "../stores/Auth";
import { usePermission } from "../composables/usePermissions";
import dummyData from "../constants/dummyKnowledge.json";

const { hasRole } = usePermission();

const isExpand = ref(true);
const messages = ref([]);
const currentMessage = ref("");
const isLoading = ref(false);
const conversationId = ref(0);
const chatSessions = ref([]);
const isLoadingSessions = ref(false);
const isLoadingHistory = ref(false);
const selectedSessionId = ref(null);
const deletingSessionId = ref(null);
const chatTitle = ref("");
const searchQuery = ref("");

const {
  isOpen: isPreviewOpen,
  isLoading: isPreviewLoading,
  error: previewError,
  previewUrl,
  selectedDocument: previewDocument,
  openModal: openPreviewModal,
  closeModal: closePreviewModal,
} = usePreviewModal();

const useAuth = useAuthStores()
// Computed property untuk filter chat sessions berdasarkan search query
const filteredChatSessions = computed(() => {
  if (!searchQuery.value.trim()) {
    return chatSessions.value;
  }

  const query = searchQuery.value.toLowerCase();
  return chatSessions.value.filter((session) => {
    const title = (session.title || `Chat #${session.id}`).toLowerCase();
    return title.includes(query);
  });
});

onMounted(async () => {
  await initialize();
});

const initialize = async () => {
  try {
    useAuth.setLoading(true)
    await fetchChatSessions();
      setTimeout(() => {
    useAuth.setLoading(false)
  }, 500);
  } catch (error) {
    await Swal.fire({
      title: "Error!",
      text: error.message || "Gagal memuat data chat session",
      icon: "error",
      confirmButtonColor: "#ef4444",
    });
  }
}

const handleNewChat = () => {
  messages.value = [];
  conversationId.value = 0;
  selectedSessionId.value = [];
};

const fetchChatSessions = async () => {
  isLoadingSessions.value = true;
  try {
    const response = await getChatSessions();
    chatSessions.value = Array.isArray(response)
      ? response
      : response.sessions || [];
  } catch (error) {
    chatSessions.value = [];
  } finally {
    isLoadingSessions.value = false;
  }
};

const handleSelectSession = async (session) => {
  // Reset messages and set new session
  messages.value = [];
  conversationId.value = session.id;
  selectedSessionId.value = session.id;
  isLoadingHistory.value = true;

  try {
    const response = await getChatSessionMessages(session.id);
    chatTitle.value = response.title;
    chatTitle.value = chatTitle.value.replace(/"/g, "");

    // Process messages from API response
    const apiMessages = Array.isArray(response)
      ? response
      : response.messages || response.data || [];

    // Convert API messages to display format
    const formattedMessages = apiMessages.map((msg) => {
      // Determine message type based on sender
      let type = "bot";
      const sender = (msg.sender || msg.sender_type || "").toLowerCase();

      // Check if sender is user
      if (sender === "user" || sender === "1" || msg.role === "user") {
        type = "user";
      }

      // Parse timestamp if it's a string
      let timestamp = msg.created_at ? new Date(msg.created_at) : new Date();

      return {
        type,
        content: msg.message || msg.content || msg.text || "",
        timestamp,
        sources: msg.sources_metadata || msg.full_sources || msg.sources || [],
      };
    });

    // Fallback local search dummy data if sources empty in history for AP2T
    if (hasRole('AP2T')) {
      for (let i = 0; i < formattedMessages.length; i++) {
        const msg = formattedMessages[i];
        if (msg.type === 'bot' && (!msg.sources || msg.sources.length === 0)) {
          // Find the previous user query
          let userQuery = "";
          for (let j = i - 1; j >= 0; j--) {
            if (formattedMessages[j].type === 'user') {
              userQuery = formattedMessages[j].content;
              break;
            }
          }
          if (userQuery) {
            const query = userQuery.toLowerCase();
            const matched = dummyData.filter(item => {
              if (!item) return false;
              const keywords = typeof item.keywords === 'string' 
                ? item.keywords.split(",").map(k => k.trim().toLowerCase()) 
                : Array.isArray(item.keywords) ? item.keywords.map(k => String(k).trim().toLowerCase()) : [];
              const incident = typeof item.incident === 'string' ? item.incident.toLowerCase() : "";
              const description = typeof item.description === 'string' ? item.description.toLowerCase() : "";
              const category = typeof item.category === 'string' ? item.category.toLowerCase() : "";
              
              return keywords.some(kw => query.includes(kw)) || 
                     incident.includes(query) || 
                     description.includes(query) ||
                     category.includes(query);
            });
            
            msg.sources = matched.map((item, idx) => ({
              text: `${item.id || ''} | ${item.incident || ''} | ${item.category || ''} | ${item.keywords || ''} | ${item.description || ''} | ${item.resolution || ''}`,
              similarity_score: 0.2 + (idx * 0.05)
            }));
          }
        }
      }
    }

    messages.value = formattedMessages;
  } catch (error) {
    messages.value = [
      {
        type: "error",
        content: error.message || "Gagal memuat percakapan",
        timestamp: new Date(),
      },
    ];
  } finally {
    isLoadingHistory.value = false;
  }
};

const expandSidebarChat = () => {
  isExpand.value = !isExpand.value;
};

const handleDeleteSession = async (session, event) => {
  // Stop event propagation so it doesn't trigger handleSelectSession
  event.stopPropagation();

  const result = await Swal.fire({
    title: "Hapus Percakapan?",
    text: `Apakah Anda yakin ingin menghapus percakapan "${session.title || `Chat #${session.id}`}"?`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#ef4444",
    cancelButtonColor: "#6b7280",
    confirmButtonText: "Ya, Hapus!",
    cancelButtonText: "Batal",
  });

  if (result.isConfirmed) {
    deletingSessionId.value = session.id;
    try {
      await deleteSession(session.id);

      // Remove session from list
      const index = chatSessions.value.findIndex((s) => s.id === session.id);
      if (index > -1) {
        chatSessions.value.splice(index, 1);
      }

      // Reset state if deleted session was selected
      if (selectedSessionId.value === session.id) {
        selectedSessionId.value = null;
        conversationId.value = 0;
        messages.value = [];
      }

      await Swal.fire({
        title: "Berhasil!",
        text: "Percakapan telah dihapus.",
        icon: "success",
        confirmButtonColor: "#3b82f6",
      });
    } catch (error) {
      await Swal.fire({
        title: "Gagal!",
        text: error.message || "Gagal menghapus percakapan",
        icon: "error",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      deletingSessionId.value = null;
    }
  }
};

const handleSendMessage = async (e) => {
  e.preventDefault();

  const userMessage = currentMessage.value.trim();

  if (!userMessage) {
    return;
  }

  // Add user message to chat
  messages.value.push({
    type: "user",
    content: userMessage,
    timestamp: new Date(),
  });

  // Clear input
  currentMessage.value = "";
  // Set loading state
  isLoading.value = true;

  try {
    // Send message to API
    const response = await sendChatMessage(
      userMessage,
      conversationId.value ? conversationId.value : 0,
    );

    // Add bot response to chat
    if (response && response.response) {
      let sources = response.sources || response.full_sources || [];
      
      // Fallback local search dummy data if sources empty for AP2T
      if (hasRole('AP2T') && sources.length === 0) {
        const query = userMessage.toLowerCase();
        const matched = dummyData.filter(item => {
          if (!item) return false;
          const keywords = typeof item.keywords === 'string' 
            ? item.keywords.split(",").map(k => k.trim().toLowerCase()) 
            : Array.isArray(item.keywords) ? item.keywords.map(k => String(k).trim().toLowerCase()) : [];
          const incident = typeof item.incident === 'string' ? item.incident.toLowerCase() : "";
          const description = typeof item.description === 'string' ? item.description.toLowerCase() : "";
          const category = typeof item.category === 'string' ? item.category.toLowerCase() : "";
          
          return keywords.some(kw => query.includes(kw)) || 
                 incident.includes(query) || 
                 description.includes(query) ||
                 category.includes(query);
        });
        
        sources = matched.map((item, idx) => ({
          text: `${item.id || ''} | ${item.incident || ''} | ${item.category || ''} | ${item.keywords || ''} | ${item.description || ''} | ${item.resolution || ''}`,
          similarity_score: 0.2 + (idx * 0.05)
        }));
      }

      messages.value.push({
        type: "bot",
        content: response.response,
        timestamp: new Date(),
        sources: sources,
      });
    }
    conversationId.value = response.conversation_id;
  } catch (error) {
    // If API fails, check if we can simulate response for AP2T role using dummy data
    if (hasRole('AP2T')) {
      const query = userMessage.toLowerCase();
      const matched = dummyData.filter(item => {
        if (!item) return false;
        const keywords = typeof item.keywords === 'string' 
          ? item.keywords.split(",").map(k => k.trim().toLowerCase()) 
          : Array.isArray(item.keywords) ? item.keywords.map(k => String(k).trim().toLowerCase()) : [];
        const incident = typeof item.incident === 'string' ? item.incident.toLowerCase() : "";
        const description = typeof item.description === 'string' ? item.description.toLowerCase() : "";
        const category = typeof item.category === 'string' ? item.category.toLowerCase() : "";
        
        return keywords.some(kw => query.includes(kw)) || 
               incident.includes(query) || 
               description.includes(query) ||
               category.includes(query);
      });
      
      if (matched.length > 0) {
        const sources = matched.map((item, idx) => ({
          text: `${item.id || ''} | ${item.incident || ''} | ${item.category || ''} | ${item.keywords || ''} | ${item.description || ''} | ${item.resolution || ''}`,
          similarity_score: 0.2 + (idx * 0.05)
        }));
        
        messages.value.push({
          type: "bot",
          content: "Berikut adalah hasil identifikasi incident berdasarkan basis data pengetahuan dummy lokal kami yang cocok dengan pertanyaan Anda.",
          timestamp: new Date(),
          sources: sources,
        });
        return;
      }
    }
    
    // Add error message to chat
    messages.value.push({
      type: "error",
      content: error.message || "Terjadi kesalahan saat mengirim pesan",
      timestamp: new Date(),
    });
  } finally {
    isLoading.value = false;
  }
};

const formatTime = (date) => {
  if (!date) return "";
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

const escapeHtml = (text) => {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

const formatChatContent = (content) => {
  if (!content) return "";

  let text = escapeHtml(content);
  text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/__(.+?)__/g, "<strong>$1</strong>");

  const blocks = text.split(/\n\s*\n/);
  let html = "";

  blocks.forEach((block) => {
    const lines = block.split(/\n/);
    const ordered = lines.every((line) => /^\s*\d+\.\s+/.test(line));
    const unordered = lines.every((line) => /^\s*[-*]\s+/.test(line));

    if (ordered) {
      html += '<ol class="list-decimal list-inside ml-4 mb-3">';
      lines.forEach((line) => {
        const item = line.replace(/^\s*\d+\.\s+/, "");
        html += `<li>${item}</li>`;
      });
      html += "</ol>";
    } else if (unordered) {
      html += '<ul class="list-disc list-inside ml-4 mb-3">';
      lines.forEach((line) => {
        const item = line.replace(/^\s*[-*]\s+/, "");
        html += `<li>${item}</li>`;
      });
      html += "</ul>";
    } else {
      html += `<p class="mb-2">${lines.join("<br />")}</p>`;
    }
  });

  return html;
};

const formatTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Baru saja";
  if (diffMins < 60) return `${diffMins} menit yang lalu`;
  if (diffHours < 24) return `${diffHours} jam yang lalu`;
  if (diffDays < 7) return `${diffDays} hari yang lalu`;

  return date.toLocaleDateString("id-ID");
};

const handlePreviewDocument = async (source) => {
  const fileId = source?.file_id || source?.id || source?.fileId;
  const page = source?.page ;

  if (!fileId) {
    console.error("Preview error: file tidak ditemukan");
    return;
  }

  const document = {
    id: fileId,
    filename: source?.filename || source?.name || "Dokumen",
    filesize: source?.filesize || source?.file_size || 0,
    created_at: source?.created_at || source?.createdAt || null,
    page,
  };

  try {
    await openPreviewModal(document, page);
  } catch (error) {
    console.error("Preview error:", error);
  }
};
const hanldeRefreshChat = async () => {
  await initialize();
}
const parseTicketsFromSource = (source) => {
  const text = source.text || "";
  const lines = text.split("\n");
  const tickets = [];
  
  lines.forEach((line) => {
    const parts = line.split("|").map(p => p.trim());
    if (parts.length >= 2) {
      const id = parts[0] || "";
      const incident = parts[1] || "";
      const category = parts[2] || "";
      const keywords = parts[3] || "";
      const description = parts[4] || "";
      const resolution = parts[5] || "";
      
      // Ignore header row or empty IDs
      if (!id || id.toLowerCase() === 'id' || incident.toLowerCase() === 'incident') {
        return;
      }
      
      let displayPercent = 48; // fallback
      if (source.similarity_score !== undefined) {
        const s = parseFloat(source.similarity_score);
        // Map similarity score to a nice percentage match
        displayPercent = Math.max(30, Math.min(98, Math.round((1.2 - s) * 70)));
      }
      
      tickets.push({
        id: id.startsWith("#") ? id : `#${id}`,
        incident,
        category,
        keywords,
        description,
        resolution,
        percent: displayPercent
      });
    }
  });
  
  return tickets;
};

const getUniqueTicketsFromMessage = (message) => {
  if (!message.sources || message.sources.length === 0) return [];
  
  const allTickets = [];
  const seenIds = new Set();
  
  message.sources.forEach((source) => {
    const tickets = parseTicketsFromSource(source);
    tickets.forEach((ticket) => {
      if (!seenIds.has(ticket.id)) {
        seenIds.add(ticket.id);
        allTickets.push(ticket);
      }
    });
  });
  
  return allTickets.slice(0, 4); // Limit to top 4 tickets
};
</script>

<template>
  <div
    class="h-screen transition-all duration-300 ease-in-out"
    :style="{
      display: 'grid',
      gridTemplateColumns: isExpand ? '250px 1fr' : '0px 1fr',
    }"
  >
    <!-- container chat -->
    <section
      class="py-4 px-2 bg-mainblue/50 transition-all duration-300 ease-in-out h-screen flex flex-col  overflow-hidden border-r border-slate-200"
      :style="{
        width: isExpand ? '250px' : '0px',
        opacity: isExpand ? 1 : 0,
      }"
    >
      <div class="border-b border-gray-400/20 w-full flex gap-x-4 items-center justify-center pt-2 pb-4">
        <button
          class="bg-blue-500 p-2 flex rounded-lg text-sm w-full hover:cursor-pointer items-center justify-center"
          @click="handleNewChat"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="size-5"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>

          <p class="font-semibold ms-2">Chat Baru</p>
        </button>
        <ArrowPathIcon class="w-5 text-blue-500 cursor-pointer shrink-0" @click="hanldeRefreshChat"></ArrowPathIcon>
      </div>

      <form action="" method="POST" class="w-full mt-2 mb-4" @submit.prevent>
        <label
          for="searchChat"
          class="border border-gray-400/60 rounded-lg px-2 w-full flex gap-x-1 items-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="size-5 text-gray-500 font-semibold"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
            />
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            id="searchChat"
            class="text-sm text-black py-1 px-1 focus:outline-none focus:ring-0 focus:border-transparent w-full bg-transparent"
            placeholder="Cari chat..."
          />
        </label>
      </form>

      <!-- Chat History -->
      <div class="mt-4 space-y-2 flex-1 overflow-y-auto">
        <div
          v-if="isLoadingSessions"
          class="rounded-lg bg-blue-300/20 py-2 px-3 flex gap-x-2 items-center justify-center"
        >
          <LoadingSpinner />
        </div>

        <div
          v-for="session in filteredChatSessions"
          :key="session.id"
          @click="handleSelectSession(session)"
          :class="[
            'rounded-lg py-2 px-3 flex gap-x-2 items-center cursor-pointer transition-all group',
            selectedSessionId === session.id
              ? 'bg-blue-400/30 border border-blue-400'
              : 'bg-blue-300/20 hover:bg-blue-300/30',
          ]"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="size-5 text-blue-500 shrink-0"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
            />
          </svg>

          <div class="flex-1 min-w-0">
            <p class="text-blue-500 font-semibold text-sm truncate">
              {{ session.title || `Chat #${session.id}` }}
            </p>
            <p class="text-gray-600 text-xs font-normal">
              {{ formatTimeAgo(session.created_at || session.updated_at) }}
            </p>
          </div>

          <!-- Delete Button -->
          <button
            @click="handleDeleteSession(session, $event)"
            :disabled="deletingSessionId === session.id"
            class="shrink-0 opacity-0 group-hover:opacity-100 hover:bg-red-500/70 p-1.5 rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:cursor-pointer"
            title="Hapus percakapan"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="size-4"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
              />
            </svg>
          </button>
        </div>

        <div
          v-if="filteredChatSessions.length === 0 && !isLoadingSessions"
          class="text-center py-4"
        >
          <p class="text-gray-400 text-sm">
            {{
              searchQuery ? "Chat tidak ditemukan" : "Tidak ada riwayat chat"
            }}
          </p>
        </div>
      </div>
    </section>

    <div class="flex flex-col h-screen">
      <!-- Navbar -->
      <div
        class="relative bg-mainblue h-12 flex items-center p-2 border-b border-slate-200"
      >
        <!-- button minimize chat history bar -->
        <button
          @click="expandSidebarChat"
          class="absolute rounded-full p-2 border border-gray-400/30 shadow-xl bg-mainblue cursor-pointer transition-all duration-300 ease-in-out"
          :style="{
            left: isExpand ? '-8px' : '0px',
          }"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="size-3 text-gray-500"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="m18.75 4.5-7.5 7.5 7.5 7.5m-6-15L5.25 12l7.5 7.5"
            />
          </svg>
        </button>
        <h1 class="text-black text-lg font-semibold ms-6">{{ chatTitle }}</h1>
      </div>

      <!-- Content -->
      <section
        v-if="messages.length === 0 && !isLoadingHistory"
        class="flex flex-col justify-center items-center mt-24"
      >
        <img :src="logoPLN" alt="" />
        <p class="text-black font-semibold mt-4">Tanya AI Kami</p>
        <p class="text-slate-500 mt-1">Saran pertanyaan untuk AI</p>
      </section>

      <!-- Loading History -->
      <section
        v-if="isLoadingHistory"
        class="flex flex-col justify-center items-center mt-24"
      >
        <LoadingSpinner />
        <p class="text-black font-semibold mt-4">Memuat percakapan...</p>
      </section>

      <section
        v-if="messages.length === 0 && !isLoadingHistory"
        class="flex gap-x-2 mt-6 justify-center"
      >
        <p
          class="bg-mainblue/70 rounded-lg p-2 text-black font-semibold text-md"
        >
          Apa yang bisa kamu bantu?
        </p>
        <p
          class="bg-mainblue/70 rounded-lg p-2 text-black font-semibold text-md"
        >
          Bagaimana kerja AI ini?
        </p>
        <p
          class="bg-mainblue/70 rounded-lg p-2 text-black font-semibold text-md"
        >
          Beritahu saya tentang fitur fitur yang tersedia?
        </p>
      </section>

      <!-- Chat Messages -->
      <section
        v-if="messages.length > 0"
        class="flex-1 overflow-y-auto px-4 py-4 space-y-4"
      >
        <div v-for="(message, index) in messages" :key="index" class="flex">
          <!-- User Message -->
          <div v-if="message.type === 'user'" class="ml-auto">
            <div
              class="bg-blue-500 text-white rounded-lg p-3 max-w-xs lg:max-w-md"
            >
              <p class="text-sm">{{ message.content }}</p>
            </div>
            <p class="text-xs text-gray-400 mt-1 text-right">
              {{ formatTime(message.timestamp) }}
            </p>
          </div>

          <!-- Bot Message -->
          <div v-else-if="message.type === 'bot'" class="mr-auto flex flex-col gap-2 max-w-xl lg:max-w-3xl">
            <div
              class="bg-mainblue text-black rounded-lg p-3 max-w-xs lg:max-w-md self-start"
            >
              <div class="text-sm prose prose-slate" v-html="formatChatContent(message.content)"></div>

              <!-- Document Sources (Non-AP2T only) -->
              <div
                v-if="!hasRole('AP2T') && message.sources && message.sources.length > 0"
                class="mt-3 pt-3 border-t border-gray-300"
              >
                <p class="text-xs font-semibold text-gray-600 mb-2">
                  Sumber Dokumen:
                </p>
                <div class="flex flex-col gap-1 ">
                  <button
                    v-for="(source, idx) in message.sources"
                    :key="idx"
                    @click="handlePreviewDocument(source)"
                    class="text-xs text-blue-600 hover:text-blue-800 hover:underline text-left transition-colors truncate cursor-pointer"
                    :title="source.filename"
                  >
                    📄 {{ source.filename }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Toggle Button for AP2T Recommendations -->
            <button 
              v-if="hasRole('AP2T') && getUniqueTicketsFromMessage(message).length > 0"
              @click="message.showRecommendations = message.showRecommendations === false ? true : false"
              class="flex items-center gap-1.5 px-3 py-1.5 mt-1 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer self-start border border-blue-200"
            >
              <svg v-if="message.showRecommendations !== false" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
              </svg>
              {{ message.showRecommendations !== false ? 'Sembunyikan Rekomendasi Tiket' : 'Tampilkan Rekomendasi Tiket' }}
              ({{ getUniqueTicketsFromMessage(message).length }})
            </button>

            <!-- AP2T Incident Recommendations (AP2T only) -->
            <div 
              v-if="hasRole('AP2T') && message.showRecommendations !== false && getUniqueTicketsFromMessage(message).length > 0"
              class="flex flex-col gap-3 mt-2 w-full max-w-3xl"
            >
              <div 
                v-for="(ticket, idx) in getUniqueTicketsFromMessage(message)" 
                :key="idx"
                class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow duration-200 text-black animate-fade-in"
              >
                <!-- Header: Rank, ID, Category Badge, Match % -->
                <div class="flex items-center gap-2 mb-2 flex-wrap">
                  <span class="bg-gray-100 rounded px-1.5 py-0.5 text-xs text-gray-500 font-bold">
                    {{ idx + 1 }}
                  </span>
                  <span class="font-bold text-teal-600 text-sm">
                    {{ ticket.id }}
                  </span>
                  
                  <!-- Category Badge -->
                  <span 
                    v-if="ticket.category"
                    :class="[
                      'px-2 py-0.5 rounded-full text-xs font-semibold',
                      ticket.category.includes('PELAYANAN') ? 'bg-emerald-100 text-emerald-800' :
                      ticket.category.includes('PEMBANGKITAN') ? 'bg-rose-100 text-rose-800' :
                      ticket.category.includes('ERP') ? 'bg-indigo-100 text-indigo-800' :
                      'bg-slate-100 text-slate-800'
                    ]"
                  >
                    {{ ticket.category }}
                  </span>
                  
                  <span class="ms-auto text-sm font-semibold text-slate-500">
                    {{ ticket.percent }}%
                  </span>
                </div>
                
                <!-- Progress Bar -->
                <div class="w-full bg-slate-100 rounded-full h-1.5 mb-3 overflow-hidden">
                  <div 
                    class="bg-slate-400 h-1.5 rounded-full transition-all duration-500" 
                    :style="{ width: `${ticket.percent}%` }"
                  ></div>
                </div>
                
                <!-- Body: Incident Title + Description -->
                <p class="text-sm text-slate-700 leading-relaxed">
                  <strong class="text-slate-900" v-if="ticket.incident">{{ ticket.incident }}. </strong>
                  {{ ticket.description }}
                </p>
                
                <!-- Detail Resolusi -->
                <div v-if="ticket.resolution" class="mt-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
                  <span class="font-semibold text-slate-600">Resolusi: </span>
                  {{ ticket.resolution }}
                </div>
              </div>
            </div>

            <p class="text-xs text-gray-400 mt-1">
              {{ formatTime(message.timestamp) }}
            </p>
          </div>

          <!-- Error Message -->
          <div v-else-if="message.type === 'error'" class="ml-auto">
            <div
              class="bg-red-500 text-white rounded-lg p-3 max-w-xs lg:max-w-md"
            >
              <p class="text-sm">{{ message.content }}</p>
            </div>
            <p class="text-xs text-gray-400 mt-1 text-right">
              {{ formatTime(message.timestamp) }}
            </p>
          </div>
        </div>

        <!-- Loading Indicator -->
        <div v-if="isLoading" class="flex">
          <div class="mr-auto">
            <div
              class="bg-gray-200 text-black rounded-lg p-3 flex items-center gap-2"
            >
              <LoadingSpinner />
              <p class="text-sm">Sedang memproses...</p>
            </div>
          </div>
        </div>
      </section>

      <footer
        class="flex py-5 px-4 bg-mainblue/40 relative items-center border-t border-slate-200"
        :class="[messages.length > 0 ? 'mt-auto' : 'mt-auto']"
      >
        <form
          method="POST"
          class="flex w-full gap-x-4"
          @submit="handleSendMessage"
        >
          <input
            v-model="currentMessage"
            type="text"
            :placeholder="hasRole('AP2T') ? 'Cari dengan format: id, incident, category, keywords, description, resolution' : 'Tanyakan sesuatu kepada AI..'"
            :disabled="isLoading"
            class="border border-slate-300 bg-mainblue/60 rounded-lg py-1.5 px-4 w-full text-black text-sm focus:border focus:border-mainblue/60 focus:ring-0 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            :disabled="isLoading"
            type="submit"
            class="py-2 px-3 bg-blue-400 rounded-lg ml-auto disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="size-5 -rotate-45"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
              />
            </svg>
          </button>
        </form>
      </footer>
    </div>

    <PreviewDocumentModal
      :isOpen="isPreviewOpen"
      :document="previewDocument"
      :previewUrl="previewUrl"
      :isLoading="isPreviewLoading"
      :error="previewError"
      @close="closePreviewModal"
      @download="closePreviewModal"
    />
  </div>
</template>

<style scoped></style>
