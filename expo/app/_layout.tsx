import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { BrandProvider } from "@/providers/BrandProvider";
import { ContentProvider } from "@/providers/ContentProvider";
import { neumorphismColors } from "@/constants/neumorphism";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen 
        name="onboarding" 
        options={{ 
          headerShown: false,
          presentation: "modal",
          animation: "slide_from_bottom"
        }} 
      />
      <Stack.Screen 
        name="recreate/[id]" 
        options={{ 
          title: "Recreate Content",
          presentation: "modal"
        }} 
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    
    const prepare = async () => {
      try {
        timeoutId = setTimeout(() => {
          setIsReady(true);
          SplashScreen.hideAsync();
        }, 100);
      } catch (e) {
        console.warn(e);
        setIsReady(true);
        SplashScreen.hideAsync();
      }
    };

    prepare();
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={neumorphismColors.primary} />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={styles.container}>
        <BrandProvider>
          <ContentProvider>
            <RootLayoutNav />
          </ContentProvider>
        </BrandProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: neumorphismColors.background,
  },
});
