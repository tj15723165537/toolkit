# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个使用 Expo 构建的 React Native 工具集应用，目前主要包含记账本功能，计划扩展番茄钟、习惯打卡、心情日记等工具。

## 常用命令

```bash
# 启动开发服务器
npm start

# 启动开发服务器（使用 tunnel）
npm run start-t

# 运行在特定平台
npm run android
npm run ios
npm run web

# 代码检查
npm run lint

# 重置项目（移除示例代码）
npm run reset-project
```

## 技术栈

- **框架**: Expo (React Native 0.81.5) + Expo Router v6
- **语言**: TypeScript
- **样式**: NativeWind (Tailwind CSS for React Native)
- **数据库**: expo-sqlite (本地 SQLite 数据库)
- **日期处理**: date-fns
- **图标**: lucide-react-native, @expo/vector-icons
- **图表**: react-native-chart-kit

## 项目架构

### 路由结构

项目使用 Expo Router 的基于文件的路由系统：

- `app/index.tsx` - 主页（工具集网格）
- `app/_layout.tsx` - 根布局，提供 SQLiteProvider 和 ThemeProvider
- `app/accounting/index.tsx` - 记账本列表页
- `app/accounting/add.tsx` - 添加记账页
- `app/accounting/report.tsx` - 记账统计报告页

### 数据库层

`database/schema.ts` - 数据库初始化和迁移
- `initializeDatabase()` - 创建表并启用 WAL 模式
- `migrateDatabase()` - 数据库迁移
- 表结构：transactions, categories, budgets

`database/hooks.ts`` - 数据库操作钩子
- `useDatabase()` - 提供所有数据库操作方法
- 主要方法：addTransaction, getTransactions, deleteTransaction, updateTransaction, getMonthlySummary, getCategorySummary, getRecentMonthsSummary, getCategories, addCategory, deleteCategory

### 类型定义

`types/index.ts` - 全局类型定义
- `Transaction` - 交易记录
- `Category` - 分类
- `MonthlySummary` - 月度汇总
- `Tool` - 工具项

### 工具函数

`utils/format.ts` - 格式化工具
- `formatCurrency()` - 货币格式化（支持万/亿）
- `formatDate()` / `formatDateChinese()` - 日期格式化
- `formatMonthKey()` - 月度 key 格式化 (YYYY-MM)
- `groupByDate()` - 按日期分组交易

`utils/constants.ts` - 常量定义
- `CATEGORIES` - 默认分类（支出和收入）
- `TOOLS` - 工具列表
- `MONTHS` - 月份名称

### 组件结构

- `components/ui/` - 通用 UI 组件（Button, Card, Icon, Input 等）
- `components/accounting/` - 记账相关组件（AccountingHeader, SummaryCard, TransactionCard）

## 开发注意事项

### 数据库操作

- 所有数据库操作通过 `useDatabase()` hook 进行
- 日期存储使用 ISO 字符串格式
- 月份查询使用 `strftime('%Y-%m', date)` 过滤

### 样式

- 使用 NativeWind (Tailwind CSS 类名)
- 同时也支持 StyleSheet（主要在记账页面）
- 颜色定义在 `constants/theme.ts` 中，支持深色/浅色模式

### 图表

- 使用 react-native-chart-kit 进行数据可视化
- 图表配置使用 `constants/theme.ts` 中的颜色

### 国际化

- 日期本地化使用 date-fns 的 zhCN locale
- 货币格式化使用 Intl.NumberFormat('zh-CN')

### 页面

- 页面能拆分的尽量拆分，复用太多不利于维护