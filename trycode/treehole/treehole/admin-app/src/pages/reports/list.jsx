import { Component } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { adminApi } from '../../services/api';
import { relativeTime } from '../../utils';
import './index.scss';

export default class ReportsList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      list: [],
      page: 1,
      limit: 20,
      total: 0,
      status: 0,
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
      const result = await adminApi.reports.list({ page, limit, status });
      this.setState({
        list: page === 1 ? result.list : [...list, ...result.list],
        total: result.total,
        hasMore: result.list.length >= limit,
      });
    } catch (error) {
      console.error('加载举报列表失败:', error);
    } finally {
      this.setState({ loading: false });
    }
  };

  switchTab = (status) => {
    this.setState({ status, page: 1, list: [] }, this.loadList);
  };

  handleDismiss = async (reportId) => {
    try {
      await adminApi.reports.dismiss(reportId, '举报不成立');
      Taro.showToast({ title: '已驳回', icon: 'success' });
      this.loadList();
    } catch (error) {
      Taro.showToast({ title: error.message || '操作失败', icon: 'none' });
    }
  };

  handleWarn = async (reportId) => {
    try {
      await adminApi.reports.handle(reportId, 'warn', '已警告被举报用户');
      Taro.showToast({ title: '已警告', icon: 'success' });
      this.loadList();
    } catch (error) {
      Taro.showToast({ title: error.message || '操作失败', icon: 'none' });
    }
  };

  handleFreeze = async (reportId) => {
    try {
      await adminApi.reports.handle(reportId, 'freeze', '已冻结被举报用户');
      Taro.showToast({ title: '已冻结', icon: 'success' });
      this.loadList();
    } catch (error) {
      Taro.showToast({ title: error.message || '操作失败', icon: 'none' });
    }
  };

  getTargetTypeText = (type) => {
    return type === 1 ? '留言' : '回复';
  };

  render() {
    const { list, status, loading, hasMore } = this.state;

    return (
      <View className="reports-list-container">
        <View className="tabs">
          <View
            className={`tab ${status === 0 ? 'active' : ''}`}
            onClick={() => this.switchTab(0)}
          >
            待处理
          </View>
          <View
            className={`tab ${status === 1 ? 'active' : ''}`}
            onClick={() => this.switchTab(1)}
          >
            已处理
          </View>
        </View>

        {list.length > 0 ? (
          <View className="list">
            {list.map((report) => (
              <View className="report-card" key={report.reportId}>
                <View className="report-header">
                  <View className="type-tag">
                    举报{this.getTargetTypeText(report.targetType)}
                  </View>
                  <Text className="time">{relativeTime(report.createdAt)}</Text>
                </View>
                <View className="report-info">
                  <View className="info-row">
                    <Text className="label">举报人:</Text>
                    <Text className="value">{report.reporterId}</Text>
                  </View>
                  <View className="info-row">
                    <Text className="label">被举报:</Text>
                    <Text className="value danger">{report.reportedUserId}</Text>
                  </View>
                  <View className="info-row">
                    <Text className="label">目标ID:</Text>
                    <Text className="value">{report.targetId}</Text>
                  </View>
                </View>
                <View className="reason">
                  <Text className="reason-label">举报原因:</Text>
                  <Text className="reason-text">{report.reason}</Text>
                </View>
                {status === 0 && (
                  <View className="actions">
                    <Button
                      className="action-btn dismiss"
                      onClick={() => this.handleDismiss(report.reportId)}
                    >
                      驳回
                    </Button>
                    <Button
                      className="action-btn warn"
                      onClick={() => this.handleWarn(report.reportId)}
                    >
                      警告
                    </Button>
                    <Button
                      className="action-btn freeze"
                      onClick={() => this.handleFreeze(report.reportId)}
                    >
                      冻结
                    </Button>
                  </View>
                )}
                {status === 1 && (
                  <View className="handle-result">
                    <Text className="result-text">处理结果: {report.handleResult}</Text>
                  </View>
                )}
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
