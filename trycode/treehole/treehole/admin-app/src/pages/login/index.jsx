import { Component } from 'react';
import { View, Text, Input, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { adminApi } from '../../services/api';
import './index.scss';

export default class Login extends Component {
  constructor(props) {
    super(props);
    this.state = {
      username: '',
      password: '',
      loading: false,
    };
  }

  componentDidMount() {
    // 检查是否已登录
    const token = Taro.getStorageSync('adminToken');
    if (token) {
      Taro.reLaunch({ url: '/pages/dashboard/index' });
    }
  }

  handleInputChange = (field, e) => {
    this.setState({ [field]: e.detail.value });
  };

  handleLogin = async () => {
    const { username, password } = this.state;

    if (!username || !password) {
      Taro.showToast({ title: '请输入用户名和密码', icon: 'none' });
      return;
    }

    this.setState({ loading: true });
    Taro.showLoading({ title: '登录中...' });

    try {
      const result = await adminApi.auth.login({ username, password });
      Taro.setStorageSync('adminToken', result.token);
      Taro.setStorageSync('adminInfo', result.admin);
      Taro.hideLoading();
      Taro.showToast({ title: '登录成功', icon: 'success' });
      setTimeout(() => {
        Taro.reLaunch({ url: '/pages/dashboard/index' });
      }, 1000);
    } catch (error: any) {
      Taro.hideLoading();
      Taro.showToast({ title: error.message || '登录失败', icon: 'none' });
    } finally {
      this.setState({ loading: false });
    }
  };

  render() {
    const { username, password, loading } = this.state;

    return (
      <View className="login-container">
        <View className="login-header">
          <Text className="logo">🌳</Text>
          <Text className="title">树洞管理系统</Text>
          <Text className="subtitle">Treehole Admin</Text>
        </View>

        <View className="login-form">
          <View className="form-item">
            <Text className="label">用户名</Text>
            <Input
              className="input"
              placeholder="请输入管理员用户名"
              value={username}
              onInput={(e) => this.handleInputChange('username', e)}
            />
          </View>

          <View className="form-item">
            <Text className="label">密码</Text>
            <Input
              className="input"
              type="password"
              placeholder="请输入密码"
              value={password}
              onInput={(e) => this.handleInputChange('password', e)}
            />
          </View>

          <Button
            className="login-btn"
            onClick={this.handleLogin}
            loading={loading}
            disabled={loading}
          >
            登录
          </Button>
        </View>

        <Text className="copyright">© 2024 树洞系统 版权所有</Text>
      </View>
    );
  }
}
