/\*\*

- EXAMPLE: Cara Menggunakan User Create Feature di Component Lain
-
- File: src/pages/AnyPage.vue atau component lain
  \*/

// ============= OPTION 1: Standalone Modal Usage =============

/\*
<template>

  <div>
    <!-- Trigger Button -->
    <button @click="showCreateUserModal = true">
      Buat User
    </button>

    <!-- Modal Component -->
    <UserCreateModal
      :isOpen="showCreateUserModal"
      @close="handleModalClose"
      @success="handleUserCreated"
    />

  </div>
</template>

<script setup>
import { ref } from 'vue'
import UserCreateModal from '@/components/UserCreateModal.vue'

const showCreateUserModal = ref(false)

const handleModalClose = () => {
  showCreateUserModal.value = false
}

const handleUserCreated = (newUser) => {
  // Data user baru sudah dibuat
  console.log('New user created:', newUser)
  // Lakukan sesuatu, misal reload data, update list, dll
}
</script>

\*/

// ============= OPTION 2: Composable Pattern =============

/\*
// File: src/composables/useUserCreate.js

import { ref } from 'vue'
import { createUser } from '@/services/User'

export function useUserCreate() {
const isLoading = ref(false)
const error = ref(null)

const createNewUser = async (userData) => {
isLoading.value = true
error.value = null

    try {
      const response = await createUser(userData)
      return response
    } catch (err) {
      error.value = err.response?.data?.message || err.message
      throw err
    } finally {
      isLoading.value = false
    }

}

return {
isLoading,
error,
createNewUser
}
}

// Usage di component:
// import { useUserCreate } from '@/composables/useUserCreate'
// const { createNewUser, isLoading, error } = useUserCreate()
\*/

// ============= PASSWORD VALIDATOR USAGE =============

/\*
import { PasswordValidator, isValidEmail, isValidName } from '@/utils/PasswordValidator'

// Validate single criteria
const validator = new PasswordValidator('MyPassword123!')
console.log(validator.hasMinimumLength()) // true
console.log(validator.hasUpperCase()) // true
console.log(validator.hasNumber()) // true
console.log(validator.hasSpecialCharacter()) // true

// Validate all criteria
const result = validator.validate()
// Returns: { isValid: true, errors: [] }

// Get password strength
const strength = validator.getStrength() // 'strong', 'medium', 'weak'

// Validate email
console.log(isValidEmail('user@example.com')) // true
console.log(isValidEmail('invalid-email')) // false

// Validate name
console.log(isValidName('John Doe')) // true
console.log(isValidName('A')) // false (< 2 chars)
\*/

// ============= CUSTOM VALIDATION FORM =============

/\*
// Jika ingin membuat form validation custom dengan PasswordValidator:

<script setup>
import { ref, computed } from 'vue'
import { PasswordValidator } from '@/utils/PasswordValidator'

const password = ref('')

// Live validation errors
const passwordErrors = computed(() => {
  if (!password.value) return []
  
  const validator = new PasswordValidator(password.value)
  const result = validator.validate()
  return result.errors
})

// Password strength indicator
const passwordStrength = computed(() => {
  if (!password.value) return null
  
  const validator = new PasswordValidator(password.value)
  return validator.getStrength() // 'weak', 'medium', 'strong'
})

const strengthColor = computed(() => {
  switch (passwordStrength.value) {
    case 'weak':
      return 'text-red-500'
    case 'medium':
      return 'text-yellow-500'
    case 'strong':
      return 'text-green-500'
    default:
      return 'text-gray-500'
  }
})
</script>

<template>
  <div>
    <input
      v-model="password"
      type="password"
      placeholder="Enter password"
    />

    <!-- Live validation errors -->
    <ul v-if="passwordErrors.length" class="text-red-500 text-sm mt-2">
      <li v-for="error in passwordErrors" :key="error">
        ❌ {{ error }}
      </li>
    </ul>

    <!-- Strength indicator -->
    <p v-if="passwordStrength" :class="strengthColor" class="mt-2">
      Password Strength: {{ passwordStrength }}
    </p>

  </div>
