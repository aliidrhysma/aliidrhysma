export const systemConfig = {
  // 腾讯云 COS 配置
  cos: {
    SecretId: process.env.COS_SECRET_ID || '',
    SecretKey: process.env.COS_SECRET_KEY || '',
    Bucket: process.env.COS_BUCKET || 'treehole-1250000000',
    Region: process.env.COS_REGION || 'ap-guangzhou',
    appId: process.env.COS_APPID || '1250000000',
  },

  // 文件上传配置
  upload: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'],
    path: './uploads',
  },

  // 用户限制配置
  user: {
    dailySendLimit: 3,      // 每日发送留言限制
    dailyReceiveLimit: 10,   // 每日接收留言限制
    messageExpireHours: 24,  // 留言过期时间（小时）
    freezeAfterReportCount: 5, // 被举报多少次后冻结
  },

  // IP限制配置
  ip: {
    dailyRegisterLimit: 3,    // 每日同一IP注册限制
    loginFailLockCount: 5,     // 登录失败锁定次数
    loginFailLockMinutes: 30,  // 登录失败锁定时长（分钟）
  },
};
