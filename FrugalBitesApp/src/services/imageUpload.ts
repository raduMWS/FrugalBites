import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { Alert, Platform } from 'react-native';
import api from './api';

// Image compression settings
const COMPRESSION_QUALITY = 0.8;
const MAX_WIDTH = 1200;
const MAX_HEIGHT = 1200;

export interface ImagePickerResult {
  uri: string;
  width: number;
  height: number;
  type: string;
  fileSize?: number;
}

// Request camera permissions
export const requestCameraPermission = async (): Promise<boolean> => {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(
      'Permission Required',
      'Please grant camera access to take photos.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Settings',
          onPress: () => {
            if (Platform.OS === 'ios') {
              // Open iOS settings
              // Linking.openSettings();
            }
          },
        },
      ]
    );
    return false;
  }
  return true;
};

// Request media library permissions
export const requestMediaLibraryPermission = async (): Promise<boolean> => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(
      'Permission Required',
      'Please grant photo library access to select images.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Settings',
          onPress: () => {
            if (Platform.OS === 'ios') {
              // Linking.openSettings();
            }
          },
        },
      ]
    );
    return false;
  }
  return true;
};

// Pick image from library
export const pickImage = async (options?: {
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
}): Promise<ImagePickerResult | null> => {
  const hasPermission = await requestMediaLibraryPermission();
  if (!hasPermission) return null;

  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: options?.allowsEditing ?? true,
      aspect: options?.aspect ?? [1, 1],
      quality: options?.quality ?? COMPRESSION_QUALITY,
    });

    if (result.canceled || !result.assets?.[0]) {
      return null;
    }

    const asset = result.assets[0];
    return {
      uri: asset.uri,
      width: asset.width,
      height: asset.height,
      type: asset.mimeType || 'image/jpeg',
      fileSize: asset.fileSize,
    };
  } catch (error) {
    console.error('Error picking image:', error);
    return null;
  }
};

// Take photo with camera
export const takePhoto = async (options?: {
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
}): Promise<ImagePickerResult | null> => {
  const hasPermission = await requestCameraPermission();
  if (!hasPermission) return null;

  try {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: options?.allowsEditing ?? true,
      aspect: options?.aspect ?? [1, 1],
      quality: options?.quality ?? COMPRESSION_QUALITY,
    });

    if (result.canceled || !result.assets?.[0]) {
      return null;
    }

    const asset = result.assets[0];
    return {
      uri: asset.uri,
      width: asset.width,
      height: asset.height,
      type: asset.mimeType || 'image/jpeg',
      fileSize: asset.fileSize,
    };
  } catch (error) {
    console.error('Error taking photo:', error);
    return null;
  }
};

// Show image picker action sheet
export const showImagePickerOptions = (
  onImageSelected: (result: ImagePickerResult) => void,
  options?: {
    title?: string;
    allowsEditing?: boolean;
    aspect?: [number, number];
  }
): void => {
  Alert.alert(
    options?.title || 'Select Photo',
    'Choose an option',
    [
      {
        text: 'Camera',
        onPress: async () => {
          const result = await takePhoto({
            allowsEditing: options?.allowsEditing,
            aspect: options?.aspect,
          });
          if (result) onImageSelected(result);
        },
      },
      {
        text: 'Photo Library',
        onPress: async () => {
          const result = await pickImage({
            allowsEditing: options?.allowsEditing,
            aspect: options?.aspect,
          });
          if (result) onImageSelected(result);
        },
      },
      {
        text: 'Cancel',
        style: 'cancel',
      },
    ],
    { cancelable: true }
  );
};

// Compress image
export const compressImage = async (
  uri: string,
  options?: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
  }
): Promise<string> => {
  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [
        {
          resize: {
            width: options?.maxWidth || MAX_WIDTH,
            height: options?.maxHeight || MAX_HEIGHT,
          },
        },
      ],
      {
        compress: options?.quality || COMPRESSION_QUALITY,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );
    return result.uri;
  } catch (error) {
    console.error('Error compressing image:', error);
    return uri; // Return original if compression fails
  }
};

// Get file info
export const getFileInfo = async (
  uri: string
): Promise<{ size: number; exists: boolean }> => {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    return {
      size: info.exists && 'size' in info ? info.size : 0,
      exists: info.exists,
    };
  } catch (error) {
    console.error('Error getting file info:', error);
    return { size: 0, exists: false };
  }
};

// Upload image to server
export const uploadImage = async (
  uri: string,
  uploadType: 'profile' | 'offer' | 'merchant',
  entityId?: number,
  onProgress?: (progress: number) => void
): Promise<{ url: string; success: boolean; error?: string }> => {
  try {
    // Compress before upload
    const compressedUri = await compressImage(uri);
    
    // Get file info
    const fileInfo = await getFileInfo(compressedUri);
    if (!fileInfo.exists) {
      throw new Error('File does not exist');
    }

    // Create form data
    const formData = new FormData();
    const filename = compressedUri.split('/').pop() || 'image.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('image', {
      uri: compressedUri,
      name: filename,
      type,
    } as any);
    
    formData.append('type', uploadType);
    if (entityId) {
      formData.append('entityId', entityId.toString());
    }

    // Upload
    const response = await api.post('/images/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const progress = (progressEvent.loaded / progressEvent.total) * 100;
          onProgress(Math.round(progress));
        }
      },
    });

    return {
      url: response.data.url,
      success: true,
    };
  } catch (error: any) {
    console.error('Error uploading image:', error);
    return {
      url: '',
      success: false,
      error: error.response?.data?.message || error.message || 'Upload failed',
    };
  }
};

// Upload profile photo
export const uploadProfilePhoto = async (
  uri: string,
  userId: number,
  onProgress?: (progress: number) => void
): Promise<{ url: string; success: boolean; error?: string }> => {
  return uploadImage(uri, 'profile', userId, onProgress);
};

// Upload offer image
export const uploadOfferImage = async (
  uri: string,
  offerId?: number,
  onProgress?: (progress: number) => void
): Promise<{ url: string; success: boolean; error?: string }> => {
  return uploadImage(uri, 'offer', offerId, onProgress);
};

// Upload merchant logo/image
export const uploadMerchantImage = async (
  uri: string,
  merchantId: number,
  onProgress?: (progress: number) => void
): Promise<{ url: string; success: boolean; error?: string }> => {
  return uploadImage(uri, 'merchant', merchantId, onProgress);
};

// Delete image
export const deleteImage = async (imageUrl: string): Promise<boolean> => {
  try {
    await api.delete('/images', { data: { url: imageUrl } });
    return true;
  } catch (error) {
    console.error('Error deleting image:', error);
    return false;
  }
};
