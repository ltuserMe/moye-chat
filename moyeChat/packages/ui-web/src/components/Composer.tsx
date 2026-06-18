"use client";

import { Text } from "@lobehub/ui";
import { ChatInputArea, ChatSendButton } from "@lobehub/ui/chat";

interface ChatComposerProps {
  value: string;
  isSending?: boolean;
  onInputChange(value: string): void;
  onSend(): void;
  onCancel?(): void;
}

export function ChatComposer(props: ChatComposerProps) {
  return (
    <footer style={styles.root}>
      <div style={styles.inner}>
        <ChatInputArea
          bottomAddons={
            props.isSending ? <Text type="secondary">Assistant is streaming a response.</Text> : null
          }
          loading={props.isSending}
          onInput={props.onInputChange}
          onSend={props.onSend}
          placeholder="Message the agent"
          value={props.value}
        />
        <ChatSendButton
          loading={props.isSending}
          onSend={props.onSend}
          onStop={props.onCancel}
          texts={{ send: "Send", stop: "Stop", warp: "Enter to send" }}
        />
      </div>
    </footer>
  );
}

const styles = {
  root: {
    background: "#ffffff",
    borderTop: "1px solid #e5e7eb",
    padding: 16
  },
  inner: {
    display: "grid",
    gap: 12,
    gridTemplateColumns: "minmax(0, 1fr) auto",
    margin: "0 auto",
    maxWidth: 980
  }
};
