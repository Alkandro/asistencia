// AdminDashboardScreen.js - Panel de control admin con estadísticas
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  Dimensions,
} from 'react-native';
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
  AdminCard,
  AdminButton,
  AdminHeader,
  AdminDivider,
  AdminLoadingOverlay,
} from './AdminComponents';

const { width } = Dimensions.get('window');

const AdminDashboardScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Estados para estadísticas
  const [totalUsers, setTotalUsers] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [totalTrainings, setTotalTrainings] = useState(0);
  const [monthlyTrainings, setMonthlyTrainings] = useState(0);
  const [totalMessages, setTotalMessages] = useState(0);
  const [recentActivity, setRecentActivity] = useState([]);
  const [beltDistribution, setBeltDistribution] = useState({});
  const [topUsers, setTopUsers] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Suscribirse a usuarios
      const usersRef = collection(db, 'users');
      const usersQuery = query(usersRef, where('role', '!=', 'admin'));
      
      const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
        const users = [];
        let totalTrainingsCount = 0;
        let monthlyTrainingsCount = 0;
        const beltCount = {};
        
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
        
        snapshot.forEach((doc) => {
          const userData = doc.data();
          users.push({ id: doc.id, ...userData });
          
          // Contar entrenamientos totales
          totalTrainingsCount += userData.allTimeCheckIns || 0;
          
          // Contar entrenamientos del mes actual
          const monthlyData = userData.monthlyCheckInCount || {};
          monthlyTrainingsCount += monthlyData[currentMonth] || 0;
          
          // Distribución de cinturones
          const belt = userData.cinturon || 'white';
          beltCount[belt] = (beltCount[belt] || 0) + 1;
        });
        
        setTotalUsers(users.length);
        setActiveUsers(users.filter(u => (u.allTimeCheckIns || 0) > 0).length);
        setTotalTrainings(totalTrainingsCount);
        setMonthlyTrainings(monthlyTrainingsCount);
        setBeltDistribution(beltCount);
        
        // Top usuarios por entrenamientos
        const sortedUsers = users
          .sort((a, b) => (b.allTimeCheckIns || 0) - (a.allTimeCheckIns || 0))
          .slice(0, 5);
        setTopUsers(sortedUsers);
      });

      // Suscribirse a mensajes
      const messagesRef = collection(db, 'messages');
      const unsubscribeMessages = onSnapshot(messagesRef, (snapshot) => {
        setTotalMessages(snapshot.size);
      });

      // Obtener actividad reciente
      await fetchRecentActivity();
      
      setLoading(false);
      
      // Cleanup function
      return () => {
        unsubscribeUsers();
        unsubscribeMessages();
      };
    } catch (error) {
      console.error('Error al cargar datos del dashboard:', error);
      setLoading(false);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      // Obtener entrenamientos recientes
      const attendanceQuery = query(
        collection(db, 'attendanceHistory'),
        orderBy('timestamp', 'desc'),
        limit(10)
      );
      
      const attendanceSnapshot = await getDocs(attendanceQuery);
      const activities = [];
      
      for (const doc of attendanceSnapshot.docs) {
        const data = doc.data();
        activities.push({
          id: doc.id,
          type: 'training',
          userId: data.userId,
          username: data.username || 'Usuario',
          timestamp: data.timestamp,
        });
      }
      
      setRecentActivity(activities);
    } catch (error) {
      console.error('Error al obtener actividad reciente:', error);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchDashboardData().finally(() => setRefreshing(false));
  }, []);

  const getBeltColor = (belt) => {
    const colors = {
      white: '#F3F4F6',
      blue: '#3B82F6',
      purple: '#8B5CF6',
      brown: '#A16207',
      black: '#111827',
    };
    return colors[belt?.toLowerCase()] || colors.white;
  };

  const getBeltTextColor = (belt) => {
    const darkBelts = ['purple', 'brown', 'black'];
    return darkBelts.includes(belt?.toLowerCase()) ? '#fff' : '#111827';
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Fecha no disponible';
    
    try {
      const date = timestamp.toDate();
      const now = new Date();
      const diffInHours = (now - date) / (1000 * 60 * 60);
      
      if (diffInHours < 1) {
        return 'Hace unos minutos';
      } else if (diffInHours < 24) {
        return `Hace ${Math.floor(diffInHours)} horas`;
      } else {
        return date.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        });
      }
    } catch (error) {
      return 'Fecha no disponible';
    }
  };

  const renderStatCard = (title, value, icon, color = '#111827', subtitle = '') => (
    <AdminCard style={[styles.statCard, { width: (width - 48) / 2 }]}>
      <View style={styles.statHeader}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </AdminCard>
  );

  const renderBeltDistribution = () => (
    <AdminCard style={styles.distributionCard}>
      <Text style={styles.sectionTitle}>Distribución de Cinturones</Text>
      <View style={styles.beltList}>
        {Object.entries(beltDistribution).map(([belt, count]) => (
          <View key={belt} style={styles.beltItem}>
            <View style={styles.beltInfo}>
              <View style={[styles.beltIndicator, { backgroundColor: getBeltColor(belt) }]} />
              <Text style={styles.beltName}>
                {belt.charAt(0).toUpperCase() + belt.slice(1)}
              </Text>
            </View>
            <Text style={styles.beltCount}>{count}</Text>
          </View>
        ))}
      </View>
    </AdminCard>
  );

  const renderTopUsers = () => (
    <AdminCard style={styles.topUsersCard}>
      <Text style={styles.sectionTitle}>Top Usuarios</Text>
      <View style={styles.usersList}>
        {topUsers.map((user, index) => (
          <View key={user.id} style={styles.userItem}>
            <View style={styles.userRank}>
              <Text style={styles.rankNumber}>{index + 1}</Text>
            </View>
            <View style={[
              styles.userAvatar,
              { backgroundColor: getBeltColor(user.cinturon) }
            ]}>
              <Text style={[
                styles.userAvatarText,
                { color: getBeltTextColor(user.cinturon) }
              ]}>
                {(user.nombre || user.username || 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {user.nombre || user.username || 'Usuario'}
              </Text>
              <Text style={styles.userTrainings}>
                {user.allTimeCheckIns || 0} entrenamientos
              </Text>
            </View>
          </View>
        ))}
      </View>
    </AdminCard>
  );

  const renderRecentActivity = () => (
    <AdminCard style={styles.activityCard}>
      <Text style={styles.sectionTitle}>Actividad Reciente</Text>
      <View style={styles.activityList}>
        {recentActivity.length > 0 ? (
          recentActivity.map((activity) => (
            <View key={activity.id} style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Ionicons name="fitness-outline" size={20} color="#10B981" />
              </View>
              <View style={styles.activityInfo}>
                <Text style={styles.activityText}>
                  <Text style={styles.activityUser}>{activity.username}</Text>
                  {' registró un entrenamiento'}
                </Text>
                <Text style={styles.activityTime}>
                  {formatDate(activity.timestamp)}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.noActivityText}>No hay actividad reciente</Text>
        )}
      </View>
    </AdminCard>
  );

  const renderQuickActions = () => (
    <AdminCard style={styles.actionsCard}>
      <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
      <View style={styles.actionButtons}>
        <AdminButton
          title="Ver Usuarios"
          icon="people-outline"
          variant="secondary"
          style={styles.actionButton}
          onPress={() => navigation.navigate('UserListScreen')}
        />
        <AdminButton
          title="Enviar Mensaje"
          icon="send-outline"
          variant="primary"
          style={styles.actionButton}
          onPress={() => navigation.navigate('Messages')}
        />
      </View>
    </AdminCard>
  );

  if (loading) {
    return <AdminLoadingOverlay visible={true} text="Cargando dashboard..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <AdminHeader
        title="Panel de Control"
        subtitle="Resumen de la academia"
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
        {/* Estadísticas principales */}
        <View style={styles.statsRow}>
          {renderStatCard('Usuarios', totalUsers, 'people-outline', '#3B82F6')}
          {renderStatCard('Activos', activeUsers, 'checkmark-circle-outline', '#10B981')}
        </View>
        
        <View style={styles.statsRow}>
          {renderStatCard('Entrenamientos', totalTrainings, 'fitness-outline', '#F59E0B', 'Total')}
          {renderStatCard('Este Mes', monthlyTrainings, 'calendar-outline', '#8B5CF6')}
        </View>

        <View style={styles.statsRow}>
          {renderStatCard('Mensajes', totalMessages, 'chatbubbles-outline', '#EF4444')}
          {renderStatCard('Academia', '2025', 'school-outline', '#6B7280', 'Año actual')}
        </View>

        {/* Distribución de cinturones */}
        {renderBeltDistribution()}

        {/* Top usuarios */}
        {renderTopUsers()}

        {/* Actividad reciente */}
        {renderRecentActivity()}

        {/* Acciones rápidas */}
        {renderQuickActions()}
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
  refreshButton: {
    padding: 8,
  },

  // Estadísticas
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  statHeader: {
    marginBottom: 12,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  statSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },

  // Secciones
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },

  // Distribución de cinturones
  distributionCard: {
    marginBottom: 16,
  },
  beltList: {
    gap: 12,
  },
  beltItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  beltInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  beltIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  beltName: {
    fontSize: 16,
    color: '#111827',
  },
  beltCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },

  // Top usuarios
  topUsersCard: {
    marginBottom: 16,
  },
  usersList: {
    gap: 12,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  userRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    fontSize: 16,
    fontWeight: '700',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  userTrainings: {
    fontSize: 14,
    color: '#6B7280',
  },

  // Actividad reciente
  activityCard: {
    marginBottom: 16,
  },
  activityList: {
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: '#111827',
    marginBottom: 2,
  },
  activityUser: {
    fontWeight: '600',
  },
  activityTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  noActivityText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingVertical: 20,
  },

  // Acciones rápidas
  actionsCard: {
    marginBottom: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
});

export default AdminDashboardScreen;
