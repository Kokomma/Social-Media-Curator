import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";


import { Eye, Heart, MessageCircle, Repeat2, Settings as SettingsIcon } from "lucide-react-native";
import { router } from "expo-router";
import { useBrand } from "@/providers/BrandProvider";
import { useContent } from "@/providers/ContentProvider";
import { mockInstagramPosts } from "@/mocks/instagram-data";
import { neumorphismColors, createNeumorphicStyle, createSoftNeumorphicStyle, createGlowNeumorphicStyle } from "@/constants/neumorphism";


export default function FeedScreen() {
  const { isLoading: brandLoading, brandSetup } = useBrand();
  const { isLoading: contentLoading, monitoredAccounts, discoveredContent, addDiscoveredContent } = useContent();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!brandLoading && !brandSetup) {
      router.replace("/onboarding");
    }
  }, [brandLoading, brandSetup]);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    const loadContent = async () => {
      setLoading(true);
      timeoutId = setTimeout(() => {
        monitoredAccounts.forEach(account => {
          const accountPosts = mockInstagramPosts
            .filter(post => post.username === account.username)
            .slice(0, 3);
          
          accountPosts.forEach(post => {
            if (!discoveredContent.find(c => c.id === post.id)) {
              addDiscoveredContent(post);
            }
          });
        });
        setLoading(false);
      }, 1500);
    };
    loadContent();
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [monitoredAccounts, discoveredContent, addDiscoveredContent]);

  const handleRecreate = (contentId: string) => {
    router.push(`/recreate/${contentId}`);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  if (brandLoading || contentLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <View style={[styles.loadingCard, createNeumorphicStyle()]}>
            <ActivityIndicator size="large" color={neumorphismColors.primary} />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        </View>
      </View>
    );
  }

  if (!brandSetup) {
    return null;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={[styles.header, createGlowNeumorphicStyle()]}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>🔥 ContentClone Feed</Text>
          <Text style={styles.headerSubtitle}>
            Monitoring {monitoredAccounts.length} account{monitoredAccounts.length !== 1 ? "s" : ""} for fresh content
          </Text>
        </View>
        <TouchableOpacity 
          style={[styles.settingsButton, createNeumorphicStyle()]}
          onPress={() => router.push('/(tabs)/settings')}
        >
          <SettingsIcon size={20} color={neumorphismColors.text.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <View style={[styles.loadingCard, createNeumorphicStyle()]}>
            <ActivityIndicator size="large" color={neumorphismColors.primary} />
            <Text style={styles.loadingText}>Discovering content...</Text>
          </View>
        </View>
      ) : discoveredContent.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyCard, createNeumorphicStyle()]}>
            <Repeat2 size={64} color={neumorphismColors.text.muted} />
            <Text style={styles.emptyTitle}>🔍 No content discovered yet</Text>
            <Text style={styles.emptyText}>
              {monitoredAccounts.length === 0 
                ? "⚙️ Add Instagram accounts to monitor in Settings"
                : "🔄 Pull down to refresh and discover new content"}
            </Text>
            <TouchableOpacity 
              style={[styles.refreshButton, createNeumorphicStyle()]}
              onPress={handleRefresh}
              disabled={refreshing}
            >
              <Text style={styles.refreshButtonText}>
                {refreshing ? "Refreshing..." : "Refresh"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {discoveredContent.map((content) => (
            <View key={content.id} style={[styles.postCard, createSoftNeumorphicStyle()]}>
              <View style={styles.postHeader}>
                <Image 
                  source={{ uri: content.profileImage }} 
                  style={styles.profileImage}
                />
                <View style={styles.postHeaderText}>
                  <Text style={styles.username}>{content.username}</Text>
                  <Text style={styles.timestamp}>{content.timestamp}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.recreateButton, createNeumorphicStyle()]}
                  onPress={() => handleRecreate(content.id)}
                >
                  <Repeat2 size={16} color={neumorphismColors.primary} />
                  <Text style={styles.recreateText}>✨ Clone</Text>
                </TouchableOpacity>
              </View>

              <Image 
                source={{ uri: content.imageUrl }} 
                style={styles.postImage}
                resizeMode="cover"
              />

              {content.caption && (
                <Text style={styles.caption} numberOfLines={3}>
                  {content.caption}
                </Text>
              )}

              <View style={styles.postStats}>
                <View style={styles.statItem}>
                  <Heart size={16} color={neumorphismColors.text.muted} />
                  <Text style={styles.statText}>{content.likes}</Text>
                </View>
                <View style={styles.statItem}>
                  <MessageCircle size={16} color={neumorphismColors.text.muted} />
                  <Text style={styles.statText}>{content.comments}</Text>
                </View>
                <View style={styles.statItem}>
                  <Eye size={16} color={neumorphismColors.text.muted} />
                  <Text style={styles.statText}>{content.views || "N/A"}</Text>
                </View>
              </View>
            </View>
          ))}
          <View style={styles.bottomSpacing} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: neumorphismColors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginHorizontal: 16,
    marginTop: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: neumorphismColors.text.primary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: neumorphismColors.text.secondary,
  },
  settingsButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingCard: {
    padding: 32,
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: neumorphismColors.text.secondary,
    fontWeight: '500' as const,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyCard: {
    padding: 32,
    alignItems: 'center',
    gap: 16,
    maxWidth: 300,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: neumorphismColors.text.primary,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: neumorphismColors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  refreshButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 8,
  },
  refreshButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: neumorphismColors.primary,
  },
  postCard: {
    marginHorizontal: 16,
    marginTop: 16,
    overflow: 'hidden',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  profileImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  postHeaderText: {
    flex: 1,
    marginLeft: 12,
  },
  username: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: neumorphismColors.text.primary,
  },
  timestamp: {
    fontSize: 13,
    color: neumorphismColors.text.muted,
    marginTop: 2,
  },
  recreateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  recreateText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: neumorphismColors.primary,
  },
  postImage: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: neumorphismColors.surface,
  },
  caption: {
    fontSize: 14,
    color: neumorphismColors.text.primary,
    lineHeight: 20,
    padding: 16,
  },
  postStats: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 24,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 13,
    color: neumorphismColors.text.muted,
    fontWeight: '500' as const,
  },
  bottomSpacing: {
    height: 20,
  },
});
