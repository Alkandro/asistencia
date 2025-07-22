// AdminComponents.js - Componentes base minimalistas para AdminStack
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Card minimalista para admin
export const AdminCard = ({ children, style, ...props }) => {
  return (
    <View style={[styles.adminCard, style]} {...props}>
      {children}
    </View>
  );
};

// Botón minimalista para admin
export const AdminButton = ({ 
  title, 
  onPress, 
  variant = 'primary', 
  icon, 
  loading = false,
  disabled = false,
  style,
  ...props 
}) => {
  const buttonStyle = [
    styles.adminButton,
    styles[`adminButton${variant.charAt(0).toUpperCase() + variant.slice(1)}`],
    disabled && styles.adminButtonDisabled,
    style
  ];

  return (
    <TouchableOpacity 
      style={buttonStyle} 
      onPress={onPress} 
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <View style={styles.adminButtonContent}>
          {icon && <Ionicons name={icon} size={20} color="#fff" style={styles.adminButtonIcon} />}
          <Text style={styles.adminButtonText}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// Badge para notificaciones
export const AdminBadge = ({ count, style }) => {
  if (!count || count === 0) return null;
  
  return (
    <View style={[styles.adminBadge, style]}>
      <Text style={styles.adminBadgeText}>{count > 99 ? '99+' : count}</Text>
    </View>
  );
};

// Header minimalista
export const AdminHeader = ({ title, subtitle, rightComponent, style }) => {
  return (
    <View style={[styles.adminHeader, style]}>
      <View style={styles.adminHeaderContent}>
        <Text style={styles.adminHeaderTitle}>{title}</Text>
        {subtitle && <Text style={styles.adminHeaderSubtitle}>{subtitle}</Text>}
      </View>
      {rightComponent && (
        <View style={styles.adminHeaderRight}>
          {rightComponent}
        </View>
      )}
    </View>
  );
};

// Input minimalista para admin
export const AdminInput = ({ 
  label, 
  value, 
  onChangeText, 
  placeholder,
  multiline = false,
  numberOfLines = 1,
  style,
  ...props 
}) => {
  return (
    <View style={[styles.adminInputContainer, style]}>
      {label && <Text style={styles.adminInputLabel}>{label}</Text>}
      <View style={[
        styles.adminInput, 
        multiline && styles.adminInputMultiline,
        multiline && { height: numberOfLines * 24 + 32 }
      ]}>
        <Text
          style={[
            styles.adminInputText,
            multiline && styles.adminInputTextMultiline
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#999"
          multiline={multiline}
          numberOfLines={numberOfLines}
          textAlignVertical={multiline ? "top" : "center"}
          {...props}
        />
      </View>
    </View>
  );
};

// Separador minimalista
export const AdminDivider = ({ style }) => {
  return <View style={[styles.adminDivider, style]} />;
};

// Lista item minimalista
export const AdminListItem = ({ 
  title, 
  subtitle, 
  leftComponent, 
  rightComponent, 
  onPress,
  style 
}) => {
  return (
    <TouchableOpacity 
      style={[styles.adminListItem, style]} 
      onPress={onPress}
      disabled={!onPress}
    >
      {leftComponent && (
        <View style={styles.adminListItemLeft}>
          {leftComponent}
        </View>
      )}
      <View style={styles.adminListItemContent}>
        <Text style={styles.adminListItemTitle}>{title}</Text>
        {subtitle && <Text style={styles.adminListItemSubtitle}>{subtitle}</Text>}
      </View>
      {rightComponent && (
        <View style={styles.adminListItemRight}>
          {rightComponent}
        </View>
      )}
    </TouchableOpacity>
  );
};

// Modal overlay minimalista
export const AdminModalOverlay = ({ visible, onClose, children }) => {
  if (!visible) return null;

  return (
    <View style={styles.adminModalOverlay}>
      <TouchableOpacity 
        style={styles.adminModalBackdrop} 
        onPress={onClose}
        activeOpacity={1}
      />
      <View style={styles.adminModalContent}>
        {children}
      </View>
    </View>
  );
};

// Loading overlay
export const AdminLoadingOverlay = ({ visible, text = "Cargando..." }) => {
  if (!visible) return null;

  return (
    <View style={styles.adminLoadingOverlay}>
      <View style={styles.adminLoadingContent}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.adminLoadingText}>{text}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // AdminCard
  adminCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  // AdminButton
  adminButton: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  adminButtonPrimary: {
    backgroundColor: '#000',
  },
  adminButtonSecondary: {
    backgroundColor: '#6B7280',
  },
  adminButtonDanger: {
    backgroundColor: '#EF4444',
  },
  adminButtonSuccess: {
    backgroundColor: '#10B981',
  },
  adminButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  adminButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  adminButtonIcon: {
    marginRight: 8,
  },
  adminButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // AdminBadge
  adminBadge: {
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  adminBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },

  // AdminHeader
  adminHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  adminHeaderContent: {
    flex: 1,
  },
  adminHeaderTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  adminHeaderSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  adminHeaderRight: {
    marginLeft: 16,
  },

  // AdminInput
  adminInputContainer: {
    marginVertical: 8,
  },
  adminInputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  adminInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  adminInputMultiline: {
    paddingTop: 16,
  },
  adminInputText: {
    fontSize: 16,
    color: '#111827',
  },
  adminInputTextMultiline: {
    textAlignVertical: 'top',
  },

  // AdminDivider
  adminDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },

  // AdminListItem
  adminListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  adminListItemLeft: {
    marginRight: 16,
  },
  adminListItemContent: {
    flex: 1,
  },
  adminListItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  adminListItemSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  adminListItemRight: {
    marginLeft: 16,
  },

  // AdminModal
  adminModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  adminModalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  adminModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    maxWidth: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },

  // AdminLoadingOverlay
  adminLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  adminLoadingContent: {
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  adminLoadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
});
