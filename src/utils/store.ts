import { defineStore } from 'pinia'
import {Ref, ref} from 'vue'

export const usePageStore = defineStore('page', () => {
    const currentPage: Ref<string> = ref('QCommunity')

    let suffix: string = ''

    function setPage(name: string) {
        suffix = name
        if (suffix !== '') {
            currentPage.value = "QCommunity | " + suffix
        } else {
            currentPage.value = "QCommunity"
        }
    }

    return {
        currentPage,
        setPage
    }
})
