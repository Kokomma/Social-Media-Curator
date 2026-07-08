import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";

import { Download, Trash2, FolderOpen } from "lucide-react-native";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import { useContent } from "@/providers/ContentProvider";
import { neumorphismColors, createNeumorphicStyle, createSoftNeumorphicStyle, createGlowNeumorphicStyle } from "@/constants/neumorphism";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function LibraryScreen() {
  const { library, removeFromLibrary } = useContent();
  const insets = useSafeAreaInsets();

  const handleDelete = (id: string) => {
    Alert.alert(
      "Delete Content",
      "Are you sure you want to delete this recreated content?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => removeFromLibrary(id)
        },
      ]
    );
  };

  const handleDownload = async (id: string) => {
    const item = library.find(item => item.id === id);
    if (!item) return;

    try {
      const base64Data = item.recreatedImage.split(',')[1];
      
      if (Platform.OS === 'web') {
        // Web download
        const link = document.createElement('a');
        link.href = item.recreatedImage;
        link.download = `recreated-content-${id}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        Alert.alert("Success", "Image downloaded to your Downloads folder!");
      } else {
        // Mobile save to gallery
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert("Permission Required", "Please grant permission to save images to your gallery.");
          return;
        }

        const filename = `recreated-content-${id}.png`;
        const fileUri = `${FileSystem.documentDirectory}${filename}`;
        
        await FileSystem.writeAsStringAsync(fileUri, base64Data, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        const asset = await MediaLibrary.createAssetAsync(fileUri);
        await MediaLibrary.createAlbumAsync('Recreated Content', asset, false);
        
        Alert.alert("Success", "Image saved to your gallery!");
      }
    } catch (error) {
      console.error("Error saving image:", error);
      Alert.alert("Error", "Failed to save image. Please try again.");
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={[styles.header, createGlowNeumorphicStyle()]}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>📚 ContentClone Library</Text>
          <Text style={styles.headerSubtitle}>
            {library.length} masterpiece{library.length === 1 ? "" : "s"} created
          </Text>
        </View>
      </View>

      {library.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyCard, createNeumorphicStyle()]}>
            <FolderOpen size={64} color={neumorphismColors.primary} />
            <Text style={styles.emptyTitle}>🎨 Your creative vault awaits!</Text>
            <Text style={styles.emptyText}>
              Transform content in the Create tab to fill your library
            </Text>
          </View>
        </View>
      ) : (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.grid}>
            {library.map((item) => (
              <View key={item.id} style={[styles.card, createSoftNeumorphicStyle()]}>
                <View style={styles.imageComparison}>
                  <View style={styles.imageWrapper}>
                    <Text style={styles.imageLabel}>Original</Text>
                    <Image
                      source={{ uri: item.originalImage }}
                      style={styles.image}
                      resizeMode="cover"
                    />
                  </View>
                  <View style={styles.imageWrapper}>
                    <Text style={styles.imageLabel}>Recreated</Text>
                    <Image
                      source={{ uri: item.recreatedImage }}
                      style={styles.image}
                      resizeMode="cover"
                    />
                  </View>
                </View>
                
                <Text style={styles.prompt} numberOfLines={2}>
                  {item.prompt}
                </Text>
                
                <Text style={styles.date}>
                  {new Date(item.createdAt).toLocaleDateString()}
                </Text>
                
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.downloadButton}
                    onPress={() => handleDownload(item.id)}
                  >
                    <Download size={18} color="#10B981" />
                    <Text style={styles.downloadText}>Save</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDelete(item.id)}
                  >
                    <Trash2 size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginHorizontal: 16,
    marginTop: 16,
  },
  headerContent: {
    gap: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold" as const,
    color: neumorphismColors.text.primary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: neumorphismColors.text.secondary,
  },
  scrollView: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
    fontWeight: "700" as const,
    color: neumorphismColors.text.primary,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: neumorphismColors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  grid: {
    padding: 16,
    gap: 16,
  },
  card: {
    padding: 16,
  },
  imageComparison: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  imageWrapper: {
    flex: 1,
  },
  imageLabel: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: neumorphismColors.text.muted,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  image: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 8,
    backgroundColor: neumorphismColors.surface,
  },
  prompt: {
    fontSize: 13,
    color: neumorphismColors.text.primary,
    lineHeight: 18,
    marginBottom: 8,
  },
  date: {
    fontSize: 12,
    color: neumorphismColors.text.muted,
    marginBottom: 12,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: neumorphismColors.tertiary + '40',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  downloadText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: neumorphismColors.secondary,
  },
  deleteButton: {
    backgroundColor: neumorphismColors.quaternary + '40',
    padding: 8,
    borderRadius: 8,
  },
  bottomSpacing: {
    height: 20,
  },
});
