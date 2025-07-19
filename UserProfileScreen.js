// import React, { useEffect, useState } from "react";
// import {
//   View,
//   Text,
//   ActivityIndicator,
//   StyleSheet,
//   Image,
//   TextInput,
//   Modal,
//   SafeAreaView,
//   Platform,
// } from "react-native";
// import { auth, db } from "./firebase";
// import { doc, getDoc, updateDoc } from "firebase/firestore";
// import { MaterialIcons } from "@expo/vector-icons";
// import ButtonGradient from "./ButtonGradient";
// import { Picker } from "@react-native-picker/picker";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
// import { useTranslation } from "react-i18next";

// // Mapeo de imágenes de cinturones
// const beltImages = {
//   white: require("./assets/fotos/whitebelt.png"),
//   blue: require("./assets/fotos/bluebelt.png"),
//   purple: require("./assets/fotos/purplebelt.png"),
//   brown: require("./assets/fotos/brownbelt.png"),
//   black: require("./assets/fotos/blackbelt.png"),
// };

// const getBeltImage = (belt) =>
//   beltImages[belt?.toLowerCase()] || beltImages["white"];

// const UserProfileScreen = () => {
//   const { t } = useTranslation();
//   const [userData, setUserData] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [isEditing, setIsEditing] = useState(false);
//   const [newData, setNewData] = useState({});
//   const [newCinturon, setNewCinturon] = useState("");
//   const [imageUri, setImageUri] = useState(null);

//   useEffect(() => {
//     const loadImage = async () => {
//       const storedImageUri = await AsyncStorage.getItem("userImageUri");
//       if (storedImageUri) {
//         setImageUri(storedImageUri);
//       }
//     };
//     loadImage();
//     fetchUserData();
//   }, []);

//   // Obtener datos de Firestore
//   const fetchUserData = async () => {
//     try {
//       const user = auth.currentUser;
//       if (user) {
//         const userDoc = await getDoc(doc(db, "users", user.uid));
//         if (userDoc.exists()) {
//           setUserData(userDoc.data());
//         }
//       }
//     } catch (error) {
//       console.error("Error al obtener los datos del usuario:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Para abrir el modal de edición
//   const handleEdit = () => {
//     setNewData(userData);
//     setNewCinturon(userData.cinturon);
//     setIsEditing(true);
//   };

//   // Guardar cambios (reseteando contador si se cambió el cinturón)
//   const handleSave = async () => {
//     try {
//       const user = auth.currentUser;
//       if (!user) return;

//       const userDocRef = doc(db, "users", user.uid);
//       const snapshot = await getDoc(userDocRef);
//       if (!snapshot.exists()) return;

//       // Cinturón actual
//       const currentData = snapshot.data();
//       const oldBelt = currentData.cinturon || "white";
//       const updatedBelt = newCinturon || "white";

//       const updatedData = { ...newData, cinturon: updatedBelt };

//       // Si cambió de cinturón, reseteamos allTimeCheckIns
//       if (oldBelt !== updatedBelt) {
//         updatedData.allTimeCheckIns = 0;
//       }

//       // Actualiza en Firestore
//       await updateDoc(userDocRef, updatedData);

//       // Actualizamos estado local
//       setUserData(updatedData);
//       setIsEditing(false);
//     } catch (error) {
//       console.error("Error al actualizar los datos:", error);
//     }
//   };

//   if (loading) {
//     return <ActivityIndicator size="large" color="#0000ff" />;
//   }

//   // Formatear fecha de nacimiento
//   let birthDateString = "";
//   if (userData?.fechaNacimiento) {
//     const birthDate = new Date(userData.fechaNacimiento);
//     birthDateString = birthDate.toLocaleDateString("es-ES", {
//       year: "numeric",
//       month: "2-digit",
//       day: "2-digit",
//     });
//   }

//   return (
//     <SafeAreaView style={styles.mainContainer}>
//       <View style={styles.container}>
//         {/* Cabecera con imagen de perfil y botón de editar */}
//         <View style={styles.fixedHeader}>
//           <View style={styles.imagenPerfil}>
//             {imageUri ? (
//               <Image
//                 source={{ uri: imageUri }}
//                 style={{ width: 100, height: 100, borderRadius: 50 }}
//               />
//             ) : (
//               <Image
//                 source={require("./assets/fotos/tashiro1.png")}
//                 style={{ width: 100, height: 100, borderRadius: 50 }}
//               />
//             )}
//           </View>
//           <View style={styles.buttonContainer}>
//             <ButtonGradient
//               title={t("Editar Perfil")}
//               onPress={handleEdit}
//               style={styles.button}
//             />
//           </View>
//         </View>

