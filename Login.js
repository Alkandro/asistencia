import React, { useState } from "react";
import { View, TextInput, Button, Alert, StyleSheet,Text, StatusBar,TouchableOpacity,Image,Dimensions } from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "./firebase"; // Asegúrate de importar Firestore
import { doc, getDoc } from "firebase/firestore"; // Para obtener el rol del usuario
import ButtonGradient from "./ButtonGradient";

// Obtener las dimensiones de la pantalla
const { width, height } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Por favor, ingresa tu correo electrónico y contraseña.");
      return;
    }

    try {
      // Iniciar sesión con correo y contraseña
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Obtener el documento del usuario desde Firestore
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userRole = userDoc.data().role;

        if (userRole === "admin") {
          // Si el usuario es admin, navegar a UserListScreen
          navigation.navigate("UserListScreen");
        } else {
          // Si el usuario no es admin, navegar a CheckInScreen
          navigation.navigate("CheckIn");
        }
      } else {
        Alert.alert("Error", "No se encontró el perfil del usuario en la base de datos.");
      }
    } catch (error) {
      Alert.alert("Error", `No se pudo iniciar sesión: ${error.message}`);
    }
  };

//   return (
//     <View style={styles.container}>
//       <TextInput
//         style={styles.input}
//         placeholder="Correo electrónico"
//         value={email}
//         onChangeText={setEmail}
//         keyboardType="email-address"
//         autoCapitalize="none"
//       />
//       <TextInput
//         style={styles.input}
//         placeholder="Contraseña"
//         value={password}
//         onChangeText={setPassword}
//         secureTextEntry
//       />
//       <Button title="Iniciar Sesión" onPress={handleLogin} />
//       <Button
//         title="¿No tienes una cuenta? Regístrate"
//         onPress={() => navigation.navigate("Register")}
//       />
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 20,
//     justifyContent: "center",
//   },
//   input: {
//     height: 40,
//     borderColor: "gray",
//     borderWidth: 1,
//     marginBottom: 12,
//     paddingHorizontal: 10,
//   },
// });
return (
  <View style={styles.mainContainer}>
     <StatusBar hidden={true} />
    <View style={styles.imageContainer}>
      <Image 
       source={require('./assets/fotos/IMG_5240.jpeg')} // para imagen local
       style={styles.image}
      />

     
    </View>
    <View style={styles.container}>
      <Text style={styles.titulo}>Hello</Text>
      <Text style={styles.subTitle}>Sign in to your account</Text>
      <TextInput 
      placeholder="overLimit@gmail.com" 
      value={email}
        onChangeText={setEmail}
         keyboardType="email-address"
         autoCapitalize="none"
      style={styles.textIput} />
      <TextInput 
       placeholder="Contraseña"
                value={password}
                onChangeText={setPassword}
                secureTextEntry 
      style={styles.textIput}
       />
      {/* <Text style={styles.forgotPassword}>Forgot your Password?</Text> */}
      <ButtonGradient  onPress={handleLogin}/>
      <TouchableOpacity  onPress={() => navigation.navigate("Register")}>
      <Text style={styles.forgotPassword}>Don't have an account?</Text>
      </TouchableOpacity>
      
    </View>
  </View>
);
}

const styles = StyleSheet.create({
mainContainer: {
  backgroundColor: "#f1f1f1",
  flex: 1,
},
container: {
  alignItems: "center",
  justifyContent: "center",
  width:'100%',
},

titulo: {
  fontSize: 80,
  color: "#34434D",
  fontWeight: "bold",
},
subTitle: {
  fontSize: 20,
  color: "gray",
},
textIput: {
  padding: 10,
  paddingStart: 30,
  width: "80%",
  height: 50,
  marginTop: 20,
  borderRadius: 30,
  backgroundColor: "#fff",
},
forgotPassword: {
  fontSize: 15,
  marginTop: 20,
  color: "gray",
 
},
image: {
  width: '100%',
    height: '100%',
    resizeMode: 'cover', // ajusta cómo se adapta la imagen
},
imageContainer: {
  width: '100%',
  height: height * 0.35, // 1/4 de la altura de la pantalla
},
});


export default LoginScreen;
