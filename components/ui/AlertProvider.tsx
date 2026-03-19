import { ReactNode, createContext, useContext, useMemo, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

type AppAlertButtonStyle = 'default' | 'cancel' | 'destructive';

export interface AppAlertButton {
  text?: string;
  style?: AppAlertButtonStyle;
  onPress?: () => void;
}

export interface AppAlertOptions {
  cancelable?: boolean;
  onDismiss?: () => void;
}

interface AppAlertPayload {
  title: string;
  message?: string;
  buttons?: AppAlertButton[];
  options?: AppAlertOptions;
}

interface AppAlertContextValue {
  alert: (
    title: string,
    message?: string,
    buttons?: AppAlertButton[],
    options?: AppAlertOptions
  ) => void;
}

const AppAlertContext = createContext<AppAlertContextValue | undefined>(undefined);

function resolveButtons(buttons?: AppAlertButton[]) {
  if (!buttons || buttons.length === 0) {
    return [{ text: '确定', style: 'default' as AppAlertButtonStyle }];
  }
  return buttons;
}

function getButtonTextStyle(style: AppAlertButtonStyle | undefined) {
  if (style === 'destructive') return 'text-[#ef4444]';
  if (style === 'cancel') return 'text-[#6b7280]';
  return 'text-[#6366f1]';
}

export function AppAlertProvider({ children }: { children: ReactNode }) {
  const [currentAlert, setCurrentAlert] = useState<AppAlertPayload | null>(null);

  const contextValue = useMemo<AppAlertContextValue>(
    () => ({
      alert: (title, message, buttons, options) => {
        setCurrentAlert({ title, message, buttons, options });
      },
    }),
    []
  );

  const closeAlert = () => {
    setCurrentAlert(null);
  };

  const handleDismiss = () => {
    const onDismiss = currentAlert?.options?.onDismiss;
    closeAlert();
    onDismiss?.();
  };

  const handlePressButton = (button: AppAlertButton) => {
    closeAlert();
    button.onPress?.();
  };

  const buttons = resolveButtons(currentAlert?.buttons);
  const isMultiButtons = buttons.length > 2;
  const cancelable = currentAlert?.options?.cancelable ?? false;

  return (
    <AppAlertContext.Provider value={contextValue}>
      {children}
      <Modal
        visible={!!currentAlert}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (cancelable) {
            handleDismiss();
          }
        }}
      >
        <View className="flex-1 items-center justify-center bg-black/45 px-6">
          <Pressable
            className="absolute inset-0"
            onPress={() => {
              if (cancelable) {
                handleDismiss();
              }
            }}
          />
          <View
            className="w-full max-w-[360px] rounded-3xl bg-[#f0f0f3] px-5 py-5"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.2,
              shadowRadius: 24,
              elevation: 12,
            }}
          >
            <Text className="text-center text-lg font-semibold text-[#1a1a2e]">{currentAlert?.title}</Text>
            {!!currentAlert?.message && (
              <Text className="mt-3 text-center text-sm leading-6 text-[#4b5563]">{currentAlert.message}</Text>
            )}

            <View
              className={`${isMultiButtons ? 'mt-5' : 'mt-6'} ${isMultiButtons ? 'gap-2' : 'flex-row gap-3'}`}
            >
              {buttons.map((button, index) => (
                <Pressable
                  key={`${button.text ?? 'button'}-${index}`}
                  onPress={() => handlePressButton(button)}
                  className={`${isMultiButtons ? '' : 'flex-1'} items-center rounded-2xl px-4 py-3`}
                  style={{
                    backgroundColor: button.style === 'destructive' ? '#fee2e2' : '#e8e8ec',
                  }}
                >
                  <Text className={`text-sm font-semibold ${getButtonTextStyle(button.style)}`}>
                    {button.text ?? '确定'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </AppAlertContext.Provider>
  );
}

export function useAppAlert() {
  const context = useContext(AppAlertContext);
  if (!context) {
    throw new Error('useAppAlert must be used within AppAlertProvider');
  }
  return context;
}
