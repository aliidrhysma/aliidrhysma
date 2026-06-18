/**
 * 生成唯一ID
 * 格式：类型前缀 + 时间戳 + 随机数
 */
export class IdGenerator {
  // 用户ID: U_xxxxxxxx
  static generateUserId(): string {
    return `U_${Date.now().toString(36)}${this.randomStr(6)}`;
  }

  // 坐标ID: C_0000001
  static generateCoordId(): string {
    return `C_${this.randomNum(7)}`;
  }

  // 留言ID: M_xxxxxxxx
  static generateMsgId(): string {
    return `M_${Date.now().toString(36)}${this.randomStr(6)}`;
  }

  // 回复ID: R_xxxxxxxx
  static generateReplyId(): string {
    return `R_${Date.now().toString(36)}${this.randomStr(6)}`;
  }

  // 举报ID: B_xxxxxxxx
  static generateReportId(): string {
    return `B_${Date.now().toString(36)}${this.randomStr(6)}`;
  }

  // 管理员ID: A_xxxxxx
  static generateAdminId(): string {
    return `A_${Date.now().toString(36)}${this.randomStr(4)}`;
  }

  private static randomStr(length: number): string {
    const chars = '0123456789abcdefghijklmnopqrstuvwxyz';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private static randomNum(length: number): string {
    const chars = '0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}
