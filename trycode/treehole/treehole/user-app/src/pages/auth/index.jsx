import { Component } from 'react';
import { View, Text, Input, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { api } from '../../services/api';
import { useAppStore } from '../../stores/appStore';
import { validateUserId, validatePassword, validateNickname, generateRandomNickname, showLoading, hideLoading, showSuccess, showError } from '../../utils';
import './index.scss';

export default class Auth extends Component {
  constructor(props) {
    super(props);
    this.state = {
      mode: 'login', // login | register
      userId: '',
      nickname: '',
      password: '',
      confirmPassword: '',
      loading: false,
    };
  }

  componentDidMount() {}

  handleInputChange = (field, e) => {
    this.setState({ [field]: e.detail.value });
  };

  toggleMode = () => {
    this.setState((prev) => ({
      mode: prev.mode === 'login' ? 'register' : 'login',
    }));
  };

  handleRandomNickname = () => {
    const nickname = generateRandomNickname();
    this.setState({ nickname });
  };

  handleLogin = async () => {
    const { userId, password } = this.state;

    // 校验
    const userIdCheck = validateUserId(userId);
    if (!userIdCheck.valid) {
      showError(userIdCheck.message);
      return;
    }

    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      showError(passwordCheck.message);
      return;
    }

    this.setState({ loading: true });
    showLoading('登录中...');

    try {
      const result = await api.auth.login({ userId, password });
      useAppStore.getState().login(result.token, result.user);
      hideLoading();
      showSuccess('登录成功');
      setTimeout(() => {
        Taro.reLaunch({ url: '/pages/home/index' });
      }, 1000);
    } catch (error) {
      hideLoading();
      showError(error.message || '登录失败');
    } finally {
      this.setState({ loading: false });
    }
  };

  handleRegister = async () => {
    const { userId, nickname, password, confirmPassword } = this.state;

    // 校验
    const userIdCheck = validateUserId(userId);
    if (!userIdCheck.valid) {
      showError(userIdCheck.message);
      return;
    }

    const nicknameCheck = validateNickname(nickname);
    if (!nicknameCheck.valid) {
      showError(nicknameCheck.message);
      return;
    }

    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      showError(passwordCheck.message);
      return;
    }

    if (password !== confirmPassword) {
      showError('两次密码输入不一致');
      return;
    }

    this.setState({ loading: true });
    showLoading('注册中...');

    try {
      const result = await api.auth.register({ userId, nickname, password });
      useAppStore.getState().login(result.token, result.user);
      hideLoading();
      showSuccess('注册成功');
      setTimeout(() => {
        Taro.reLaunch({ url: '/pages/home/index' });
      }, 1000);
    } catch (error) {
      hideLoading();
      showError(error.message || '注册失败');
    } finally {
      this.setState({ loading: false });
    }
  };

  render() {
    const { mode, userId, nickname, password, confirmPassword, loading } = this.state;

    return (
      <View className="auth-container">
        <View className="auth-header">
          <Text className="logo">🌳</Text>
          <Text className="title">{mode === 'login' ? '欢迎回来' : '创建账号'}</Text>
          <Text className="subtitle">
            {mode === 'login' ? '登录树洞，开始你的秘密之旅' : '注册树洞，说出你的秘密'}
          </Text>
        </View>

        <View className="auth-form">
          <View className="form-item">
            <Text className="label">用户ID</Text>
            <Input
              className="input"
              placeholder="请输入用户ID"
              value={userId}
              onInput={(e) => this.handleInputChange('userId', e)}
              maxlength={32}
            />
          </View>

          {mode === 'register' && (
            <View className="form-item">
              <View className="label-row">
                <Text className="label">昵称</Text>
                <Text className="random-btn" onClick={this.handleRandomNickname}>
                  随机生成
                </Text>
              </View>
              <Input
                className="input"
                placeholder="请输入昵称"
                value={nickname}
                onInput={(e) => this.handleInputChange('nickname', e)}
                maxlength={50}
              />
            </View>
          )}

          <View className="form-item">
            <Text className="label">密码</Text>
            <Input
              className="input"
              type="password"
              placeholder="请输入密码"
              value={password}
              onInput={(e) => this.handleInputChange('password', e)}
              maxlength={20}
            />
          </View>

          {mode === 'register' && (
            <View className="form-item">
              <Text className="label">确认密码</Text>
              <Input
                className="input"
                type="password"
                placeholder="请再次输入密码"
                value={confirmPassword}
                onInput={(e) => this.handleInputChange('confirmPassword', e)}
                maxlength={20}
              />
            </View>
          )}

          <Button
            className="submit-btn"
            onClick={mode === 'login' ? this.handleLogin : this.handleRegister}
            loading={loading}
            disabled={loading}
          >
            {mode === 'login' ? '登录' : '注册'}
          </Button>

          <View className="toggle-mode">
            <Text className="text">
              {mode === 'login' ? '还没有账号？' : '已有账号？'}
            </Text>
            <Text className="link" onClick={this.toggleMode}>
              {mode === 'login' ? '立即注册' : '立即登录'}
            </Text>
          </View>
        </View>
      </View>
    );
  }
}
