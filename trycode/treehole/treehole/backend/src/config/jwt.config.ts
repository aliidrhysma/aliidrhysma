export const jwtConfig = {
  secret: process.env.JWT_SECRET || 'treehole-secret-key-change-in-production',
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  expiresInSeconds: 7 * 24 * 60 * 60, // 7天
};

export const jwtAdminConfig = {
  secret: process.env.JWT_ADMIN_SECRET || 'treehole-admin-secret-key-change-in-production',
  expiresIn: process.env.JWT_ADMIN_EXPIRES_IN || '24h',
  expiresInSeconds: 24 * 60 * 60, // 24小时
};
