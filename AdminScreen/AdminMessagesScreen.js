import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  TextInput,
  Image,
  Modal,
  RefreshControl,
} from 'react-native';
import {
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import { db, storage } from '../firebase';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import {
  AdminCard,
  AdminButton,
  AdminHeader,
  AdminDivider,
  AdminModalOverlay,
  AdminLoadingOverlay,
} from './AdminComponents';

const AdminMessagesScreen = () => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  
  // Estados para crear mensaje
  const [portugueseText, setPortugueseText] = useState('');
  const [japaneseText, setJapaneseText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  
  // Estados para editar mensaje
  const [editingMessage, setEditingMessage] = useState(null);
  const [editPortugueseText, setEditPortugueseText] = useState('');
  const [editJapaneseText, setEditJapaneseText] = useState('');
  const [editSelectedImage, setEditSelectedImage] = useState(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const messagesRef = collection(db, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const messagesList = [];
        snapshot.forEach((docSnap) => {
          messagesList.push({ id: docSnap.id, ...docSnap.data() });
        });
        setMessages(messagesList);
        setLoading(false);
      },
      (error) => {
        console.error('Error al obtener mensajes:', error);
        Alert.alert('Error', 'No se pudieron cargar los mensajes');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const pickImage = async (isEdit = false) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        if (isEdit) {
          setEditSelectedImage(result.assets[0]);
        } else {
          setSelectedImage(result.assets[0]);
        }
      }
    } catch (error) {
      console.error('Error al seleccionar imagen:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  const uploadImage = async (imageAsset) => {
    try {
      const response = await fetch(imageAsset.uri);
      const blob = await response.blob();
      
      const filename = `messages/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
      const imageRef = ref(storage, filename);
      
      await uploadBytes(imageRef, blob);
      const downloadURL = await getDownloadURL(imageRef);
      
      return downloadURL;
    } catch (error) {
      console.error('Error al subir imagen:', error);
      throw error;
    }
  };

  const handleSendMessage = async () => {
    if (!portugueseText.trim() && !japaneseText.trim()) {
      Alert.alert('Error', 'Debes escribir al menos un mensaje en portugués o japonés');
      return;
    }

    try {
      setSending(true);
      
      let imageUrl = null;
      if (selectedImage) {
        imageUrl = await uploadImage(selectedImage);
      }

      await addDoc(collection(db, 'messages'), {
        text: portugueseText.trim() || '', // Portugués
        additionalField1: japaneseText.trim() || '', // Japonés
        imageUrl: imageUrl,
        createdAt: serverTimestamp(),
      });

      // Limpiar formulario
      setPortugueseText('');
      setJapaneseText('');
      setSelectedImage(null);
      
      Alert.alert('Éxito', 'Mensaje enviado correctamente');
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      Alert.alert('Error', 'No se pudo enviar el mensaje');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (messageId, imageUrl) => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro de que quieres eliminar este mensaje?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              // Eliminar imagen si existe
              if (imageUrl) {
                try {
                  const imageRef = ref(storage, imageUrl);
                  await deleteObject(imageRef);
                } catch (imageError) {
                  console.error('Error al eliminar imagen:', imageError);
                }
              }

              // Eliminar documento
              await deleteDoc(doc(db, 'messages', messageId));
              Alert.alert('Éxito', 'Mensaje eliminado correctamente');
            } catch (error) {
              console.error('Error al eliminar mensaje:', error);
              Alert.alert('Error', 'No se pudo eliminar el mensaje');
            }
          },
        },
      ]
    );
  };

  const handleEditMessage = (message) => {
    setEditingMessage(message);
    setEditPortugueseText(message.text || '');
    setEditJapaneseText(message.additionalField1 || '');
    setEditSelectedImage(null);
  };

  const handleUpdateMessage = async () => {
    if (!editPortugueseText.trim() && !editJapaneseText.trim()) {
      Alert.alert('Error', 'Debes escribir al menos un mensaje en portugués o japonés');
      return;
    }

    try {
      setUpdating(true);
      
      let imageUrl = editingMessage.imageUrl;
      
      // Si hay nueva imagen, subirla
      if (editSelectedImage) {
        imageUrl = await uploadImage(editSelectedImage);
        
        // Eliminar imagen anterior si existe
        if (editingMessage.imageUrl) {
          try {
            const oldImageRef = ref(storage, editingMessage.imageUrl);
            await deleteObject(oldImageRef);
          } catch (imageError) {
            console.error('Error al eliminar imagen anterior:', imageError);
          }
        }
      }

      await updateDoc(doc(db, 'messages', editingMessage.id), {
        text: editPortugueseText.trim() || '',
        additionalField1: editJapaneseText.trim() || '',
        imageUrl: imageUrl,
      });

      setEditingMessage(null);
      Alert.alert('Éxito', 'Mensaje actualizado correctamente');
    } catch (error) {
      console.error('Error al actualizar mensaje:', error);
      Alert.alert('Error', 'No se pudo actualizar el mensaje');
    } finally {
      setUpdating(false);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const clearNewMessage = () => {
    setPortugueseText('');
    setJapaneseText('');
    setSelectedImage(null);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Fecha no disponible';
    
    try {
      const date = timestamp.toDate();
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return 'Fecha no disponible';
    }
  };

  const renderMessageCard = (message) => (
    <AdminCard key={message.id} style={styles.messageCard}>
      <View style={styles.messageHeader}>
        <View style={styles.messageInfo}>
          <Text style={styles.messageDate}>{formatDate(message.createdAt)}</Text>
        </View>
        <View style={styles.messageActions}>
          <TouchableOpacity
            onPress={() => handleEditMessage(message)}
            style={styles.actionButton}
          >
            <Ionicons name="create-outline" size={20} color="#3B82F6" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDeleteMessage(message.id, message.imageUrl)}
            style={styles.actionButton}
          >
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Contenido del mensaje */}
      <View style={styles.messageContent}>
        {message.text && (
          <View style={styles.languageSection}>
            <View style={styles.languageHeader}>
              <Text style={styles.languageFlag}>🇧🇷</Text>
              <Text style={styles.languageLabel}>Portugués</Text>
            </View>
            <Text style={styles.messageText}>{message.text}</Text>
          </View>
        )}

        {message.additionalField1 && (
          <View style={styles.languageSection}>
            <View style={styles.languageHeader}>
              <Text style={styles.languageFlag}>🇯🇵</Text>
              <Text style={styles.languageLabel}>Japonés</Text>
            </View>
            <Text style={styles.messageText}>{message.additionalField1}</Text>
          </View>
        )}

        {message.imageUrl && (
          <View style={styles.imageSection}>
            <Image source={{ uri: message.imageUrl }} style={styles.messageImage} />
          </View>
        )}
      </View>
    </AdminCard>
  );

  const renderCreateMessageForm = () => (
    <AdminCard style={styles.createCard}>
      <Text style={styles.sectionTitle}>Crear Nuevo Mensaje</Text>
      
      {/* Input Portugués */}
      <View style={styles.inputSection}>
        <View style={styles.inputHeader}>
          <Text style={styles.languageFlag}>🇧🇷</Text>
          <Text style={styles.inputLabel}>Mensaje en Portugués</Text>
        </View>
        <TextInput
          style={styles.textInput}
          value={portugueseText}
          onChangeText={setPortugueseText}
          placeholder="Escribe el mensaje en portugués..."
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      {/* Input Japonés */}
      <View style={styles.inputSection}>
        <View style={styles.inputHeader}>
          <Text style={styles.languageFlag}>🇯🇵</Text>
          <Text style={styles.inputLabel}>Mensaje en Japonés</Text>
        </View>
        <TextInput
          style={styles.textInput}
          value={japaneseText}
          onChangeText={setJapaneseText}
          placeholder="Escribe el mensaje en japonés..."
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      {/* Imagen */}
      <View style={styles.imageInputSection}>
        <Text style={styles.inputLabel}>Imagen (Opcional)</Text>
        {selectedImage ? (
          <View style={styles.selectedImageContainer}>
            <Image source={{ uri: selectedImage.uri }} style={styles.selectedImage} />
            <TouchableOpacity
              onPress={() => setSelectedImage(null)}
              style={styles.removeImageButton}
            >
              <Ionicons name="close-circle" size={24} color="#EF4444" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={() => pickImage(false)} style={styles.imagePickerButton}>
            <Ionicons name="image-outline" size={24} color="#6B7280" />
            <Text style={styles.imagePickerText}>Seleccionar imagen</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Botones de acción */}
      <View style={styles.actionButtons}>
        <AdminButton
          title="Limpiar"
          onPress={clearNewMessage}
          variant="secondary"
          icon="refresh-outline"
          style={styles.clearButton}
        />
        <AdminButton
          title="Enviar"
          onPress={handleSendMessage}
          loading={sending}
          icon="send-outline"
          style={styles.sendButton}
        />
      </View>
    </AdminCard>
  );

  const renderEditModal = () => (
    <AdminModalOverlay
      visible={!!editingMessage}
      onClose={() => setEditingMessage(null)}
    >
      <ScrollView style={styles.editModal} showsVerticalScrollIndicator={false}>
        <View style={styles.editHeader}>
          <Text style={styles.editTitle}>Editar Mensaje</Text>
          <TouchableOpacity onPress={() => setEditingMessage(null)}>
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <AdminDivider />

        {/* Input Portugués */}
        <View style={styles.inputSection}>
          <View style={styles.inputHeader}>
            <Text style={styles.languageFlag}>🇧🇷</Text>
            <Text style={styles.inputLabel}>Mensaje en Portugués</Text>
          </View>
          <TextInput
            style={styles.textInput}
            value={editPortugueseText}
            onChangeText={setEditPortugueseText}
            placeholder="Escribe el mensaje en portugués..."
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Input Japonés */}
        <View style={styles.inputSection}>
          <View style={styles.inputHeader}>
            <Text style={styles.languageFlag}>🇯🇵</Text>
            <Text style={styles.inputLabel}>Mensaje en Japonés</Text>
          </View>
          <TextInput
            style={styles.textInput}
            value={editJapaneseText}
            onChangeText={setEditJapaneseText}
            placeholder="Escribe el mensaje en japonés..."
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Imagen actual y nueva */}
        <View style={styles.imageInputSection}>
          <Text style={styles.inputLabel}>Imagen</Text>
          
          {editingMessage?.imageUrl && !editSelectedImage && (
            <View style={styles.currentImageContainer}>
              <Text style={styles.currentImageLabel}>Imagen actual:</Text>
              <Image source={{ uri: editingMessage.imageUrl }} style={styles.currentImage} />
            </View>
          )}

          {editSelectedImage ? (
            <View style={styles.selectedImageContainer}>
              <Text style={styles.newImageLabel}>Nueva imagen:</Text>
              <Image source={{ uri: editSelectedImage.uri }} style={styles.selectedImage} />
              <TouchableOpacity
                onPress={() => setEditSelectedImage(null)}
                style={styles.removeImageButton}
              >
                <Ionicons name="close-circle" size={24} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={() => pickImage(true)} style={styles.imagePickerButton}>
              <Ionicons name="image-outline" size={24} color="#6B7280" />
              <Text style={styles.imagePickerText}>
                {editingMessage?.imageUrl ? 'Cambiar imagen' : 'Seleccionar imagen'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Botones de acción */}
        <View style={styles.editActions}>
          <AdminButton
            title="Cancelar"
            onPress={() => setEditingMessage(null)}
            variant="secondary"
            style={styles.cancelButton}
          />
          <AdminButton
            title="Actualizar"
            onPress={handleUpdateMessage}
            loading={updating}
            icon="checkmark-outline"
            style={styles.updateButton}
          />
        </View>
      </ScrollView>
    </AdminModalOverlay>
  );

  return (
    <SafeAreaView style={styles.container}>
      <AdminHeader
        title="Gestión de Mensajes"
        subtitle={`${messages.length} mensaje${messages.length !== 1 ? 's' : ''} activo${messages.length !== 1 ? 's' : ''}`}
        rightComponent={
          <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
            <Ionicons name="refresh" size={24} color="#6B7280" />
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Formulario para crear mensaje */}
        {renderCreateMessageForm()}

        {/* Lista de mensajes */}
        <View style={styles.messagesSection}>
          <Text style={styles.sectionTitle}>Mensajes Activos</Text>
          {messages.length > 0 ? (
            messages.map(renderMessageCard)
          ) : (
            <AdminCard style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyStateTitle}>No hay mensajes</Text>
              <Text style={styles.emptyStateSubtitle}>
                Los mensajes que envíes aparecerán aquí
              </Text>
            </AdminCard>
          )}
        </View>
      </ScrollView>

      {/* Modal de edición */}
      {renderEditModal()}

      <AdminLoadingOverlay visible={loading} text="Cargando mensajes..." />
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
  refreshButton: {
    padding: 8,
  },
  
  // Crear mensaje
  createCard: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  inputSection: {
    marginBottom: 16,
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  languageFlag: {
    fontSize: 20,
    marginRight: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    minHeight: 80,
  },
  imageInputSection: {
    marginBottom: 20,
  },
  selectedImageContainer: {
    position: 'relative',
    marginTop: 8,
  },
  selectedImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: 8,
    marginTop: 8,
  },
  imagePickerText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#6B7280',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  clearButton: {
    flex: 1,
  },
  sendButton: {
    flex: 2,
  },

  // Lista de mensajes
  messagesSection: {
    marginBottom: 20,
  },
  messageCard: {
    marginBottom: 16,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  messageInfo: {
    flex: 1,
  },
  messageDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  messageActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  messageContent: {
    gap: 12,
  },
  languageSection: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
  },
  languageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  languageLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  messageText: {
    fontSize: 16,
    color: '#111827',
    lineHeight: 24,
  },
  imageSection: {
    marginTop: 8,
  },
  messageImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },

  // Modal de edición
  editModal: {
    maxHeight: '90%',
  },
  editHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  editTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  currentImageContainer: {
    marginTop: 8,
  },
  currentImageLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  currentImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  newImageLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
  },
  updateButton: {
    flex: 1,
  },

  // Estado vacío
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});

export default AdminMessagesScreen;