//         {/* Datos del usuario */}
//         <View style={styles.profileDataContainer}>
//           {userData ? (
//             <>
//               <View style={styles.infoRow}>
//                 <MaterialIcons
//                   name="badge"
//                   size={20}
//                   color="#000"
//                   style={styles.icon}
//                 />
//                 <Text style={styles.text}>{userData.nombre}</Text>
//               </View>
//               <View style={styles.infoRow}>
//                 <MaterialIcons
//                   name="badge"
//                   size={20}
//                   color="#000"
//                   style={styles.icon}
//                 />
//                 <Text style={styles.text}>{userData.apellido}</Text>
//               </View>
//               <View style={styles.infoRow}>
//                 <MaterialIcons
//                   name="person"
//                   size={20}
//                   color="#000"
//                   style={styles.icon}
//                 />
//                 <Text style={styles.text}>{userData.username}</Text>
//               </View>
//               <View style={styles.infoRow}>
//                 <MaterialIcons
//                   name="phone"
//                   size={20}
//                   color="#000"
//                   style={styles.icon}
//                 />
//                 <Text style={styles.text}>{userData.phone}</Text>
//               </View>
//               <View style={styles.infoRow}>
//                 <MaterialIcons
//                   name="location-city"
//                   size={20}
//                   color="#000"
//                   style={styles.icon}
//                 />
//                 <Text style={styles.text}>{userData.ciudad}</Text>
//               </View>
//               <View style={styles.infoRow}>
//                 <MaterialIcons
//                   name="location-on"
//                   size={20}
//                   color="#000"
//                   style={styles.icon}
//                 />
//                 <Text style={styles.text}>{userData.provincia}</Text>
//               </View>

//               <View style={styles.infoRow}>
//                 <MaterialIcons
//                   name="cake"
//                   size={20}
//                   color="#000"
//                   style={styles.icon}
//                 />
//                 <Text style={styles.text}>
//                   {birthDateString ? birthDateString : "--"}
//                 </Text>
//               </View>

//               <View style={styles.infoRow}>
//                 <MaterialIcons
//                   name="schedule"
//                   size={20}
//                   color="#000"
//                   style={styles.icon}
//                 />
//                 <Text style={styles.text}>
//                   {userData.edad ? `${userData.edad} años` : "--"}
//                 </Text>
//               </View>
//               <View style={styles.infoRow}>
//                 <MaterialIcons
//                   name="scale"
//                   size={20}
//                   color="#000"
//                   style={styles.icon}
//                 />
//                 <Text style={styles.text}>
//                   {userData.peso ? `${userData.peso} kg` : "--"}
//                 </Text>
//               </View>
//               <View style={styles.infoRow}>
//                 <MaterialIcons
//                   name="height"
//                   size={20}
//                   color="#000"
//                   style={styles.icon}
//                 />
//                 <Text style={styles.text}>
//                   {userData.altura ? `${userData.altura} cm` : "--"}
//                 </Text>
//               </View>

//               {/* CINTURÓN */}
//               <View style={styles.infoRow}>
//                 <Image
//                   source={getBeltImage(userData.cinturon)}
//                   style={styles.icon1}
//                 />
//                 <Text style={styles.text}>{userData.cinturon}</Text>
//               </View>

//               <View style={styles.infoRow}>
//                 <MaterialIcons
//                   name="wc"
//                   size={20}
//                   color="#000"
//                   style={styles.icon}
//                 />
//                 <Text style={styles.text}>{userData.genero}</Text>
//               </View>

//               <View style={styles.infoRow}>
//                 <MaterialIcons
//                   name="email"
//                   size={20}
//                   color="#000"
//                   style={styles.icon}
//                 />
//                 <Text style={styles.text}>{userData.email}</Text>
//               </View>
//             </>
//           ) : (
//             <Text style={styles.text1}>
//               {t("No se encontraron datos del usuario")}
//             </Text>
//           )}
//         </View>
//       </View>

