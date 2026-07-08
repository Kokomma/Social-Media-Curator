import createContextHook from "@nkzw/create-context-hook";
import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface InstagramAccount {
  id: string;
  username: string;
  profileImage: string;
  followers: string;
}

interface DiscoveredContent {
  id: string;
  username: string;
  profileImage: string;
  imageUrl: string;
  caption?: string;
  likes: string;
  comments: string;
  views?: string;
  timestamp: string;
  type: "post" | "story";
}

interface LibraryItem {
  id: string;
  originalImage: string;
  recreatedImage: string;
  prompt: string;
  createdAt: string;
}

export const [ContentProvider, useContent] = createContextHook(() => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [monitoredAccounts, setMonitoredAccounts] = useState<InstagramAccount[]>([]);
  const [discoveredContent, setDiscoveredContent] = useState<DiscoveredContent[]>([]);
  const [library, setLibrary] = useState<LibraryItem[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [accountsData, libraryData] = await Promise.all([
        AsyncStorage.getItem("monitoredAccounts"),
        AsyncStorage.getItem("contentLibrary"),
      ]);

      if (accountsData) {
        setMonitoredAccounts(JSON.parse(accountsData));
      }
      if (libraryData) {
        setLibrary(JSON.parse(libraryData));
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const addMonitoredAccount = async (account: InstagramAccount) => {
    const updated = [...monitoredAccounts, account];
    setMonitoredAccounts(updated);
    await AsyncStorage.setItem("monitoredAccounts", JSON.stringify(updated));
  };

  const removeMonitoredAccount = async (id: string) => {
    const updated = monitoredAccounts.filter(acc => acc.id !== id);
    setMonitoredAccounts(updated);
    await AsyncStorage.setItem("monitoredAccounts", JSON.stringify(updated));
  };

  const addDiscoveredContent = (content: DiscoveredContent) => {
    setDiscoveredContent(prev => [content, ...prev]);
  };

  const addToLibrary = async (item: LibraryItem) => {
    const updated = [item, ...library];
    setLibrary(updated);
    await AsyncStorage.setItem("contentLibrary", JSON.stringify(updated));
  };

  const removeFromLibrary = async (id: string) => {
    const updated = library.filter(item => item.id !== id);
    setLibrary(updated);
    await AsyncStorage.setItem("contentLibrary", JSON.stringify(updated));
  };

  return {
    isLoading,
    monitoredAccounts,
    discoveredContent,
    library,
    addMonitoredAccount,
    removeMonitoredAccount,
    addDiscoveredContent,
    addToLibrary,
    removeFromLibrary,
  };
});
