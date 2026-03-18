import {useCallback, useState} from 'react';
import {ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View} from 'react-native';
import {useRouter} from 'expo-router';
import {CameraView, useCameraPermissions} from 'expo-camera';
import {useDatabase} from '@/database/hooks';
import {decrypt, encrypt, generateKey} from '@/utils/crypto';
import {useAuth} from './_layout';
import {ArrowLeft, Check, Lock, QrCode as QrCodeIcon} from 'lucide-react-native';

interface QRData {
  version: string;
  index: number;
  total: number;
  data: string;
}

export default function ImportScreen() {
  const router = useRouter();
  const {addPassword} = useDatabase();
  const {masterKey} = useAuth();
  const [permission, requestPermission] = useCameraPermissions();

  const [masterPassword, setMasterPassword] = useState('');
  const [passwordConfirmed, setPasswordConfirmed] = useState(false);
  const [scannedData, setScannedData] = useState<QRData[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [totalToScan, setTotalToScan] = useState(0);
  const [scannedCount, setScScannedCount] = useState(0);

  const handleScan = useCallback((data: string) => {
    if (isScanning) return;

    try {
      const qrData: QRData = JSON.parse(data);

      if (scannedData.some(d => d.index === qrData.index)) {
        return;
      }

      if (qrData.version !== '1') {
        Alert.alert('错误', '不支持的二维码格式');
        return;
      }

      if (scannedData.length === 0) {
        setTotalToScan(qrData.total);
      } else if (qrData.total !== totalToScan) {
        Alert.alert('错误', '二维码数据不匹配');
        return;
      }

      const newScannedData = [...scannedData, qrData];
      setScannedData(newScannedData);
      setScScannedCount(newScannedData.length);

      if (newScannedData.length === qrData.total) {
        setIsScanning(true);
        processImport(newScannedData, masterPassword);
      }
    } catch (error) {
      console.error('Scan error:', error);
      Alert.alert('扫描失败', '无效的二维码数据');
    }
  }, [scannedData, isScanning, totalToScan, masterPassword]);

  const processImport = async (data: QRData[], password: string) => {
    console.log('processImport called with password length:', password.length);
    console.log('Current masterKey exists:', !!masterKey);

    try {
      data.sort((a, b) => a.index - b.index);

      const encrypted = data.map(d => d.data).join('');
      console.log('Encrypted data length:', encrypted.length);

      const oldKey = generateKey(password);
      console.log('Old device key (first 50 chars):', oldKey.substring(0, 50));

      const decrypted = decrypt(encrypted, oldKey);
      console.log('Decrypted data length:', decrypted.length);

      const passwords = JSON.parse(decrypted) as Array<{
        platform: string;
        username: string;
        password: string;
        notes?: string;
      }>;

      console.log('Number of passwords to import:', passwords.length);

      if (!masterKey) {
        throw new Error('Master key not available');
      }

      console.log('Current device key (first 50 chars):', masterKey.substring(0, 50));

      let successCount = 0;
      for (const item of passwords) {
        try {
          // 用当前设备的 masterKey 重新加密密码
          const encryptedPassword = encrypt(item.password, masterKey);
          await addPassword(item.platform, item.username, encryptedPassword, item.notes);
          successCount++;
        } catch (error) {
          console.error('Failed to import password:', error);
        }
      }

      Alert.alert('导入成功', `成功导入 ${successCount} 条密码记录`, [
        {text: '确定', onPress: () => router.back()},
      ]);
    } catch (error) {
      console.error('Import error:', error);
      Alert.alert('导入失败', '解密失败，请检查密码是否正确', [
        {text: '确定', onPress: () => router.back()},
      ]);
    } finally {
      setIsScanning(false);
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
        <Text className="text-xl font-bold text-[#1a1a2e]">二维码导入</Text>
      </View>

      <ScrollView className="flex-1 px-5 py-6">
        <View className="items-center">
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
              <Lock size={48} className="text-[#6366f1]"/>
              </View>
              <Text className="text-xl font-semibold text-[#1a1a2e] mb-3">
                输入主密码
              </Text>
              <Text className="text-[#6b7280] text-center mb-6 px-4">
                请输入旧设备的主密码来解密数据
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
                onPress={() => setPasswordConfirmed(true)}
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
          ) : !permission?.granted ? (
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
              <Text className="text-xl font-semibold text-[#1a1a2e] mb-3 text-center px-8">
                需要相机权限
              </Text>
              <Text className="text-[#6b7280] text-center mb-6 px-8">
                请允许相机权限以扫描二维码
              </Text>
              <TouchableOpacity
                onPress={requestPermission}
                className="px-8 py-4 rounded-2xl"
                style={{
                  backgroundColor: '#6366f1',
                  shadowColor: '#000',
                  shadowOffset: {width: 0, height: 4},
                  shadowOpacity: 0.25,
                  shadowRadius: 8,
                  elevation: 3,
                }}
              >
                <Text className="text-white font-semibold text-base">授予权限</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="w-full">
              <View
                className="bg-black rounded-3xl overflow-hidden mb-6"
                style={{
                  height: 300,
                  shadowColor: '#000',
                  shadowOffset: {width: 0, height: 8},
                  shadowOpacity: 0.3,
                  shadowRadius: 20,
                  elevation: 8,
                }}
              >
                <CameraView
                  style={{flex: 1}}
                  facing="back"
                  onBarcodeScanned={(result) => {
                    if (result.type === 'qr') {
                      handleScan(result.data);
                    }
                  }}
                  barcodeScannerSettings={{
                    barcodeTypes: ['qr'],
                  }}
                />
              </View>

              {totalToScan > 0 && (
                <View className="bg-[#e8e8ec] rounded-2xlxl p-5 mb-4">
                  <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-[#6b7280] text-sm">扫描进度</Text>
                    <Text className="text-[#6366f1] text-sm font-bold">
                      {scannedCount} / {totalToScan}
                    </Text>
                  </View>
                  <View
                    className="h-2 rounded-full"
                    style={{backgroundColor: '#d4d7d9'}}
                  >
                    <View
                      className="h-2 rounded-full"
                      style={{
                        width: `${(scannedCount / totalToScan) * 100}%`,
                        backgroundColor: '#6366f1',
                      }}
                    />
                  </View>
                </View>
              )}

              {scannedData.length > 0 && (
                <View className="flex-row flex-wrap gap-2 mb-4">
                  {Array.from({length: totalToScan}).map((_, i) => {
                    const isScanned = scannedData.some(d => d.index === i + 1);
                    return (
                      <View
                        key={i}
                        className="w-8 h-8 rounded-full items-center justify-center"
                        style={{
                          backgroundColor: isScanned ? '#10b981' : '#e8e8ec',
                        }}
                      >
                        {isScanned && <Check size={16} className="text-white"/>}
                      </View>
                    );
                  })}
                </View>
              )}

              {totalToScan === 0 ? (
                <Text className="text-[#6b7280] text-center">
                  将旧设备的二维码对准摄像头
                </Text>
              ) : (
                <Text className="text-[#6b7280] text-center">
                  {isScanning ? '正在导入...' : '继续扫描剩余二维码'}
                </Text>
              )}

              {isScanning && (
                <View className="items-center mt-4">
                  <ActivityIndicator size="large" color="#6366f1"/>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
