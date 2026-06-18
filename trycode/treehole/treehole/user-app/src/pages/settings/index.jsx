import { Component } from 'react';
import { View, Text, Input, Button, Switch } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useAppStore } from '../../stores/appStore';
import { api } from '../../services/api';
import { showLoading, hideLoading, showSuccess, showError, showConfirm, validateNickname } from '../../utils';
import './index.scss';

export default class Settings extends Component {
  constructor(props) {
    super(props);
    this.state = {
      mode: 'view',
      nickname: '',
      anonymousMode: true,
      loading: false,
    };
  }

  componentDidMount() {
    const { mode } = Taro.getCurrentInstance().router.params;
    if (mode === 'edit') {
      this.setState({ mode: 'edit', nickname: useAppStore.getState().userInfo?.nickname || '' });
    }
  }

  handleNicknameChange = (e) => {
    this.setState({ nickname: e.detail.value });
  };

  handleSaveNickname = async () => {
    const { nickname } = this.state;
    const check = validateNickname(nickname);
    if (!check.valid) {
      showError(check.message);
      return;
    }

    showLoading('保存中...');
    try {
      await api.user.updateInfo({ nickname });
      useAppStore.getState().setUserInfo({
        ...useAppStore.getState().userInfo,
        nickname,
      });
      hideLoading();
      showSuccess('保存成功');
      this.setState({ mode: 'view' });
    } catch (error) {
      hideLoading();
      showError(error.message || '保存失败');
    }
  };

  handleLogout = async () => {
    const confirm = await showConfirm('确认登出', '确定要退出登录吗？');
    if (confirm) {
      try {
        await api.auth.logout();
        useAppStore.getState().logout();
        Taro.reLaunch({ url: '/pages/auth/index' });
      } catch (error) {
        console.error('登出失败:', error);
      }
    }
  };

  handleReleaseCoordinate = async () => {
    const confirm = await showConfirm('释放坐标', '确定要释放当前坐标吗？释放后其他人可以占用。');
    if (confirm) {
      showLoading('释放中...');
      try {
        await api.coordinate.release();
        useAppStore.getState().setCoordinate(null);
        hideLoading();
        showSuccess('已释放坐标');
      } catch (error) {
        hideLoading();
        showError(error.message || '释放失败');
      }
    }
  };

  render() {
    const { mode, nickname, anonymousMode } = this.state;
    const { userInfo } = useAppStore;

    return (
      <View className="settings-container">
        {mode === 'view' ? (
          <>
            <View className="section">
              <View className="menu-item" onClick={() => this.setState({ mode: 'edit', nickname: userInfo?.nickname || '' })}>
                <Text className="label">修改昵称</Text>
                <Text className="value">{userInfo?.nickname}</Text>
                <Text className="arrow">›</Text>
              </View>
            </View>

            <View className="section">
              <Text className="section-title">隐私设置</Text>
              <View className="menu-item">
                <Text className="label">匿名模式</Text>
                <Switch
                  checked={anonymousMode}
                  onChange={(e) => this.setState({ anonymousMode: e.detail.value })}
                  color="var(--theme-color)"
                />
              </View>
            </View>

            <View className="section">
              <Text className="section-title">坐标管理</Text>
              <View className="menu-item danger" onClick={this.handleReleaseCoordinate}>
                <Text className="label">释放坐标</Text>
                <Text className="arrow">›</Text>
              </View>
            </View>

            <View className="section">
              <Text className="section-title">其他</Text>
              <View className="menu-item">
                <Text className="label">关于我们</Text>
                <Text className="arrow">›</Text>
              </View>
              <View className="menu-item">
                <Text className="label">帮助与反馈</Text>
                <Text className="arrow">›</Text>
              </View>
              <View className="menu-item">
                <Text className="label">隐私政策</Text>
                <Text className="arrow">›</Text>
              </View>
            </View>

            <Button className="logout-btn" onClick={this.handleLogout}>
              退出登录
            </Button>

            <Text className="version">树洞 v1.0.0</Text>
          </>
        ) : (
          <>
            <View className="edit-section">
              <Text className="input-label">昵称</Text>
              <Input
                className="nickname-input"
                value={nickname}
                onInput={this.handleNicknameChange}
                placeholder="请输入昵称"
                maxlength={50}
              />
            </View>
            <View className="edit-actions">
              <Button className="cancel-btn" onClick={() => this.setState({ mode: 'view' })}>
                取消
              </Button>
              <Button className="save-btn" onClick={this.handleSaveNickname}>
                保存
              </Button>
            </View>
          </>
        )}
      </View>
    );
  }
}
