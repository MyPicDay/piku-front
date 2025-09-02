import { create } from 'zustand';

interface ModalState {
  isGuestLoginModalOpen: boolean;
  openGuestLoginModal: () => void;
  closeGuestLoginModal: () => void;
}

const useModalStore = create<ModalState>((set) => ({
  isGuestLoginModalOpen: false,
  openGuestLoginModal: () => set({ isGuestLoginModalOpen: true }),
  closeGuestLoginModal: () => set({ isGuestLoginModalOpen: false }),
}));

export default useModalStore;
