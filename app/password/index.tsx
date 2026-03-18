import {useCallback, useEffect, useState} from 'react';
import {Alert, FlatList, Modal, Text, TextInput, TouchableOpacity, View,} from 'react-native';
import {useFocusEffect, useRouter} from 'expo-router';
import {useDatabase} from '@/database/hooks';
import {Password} from '@/types';
import {
  Globe,
  MoreVertical,
  Plus,
  QrCode,
  Search,
  Shield,
  Trash2,
  X,
} from 'lucide-react-native';

export default function PasswordListScreen() {
  const router = useRouter();
  const {getPasswords, deletePassword} = useDatabase();

  const [passwords, setPasswords] = useState<Password[]>([]);
  const [filteredPasswords, setFilteredPasswords] = useState<Password[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPassword, setSelectedPassword] = useState<Password | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
                  onPress={() => router.push('/password/export')}
                  className="px-3 py-2.5 rounded-xl flex-row items-center"
                  style={{
                    backgroundColor: '#e8e8ec',
                    shadowColor: '#000',
                    shadowOffset: {width: 2, height: 2},
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
              >
                <QrCode size={18} className="text-[#6366f1]" strokeWidth={2}/>
                <Text className="text-[#6366f1] text-sm font-medium ml-1.5">导出</Text>
              </TouchableOpacity>
              <TouchableOpacity
                  onPress={() => router.push('/password/import')}
                  className="px-3 py-2.5 rounded-xl flex-row items-center"
                  style={{
                    backgroundColor: '#e8e8ec',
                    shadowColor: '#000',
                    shadowOffset: {width: 2, height: 2},
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
              >
                <QrCode size={18} className="text-[#6366f1]" strokeWidth={2}/>
                <Text className="text-[#6366f1] text-sm font-medium ml-1.5">导入</Text>
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
      </>
  );
}
