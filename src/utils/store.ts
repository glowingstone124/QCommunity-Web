import { defineStore } from 'pinia'
import {Ref, ref} from 'vue'

export const usePageStore = defineStore('page', () => {
    const currentPage: Ref<string> = ref('QHub')

    let suffix: string = ''

    function setPage(name: string) {
        suffix = name
        if (suffix !== '') {
            currentPage.value = "QHub | " + suffix
        } else {
            currentPage.value = "QHub"
        }
    }

    return {
        currentPage,
        setPage
    }
})
