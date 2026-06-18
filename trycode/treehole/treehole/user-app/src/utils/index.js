import Taro from '@tarojs/taro';
import dayjs from 'dayjs';

/**
 * 格式化日期
 */
export function formatDate(date: string | Date, format: string = 'YYYY-MM-DD HH:mm:ss'): string {
  if (!date) return '';
  return dayjs(date).format(format);
}

/**
 * 相对时间
 */
export function relativeTime(date: string | Date): string {
  if (!date) return '';
  const now = dayjs();
  const target = dayjs(date);
  const diff = now.diff(target, 'minute');

  if (diff < 1) return '刚刚';
  if (diff < 60) return `${diff}分钟前`;
  if (diff < 1440) return `${Math.floor(diff / 60)}小时前`;
  if (diff < 10080) return `${Math.floor(diff / 1440)}天前`;
  return target.format('YYYY-MM-DD');
}

/**
 * 显示加载提示
 */
export function showLoading(title: string = '加载中...'): void {
  Taro.showLoading({ title, mask: true });
}

/**
 * 隐藏加载提示
 */
export function hideLoading(): void {
  Taro.hideLoading();
}

/**
 * 显示成功提示
 */
export function showSuccess(title: string = '操作成功'): void {
  Taro.showToast({ title, icon: 'success', duration: 1500 });
}

/**
 * 显示错误提示
 */
export function showError(title: string = '操作失败'): void {
  Taro.showToast({ title, icon: 'none', duration: 2000 });
}

/**
 * 确认对话框
 */
export function showConfirm(
  title: string = '提示',
  content: string,
): Promise<boolean> {
  return new Promise((resolve) => {
    Taro.showModal({
      title,
      content,
      success: (res) => {
        resolve(res.confirm);
      },
    });
  });
}

/**
 * 复制文本
 */
export function copyText(text: string): Promise<void> {
  return Taro.setClipboardData({ data: text }).then(() => {
    showSuccess('已复制到剪贴板');
  });
}

/**
 * 获取用户手机号（微信小程序）
 */
export function getPhoneNumber(): Promise<any> {
  return new Promise((resolve, reject) => {
    Taro.getPhoneNumber({
      success: (res) => resolve(res),
      fail: (err) => reject(err),
    });
  });
}

/**
 * 选择图片
 */
export function chooseImage(
  count: number = 1,
  sourceType: ('album' | 'camera')[] = ['album', 'camera'],
): Promise<string[]> {
  return Taro.chooseImage({
    count,
    sourceType,
    sizeType: ['compressed'],
  }).then((res) => res.tempFilePaths);
}

/**
 * 选择视频
 */
export function chooseVideo(): Promise<{ tempFilePath: string; duration: number }> {
  return Taro.chooseVideo({
    sourceType: ['album', 'camera'],
    maxDuration: 60,
  }).then((res) => ({
    tempFilePath: res.tempFilePath,
    duration: res.duration,
  }));
}

/**
 * 预览图片
 */
export function previewImage(urls: string[], current: string): void {
  Taro.previewImage({ urls, current });
}

/**
 * 校验用户ID格式
 */
export function validateUserId(userId: string): { valid: boolean; message?: string } {
  if (!userId) {
    return { valid: false, message: '请输入用户ID' };
  }
  if (userId.length < 5) {
    return { valid: false, message: '用户ID至少5个字符' };
  }
  if (userId.length > 32) {
    return { valid: false, message: '用户ID最多32个字符' };
  }
  if (!/^[a-zA-Z0-9_]+$/.test(userId)) {
    return { valid: false, message: '用户ID只能包含字母、数字和下划线' };
  }
  return { valid: true };
}

/**
 * 校验昵称格式
 */
export function validateNickname(nickname: string): { valid: boolean; message?: string } {
  if (!nickname) {
    return { valid: false, message: '请输入昵称' };
  }
  if (nickname.length < 2) {
    return { valid: false, message: '昵称至少2个字符' };
  }
  if (nickname.length > 50) {
    return { valid: false, message: '昵称最多50个字符' };
  }
  return { valid: true };
}

/**
 * 校验密码格式
 */
export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (!password) {
    return { valid: false, message: '请输入密码' };
  }
  if (password.length < 6) {
    return { valid: false, message: '密码至少6个字符' };
  }
  if (password.length > 20) {
    return { valid: false, message: '密码最多20个字符' };
  }
  return { valid: true };
}

/**
 * 生成随机昵称
 */
export function generateRandomNickname(): string {
  const adjectives = ['快乐', '阳光', '温柔', '勇敢', '聪明', '可爱', '活泼', '善良'];
  const nouns = ['小树洞', '云朵', '星星', '月亮', '彩虹', '微风', '露珠', '阳光'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adj}${noun}`;
}

/**
 * 隐藏手机号中间4位
 */
export function maskPhone(phone: string): string {
  if (!phone || phone.length !== 11) return phone;
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
}

/**
 * 隐藏用户ID中间部分
 */
export function maskUserId(userId: string): string {
  if (!userId || userId.length <= 6) return userId;
  return userId.replace(/^(.{2}).+(.{3})$/, '$1***$2');
}
