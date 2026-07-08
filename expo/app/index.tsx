import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { Redirect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBrand } from "@/providers/BrandProvider";
import { neumorphismColors } from "@/constants/neumorphism";

export default function Index() {
  const { isLoading, brandSetup } = useBrand();
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!isLoading) {
      // Small delay to prevent hydration mismatch
      const timer = setTimeout(() => {
        setShouldRedirect(true);
      }, 50);
      
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (isLoading || !shouldRedirect) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={neumorphismColors.primary} />
      </View>
    );
  }

  return <Redirect href={brandSetup ? "/(tabs)/feed" : "/onboarding"} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: neumorphismColors.background,
  },
});
