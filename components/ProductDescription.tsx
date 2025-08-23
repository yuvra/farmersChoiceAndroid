import React from "react";
import { Dimensions, ScrollView, StyleSheet } from "react-native";
import Markdown from "react-native-markdown-display";

const { width } = Dimensions.get("window");

export default function ProductDescription({ markdown }: { markdown: string }) {
  return (
    <ScrollView style={styles.container}>
      <Markdown style={mdStyles}>{markdown}</Markdown>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
});

const mdStyles: any = {
  body: { color: "#222", fontSize: 10, lineHeight: 20 },

  // Smaller headers
  heading1: {
    fontSize: 10,
    marginTop: 8,
    marginBottom: 6,
    fontWeight: "700",
    color: "#333",
  },
  heading2: {
    fontSize: 10,
    marginTop: 6,
    marginBottom: 4,
    fontWeight: "600",
    color: "#444",
  },

  strong: { fontWeight: "700" },
  em: { fontStyle: "italic" },

  code_inline: {
    backgroundColor: "#f1f1f1",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontFamily: "monospace",
  },
  code_block: {
    backgroundColor: "#f6f8fa",
    padding: 12,
    borderRadius: 8,
    fontFamily: "monospace",
  },

  list_item: { marginVertical: 2 },
  link: { color: "#1e88e5" },

  // Table improvements
  table: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    marginVertical: 8,
  },
  th: {
    backgroundColor: "#f2f2f2",
    padding: 6,
    fontWeight: "700",
    fontSize: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    textAlign: "left",
  },
  td: {
    padding: 6,
    fontSize: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    textAlign: "left",
  },
  image: { borderRadius: 6, marginVertical: 8, maxWidth: width - 32 },
};
