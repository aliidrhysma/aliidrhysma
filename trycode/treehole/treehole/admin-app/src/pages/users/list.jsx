import { Component } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { adminApi } from '../../services/api';
import { formatDate } from '../../utils';
import './index.scss';

export default class UsersList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      list: [],
      page: 1,
      limit: 20,
      total: 0,
      loading: false,
      hasMore: true,
    };
  }

  componentDidShow() {
    this.loadList();
  }

  loadList = async () => {
    const { page, limit, list } = this.state;
    this.setState({ loading: true });
    try {
      const result = await adminApi.users.list({ page, limit });
      this.setState({
        list: page === 1 ? result.list : [...list, ...result.list],
        total: result.total,
        hasMore: result.list.length >= limit,
      });
    } catch (error) {
      console.error('加载用户列表失败:', error);
    } finally {
      this.setState({ loading: false });
    }
  };

  loadMore = () => {
    if (!this.state.loading && this.state.hasMore) {
      this.setState((prev) => ({ page: prev.page + 1 }), this.loadList);
    }
  };

  handleFreeze = async (userId) => {
    const confirm = await Taro.showModal({
      title: '确认冻结',
      content: '确定要冻结该用户吗？',
    });
    if (confirm.confirm) {
      try {
        await adminApi.users.freeze(userId);
        Taro.showToast({ title: '已冻结', icon: 'success' });
        this.loadList();
      } catch (error) {
        Taro.showToast({ title: error.message || '操作失败', icon: 'none' });
      }
    }
  };

  handleUnfreeze = async (userId) => {
    try {
      await adminApi.users.unfreeze(userId);
      Taro.showToast({ title: '已解冻', icon: 'success' });
      this.loadList();
    } catch (error) {
      Taro.showToast({ title: error.message || '操作失败', icon: 'none' });
    }
  };

  handleBan = async (userId) => {
    const confirm = await Taro.showModal({
      title: '确认封禁',
      content: '确定要永久封禁该用户吗？',
    });
    if (confirm.confirm) {
      try {
        await adminApi.users.ban(userId);
        Taro.showToast({ title: '已封禁', icon: 'success' });
        this.loadList();
      } catch (error) {
        Taro.showToast({ title: error.message || '操作失败', icon: 'none' });
      }
    }
  };

  getStatusText = (status) => {
    switch (status) {
      case 1: return '正常';
      case 2: return '冻结';
      case 3: return '封禁';
      default: return '未知';
    }
  };

  getStatusClass = (status) => {
    switch (status) {
      case 1: return 'status-normal';
      case 2: return 'status-frozen';
      case 3: return 'status-banned';
      default: return '';
    }
  };

  render() {
    const { list, loading, hasMore } = this.state;

    return (
      <View className="users-list-container">
        <View className="header-bar">
          <Text className="title">用户管理</Text>
          <Text className="total">共 {this.state.total} 人</Text>
        </View>

        {list.length > 0 ? (
          <View className="list">
            {list.map((user) => (
              <View className="user-card" key={user.userId}>
                <View className="user-info">
                  <View className="avatar">{user.nickname?.charAt(0) || 'U'}</View>
                  <View className="info">
                    <Text className="nickname">{user.nickname}</Text>
                    <Text className="user-id">ID: {user.userId}</Text>
                    <Text className="time">注册: {formatDate(user.registerTime)}</Text>
                  </View>
                  <View className={`status ${this.getStatusClass(user.status)}`}>
                    {this.getStatusText(user.status)}
                  </View>
                </View>
                <View className="user-stats">
                  <View className="stat">
                    <Text className="value">{user.reportCount || 0}</Text>
                    <Text className="label">被举报</Text>
                  </View>
                  <View className="stat">
                    <Text className="value">{user.freezeCount || 0}</Text>
                    <Text className="label">冻结次数</Text>
                  </View>
                </View>
                <View className="actions">
                  {user.status === 1 && (
                    <Button className="action-btn freeze" onClick={() => this.handleFreeze(user.userId)}>
                      冻结
                    </Button>
                  )}
                  {user.status === 2 && (
                    <Button className="action-btn unfreeze" onClick={() => this.handleUnfreeze(user.userId)}>
                      解冻
                    </Button>
                  )}
                  {user.status !== 3 && (
                    <Button className="action-btn ban" onClick={() => this.handleBan(user.userId)}>
                      封禁
                    </Button>
                  )}
                </View>
              </View>
            ))}
            {hasMore && (
              <View className="load-more" onClick={this.loadMore}>
                <Text>{loading ? '加载中...' : '加载更多'}</Text>
              </View>
            )}
          </View>
        ) : (
          <View className="empty">
            <Text>暂无用户数据</Text>
          </View>
        )}
      </View>
    );
  }
}
