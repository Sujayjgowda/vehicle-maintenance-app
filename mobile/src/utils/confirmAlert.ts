import { Alert, Platform } from 'react-native';

/**
 * Universal cross-platform confirmation dialog.
 * On Web: uses window.confirm to guarantee immediate callback execution.
 * On Native (iOS/Android): uses React Native's Alert.alert.
 */
export function confirmAction(
  title: string,
  message: string,
  onConfirm: () => void | Promise<void>,
  confirmText: string = 'Delete'
) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.confirm) {
      const ok = window.confirm(`${title}\n\n${message}`);
      if (ok) {
        onConfirm();
      }
    } else {
      onConfirm();
    }
  } else {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: confirmText,
        style: 'destructive',
        onPress: () => {
          onConfirm();
        },
      },
    ]);
  }
}
