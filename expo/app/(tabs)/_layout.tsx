import { Tabs } from "expo-router";
import { Home, Zap, FolderOpen, Settings } from "lucide-react-native";
import React from "react";
import { neumorphismColors } from "@/constants/neumorphism";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: neumorphismColors.primary,
        tabBarInactiveTintColor: neumorphismColors.text.muted,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: neumorphismColors.surface,
          elevation: 0,
          shadowOpacity: 0,
          borderTopColor: neumorphismColors.primary + '20',
          borderTopWidth: 2,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600" as const,
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="feed"
        options={{
          title: "Feed",
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: "Create",
          tabBarIcon: ({ color }) => <Zap size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: "Library",
          tabBarIcon: ({ color }) => <FolderOpen size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => <Settings size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
