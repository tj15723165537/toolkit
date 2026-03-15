import { useState } from 'react';
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
import { generateKey } from '@/utils/crypto';
import { useAuth } from './_layout';
import { Lock, Eye, EyeOff } from 'lucide-react-native';
import { assessPasswordStrength } from '@/utils/crypto';

export default function SetupScreen() {
  const router = useRouter();
  const { setMasterPassword, hasMasterPassword, setSessionTimeout } = useSecureStore();
  const { setMasterKey } = useAuth();

  const [masterPassword, setMasterPasswordState] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSetup = async () => {
    if (masterPassword.length < 6) {
      Alert.alert('密码太短', '主密码至少需要 6 个字符');
      return;
    }

    if (masterPassword !== confirmPassword) {
      Alert.alert('密码不匹配', '两次输入的密码不一致');
      return;
    }

    setIsLoading(true);

    try {
      // Check if already set
      const hasPassword = await hasMasterPassword();
      if (hasPassword) {
        Alert.alert('已设置', '主密码已设置，请使用解锁页面');
        setIsLoading(false);
        return;
      }

      // Store master password hash
      await setMasterPassword(masterPassword);

      // Generate and store encryption key in memory
      const key = generateKey(masterPassword);
      setMasterKey(key);

      // Set session timeout
      await setSessionTimeout(Date.now());

      // Navigate to password list
      router.replace('/password');
    } catch (error) {
      Alert.alert('设置失败', '无法设置主密码，请重试');
      setIsLoading(false);
    }
  };

  const strength = assessPasswordStrength(masterPassword);

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
          <Text className="text-3xl font-bold text-foreground mb-2">设置主密码</Text>
          <Text className="text-muted-foreground text-center">
            主密码用于加密所有密码记录。{'\n'}
            请记住此密码，忘记后将无法恢复。
          </Text>
        </View>

        {/* Form */}
        <View className="space-y-4">
          {/* Master Password */}
          <View>
            <Text className="text-sm font-medium text-foreground mb-2">主密码</Text>
            <View className="relative">
              <TextInput
                value={masterPassword}
                onChangeText={setMasterPasswordState}
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

            {/* Password strength indicator */}
            {masterPassword.length > 0 && (
              <View className="mt-2">
                <View className="h-1.5 bg-muted rounded-full overflow-hidden flex-row">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <View
                      key={i}
                      className="flex-1 h-full"
                      style={{
                        backgroundColor: i <= strength.score ? strength.color : 'transparent',
                      }}
                    />
                  ))}
                </View>
                <Text className="text-xs text-muted-foreground mt-1">密码强度: {strength.label}</Text>
              </View>
            )}
          </View>

          {/* Confirm Password */}
          <View>
            <Text className="text-sm font-medium text-foreground mb-2">确认密码</Text>
            <View className="relative">
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="再次输入主密码"
                secureTextEntry={!showConfirm}
                autoCapitalize="none"
                autoCorrect={false}
                className="bg-card border border-border rounded-lg px-4 py-3 pr-12 text-foreground"
              />
              <TouchableOpacity
                onPress={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                {showConfirm ? (
                  <EyeOff size={20} className="text-muted-foreground" />
                ) : (
                  <Eye size={20} className="text-muted-foreground" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Submit Button */}
        <View className="mt-8">
          <TouchableOpacity
            onPress={handleSetup}
            disabled={isLoading || !masterPassword || !confirmPassword}
            className={`rounded-lg py-3 px-6 items-center ${
              isLoading || !masterPassword || !confirmPassword
                ? 'bg-muted'
                : 'bg-primary'
            }`}
          >
            <Text
              className={`font-semibold ${
                isLoading || !masterPassword || !confirmPassword
                  ? 'text-muted-foreground'
                  : 'text-primary-foreground'
              }`}
            >
              {isLoading ? '设置中...' : '完成设置'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  </SafeAreaView>
  );
}
