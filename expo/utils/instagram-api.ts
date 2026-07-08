import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface InstagramAuthResult {
  accessToken: string;
  userId: string;
  username: string;
}

export interface InstagramAccount {
  id: string;
  username: string;
  profileImage: string;
  followers: string;
  accessToken?: string;
}

export interface InstagramPost {
  id: string;
  username: string;
  profileImage: string;
  imageUrl: string;
  caption?: string;
  likes: string;
  comments: string;
  views?: string;
  timestamp: string;
  type: 'post' | 'story';
  permalink?: string;
}

const INSTAGRAM_APP_ID = 'your-instagram-app-id'; // This would be configured in production
const REDIRECT_URI = 'https://your-app.com/auth/instagram/callback';

export class InstagramAPI {
  private static instance: InstagramAPI;
  
  static getInstance(): InstagramAPI {
    if (!InstagramAPI.instance) {
      InstagramAPI.instance = new InstagramAPI();
    }
    return InstagramAPI.instance;
  }

  async authenticateUser(): Promise<InstagramAuthResult | null> {
    try {
      if (Platform.OS === 'web') {
        // For web, we'll simulate the auth flow
        console.log('Instagram authentication would open in production');
        return {
          accessToken: 'demo_access_token',
          userId: 'demo_user_id',
          username: 'demo_user'
        };
      }

      const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${INSTAGRAM_APP_ID}&redirect_uri=${REDIRECT_URI}&scope=user_profile,user_media&response_type=code`;
      
      const result = await WebBrowser.openAuthSessionAsync(authUrl, REDIRECT_URI);
      
      if (result.type === 'success' && result.url) {
        const code = this.extractCodeFromUrl(result.url);
        if (code) {
          return await this.exchangeCodeForToken(code);
        }
      }
      
      return null;
    } catch (error) {
      console.error('Instagram authentication error:', error);
      return null;
    }
  }

  private extractCodeFromUrl(url: string): string | null {
    const match = url.match(/code=([^&]+)/);
    return match ? match[1] : null;
  }

  private async exchangeCodeForToken(code: string): Promise<InstagramAuthResult | null> {
    try {
      // In production, this would make a real API call to exchange the code for an access token
      console.log('Exchanging code for access token:', code);
      
      // For demo purposes, return mock data
      return {
        accessToken: `demo_token_${Date.now()}`,
        userId: `user_${Date.now()}`,
        username: 'authenticated_user'
      };
    } catch (error) {
      console.error('Token exchange error:', error);
      return null;
    }
  }

  async getUserProfile(accessToken: string): Promise<InstagramAccount | null> {
    try {
      // In production, this would make a real API call
      console.log('Fetching user profile with token:', accessToken);
      
      // For demo purposes, return mock data
      return {
        id: `user_${Date.now()}`,
        username: 'authenticated_user',
        profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        followers: '1.2K',
        accessToken
      };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  async getUserPosts(accessToken: string, userId: string): Promise<InstagramPost[]> {
    try {
      // In production, this would make a real API call to Instagram Graph API
      console.log('Fetching posts for user:', userId);
      
      // For demo purposes, return mock data
      const mockPosts: InstagramPost[] = [
        {
          id: `post_${Date.now()}_1`,
          username: 'authenticated_user',
          profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
          imageUrl: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=400&fit=crop',
          caption: 'Just posted some amazing content! #instagram #content',
          likes: '245',
          comments: '18',
          views: '1.2K',
          timestamp: '2 hours ago',
          type: 'post',
          permalink: 'https://instagram.com/p/example1'
        },
        {
          id: `post_${Date.now()}_2`,
          username: 'authenticated_user',
          profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
          imageUrl: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=400&fit=crop',
          caption: 'Behind the scenes content creation',
          likes: '189',
          comments: '12',
          timestamp: '5 hours ago',
          type: 'story'
        }
      ];
      
      return mockPosts;
    } catch (error) {
      console.error('Error fetching user posts:', error);
      return [];
    }
  }

  async monitorAccount(username: string): Promise<InstagramAccount | null> {
    try {
      // In production, this would search for the account and request monitoring permissions
      console.log('Monitoring account:', username);
      
      // For demo purposes, return mock data
      const mockAccounts = [
        {
          id: 'designinspiration',
          username: 'designinspiration',
          profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
          followers: '125K'
        },
        {
          id: 'brandingstudio',
          username: 'brandingstudio',
          profileImage: 'https://images.unsplash.com/photo-1494790108755-2616b332c1c2?w=150&h=150&fit=crop&crop=face',
          followers: '89K'
        },
        {
          id: 'creativehub',
          username: 'creativehub',
          profileImage: 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=150&h=150&fit=crop&crop=face',
          followers: '67K'
        }
      ];
      
      const account = mockAccounts.find(acc => 
        acc.username.toLowerCase() === username.toLowerCase().replace('@', '')
      );
      
      return account || null;
    } catch (error) {
      console.error('Error monitoring account:', error);
      return null;
    }
  }

  async saveAccessToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem('instagram_access_token', token);
    } catch (error) {
      console.error('Error saving access token:', error);
    }
  }

  async getAccessToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('instagram_access_token');
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  }

  async clearAccessToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem('instagram_access_token');
    } catch (error) {
      console.error('Error clearing access token:', error);
    }
  }
}
