import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { ArrowLeft, Check } from 'lucide-react-native';
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
      Alert.alert('Error', 'Please unlock password manager first.');
      router.back();
      return;
    }

    try {
      setIsGenerating(true);
      const data = await getPasswords();

      if (data.length === 0) {
        Alert.alert('Export failed', 'No password records to export.');
        setIsGenerating(false);
        return;
      }

      const decryptedData: ExportPasswordItem[] = data.map((item) => {
        const decrypted = decryptPassword(item);
        return {
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
      Alert.alert('Export failed', 'Failed to generate QR code.');
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
        <Text className="text-xl font-bold text-[#1a1a2e]">QR Export</Text>
      </View>

      <ScrollView className="flex-1 px-5 py-6">
        <View className="items-center">
          {isGenerating ? (
            <View className="items-center py-12">
              <ActivityIndicator size="large" color="#6366f1" />
              <Text className="mt-4 text-[#6b7280]">Generating QR code...</Text>
            </View>
          ) : !qrData ? (
            <View className="items-center py-12">
              <Text className="text-[#6b7280]">No data to export.</Text>
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
                Scan this QR code on your new device.
              </Text>

              <TouchableOpacity
                onPress={() => router.back()}
                className="rounded-2xl px-12 py-4"
                style={{
                  backgroundColor: '#10b981',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.25,
                  shadowRadius: 8,
                  elevation: 3,
                }}
              >
                <View className="flex-row items-center justify-center gap-2">
                  <Check size={20} className="text-white" />
                  <Text className="font-semibold text-white">Done</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
