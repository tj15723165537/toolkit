import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useDatabase } from '@/database/hooks';
import { useAuth } from './_layout';
import { Password, DecryptedPassword } from '@/types';
import { encrypt, generatePassword, assessPasswordStrength } from '@/utils/crypto';
import { ArrowLeft, Eye, EyeOff, RefreshCw, AlertTriangle } from 'lucide-react-native';

interface PasswordOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
}

export default function EditPasswordScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getPassword, updatePassword } = useDatabase();
  const { masterKey, decryptPassword } = useAuth();

  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState<DecryptedPassword | null>(null as DecryptedPassword | null);

  const [platform, setPlatform] = useState('');
  const [username, setUsername] = useState('');
  const [passwordValue, setPasswordValue] = useState('');
  const [notes, setNotes] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Password generator options
  const [passwordLength, setPasswordLength] = useState(16);
  const [passwordOptions, setPasswordOptions] = useState<PasswordOptions>({
    length: 16,
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
  });

  useEffect(() => {
    loadPassword();
  }, []);

  const loadPassword = async () => {
    if (!id) {
      Alert.alert('错误', '缺少密码 ID');
      router.back();
      return;
    }

    try {
      const data = await getPassword(parseInt(id, 10));
      if (data) {
        const decrypted = decryptPassword(data);
        setPassword(decrypted);
        setPlatform(decrypted.platform);
        setUsername(decrypted.username);
        setPasswordValue(decrypted.password);
        setNotes(decrypted.notes || '');
      } else {
        Alert.alert('未找到', '密码记录不存在');
        router.back();
      }
    } catch (error) {
      Alert.alert('加载失败', '无法加载密码记录');
      router.back();
    }

    setLoading(false);
  };

  const strength = assessPasswordStrength(passwordValue);

  const handleSave = async () => {
    if (!masterKey) {
      Alert.alert('错误', '主密钥未设置');
      return;
    }

    if (!platform.trim()) {
      Alert.alert('请输入平台', '请输入平台名称');
      return;
    }

    if (!username.trim()) {
      Alert.alert('请输入用户名', '请输入用户名');
      return;
    }

    if (!passwordValue) {
      Alert.alert('请输入密码', '请输入密码');
      return;
    }

    if (!password) {
      Alert.alert('错误', '密码记录不存在');
      return;
    }

    setIsLoading(true);

    try {
      const encryptedPassword = encrypt(passwordValue, masterKey);
      await updatePassword(password.id, {
        platform: platform.trim(),
        username: username.trim(),
        password: encryptedPassword,
        url: undefined,
        notes: notes.trim() || undefined,
      });
      Alert.alert('保存成功', '密码已更新', [
        { text: '确定', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert('保存失败', '无法保存密码，请重试');
    }

    setIsLoading(false);
  };

  const handleGeneratePassword = () => {
    const generated = generatePassword({
      length: passwordLength,
      uppercase: passwordOptions.uppercase,
      lowercase: passwordOptions.lowercase,
      numbers: passwordOptions.numbers,
      symbols: passwordOptions.symbols,
    });
    setPasswordValue(generated);
  };

  const cardStyle = {
    shadowColor: '#000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: '#e5e7eb' }}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: '#e5e7eb' }}>

      {/* Header */}
      <View className="bg-[#f0f0f3] px-5 py-4 pb-5" style={{ borderBottomWidth: 1, borderBottomColor: '#d4d7d9' }}>
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <ArrowLeft size={26} className="text-[#1a1a2e]" />
          </TouchableOpacity>
          <Text className="text-xl font-semibold text-[#1a1a2e]">编辑密码</Text>
          <View className="w-8" />
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView className="flex-1 px-5 py-6" style={{ gap: 24 }} contentContainerStyle={{ paddingBottom: 16 }}>
          {/* Platform */}
          <View>
            <Text className="text-sm font-medium text-[#1a1a2e] mb-3">平台 *</Text>
            <TextInput
              value={platform}
              onChangeText={setPlatform}
              placeholder="例如：GitHub、微信"
              placeholderTextColor="#9ca3af"
              className="bg-[#f0f0f3] rounded-2xl px-5 py-4 text-[#1a1a2e]"
              style={{ ...cardStyle, fontSize: 16 }}
            />
          </View>

          {/* Username */}
          <View>
            <Text className="text-sm font-medium text-[#1a1a2e] mb-3">用户名 *</Text>
            <TextInput
              value={username}
              onChangeText={setUsername}
              placeholder="邮箱、手机号或用户名"
              autoCapitalize="none"
              autoCorrect={false}
              placeholderTextColor="#9ca3af"
              className="bg-[#f0f0f3] rounded-2xl px-5 py-4 text-[#1a1a2e]"
              style={{ ...cardStyle, fontSize: 16 }}
            />
          </View>

          {/* Password */}
          <View>
            <View className="flex-row items-center mb-3">
              <Text className="text-sm font-medium text-[#1a1a2e]">密码 *</Text>
              <AlertTriangle size={16} className="text-orange-500 ml-2" />
            </View>
            <View>
              <TextInput
                value={passwordValue}
                onChangeText={setPasswordValue}
                placeholder="输入密码"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor="#9ca3af"
                className="bg-[#f0f0f3] rounded-2xl px-5 py-4 pr-28 text-[#1a1a2e]"
                style={{ ...cardStyle, fontSize: 16 }}
              />
              <View className="absolute right-3 top-5 flex-row" style={{ marginTop: Platform.OS === 'ios' ? 0 : -12 }}>
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="p-2">
                  {showPassword ? <EyeOff size={22} className="text-[#6b7280]" /> : <Eye size={22} className="text-[#6b7280]" />}
                </TouchableOpacity>
                <TouchableOpacity onPress={handleGeneratePassword} className="p-2">
                  <RefreshCw size={22} className="text-[#6366f1]" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Password strength indicator */}
            {passwordValue.length > 0 && (
              <View className="mt-3">
                <View className="h-2 bg-[#e5e7eb] rounded-full overflow-hidden flex-row">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <View key={i} className="flex-1 h-full" style={{ backgroundColor: i <= strength.score ? strength.color : 'transparent' }} />
                  ))}
                </View>
                <Text className="text-xs text-[#6b7280] mt-2">密码强度: {strength.label}</Text>
              </View>
            )}

            {/* Password Generator Settings */}
            <View className="mt-4 p-4 bg-[#e8e8ec] rounded-2xl">
              <Text className="text-xs font-medium text-[#6b7280] mb-3">密码生成器设置</Text>

              {/* Length */}
              <View className="mb-3">
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-xs text-[#1a1a2e]">长度</Text>
                  <Text className="text-xs font-semibold text-[#6366f1]">{passwordLength}</Text>
                </View>
                <View className="flex-row gap-1">
                  {[8, 12, 16, 20, 24].map((length) => (
                    <TouchableOpacity
                      key={length}
                      onPress={() => setPasswordLength(length)}
                      className={`flex-1 h-7 rounded-lg ${passwordLength === length ? 'bg-[#6366f1]' : 'bg-[#d4d7d9]'}`}
                    >
                      <Text className={`text-xs text-center leading-7 ${passwordLength === length ? 'text-white font-semibold' : 'text-[#1a1a2e]'}`}>
                        {length}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Character options */}
              <View style={{ gap: 8 }}>
                {[
                  { key: 'uppercase', label: '大写字母 (A-Z)' },
                  { key: 'lowercase', label: '小写字母 (a-z)' },
                  { key: 'numbers', label: '数字 (0-9)' },
                  { key: 'symbols', label: '符号 (!@#$...)' },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    onPress={() => setPasswordOptions({ ...passwordOptions, [option.key]: !passwordOptions[option.key as keyof PasswordOptions] })}
                    className="flex-row items-center py-2"
                  >
                    <View className={`w-6 h-6 rounded-lg border-2 mr-3 items-center justify-center ${passwordOptions[option.key as keyof PasswordOptions] ? 'bg-[#6366f1] border-[#6366f1]' : 'border-[#d4d7d9]'}`}>
                      {passwordOptions[option.key as keyof PasswordOptions] && <Text className="text-white text-xs">✓</Text>}
                    </View>
                    <Text className="text-sm text-[#1a1a2e]">{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Notes */}
          <View>
            <Text className="text-sm font-medium text-[#1a1a2e] mb-3">备注（可选）</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="添加备注信息"
              multiline
              placeholderTextColor="#9ca3af"
              className="bg-[#f0f0f3] rounded-2xl px-5 py-4 text-[#1a1a2e]"
              textAlignVertical="top"
              style={{ ...cardStyle, fontSize: 16, minHeight: 80 }}
            />
          </View>
        </ScrollView>

        {/* Footer */}
        <View className="px-5 py-5 pb-8">
          <TouchableOpacity
            onPress={handleSave}
            disabled={isLoading || !platform || !username || !passwordValue}
            className={`rounded-2xl py-4 px-6 items-center ${isLoading || !platform || !username || !passwordValue ? 'bg-[#d4d7d9]' : 'bg-[#6366f1]'}`}
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isLoading || !platform || !username || !passwordValue ? 0.1 : 0.25,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            <Text className={`font-semibold text-base ${isLoading || !platform || !username || !passwordValue ? 'text-[#6b7280]' : 'text-white'}`}>
              {isLoading ? '保存中...' : '保存'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
