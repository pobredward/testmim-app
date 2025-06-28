import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
  Alert,
  Image,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SocialAuthService, AuthUser } from '../services/socialAuth';

const { width } = Dimensions.get('window');

type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  MyPage: undefined;
};

type ProfileDropdownNavigationProp = StackNavigationProp<RootStackParamList>;

interface ProfileDropdownProps {
  user: AuthUser | null;
  onUserChange: (user: AuthUser | null) => void;
}

export default function ProfileDropdown({ user, onUserChange }: ProfileDropdownProps) {
  const { t } = useTranslation();
  const navigation = useNavigation<ProfileDropdownNavigationProp>();
  const [isVisible, setIsVisible] = useState(false);

  const handleSignOut = async () => {
    try {
      await SocialAuthService.signOut();
      onUserChange(null);
      setIsVisible(false);
      Alert.alert('로그아웃', '로그아웃되었습니다.');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('오류', '로그아웃 중 오류가 발생했습니다.');
    }
  };

  const handleLogin = () => {
    setIsVisible(false);
    navigation.navigate('Login');
  };

  return (
    <>
      <TouchableOpacity
        style={styles.trigger}
        onPress={() => setIsVisible(true)}
        activeOpacity={0.7}
      >
        {user?.photoURL ? (
          <Image 
            source={{ uri: user.photoURL }} 
            style={styles.profileImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.defaultProfile}>
            <Text style={styles.profileIcon}>👤</Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal
        visible={isVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsVisible(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setIsVisible(false)}
        >
          <View style={styles.modal}>
            {user ? (
              // 로그인된 상태
              <>
                {(user.nickname || user.displayName || user.email) && (
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>
                      {user.nickname || user.displayName || user.email}님
                    </Text>
                  </View>
                )}
                
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setIsVisible(false);
                    navigation.navigate('MyPage');
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.menuIcon}>👤</Text>
                  <Text style={styles.menuText}>마이페이지</Text>
                </TouchableOpacity>

                <View style={styles.divider} />

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handleSignOut}
                  activeOpacity={0.7}
                >
                  <Text style={styles.menuIcon}>🚪</Text>
                  <Text style={styles.menuText}>로그아웃</Text>
                </TouchableOpacity>
              </>
            ) : (
              // 로그인되지 않은 상태
              <>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handleLogin}
                  activeOpacity={0.7}
                >
                  <Text style={styles.menuIcon}>🔐</Text>
                  <Text style={styles.menuText}>로그인</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handleLogin}
                  activeOpacity={0.7}
                >
                  <Text style={styles.menuIcon}>📝</Text>
                  <Text style={styles.menuText}>회원가입</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  profileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  defaultProfile: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIcon: {
    fontSize: 16,
    color: '#6B7280',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    width: width * 0.6,
    maxWidth: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  userInfo: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  userName: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuIcon: {
    fontSize: 16,
    marginRight: 12,
    width: 20,
  },
  menuText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 16,
  },
}); 