import Taro from '@tarojs/taro';
import { getStore } from '../stores';

const BASE_URL = API_BASE_URL;

interface RequestOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: any;
  header?: Record<string, string>;
}

interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
  timestamp: string;
}

class HttpRequest {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getToken(): string {
    try {
      const store = getStore();
      return store?.token || '';
    } catch {
      return '';
    }
  }

  private async request<T>(options: RequestOptions): Promise<T> {
    const { url, method = 'GET', data, header = {} } = options;
    const token = this.getToken();

    // 添加默认 header
    const defaultHeader: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // 添加 Token
    if (token) {
      defaultHeader['Authorization'] = `Bearer ${token}`;
    }

    // 合并 header
    const finalHeader = { ...defaultHeader, ...header };

    try {
      const response = await Taro.request({
        url: this.baseUrl + url,
        method,
        data,
        header: finalHeader,
        timeout: 30000,
      });

      const result: ApiResponse<T> = response.data;

      if (result.code === 0 || response.statusCode === 200) {
        return result.data;
      } else {
        // 处理错误
        if (result.code === 401) {
          // Token 过期，跳转登录
          Taro.removeStorageSync('token');
          Taro.removeStorageSync('userInfo');
          Taro.reLaunch({ url: '/pages/auth/index' });
        }
        throw new Error(result.message || '请求失败');
      }
    } catch (error: any) {
      console.error('API 请求错误:', error);
      Taro.showToast({
        title: error.message || '网络请求失败',
        icon: 'none',
        duration: 2000,
      });
      throw error;
    }
  }

  // GET 请求
  async get<T>(url: string, params?: any, header?: Record<string, string>): Promise<T> {
    let queryString = '';
    if (params) {
      queryString = '?' + new URLSearchParams(params).toString();
    }
    return this.request<T>({
      url: url + queryString,
      method: 'GET',
      header,
    });
  }

  // POST 请求
  async post<T>(url: string, data?: any, header?: Record<string, string>): Promise<T> {
    return this.request<T>({
      url,
      method: 'POST',
      data,
      header,
    });
  }

  // PUT 请求
  async put<T>(url: string, data?: any, header?: Record<string, string>): Promise<T> {
    return this.request<T>({
      url,
      method: 'PUT',
      data,
      header,
    });
  }

  // DELETE 请求
  async delete<T>(url: string, params?: any, header?: Record<string, string>): Promise<T> {
    let queryString = '';
    if (params) {
      queryString = '?' + new URLSearchParams(params).toString();
    }
    return this.request<T>({
      url: url + queryString,
      method: 'DELETE',
      header,
    });
  }
}

export const http = new HttpRequest(BASE_URL);

// API 方法
export const api = {
  // 认证相关
  auth: {
    register: (data: { userId: string; nickname: string; password: string }) =>
      http.post('/v1/auth/register', data),
    login: (data: { userId: string; password: string }) =>
      http.post('/v1/auth/login', data),
    logout: () => http.post('/v1/auth/logout'),
    check: () => http.get('/v1/auth/check'),
  },

  // 用户相关
  user: {
    getInfo: () => http.get('/v1/user/info'),
    updateInfo: (data: { nickname?: string; avatarUrl?: string }) =>
      http.put('/v1/user/info', data),
    getHome: () => http.get('/v1/user/home'),
  },

  // 坐标相关
  coordinate: {
    getInfo: () => http.get('/v1/coordinate/info'),
    acquire: () => http.post('/v1/coordinate/acquire'),
    release: () => http.delete('/v1/coordinate/release'),
    getHot: () => http.get('/v1/coordinate/hot'),
  },

  // 留言相关
  message: {
    send: (data: {
      receiverId: string;
      coordId: string;
      contentType: number;
      content?: string;
      mediaUrls?: string[];
    }) => http.post('/v1/message/send', data),
    getDetail: (msgId: string) => http.get(`/v1/message/${msgId}`),
    markRead: (msgId: string) => http.put(`/v1/message/${msgId}/read`),
    getReceived: (page?: number, limit?: number) =>
      http.get('/v1/message/received/list', { page, limit }),
    getSent: (page?: number, limit?: number) =>
      http.get('/v1/message/sent/list', { page, limit }),
    getUnreadCount: () => http.get('/v1/message/unread/count'),
  },

  // 回复相关
  reply: {
    send: (data: {
      msgId: string;
      contentType: number;
      content?: string;
      mediaUrls?: string[];
    }) => http.post('/v1/reply/send', data),
    getList: (msgId: string) => http.get(`/v1/reply/list/${msgId}`),
    getReceived: (page?: number, limit?: number) =>
      http.get('/v1/reply/received/list', { page, limit }),
    getUnreadCount: () => http.get('/v1/reply/unread/count'),
  },

  // 举报相关
  report: {
    create: (data: {
      reportedUserId: string;
      targetType: number;
      targetId: string;
      reason: string;
    }) => http.post('/v1/report', data),
    getMy: () => http.get('/v1/report/my'),
  },
};

export default api;
