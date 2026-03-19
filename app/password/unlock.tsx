import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSecureStore } from '@/hooks/useSecureStore';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';
import { generateKey } from '@/utils/crypto';
import { useAuth } from './_layout';
import { Eye, EyeOff, Fingerprint, Lock } from 'lucide-react-native';

export default function UnlockScreen() {
  const router = useRouter();
  const {
    verifyMasterPassword,
    setSessionTimeout,
    hasBiometricMasterKey,
    setBiometricMasterKey,
    getBiometricMasterKey,
  } = useSecureStore();
  const { isAvailable, getBiometricType } = useBiometricAuth();
  const { setMasterKey } = useAuth();

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isBiometricLoading, setIsBiometricLoading] = useState(false);
  const [biometricType, setBiometricType] = useState<string | null>(null);

  useEffect(() => {
    void checkBiometric();
  }, []);

  const completeUnlock = async (key: string) => {
    setMasterKey(key);
    await setSessionTimeout(Date.now());
    router.replace('/password');
  };

  const checkBiometric = async () => {
    const available = await isAvailable();
    if (!available) return;

    const type = await getBiometricType();
    setBiometricType(type);

    // 自动尝试生物解锁；若尚未保存密钥则静默失败，用户可继续输主密码
    await handleBiometricAuth(true, type);
  };

  const handleBiometricAuth = async (silent = false, typeLabel?: string | null) => {
    if (isBiometricLoading || isLoading) return;
    setIsBiometricLoading(true);

    try {
      const promptMessage = typeLabel
        ? `使用${typeLabel}解锁`
        : biometricType
          ? `使用${biometricType}解锁`
          : '请验证身份进行解锁';

      const key = await getBiometricMasterKey(promptMessage);

      if (!key) {
        if (!silent) {
          Alert.alert('暂不可用', '请先使用主密码解锁一次，之后即可使用生物解锁。');
        }
        return;
      }

      await completeUnlock(key);
    } catch (error) {
      if (!silent) {
        Alert.alert('生物解锁失败', '请重试，或输入主密码解锁。');
      }
    } finally {
      setIsBiometricLoading(false);
    }
  };

  const handleUnlock = async () => {
    if (!password) {
      Alert.alert('请输入密码', '请输入主密码');
      return;
    }

    setIsLoading(true);

    try {
      const isValid = await verifyMasterPassword(password);

      if (!isValid) {
        Alert.alert('密码错误', '主密码不正确');
        return;
      }

      const key = generateKey(password);
      const biometricReady = await hasBiometricMasterKey();
      if (biometricType && !biometricReady) {
        await setBiometricMasterKey(key);
      }
      await completeUnlock(key);
    } catch (error) {
      Alert.alert('解锁失败', '无法验证密码，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
      style={{ backgroundColor: '#e5e7eb' }}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View
          className="px-5 pb-8 pt-10"
          style={{
            backgroundColor: '#f0f0f3',
            borderBottomWidth: 1,
            borderBottomColor: '#d4d7d9',
          }}
        >
          <View className="items-center">
            <View
              className="mb-4 h-24 w-24 items-center justify-center rounded-full"
              style={{
                backgroundColor: '#e8e8ec',
                shadowColor: '#000',
                shadowOffset: { width: 4, height: 4 },
                shadowOpacity: 0.12,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <Lock size={44} className="text-[#6366f1]" />
            </View>
            <Text className="text-3xl font-bold text-[#1a1a2e]">解锁密码管理器</Text>
            <Text className="mt-3 text-center text-[#6b7280]">
              输入主密码，或使用生物识别快速解锁
            </Text>
          </View>
        </View>

        <View className="flex-1 px-5 pb-8 pt-6">
          <View
            className="rounded-3xl bg-[#f0f0f3] p-5"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 4, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            <Text className="mb-3 text-sm font-medium text-[#1a1a2e]">主密码</Text>
            <View
              className="flex-row items-center rounded-2xl px-4"
              style={{
                backgroundColor: '#e8e8ec',
                borderWidth: 1,
                borderColor: '#d4d7d9',
                height: 56,
              }}
            >
              <Lock size={18} className="mr-3 text-[#6b7280]" />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="请输入主密码"
                placeholderTextColor="#9ca3af"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                className="flex-1 text-[#1a1a2e]"
                style={{ fontSize: 16, includeFontPadding: false }}
              />
              <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)} className="ml-3">
                {showPassword ? (
                  <EyeOff size={20} className="text-[#6b7280]" />
                ) : (
                  <Eye size={20} className="text-[#6b7280]" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {biometricType && (
            <TouchableOpacity
              onPress={() => void handleBiometricAuth(false)}
              disabled={isBiometricLoading || isLoading}
              className="mt-4 rounded-2xl px-5 py-4"
              style={{
                backgroundColor: '#e8e8ec',
                shadowColor: '#000',
                shadowOffset: { width: 3, height: 3 },
                shadowOpacity: 0.12,
                shadowRadius: 6,
                elevation: 2,
                opacity: isBiometricLoading || isLoading ? 0.7 : 1,
              }}
            >
              <View className="flex-row items-center justify-center">
                {isBiometricLoading ? (
                  <ActivityIndicator color="#6366f1" />
                ) : (
                  <Fingerprint size={20} className="text-[#6366f1]" />
                )}
                <Text className="ml-2 text-base font-semibold text-[#6366f1]">
                  {isBiometricLoading ? '验证中...' : `使用${biometricType}解锁`}
                </Text>
              </View>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={handleUnlock}
            disabled={isLoading || !password}
            className="mt-6 rounded-2xl px-6 py-4"
            style={{
              backgroundColor: isLoading || !password ? '#d4d7d9' : '#6366f1',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isLoading || !password ? 0.12 : 0.24,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            <Text className="text-center text-base font-semibold text-white">
              {isLoading ? '解锁中...' : '使用主密码解锁'}
            </Text>
          </TouchableOpacity>

          <Text className="mt-4 text-center text-xs text-[#9ca3af]">
            生物解锁首次启用时，需要先用主密码解锁一次
          </Text>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
