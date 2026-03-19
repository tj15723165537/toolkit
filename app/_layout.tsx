import {DarkTheme, DefaultTheme, ThemeProvider} from '@react-navigation/native';
import {Stack} from 'expo-router';
import {StatusBar} from 'expo-status-bar';
import {SafeAreaView} from 'react-native-safe-area-context';
import 'react-native-reanimated';
import '../global.css';
import {SQLiteProvider} from 'expo-sqlite';
import {initializeDatabase, migrateDatabase} from '@/database';
import {AppAlertProvider} from '@/components/ui/AlertProvider';

import {useColorScheme} from '@/hooks/use-color-scheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
      <SafeAreaView style={{flex: 1, backgroundColor: '#f5f5f5'}} edges={['top', 'left', 'right']}>
        <SQLiteProvider
            databaseName="toolkit.db"
            onInit={async (db) => {
              await initializeDatabase(db);
              await migrateDatabase(db);
            }}
        >
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <AppAlertProvider>
              <Stack screenOptions={{headerShown: false}}>
                <Stack.Screen name="index"/>
                <Stack.Screen name="accounting/index"/>
              </Stack>
              <StatusBar style="auto"/>
            </AppAlertProvider>
          </ThemeProvider>
        </SQLiteProvider>
      </SafeAreaView>
  );
}
