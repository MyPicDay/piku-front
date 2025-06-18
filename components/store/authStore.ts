import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getServerURL } from '@/lib/utils/url';

interface UserInfo {
  id: number;
  email: string;
  nickname: string;
  avatar: string;
}


interface AuthState {
  isLoggedIn: boolean;
  user: UserInfo | null;

  login: (user:UserInfo) => void;
  logout: () => void;
  checkAuth: () => void;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isLoggedIn: false,
      user: null,

      login: (user) => {
        const avatarUrl = user.avatar && `${getServerURL()}/${user.avatar}`;
        set({isLoggedIn: true , user: { ...user, avatar: avatarUrl }});
      },
      logout: () => {
        set({ isLoggedIn: false, user:null });
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
        }
      },
      checkAuth: () => {
        // persist 미들웨어가 accessToken을 localStorage에서 로드한 후 호출되어야 함.
        // (onRehydrateStorage 콜백을 통해)
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('accessToken'); // 스토어의 현재 accessToken
          if (token) {
            set({ isLoggedIn: true });
            // refreshToken은 HttpOnly이므로 클라이언트에서 읽거나 설정하지 않음.
            // 로그인 시 스토어에 저장했던 refreshToken은 페이지 새로고침 후에는 null일 수 있음.
          } else {
            // accessToken이 없다면, refreshToken도 없고 로그아웃된 상태여야 함.
            set({ isLoggedIn: false, user:null });
          }
        }
      }
    }),
    {
      name: 'auth-storage', // 로컬 스토리지에 저장될 때 사용될 키 이름
      storage: createJSONStorage(() => localStorage), // accessToken은 localStorage에 저장
      // refreshToken은 persist 대상에서 제외 (HttpOnly 쿠키로 관리된다고 가정)
      partialize: (state) => ({ isLoggedIn: state.isLoggedIn, user: state.user }),
      // persist된 스토리지로부터 상태가 성공적으로 복원(rehydrated)된 후에 checkAuth를 호출.
      onRehydrateStorage: () => {
        return (state, error) => {
          if (state && typeof window !== 'undefined') {
            // console.log('Rehydrated, calling checkAuth. Current accessToken:', state.accessToken);
            state.checkAuth();
          } else if (error) {
            console.error("Failed to rehydrate auth store", error);
          }
        };
      },
    }
  )
);

export default useAuthStore; 