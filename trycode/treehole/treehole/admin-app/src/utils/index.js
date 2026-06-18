import dayjs from 'dayjs';

export function formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
  if (!date) return '';
  return dayjs(date).format(format);
}

export function relativeTime(date) {
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
