import { Component } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useAppStore } from '../../stores/appStore';
import { api } from '../../services/api';
import { formatDate } from '../../utils';
import './index.scss';

export default class Profile extends Component {
  constructor(props) {
    super(props);
    this.state = {
      stats: {
        sentCount: 0,
        receivedCount: 0,
        replyCount: 0,
      },
    };
  }

  componentDidShow() {
    this.loadStats();
  }

  loadStats = async () => {
    try {
      const homeData = await api.user.getHome();
      this.setState({
        stats: homeData.stats || {
          sentCount: 0,
          receivedCount: 0,
          replyCount: 0,
        },
      });
    } catch (error) {
      console.error('加载统计数据失败:', error);
    }
  };

  handleEditProfile = () => {
    Taro.navigateTo({ url: '/pages/settings/index?mode=edit' });
  };

  render() {
    const { userInfo, coordinate } = useAppStore;

    return (
      <View className="profile-container">
        <View className="profile-header">
          <View className="avatar">
            {userInfo?.nickname?.charAt(0) || 'U'}
          </View>
          <Text className="nickname">{userInfo?.nickname || '用户'}</Text>
          <Text className="user-id">ID: {userInfo?.userId || '-'}</Text>
          <Button className="edit-btn" onClick={this.handleEditProfile}>
            编辑资料
          </Button>
        </View>

        {coordinate && (
          <View className="coordinate-card card">
            <Text className="card-title">📍 我的坐标</Text>
            <Text className="coord-id">{coordinate.coordId}</Text>
            <View className="coord-stats">
              <View className="stat-item">
                <Text className="value">{coordinate.heatScore}</Text>
                <Text className="label">热度</Text>
              </View>
            </View>
          </View>
        )}

        <View className="stats-card card">
          <Text className="card-title">📊 数据统计</Text>
          <View className="stats-grid">
            <View className="stat-item">
              <Text className="value">{this.state.stats.sentCount}</Text>
              <Text className="label">发出的留言</Text>
            </View>
            <View className="stat-item">
              <Text className="value">{this.state.stats.receivedCount}</Text>
              <Text className="label">收到的留言</Text>
            </View>
            <View className="stat-item">
              <Text className="value">{this.state.stats.replyCount}</Text>
              <Text className="label">收到的回复</Text>
            </View>
          </View>
        </View>

        <View className="info-card card">
          <Text className="card-title">📝 账号信息</Text>
          <View className="info-item">
            <Text className="label">注册时间</Text>
            <Text className="value">{formatDate(userInfo?.registerTime)}</Text>
          </View>
          <View className="info-item">
            <Text className="label">最后登录</Text>
            <Text className="value">{formatDate(userInfo?.lastLoginTime)}</Text>
          </View>
        </View>
      </View>
    );
  }
}
