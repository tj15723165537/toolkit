# AGENTS.md

这是为智能编码助手提供的项目指南，用于确保代码一致性和质量。

## 构建和检查命令

```bash
# 安装依赖
npm install

# 启动开发服务器
npm start
# 或
npx expo start

# 清除 Metro 缓存并启动
npx expo start --clear

# 启动 Android 模拟器
npm run android

# 启动 iOS 模拟器
npm run ios

# 启动 Web 版本
npm run web

# 运行代码检查
npm run lint

# 重置项目（将起始代码移到 app-example 目录）
npm run reset-project
```

## 技术栈

- **框架**: React Native 0.81.5 + Expo 54
- **路由**: expo-router（基于文件的路由）
- **语言**: TypeScript（strict 模式）
- **样式**: NativeWind (Tailwind CSS for React Native)
- **数据库**: expo-sqlite
- **图标**: lucide-react-native
- **日期处理**: date-fns + 中文本地化
- **动画**: react-native-reanimated
- **安全区域**: react-native-safe-area-context

## 代码风格指南

### 导入顺序

导入语句按以下顺序排列：

1. React 和 React Native 核心模块
2. 第三方库
3. Expo 模块
4. 本地模块（使用 @ 别名）
5. 类型导入（如有）

```typescript
// ✅ 正确
import { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Stack } from 'expo-router';
import { useDatabase } from '@/database/hooks';
import { formatDateChinese } from '@/utils/format';
```

### 模块路径别名

使用 `@/` 别名引用项目根目录的模块：

```typescript
// ✅ 正确
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/utils/format';
import { initializeDatabase } from '@/database';

// ❌ 错误
import { Button } from '../../../components/ui/Button';
```

### TypeScript 类型定义

- 所有函数参数必须明确指定类型
- 使用接口定义复杂对象类型
- 使用类型别名定义联合类型和实用类型

```typescript
// ✅ 正确
interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  date: string;
}

interface TransactionCardProps {
  transaction: Transaction;
}

export function TransactionCard({ transaction }: TransactionCardProps) {
  // ...
}

// ❌ 错误
export function TransactionCard({ transaction }) {
  // ...
}
```

### 组件命名规范

- 组件文件名使用 PascalCase：`TransactionCard.tsx`
- 组件名使用 PascalCase：`export function TransactionCard()`
- 工具函数文件名使用 kebab-case：`format.ts`
- 钩子文件名以 `use-` 开头：`use-color-scheme.ts`

### 样式使用指南

本项目混合使用 StyleSheet 和 NativeWind/Tailwind：

```typescript
// ✅ 使用 StyleSheet 定义复杂样式（推荐用于复杂布局和阴影）
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E0E5EC',
  },
});

// ✅ 使用 Tailwind 类名（推荐用于简单的间距、颜色、字体）
<View className="p-4 bg-blue-500 rounded-lg">
  <Text className="text-white font-bold">按钮</Text>
</View>
```

**样式偏好**：
- 使用 Tailwind 类名：`className="p-4 bg-blue-500"`
- 使用 StyleSheet：处理复杂的阴影、渐变、自定义属性
- 两者混用时，优先使用 Tailwind

### SafeAreaView 使用

必须从 `react-native-safe-area-context` 导入，而非 `react-native`：

```typescript
// ✅ 正确
import { SafeAreaView } from 'react-native-safe-area-context';

// ❌ 错误（会导致弃用警告）
import { SafeAreaView } from 'react-native';
```

### 数据库操作

使用 `useDatabase()` hook 获取数据库操作函数：

```typescript
const {
  getTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction,
} = useDatabase();
```

### 日期处理

使用 date-fns 进行日期操作，并使用中文本地化：

```typescript
import { format, addMonths, subMonths } from 'date-fns';
import { zhCN } from 'date-fns/locale';

// 格式化日期
format(date, 'yyyy年M月', { locale: zhCN }); // "2024年3月"
format(date, 'M月d日', { locale: zhCN });    // "3月10日"
```

### 错误处理

- 异步操作使用 try-catch
- 数据库错误应显示给用户
- 网络错误应提供重试选项

```typescript
const loadData = async () => {
  try {
    const data = await fetchSomeData();
    setData(data);
  } catch (error) {
    console.error('加载数据失败:', error);
    // 显示错误提示给用户
  }
};
```

### 路由导航

使用 expo-router 的 `useRouter()` hook：

```typescript
import { useRouter } from 'expo-router';

const router = useRouter();

router.push('/accounting/add');
router.back();
router.replace('/home');
```

### 图标使用

使用 lucide-react-native 图标库：

```typescript
import { Icon } from '@/components/ui/Icon';

<Icon name="plus" size={20} color="#10B981" />
```

### 颜色规范

使用一致的十六进制颜色值：

```typescript
// 主色
'#3B82F6'  // 蓝色
'#10B981'  // 绿色（成功）
'#EF4444'  // 红色（错误）

// 中性色
'#111827'  // 主要文本
'#6B7280'  // 次要文本
'#9CA3AF'  // 禁用文本
'#F3F4F6'  // 背景
```

### 代码组织

- **app/**: 使用 expo-router 的页面文件
- **components/**: 可复用组件
  - **ui/**: 通用 UI 组件（Button, Input, Card 等）
  - **domain/**: 特定领域组件
- **hooks/**: 自定义 React hooks
- **utils/**: 工具函数（格式化、验证等）
- **database/**: 数据库相关代码

### 函数式组件规范

- 使用函数式组件（非类组件）
- 解构 props 参数
- 使用 `useCallback` 和 `useMemo` 优化性能

```typescript
export function MyComponent({ id, title }: MyComponentProps) {
  const [value, setValue] = useState('');
  
  const handlePress = useCallback(() => {
    console.log('Pressed:', id);
  }, [id]);
  
  return (
    <View>
      <Text>{title}</Text>
    </View>
  );
}
```

### 文件命名

- TypeScript 文件：`.ts` 或 `.tsx`
- 测试文件：`.test.ts` 或 `.spec.ts`
- 配置文件：`.config.ts` 或 `.config.js`

### 国际化

项目使用中文作为主要语言：

- 日期显示使用中文格式
- 文本使用中文
- 货币使用 CNY

```typescript
formatCurrency(1234.56); // "¥1,235"
formatDate(date);        // "2024年3月10日"
```

## 注意事项

1. **SafeAreaView 警告**：不要从 `react-native` 导入 SafeAreaView，已通过配置抑制该警告
2. **新架构**：项目启用了 React Native 新架构
3. **React Compiler**：启用了 React 编译器进行自动优化
4. **类型检查**：TypeScript strict 模式已启用，确保所有代码通过类型检查
5. **代码格式化**：在提交前运行 `npm run lint` 检查代码质量
