import { MobileChatScreen } from '@agent-chat/ui-mobile';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useChatStore } from '@/stores/chat-store';

export default function HomeScreen() {
  const messages = useChatStore((state) => state.activeMessages);
  const inputValue = useChatStore((state) => state.inputValue);
  const isSending = useChatStore((state) => state.isSending);
  const setInputValue = useChatStore((state) => state.setInputValue);
  const send = useChatStore((state) => state.send);
  const cancel = useChatStore((state) => state.cancel);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <MobileChatScreen
        inputValue={inputValue}
        isSending={isSending}
        messages={messages}
        onCancel={cancel}
        onInputChange={setInputValue}
        onSend={send}
      />
    </SafeAreaView>
  );
}
