import type { ChatMessage, ConversationId } from "@agent-chat/chat-core";
import Markdown from "react-native-markdown-display";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";

export interface MobileChatScreenProps {
  conversationId?: ConversationId;
  messages: readonly ChatMessage[];
  inputValue: string;
  isSending?: boolean;
  onInputChange(value: string): void;
  onSend(): void;
  onCancel?(): void;
}

export function MobileChatScreen(props: MobileChatScreenProps): JSX.Element {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.root}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Agent Chat</Text>
        {props.isSending ? (
          <Pressable accessibilityRole="button" onPress={props.onCancel} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Stop</Text>
          </Pressable>
        ) : null}
      </View>

      <FlatList
        contentContainerStyle={styles.listContent}
        data={[...props.messages]}
        keyExtractor={(message) => message.id}
        renderItem={({ item }) => <MessageBubble message={item} />}
      />

      <View style={styles.composer}>
        <TextInput
          multiline
          onChangeText={props.onInputChange}
          placeholder="Message the agent"
          style={styles.input}
          value={props.inputValue}
        />
        <Pressable
          accessibilityRole="button"
          disabled={props.inputValue.trim().length === 0 || props.isSending}
          onPress={props.onSend}
          style={({ pressed }) => [
            styles.sendButton,
            (props.inputValue.trim().length === 0 || props.isSending) && styles.sendButtonDisabled,
            pressed && styles.sendButtonPressed
          ]}
        >
          <Text style={styles.sendText}>Send</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function MessageBubble({ message }: { message: ChatMessage }): JSX.Element {
  const isUser = message.role === "user";

  return (
    <View style={[styles.messageRow, isUser && styles.messageRowUser]}>
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        <Text style={[styles.role, isUser && styles.userRole]}>{message.role}</Text>
        {isUser ? (
          <Text style={styles.userContent}>{message.content}</Text>
        ) : (
          <Markdown style={markdownStyles}>{message.content}</Markdown>
        )}
        {message.toolCalls.map((toolCall) => (
          <View key={toolCall.id} style={styles.toolCard}>
            <Text style={styles.toolName}>{toolCall.name}</Text>
            <Text style={styles.toolStatus}>{toolCall.status}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#f7f8fa"
  },
  header: {
    minHeight: 56,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "space-between",
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#d1d5db",
    backgroundColor: "#ffffff"
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827"
  },
  cancelButton: {
    minHeight: 36,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "#fee2e2"
  },
  cancelText: {
    color: "#991b1b",
    fontWeight: "700"
  },
  listContent: {
    padding: 16,
    gap: 14
  },
  messageRow: {
    flexDirection: "row",
    justifyContent: "flex-start"
  },
  messageRowUser: {
    justifyContent: "flex-end"
  },
  bubble: {
    maxWidth: "86%",
    borderRadius: 8,
    padding: 14,
    gap: 8
  },
  userBubble: {
    backgroundColor: "#111827"
  },
  assistantBubble: {
    backgroundColor: "#ffffff",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#d1d5db"
  },
  role: {
    fontSize: 12,
    color: "#6b7280",
    textTransform: "uppercase"
  },
  userRole: {
    color: "#d1d5db"
  },
  userContent: {
    color: "#ffffff",
    fontSize: 16,
    lineHeight: 23
  },
  toolCard: {
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#f3f4f6",
    gap: 4
  },
  toolName: {
    color: "#111827",
    fontWeight: "700"
  },
  toolStatus: {
    color: "#2563eb"
  },
  composer: {
    flexDirection: "row",
    gap: 10,
    padding: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#d1d5db",
    backgroundColor: "#ffffff",
    alignItems: "flex-end"
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 140,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#9ca3af",
    borderRadius: 8,
    fontSize: 16,
    color: "#111827"
  },
  sendButton: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center"
  },
  sendButtonPressed: {
    opacity: 0.82
  },
  sendButtonDisabled: {
    backgroundColor: "#93c5fd"
  },
  sendText: {
    color: "#ffffff",
    fontWeight: "700"
  }
});

const markdownStyles = StyleSheet.create({
  body: {
    color: "#111827",
    fontSize: 16,
    lineHeight: 23
  },
  code_inline: {
    backgroundColor: "#f3f4f6",
    borderRadius: 4,
    paddingHorizontal: 4
  },
  fence: {
    backgroundColor: "#111827",
    color: "#f9fafb",
    borderRadius: 8,
    padding: 10
  }
});
