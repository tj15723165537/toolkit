import * as SecureStore from 'expo-secure-store';
import { hashPassword } from '@/utils/crypto';

const MASTER_PASSWORD_HASH_KEY = 'master_password_hash';
const SESSION_TIMEOUT_KEY = 'session_timeout';
const BIOMETRIC_MASTER_KEY = 'biometric_master_key';
const BIOMETRIC_KEY_READY = 'biometric_key_ready';

export function useSecureStore() {
  /**
   * 设置主密码哈希
   */
  const setMasterPassword = async (password: string): Promise<void> => {
    try {
      const hash = hashPassword(password);
      await SecureStore.setItemAsync(MASTER_PASSWORD_HASH_KEY, hash);
    } catch (error) {
      console.error('Error storing master password:', error);
      throw new Error('Failed to store master password');
    }
  };

  /**
   * 验证主密码
   */
  const verifyMasterPassword = async (password: string): Promise<boolean> => {
    try {
      const stored = await SecureStore.getItemAsync(MASTER_PASSWORD_HASH_KEY);
      if (!stored) return false;
      return hashPassword(password) === stored;
    } catch (error) {
      console.error('Error verifying master password:', error);
      return false;
    }
  };

  /**
   * 检查是否已设置主密码
   */
  const hasMasterPassword = async (): Promise<boolean> => {
    try {
      const stored = await SecureStore.getItemAsync(MASTER_PASSWORD_HASH_KEY);
      return !!stored;
    } catch (error) {
      console.error('Error checking master password:', error);
      return false;
    }
  };

  /**
   * 移除主密码（用于重置）
   */
  const removeMasterPassword = async (): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(MASTER_PASSWORD_HASH_KEY);
      await SecureStore.deleteItemAsync(SESSION_TIMEOUT_KEY);
      await SecureStore.deleteItemAsync(BIOMETRIC_MASTER_KEY);
      await SecureStore.deleteItemAsync(BIOMETRIC_KEY_READY);
    } catch (error) {
      console.error('Error removing master password:', error);
      throw new Error('Failed to remove master password');
    }
  };

  /**
   * 保存用于生物解锁的主密钥（受系统认证保护）
   */
  const setBiometricMasterKey = async (masterKey: string): Promise<boolean> => {
    try {
      await SecureStore.setItemAsync(BIOMETRIC_MASTER_KEY, masterKey, {
        requireAuthentication: true,
        authenticationPrompt: '请验证身份以启用生物解锁',
      });
      await SecureStore.setItemAsync(BIOMETRIC_KEY_READY, '1');
      return true;
    } catch (error) {
      // 某些设备/模拟器可能不支持 requireAuthentication，不阻断主流程
      console.warn('Biometric key storage unavailable:', error);
      return false;
    }
  };

  /**
   * 是否已初始化生物解锁密钥
   */
  const hasBiometricMasterKey = async (): Promise<boolean> => {
    try {
      const stored = await SecureStore.getItemAsync(BIOMETRIC_KEY_READY);
      return stored === '1';
    } catch (error) {
      return false;
    }
  };

  /**
   * 读取用于生物解锁的主密钥
   */
  const getBiometricMasterKey = async (
    authenticationPrompt = '请验证身份进行解锁'
  ): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(BIOMETRIC_MASTER_KEY, {
        requireAuthentication: true,
        authenticationPrompt,
      });
    } catch (error) {
      console.warn('Biometric key read failed:', error);
      return null;
    }
  };

  /**
   * 设置会话超时时间
   */
  const setSessionTimeout = async (timestamp: number): Promise<void> => {
    try {
      await SecureStore.setItemAsync(SESSION_TIMEOUT_KEY, timestamp.toString());
    } catch (error) {
      console.error('Error setting session timeout:', error);
    }
  };

  /**
   * 获取会话超时时间
   */
  const getSessionTimeout = async (): Promise<number | null> => {
    try {
      const stored = await SecureStore.getItemAsync(SESSION_TIMEOUT_KEY);
      return stored ? parseInt(stored, 10) : null;
    } catch (error) {
      console.error('Error getting session timeout:', error);
      return null;
    }
  };

  return {
    setMasterPassword,
    verifyMasterPassword,
    hasMasterPassword,
    removeMasterPassword,
    hasBiometricMasterKey,
    setBiometricMasterKey,
    getBiometricMasterKey,
    setSessionTimeout,
    getSessionTimeout,
  };
}
