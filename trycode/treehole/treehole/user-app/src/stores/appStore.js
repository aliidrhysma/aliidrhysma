import { create } from 'zustand';
import Taro from '@tarojs/taro';

interface UserInfo {
  userId: string;
  nickname: string;
  avatarUrl?: string;
  status?: number;
  registerTime?: string;
  lastLoginTime?: string;
}

interface CoordinateInfo {
  coordId: string;
  heatScore: number;
  occupiedAt?: string;
}

interface AppState {
  // 认证状态
  token: string;
  isAuthenticated: boolean;

  // 用户信息
  userInfo: UserInfo | null;
  coordinate: CoordinateInfo | null;

  // 统计数据
  unreadMessageCount: number;
  unreadReplyCount: number;

  // Actions
  setToken: (token: string) => void;
  setUserInfo: (userInfo: UserInfo | null) => void;
  setCoordinate: (coordinate: CoordinateInfo | null) => void;
  setUnreadCounts: (messageCount: number, replyCount: number) => void;
  login: (token: string, userInfo: UserInfo) => void;
  logout: () => void;
  initFromStorage: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // 初始状态
  token: '',
  isAuthenticated: false,
  userInfo: null,
  coordinate: null,
  unreadMessageCount: 0,
  unreadReplyCount: 0,

  // 设置 Token
  setToken: (token: string) => {
    if (token) {
      Taro.setStorageSync('token', token);
    } else {
      Taro.removeStorageSync('token');
    }
    set({ token, isAuthenticated: !!token });
  },

  // 设置用户信息
  setUserInfo: (userInfo: UserInfo | null) => {
    if (userInfo) {
      Taro.setStorageSync('userInfo', userInfo);
    } else {
      Taro.removeStorageSync('userInfo');
    }
    set({ userInfo });
  },

  // 设置坐标信息
  setCoordinate: (coordinate: CoordinateInfo | null) => {
    set({ coordinate });
  },

  // 设置未读计数
  setUnreadCounts: (messageCount: number, replyCount: number) => {
    set({
      unreadMessageCount: messageCount,
      unreadReplyCount: replyCount,
    });
  },

  // 登录
  login: (token: string, userInfo: UserInfo) => {
    Taro.setStorageSync('token', token);
    Taro.setStorageSync('userInfo', userInfo);
    set({
      token,
      isAuthenticated: true,
      userInfo,
    });
  },

  // 登出
  logout: () => {
    Taro.removeStorageSync('token');
    Taro.removeStorageSync('userInfo');
    set({
      token: '',
      isAuthenticated: false,
      userInfo: null,
      coordinate: null,
      unreadMessageCount: 0,
      unreadReplyCount: 0,
    });
  },

  // 从存储初始化
  initFromStorage: () => {
    const token = Taro.getStorageSync('token') || '';
    const userInfo = Taro.getStorageSync('userInfo') || null;
    set({
      token,
      isAuthenticated: !!token,
      userInfo,
    });
  },
}));

// 导出获取 store 的方法（供 API 服务使用）
export const getStore = () => {
  const state = useAppStore.getState();
  return {
    token: state.token,
    userInfo: state.userInfo,
  };
};

export default useAppStore;
