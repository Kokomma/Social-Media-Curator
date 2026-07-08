import createContextHook from "@nkzw/create-context-hook";
import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface BrandColors {
  primary: string;
  secondary: string;
}

interface BrandData {
  brandColors: BrandColors;
  logoUrl: string;
  contactInfo: string;
}

export const [BrandProvider, useBrand] = createContextHook(() => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [brandSetup, setBrandSetup] = useState<boolean>(false);
  const [brandColors, setBrandColors] = useState<BrandColors>({
    primary: "#6366F1",
    secondary: "#8B5CF6",
  });
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [contactInfo, setContactInfo] = useState<string>("");

  useEffect(() => {
    loadBrandData();
  }, []);

  const loadBrandData = async () => {
    try {
      const stored = await AsyncStorage.getItem("brandData");
      if (stored) {
        const data: BrandData = JSON.parse(stored);
        setBrandColors(data.brandColors);
        setLogoUrl(data.logoUrl);
        setContactInfo(data.contactInfo);
        setBrandSetup(true);
      }
    } catch (error) {
      console.error("Error loading brand data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const setupBrand = async (data: BrandData) => {
    try {
      await AsyncStorage.setItem("brandData", JSON.stringify(data));
      setBrandColors(data.brandColors);
      setLogoUrl(data.logoUrl);
      setContactInfo(data.contactInfo);
      setBrandSetup(true);
    } catch (error) {
      console.error("Error saving brand data:", error);
    }
  };

  const updateBrand = async (data: BrandData) => {
    await setupBrand(data);
  };

  return {
    isLoading,
    brandSetup,
    brandColors,
    logoUrl,
    contactInfo,
    setupBrand,
    updateBrand,
  };
});
