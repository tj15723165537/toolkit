import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ArrowLeft, Check, Lock, QrCode as QrCodeIcon } from 'lucide-react-native';
import { useDatabase } from '@/database/hooks';
import { decrypt, encrypt, generateKey } from '@/utils/crypto';
import { useAuth } from './_layout';

interface QRData {
  version: string;
  index: number;
  total: number;
  data: string;
}

interface ImportedPasswordItem {
  platform: string;
  username: string;
  password: string;
  notes?: string;
}

export default function ImportScreen() {
  const router = useRouter();
  const { addPassword } = useDatabase();
  const { masterKey } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();

  const [masterPassword, setMasterPassword] = useState('');
  const [passwordConfirmed, setPasswordConfirmed] = useState(false);
  const [scannedData, setScannedData] = useState<QRData[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [totalToScan, setTotalToScan] = useState(0);
  const [scannedCount, setScannedCount] = useState(0);

  const processImport = useCallback(
    async (data: QRData[], oldMasterPassword: string) => {
      try {
        const sorted = [...data].sort((a, b) => a.index - b.index);
        const encryptedPayload = sorted.map((item) => item.data).join('');

        const oldKey = generateKey(oldMasterPassword);
        const decryptedPayload = decrypt(encryptedPayload, oldKey);
        const passwords = JSON.parse(decryptedPayload) as ImportedPasswordItem[];

        if (!masterKey) {
          throw new Error('Master key not available');
        }

        let successCount = 0;
        for (const item of passwords) {
          try {
            const encryptedPassword = encrypt(item.password, masterKey);
            await addPassword(item.platform, item.username, encryptedPassword, item.notes);
            successCount += 1;
          } catch (error) {
            console.error('Failed to import one password:', error);
          }
        }

        Alert.alert('Import complete', `Imported ${successCount} password record(s).`, [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } catch (error) {
        console.error('Import error:', error);
        Alert.alert('Import failed', 'Failed to decrypt or import data. Please verify the old master password.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } finally {
        setIsScanning(false);
      }
    },
    [addPassword, masterKey, router]
  );

  const handleScan = useCallback(
    (data: string) => {
      if (isScanning) return;

      try {
        const qrData: QRData = JSON.parse(data);

        if (scannedData.some((item) => item.index === qrData.index)) {
          return;
        }

        if (qrData.version !== '1') {
          Alert.alert('Invalid QR', 'Unsupported QR version.');
          return;
        }

        if (scannedData.length === 0) {
          setTotalToScan(qrData.total);
        } else if (qrData.total !== totalToScan) {
          Alert.alert('Invalid QR', 'QR chunks do not match.');
          return;
        }

        const next = [...scannedData, qrData];
        setScannedData(next);
        setScannedCount(next.length);

        if (next.length === qrData.total) {
          setIsScanning(true);
          void processImport(next, masterPassword);
        }
      } catch (error) {
        console.error('Scan error:', error);
        Alert.alert('Scan failed', 'Invalid QR payload.');
      }
    },
    [isScanning, masterPassword, processImport, scannedData, totalToScan]
  );

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
        <Text className="text-xl font-bold text-[#1a1a2e]">QR Import</Text>
      </View>

      <ScrollView className="flex-1 px-5 py-6">
        {!passwordConfirmed ? (
          <View className="items-center py-12">
            <View
              className="mb-6 h-24 w-24 items-center justify-center rounded-full"
              style={{
                backgroundColor: '#e8e8ec',
                shadowColor: '#000',
                shadowOffset: { width: 4, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <Lock size={48} className="text-[#6366f1]" />
            </View>
            <Text className="mb-3 text-xl font-semibold text-[#1a1a2e]">Enter old master password</Text>
            <Text className="mb-6 px-4 text-center text-[#6b7280]">
              This password is used to decrypt exported data from your previous device.
            </Text>

            <View
              className="mb-4 w-full rounded-2xl px-4"
              style={{
                backgroundColor: '#e8e8ec',
                shadowColor: '#000',
                shadowOffset: { width: 3, height: 3 },
                shadowOpacity: 0.1,
                shadowRadius: 6,
                elevation: 2,
              }}
            >
              <TextInput
                value={masterPassword}
                onChangeText={setMasterPassword}
                placeholder="Old master password"
                placeholderTextColor="#9ca3af"
                secureTextEntry
                className="text-base text-[#1a1a2e]"
                style={{ fontSize: 16, height: 50 }}
              />
            </View>

            <TouchableOpacity
              onPress={() => setPasswordConfirmed(true)}
              disabled={masterPassword.trim() === ''}
              className="rounded-2xl px-12 py-4"
              style={{
                backgroundColor: masterPassword.trim() === '' ? '#d4d7d9' : '#6366f1',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <Text className="text-base font-semibold text-white">Confirm</Text>
            </TouchableOpacity>
          </View>
        ) : !permission?.granted ? (
          <View className="items-center py-12">
            <View
              className="mb-6 h-24 w-24 items-center justify-center rounded-full"
              style={{
                backgroundColor: '#e8e8ec',
                shadowColor: '#000',
                shadowOffset: { width: 4, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <QrCodeIcon size={48} className="text-[#6366f1]" />
            </View>
            <Text className="mb-3 px-8 text-center text-xl font-semibold text-[#1a1a2e]">Camera permission needed</Text>
            <Text className="mb-6 px-8 text-center text-[#6b7280]">Allow camera access to scan QR code data.</Text>
            <TouchableOpacity
              onPress={requestPermission}
              className="rounded-2xl px-12 py-4"
              style={{
                backgroundColor: '#6366f1',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <Text className="text-base font-semibold text-white">Grant permission</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="w-full">
            <View
              className="mb-6 overflow-hidden rounded-3xl bg-black"
              style={{
                height: 300,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.3,
                shadowRadius: 20,
                elevation: 8,
              }}
            >
              <CameraView
                style={{ flex: 1 }}
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
              <View className="mb-4 rounded-2xl bg-[#e8e8ec] p-5">
                <View className="mb-3 flex-row items-center justify-between">
                  <Text className="text-sm text-[#6b7280]">Scan progress</Text>
                  <Text className="text-sm font-bold text-[#6366f1]">
                    {scannedCount} / {totalToScan}
                  </Text>
                </View>
                <View className="h-2 rounded-full" style={{ backgroundColor: '#d4d7d9' }}>
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
              <View className="mb-4 flex-row flex-wrap gap-2">
                {Array.from({ length: totalToScan }).map((_, index) => {
                  const isScanned = scannedData.some((item) => item.index === index + 1);
                  return (
                    <View
                      key={index}
                      className="h-8 w-8 items-center justify-center rounded-full"
                      style={{
                        backgroundColor: isScanned ? '#10b981' : '#e8e8ec',
                      }}
                    >
                      {isScanned && <Check size={16} className="text-white" />}
                    </View>
                  );
                })}
              </View>
            )}

            {totalToScan === 0 ? (
              <Text className="text-center text-[#6b7280]">Point the camera to QR code on your old device.</Text>
            ) : (
              <Text className="text-center text-[#6b7280]">
                {isScanning ? 'Importing...' : 'Continue scanning remaining QR chunks.'}
              </Text>
            )}

            {isScanning && (
              <View className="mt-4 items-center">
                <ActivityIndicator size="large" color="#6366f1" />
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
