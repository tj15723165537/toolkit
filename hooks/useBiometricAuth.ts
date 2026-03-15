import * as LocalAuthentication from 'expo-local-authentication';

export function useBiometricAuth() {
  /**
   * 检查生物识别是否可用
   */
  const isAvailable = async (): Promise<boolean> => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) return false;

      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      return isEnrolled;
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      return false;
    }
  };

  /**
   * 获取生物识别类型
   */
  const getBiometricType = async (): Promise<string | null> => {
    try {
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        return 'Face ID';
      }
      if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        return '指纹';
      }
      if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        return '虹膜';
      }
      return null;
    } catch (error) {
      console.error('Error getting biometric type:', error);
      return null;
    }
  };

  /**
   * 执行生物识别验证
   */
  const authenticate = async (promptMessage = '请验证身份'): Promise<boolean> => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        cancelLabel: '取消',
        fallbackLabel: '使用密码',
        disableDeviceFallback: false,
      });
      return result.success;
    } catch (error: any) {
      // 用户取消或验证失败
      if (error?.code === 'ERR_CANCELED') {
        return false;
      }
      console.error('Error during biometric authentication:', error);
      return false;
    }
  };

  /**
   * 启用回退到设备凭据
   */
  const enableFallback = async (): Promise<boolean> => {
    try {
      // 在 iOS 上这通常由系统自动处理
      return true;
    } catch (error) {
      console.error('Error enabling fallback:', error);
      return false;
    }
  };

  return {
    isAvailable,
    getBiometricType,
    authenticate,
    enableFallback,
  };
}
