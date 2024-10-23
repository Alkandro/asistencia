// import React, { useEffect, useState } from 'react';
// import { NavigationContainer } from '@react-navigation/native';
// import { createStackNavigator } from '@react-navigation/stack';
// import LoginScreen from './Login';
// import CheckInScreen from './CheckInScreen';
// import AttendanceHistoryScreen from './AttendanceHistoryScreen';
// import RegisterScreen from './RegisterScreen'; // Asegúrate de importar la pantalla de registro
// import UserProfileScreen from './UserProfileScreen'; // Importa la pantalla de perfil
// import firebase from './firebase'; // Asegúrate de que Firebase esté inicializado correctamente

// const Stack = createStackNavigator();

// const App = () => {
//   return (
//     <NavigationContainer>
//       <Stack.Navigator initialRouteName="Login">
//         <Stack.Screen name="Login" component={LoginScreen} />
//         <Stack.Screen name="CheckIn" component={CheckInScreen} />
//         <Stack.Screen name="AttendanceHistory" component={AttendanceHistoryScreen} />
//         <Stack.Screen name="Register" component={RegisterScreen} />
//         <Stack.Screen name="UserProfile" component={UserProfileScreen} />
//       </Stack.Navigator>
//     </NavigationContainer>
//   );
// };

// export default App;

import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View } from 'react-native';
import LoginScreen from './Login';
import CheckInScreen from './CheckInScreen';
import AttendanceHistoryScreen from './AttendanceHistoryScreen';
import RegisterScreen from './RegisterScreen';
import UserProfileScreen from './UserProfileScreen';
import { auth } from './firebase'; // Asegúrate de que Firebase esté inicializado correctamente

const Stack = createStackNavigator();

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((authUser) => {
      setUser(authUser);
      setIsLoading(false);
    });

    return () => unsubscribe(); // Cleanup al desmontar el componente
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={user ? 'CheckIn' : 'Login'}>
        {!user ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="CheckIn" component={CheckInScreen} />
            <Stack.Screen name="AttendanceHistory" component={AttendanceHistoryScreen} />
            <Stack.Screen name="UserProfile" component={UserProfileScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;

