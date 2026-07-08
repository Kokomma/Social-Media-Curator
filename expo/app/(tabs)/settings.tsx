import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Plus, X, Palette, Instagram, Upload, Link, Trash2 } from "lucide-react-native";
import { useBrand } from "@/providers/BrandProvider";
import { useContent } from "@/providers/ContentProvider";
import { mockInstagramAccounts } from "@/mocks/instagram-data";
import { neumorphismColors, createNeumorphicStyle, createSoftNeumorphicStyle, createGlowNeumorphicStyle } from "@/constants/neumorphism";
import { InstagramAPI } from "@/utils/instagram-api";
import * as ImagePicker from "expo-image-picker";

export default function SettingsScreen() {
  const { brandColors, logoUrl, contactInfo, updateBrand } = useBrand();
  const { monitoredAccounts, addMonitoredAccount, removeMonitoredAccount } = useContent();
  const [newAccount, setNewAccount] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const [editingBrand, setEditingBrand] = useState({
    primaryColor: brandColors.primary,
    secondaryColor: brandColors.secondary,
    logo: logoUrl,
    contact: contactInfo,
  });
  const insets = useSafeAreaInsets();

  const handleConnectInstagram = async () => {
    setIsConnecting(true);
    try {
      const instagramAPI = InstagramAPI.getInstance();
      const authResult = await instagramAPI.authenticateUser();
      
      if (authResult) {
        const userProfile = await instagramAPI.getUserProfile(authResult.accessToken);
        if (userProfile) {
          await addMonitoredAccount(userProfile);
          Alert.alert('Success', `Connected to @${userProfile.username}!`);
        }
      } else {
        Alert.alert('Authentication Failed', 'Could not connect to Instagram. Please try again.');
      }
    } catch (error) {
      console.error('Instagram connection error:', error);
      Alert.alert('Error', 'Failed to connect to Instagram.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleAddAccount = async () => {
    if (!newAccount.trim()) return;
    
    if (monitoredAccounts.length >= 5) {
      Alert.alert("Limit Reached", "You can monitor up to 5 accounts at a time");
      return;
    }

    setIsConnecting(true);
    try {
      const instagramAPI = InstagramAPI.getInstance();
      const account = await instagramAPI.monitorAccount(newAccount);
      
      if (account) {
        await addMonitoredAccount(account);
        setNewAccount("");
        console.log(`Now monitoring @${account.username}`);
      } else {
        Alert.alert('Account Not Found', 'Could not find this Instagram account.');
      }
    } catch (error) {
      console.error('Error adding account:', error);
      Alert.alert('Error', 'Failed to add account.');
    } finally {
      setIsConnecting(false);
    }
  };

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
        setEditingBrand({ ...editingBrand, logo: `data:image/png;base64,${result.assets[0].base64}` });
      }
    } catch (error) {
      console.error('Failed to pick image:', error);
    }
  };

  const removeLogo = () => {
    setLogoBase64(null);
    setEditingBrand({ ...editingBrand, logo: "" });
  };

  const handleSaveBrand = () => {
    updateBrand({
      brandColors: {
        primary: editingBrand.primaryColor,
        secondary: editingBrand.secondaryColor,
      },
      logoUrl: editingBrand.logo,
      contactInfo: editingBrand.contact,
    });
    Alert.alert("Success", "Brand settings updated!");
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={[styles.header, createGlowNeumorphicStyle()]}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>⚙️ ContentClone Settings</Text>
          <Text style={styles.headerSubtitle}>
            Customize your brand identity and connect Instagram
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={[styles.section, createSoftNeumorphicStyle()]}>
          <View style={styles.sectionHeader}>
            <Palette size={20} color={neumorphismColors.primary} />
            <Text style={styles.sectionTitle}>🎨 Brand Identity</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Primary Color</Text>
            <TextInput
              style={[styles.input, createSoftNeumorphicStyle()]}
              value={editingBrand.primaryColor}
              onChangeText={(text) => setEditingBrand({ ...editingBrand, primaryColor: text })}
              placeholder="#667EEA"
              placeholderTextColor={neumorphismColors.text.muted}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Secondary Color</Text>
            <TextInput
              style={[styles.input, createSoftNeumorphicStyle()]}
              value={editingBrand.secondaryColor}
              onChangeText={(text) => setEditingBrand({ ...editingBrand, secondaryColor: text })}
              placeholder="#764BA2"
              placeholderTextColor={neumorphismColors.text.muted}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Brand Logo</Text>
            {!logoBase64 && !editingBrand.logo ? (
              <TouchableOpacity 
                style={[styles.logoUpload, createNeumorphicStyle()]} 
                onPress={pickLogo}
              >
                <Upload size={24} color={neumorphismColors.text.muted} />
                <Text style={styles.logoUploadText}>📸 Upload Logo</Text>
              </TouchableOpacity>
            ) : (
              <View style={[styles.logoPreview, createSoftNeumorphicStyle()]}>
                <Image
                  source={{ uri: logoBase64 ? `data:image/png;base64,${logoBase64}` : editingBrand.logo }}
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
            <Text style={styles.label}>Contact Information</Text>
            <TextInput
              style={[styles.input, styles.textArea, createSoftNeumorphicStyle()]}
              value={editingBrand.contact}
              onChangeText={(text) => setEditingBrand({ ...editingBrand, contact: text })}
              placeholder="Email, phone, website, or social handles"
              placeholderTextColor={neumorphismColors.text.muted}
              multiline
              numberOfLines={3}
            />
          </View>

          <TouchableOpacity 
            style={[styles.saveButton, createNeumorphicStyle()]} 
            onPress={handleSaveBrand}
          >
            <Text style={styles.saveButtonText}>💾 Save Brand Settings</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.section, createSoftNeumorphicStyle()]}>
          <View style={styles.sectionHeader}>
            <Instagram size={20} color={neumorphismColors.primary} />
            <Text style={styles.sectionTitle}>📱 Instagram Connect</Text>
            <Text style={styles.accountCount}>{monitoredAccounts.length}/5</Text>
          </View>

          <TouchableOpacity 
            style={[styles.connectButton, createNeumorphicStyle()]}
            onPress={handleConnectInstagram}
            disabled={isConnecting || monitoredAccounts.length >= 5}
          >
            {isConnecting ? (
              <ActivityIndicator color={neumorphismColors.primary} />
            ) : (
              <>
                <Link size={20} color={neumorphismColors.primary} />
                <Text style={styles.connectButtonText}>🔗 Connect Instagram</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.divider} />

          <View style={styles.accountsList}>
            {monitoredAccounts.map((account) => (
              <View key={account.id} style={[styles.accountItem, createSoftNeumorphicStyle()]}>
                <Image source={{ uri: account.profileImage }} style={styles.accountImage} />
                <View style={styles.accountInfo}>
                  <Text style={styles.accountUsername}>@{account.username}</Text>
                  <Text style={styles.accountFollowers}>{account.followers} followers</Text>
                </View>
                <TouchableOpacity
                  style={[styles.removeButton, createNeumorphicStyle()]}
                  onPress={() => removeMonitoredAccount(account.id)}
                >
                  <Trash2 size={16} color={neumorphismColors.text.secondary} />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {monitoredAccounts.length < 5 && (
            <>
              <View style={styles.divider} />
              <View style={styles.addAccountContainer}>
                <TextInput
                  style={[styles.addAccountInput, createSoftNeumorphicStyle()]}
                  value={newAccount}
                  onChangeText={setNewAccount}
                  placeholder="Enter Instagram username"
                  placeholderTextColor={neumorphismColors.text.muted}
                />
                <TouchableOpacity 
                  style={[styles.addButton, createNeumorphicStyle()]} 
                  onPress={handleAddAccount}
                  disabled={isConnecting}
                >
                  {isConnecting ? (
                    <ActivityIndicator size="small" color={neumorphismColors.primary} />
                  ) : (
                    <Plus size={20} color={neumorphismColors.primary} />
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}

          <Text style={styles.demoNote}>
            ⚡ Real Instagram API integration ready! Connect up to 5 accounts for content monitoring.
          </Text>
        </View>
      </ScrollView>
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
  section: {
    marginHorizontal: 16,
    marginTop: 20,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: neumorphismColors.text.primary,
    flex: 1,
  },
  accountCount: {
    fontSize: 14,
    color: neumorphismColors.text.muted,
    fontWeight: '600' as const,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: neumorphismColors.text.primary,
    marginBottom: 8,
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
  logoUpload: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    gap: 8,
  },
  logoUploadText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: neumorphismColors.text.primary,
  },
  logoPreview: {
    position: 'relative',
    alignItems: 'center',
    padding: 16,
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
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
    marginTop: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: neumorphismColors.primary,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
    marginBottom: 16,
  },
  connectButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: neumorphismColors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: neumorphismColors.shadow.dark,
    marginVertical: 16,
    opacity: 0.3,
  },
  accountsList: {
    gap: 12,
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  accountImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  accountInfo: {
    flex: 1,
    marginLeft: 12,
  },
  accountUsername: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: neumorphismColors.text.primary,
  },
  accountFollowers: {
    fontSize: 13,
    color: neumorphismColors.text.muted,
    marginTop: 2,
  },
  removeButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addAccountContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  addAccountInput: {
    flex: 1,
    backgroundColor: neumorphismColors.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: neumorphismColors.text.primary,
  },
  addButton: {
    width: 52,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  demoNote: {
    fontSize: 13,
    color: neumorphismColors.text.muted,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
  },
});
