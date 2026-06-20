import axios from 'axios'

let activeCompanyId = null

export function setActiveCompanyId(companyId) {
  activeCompanyId = companyId
}

function getCookie(name) {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '',
  withCredentials: true,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
})

api.interceptors.request.use(async (config) => {
  if (activeCompanyId) {
    config.headers['X-Company-Id'] = activeCompanyId
  }

  const method = config.method?.toLowerCase()
  if (['post', 'put', 'patch', 'delete'].includes(method)) {
    let token = getCookie('XSRF-TOKEN')

    if (!token) {
      await api.get('/sanctum/csrf-cookie')
      token = getCookie('XSRF-TOKEN')
    }

    if (token) {
      config.headers['X-XSRF-TOKEN'] = token
    }
  }

  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error),
)

export async function ensureCsrfCookie() {
  await api.get('/sanctum/csrf-cookie')
}

export default api
