import axios from 'axios'
import { getDevTenantSlug } from '../utils/tenantDevContext'

let activeCompanyId = null
let authBootstrapComplete = false

export function setActiveCompanyId(companyId) {
  activeCompanyId = companyId
}

export function setAuthBootstrapComplete(value) {
  authBootstrapComplete = value
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

  const tenantSlug = getDevTenantSlug()

  if (tenantSlug) {
    config.headers['X-Tenant'] = tenantSlug
    config.params = {
      ...(config.params ?? {}),
      tenant: tenantSlug,
    }
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
  (error) => {
    const status = error.response?.status
    const url = error.config?.url ?? ''

    if (authBootstrapComplete && !url.includes('/login')) {
      if (status === 401) {
        window.dispatchEvent(new CustomEvent('auth:unauthorized'))
      } else if (status === 403 && url.includes('/me')) {
        window.dispatchEvent(new CustomEvent('auth:unauthorized'))
      }
    }

    return Promise.reject(error)
  },
)

export async function ensureCsrfCookie() {
  await api.get('/sanctum/csrf-cookie')
}

export default api
