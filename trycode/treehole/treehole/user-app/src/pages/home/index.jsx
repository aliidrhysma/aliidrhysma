import { Component } from 'react';
import { View, Text, Button, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useAppStore } from '../../stores/appStore';
import { api } from '../../services/api';
import { showLoading, hideLoading, showError } from '../../utils';
import './index.scss';

export default class Home extends Component {
  constructor(props) {
    super(props);
    this.state = {
      coordinate: null,
      hotCoordinates: [],
      loading: false,
    };
  }

  componentDidShow() {
    this.loadData();
  }

  loadData = async () => {
    showLoading('加载中...');
    try {
      // 获取坐标信息
      const coordInfo = await api.coordinate.getInfo();
      this.setState({ coordinate: coordInfo });

      // 获取热门坐标
      const hotCoords = await api.coordinate.getHot();
      this.setState({ hotCoordinates: hotCoords || [] });
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      hideLoading();
    }
  };

  handleAcquireCoordinate = async () => {
    showLoading('获取坐标中...');
    try {
      const coord = await api.coordinate.acquire();
      this.setState({ coordinate: coord });
    } catch (error) {
      showError(error.message || '获取坐标失败');
    } finally {
      hideLoading();
    }
  };

  handleSendMessage = () => {
    const { coordinate } = this.state;
    if (!coordinate) {
      showError('请先获取坐标');
      return;
    }
    Taro.navigateTo({ url: '/pages/message/edit?coordId=' + coordinate.coordId });
  };

  handleViewMessages = () => {
    Taro.navigateTo({ url: '/pages/message/list' });
  };

  handleGoProfile = () => {
    Taro.navigateTo({ url: '/pages/profile/index' });
  };

  handleLogout = async () => {
    try {
      await api.auth.logout();
      useAppStore.getState().logout();
      Taro.reLaunch({ url: '/pages/auth/index' });
    } catch (error) {
      console.error('登出失败:', error);
    }
  };

  render() {
    const { userInfo } = useAppStore;
    const { coordinate, hotCoordinates } = this.state;

    return (
      <View className="home-container">
        {/* 顶部用户信息 */}
        <View className="header">
          <View className="user-info" onClick={this.handleGoProfile}>
            <View className="avatar">
              {userInfo?.nickname?.charAt(0) || 'U'}
            </View>
            <View className="info">
              <Text className="nickname">{userInfo?.nickname || '用户'}</Text>
              <Text className="user-id">ID: {userInfo?.userId || '-'}</Text>
            </View>
          </View>
          <View className="settings-btn" onClick={() => Taro.navigateTo({ url: '/pages/settings/index' })}>
            <Text className="icon">⚙️</Text>
          </View>
        </View>

        {/* 我的坐标 */}
        <View className="my-coordinate card">
          <View className="section-header">
            <Text className="title">我的坐标</Text>
          </View>
          {coordinate ? (
            <View className="coord-info">
              <View className="coord-id">📍 {coordinate.coordId}</View>
              <View className="coord-stats">
                <View className="stat-item">
                  <Text className="stat-value">{coordinate.heatScore}</Text>
                  <Text className="stat-label">热度</Text>
                </View>
              </View>
              <Button className="send-btn" onClick={this.handleSendMessage}>
                发送匿名留言
              </Button>
            </View>
          ) : (
            <View className="no-coordinate">
              <Text className="tips">还没有属于自己的坐标</Text>
              <Button className="acquire-btn" onClick={this.handleAcquireCoordinate}>
                立即获取
              </Button>
            </View>
          )}
        </View>

        {/* 功能入口 */}
        <View className="action-cards">
          <View className="action-card" onClick={this.handleViewMessages}>
            <Text className="icon">💬</Text>
            <Text className="label">收到的留言</Text>
          </View>
          <View className="action-card" onClick={this.handleGoProfile}>
            <Text className="icon">👤</Text>
            <Text className="label">个人主页</Text>
          </View>
        </View>

        {/* 热门坐标 */}
        <View className="hot-coordinates card">
          <View className="section-header">
            <Text className="title">🔥 热门坐标</Text>
          </View>
          {hotCoordinates.length > 0 ? (
            <View className="coord-list">
              {hotCoordinates.slice(0, 5).map((coord, index) => (
                <View className="coord-item" key={coord.coordId}>
                  <View className="rank">{index + 1}</View>
                  <View className="coord-detail">
                    <Text className="coord-id">{coord.coordId}</Text>
                    <Text className="heat">热度 {coord.heatScore}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View className="empty">
              <Text>暂无热门坐标</Text>
            </View>
          )}
        </View>

        {/* 底部导航 */}
        <View className="bottom-nav">
          <View className="nav-item active">
            <Text className="icon">🏠</Text>
            <Text className="label">首页</Text>
          </View>
          <View className="nav-item" onClick={this.handleViewMessages}>
            <Text className="icon">💬</Text>
            <Text className="label">留言</Text>
          </View>
          <View className="nav-item" onClick={this.handleGoProfile}>
            <Text className="icon">👤</Text>
            <Text className="label">我的</Text>
          </View>
        </View>
      </View>
    );
  }
}