//       {/* Modal de edición */}
//       <Modal visible={isEditing} animationType="slide">
//         <View style={styles.modalContainer}>
//           <Text style={styles.modalTitle}>{t("Editar Perfil")}</Text>
//           <KeyboardAwareScrollView
//             keyboardShouldPersistTaps="handled"
//             behavior={Platform.OS === "ios" ? "padding" : "height"}
//             style={{ width: "100%" }}
//             contentContainerStyle={styles.modalScrollContent}
//           >
//             <Text style={styles.text1}>{t("Nombre")}</Text>
//             <TextInput
//               style={styles.TextInput}
//               value={`${newData.nombre || ""}`}
//               onChangeText={(text) => setNewData({ ...newData, nombre: text })}
//               placeholder="Nombre"
//               placeholderTextColor="red"
//             />

//             <Text style={styles.text1}>{t("Apellido")}</Text>
//             <TextInput
//               style={styles.TextInput}
//               value={`${newData.apellido || ""}`}
//               onChangeText={(text) => setNewData({ ...newData, apellido: text })}
//               placeholder="Apellido"
//               placeholderTextColor="red"
//             />

//             <Text style={styles.text1}>{t("User")}</Text>
//             <TextInput
//               style={styles.TextInput}
//               value={`${newData.username || ""}`}
//               onChangeText={(text) =>
//                 setNewData({ ...newData, username: text })
//               }
//               placeholder="User"
//               placeholderTextColor="red"
//             />

//             <Text style={styles.text1}>{t("Cinturón")}</Text>
//             <View style={styles.pickerContainer}>
//               <Picker
//                 selectedValue={newCinturon}
//                 onValueChange={(value) => setNewCinturon(value)}
//                 mode={Platform.OS === "android" ? "dropdown" : undefined}
//                 style={styles.picker}
//               >
//                 <Picker.Item label={t("Blanco")} value="white" />
//                 <Picker.Item label={t("Azul")} value="blue" />
//                 <Picker.Item label={t("Violeta")} value="purple" />
//                 <Picker.Item label={t("Marron")} value="brown" />
//                 <Picker.Item label={t("Negro")} value="black" />
//               </Picker>
//             </View>

//             {newCinturon ? (
//               <Image
//                 source={getBeltImage(newCinturon)}
//                 style={styles.beltImage}
//               />
//             ) : null}

//             <Text style={styles.text1}>{t("Teléfono")}</Text>
//             <TextInput
//               style={styles.TextInput}
//               value={`${newData.phone || ""}`}
//               onChangeText={(text) => setNewData({ ...newData, phone: text })}
//               placeholder="Teléfono"
//               placeholderTextColor="red"
//             />

//             <Text style={styles.text1}>{t("Ciudad")}</Text>
//             <TextInput
//               style={styles.TextInput}
//               value={`${newData.ciudad || ""}`}
//               onChangeText={(text) => setNewData({ ...newData, ciudad: text })}
//               placeholder="Ciudad"
//               placeholderTextColor="red"
//             />

//             <Text style={styles.text1}>{t("Provincia")}</Text>
//             <TextInput
//               style={styles.TextInput}
//               value={`${newData.provincia || ""}`}
//               onChangeText={(text) =>
//                 setNewData({ ...newData, provincia: text })
//               }
//               placeholder="Provincia"
//               placeholderTextColor="red"
//             />

//             <Text style={styles.text1}>{t("Peso")}</Text>
//             <TextInput
//               style={styles.TextInput}
//               value={`${newData.peso || ""}`}
//               onChangeText={(text) => setNewData({ ...newData, peso: text })}
//               placeholder="Peso"
//               placeholderTextColor="red"
//             />

//             <Text style={styles.text1}>{t("Altura")}</Text>
//             <TextInput
//               style={styles.TextInput}
//               value={`${newData.altura || ""}`}
//               onChangeText={(text) => setNewData({ ...newData, altura: text })}
//               placeholder="Altura"
//               placeholderTextColor="red"
//             />

