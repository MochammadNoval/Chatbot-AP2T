<script setup>
import { ref, onMounted, computed } from "vue";

const props = defineProps({
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    default: "info", // success | error | warning | info
  },
  duration: {
    type: Number,
    default: 5000,
  },
});

const show = ref(true);

const toastClass = computed(() => {
  switch (props.type) {
    case "success":
      return "alert-success";
    case "error":
      return "alert-error";
    case "warning":
      return "alert-warning";
    default:
      return "alert-info";
  }
});

onMounted(() => {
  setTimeout(() => {
    show.value = false;
  }, props.duration);
});
</script>

<template>
  <transition name="fade">
    <div v-if="show" class="toast toast-top toast-end z-50">
      <div class="alert" :class="toastClass">
        <span>{{ message }}</span>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: all 0.4s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
