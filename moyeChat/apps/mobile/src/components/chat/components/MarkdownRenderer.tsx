import type { ReactElement } from "react";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import Markdown from "react-native-markdown-display";
import { Copy, Check } from "lucide-react-native";

import { mobileTokens as tokens } from "@/components/chat/theme/tokens";

export function MarkdownRenderer({
  content
}: {
  content: string;
}): ReactElement {
  return (
    <Markdown style={mdStyles}>{content}</Markdown>
  );
}

/**
 * 单独导出的代码块组件 — 带复制 icon
 * 用于在 AssistantMessage 中手动渲染代码块
 */
export function CodeBlockWithCopy({
  code,
  language
}: {
  code: string;
  language?: string;
}): ReactElement {
  const [copied, setCopied] = useState(false);

  return (
    <View style={cs.wrap}>
      <View style={cs.header}>
        <Text style={cs.lang}>{language ?? "code"}</Text>
        <Pressable
          onPress={async () => {
            await Clipboard.setStringAsync(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          style={cs.copyBtn}
        >
          {copied ? (
            <Check size={12} color="rgba(255,255,255,0.7)" strokeWidth={2.5} />
          ) : (
            <Copy size={12} color="rgba(255,255,255,0.5)" strokeWidth={2} />
          )}
        </Pressable>
      </View>
      <View style={cs.body}>
        <Text style={cs.codeText}>{code}</Text>
      </View>
    </View>
  );
}

const mdStyles = StyleSheet.create({
  body: {
    color: tokens.color.text,
    fontSize: tokens.typography.body.fontSize,
    lineHeight: tokens.typography.body.lineHeight,
    margin: 0
  },
  code_inline: {
    backgroundColor: "#f1f3f4",
    paddingHorizontal: 3,
    paddingVertical: 1
  },
  fence: {
    backgroundColor: "#1e1e1e",
    borderRadius: tokens.radius.sm,
    color: "#f9fafb",
    padding: 12,
    fontFamily: "monospace",
    fontSize: 12,
    lineHeight: 18
  },
  paragraph: {
    marginBottom: 6,
    marginTop: 0
  }
});

const cs = StyleSheet.create({
  wrap: {
    backgroundColor: "#1e1e1e",
    borderRadius: tokens.radius.sm,
    marginVertical: 6,
    overflow: "hidden" as const
  },
  header: {
    alignItems: "center" as const,
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    borderBottomColor: "rgba(255,255,255,0.08)",
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 4
  },
  lang: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11
  },
  copyBtn: {
    padding: 6,
    borderRadius: 4
  },
  body: {
    padding: 12
  },
  codeText: {
    color: "#f9fafb",
    fontFamily: "monospace" as const,
    fontSize: 12,
    lineHeight: 18
  }
});
