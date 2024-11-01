import React, { useEffect } from 'react';
import { View, Image,Text, StyleSheet } from 'react-native';
import Animated, { Easing, useSharedValue, useAnimatedStyle, withTiming, withDelay, withRepeat } from 'react-native-reanimated';

const AnimatedMessage = () => {
  const opacity = useSharedValue(0);  
  const translateY = useSharedValue(50);  
  

  // Valores compartidos para la segunda imagen
  const opacity2 = useSharedValue(0);
  const translateY2 = useSharedValue(50);
  

  // Valores compartidos para el texto "hola"
  const opacityText = useSharedValue(1);
 

  const animatedStyles = useAnimatedStyle(() => ({
    
      opacity: opacity.value,
      transform: [
        { translateY: translateY.value },
         
      ],
    
  }));
  const animatedStyle2 = useAnimatedStyle(() => ({
    opacity: opacity2.value,
    transform: [{ translateY: translateY2.value }, 
     
    ],
  }));

  const animatedTextStyle = useAnimatedStyle(() => ({
    opacity: opacityText.value,
    
  }));

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 8000, easing: Easing.inOut(Easing.ease) });
    translateY.value = withTiming(0, { duration: 8000, easing: Easing.inOut(Easing.ease) });
    

    // Animación para la segunda imagen, con velocidad diferente
    opacity2.value = withDelay(1000, withTiming(1, { duration: 8000, easing: Easing.inOut(Easing.ease) }));
    translateY2.value = withDelay(1000, withTiming(0, { duration: 8000, easing: Easing.inOut(Easing.ease) }));

   

    // Animación de parpadeo para el texto
    opacityText.value = withRepeat(
      withTiming(-1, { duration: 500, easing: Easing.inOut(Easing.ease) }),
      -1,  // -1 indica que se repite indefinidamente
      true  // alterna entre opacidad 1 y 0
    );
  
  }, []);

  return (
    <View style={styles.contentContainer}>
       <Animated.View style={[styles.textContainer, animatedTextStyle]}>
        <Text style={styles.text}>Welcome!!</Text>
      </Animated.View>
    <Animated.View style={[styles.messageContainer, animatedStyles]}>
      <Image 
        source={require('./assets/fotos/overLimit.png')}  // Asegúrate de ajustar la ruta a tu imagen
        style={styles.image}  // Aplica estilos personalizados a la imagen
        resizeMode="contain"
      />
    </Animated.View>
    <Animated.View style={[styles.messageContainer1, animatedStyle2]}>
        <Image 
        source={require('./assets/fotos/TashiroBlack.jpg')}
         style={styles.image} />
      </Animated.View>
     
    </View>
  );
};

const AppSplashScreen = () => {
  return (
    <View style={styles.container}>
      <AnimatedMessage />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  contentContainer: {
    alignItems: 'center',
  },
  messageContainer: {
    margin:5,
  },
  messageContainer1: {
    margin:-10,
  },
  image: {
    width: 200,  // Ajusta el tamaño de la imagen según tu diseño
    height: 200,
  },
  text: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
  textContainer: {
    marginTop: 10,
  },
});

export default AppSplashScreen;
