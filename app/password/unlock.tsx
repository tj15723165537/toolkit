import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSecureStore } from '@/hooks/useSecureStore';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';
import { generateKey } from '@/utils/crypto';
import { useAuth } from './_layout';
import { Lock, Eye, EyeOff, Fingerprint } from 'lucide-react-native';

export default function UnlockScreen() {
  const router = useRouter();
  const { verifyMasterPassword, setSessionTimeout } = useSecureStore();
  const { authenticate, isAvailable, getBiometricType } = useBiometricAuth();
  const { setMasterKey } = useAuth();

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [biometricType, setBiometricType] = useState<string | null>(null);

  useEffect(() => {
    checkBiometric();
  }, []);

  const checkBiometric = async () => {
    const available = await isAvailable();
    if (available) {
      const type = await getBiometricType();
      setBiometricType(type);
      // Automatically trigger biometric auth
      handleBiometricAuth();
    }
  };

  const handleBiometricAuth = async () => {
    const success = await authenticate(biometricType ? `使用${biometricType}解锁` : '请验证身份');
    if (success) {
      // Biometric auth succeeded, but we still need the master password
      // In a production app, you might store a biometric-encrypted master password
      Alert.alert('需要主密码', '请输入主密码以完成解锁');
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
        setIsLoading(false);
        return;
      }

      // Generate and store encryption key in memory
      const key = generateKey(password);
      setMasterKey(key);

      // Set session timeout
      await setSessionTimeout(Date.now());

      // Navigate to password list
      router.replace('/password');
    } catch (error) {
      Alert.alert('解锁失败', '无法验证密码，请重试');
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 px-6 pt-10">
        {/* Header */}
        <View className="items-center mb-12">
          <View className="w-20 h-20 rounded-full bg-primary/10 items-center justify-center mb-4">
            <Lock size={40} className="text-primary" />
          </View>
          <Text className="text-3xl font-bold text-foreground mb-2">解锁密码管理器</Text>
          <Text className="text-muted-foreground text-center">
            输入主密码以访问您的密码记录
          </Text>
        </View>

        {/* Form */}
        <View className="space-y-4">
          {/* Master Password */}
          <View>
            <Text className="text-sm font-medium text-foreground mb-2">主密码</Text>
            <View className="relative">
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="输入主密码"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                className="bg-card border border-border rounded-lg px-4 py-3 pr-12 text-foreground"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                {showPassword ? (
                  <EyeOff size={20} className="text-muted-foreground" />
                ) : (
                  <Eye size={20} className="text-muted-foreground" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Biometric Button */}
        {biometricType && (
          <TouchableOpacity
            onPress={handleBiometricAuth}
            className="mt-4 flex-row items-center justify-center gap-2 py-3 border border-border rounded-lg"
          >
            <Fingerprint size={20} className="text-primary" />
            <Text className="text-primary font-medium">
              使用{biometricType}
            </Text>
          </TouchableOpacity>
        )}

        {/* Submit Button */}
        <View className="mt-8">
          <TouchableOpacity
            onPress={handleUnlock}
            disabled={isLoading || !password}
            className={`rounded-lg py-3 px-6 items-center ${
              isLoading || !password ? 'bg-muted' : 'bg-primary'
            }`}
          >
            <Text
              className={`font-semibold ${
                isLoading || !password
                  ? 'text-muted-foreground'
                  : 'text-primary-foreground'
              }`}
            >
              {isLoading ? '解锁中...' : '解锁'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  </SafeAreaView>
  );
}
