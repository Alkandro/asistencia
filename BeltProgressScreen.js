import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  Image,
  Platform,
} from "react-native";
import { auth, db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import CardMinimal from "./CardMinimal";
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

const BeltProgressScreen = () => {
  const { t } = useTranslation();
  const [userBelt, setUserBelt] = useState("white");
  const [allTimeCheckIns, setAllTimeCheckIns] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Obtener datos del usuario
  const fetchUserData = useCallback(async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        setUserBelt(data.cinturon || "white");
        setAllTimeCheckIns(data.allTimeCheckIns || 0);
      }
    } catch (error) {
      console.error("Error al obtener datos de usuario:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  useFocusEffect(
    useCallback(() => {
      fetchUserData();
    }, [fetchUserData])
  );

  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserData();
    setRefreshing(false);
  };

  // Calcular información del progreso
  const calculateDanInfo = (beltColor, totalCheckIns) => {
    const color = beltColor.toLowerCase();
    const total = totalCheckIns || 0;
    const groupSize = color === "white" ? 40 : 60;
    const maxDan = 4;

    const rawGroup = Math.floor(total / groupSize);
    let currentDan = rawGroup + 1;
    if (currentDan > maxDan) currentDan = maxDan;

    let countInGroup = total % groupSize;
    if (countInGroup === 0 && total > 0) {
      countInGroup = groupSize;
    }

    return { rawGroup, currentDan, groupSize, countInGroup };
  };

  function getDanLabel(danNumber) {
    switch (danNumber) {
      case 1:
        return t("Primer Dan");
      case 2:
        return t("Segundo Dan");
      case 3:
        return t("Tercer Dan");
      case 4:
        return t("Cuarto Dan");
      default:
        return "";
    }
  }

  // Función para obtener el color del cinturón
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

  const { rawGroup, currentDan, groupSize, countInGroup } = calculateDanInfo(userBelt, allTimeCheckIns);
  const currentDanLabel = getDanLabel(currentDan);
  const progressPercentage = (countInGroup / groupSize) * 100;
  const remainingTrainings = groupSize - countInGroup;

  // Información sobre la lógica de progresión
  const getProgressionInfo = () => {
    if (userBelt.toLowerCase() === "white") {
      return {
        title: t("Cinturón Blanco"),
        description: t("3 series de 40 entrenamientos"),
        series: [
          { dan: 1, trainings: 40, label: t("Primer Dan") },
          { dan: 2, trainings: 40, label: t("Segundo Dan") },
          { dan: 3, trainings: 40, label: t("Tercer Dan") },
        ],
        nextBelt: t("Cinturón Azul"),
      };
    } else {
      return {
        title: t("Otros Cinturones"),
        description: t("4 series de 60 entrenamientos"),
        series: [
          { dan: 1, trainings: 60, label: t("Primer Dan") },
          { dan: 2, trainings: 60, label: t("Segundo Dan") },
          { dan: 3, trainings: 60, label: t("Tercer Dan") },
          { dan: 4, trainings: 60, label: t("Cuarto Dan") },
        ],
        nextBelt: t("Siguiente Cinturón"),
      };
    }
  };

  const progressionInfo = getProgressionInfo();

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t("Cargando...")}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#000000"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header con progreso circular */}
        <View style={styles.headerSection}>
          <View style={styles.progressCircleContainer}>
            <View style={styles.progressCircle}>
              <View 
                style={[
                  styles.progressFill,
                  { 
                    height: `${progressPercentage}%`,
                    backgroundColor: getBeltColor(userBelt),
                  }
                ]}
              />
              <View style={styles.progressContent}>
                <Text style={styles.progressNumber}>{countInGroup}</Text>
                <Text style={styles.progressDivider}>/</Text>
                <Text style={styles.progressTotal}>{groupSize}</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.progressInfo}>
            <Text style={styles.currentDanText}>{currentDanLabel}</Text>
            <Text style={[styles.beltText, { color: getBeltColor(userBelt) }]}>
              {userBelt.charAt(0).toUpperCase() + userBelt.slice(1)}
            </Text>
          </View>
        </View>

        {/* Imagen del cinturón */}
        <View style={styles.beltImageSection}>
          <Image
            source={getBeltImage(userBelt)}
            style={styles.beltImage}
          />
        </View>

        {/* Información de progreso */}
        <CardMinimal style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Icon name="information-circle-outline" size={24} color="#4285F4" />
            <Text style={styles.infoTitle}>{t("Progreso Actual")}</Text>
          </View>
          <Text style={styles.infoText}>
            {remainingTrainings > 0 
              ? t("Faltan {{count}} entrenamientos para el próximo dan", { count: remainingTrainings })
              : t("¡Felicidades! Has completado este dan.")
            }
          </Text>
        </CardMinimal>

        {/* Explicación de la lógica de progresión */}
        <CardMinimal style={styles.explanationCard}>
          <View style={styles.explanationHeader}>
            <Icon name="school-outline" size={24} color="#28A745" />
            <Text style={styles.explanationTitle}>{t("Lógica de Progresión")}</Text>
          </View>
          
          <View style={styles.progressionRule}>
            <Text style={styles.ruleTitle}>{progressionInfo.title}:</Text>
            <Text style={styles.ruleDescription}>{progressionInfo.description}</Text>
          </View>

          <View style={styles.seriesContainer}>
            {progressionInfo.series.map((serie, index) => (
              <View key={index} style={styles.serieItem}>
                <View style={[
                  styles.serieIndicator,
                  { 
                    backgroundColor: currentDan > serie.dan ? getBeltColor(userBelt) : "#E0E0E0",
                  }
                ]} />
                <Text style={[
                  styles.serieText,
                  { 
                    color: currentDan >= serie.dan ? "#000000" : "#666666",
                    fontWeight: currentDan === serie.dan ? "600" : "400",
                  }
                ]}>
                  {serie.label} - {serie.trainings} entrenamientos
                </Text>
                {currentDan === serie.dan && (
                  <Icon name="arrow-forward" size={16} color={getBeltColor(userBelt)} />
                )}
              </View>
            ))}
          </View>

          <View style={styles.nextBeltInfo}>
            <Text style={styles.nextBeltText}>
              {t("Al completar todas las series: {{nextBelt}}", { nextBelt: progressionInfo.nextBelt })}
            </Text>
          </View>
        </CardMinimal>

        {/* Estadísticas adicionales */}
        <CardMinimal style={styles.statsCard}>
          <View style={styles.statsHeader}>
            <Icon name="stats-chart-outline" size={24} color="#FF6B35" />
            <Text style={styles.statsTitle}>{t("Estadísticas")}</Text>
          </View>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{allTimeCheckIns}</Text>
              <Text style={styles.statLabel}>{t("Total Entrenamientos")}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{Math.round(progressPercentage)}%</Text>
              <Text style={styles.statLabel}>{t("Progreso Actual")}</Text>
            </View>
          </View>
        </CardMinimal>
      </ScrollView>
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
  },
  loadingText: {
    fontSize: 16,
    color: "#666666",
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  headerSection: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 20 : 40,
    paddingBottom: 30,
  },
  progressCircleContainer: {
    marginBottom: 20,
  },
  progressCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#F0F0F0",
    position: "relative",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  progressFill: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: 60,
  },
  progressContent: {
    flexDirection: "row",
    alignItems: "baseline",
    zIndex: 1,
  },
  progressNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000000",
  },
  progressDivider: {
    fontSize: 18,
    color: "#666666",
    marginHorizontal: 2,
  },
  progressTotal: {
    fontSize: 18,
    color: "#666666",
  },
  progressInfo: {
    alignItems: "center",
  },
  currentDanText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 4,
  },
  beltText: {
    fontSize: 18,
    fontWeight: "500",
  },
  beltImageSection: {
    alignItems: "center",
    marginBottom: 30,
  },
  beltImage: {
    width: 120,
    height: 40,
    resizeMode: "contain",
  },
  infoCard: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
    marginLeft: 8,
  },
  infoText: {
    fontSize: 16,
    color: "#333333",
    lineHeight: 22,
  },
  explanationCard: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  explanationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  explanationTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
    marginLeft: 8,
  },
  progressionRule: {
    marginBottom: 20,
  },
  ruleTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 4,
  },
  ruleDescription: {
    fontSize: 14,
    color: "#666666",
  },
  seriesContainer: {
    marginBottom: 20,
  },
  serieItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  serieIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  serieText: {
    flex: 1,
    fontSize: 14,
  },
  nextBeltInfo: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  nextBeltText: {
    fontSize: 14,
    color: "#28A745",
    fontWeight: "500",
    textAlign: "center",
  },
  statsCard: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  statsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
    marginLeft: 8,
  },
  statsGrid: {
    flexDirection: "row",
    alignItems: "center",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#E0E0E0",
    marginHorizontal: 20,
  },
});

export default BeltProgressScreen;
