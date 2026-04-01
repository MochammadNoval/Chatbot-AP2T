<script setup>
import { ref, onMounted } from "vue";
import logoIconPlus from "./../image/logo-pln-plus.svg";
import logoPLN from "./../image/pln.svg";
import {
  sendChatMessage,
  getChatSessions,
  getChatSessionMessages,
} from "./../services/ChatService";
import LoadingSpinner from "./../components/LoadingSpinner.vue";

const isExpand = ref(true);
const messages = ref([]);
const currentMessage = ref("");
const isLoading = ref(false);
const conversationId = ref(0);
const chatSessions = ref([]);
const isLoadingSessions = ref(false);
const isLoadingHistory = ref(false);
const selectedSessionId = ref(null);

onMounted(async () => {
  await fetchChatSessions();
});

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

    // Process messages from API response
    const apiMessages = Array.isArray(response)
      ? response
      : response.messages || response.data || [];

    // Convert API messages to display format
    messages.value = apiMessages.map((msg) => {
      // Determine message type based on sender
      let type = "bot";
      const sender = (msg.sender || msg.sender_type || "").toLowerCase();

      // Check if sender is user
      if (sender === "user" || sender === "1" || msg.role === "user") {
        type = "user";
      }

      // Parse timestamp if it's a string
      let timestamp = msg.timestamp ? new Date(msg.timestamp) : new Date();

      return {
        type,
        content: msg.message || msg.content || msg.text || "",
        timestamp,
      };
    });
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
    const response = await sendChatMessage(userMessage, conversationId.value);

    // Add bot response to chat
    if (response && response.response) {
      messages.value.push({
        type: "bot",
        content: response.response,
        timestamp: new Date(),
      });
    }
  } catch (error) {
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
</script>

<template>
  <div
    :class="[
      'transition-all duration-300 ease-in-out',
      isExpand ? 'grid grid-cols-[250px_1fr]' : 'w-auto',
    ]"
  >
    <!-- container chat -->
    <section
      class="py-4 px-2 bg-mainblue/50 transition-all duration-300 ease-in-out h-screen flex flex-col overflow-auto"
      :class="[
        'transition-all duration-300 ease-in-out',
        isExpand ? 'inline-block' : 'hidden',
      ]"
    >
      <div class="border-b border-gray-400/20 w-full px-3">
        <button class="bg-blue-500 p-2 flex rounded-lg text-sm w-full mb-4">
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
      </div>

      <form action="" method="POST" class="w-full mt-2 mb-4">
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
            type="text"
            name=""
            id=""
            class="text-sm text-black py-1 px-1 focus:outline-none focus:ring-0 focus:border-transparent"
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
          v-for="session in chatSessions"
          :key="session.id"
          @click="handleSelectSession(session)"
          :class="[
            'rounded-lg py-2 px-3 flex gap-x-2 items-center cursor-pointer transition-all',
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
            class="size-5 text-blue-500 flex-shrink-0"
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
        </div>

        <div
          v-if="chatSessions.length === 0 && !isLoadingSessions"
          class="text-center py-4"
        >
          <p class="text-gray-400 text-sm">Tidak ada riwayat chat</p>
        </div>
      </div>
    </section>

    <div class="flex flex-col min-h-screen">
      <!-- Navbar -->
      <div class="relative bg-mainblue flex items-center p-2">
        <!-- button minimize chat history bar -->
        <button
          @click="expandSidebarChat"
          class="absolute -left-2 rounded-full p-2 border border-gray-400/30 shadow-xl bg-mainblue cursor-pointer"
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
        <h1 class="text-black text-lg font-semibold ms-4">Chat Baru</h1>
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
          <div v-else-if="message.type === 'bot'" class="mr-auto">
            <div
              class="bg-gray-200 text-black rounded-lg p-3 max-w-xs lg:max-w-md"
            >
              <p class="text-sm">{{ message.content }}</p>
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
        class="flex py-5 px-4 bg-mainblue/40 relative items-center"
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
            placeholder="Tanyakan sesuatu kepada AI.."
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
  </div>
</template>

<style scoped></style>
