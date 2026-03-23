import {useState} from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {useRouter} from 'expo-router';
import {useSecureStore} from '@/hooks/useSecureStore';
import {generateKey, assessPasswordStrength} from '@/utils/crypto';
import {useAuth} from './_layout';
import {Shield, Lock, Eye, EyeOff} from 'lucide-react-native';

export default function SetupScreen() {
  const router = useRouter();
  const {setMasterPassword, hasMasterPassword, setSessionTimeout} = useSecureStore();
  const {setMasterKey} = useAuth();

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
      <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
          style={{backgroundColor: '#e5e7eb'}}
      >
        <ScrollView
            className="flex-1"
            contentContainerStyle={{flexGrow: 1}}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
        >
          <View
              className="px-5 pb-8 pt-10"
              style={{
                backgroundColor: '#f0f0f3',
                borderBottomWidth: 1,
                borderBottomColor: 'transparent',
              }}
          >
            <View className="items-center">
              <View
                  className="mb-4 h-24 w-24 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: '#e8e8ec',
                    shadowColor: '#000',
                    shadowOffset: {width: 4, height: 4},
                    shadowOpacity: 0.12,
                    shadowRadius: 8,
                    elevation: 3,
                  }}
              >
                <Shield size={44} className="text-[#6366f1]"/>
              </View>
              <Text className="text-3xl font-bold text-[#1a1a2e]">设置主密码</Text>
              <Text className="mt-3 text-center text-[#6b7280]">
                创建一个强密码来保护您的所有密码数据
              </Text>
            </View>
          </View>

          <View className="flex-1 px-5 pb-8 pt-6">
            <View
                className="rounded-3xl bg-[#f0f0f3] p-5"
                style={{
                  shadowColor: '#000',
                  shadowOffset: {width: 4, height: 4},
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
                <Lock size={18} className="mr-3 text-[#6b7280]"/>
                <TextInput
                    value={masterPassword}
                    onChangeText={setMasterPasswordState}
                    placeholder="请输入主密码"
                    placeholderTextColor="#9ca3af"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    className="flex-1 text-[#1a1a2e]"
                    style={{fontSize: 16, includeFontPadding: false}}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="ml-3">
                  {showPassword ? (
                      <EyeOff size={20} className="text-[#6b7280]"/>
                  ) : (
                      <Eye size={20} className="text-[#6b7280]"/>
                  )}
                </TouchableOpacity>
              </View>

              {/* Password strength indicator */}
              {masterPassword.length > 0 && (
                  <View className="mt-3">
                    <View
                        className="h-1.5 rounded-full overflow-hidden flex-row"
                        style={{backgroundColor: '#e8e8ec'}}
                    >
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
                    <Text className="mt-1 text-xs text-[#6b7280]">密码强度: {strength.label}</Text>
                  </View>
              )}
            </View>

            <View
                className="mt-4 rounded-3xl bg-[#f0f0f3] p-5"
                style={{
                  shadowColor: '#000',
                  shadowOffset: {width: 4, height: 4},
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 3,
                }}
            >
              <Text className="mb-3 text-sm font-medium text-[#1a1a2e]">确认密码</Text>
              <View
                  className="flex-row items-center rounded-2xl px-4"
                  style={{
                    backgroundColor: '#e8e8ec',
                    borderWidth: 1,
                    borderColor: '#d4d7d9',
                    height: 56,
                  }}
              >
                <Lock size={18} className="mr-3 text-[#6b7280]"/>
                <TextInput
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="请再次输入主密码"
                    placeholderTextColor="#9ca3af"
                    secureTextEntry={!showConfirm}
                    autoCapitalize="none"
                    autoCorrect={false}
                    className="flex-1 text-[#1a1a2e]"
                    style={{fontSize: 16, includeFontPadding: false}}
                />
                <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} className="ml-3">
                  {showConfirm ? (
                      <EyeOff size={20} className="text-[#6b7280]"/>
                  ) : (
                      <Eye size={20} className="text-[#6b7280]"/>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
                onPress={handleSetup}
                disabled={isLoading || !masterPassword || !confirmPassword}
                className="mt-6 rounded-2xl px-6 py-4"
                style={{
                  backgroundColor: isLoading || !masterPassword || !confirmPassword ? '#d4d7d9' : '#6366f1',
                  shadowColor: '#000',
                  shadowOffset: {width: 0, height: 4},
                  shadowOpacity: isLoading || !masterPassword || !confirmPassword ? 0.12 : 0.24,
                  shadowRadius: 8,
                  elevation: 3,
                }}
            >
              <View className="flex-row items-center justify-center">
                {isLoading ? (
                    <ActivityIndicator size="small" color="#ffffff"/>
                ) : null}
                <Text className="text-center text-base font-semibold text-white ml-2">
                  {isLoading ? '设置中...' : '完成设置'}
                </Text>
              </View>
            </TouchableOpacity>

            <View
                className="mt-4 rounded-2xl bg-[#e8e8ec] p-4"
                style={{
                  shadowColor: '#000',
                  shadowOffset: {width: 2, height: 2},
                  shadowOpacity: 0.08,
                  shadowRadius: 4,
                  elevation: 2,
                }}
            >
              <Text className="text-center text-xs text-[#6b7280] leading-relaxed">
                💡 请记住您的主密码。如果忘记主密码，将无法恢复您的密码数据。
              </Text>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
  );
}
