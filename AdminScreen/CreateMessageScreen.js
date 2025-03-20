import React, { useState, useRef } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Alert,
  Image,
} from "react-native";
import { auth, storage, db } from "../firebase";
import * as ImagePicker from "expo-image-picker";
import {
  addDoc,
  collection,
  serverTimestamp,
  updateDoc,
  doc,
} from "firebase/firestore";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import MessageForm from "./MessageForm";
import { useTranslation } from "react-i18next";

export default function CreateMessageScreen() {
  const { t } = useTranslation(); // Hook para traducción
  const [message, setMessage] = useState("");
  const [additionalField1, setAdditionalField1] = useState("");

  const [localImageUri, setLocalImageUri] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const textInputRef = useRef(null);
  const defaultImage = require("../assets/fotos/tashiro1.png");

  const handleChooseImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled) {
      setLocalImageUri(result.assets[0].uri);
    }
  };
  const uploadImageToStorage = async (uri) => {
    if (!uri) return null;
  
    let imageUri = uri;
  
    // ✅ Convertir imagen local de `require()` en URI
    if (typeof uri === "number") {
      const asset = Image.resolveAssetSource(uri);
      if (asset && asset.uri) {
        imageUri = asset.uri;
      } else {
        console.error("No se pudo resolver la imagen predeterminada.");
        return null; // Evitar errores si la imagen no se resuelve
      }
    }
  
    const user = auth.currentUser;
    const imageName = `images/${user.uid}/${Date.now()}_${Math.random()
      .toString(36)
      .substring(7)}.jpg`;
    const imageRef = ref(storage, imageName);
  
    const blob = await (await fetch(imageUri)).blob();
    const uploadTask = uploadBytesResumable(imageRef, blob);
  
    return new Promise((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        null,
        (error) => reject(error),
        async () => {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadUrl);
        }
      );
    });
  };
  
  

  const handleSaveMessage = async () => {
    if (message.trim().length === 0) {
      Alert.alert("Error", "Por favor escribe un mensaje.");
      return;
    }
  
    try {
      let imageUrl = null;
  
      if (localImageUri) {
        setUploading(true);
        imageUrl = await uploadImageToStorage(localImageUri);
        setUploading(false);
      } else {
        setUploading(true);
        imageUrl = await uploadImageToStorage(defaultImage); // ✅ Ahora `uploadImageToStorage` maneja `require()`
        setUploading(false);
      }
  
      const user = auth.currentUser;
  
      if (editingMessage) {
        const messageRef = doc(db, "messages", editingMessage.id);
        await updateDoc(messageRef, {
          text: message.trim(),
          additionalField1: additionalField1.trim(),
          imageUrl,
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, "messages"), {
          text: message.trim(),
          additionalField1: additionalField1.trim(),
          imageUrl,
          createdAt: serverTimestamp(),
          authorId: user.uid,
        });
      }
  
      Keyboard.dismiss();
      setMessage("");
      setAdditionalField1("");
      setLocalImageUri(null);
    } catch (error) {
      console.error("Error al guardar mensaje:", error);
    }
  };
  
  
  
  
  

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
      >
        <ScrollView keyboardShouldPersistTaps="always">
          <MessageForm
            ref={textInputRef}
            message={message}
            setMessage={setMessage}
            additionalField1={additionalField1}
            setAdditionalField1={setAdditionalField1}
            localImageUri={localImageUri}
            setLocalImageUri={setLocalImageUri}
            handleChooseImage={handleChooseImage}
            handleSaveMessage={handleSaveMessage}
            uploading={uploading}
            editingMessage={editingMessage}
            defaultImage={defaultImage}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  keyboardView: {
    flex: 1,
  },
});
