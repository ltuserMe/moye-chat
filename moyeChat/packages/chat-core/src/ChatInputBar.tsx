// import { useChatStore } from "@/stores/chat-store";
// import { Text } from "@lobehub/ui";
// import { ChatInputArea, ChatSendButton } from "@lobehub/ui/chat";
// import React from "react";

// const ChatInputBar = () => {
//   const {
//     inputValue,
//     setInputValue,
//     inputAttachments,
//     setInputAttachments,
//     send,
//     isSending,
//     cancel,
//   } = useChatStore();

//   const handleSend = () => {
//     if ((inputValue.trim() || inputAttachments.length > 0) && !isSending) {
//       send();
//     }
//   };

//   return (
//     <footer style={styles.root}>
//       <div style={styles.inner}>
//         <div style={styles.inputWrapper}>
//           <ChatInputArea
//             attachments={inputAttachments}
//             onAttachmentsChange={setInputAttachments}
//             bottomAddons={
//               isSending ? <Text type="secondary">正在生成回复。</Text> : null
//             }
//             expand={false}
//             heights={{
//               inputHeight: 60,
//               maxHeight: 240,
//               minHeight: 60,
//             }}
//             loading={isSending}
//             onInput={setInputValue}
//             onSend={handleSend}
//             placeholder="询问、整理、规划，或让 Agent 执行一次任务..."
//             value={inputValue}
//           />
//         </div>
//         <div style={styles.actions}>
//           <ChatSendButton
//             loading={isSending}
//             onSend={handleSend}
//             onStop={cancel}
//             texts={{ send: "发送", stop: "停止", warp: "换行" }}
//           />
//         </div>
//       </div>
//       <div style={styles.footerHint}>
//         <span>✨ 输入内容后按 Enter 发送 · Shift + Enter 换行</span>
//       </div>
//     </footer>
//   );
// };

// const styles: Record<string, React.CSSProperties> = {
//   root: {
//     background: "transparent",
//     padding: "0 24px 24px",
//     pointerEvents: "none",
//   },
//   inner: {
//     background: "#ffffff",
//     border: "1px solid rgba(0, 0, 0, 0.06)",
//     borderRadius: 24,
//     boxShadow: "0 12px 32px rgba(15,23,42,0.06), 0 2px 6px rgba(15,23,42,0.04)",
//     display: "flex",
//     flexDirection: "row",
//     alignItems: "flex-end",
//     gap: 12,
//     margin: "0 auto",
//     maxWidth: 860,
//     padding: "10px 16px",
//     pointerEvents: "auto",
//   },
//   inputWrapper: {
//     flex: 1,
//     minWidth: 0,
//   },
//   actions: {
//     flexShrink: 0,
//     paddingBottom: 4,
//   },
//   footerHint: {
//     color: "#a1a1aa",
//     fontSize: 12,
//     marginTop: 12,
//     pointerEvents: "auto",
//     textAlign: "center",
//     width: "100%",
//   },
// };

// export default ChatInputBar;