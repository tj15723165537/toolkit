import { Stack, useRouter, useSegments } from 'expo-router';
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useSecureStore } from '@/hooks/useSecureStore';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';
import { generateKey, decrypt } from '@/utils/crypto';
import { useDatabase } from '@/database/hooks';
import { Password, DecryptedPassword } from '@/types';

interface AuthContextType {
  masterKey: string | null;
  setMasterKey: (key: string | null) => void;
  decryptPassword: (password: Password) => DecryptedPassword;
  isUnlocked: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within PasswordAuthProvider');
  }
  return context;
}

function PasswordAuthProvider({ children }: { children: ReactNode }) {
  const [masterKey, setMasterKey] = useState<string | null>(null);
  const { hasMasterPassword, getSessionTimeout, setSessionTimeout } = useSecureStore();
  const { isAvailable } = useBiometricAuth();
  const { getPasswords } = useDatabase();
  const router = useRouter();
  const segments = useSegments();
  const [isLoading, setIsLoading] = useState(true);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    checkBiometric();
  }, []);

  const checkBiometric = async () => {
    const available = await isAvailable();
    setBiometricAvailable(available);
  };

  // Check session status
  useEffect(() => {
    checkSession();
  }, [segments]);

  const checkSession = async () => {
    const hasPassword = await hasMasterPassword();

    if (!hasPassword) {
      // First time setup
      if (segments[segments.length - 1] !== 'setup') {
        router.replace('/password/setup');
      }
      setIsLoading(false);
      return;
    }

    // If masterKey exists, user is already unlocked
    if (masterKey) {
      setIsLoading(false);
      return;
    }

    // Check if we have an active session
    const sessionTimeout = await getSessionTimeout();
    const now = Date.now();

    // Session expires after 5 minutes of inactivity
    const SESSION_DURATION = 5 * 60 * 1000;

    if (sessionTimeout && now - sessionTimeout < SESSION_DURATION) {
      // Session is still valid but masterKey was cleared (app restart)
      // Need to unlock to restore the key
    }

    // Need to unlock
    if (segments[segments.length - 1] !== 'unlock') {
      router.replace('/password/unlock');
    }
    setIsLoading(false);
  };

  // Update session timeout on activity
  useEffect(() => {
    if (masterKey) {
      const updateTimeout = () => {
        setSessionTimeout(Date.now());
      };

      const interval = setInterval(updateTimeout, 60000); // Update every minute

      return () => clearInterval(interval);
    }
  }, [masterKey]);

  const decryptPassword = (password: Password): DecryptedPassword => {
    if (!masterKey) {
      throw new Error('Master key not available');
    }
    try {
      const decrypted = decrypt(password.password, masterKey);
      return {
        ...password,
        password: decrypted,
      };
    } catch (error) {
      throw new Error('Failed to decrypt password');
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background" style={{ backgroundColor: '#f5f5f5' }}>
        <ActivityIndicator size="large" className="text-primary" />
      </View>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        masterKey,
        setMasterKey,
        decryptPassword,
        isUnlocked: !!masterKey,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default function PasswordLayout() {
  return (
    <PasswordAuthProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="setup" options={{ gestureEnabled: false }} />
        <Stack.Screen name="unlock" options={{ gestureEnabled: false }} />
        <Stack.Screen name="index" />
        <Stack.Screen name="add" />
        <Stack.Screen name="detail" />
        <Stack.Screen name="edit" />
      </Stack>
    </PasswordAuthProvider>
  );
}
