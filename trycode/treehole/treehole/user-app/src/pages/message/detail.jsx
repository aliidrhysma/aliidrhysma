import { Component } from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { formatDate, relativeTime } from '../../utils';
import './index.scss';

export default class MessageDetail extends Component {
  constructor(props) {
    super(props);
    this.state = {
      message: null,
    };
  }

  componentDidMount() {
    const { msgId } = Taro.getCurrentInstance().router.params;
    // 实际应从 API 获取
    this.setState({
      message: {
        msgId,
        content: '这是一条示例留言内容...',
        contentType: 1,
        senderId: 'U_xxxxx',
        receiverId: 'U_yyyyy',
        createdAt: new Date().toISOString(),
        isAnonymous: 1,
      },
    });
  }

  render() {
    const { message } = this.state;

    if (!message) {
      return (
        <View className="loading">
          <Text>加载中...</Text>
        </View>
      );
    }

    return (
      <View className="message-detail-container">
        <View className="message-card">
          <View className="sender-info">
            <View className="avatar">
              {message.isAnonymous ? '?' : message.senderId.charAt(0)}
            </View>
            <View className="info">
              <Text className="nickname">
                {message.isAnonymous ? '匿名用户' : message.senderId}
              </Text>
              <Text className="time">{relativeTime(message.createdAt)}</Text>
            </View>
          </View>

          <View className="content">
            {message.contentType === 1 && (
              <Text className="text">{message.content}</Text>
            )}
            {message.contentType === 2 && message.mediaUrls && (
              <View className="images">
                {message.mediaUrls.map((url, index) => (
                  <Image key={index} src={url} mode="widthFix" className="image" />
                ))}
              </View>
            )}
          </View>

          <View className="actions">
            <View className="action-item">
              <Text className="icon">💬</Text>
              <Text className="label">回复</Text>
            </View>
            <View className="action-item">
              <Text className="icon">🚩</Text>
              <Text className="label">举报</Text>
            </View>
          </View>
        </View>

        <View className="replies-section">
          <Text className="section-title">回复</Text>
          <View className="empty-replies">
            <Text>暂无回复</Text>
          </View>
        </View>
      </View>
    );
  }
}
