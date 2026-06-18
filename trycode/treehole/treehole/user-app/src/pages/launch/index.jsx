import { Component } from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import './index.scss';

export default class Launch extends Component {
  componentDidMount() {
    this.checkAuthAndRedirect();
  }

  checkAuthAndRedirect = async () => {
    try {
      // 从存储中检查登录状态
      const token = Taro.getStorageSync('token');
      
      // 延迟一下显示启动页
      await new Promise(resolve => setTimeout(resolve, 1500));

      if (token) {
        // 已登录，跳转到首页
        Taro.reLaunch({ url: '/pages/home/index' });
      } else {
        // 未登录，跳转到登录页
        Taro.reLaunch({ url: '/pages/auth/index' });
      }
    } catch (error) {
      console.error('检查登录状态失败:', error);
      Taro.reLaunch({ url: '/pages/auth/index' });
    }
  };

  render() {
    return (
      <View className="launch-container">
        <View className="launch-content">
          <View className="logo-wrapper">
            <Text className="logo-text">🌳</Text>
          </View>
          <Text className="app-name">树洞</Text>
          <Text className="app-slogan">说出你的秘密</Text>
        </View>
        <View className="loading-dots">
          <View className="dot"></View>
          <View className="dot"></View>
          <View className="dot"></View>
        </View>
      </View>
    );
  }
}
