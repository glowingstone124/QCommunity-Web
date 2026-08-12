import { defineStore } from 'pinia'
import { ref } from 'vue'

export type NotificationType = 'success' | 'error' | 'warning' | 'info'

export interface Notification {
    id: number
    type: NotificationType
    message: string
    duration?: number
}

let nextId = 0

export const useNotificationStore = defineStore('notification', () => {
    const notifications = ref<Notification[]>([])

    function add(type: NotificationType, message: string, duration = 3000) {
        const id = ++nextId
        notifications.value.push({ id, type, message, duration })
        if (duration > 0) {
            setTimeout(() => remove(id), duration)
        }
        return id
    }

    function remove(id: number) {
        const index = notifications.value.findIndex((n) => n.id === id)
        if (index !== -1) {
            notifications.value.splice(index, 1)
        }
    }

    function clear() {
        notifications.value = []
    }

    const success = (message: string, duration?: number) => add('success', message, duration)
    const error = (message: string, duration?: number) => add('error', message, duration)
    const warning = (message: string, duration?: number) => add('warning', message, duration)
    const info = (message: string, duration?: number) => add('info', message, duration)

    return { notifications, add, remove, clear, success, error, warning, info }
})
