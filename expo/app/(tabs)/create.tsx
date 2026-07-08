import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Upload, Wand2, Download, X, Share, Settings, Zap } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import { useBrand } from "@/providers/BrandProvider";
import { useContent } from "@/providers/ContentProvider";
import { neumorphismColors, createNeumorphicStyle, createSoftNeumorphicStyle, createGlowNeumorphicStyle } from "@/constants/neumorphism";
import ContentEditor from "@/components/ContentEditor";

type CreationMode = 'auto' | 'manual';

export default function CreateScreen() {
  const { brandColors, logoUrl, contactInfo } = useBrand();
  const { addToLibrary } = useContent();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const [prompt, setPrompt] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [creationMode, setCreationMode] = useState<CreationMode>('auto');

  const [showManualEditor, setShowManualEditor] = useState(false);
  const insets = useSafeAreaInsets();

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      if (asset.base64) {
        setSelectedImage(asset.base64);

        setProcessedImage(null);
      }
    }
  };

  const recreateWithBranding = async () => {
    if (!selectedImage || !prompt.trim()) {
      Alert.alert("Missing Information", "Please select an image and describe what you want to recreate");
      return;
    }

    if (creationMode === 'manual') {
      setShowManualEditor(true);
      return;
    }

    setIsProcessing(true);
    
    try {
      // Create comprehensive branding prompt with logo instructions
      let brandingPrompt = `${prompt}. Apply these brand colors: ${brandColors.primary} as primary and ${brandColors.secondary} as secondary.`;
      
      if (contactInfo) {
        brandingPrompt += ` Replace any contact information with: ${contactInfo}.`;
      }
      
      if (logoUrl) {
        brandingPrompt += ` Replace any existing logos or brand marks with the provided brand logo. Make sure the logo is prominently displayed and properly integrated into the design.`;
      }
      
      brandingPrompt += ` Make it professional, cohesive, and on-brand while maintaining the original layout and composition.`;

      // Prepare images array - include logo if available
      const images = [{ type: "image", image: selectedImage }];
      
      if (logoUrl && logoUrl.startsWith('data:image')) {
        // Extract base64 from logo data URI
        const logoBase64 = logoUrl.split(',')[1];
        images.push({ type: "image", image: logoBase64 });
        brandingPrompt += ` Use the second image as the brand logo to replace existing logos.`;
      }

      const response = await fetch("https://toolkit.rork.com/images/edit/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: brandingPrompt,
          images: images,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to process image");
      }

      const data = await response.json();
      setProcessedImage(data.image.base64Data);
      
    } catch (error) {
      console.error("Error processing image:", error);
      Alert.alert("Error", "Failed to recreate content. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const saveToLibrary = () => {
    if (processedImage) {
      addToLibrary({
        id: Date.now().toString(),
        originalImage: `data:image/png;base64,${selectedImage}`,
        recreatedImage: `data:image/png;base64,${processedImage}`,
        prompt: prompt,
        createdAt: new Date().toISOString(),
      });
      Alert.alert("Success", "Content saved to library!");
      setSelectedImage(null);
      setProcessedImage(null);
      setPrompt("");
    }
  };

  const saveToDevice = async () => {
    if (!processedImage) return;

    try {
      if (Platform.OS === 'web') {
        // Web download
        const link = document.createElement('a');
        link.href = `data:image/png;base64,${processedImage}`;
        link.download = `recreated-content-${Date.now()}.png`;
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

        const filename = `recreated-content-${Date.now()}.png`;
        const fileUri = `${FileSystem.documentDirectory}${filename}`;
        
        await FileSystem.writeAsStringAsync(fileUri, processedImage, {
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
          <Text style={styles.headerTitle}>🚀 ContentClone Pro</Text>
          <Text style={styles.headerSubtitle}>
            Transform any content into your brand masterpiece
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {!selectedImage ? (
            <TouchableOpacity 
              style={[styles.uploadBox, createNeumorphicStyle()]} 
              onPress={pickImage}
            >
              <Upload size={48} color={neumorphismColors.primary} />
              <Text style={styles.uploadTitle}>⚡ Upload & Transform</Text>
              <Text style={styles.uploadText}>
                Drop your content here and watch the magic happen!
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.imageContainer, createSoftNeumorphicStyle()]}>
              <Image
                source={{ uri: `data:image/png;base64,${selectedImage}` }}
                style={styles.selectedImage}
                resizeMode="cover"
              />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => {
                  setSelectedImage(null);
                  setProcessedImage(null);
                  setPrompt("");
                }}
              >
                <X size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}

          {selectedImage && (
            <View style={[styles.promptContainer, createSoftNeumorphicStyle()]}>
              <Text style={styles.label}>Describe what to recreate:</Text>
              <TextInput
                style={[styles.promptInput, createSoftNeumorphicStyle()]}
                placeholder="e.g., Keep the same layout but change text to my brand name, use my colors..."
                placeholderTextColor={neumorphismColors.text.muted}
                value={prompt}
                onChangeText={setPrompt}
                multiline
                numberOfLines={3}
              />

              <View style={styles.modeContainer}>
                <Text style={styles.modeLabel}>Creation Mode:</Text>
                <View style={styles.modeButtons}>
                  <TouchableOpacity
                    style={[
                      styles.modeButton,
                      createNeumorphicStyle(),
                      creationMode === 'auto' && styles.activeModeButton
                    ]}
                    onPress={() => setCreationMode('auto')}
                  >
                    <Zap size={16} color={creationMode === 'auto' ? neumorphismColors.primary : neumorphismColors.text.secondary} />
                    <Text style={[
                      styles.modeButtonText,
                      creationMode === 'auto' && styles.activeModeButtonText
                    ]}>🔥 Auto</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.modeButton,
                      createNeumorphicStyle(),
                      creationMode === 'manual' && styles.activeModeButton
                    ]}
                    onPress={() => setCreationMode('manual')}
                  >
                    <Settings size={16} color={creationMode === 'manual' ? neumorphismColors.primary : neumorphismColors.text.secondary} />
                    <Text style={[
                      styles.modeButtonText,
                      creationMode === 'manual' && styles.activeModeButtonText
                    ]}>🎯 Manual</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.recreateButton, createNeumorphicStyle(), isProcessing && styles.disabledButton]}
                onPress={recreateWithBranding}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator color={neumorphismColors.primary} />
                ) : (
                  <>
                    <Wand2 size={20} color={neumorphismColors.primary} />
                    <Text style={styles.buttonText}>
                      {creationMode === 'auto' ? '🚀 Auto Recreate' : '🎨 Manual Edit'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {processedImage && (
            <View style={[styles.resultContainer, createSoftNeumorphicStyle()]}>
              <Text style={styles.resultTitle}>✨ Your Brand Masterpiece</Text>
              <Image
                source={{ uri: `data:image/png;base64,${processedImage}` }}
                style={styles.resultImage}
                resizeMode="cover"
              />
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={[styles.saveButton, createNeumorphicStyle()]} 
                  onPress={saveToLibrary}
                >
                  <Download size={18} color={neumorphismColors.primary} />
                  <Text style={styles.saveButtonText}>📚 Library</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.deviceButton, createNeumorphicStyle()]} 
                  onPress={saveToDevice}
                >
                  <Share size={18} color={neumorphismColors.secondary} />
                  <Text style={styles.deviceButtonText}>💾 Device</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showManualEditor}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        {selectedImage && (
          <ContentEditor
            imageUri={`data:image/png;base64,${selectedImage}`}
            brandLogo={logoUrl}
            brandColors={brandColors}
            contactInfo={contactInfo}
            onSave={(processedImageBase64) => {
              console.log('Manual edit completed');
              setProcessedImage(processedImageBase64);
              setShowManualEditor(false);
              Alert.alert('Success', 'Manual edits applied! The content has been processed.');
            }}
            onCancel={() => setShowManualEditor(false)}
          />
        )}
      </Modal>
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
    fontWeight: 'bold' as const,
    color: neumorphismColors.text.primary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: neumorphismColors.text.secondary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  uploadBox: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  uploadTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: neumorphismColors.text.primary,
  },
  uploadText: {
    fontSize: 14,
    color: neumorphismColors.text.secondary,
    textAlign: 'center',
  },
  imageContainer: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    padding: 8,
  },
  selectedImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
  },
  removeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  promptContainer: {
    marginTop: 20,
    padding: 20,
    gap: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: neumorphismColors.text.primary,
  },
  promptInput: {
    backgroundColor: neumorphismColors.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: neumorphismColors.text.primary,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  recreateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
    marginTop: 16,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: neumorphismColors.primary,
  },
  resultContainer: {
    marginTop: 20,
    padding: 20,
    gap: 16,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: neumorphismColors.text.primary,
  },
  resultImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    backgroundColor: neumorphismColors.surface,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flex: 1,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: neumorphismColors.primary,
  },
  deviceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flex: 1,
  },
  deviceButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: neumorphismColors.secondary,
  },
  modeContainer: {
    marginBottom: 16,
  },
  modeLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: neumorphismColors.text.primary,
    marginBottom: 12,
  },
  modeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  activeModeButton: {
    backgroundColor: neumorphismColors.surface,
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: neumorphismColors.text.secondary,
  },
  activeModeButtonText: {
    color: neumorphismColors.primary,
  },
});