//             <Text style={styles.text1}>{t("Correo electrónico")}</Text>
//             <TextInput
//               style={styles.TextInput}
//               value={`${newData.email || ""}`}
//               onChangeText={(text) => setNewData({ ...newData, email: text })}
//               placeholder="Email"
//               placeholderTextColor="red"
//             />

//             <Text style={styles.text1}>{t("Género")}</Text>
//             <View style={styles.pickerContainer}>
//               <Picker
//                 selectedValue={newData.genero}
//                 onValueChange={(value) =>
//                   setNewData({ ...newData, genero: value })
//                 }
//                 mode={Platform.OS === "android" ? "dropdown" : undefined}
//                 style={styles.picker1}
//               >
//                 <Picker.Item label={t("Masculino")} value="Masculino" />
//                 <Picker.Item label={t("Femenino")} value="Femenino" />
//               </Picker>
//             </View>
//           </KeyboardAwareScrollView>

//           <View style={{ flexDirection: "row", marginTop: 20 }}>
//             <View style={styles.buttonContainer2}>
//               <ButtonGradient
//                 title={t("Cancelar")}
//                 onPress={() => setIsEditing(false)}
//                 style={styles.button2}
//               />
//             </View>
//             <View style={styles.buttonContainer1}>
//               <ButtonGradient
//                 title={t("Guardar")}
//                 onPress={handleSave}
//                 style={styles.button1}
//               />
//             </View>
//           </View>
//         </View>
//       </Modal>
//     </SafeAreaView>
//   );
// };

// export default UserProfileScreen;

// const styles = StyleSheet.create({
//   mainContainer: {
//     flex: 1,
//     backgroundColor: "#fff",
//     paddingBottom: Platform.OS === "android" ? 60 : 0,
//   },
//   container: {
//     flex: 1,
//     backgroundColor: "#fff",
//   },
//   fixedHeader: {
//     backgroundColor: "#fff",
//     paddingVertical: 10,
//     paddingTop: Platform.OS === "ios" ? 10 : 20,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   imagenPerfil: {
//     marginBottom: 10,
//   },
//   buttonContainer: {
//     marginTop: 5,
//   },
//   button: {
//     borderRadius: 25,
//     padding: 15,
//     width: 230,
//   },
//   profileDataContainer: {
//     paddingHorizontal: 16,
//     paddingVertical: 10,
//   },
//   infoRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginVertical: Platform.OS === "ios" ? 8 : 3,
//   },
//   icon: {
//     marginRight: 8,
//     color: "#000",
//   },
//   text: {
//     fontSize: 16,
//     fontWeight: "bold",
//   },
//   text1: {
//     fontSize: 15,
//     fontStyle: "italic",
//     fontWeight: "bold",
//     color: "#000",
//     marginTop: 10,
//   },
//   icon1: {
//     width: 60,
//     height: 20,
//     marginRight: 8,
//     resizeMode: "contain",
//   },
//   beltImage: {
//     width: 90,
//     height: 55,
//     resizeMode: "contain",
//     alignSelf: "center",
//     marginVertical: 10,
//   },
//   modalContainer: {
//     flex: 1,
//     backgroundColor: "#DCE6E5",
//     alignItems: "center",
//     padding: 16,
//     paddingTop: Platform.OS === "ios" ? 60 : 10,
//   },
//   modalTitle: {
//     color: "#000",
//     fontSize: 18,
//     fontStyle: "italic",
//     marginBottom: 15,
//     fontWeight: "bold",
//     alignSelf: "center",
//   },
//   modalScrollContent: {
//     alignItems: "center",
//     paddingBottom: 20,
//   },
//   TextInput: {
//     padding: 10,
//     width: "100%",
//     height: 50,
//     marginTop: 3,
//     borderRadius: 10,
//     backgroundColor: "#fff",
//   },
//   pickerContainer: {
//     width: "100%",
//     borderWidth: 3,
//     borderColor: "gray",
//     borderRadius: 15,
//     marginTop: 5,
//     backgroundColor: "#fff",
//   },
//   picker: {
//     width: "100%",
//     height: Platform.OS === "ios" ? 200 : 60,
//     color: "#000",
//   },
//   picker1: {
//     width: "100%",
//     color: "#000",
//     ...Platform.select({
//       ios: {
//         height: 140,
//         marginTop: -40,
//         marginBottom: 40,
//       },
//       android: {
//         height: 60,
//       },
//     }),
//   },
//   buttonContainer2: {
//     alignItems: "center",
//     justifyContent: "center",
//     padding: 10,
//     borderRadius: 10,
//     marginBottom: 10,
//     width: "50%",
//   },
//   buttonContainer1: {
//     alignItems: "center",
//     justifyContent: "center",
//     padding: 10,
//     borderRadius: 10,
//     marginBottom: 10,
//     width: "50%",
//   },
//   button2: {
//     borderRadius: 25,
//     padding: 10,
//     width: 140,
//     marginTop: 15,
//     marginRight: 10,
//   },
//   button1: {
//     borderRadius: 25,
//     padding: 10,
//     width: 140,
//     marginTop: 15,
//     marginLeft: 10,
//   },
// });
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Image,
  Modal,
  SafeAreaView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { auth, db } from "./firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { MaterialIcons } from "@expo/vector-icons";
