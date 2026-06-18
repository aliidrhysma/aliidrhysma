import { Component } from 'react';
import { View, Text, Input, Textarea, Button, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { api } from '../../services/api';
import { showLoading, hideLoading, showSuccess, showError, chooseImage } from '../../utils';
import './index.scss';

export default class MessageEdit extends Component {
  constructor(props) {
    super(props);
    this.state = {
      receiverId: '',
      contentType: 1, // 1文本 2图片 3视频
      content: '',
      mediaUrls: [],
      loading: false,
    };
  }

  componentDidMount() {
    const { coordId, receiverId } = Taro.getCurrentInstance().router.params;
    if (receiverId) {
      this.setState({ receiverId });
    }
  }

  handleContentChange = (e) => {
    this.setState({ content: e.detail.value });
  };

  handleSelectImage = async () => {
    try {
      const images = await chooseImage(9 - this.state.mediaUrls.length);
      this.setState({
        mediaUrls: [...this.state.mediaUrls, ...images],
        contentType: 2,
      });
    } catch (error) {
      console.error('选择图片失败:', error);
    }
  };

  handleRemoveImage = (index) => {
    const { mediaUrls } = this.state;
    mediaUrls.splice(index, 1);
    this.setState({
      mediaUrls,
      contentType: mediaUrls.length > 0 ? 2 : 1,
    });
  };

  handleSubmit = async () => {
    const { receiverId, content, contentType, mediaUrls } = this.state;

    if (!receiverId) {
      showError('请输入接收者ID');
      return;
    }

    if (contentType === 1 && !content.trim()) {
      showError('请输入留言内容');
      return;
    }

    if (contentType === 2 && mediaUrls.length === 0) {
      showError('请选择图片');
      return;
    }

    showLoading('发送中...');
    this.setState({ loading: true });

    try {
      await api.message.send({
        receiverId,
        coordId: '', // 由后端获取
        contentType,
        content: contentType === 1 ? content : undefined,
        mediaUrls: contentType === 2 ? mediaUrls : undefined,
      });
      hideLoading();
      showSuccess('发送成功');
      setTimeout(() => {
        Taro.navigateBack();
      }, 1500);
    } catch (error) {
      hideLoading();
      showError(error.message || '发送失败');
    } finally {
      this.setState({ loading: false });
    }
  };

  render() {
    const { receiverId, content, mediaUrls, loading } = this.state;

    return (
      <View className="message-edit-container">
        <View className="form-section">
          <Text className="section-title">发送给</Text>
          <Input
            className="receiver-input"
            placeholder="输入对方用户ID"
            value={receiverId}
            onInput={(e) => this.setState({ receiverId: e.detail.value })}
            maxlength={32}
          />
        </View>

        <View className="form-section">
          <Text className="section-title">内容类型</Text>
          <View className="type-tabs">
            <View
              className={`tab ${this.state.contentType === 1 ? 'active' : ''}`}
              onClick={() => this.setState({ contentType: 1 })}
            >
              💬 文字
            </View>
            <View
              className={`tab ${this.state.contentType === 2 ? 'active' : ''}`}
              onClick={() => this.setState({ contentType: 2 })}
            >
              🖼️ 图片
            </View>
          </View>
        </View>

        <View className="form-section">
          <Text className="section-title">留言内容</Text>
          {this.state.contentType === 1 ? (
            <Textarea
              className="content-textarea"
              placeholder="在这里写下你想说的话..."
              value={content}
              onInput={this.handleContentChange}
              maxlength={2000}
              autoHeight
            />
          ) : (
            <View className="image-grid">
              {mediaUrls.map((url, index) => (
                <View className="image-item" key={index}>
                  <Image src={url} mode="aspectFill" className="image" />
                  <View className="remove-btn" onClick={() => this.handleRemoveImage(index)}>
                    ✕
                  </View>
                </View>
              ))}
              {mediaUrls.length < 9 && (
                <View className="add-image" onClick={this.handleSelectImage}>
                  <Text className="plus">+</Text>
                  <Text className="tips">添加图片</Text>
                </View>
              )}
            </View>
          )}
        </View>

        <View className="tips-box">
          <Text className="tips-title">💡 温馨提示</Text>
          <Text className="tips-content">
            • 留言将在24小时后过期
          </Text>
          <Text className="tips-content">
            • 对方可以在个人主页查看您的留言
          </Text>
          <Text className="tips-content">
            • 留言默认匿名发送
          </Text>
        </View>

        <Button
          className="submit-btn"
          onClick={this.handleSubmit}
          loading={loading}
          disabled={loading}
        >
          发送留言
        </Button>
      </View>
    );
  }
}