</template>
*/

// ============= API SERVICE USAGE =============

/\*
import { getAllUsers, getUserById, createUser, updateUser, deleteUser } from '@/services/User'

// Get all users
const users = await getAllUsers(page = 1, limit = 10, search = 'john')

// Get user by ID
const user = await getUserById(1)

// Create new user
const newUser = await createUser({
email: 'john@example.com',
name: 'John Doe',
password: 'SecureP@ss123'
})

// Update user (future implementation)
// const updated = await updateUser(1, { name: 'Jane Doe' })

// Delete user
// await deleteUser(1)
\*/

// ============= ERROR HANDLING =============

/\*

<script setup>
import { createUser } from '@/services/User'

const handleSubmit = async (formData) => {
  try {
    const response = await createUser(formData)
    
    // Success
    console.log('User created:', response)
    
  } catch (error) {
    // API error
    const errorMessage = error.response?.data?.message || error.message
    console.error('Error:', errorMessage)
    
    // Show toast or handle error
    showNotification(errorMessage, 'error')
  }
}
</script>

\*/

// ============= TESTING EXAMPLE =============

/\*
import { describe, it, expect } from 'vitest'
import { PasswordValidator, isValidEmail, isValidName } from '@/utils/PasswordValidator'

describe('PasswordValidator', () => {
describe('hasMinimumLength', () => {
it('should return true for password with 8+ characters', () => {
const validator = new PasswordValidator('MyPassword123!')
expect(validator.hasMinimumLength()).toBe(true)
})

    it('should return false for password with < 8 characters', () => {
      const validator = new PasswordValidator('MyPass1!')
      expect(validator.hasMinimumLength()).toBe(false)
    })

})

describe('hasUpperCase', () => {
it('should return true for password with uppercase letters', () => {
const validator = new PasswordValidator('Password')
expect(validator.hasUpperCase()).toBe(true)
})

    it('should return false for password without uppercase letters', () => {
      const validator = new PasswordValidator('password')
      expect(validator.hasUpperCase()).toBe(false)
    })

})

describe('hasNumber', () => {
it('should return true for password containing numbers', () => {
const validator = new PasswordValidator('Password123')
expect(validator.hasNumber()).toBe(true)
})

    it('should return false for password without numbers', () => {
      const validator = new PasswordValidator('Password')
      expect(validator.hasNumber()).toBe(false)
    })

})

describe('hasSpecialCharacter', () => {
it('should return true for password with special characters', () => {
const validator = new PasswordValidator('Password@123')
expect(validator.hasSpecialCharacter()).toBe(true)
})

    it('should return false for password without special characters', () => {
      const validator = new PasswordValidator('Password123')
      expect(validator.hasSpecialCharacter()).toBe(false)
    })

})

describe('validate', () => {
it('should return valid true when all criteria met', () => {
const validator = new PasswordValidator('MyPassword@123')
const result = validator.validate()
expect(result.isValid).toBe(true)
expect(result.errors).toHaveLength(0)
})

    it('should return all violations when criteria not met', () => {
      const validator = new PasswordValidator('pass')
      const result = validator.validate()
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

})

describe('getStrength', () => {
it('should return strong for password meeting all criteria', () => {
const validator = new PasswordValidator('MyPassword@123456')
expect(validator.getStrength()).toBe('strong')
})
})
})

describe('isValidEmail', () => {
it('should validate email format correctly', () => {
expect(isValidEmail('user@example.com')).toBe(true)
expect(isValidEmail('invalid-email')).toBe(false)
expect(isValidEmail('user@')).toBe(false)
})
})

describe('isValidName', () => {
it('should validate name length correctly', () => {
expect(isValidName('John Doe')).toBe(true)
expect(isValidName('A')).toBe(false)
expect(isValidName('Jo')).toBe(true)
})
})
\*/
