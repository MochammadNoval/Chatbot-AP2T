<script setup>
defineProps({
  modelValue: {
    type: [String, Number],
    default: "",
  },
  options: {
    type: Array,
    required: true,
    // Format: [{ id: 1, name: 'Option 1' }]
  },
  placeholder: {
    type: String,
    default: "Pilih opsi...",
  },
});

defineEmits(["update:modelValue"]);
</script>

<template>
  <div class="w-full">
    <select
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700"
    >
      <option value="">{{ placeholder }}</option>
      <option v-for="option in options" :key="option.id" :value="option.id">
        {{ option.name }}
      </option>
    </select>
  </div>
</template>

<style scoped>
select {
  transition: all 0.3s ease;
}

select:hover {
  border-color: #3b82f6;
}

select:disabled {
  background-color: #f3f4f6;
  cursor: not-allowed;
}
</style>
