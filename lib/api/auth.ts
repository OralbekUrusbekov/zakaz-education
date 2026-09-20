import type { TokenResponse, User } from '../types'
import { apiClient, setToken } from './client'

export async function login(email: string, password: string): Promise<User> {
  const res = await apiClient<TokenResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  setToken(res.access_token)
  return res.user
}

export const me = () => apiClient<User>('/auth/me')

export const logout = () => setToken(null)
