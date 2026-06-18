import { Component } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { adminApi } from '../../services/api';
import './index.scss';

export default class Dashboard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      stats: {
        users: { total: 0, today: 0, active: 0 },
        messages: { total: 0, today: 0, pending: 0 },
        reports: { total: 0, pending: 0 },
      },
      loading: false,
    };
  }

  componentDidShow() {
    this.loadStats();
  }

  loadStats = async () => {
    this.setState({ loading: true });
    try {
      const stats = await adminApi.dashboard.stats();
      this.setState({ stats });
    } catch (error) {
      console.error('加载统计数据失败:', error);
    } finally {
      this.setState({ loading: false });
    }
  };

  goToUsers = () => {
    Taro.navigateTo({ url: '/pages/users/list' });
  };

  goToMessages = () => {
    Taro.navigateTo({ url: '/pages/messages/list' });
  };

  goToReports = () => {
    Taro.navigateTo({ url: '/pages/reports/list' });
  };

  handleLogout = async () => {
    try {
      await adminApi.auth.logout();
    } catch (e) {}
    Taro.removeStorageSync('adminToken');
    Taro.removeStorageSync('adminInfo');
    Taro.reLaunch({ url: '/pages/login/index' });
  };

  render() {
    const { stats } = this.state;
    const adminInfo = Taro.getStorageSync('adminInfo') || {};

    return (
      <View className="dashboard-container">
        <View className="header">
          <View className="header-left">
            <Text className="title">数据看板</Text>
            <Text className="admin-name">管理员: {adminInfo.username}</Text>
          </View>
          <View className="logout-btn" onClick={this.handleLogout}>
            <Text>退出</Text>
          </View>
        </View>

        <View className="stats-grid">
          <View className="stat-card" onClick={this.goToUsers}>
            <View className="stat-icon users">👥</View>
            <View className="stat-info">
              <Text className="stat-value">{stats.users.total}</Text>
              <Text className="stat-label">用户总数</Text>
              <Text className="stat-today">今日 +{stats.users.today}</Text>
            </View>
          </View>

          <View className="stat-card" onClick={this.goToMessages}>
            <View className="stat-icon messages">💬</View>
            <View className="stat-info">
              <Text className="stat-value">{stats.messages.total}</Text>
              <Text className="stat-label">留言总数</Text>
              <Text className="stat-today">待审核 {stats.messages.pending}</Text>
            </View>
          </View>

          <View className="stat-card warning" onClick={this.goToReports}>
            <View className="stat-icon reports">🚩</View>
            <View className="stat-info">
              <Text className="stat-value">{stats.reports.total}</Text>
              <Text className="stat-label">举报总数</Text>
              <Text className="stat-today pending">待处理 {stats.reports.pending}</Text>
            </View>
          </View>
        </View>

        <View className="quick-actions">
          <Text className="section-title">快捷操作</Text>
          <View className="action-list">
            <View className="action-item" onClick={this.goToMessages}>
              <Text className="icon">📝</Text>
              <Text className="label">审核留言</Text>
            </View>
            <View className="action-item" onClick={this.goToReports}>
              <Text className="icon">⚠️</Text>
              <Text className="label">处理举报</Text>
            </View>
            <View className="action-item" onClick={this.goToUsers}>
              <Text className="icon">👤</Text>
              <Text className="label">用户管理</Text>
            </View>
          </View>
        </View>
      </View>
    );
  }
}
