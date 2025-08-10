import React from "react";
import { View, StyleSheet, Dimensions, ScrollView } from "react-native";
import RenderHtml from "react-native-render-html";

const { width } = Dimensions.get("window");

export default function ProductDescription({ html }: { html: string }) {
  return (
    <ScrollView style={styles.container}>
      <RenderHtml contentWidth={width} source={{ html }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
});
