import { computed } from "vue";
import { useAuthStores } from "../stores/Auth";

export function usePermission() {
    const auth = useAuthStores()

    const can = (permission)=> {
        return auth.user?.permissions?.includes(permission) 
    }

    const hasRole = (role) => {
        return auth.user?.role == role
    }

    const canAny = (permission) => {
        return permission.some(permission => 
            auth.user?.permission.includes(permission)
        )
    }


    const canAll = (permission) => {
        return permission.every(permission => 
            auth.user?.permission.includes(permission)
        )
    }

    return{
        can, 
        canAny,
        canAll,
        hasRole,
        user: computed(() => auth.user)
    }
}