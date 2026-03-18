import {useState} from 'react';
import {ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View} from 'react-native';
import {useRouter} from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import {useDatabase} from '@/database/hooks';
import {encrypt, decrypt, generateKey} from '@/utils/crypto';
import {useAuth} from './_layout';
import {ArrowLeft, Check, QrCode as QrCodeIcon, X, Zap} from 'lucide-react-native';

interface QRData {
  version: string;
  index: number;
  total: number;
  data: string;
}

const MAX_QR_DATA_SIZE = 1500;

export default function ExportScreen() {
  const router = useRouter();
  const {getPasswords} = useDatabase();
  const {masterKey, decryptPassword} = useAuth();

  const [masterPassword, setMasterPassword] = useState('');
  const [passwordConfirmed, setPasswordConfirmed] = useState(false);
  const [qrDataList, setQrDataList] = useState<string[]>([]);
  const [currentQrIndex, setCurrentQrIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  const startExport = async () => {
    if (!masterKey) {
      Alert.alert('错误', '需要先解锁密码管理器');
      return;
    }

    try {
      setIsGenerating(true);
      const data = await getPasswords();

      if (data.length === 0) {
        Alert.alert('导出失败', '没有密码记录可导出');
        setIsGenerating(false);
        return;
      }

      console.log('Exporting with password length:', masterPassword.length);
      console.log('Current masterKey (first 50 chars):', masterKey.substring(0, 50));

      const oldKey = generateKey(masterPassword);
      console.log('Old device key (first 50 chars):', oldKey.substring(0, 50));

      // 先用当前 masterKey 解密数据库中的密码，获得明文
      const decryptedData = data.map(p => {
        const decrypted = decryptPassword(p);
        return {
          platform: decrypted.platform,
          username: decrypted.username,
          password: decrypted.password,
          notes: decrypted.notes,
        };
      });

      // 再用旧设备的 masterPassword 加密导出
      const jsonString = JSON.stringify(decryptedData);
      console.log('JSON string length:', jsonString.length);
      const encrypted = encrypt(jsonString, oldKey);
      console.log('Encrypted data length:', encrypted.length);

      const chunks: string[] = [];
      for (let i = 0; i < encrypted.length; i += MAX_QR_DATA_SIZE) {
        chunks.push(encrypted.substring(i, i + MAX_QR_DATA_SIZE));
      }

      const qrList = chunks.map((chunk, chunkIndex) => {
        const qrData: QRData = {
          version: '1',
          index: chunkIndex + 1,
          total: chunks.length,
          data: chunk,
        };
        return JSON.stringify(qrData);
      });

      setQrDataList(qrList);
      setCurrentQrIndex(0);
      setIsGenerating(false);
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('导出失败', '生成二维码时出错');
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
          className="p-2 rounded-xl mr-3"
          style={{
            backgroundColor: '#e8e8ec',
            shadowColor: '#000',
            shadowOffset: {width: 2, height: 2},
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          <ArrowLeft size={20} className="text-[#6366f1]"/>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-[#1a1a2e]">二维码导出</Text>
      </View>

      <ScrollView className="flex-1 px-5 py-6">
        {!passwordConfirmed ? (
          <View className="items-center py-12">
            <View
              className="w-24 h-24 rounded-full items-center justify-center mb-6"
              style={{
                backgroundColor: '#e8e8ec',
                shadowColor: '#000',
                shadowOffset: {width: 4, height: 4},
                shadowOpacity: 0.15,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <QrCodeIcon size={48} className="text-[#6366f1]"/>
            </View>
            <Text className="text-xl font-semibold text-[#1a1a2e] mb-3">
              输入主密码
            </Text>
            <Text className="text[#6b7280] text-center mb-6 px-4">
              请输入旧设备的主密码来加密导出的数据
            </Text>

            <View
              className="w-full px-4 rounded-2xl mb-4"
              style={{
                backgroundColor: '#e8e8ec',
                shadowColor: '#000',
                shadowOffset: {width: 3, height: 3},
                shadowOpacity: 0.1,
                shadowRadius: 6,
                elevation: 2,
              }}
            >
              <TextInput
                value={masterPassword}
                onChangeText={setMasterPassword}
                placeholder="主密码"
                placeholderTextColor="#9ca3af"
                secureTextEntry
                className="text-[#1a1a2e] text-base"
                style={{fontSize: 16, height: 50}}
              />
            </View>

            <TouchableOpacity
              onPress={() => {
                setPasswordConfirmed(true);
                startExport();
              }}
              disabled={masterPassword.trim() === ''}
              className="px-8 py-4 rounded-2xl"
              style={{
                backgroundColor: masterPassword.trim() === '' ? '#d4d7d9' : '#6366f1',
                shadowColor: '#000',
                shadowOffset: {width: 0, height: 4},
                shadowOpacity: 0.25,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <Text className="text-white font-semibold text-base">确认</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="items-center">
            {isGenerating ? (
              <View className="items-center py-12">
                <ActivityIndicator size="large" color="#6366f1"/>
                <Text className="text-[#6b7280] mt-4">生成二维码中...</Text>
              </View>
            ) : qrDataList.length === 0 ? (
              <View className="items-center py-12">
                <Text className="text-[#6b7280]">没有密码记录可导出</Text>
              </View>
            ) : (
              <View className="items-center">
                <View className="w-full mb-6">
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-[#6b7280] text-sm">
                      {currentQrIndex + 1} / {qrDataList.length}
                    </Text>
                    <Text className="text-[#6366f1] text-sm font-medium">
                      {Math.round(((currentQrIndex + 1) / qrDataList.length) * 100)}%
                    </Text>
                  </View>
                  <View
                    className="h-2 rounded-full"
                    style={{backgroundColor: '#e8e8ec'}}
                  >
                    <View
                      className="h-2 rounded-full"
                      style={{
                        width: `${((currentQrIndex + 1) / qrDataList.length) * 100}%`,
                        backgroundColor: '#6366f1',
                      }}
                    />
                  </View>
                </View>

                <View
                  className="bg-white rounded-3xl p-6 mb-6"
                  style={{
                    shadowColor: '#000',
                    shadowOffset: {width: 0, height: 8},
                    shadowOpacity: 0.15,
                    shadowRadius: 20,
                    elevation: 8,
                  }}
                >
                  <QRCode
                    value={qrDataList[currentQrIndex]}
                    size={250}
                    color="#1a1a2e"
                    backgroundColor="#ffffff"
                  />
                </View>

                <Text className="text-[#6b7280] text-center mb-6">
                  在新设备上扫描此二维码
                </Text>

                <View className="flex-row gap-4 w-full">
                  {currentQrIndex > 0 && (
                    <TouchableOpacity
                      onPress={() => setCurrentQrIndex(currentQrIndex - 1)}
                      className="flex-1 py-4 rounded-2xl items-center flex-row justify-center gap-2"
                      style={{
                        backgroundColor: '#e8e8ec',
                        shadowColor: '#000',
                        shadowOffset: {width: 2, height: 2},
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                        elevation: 2,
                      }}
                    >
                      <X size={20} className="text-[#6366f1]"/>
                      <Text className="text-[#6366f1] font-medium">上一个</Text>
                    </TouchableOpacity>
                  )}

                  {currentQrIndex < qrDataList.length - 1 ? (
                    <TouchableOpacity
                      onPress={() => setCurrentQrIndex(currentQrIndex + 1)}
                      className="flex-1 py-4 rounded-2xl items-center flex-row justify-center gap-2"
                      style={{
                        backgroundColor: '#6366f1',
                        shadowColor: '#000',
                        shadowOffset: {width: 0, height: 4},
                        shadowOpacity: 0.25,
                        shadowRadius: 8,
                        elevation: 3,
                      }}
                    >
                      <Zap size={20} className="text-white"/>
                      <Text className="text-white font-medium">下一个</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      onPress={() => router.back()}
                      className="flex-1 py-4 rounded-2xl items-center flex-row justify-center gap-2"
                      style={{
                        backgroundColor: '#10b981',
                        shadowColor: '#000',
                        shadowOffset: {width: 0, height: 4},
                        shadowOpacity: 0.25,
                        shadowRadius: 8,
                        elevation: 3,
                      }}
                    >
                      <Check size={20} className="text-white"/>
                      <Text className="text-white font-medium">完成</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
