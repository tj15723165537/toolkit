import {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  FlatList,
  Modal,
  ActivityIndicator,
} from 'react-native';
import {useRouter, useFocusEffect} from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import {useDatabase} from '@/database/hooks';
import {useSecureStore} from '@/hooks/useSecureStore';
import {Password} from '@/types';
import {encrypt, decrypt, generateKey} from '@/utils/crypto';
import {
  Plus,
  Search,
  MoreVertical,
  Trash2,
  X,
  Shield,
  Globe,
  Download,
  Upload,
  Lock,
} from 'lucide-react-native';

export default function PasswordListScreen() {
  const router = useRouter();
  const {getPasswords, deletePassword, addPassword} = useDatabase();
  const {verifyMasterPassword} = useSecureStore();

  const [passwords, setPasswords] = useState<Password[]>([]);
  const [filteredPasswords, setFilteredPasswords] = useState<Password[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPassword, setSelectedPassword] = useState<Password | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordModalMode, setPasswordModalMode] = useState<'export' | 'import'>('export');
  const [selectedImportFile, setSelectedImportFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);

  const loadPasswords = async () => {
    setIsLoading(true);
    try {
      const data = await getPasswords();
      console.log(data)
      setPasswords(data);
      setFilteredPasswords(data);
    } catch (error) {
      Alert.alert('加载失败', '无法加载密码记录');
    }
    setIsLoading(false);
  };

  useFocusEffect(
      useCallback(() => {
        loadPasswords();
      }, [])
  );

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredPasswords(passwords);
    } else {
      const filtered = passwords.filter(
          (p) =>
              p.platform.toLowerCase().includes(searchQuery.toLowerCase()) ||
              p.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (p.notes && p.notes.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredPasswords(filtered);
    }
  }, [searchQuery, passwords]);

  const handleDelete = () => {
    if (!selectedPassword) return;

    Alert.alert('确认删除', `确定要删除 ${selectedPassword.platform} 的密码记录吗？`, [
      {text: '取消', style: 'cancel'},
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePassword(selectedPassword.id);
            setShowDeleteModal(false);
            setSelectedPassword(null);
            loadPasswords();
          } catch (error) {
            Alert.alert('删除失败', '无法删除密码记录');
          }
        },
      },
    ]);
  };

  const handleExport = async () => {
    if (passwords.length === 0) {
      Alert.alert('导出失败', '没有密码记录可导出');
      return;
    }

    setPasswordModalMode('export');
    setShowPasswordModal(true);
    setPasswordInput('');
  };

  const performExport = async (masterPassword: string) => {
    try {
      const isValid = await verifyMasterPassword(masterPassword);
      if (!isValid) {
        Alert.alert('密码错误', '主密码不正确');
        return;
      }

      const key = generateKey(masterPassword);
      const dataToExport = passwords.map(p => ({
        platform: p.platform,
        username: p.username,
        password: p.password,
        notes: p.notes,
      }));

      const jsonString = JSON.stringify(dataToExport);
      const encrypted = encrypt(jsonString, key);

      const fileName = `password_backup_${Date.now()}.enc`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(fileUri, encrypted);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/octet-stream',
          dialogTitle: '分享密码密码备份',
        });
      } else {
        Alert.alert('分享不可用', '当前设备不支持文件分享');
      }

      await FileSystem.deleteAsync(fileUri, {idempotent: true});
      setShowPasswordModal(false);
      setPasswordInput('');

    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('导出失败', '导出密码备份时出错');
    }
  };

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      setSelectedImportFile(result.assets[0]);
      setPasswordModalMode('import');
      setShowPasswordModal(true);
      setPasswordInput('');
    } catch (error) {
      console.error('Import file selection error:', error);
      Alert.alert('选择文件失败', '无法选择备份文件');
    }
  };

  const performImport = async (masterPassword: string) => {
    if (!selectedImportFile) {
      Alert.alert('导入失败', '未选择文件');
      return;
    }

    try {
      const key = generateKey(masterPassword);
      const fileContent = await FileSystem.readAsStringAsync(selectedImportFile.uri);

      const decrypted = decrypt(fileContent, key);
      const data = JSON.parse(decrypted) as Array<{
        platform: string;
        username: string;
        password: string;
        notes?: string;
      }>;

      let successCount = 0;
      let failCount = 0;

      for (const item of data) {
        try {
          await addPassword(item.platform, item.username, item.password, item.notes);
          successCount++;
        } catch (error) {
          console.error('Failed to import password:', error);
          failCount++;
        }
      }

      setShowPasswordModal(false);
      setPasswordInput('');
      setSelectedImportFile(null);
      loadPasswords();

      if (failCount === 0) {
        Alert.alert('导入成功', `成功导入 ${successCount} 条密码记录`);
      } else {
        Alert.alert('导入完成', `成功导入 ${successCount} 条，失败 ${failCount} 条`);
      }

    } catch (error) {
      console.error('Import error:', error);
      Alert.alert('导入失败', '解密失败，请检查密码是否正确');
    }
  };

  const handlePasswordSubmit = () => {
    if (passwordInput.trim() === '') {
      Alert.alert('请输入密码', '请输入主密码');
      return;
    }

    if (passwordModalMode === 'export') {
      performExport(passwordInput);
    } else {
      performImport(passwordInput);
    }
  };

  const renderPasswordItem = ({item}: { item: Password }) => {
    return (
        <TouchableOpacity
            onPress={() => {
              router.push(`/password/detail?id=${item.id}`);
            }}
            className="mb-3"
        >
          <View
              className="bg-[#f0f0f3] rounded-2xl p-5 shadow-sm"
              style={{
                shadowColor: '#000',
                shadowOffset: {width: 4, height: 4},
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 3,
              }}
          >
            <View className="flex-row items-center">
              {/* Platform icon - 拟态风格 */}
              <View
                  className="w-14 h-14 rounded-2xl items-center justify-center mr-4"
                  style={{
                    backgroundColor: '#e8e8ec',
                    shadowColor: '#000',
                    shadowOffset: {width: 2, height: 2},
                    shadowOpacity: 0.15,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
              >
                <Globe size={26} className="text-[#6366f1]"/>
              </View>

              {/* Info */}
              <View className="flex-1">
                <Text className="text-[#1a1a2e] font-semibold text-lg mb-1">
                  {item.platform}
                </Text>
                <Text className="text-[#6b7280] text-sm">
                  {item.username}
                </Text>
              </View>

              {/* More button */}
              <TouchableOpacity
                  onPress={() => {
                    setSelectedPassword(item);
                    setShowDeleteModal(true);
                  }}
                  className="p-2"
              >
                <MoreVertical size={22} className="text-[#6b7280]"/>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
    );
  };

  return (
      <>
        {/* Header - 拟态风格 */}
        <View
            className="bg-[#f0f0f3] px-5 py-5 pb-6"
            style={{
              borderBottomWidth: 1,
              borderBottomColor: '#d4d7d9',
            }}
        >
          <View className="flex-row items-center justify-between mb-5">
            <Text className="text-2xl font-bold text-[#1a1a2e]">密码管理</Text>
            <View className="flex-row gap-3">
              <TouchableOpacity
                  onPress={handleExport}
                  className="px-3 py-2 rounded-xl flex-row items-center"
                  style={{
                    backgroundColor: '#e8e8ec',
                    shadowColor: '#000',
                    shadowOffset: {width: 2, height: 2},
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
              >
                <Download size={18} className="text-[#6366f1] mr-1.5"/>
                <Text className="text-[#6366f1] text-sm font-medium">导出</Text>
              </TouchableOpacity>
              <TouchableOpacity
                  onPress={handleImport}
                  className="px-3 py-2 rounded-xl flex-row items-center"
                  style={{
                    backgroundColor: '#e8e8ec',
                    shadowColor: '#000',
                    shadowOffset: {width: 2, height: 2},
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
              >
                <Upload size={18} className="text-[#6366f1] mr-1.5"/>
                <Text className="text-[#6366f1] text-sm font-medium">导入</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Search bar - 拟态风格 */}
          <View
              className="flex-row items-center px-4 rounded-2xl"
              style={{
                backgroundColor: '#e8e8ec',
                shadowColor: '#000',
                shadowOffset: {width: 3, height: 3},
                shadowOpacity: 0.1,
                shadowRadius: 6,
                elevation: 2,
              }}
          >
            <Search size={20} className="text-[#6b7280] mr-3"/>
            <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="搜索平台、用户名..."
                placeholderTextColor="#9ca3af"
                className="flex-1 text-[#1a1a2e] text-base"
                style={{fontSize: 14, height: 50}}
            />
            {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <X size={20} className="text-[#6b7280]"/>
                </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Content */}
        <View className="flex-1 px-5 py-4">
          {isLoading ? (
              <View className="flex-1 items-center justify-center">
                <Text className="text-[#6b7280]">加载中...</Text>
              </View>
          ) : filteredPasswords.length === 0 ? (
              <View className="flex-1 items-center justify-center">
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
                  <Shield size={48} className="text-[#6366f1]"/>
                </View>
                <Text className="text-xl font-semibold text-[#1a1a2e] mb-3">
                  {searchQuery ? '未找到匹配项' : '还没有密码记录'}
                </Text>
                <Text className="text-[#6b7280] mb-6 text-center px-8">
                  {searchQuery
                      ? '尝试其他关键词'
                      : '点击下方按钮添加第一个密码记录'}
                </Text>
                {!searchQuery &&
                    <TouchableOpacity
                        onPress={() => router.push('/password/add')}
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
                      <Text className="text-white font-semibold text-base">
                        添加密码
                      </Text>
                    </TouchableOpacity>}
              </View>
          ) : (
              <FlatList
                  data={filteredPasswords}
                  renderItem={renderPasswordItem}
                  keyExtractor={(item) => item.id.toString()}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{paddingBottom: 80}}
              />
          )}
        </View>

        {/* Add button - 拟态风格 */}
        {filteredPasswords.length > 0 && (
            <TouchableOpacity
                onPress={() => router.push('/password/add')}
                className="absolute bottom-6 right-6 px-5 h-14 rounded-2xl flex-row items-center justify-center"
                style={{
                  backgroundColor: '#e8e8ec',
                  shadowColor: '#000',
                  shadowOffset: {width: 3, height: 3},
                  shadowOpacity: 0.15,
                  shadowRadius: 6,
                  elevation: 3,
                }}
            >
              <Plus size={24} className="text-[#6366f1]"/>
            </TouchableOpacity>
        )}

        {/* Action modal - 拟态风格 */}
        <Modal
            visible={showDeleteModal}
            transparent
            animationType="fade"
            onRequestClose={() => {
              setShowDeleteModal(false);
              setSelectedPassword(null);
            }}
        >
          <View className="flex-1 bg-black/40 items-center justify-end">
            <View
                className="bg-[#f0f0f3] w-full mx-6 mb-6 rounded-3xl overflow-hidden"
                style={{
                  shadowColor: '#000',
                  shadowOffset: {width: 0, height: -4},
                  shadowOpacity: 0.15,
                  shadowRadius: 20,
                  elevation: 10,
                }}
            >
              {selectedPassword && (
                  <View className="p-4">
                    {/* Header */}
                    <View className="px-2 pb-4 border-b border-[#d4d7d9] mb-3">
                      <Text className="text-[#1a1a2e] font-bold text-lg mb-1 text-center">
                        {selectedPassword.platform}
                      </Text>
                      <Text className="text-[#6b7280] text-sm text-center">
                        {selectedPassword.username}
                      </Text>
                    </View>

                    {/* Edit option */}
                    <TouchableOpacity
                        onPress={() => {
                          setShowDeleteModal(false);
                          router.push(`/password/edit?id=${selectedPassword.id}`);
                        }}
                        className="flex-row items-center px-4 py-4"
                    >
                      <View
                          className="w-10 h-10 rounded-xl items-center justify-center mr-4"
                          style={{
                            backgroundColor: '#eef2ff',
                          }}
                      >
                        <Globe size={20} className="text-[#6366f1]"/>
                      </View>
                      <Text className="text-[#1a1a2e] text-base font-medium flex-1">编辑</Text>
                    </TouchableOpacity>

                    {/* Delete option */}
                    <TouchableOpacity
                        onPress={() => {
                          setShowDeleteModal(false);
                          handleDelete();
                        }}
                        className="flex-row items-center px-4 py-4"
                    >
                      <View
                          className="w-10 h-10 rounded-xl items-center justify-center mr-4"
                          style={{
                            backgroundColor: '#fef2f2',
                          }}
                      >
                        <Trash2 size={20} className="text-red-500"/>
                      </View>
                      <Text className="text-red-500 text-base font-medium flex-1">删除</Text>
                    </TouchableOpacity>

                    {/* Cancel */}
                    <TouchableOpacity
                        onPress={() => {
                          setShowDeleteModal(false);
                          setSelectedPassword(null);
                        }}
                        className="mt-3 px-4 py-4 bg-[#e8e8ec] rounded-2xl items-center"
                        style={{
                          shadowColor: '#000',
                          shadowOffset: {width: 2, height: 2},
                          shadowOpacity: 0.1,
                          shadowRadius: 4,
                          elevation: 2,
                        }}
                    >
                      <Text className="text-[#1a1a2e] text-base font-medium">取消</Text>
                    </TouchableOpacity>
                  </View>
              )}
            </View>
          </View>
        </Modal>

        {/* Password Modal for Export/Import */}
        <Modal
            visible={showPasswordModal}
            transparent
            animationType="fade"
            onRequestClose={() => {
              setShowPasswordModal(false);
              setPasswordInput('');
              setSelectedImportFile(null);
            }}
        >
          <View className="flex-1 bg-black/40 items-center justify-center px-8">
            <View
                className="bg-[#f0f0f3] w-full rounded-3xl overflow-hidden p-6"
                style={{
                  shadowColor: '#000',
                  shadowOffset: {width: 0, height: 8},
                  shadowOpacity: 0.2,
                  shadowRadius: 20,
                  elevation: 10,
                }}
            >
              {/* Icon */}
              <View className="items-center mb-5">
                <View
                    className="w-16 h-16 rounded-2xl items-center justify-center"
                    style={{
                      backgroundColor: '#eef2ff',
                      shadowColor: '#000',
                      shadowOffset: {width: 3, height: 3},
                      shadowOpacity: 0.15,
                      shadowRadius: 6,
                      elevation: 2,
                    }}
                >
                  <Lock size={32} className="text-[#6366f1]"/>
                </View>
              </View>

              {/* Title */}
              <Text className="text-xl font-bold text-[#1a1a2e] text-center mb-2">
                {passwordModalMode === 'export' ? '验证密码' : '输入密钥'}
              </Text>
              <Text className="text-[#6b7280] text-sm text-center mb-6">
                {passwordModalMode === 'export'
                    ? '请输入主密码以验证身份并导出备份'
                    : '请输入旧设备的主密码以解密备份'}
              </Text>

              {/* Password input field */}
              <View
                  className="px-4 rounded-2xl mb-4"
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
                    value={passwordInput}
                    onChangeText={setPasswordInput}
                    placeholder="主密码"
                    placeholderTextColor="#9ca3af"
                    secureTextEntry
                    className="text-[#1a1a2e] text-base"
                    style={{fontSize: 16, height: 50}}
                    onSubmitEditing={handlePasswordSubmit}
                />
              </View>

              {/* Action button */}
              <TouchableOpacity
                  onPress={handlePasswordSubmit}
                  className="w-full py-4 rounded-2xl mb-3"
                  style={{
                    backgroundColor: '#6366f1',
                    shadowColor: '#000',
                    shadowOffset: {width: 0, height: 4},
                    shadowOpacity: 0.25,
                    shadowRadius: 8,
                    elevation: 3,
                  }}
              >
                <Text className="text-white font-semibold text-base text-center">
                  {passwordModalMode === 'export' ? '导出' : '导入'}
                </Text>
              </TouchableOpacity>

              {/* Cancel button */}
              <TouchableOpacity
                  onPress={() => {
                    setShowPasswordModal(false);
                    setPasswordInput('');
                    setSelectedImportFile(null);
                  }}
                  className="w-full py-4 bg-[#e8e8ec] rounded-2xl items-center"
                  style={{
                    shadowColor: '#000',
                    shadowOffset: {width: 2, height: 2},
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
              >
                <Text className="text-[#1a1a2e] text-base font-medium">取消</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </>
  );
}
