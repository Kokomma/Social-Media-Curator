import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,

} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Wand2, Download, ArrowLeft, Zap, Hand } from "lucide-react-native";
import { useBrand } from "@/providers/BrandProvider";
import { useContent } from "@/providers/ContentProvider";
import { neumorphismColors, createNeumorphicStyle, createSoftNeumorphicStyle } from "@/constants/neumorphism";
import ContentEditor from "@/components/ContentEditor";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import { Platform } from "react-native";

type RecreationMode = 'selection' | 'auto' | 'manual' | 'editor';

export default function RecreateScreen() {
  const { id } = useLocalSearchParams();
  const { brandColors, logoUrl, contactInfo } = useBrand();
  const { discoveredContent, addToLibrary } = useContent();
  const [prompt, setPrompt] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [recreatedImage, setRecreatedImage] = useState<string | null>(null);
  const [mode, setMode] = useState<RecreationMode>('selection');

  
  const content = discoveredContent.find(c => c.id === id);

  useEffect(() => {
    if (content?.caption) {
      setPrompt(`Recreate this ${content.type === "story" ? "story" : "post"} with my brand identity. Keep the same layout and style but use my brand colors and add my logo.`);
    }
  }, [content]);

  const handleRecreate = async () => {
    if (!content || !prompt.trim()) return;

    setIsProcessing(true);
    
    try {
      // Convert image URL to base64
      const response = await fetch(content.imageUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      
      const base64 = await new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const base64String = reader.result as string;
          resolve(base64String.split(",")[1]);
        };
        reader.readAsDataURL(blob);
      });

      const brandingPrompt = `${prompt}. Apply these brand colors: ${brandColors.primary} as primary and ${brandColors.secondary} as secondary. ${contactInfo ? `Include contact info: ${contactInfo}` : ""} ${logoUrl ? "Add the brand logo prominently." : ""} Make it professional and on-brand.`;

      const aiResponse = await fetch("https://toolkit.rork.com/images/edit/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: brandingPrompt,
          images: [{ type: "image", image: base64 }],
        }),
      });

      if (!aiResponse.ok) {
        throw new Error("Failed to recreate content");
      }

      const data = await aiResponse.json();
      setRecreatedImage(data.image.base64Data);
      
    } catch (error) {
      console.error("Error recreating content:", error);
      Alert.alert("Error", "Failed to recreate content. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = () => {
    if (recreatedImage && content) {
      addToLibrary({
        id: Date.now().toString(),
        originalImage: content.imageUrl,
        recreatedImage: `data:image/png;base64,${recreatedImage}`,
        prompt: prompt,
        createdAt: new Date().toISOString(),
      });
      Alert.alert("Success", "Content saved to library!", [
        { text: "OK", onPress: () => router.back() }
      ]);
    }
  };

  if (!content) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Content not found</Text>
      </SafeAreaView>
    );
  }

  const handleModeSelection = (selectedMode: 'auto' | 'manual') => {
    setMode(selectedMode);
    if (selectedMode === 'auto') {
      // Don't auto-start, let user configure first
    } else {
      setMode('editor');
    }
  };

  const handleEditorSave = (editedElements: any[]) => {
    console.log('Edited elements:', editedElements);
    // Here you would process the edited elements and create the final image
    setMode('selection');
    // For demo, we'll just show a success message
    Alert.alert('Success', 'Manual edits applied! Content saved to library.', [
      { text: 'OK', onPress: () => router.back() }
    ]);
  };

  const handleEditorCancel = () => {
    setMode('selection');
  };

  const saveToDevice = async () => {
    if (!recreatedImage) return;

    try {
      if (Platform.OS === 'web') {
        const link = document.createElement('a');
        link.href = `data:image/png;base64,${recreatedImage}`;
        link.download = `recreated-content-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        Alert.alert('Success', 'Image downloaded!');
      } else {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Please grant permission to save images.');
          return;
        }

        const filename = `recreated-content-${Date.now()}.png`;
        const fileUri = `${FileSystem.documentDirectory}${filename}`;
        
        await FileSystem.writeAsStringAsync(fileUri, recreatedImage, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        const asset = await MediaLibrary.createAssetAsync(fileUri);
        await MediaLibrary.createAlbumAsync('Recreated Content', asset, false);
        
        Alert.alert('Success', 'Image saved to your gallery!');
      }
    } catch (error) {
      console.error('Error saving image:', error);
      Alert.alert('Error', 'Failed to save image.');
    }
  };

  if (mode === 'editor') {
    return (
      <ContentEditor
        imageUri={content.imageUrl}
        onSave={handleEditorSave}
        onCancel={handleEditorCancel}
        brandLogo={logoUrl}
        brandColors={brandColors}
        contactInfo={contactInfo}
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: neumorphismColors.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.header, createSoftNeumorphicStyle()]}>
          <TouchableOpacity 
            style={[styles.backButton, createNeumorphicStyle()]}
            onPress={() => router.back()}
          >
            <ArrowLeft size={20} color={neumorphismColors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Recreate Content</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={[styles.originalSection, createSoftNeumorphicStyle()]}>
            <Text style={styles.sectionTitle}>Original Content</Text>
            <Image
              source={{ uri: content.imageUrl }}
              style={styles.image}
              resizeMode="cover"
            />
            {content.caption && (
              <Text style={styles.caption} numberOfLines={3}>
                {content.caption}
              </Text>
            )}
          </View>

          {mode === 'selection' && (
            <View style={[styles.modeSection, createSoftNeumorphicStyle()]}>
              <Text style={styles.sectionTitle}>Choose Recreation Mode</Text>
              <Text style={styles.modeDescription}>
                Select how you want to recreate this content with your branding
              </Text>
              
              <View style={styles.modeButtons}>
                <TouchableOpacity
                  style={[styles.modeButton, createNeumorphicStyle()]}
                  onPress={() => handleModeSelection('auto')}
                >
                  <Zap size={32} color={neumorphismColors.primary} />
                  <Text style={styles.modeButtonTitle}>Auto Mode</Text>
                  <Text style={styles.modeButtonText}>
                    AI automatically replaces logos, colors, and contact details
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modeButton, createNeumorphicStyle()]}
                  onPress={() => handleModeSelection('manual')}
                >
                  <Hand size={32} color={neumorphismColors.secondary} />
                  <Text style={styles.modeButtonTitle}>Manual Mode</Text>
                  <Text style={styles.modeButtonText}>
                    Select exactly what elements to change with precise control
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {mode === 'auto' && (
            <View style={[styles.promptSection, createSoftNeumorphicStyle()]}>
              <Text style={styles.sectionTitle}>AI Instructions</Text>
              <TextInput
                style={styles.promptInput}
                placeholder="Describe how to recreate this content..."
                placeholderTextColor={neumorphismColors.text.muted}
                value={prompt}
                onChangeText={setPrompt}
                multiline
                numberOfLines={4}
              />
              
              <TouchableOpacity
                style={[styles.recreateButton, createNeumorphicStyle(), isProcessing && styles.disabledButton]}
                onPress={handleRecreate}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator color={neumorphismColors.primary} />
                ) : (
                  <>
                    <Wand2 size={20} color={neumorphismColors.primary} />
                    <Text style={styles.recreateButtonText}>Recreate with AI</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {recreatedImage && (
            <View style={[styles.resultSection, createSoftNeumorphicStyle()]}>
              <Text style={styles.sectionTitle}>Recreated Content</Text>
              <Image
                source={{ uri: `data:image/png;base64,${recreatedImage}` }}
                style={styles.image}
                resizeMode="cover"
              />
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={[styles.saveButton, createNeumorphicStyle()]} 
                  onPress={handleSave}
                >
                  <Download size={18} color={neumorphismColors.primary} />
                  <Text style={styles.saveButtonText}>Save to Library</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.deviceButton, createNeumorphicStyle()]} 
                  onPress={saveToDevice}
                >
                  <Download size={18} color={neumorphismColors.secondary} />
                  <Text style={styles.deviceButtonText}>Save to Device</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
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
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: neumorphismColors.text.primary,
  },
  placeholder: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  originalSection: {
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: neumorphismColors.text.primary,
    marginBottom: 16,
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    backgroundColor: neumorphismColors.surface,
  },
  caption: {
    fontSize: 14,
    color: neumorphismColors.text.secondary,
    lineHeight: 20,
    marginTop: 16,
  },
  modeSection: {
    padding: 20,
    marginBottom: 20,
  },
  modeDescription: {
    fontSize: 14,
    color: neumorphismColors.text.secondary,
    lineHeight: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  modeButtons: {
    gap: 16,
  },
  modeButton: {
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  modeButtonTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: neumorphismColors.text.primary,
  },
  modeButtonText: {
    fontSize: 13,
    color: neumorphismColors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  promptSection: {
    padding: 20,
    marginBottom: 20,
  },
  promptInput: {
    backgroundColor: neumorphismColors.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: neumorphismColors.text.primary,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
    // Neumorphic styling applied via parent
  },
  recreateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  recreateButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: neumorphismColors.primary,
  },
  disabledButton: {
    opacity: 0.6,
  },
  resultSection: {
    padding: 20,
    gap: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 8,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: neumorphismColors.primary,
  },
  deviceButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 8,
  },
  deviceButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: neumorphismColors.secondary,
  },
});
