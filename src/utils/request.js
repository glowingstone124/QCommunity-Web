import axios from 'axios'

const instance = axios.create({
    timeout: 10000,
    headers: { 'Content-Type': 'application/json' },
})

instance.interceptors.request.use((config) => {
    const token = localStorage.getItem('token')
    if (token) {
        config.headers.Authorization = 'Bearer ' + token
    }
    return config
})

instance.interceptors.response.use(
    (response) => response.data,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token')
            window.location.href = '/login'
        }
        return Promise.reject(error)
    }
)

export function get(url, config) {
    return instance.get(url, config)
}

export function post(url, data, config) {
    return instance.post(url, data, config)
}

export default instance
