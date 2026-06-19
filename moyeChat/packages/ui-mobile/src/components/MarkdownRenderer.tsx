import type { ReactElement } from "react";
import Markdown from "react-native-markdown-display";
import { StyleSheet } from "react-native";

import { mobileTokens as tokens } from "../theme/tokens";

export function MarkdownRenderer({ content }: { content: string }): ReactElement {
  return <Markdown style={markdownStyles}>{content}</Markdown>;
}

const markdownStyles = StyleSheet.create({
  body: {
    color: tokens.color.text,
    fontSize: tokens.typography.body.fontSize,
    lineHeight: tokens.typography.body.lineHeight,
    margin: 0
  },
  code_inline: {
    backgroundColor: "#f1f3f4",
    borderRadius: 4,
    paddingHorizontal: 4
  },
  fence: {
    backgroundColor: "#1e1e1e",
    borderRadius: tokens.radius.sm,
    color: "#f9fafb",
    padding: 10
  },
  paragraph: {
    marginBottom: 6,
    marginTop: 0
  }
});
