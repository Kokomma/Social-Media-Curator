import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Palette, Upload, Phone, ArrowRight, X } from "lucide-react-native";
import { router } from "expo-router";
import { useBrand } from "@/providers/BrandProvider";
import { neumorphismColors, createNeumorphicStyle, createSoftNeumorphicStyle } from "@/constants/neumorphism";
import * as ImagePicker from "expo-image-picker";

export default function OnboardingScreen() {
  const { setupBrand } = useBrand();
  const [brandData, setBrandData] = useState({
    primaryColor: "#6366F1",
    secondaryColor: "#8B5CF6",
    logoUrl: "",
    contactInfo: "",
  });
  const [logoBase64, setLogoBase64] = useState<string | null>(null);

  const pickLogo = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        setLogoBase64(result.assets[0].base64);
        setBrandData({ ...brandData, logoUrl: `data:image/png;base64,${result.assets[0].base64}` });
      }
    } catch {
      console.log("Failed to pick image");
    }
  };

  const removeLogo = () => {
    setLogoBase64(null);
    setBrandData({ ...brandData, logoUrl: "" });
  };

  const handleComplete = () => {
    setupBrand({
      brandColors: {
        primary: brandData.primaryColor || "#6366F1",
        secondary: brandData.secondaryColor || "#8B5CF6",
      },
      logoUrl: brandData.logoUrl,
      contactInfo: brandData.contactInfo,
    });
    router.replace("/(tabs)/feed");
  };

  return (
    <View style={[styles.container, { backgroundColor: neumorphismColors.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <Text style={styles.title}>Welcome to ContentAI</Text>
              <Text style={styles.subtitle}>
                Set up your brand identity to start recreating Instagram content
              </Text>
            </View>

            <View style={[styles.form, createSoftNeumorphicStyle()]}>
              <View style={styles.inputGroup}>
                <View style={styles.inputHeader}>
                  <Palette size={20} color={neumorphismColors.primary} />
                  <Text style={styles.inputLabel}>Brand Colors</Text>
                </View>
                
                <TextInput
                  style={[styles.input, createSoftNeumorphicStyle()]}
                  placeholder="Primary Color (e.g., #667EEA)"
                  placeholderTextColor={neumorphismColors.text.muted}
                  value={brandData.primaryColor}
                  onChangeText={(text) => setBrandData({ ...brandData, primaryColor: text })}
                />
                
                <TextInput
                  style={[styles.input, createSoftNeumorphicStyle()]}
                  placeholder="Secondary Color (e.g., #764BA2)"
                  placeholderTextColor={neumorphismColors.text.muted}
                  value={brandData.secondaryColor}
                  onChangeText={(text) => setBrandData({ ...brandData, secondaryColor: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.inputHeader}>
                  <Upload size={20} color={neumorphismColors.primary} />
                  <Text style={styles.inputLabel}>Brand Logo</Text>
                </View>
                
                {!logoBase64 ? (
                  <TouchableOpacity 
                    style={[styles.logoUpload, createNeumorphicStyle()]} 
                    onPress={pickLogo}
                  >
                    <Upload size={32} color={neumorphismColors.text.muted} />
                    <Text style={styles.logoUploadText}>Tap to upload your logo</Text>
                    <Text style={styles.logoUploadSubtext}>PNG, JPG up to 10MB</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={[styles.logoPreview, createSoftNeumorphicStyle()]}>
                    <Image
                      source={{ uri: `data:image/png;base64,${logoBase64}` }}
                      style={styles.logoImage}
                      resizeMode="contain"
                    />
                    <TouchableOpacity style={styles.logoRemove} onPress={removeLogo}>
                      <X size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.inputHeader}>
                  <Phone size={20} color={neumorphismColors.primary} />
                  <Text style={styles.inputLabel}>Contact Information</Text>
                </View>
                
                <TextInput
                  style={[styles.input, styles.textArea, createSoftNeumorphicStyle()]}
                  placeholder="Email, phone, website, or social media handles"
                  placeholderTextColor={neumorphismColors.text.muted}
                  value={brandData.contactInfo}
                  onChangeText={(text) => setBrandData({ ...brandData, contactInfo: text })}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <TouchableOpacity 
                style={[styles.button, createNeumorphicStyle()]} 
                onPress={handleComplete}
              >
                <Text style={styles.buttonText}>Get Started</Text>
                <ArrowRight size={20} color={neumorphismColors.primary} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.skipButton} onPress={handleComplete}>
                <Text style={styles.skipText}>Skip for now</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold' as const,
    color: neumorphismColors.text.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: neumorphismColors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  form: {
    padding: 24,
    gap: 24,
  },
  inputGroup: {
    gap: 12,
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: neumorphismColors.text.primary,
  },
  input: {
    backgroundColor: neumorphismColors.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: neumorphismColors.text.primary,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
    marginTop: 8,
  },
  logoUpload: {
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  logoUploadText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: neumorphismColors.text.primary,
  },
  logoUploadSubtext: {
    fontSize: 12,
    color: neumorphismColors.text.muted,
  },
  logoPreview: {
    position: 'relative',
    padding: 16,
    alignItems: 'center',
  },
  logoImage: {
    width: 80,
    height: 80,
  },
  logoRemove: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: neumorphismColors.primary,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  skipText: {
    fontSize: 14,
    color: neumorphismColors.text.muted,
  },
});
