import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  PanResponder,
  ActivityIndicator,
  LayoutChangeEvent,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { neumorphismColors, createNeumorphicStyle } from '@/constants/neumorphism';
import { RotateCcw, X, Target, Wand2, Move } from 'lucide-react-native';

interface SelectableArea {
  id: string;
  type: 'logo' | 'text' | 'contact';
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  selected: boolean;
}

interface ContentEditorProps {
  imageUri: string;
  onSave: (processedImageBase64: string) => void;
  onCancel: () => void;
  brandLogo?: string;
  brandColors: { primary: string; secondary: string };
  contactInfo?: string;
}

export default function ContentEditor({
  imageUri,
  onSave,
  onCancel,
  brandLogo,
  brandColors,
  contactInfo,
}: ContentEditorProps) {
  const insets = useSafeAreaInsets();

  const [selectableAreas, setSelectableAreas] = useState<SelectableArea[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageLayout, setImageLayout] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [selectedElementType, setSelectedElementType] = useState<'logo' | 'text' | 'contact' | null>(null);
  
  const logoAnimatedValue = useRef(new Animated.ValueXY()).current;
  const textAnimatedValue = useRef(new Animated.ValueXY()).current;
  const contactAnimatedValue = useRef(new Animated.ValueXY()).current;
  const getAnimatedValue = (type: 'logo' | 'text' | 'contact') => {
    switch (type) {
      case 'logo': return logoAnimatedValue;
      case 'text': return textAnimatedValue;
      case 'contact': return contactAnimatedValue;
    }
  };
  
  const createPanResponder = (elementType: 'logo' | 'text' | 'contact') => {
    const animatedValue = getAnimatedValue(elementType);
    
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only start moving if there's significant movement
        return Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2;
      },
      onPanResponderGrant: (evt) => {
        console.log('Pan responder granted for:', elementType);
        setSelectedElementType(elementType);
        
        // Get current animated values safely
        const currentValue = (animatedValue as any)._value;
        const currentX = currentValue && typeof currentValue.x === 'number' ? currentValue.x : 0;
        const currentY = currentValue && typeof currentValue.y === 'number' ? currentValue.y : 0;
        
        animatedValue.setOffset({
          x: currentX,
          y: currentY,
        });
        animatedValue.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (evt, gestureState) => {
        console.log('Moving:', gestureState.dx, gestureState.dy);
        animatedValue.setValue({
          x: gestureState.dx,
          y: gestureState.dy,
        });
      },
      onPanResponderRelease: (evt, gestureState) => {
        console.log('Released at:', gestureState.moveX, gestureState.moveY);
        animatedValue.flattenOffset();
        setSelectedElementType(null);
        
        if (!imageLayout || typeof imageLayout.x === 'undefined' || typeof imageLayout.y === 'undefined') {
          console.log('No image layout or invalid layout, resetting position');
          Animated.spring(animatedValue, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }).start();
          return;
        }
        
        // Get the final position using absolute coordinates
        const finalX = gestureState.moveX || 0;
        const finalY = gestureState.moveY || 0;
        
        console.log('Final position:', finalX, finalY);
        console.log('Image bounds:', imageLayout);
        
        // Check if dropped on the image with some tolerance
        const tolerance = 20;
        const imageTop = (imageLayout.y || 0) - tolerance;
        const imageLeft = (imageLayout.x || 0) - tolerance;
        const imageRight = (imageLayout.x || 0) + (imageLayout.width || 0) + tolerance;
        const imageBottom = (imageLayout.y || 0) + (imageLayout.height || 0) + tolerance;
        
        if (finalX >= imageLeft && finalX <= imageRight && 
            finalY >= imageTop && finalY <= imageBottom) {
          // Convert to relative coordinates within the image
          const relativeX = Math.max(0, Math.min(finalX - (imageLayout.x || 0), imageLayout.width || 0));
          const relativeY = Math.max(0, Math.min(finalY - (imageLayout.y || 0), imageLayout.height || 0));
          
          console.log('Dropped on image at relative position:', relativeX, relativeY);
          
          // Create a new selectable area
          const areaSize = 80; // Larger area for better visibility
          const newArea: SelectableArea = {
            id: `area_${Date.now()}`,
            type: elementType,
            x: Math.max(0, Math.min(relativeX - areaSize/2, (imageLayout.width || 0) - areaSize)),
            y: Math.max(0, Math.min(relativeY - areaSize/2, (imageLayout.height || 0) - areaSize)),
            width: areaSize,
            height: areaSize,
            label: getAreaLabel(elementType),
            selected: false,
          };
          
          setSelectableAreas(prev => {
            console.log('Adding new area:', newArea);
            return [...prev, newArea];
          });
        } else {
          console.log('Dropped outside image bounds');
        }
        
        // Reset the draggable element position with animation
        Animated.spring(animatedValue, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
          tension: 100,
          friction: 8,
        }).start();
      },
    });
  };


  
  const getAreaLabel = (type: 'logo' | 'text' | 'contact') => {
    switch (type) {
      case 'logo': return 'Logo Area';
      case 'text': return 'Text Area';
      case 'contact': return 'Contact Area';
    }
  };
  
  const selectArea = (id: string) => {
    setSelectableAreas(prev =>
      prev.map(area => ({ ...area, selected: area.id === id }))
    );
  };
  
  const deleteSelectedArea = () => {
    setSelectableAreas(prev => prev.filter(area => !area.selected));
  };
  


  const handleSave = async () => {
    if (selectableAreas.length === 0) {
      console.warn('No Areas Selected', 'Please select areas to replace before saving.');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Convert image to base64 if needed
      let imageBase64 = '';
      if (imageUri.startsWith('data:')) {
        imageBase64 = imageUri.split(',')[1];
      } else {
        // For file URIs, we'd need to convert to base64
        // For now, assume it's already base64 or handle appropriately
        imageBase64 = imageUri;
      }
      
      // Create replacement instructions based on selected areas
      const replacementInstructions = selectableAreas.map(area => {
        let instruction = '';
        switch (area.type) {
          case 'logo':
            instruction = brandLogo 
              ? `In the rectangular area from (${Math.round(area.x)}, ${Math.round(area.y)}) to (${Math.round(area.x + area.width)}, ${Math.round(area.y + area.height)}), replace any existing logo or brand mark with the provided brand logo. Maintain the area's proportions and make it look natural.`
              : `In the rectangular area from (${Math.round(area.x)}, ${Math.round(area.y)}) to (${Math.round(area.x + area.width)}, ${Math.round(area.y + area.height)}), remove or replace any existing logo.`;
            break;
          case 'text':
            instruction = `In the rectangular area from (${Math.round(area.x)}, ${Math.round(area.y)}) to (${Math.round(area.x + area.width)}, ${Math.round(area.y + area.height)}), change any text to use brand colors ${brandColors.primary} as primary and ${brandColors.secondary} as accent colors. Keep the text readable and well-positioned.`;
            break;
          case 'contact':
            instruction = contactInfo 
              ? `In the rectangular area from (${Math.round(area.x)}, ${Math.round(area.y)}) to (${Math.round(area.x + area.width)}, ${Math.round(area.y + area.height)}), replace any contact information with: ${contactInfo}. Keep the formatting consistent with the design.`
              : `In the rectangular area from (${Math.round(area.x)}, ${Math.round(area.y)}) to (${Math.round(area.x + area.width)}, ${Math.round(area.y + area.height)}), remove any contact information.`;
            break;
        }
        return instruction;
      }).join(' ');
      
      // Include logo in images array if available
      const images = [{ type: "image", image: imageBase64 }];
      
      if (brandLogo && brandLogo.startsWith('data:image')) {
        const logoBase64 = brandLogo.split(',')[1];
        images.push({ type: "image", image: logoBase64 });
      }
      
      const fullPrompt = `${replacementInstructions} ${brandLogo ? 'Use the second image as the brand logo for logo replacements.' : ''} Apply brand colors ${brandColors.primary} as primary and ${brandColors.secondary} as secondary throughout. Keep the overall layout and design intact, only modify the specified rectangular areas. Make all changes look professional, natural, and cohesive with the original design.`;
      
      const response = await fetch('https://toolkit.rork.com/images/edit/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: fullPrompt,
          images: images,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to process image');
      }
      
      const data = await response.json();
      onSave(data.image.base64Data);
      
    } catch (error) {
      console.error('Error processing image:', error);
      console.warn('Error', 'Failed to process the selected areas. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };



  const handleImageLayout = (event: LayoutChangeEvent) => {
    const { x, y, width, height } = event.nativeEvent.layout;
    console.log('Image layout:', { x, y, width, height });
    // Ensure all values are numbers and valid
    const safeLayout = {
      x: typeof x === 'number' && !isNaN(x) ? x : 0,
      y: typeof y === 'number' && !isNaN(y) ? y : 0,
      width: typeof width === 'number' && !isNaN(width) ? width : 0,
      height: typeof height === 'number' && !isNaN(height) ? height : 0,
    };
    setImageLayout(safeLayout);
  };
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Manual Content Editor</Text>
        <Text style={styles.subtitle}>
          Drag elements from below onto the image to mark areas for replacement
        </Text>
      </View>

      <View style={[styles.editorContainer, createNeumorphicStyle()]}>
        <View 
          style={styles.imageWrapper}
          onLayout={handleImageLayout}
        >
          <Image 
            source={{ uri: imageUri }} 
            style={styles.backgroundImage}
          />
        </View>
        <View style={styles.overlay}>
          {/* Existing selectable areas */}
          {selectableAreas.map(area => (
            <TouchableOpacity
              key={area.id}
              style={[
                styles.selectableArea,
                {
                  left: area.x,
                  top: area.y,
                  width: area.width,
                  height: area.height,
                },
                area.selected && styles.selectedArea,
              ]}
              onPress={() => selectArea(area.id)}
            >
              <Text style={styles.areaLabel}>{area.label}</Text>
              {area.selected && (
                <View style={styles.selectionIndicator}>
                  <Target size={12} color={neumorphismColors.primary} />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Draggable Elements */}
      <View style={styles.draggableSection}>
        <Text style={styles.draggableSectionTitle}>
          🎯 Drag these elements onto the image to mark replacement areas:
        </Text>
        <View style={styles.draggableContainer}>
          {(['logo', 'text', 'contact'] as const).map(elementType => {
            const panResponder = createPanResponder(elementType);
            const animatedValue = getAnimatedValue(elementType);
            const isSelected = selectedElementType === elementType;
            
            return (
              <Animated.View
                key={elementType}
                style={[
                  styles.draggableElement,
                  createNeumorphicStyle(),
                  isSelected && styles.draggingElement,
                  {
                    transform: animatedValue.getTranslateTransform(),
                    zIndex: isSelected ? 1000 : 1,
                  },
                ]}
                {...panResponder.panHandlers}
              >
                <Move size={16} color={neumorphismColors.text.secondary} />
                <Text style={styles.draggableElementText}>
                  {elementType === 'logo' ? '🏷️' : elementType === 'text' ? '📝' : '📞'}
                </Text>
                <Text style={styles.draggableElementLabel}>
                  {elementType.charAt(0).toUpperCase() + elementType.slice(1)}
                </Text>
              </Animated.View>
            );
          })}
        </View>
        <Text style={styles.dragInstruction}>
          💡 Tip: Drag and drop elements onto the image where you want to replace content
        </Text>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        {selectableAreas.some(area => area.selected) && (
          <TouchableOpacity
            style={[styles.controlButton, createNeumorphicStyle()]}
            onPress={deleteSelectedArea}
          >
            <X size={16} color={neumorphismColors.text.secondary} />
            <Text style={styles.controlButtonText}>Delete Selected</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[styles.controlButton, createNeumorphicStyle()]}
          onPress={() => setSelectableAreas([])}
        >
          <RotateCcw size={16} color={neumorphismColors.text.primary} />
          <Text style={styles.controlButtonText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.cancelButton, createNeumorphicStyle()]}
          onPress={onCancel}
          disabled={isProcessing}
        >
          <X size={18} color={neumorphismColors.text.secondary} />
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.saveButton, createNeumorphicStyle()]}
          onPress={handleSave}
          disabled={isProcessing || selectableAreas.length === 0}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color={neumorphismColors.primary} />
          ) : (
            <Wand2 size={18} color={neumorphismColors.primary} />
          )}
          <Text style={styles.saveButtonText}>
            {isProcessing ? 'Processing...' : 'Apply Changes'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: neumorphismColors.background,
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: neumorphismColors.text.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: neumorphismColors.text.secondary,
    textAlign: 'center',
  },
  editorContainer: {
    alignSelf: 'center',
    overflow: 'hidden',
    position: 'relative',
    aspectRatio: 1,
    width: '100%',
    maxWidth: 380,
    borderRadius: 16,
  },
  imageWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  selectableArea: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(102, 126, 234, 0.8)',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(102, 126, 234, 0.15)',
    minWidth: 30,
    minHeight: 30,
  },
  selectedArea: {
    borderColor: neumorphismColors.primary,
    borderWidth: 3,
    backgroundColor: 'rgba(102, 126, 234, 0.25)',
    shadowColor: neumorphismColors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },

  areaLabel: {
    fontSize: 9,
    color: neumorphismColors.primary,
    textAlign: 'center',
    fontWeight: '700' as const,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
  },

  selectionIndicator: {
    position: 'absolute',
    top: -8,
    right: -8,
    padding: 2,
    backgroundColor: neumorphismColors.primary,
    borderRadius: 8,
  },
  draggableSection: {
    marginTop: 20,
    marginBottom: 16,
  },
  draggableSectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: neumorphismColors.text.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  draggableContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
    marginBottom: 12,
  },
  draggableElement: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    minWidth: 80,
    minHeight: 80,
    borderRadius: 12,
    backgroundColor: neumorphismColors.surface,
  },
  draggingElement: {
    opacity: 0.9,
    elevation: 12,
    shadowColor: neumorphismColors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    transform: [{ scale: 1.1 }],
    backgroundColor: neumorphismColors.primary + '20',
  },
  draggableElementText: {
    fontSize: 20,
    marginBottom: 4,
  },
  draggableElementLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: neumorphismColors.text.primary,
    textAlign: 'center',
  },
  dragInstruction: {
    fontSize: 12,
    color: neumorphismColors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  controlButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  controlButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: neumorphismColors.text.primary,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 8,
  },
  cancelButton: {
    backgroundColor: neumorphismColors.surface,
  },
  saveButton: {
    backgroundColor: neumorphismColors.surface,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: neumorphismColors.text.secondary,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: neumorphismColors.primary,
  },

});
