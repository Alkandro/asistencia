// import React from "react";
// import {
//   StyleSheet,
//   Text,
//   View,
//   TextInput,
//   Dimensions,
//   TouchableOpacity,
// } from "react-native";
// import { LinearGradient } from "expo-linear-gradient";

// export default function ButtonGradient({onPress, title = "Click Me", style, textStyle, ...props}) {
//   return (
//     <TouchableOpacity onPress={onPress} style={[styles.button, style]} {...props}>
//       <LinearGradient
//         // Button Linear Gradient
//         colors={["#FFB677", "#FF3CBD"]}
//         start={{ x: 0, y: 1 }}
//         end={{ x: 1, y: 1 }}
//         style={styles.button}
//       >
//         <Text style={styles.text}>{title}</Text>
//       </LinearGradient>
//     </TouchableOpacity>
//   );
// }
// const styles = StyleSheet.create({
//   container: {
//     alignItems: "center",
//     width: 200,
//     marginTop: 60,
//   },
//   text: {
//     fontSize: 14,
//     color: "#fff",
//     fontWeight: "bold",
//   },
//   button: {
//     width: "80%",
//     height: 50,
//     borderRadius: 25,
//     padding: 10,
//     alignItems: "center",
//     justifyContent: "center",
//   },
// });
