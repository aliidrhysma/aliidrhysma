import Taro from '@tarojs/taro';

const BASE_URL = API_BASE_URL;

class HttpRequest {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getToken(): string {
    return Taro.getStorageSync('adminToken') || '';
  }

  private async request<T>(options: any): Promise<T> {
    const { url, method = 'GET', data, header = {} } = options;
    const token = this.getToken();

    const defaultHeader: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      defaultHeader['Authorization'] = `Bearer ${token}`;
    }

    const finalHeader = { ...defaultHeader, ...header };

    try {
      const response = await Taro.request({
        url: this.baseUrl + url,
        method,
        data,
        header: finalHeader,
        timeout: 30000,
      });

      if (response.statusCode === 200 || response.data.code === 0) {
        return response.data.data;
      } else {
        if (response.data.code === 401) {
          Taro.removeStorageSync('adminToken');
          Taro.reLaunch({ url: '/pages/login/index' });
        }
        throw new Error(response.data.message || '请求失败');
      }
    } catch (error: any) {
      console.error('API 请求错误:', error);
      throw error;
    }
  }

  async get<T>(url: string, params?: any): Promise<T> {
    let queryString = '';
    if (params) {
      queryString = '?' + new URLSearchParams(params).toString();
    }
    return this.request<T>({ url: url + queryString, method: 'GET' });
  }

  async post<T>(url: string, data?: any): Promise<T> {
    return this.request<T>({ url, method: 'POST', data });
  }

  async put<T>(url: string, data?: any): Promise<T> {
    return this.request<T>({ url, method: 'PUT', data });
  }

  async delete<T>(url: string): Promise<T> {
    return this.request<T>({ url, method: 'DELETE' });
  }
}

export const http = new HttpRequest(BASE_URL);

export const adminApi = {
  auth: {
    login: (data: { username: string; password: string }) =>
      http.post('/v1/admin/login', data),
    logout: () => http.post('/v1/admin/logout'),
    profile: () => http.get('/v1/admin/profile'),
  },

  dashboard: {
    stats: () => http.get('/v1/admin/dashboard/stats'),
  },

  users: {
    list: (params?: { page?: number; limit?: number; status?: number }) =>
      http.get('/v1/admin/users/list', params),
    detail: (userId: string) => http.get(`/v1/admin/users/${userId}`),
    freeze: (userId: string) => http.post(`/v1/admin/users/${userId}/freeze`),
    unfreeze: (userId: string) => http.post(`/v1/admin/users/${userId}/unfreeze`),
    ban: (userId: string) => http.post(`/v1/admin/users/${userId}/ban`),
  },

  messages: {
    list: (params?: { page?: number; limit?: number; status?: number }) =>
      http.get('/v1/admin/messages/list', params),
    detail: (msgId: string) => http.get(`/v1/admin/messages/${msgId}`),
    approve: (msgId: string) => http.post(`/v1/admin/messages/${msgId}/approve`),
    reject: (msgId: string, reason: string) =>
      http.post(`/v1/admin/messages/${msgId}/reject`, { reason }),
    delete: (msgId: string) => http.delete(`/v1/admin/messages/${msgId}`),
  },

  reports: {
    list: (params?: { page?: number; limit?: number; status?: number }) =>
      http.get('/v1/admin/reports/list', params),
    detail: (reportId: string) => http.get(`/v1/admin/reports/${reportId}`),
    dismiss: (reportId: string, result: string) =>
      http.post(`/v1/admin/reports/${reportId}/dismiss`, { result }),
    handle: (reportId: string, action: string, result: string) =>
      http.post(`/v1/admin/reports/${reportId}/handle`, { action, result }),
  },
};

export default adminApi;