import ButtonMinimal from "./ButtonMinimal";
import InputMinimal from "./InputMinimal";
import CardMinimal from "./CardMinimal";
import { Picker } from "@react-native-picker/picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useTranslation } from "react-i18next";
import Icon from "react-native-vector-icons/Ionicons";

// Mapeo de imágenes de cinturones
const beltImages = {
  white: require("./assets/fotos/whitebelt.png"),
  blue: require("./assets/fotos/bluebelt.png"),
  purple: require("./assets/fotos/purplebelt.png"),
  brown: require("./assets/fotos/brownbelt.png"),
  black: require("./assets/fotos/blackbelt.png"),
};

const getBeltImage = (belt) =>
  beltImages[belt?.toLowerCase()] || beltImages["white"];

const getBeltColor = (belt) => {
  const beltColorMap = {
    white: "#000000",
    blue: "#4285F4",
    purple: "#AA60C8",
    brown: "#8B4513",
    black: "#000000",
  };
  return beltColorMap[belt] || "#333333";
};

const UserProfileScreen = () => {
  const { t } = useTranslation();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [newData, setNewData] = useState({});
  const [newCinturon, setNewCinturon] = useState("");
  const [imageUri, setImageUri] = useState(null);

  useEffect(() => {
    const loadImage = async () => {
      const storedImageUri = await AsyncStorage.getItem("userImageUri");
      if (storedImageUri) {
        setImageUri(storedImageUri);
      }
    };
    loadImage();
    fetchUserData();
  }, []);

  // Obtener datos de Firestore
  const fetchUserData = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
      }
    } catch (error) {
      console.error("Error al obtener los datos del usuario:", error);
    } finally {
      setLoading(false);
    }
  };

  // Para abrir el modal de edición
  const handleEdit = () => {
    setNewData(userData);
    setNewCinturon(userData.cinturon);
    setIsEditing(true);
  };

  // Guardar cambios (reseteando contador si se cambió el cinturón)
  const handleSave = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userDocRef = doc(db, "users", user.uid);
      const snapshot = await getDoc(userDocRef);
      if (!snapshot.exists()) return;

      // Cinturón actual
      const currentData = snapshot.data();
      const oldBelt = currentData.cinturon || "white";
      const updatedBelt = newCinturon || "white";

      const updatedData = { ...newData, cinturon: updatedBelt };

      // Si cambió de cinturón, reseteamos allTimeCheckIns
      if (oldBelt !== updatedBelt) {
        updatedData.allTimeCheckIns = 0;
      }

      // Actualiza en Firestore
      await updateDoc(userDocRef, updatedData);

      // Actualizamos estado local
      setUserData(updatedData);
      setIsEditing(false);
    } catch (error) {
      console.error("Error al actualizar los datos:", error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000000" />
      </View>
    );
  }

  // Formatear fecha de nacimiento
  let birthDateString = "";
  if (userData?.fechaNacimiento) {
    const birthDate = new Date(userData.fechaNacimiento);
    birthDateString = birthDate.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  }

  // Datos del perfil organizados
  const profileData = [
    { icon: "person", label: t("Nombre"), value: userData?.nombre },
    { icon: "person", label: t("Apellido"), value: userData?.apellido },
    { icon: "at", label: t("Usuario"), value: `@${userData?.username}` },
    { icon: "call", label: t("Teléfono"), value: userData?.phone },
    { icon: "location", label: t("Ciudad"), value: userData?.ciudad },
    { icon: "location-outline", label: t("Provincia"), value: userData?.provincia },
    { icon: "calendar", label: t("Fecha de Nacimiento"), value: birthDateString || "--" },
    { icon: "time", label: t("Edad"), value: userData?.edad ? `${userData.edad} años` : "--" },
    { icon: "fitness", label: t("Peso"), value: userData?.peso ? `${userData.peso} kg` : "--" },
    { icon: "resize", label: t("Altura"), value: userData?.altura ? `${userData.altura} cm` : "--" },
    { icon: "male-female", label: t("Género"), value: userData?.genero },
    { icon: "mail", label: t("Correo"), value: userData?.email },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Header con imagen de perfil */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.avatar} />
            ) : (
              <Image
                source={require("./assets/fotos/tashiro1.png")}
                style={styles.avatar}
              />
            )}
          </View>
          <Text style={styles.userName}>
            {userData?.nombre} {userData?.apellido}
          </Text>
          <Text style={styles.userHandle}>@{userData?.username}</Text>
          
          {/* Cinturón destacado */}
          <View style={styles.beltSection}>
            <Image
              source={getBeltImage(userData?.cinturon)}
              style={styles.beltImage}
            />
            <Text style={[styles.beltText, { color: getBeltColor(userData?.cinturon) }]}>
              {userData?.cinturon?.charAt(0).toUpperCase() + userData?.cinturon?.slice(1)}
            </Text>
          </View>

          <ButtonMinimal
            title={t("Editar Perfil")}
            onPress={handleEdit}
            variant="outline"
            style={styles.editButton}
          />
        </View>

        {/* Información del perfil */}
        <View style={styles.infoSection}>
          {userData ? (
            profileData.map((item, index) => (
              item.value && (
                <CardMinimal key={index} style={styles.infoCard}>
                  <View style={styles.infoRow}>
                    <Icon
                      name={item.icon}
                      size={20}
                      color="#666666"
                      style={styles.infoIcon}
                    />
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>{item.label}</Text>
                      <Text style={styles.infoValue}>{item.value}</Text>
                    </View>
                  </View>
                </CardMinimal>
              )
            ))
          ) : (
            <CardMinimal style={styles.infoCard}>
              <Text style={styles.noDataText}>
                {t("No se encontraron datos del usuario")}
              </Text>
            </CardMinimal>
          )}
        </View>
      </ScrollView>

      {/* Modal de edición */}
      <Modal visible={isEditing} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          {/* Header del modal */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setIsEditing(false)}
              style={styles.modalCloseButton}
            >
              <Icon name="close" size={24} color="#000000" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{t("Editar Perfil")}</Text>
            <View style={styles.modalCloseButton} />
          </View>

          <KeyboardAwareScrollView
            style={styles.modalScrollContainer}
            contentContainerStyle={styles.modalScrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.modalForm}>
              <View style={styles.formRow}>
                <InputMinimal
                  label={t("Nombre")}
                  value={newData.nombre || ""}
                  onChangeText={(text) => setNewData({ ...newData, nombre: text })}
                  placeholder={t("Nombre")}
                  style={styles.halfInput}
                />
                <InputMinimal
                  label={t("Apellido")}
                  value={newData.apellido || ""}
                  onChangeText={(text) => setNewData({ ...newData, apellido: text })}
                  placeholder={t("Apellido")}
                  style={styles.halfInput}
                />
              </View>

              <InputMinimal
                label={t("Usuario")}
                value={newData.username || ""}
                onChangeText={(text) => setNewData({ ...newData, username: text })}
                placeholder={t("Usuario")}
              />

              <View style={styles.formSection}>
                <Text style={styles.sectionLabel}>{t("Cinturón")}</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={newCinturon}
                    onValueChange={(value) => setNewCinturon(value)}
                    style={styles.picker}
                  >
                    <Picker.Item label={t("Blanco")} value="white" />
                    <Picker.Item label={t("Azul")} value="blue" />
                    <Picker.Item label={t("Violeta")} value="purple" />
                    <Picker.Item label={t("Marrón")} value="brown" />
                    <Picker.Item label={t("Negro")} value="black" />
                  </Picker>
                </View>
                {newCinturon && (
                  <View style={styles.beltPreview}>
                    <Image
                      source={getBeltImage(newCinturon)}
                      style={styles.beltPreviewImage}
                    />
                  </View>
                )}
              </View>

              <View style={styles.formRow}>
                <InputMinimal
                  label={t("Teléfono")}
                  value={newData.phone || ""}
                  onChangeText={(text) => setNewData({ ...newData, phone: text })}
                  placeholder={t("Teléfono")}
                  keyboardType="phone-pad"
                  style={styles.halfInput}
                />
                <InputMinimal
                  label={t("Ciudad")}
                  value={newData.ciudad || ""}
                  onChangeText={(text) => setNewData({ ...newData, ciudad: text })}
                  placeholder={t("Ciudad")}
                  style={styles.halfInput}
                />
              </View>

              <InputMinimal
                label={t("Provincia")}
                value={newData.provincia || ""}
                onChangeText={(text) => setNewData({ ...newData, provincia: text })}
                placeholder={t("Provincia")}
              />

              <View style={styles.formRow}>
                <InputMinimal
                  label={t("Peso (kg)")}
                  value={newData.peso || ""}
                  onChangeText={(text) => setNewData({ ...newData, peso: text })}
                  placeholder={t("Peso")}
                  keyboardType="numeric"
                  style={styles.halfInput}
                />
                <InputMinimal
                  label={t("Altura (cm)")}
                  value={newData.altura || ""}
                  onChangeText={(text) => setNewData({ ...newData, altura: text })}
                  placeholder={t("Altura")}
                  keyboardType="numeric"
                  style={styles.halfInput}
                />
              </View>

              <View style={styles.formSection}>
                <Text style={styles.sectionLabel}>{t("Género")}</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={newData.genero}
                    onValueChange={(value) => setNewData({ ...newData, genero: value })}
                    style={styles.picker}
                  >
                    <Picker.Item label={t("Masculino")} value="Masculino" />
                    <Picker.Item label={t("Femenino")} value="Femenino" />
                  </Picker>
                </View>
              </View>

              <InputMinimal
                label={t("Correo electrónico")}
                value={newData.email || ""}
                onChangeText={(text) => setNewData({ ...newData, email: text })}
                placeholder={t("Correo")}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </KeyboardAwareScrollView>

          {/* Botones del modal */}
          <View style={styles.modalButtons}>
            <ButtonMinimal
              title={t("Cancelar")}
              onPress={() => setIsEditing(false)}
              variant="outline"
              style={styles.modalButton}
            />
            <ButtonMinimal
              title={t("Guardar")}
              onPress={handleSave}
              style={styles.modalButton}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 20 : 40,
    paddingBottom: 32,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  userName: {
    fontSize: 24,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 4,
  },
  userHandle: {
    fontSize: 16,
    color: "#666666",
    marginBottom: 20,
  },
  beltSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  beltImage: {
    width: 80,
    height: 30,
    resizeMode: "contain",
    marginBottom: 8,
  },
  beltText: {
    fontSize: 18,
    fontWeight: "600",
  },
  editButton: {
    paddingHorizontal: 32,
  },
  infoSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  infoCard: {
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoIcon: {
    marginRight: 16,
    width: 20,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: "#666666",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: "#000000",
    fontWeight: "500",
  },
  noDataText: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    fontStyle: "italic",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
  },
  modalScrollContainer: {
    flex: 1,
  },
  modalScrollContent: {
    paddingBottom: 40,
  },
  modalForm: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  formRow: {
    flexDirection: "row",
    gap: 16,
  },
  halfInput: {
    flex: 1,
  },
  formSection: {
    marginVertical: 16,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333333",
    marginBottom: 8,
  },
  pickerContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  picker: {
    height: Platform.OS === 'ios' ? 190 : 'auto',
    width: '100%',
    backgroundColor: '#33333',
    transform: [{ scale: 0.95 }], // Reducir tamaño a 85%
  },
  beltPreview: {
    alignItems: "center",
    marginTop: 16,
  },
  beltPreviewImage: {
    width: 60,
    height: 25,
    resizeMode: "contain",
  },
  modalButtons: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
});

export default UserProfileScreen;
