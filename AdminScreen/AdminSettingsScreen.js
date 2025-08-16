// AdminSettingsScreen.js - Pantalla de configuraciones admin
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Switch,
  Linking,
} from 'react-native';
import { auth } from '../firebase';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import {
  AdminCard,
  AdminButton,
  AdminHeader,
  AdminDivider,
  AdminListItem,
} from './AdminComponents';

const AdminSettingsScreen = () => {
  const { t, i18n } = useTranslation();
  const [currentUser, setCurrentUser] = useState(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

  useEffect(() => {
    if (auth.currentUser) {
      setCurrentUser(auth.currentUser);
    }
  }, []);

  const handleSignOut = async () => {
    Alert.alert(
      t("Cerrar Sesión"),
      t("¿Estás seguro de que quieres cerrar sesión?"),
      [
        { text: t("Cancelar"), style: "cancel" },
        {
          text: t("Cerrar Sesión"),
          style: "destructive",
          onPress: async () => {
            try {
              await auth.signOut();
            } catch (error) {
              console.error("Error al cerrar sesión:", error);
              Alert.alert("Error", "No se pudo cerrar la sesión");
            }
          },
        },
      ]
    );
  };

  const handleLanguageChange = (languageCode) => {
    Alert.alert(
      'Cambiar Idioma',
      `¿Cambiar el idioma de la aplicación?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cambiar',
          onPress: () => {
            i18n.changeLanguage(languageCode);
            Alert.alert('Éxito', 'Idioma cambiado correctamente');
          },
        },
      ]
    );
  };

  const handleBackupData = () => {
    Alert.alert(
      'Respaldo de Datos',
      'Esta función permitirá exportar los datos de la aplicación.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Continuar',
          onPress: () => {
            Alert.alert('Información', 'Función de respaldo en desarrollo');
          },
        },
      ]
    );
  };

  const handleClearCache = () => {
    Alert.alert(
      'Limpiar Caché',
      '¿Estás seguro de que quieres limpiar el caché de la aplicación?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpiar',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Éxito', 'Caché limpiado correctamente');
          },
        },
      ]
    );
  };

  const handleContactSupport = () => {
    Alert.alert(
      'Contactar Soporte',
      'Selecciona una opción para contactar soporte:',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Email',
          onPress: () => {
            Linking.openURL('mailto:support@tashiro-jiujitsu.com');
          },
        },
        {
          text: 'WhatsApp',
          onPress: () => {
            Linking.openURL('https://wa.me/1234567890');
          },
        },
      ]
    );
  };

  const handleAbout = () => {
    Alert.alert(
      'Acerca de TASHIRO JIU-JITSU',
      `Versión: 1.2.0\nDesarrollado para la gestión de la academia de Jiu-Jitsu.\n\n© 2025 TASHIRO JIU-JITSU\nTodos los derechos reservados.`,
      [{ text: 'OK' }]
    );
  };

  const renderAccountSection = () => (
    <AdminCard style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>Cuenta de Administrador</Text>
      
      <View style={styles.accountInfo}>
        <View style={styles.adminAvatar}>
          <Ionicons name="shield-checkmark" size={32} color="#fff" />
        </View>
        <View style={styles.accountDetails}>
          <Text style={styles.accountName}>Administrador</Text>
          <Text style={styles.accountEmail}>
            {currentUser?.email || 'admin@tashiro-jiujitsu.com'}
          </Text>
          <View style={styles.adminBadge}>
            <Text style={styles.adminBadgeText}>ADMIN</Text>
          </View>
        </View>
      </View>

      <AdminDivider />

      <AdminButton
        title="Cerrar Sesión"
        onPress={handleSignOut}
        variant="danger"
        icon="log-out-outline"
        style={styles.signOutButton}
      />
    </AdminCard>
  );

  const renderPreferencesSection = () => (
    <AdminCard style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>Preferencias</Text>
      
      <AdminListItem
        title="Notificaciones"
        subtitle="Recibir notificaciones de la aplicación"
        leftComponent={
          <Ionicons name="notifications-outline" size={24} color="#6B7280" />
        }
        rightComponent={
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: '#D1D5DB', true: '#10B981' }}
            thumbColor={notificationsEnabled ? '#fff' : '#fff'}
          />
        }
      />

      <AdminListItem
        title="Modo Oscuro"
        subtitle="Cambiar apariencia de la aplicación"
        leftComponent={
          <Ionicons name="moon-outline" size={24} color="#6B7280" />
        }
        rightComponent={
          <Switch
            value={darkModeEnabled}
            onValueChange={setDarkModeEnabled}
            trackColor={{ false: '#D1D5DB', true: '#10B981' }}
            thumbColor={darkModeEnabled ? '#fff' : '#fff'}
          />
        }
      />
    </AdminCard>
  );

  const renderLanguageSection = () => (
    <AdminCard style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>Idioma</Text>
      
      <AdminListItem
        title="Español"
        subtitle="Cambiar a español"
        leftComponent={<Text style={styles.flagEmoji}>🇪🇸</Text>}
        onPress={() => handleLanguageChange('es')}
        rightComponent={
          i18n.language === 'es' && (
            <Ionicons name="checkmark" size={20} color="#10B981" />
          )
        }
      />

      <AdminListItem
        title="English"
        subtitle="Change to English"
        leftComponent={<Text style={styles.flagEmoji}>🇺🇸</Text>}
        onPress={() => handleLanguageChange('en')}
        rightComponent={
          i18n.language === 'en' && (
            <Ionicons name="checkmark" size={20} color="#10B981" />
          )
        }
      />

      <AdminListItem
        title="Português"
        subtitle="Mudar para português"
        leftComponent={<Text style={styles.flagEmoji}>🇧🇷</Text>}
        onPress={() => handleLanguageChange('pt')}
        rightComponent={
          i18n.language === 'pt' && (
            <Ionicons name="checkmark" size={20} color="#10B981" />
          )
        }
      />

      <AdminListItem
        title="日本語"
        subtitle="日本語に変更"
        leftComponent={<Text style={styles.flagEmoji}>🇯🇵</Text>}
        onPress={() => handleLanguageChange('ja')}
        rightComponent={
          i18n.language === 'ja' && (
            <Ionicons name="checkmark" size={20} color="#10B981" />
          )
        }
      />
    </AdminCard>
  );

  const renderDataSection = () => (
    <AdminCard style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>Gestión de Datos</Text>
      
      <AdminListItem
        title="Respaldar Datos"
        subtitle="Exportar datos de la aplicación"
        leftComponent={
          <Ionicons name="download-outline" size={24} color="#6B7280" />
        }
        onPress={handleBackupData}
        rightComponent={
          <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
        }
      />

      <AdminListItem
        title="Limpiar Caché"
        subtitle="Liberar espacio de almacenamiento"
        leftComponent={
          <Ionicons name="trash-outline" size={24} color="#6B7280" />
        }
        onPress={handleClearCache}
        rightComponent={
          <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
        }
      />
    </AdminCard>
  );

  const renderSupportSection = () => (
    <AdminCard style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>Soporte y Ayuda</Text>
      
      <AdminListItem
        title="Contactar Soporte"
        subtitle="Obtener ayuda técnica"
        leftComponent={
          <Ionicons name="help-circle-outline" size={24} color="#6B7280" />
        }
        onPress={handleContactSupport}
        rightComponent={
          <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
        }
      />

      <AdminListItem
        title="Acerca de"
        subtitle="Información de la aplicación"
        leftComponent={
          <Ionicons name="information-circle-outline" size={24} color="#6B7280" />
        }
        onPress={handleAbout}
        rightComponent={
          <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
        }
      />
    </AdminCard>
  );

  const renderQuickStats = () => (
    <AdminCard style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>Estadísticas Rápidas</Text>
      
      <View style={styles.quickStats}>
        <View style={styles.statItem}>
          <Ionicons name="people" size={24} color="#3B82F6" />
          <Text style={styles.statLabel}>Usuarios</Text>
          <Text style={styles.statValue}>-</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="fitness" size={24} color="#10B981" />
          <Text style={styles.statLabel}>Entrenamientos</Text>
          <Text style={styles.statValue}>-</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="chatbubbles" size={24} color="#F59E0B" />
          <Text style={styles.statLabel}>Mensajes</Text>
          <Text style={styles.statValue}>-</Text>
        </View>
      </View>
    </AdminCard>
  );

  return (
    <SafeAreaView style={styles.container}>
      <AdminHeader
        title="Configuraciones"
        subtitle="Panel de administración"
      />

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {renderAccountSection()}
        {renderQuickStats()}
        {renderPreferencesSection()}
        {renderLanguageSection()}
        {renderDataSection()}
        {renderSupportSection()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContainer: {
    flex: 1,
    padding: 16,
  },

  // Secciones
  sectionCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },

  // Cuenta
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  adminAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  accountDetails: {
    flex: 1,
  },
  accountName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  accountEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  adminBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  adminBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  signOutButton: {
    width: '100%',
  },

  // Idiomas
  flagEmoji: {
    fontSize: 24,
  },

  // Estadísticas rápidas
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
});

export default AdminSettingsScreen;
