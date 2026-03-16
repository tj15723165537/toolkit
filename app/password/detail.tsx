import {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {useRouter, useLocalSearchParams} from 'expo-router';
import {useDatabase} from '@/database/hooks';
import {useAuth} from './_layout';
import {Password, DecryptedPassword} from '@/types';
import {ArrowLeft, Copy, Eye, EyeOff, Edit3, ExternalLink, Calendar} from 'lucide-react-native';
import {formatDateChinese} from '@/utils/format';
import * as Clipboard from 'expo-clipboard';

export default function PasswordDetailScreen() {
  const router = useRouter();
  const {id} = useLocalSearchParams<{ id: string }>();
  const {getPassword} = useDatabase();
  const {decryptPassword} = useAuth();

  const [password, setPassword] = useState<DecryptedPassword | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showUsername, setShowUsername] = useState(false);

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
      } else {
        Alert.alert('未找到', '密码记录不存在');
        router.back();
      }
    } catch (error) {
      Alert.alert('加载失败', '无法加载密码记录');
      router.back();
    }

    setIsLoading(false);
  };

  const handleCopy = async (text: string, label: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('已复制', `${label} 已复制到剪贴板`);
  };

  const handleOpenUrl = () => {
    if (!password?.url) return;
    Alert.alert('打开网址', `是否跳转到 ${password.url}?`, [
      {text: '取消', style: 'cancel'},
      {
        text: '打开',
        onPress: () => {
          // In a real app, use Linking.openURL(url)
          Alert.alert('提示', '跳转功能需要实现 Linking.openURL');
        },
      },
    ]);
  };

  if (isLoading) {
    return (
        <View className="flex-1 items-center justify-center" style={{backgroundColor: '#e5e7eb'}}>
          <ActivityIndicator size="large" color="#6366f1"/>
        </View>
    );
  }

  if (!password) {
    return (
        <View className="flex-1 items-center justify-center" style={{backgroundColor: '#e5e7eb'}}>
          <Text className="text-[#6b7280]">密码记录不存在</Text>
        </View>

    );
  }

  const maskedPassword = '•'.repeat(password.password.length);
  const maskedUsername = password.username.length > 0
      ? password.username[0] + '•'.repeat(password.username.length - 1)
      : '';

  return (

      <>
        {/* Header - 拟态风格 */}
        <View
            className="bg-[#f0f0f3] px-5 py-4 pb-5"
            style={{
              borderBottomWidth: 1,
              borderBottomColor: '#d4d7d9',
            }}
        >
          <View className="flex-row items-center justify-between">
            <TouchableOpacity onPress={() => router.back()} className="p-2">
              <ArrowLeft size={26} className="text-[#1a1a2e]"/>
            </TouchableOpacity>
            <Text className="text-xl font-semibold text-[#1a1a2e]">密码详情</Text>
            <TouchableOpacity
                onPress={() => router.push(`/password/edit?id=${password.id}`)}
                className="p-2"
            >
              <Edit3 size={26} className="text-[#6366f1]"/>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView className="flex-1 px-5 py-6 space-y-4">
          {/* Platform card - 拟态风格 */}
          <View
              className="bg-[#f0f0f3] rounded-2xl p-5"
              style={{
                shadowColor: '#000',
                shadowOffset: {width: 4, height: 4},
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 3,
              }}
          >
            <Text className="text-xs font-medium text-[#6b7280] mb-3">平台</Text>
            <Text className="text-2xl font-bold text-[#1a1a2e]">{password.platform}</Text>
          </View>

          {/* Username card - 拟态风格 */}
          <View
              className="bg-[#f0f0f3] rounded-2xl p-5"
              style={{
                shadowColor: '#000',
                shadowOffset: {width: 4, height: 4},
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 3,
              }}
          >
            <Text className="text-xs font-medium text-[#6b7280] mb-3">用户名</Text>
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-xl font-medium text-[#1a1a2e]">
                  {showUsername ? password.username : maskedUsername}
                </Text>
              </View>
              <View className="flex-row gap-3 ml-3">
                <TouchableOpacity
                    onPress={() => setShowUsername(!showUsername)}
                >
                  {showUsername ? (
                      <EyeOff size={22} className="text-[#6b7280]"/>
                  ) : (
                      <Eye size={22} className="text-[#6b7280]"/>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => handleCopy(password.username, '用户名')}
                >
                  <Copy size={22} className="text-[#6366f1]"/>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Password card - 拟态风格，高亮 */}
          <View
              className="bg-[#eef2ff] rounded-2xl p-5 border-2 border-[#6366f1]/20"
              style={{
                shadowColor: '#6366f1',
                shadowOffset: {width: 4, height: 4},
                shadowOpacity: 0.15,
                shadowRadius: 12,
                elevation: 4,
              }}
          >
            <Text className="text-xs font-medium text-[#6366f1] mb-3">密码</Text>
            <View className="flex-row items-center justify-between">
              <View className="flex-1 flex-wrap">
                <Text className="text-xl font-mono text-[#1a1a2e] break-all">
                  {showPassword ? password.password : maskedPassword}
                </Text>
              </View>
              <View className="flex-row gap-3 ml-3">
                <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                      <EyeOff size={22} className="text-[#6b7280]"/>
                  ) : (
                      <Eye size={22} className="text-[#6b7280]"/>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => handleCopy(password.password, '密码')}
                >
                  <Copy size={22} className="text-[#6366f1]"/>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* URL card - 拟态风格 */}
          {password.url && (
              <TouchableOpacity
                  onPress={handleOpenUrl}
                  className="bg-[#f0f0f3] rounded-2xl p-5"
                  style={{
                    shadowColor: '#000',
                    shadowOffset: {width: 4, height: 4},
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 3,
                  }}
              >
                <Text className="text-xs font-medium text-[#6b7280] mb-3">网址</Text>
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-sm text-[#1a1a2e] break-all">{password.url}</Text>
                  </View>
                  <ExternalLink size={18} className="text-[#6366f1] ml-3"/>
                </View>
              </TouchableOpacity>
          )}

          {/* Notes card - 拟态风格 */}
          {password.notes && (
              <View
                  className="bg-[#f0f0f3] rounded-2xl p-5"
                  style={{
                    shadowColor: '#000',
                    shadowOffset: {width: 4, height: 4},
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 3,
                  }}
              >
                <Text className="text-xs font-medium text-[#6b7280] mb-3">备注</Text>
                <Text className="text-sm text-[#1a1a2e]">{password.notes}</Text>
              </View>
          )}

          {/* Metadata - 拟态风格 */}
          <View
              className="bg-[#f0f0f3] rounded-2xl p-5"
              style={{
                shadowColor: '#000',
                shadowOffset: {width: 4, height: 4},
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 3,
              }}
          >
            <Text className="text-xs font-medium text-[#6b7280] mb-3">创建时间</Text>
            <View className="flex-row items-center">
              <Calendar size={18} className="text-[#6b7280] mr-3"/>
              <Text className="text-sm text-[#1a1a2e]">
                {formatDateChinese(new Date(password.created_at))}
              </Text>
            </View>
            {password.updated_at !== password.created_at && (
                <View className="flex-row items-center mt-3">
                  <Calendar size={18} className="text-[#6b7280] mr-3"/>
                  <Text className="text-sm text-[#1a1a2e]">
                    更新于 {formatDateChinese(new Date(password.updated_at))}
                  </Text>
                </View>
            )}
          </View>
        </ScrollView>
      </>
  );
}
