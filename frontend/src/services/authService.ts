import api from './api'
import { AuthResponse } from '../types'

export const authApi = {
  login: async (username: string, password: string): Promise<AuthResponse> => {
    const res = await api.post('/auth/login', { username, password })
    return res.data
  },
  logout: async () => {
    await api.post('/auth/logout')
    localStorage.clear()
  }
}
