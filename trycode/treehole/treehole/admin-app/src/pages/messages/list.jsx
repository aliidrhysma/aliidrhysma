import { Component } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { adminApi } from '../../services/api';
import { formatDate, relativeTime } from '../../utils';
import './index.scss';

export default class MessagesList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      list: [],
      page: 1,
      limit: 20,
      total: 0,
      status: 0, // 0待审核 1已通过 2已拒绝
      loading: false,
      hasMore: true,
    };
  }

  componentDidShow() {
    this.loadList();
  }

  loadList = async () => {
    const { page, limit, status, list } = this.state;
    this.setState({ loading: true });
    try {
      const result = await adminApi.messages.list({ page, limit, status });
      this.setState({
        list: page === 1 ? result.list : [...list, ...result.list],
        total: result.total,
        hasMore: result.list.length >= limit,
      });
    } catch (error) {
      console.error('加载留言列表失败:', error);
    } finally {
      this.setState({ loading: false });
    }
  };

  switchTab = (status) => {
    this.setState({ status, page: 1, list: [] }, this.loadList);
  };

  handleApprove = async (msgId) => {
    try {
      await adminApi.messages.approve(msgId);
      Taro.showToast({ title: '已通过', icon: 'success' });
      this.loadList();
    } catch (error) {
      Taro.showToast({ title: error.message || '操作失败', icon: 'none' });
    }
  };

  handleReject = async (msgId) => {
    const { value } = await Taro.showModal({
      title: '拒绝留言',
      editable: true,
      placeholderText: '请输入拒绝原因',
    });
    if (value) {
      try {
        await adminApi.messages.reject(msgId, value);
        Taro.showToast({ title: '已拒绝', icon: 'success' });
        this.loadList();
      } catch (error) {
        Taro.showToast({ title: error.message || '操作失败', icon: 'none' });
      }
    }
  };

  handleDelete = async (msgId) => {
    const confirm = await Taro.showModal({
      title: '确认删除',
      content: '确定要删除该留言吗？',
    });
    if (confirm.confirm) {
      try {
        await adminApi.messages.delete(msgId);
        Taro.showToast({ title: '已删除', icon: 'success' });
        this.loadList();
      } catch (error) {
        Taro.showToast({ title: error.message || '操作失败', icon: 'none' });
      }
    }
  };

  render() {
    const { list, status, loading, hasMore } = this.state;

    return (
      <View className="messages-list-container">
        <View className="tabs">
          <View
            className={`tab ${status === 0 ? 'active' : ''}`}
            onClick={() => this.switchTab(0)}
          >
            待审核
          </View>
          <View
            className={`tab ${status === 1 ? 'active' : ''}`}
            onClick={() => this.switchTab(1)}
          >
            已通过
          </View>
          <View
            className={`tab ${status === 2 ? 'active' : ''}`}
            onClick={() => this.switchTab(2)}
          >
            已拒绝
          </View>
        </View>

        {list.length > 0 ? (
          <View className="list">
            {list.map((msg) => (
              <View className="message-card" key={msg.msgId}>
                <View className="msg-header">
                  <Text className="sender">发送者: {msg.senderId}</Text>
                  <Text className="coord">坐标: {msg.coordId}</Text>
                </View>
                <View className="msg-content">
                  <Text>{msg.content || '[多媒体内容]'}</Text>
                </View>
                <View className="msg-footer">
                  <Text className="time">{relativeTime(msg.createdAt)}</Text>
                  {status === 0 && (
                    <View className="actions">
                      <Button
                        className="action-btn approve"
                        onClick={() => this.handleApprove(msg.msgId)}
                      >
                        通过
                      </Button>
                      <Button
                        className="action-btn reject"
                        onClick={() => this.handleReject(msg.msgId)}
                      >
                        拒绝
                      </Button>
                    </View>
                  )}
                  {status === 1 && (
                    <Button
                      className="action-btn delete"
                      onClick={() => this.handleDelete(msg.msgId)}
                    >
                      删除
                    </Button>
                  )}
                </View>
              </View>
            ))}
            {hasMore && (
              <View className="load-more" onClick={() => this.loadMore()}>
                <Text>{loading ? '加载中...' : '加载更多'}</Text>
              </View>
            )}
          </View>
        ) : (
          <View className="empty">
            <Text>暂无数据</Text>
          </View>
        )}
      </View>
    );
  }
}
