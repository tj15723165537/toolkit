import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { ArrowLeft } from 'lucide-react-native';
import { useDatabase } from '@/database/hooks';
import { encrypt } from '@/utils/crypto';
import { useAuth } from './_layout';

interface QRData {
  version: '1';
  index: number;
  total: number;
  data: string;
}

interface ExportPasswordItem {
  id: string;
  platform: string;
  username: string;
  password: string;
  notes?: string;
}

export default function ExportScreen() {
  const router = useRouter();
  const { getPasswords } = useDatabase();
  const { masterKey, decryptPassword } = useAuth();

  const [qrData, setQrData] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    void startExport();
  }, []);

  const startExport = async () => {
    if (!masterKey) {
      Alert.alert('错误', '请先解锁密码管理器。');
      router.back();
      return;
    }

    try {
      setIsGenerating(true);
      const data = await getPasswords();

      if (data.length === 0) {
        Alert.alert('导出失败', '没有可导出的密码记录。');
        setIsGenerating(false);
        return;
      }

      const decryptedData: ExportPasswordItem[] = data.map((item) => {
        const decrypted = decryptPassword(item);
        return {
          id: decrypted.unique_id,
          platform: decrypted.platform,
          username: decrypted.username,
          password: decrypted.password,
          notes: decrypted.notes,
        };
      });

      const encryptedPayload = encrypt(JSON.stringify(decryptedData), masterKey);
      const qrPayload: QRData = {
        version: '1',
        index: 1,
        total: 1,
        data: encryptedPayload,
      };

      setQrData(JSON.stringify(qrPayload));
      setIsGenerating(false);
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('导出失败', '生成二维码失败，请重试。');
      setIsGenerating(false);
    }
  };

  return (
    <View className="flex-1 bg-[#f0f0f3]">
      <View
        className="flex-row items-center px-4 py-4"
        style={{
          borderBottomWidth: 1,
          borderBottomColor: '#d4d7d9',
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="mr-3 rounded-xl p-2"
          style={{
            backgroundColor: '#e8e8ec',
            shadowColor: '#000',
            shadowOffset: { width: 2, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          <ArrowLeft size={20} className="text-[#6366f1]" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-[#1a1a2e]">二维码导出</Text>
      </View>

      <ScrollView className="flex-1 px-5 py-6">
        <View className="items-center">
          {isGenerating ? (
            <View className="items-center py-12">
              <ActivityIndicator size="large" color="#6366f1" />
              <Text className="mt-4 text-[#6b7280]">正在生成二维码...</Text>
            </View>
          ) : !qrData ? (
            <View className="items-center py-12">
              <Text className="text-[#6b7280]">没有可导出的数据。</Text>
            </View>
          ) : (
            <View className="items-center">
              <View
                className="mb-6 rounded-3xl bg-white p-6"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.15,
                  shadowRadius: 20,
                  elevation: 8,
                }}
              >
                <QRCode value={qrData} size={280} color="#1a1a2e" backgroundColor="#ffffff" />
              </View>

              <Text className="mb-6 text-center text-[#6b7280]">
                在新设备上扫描此二维码即可导入。
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
