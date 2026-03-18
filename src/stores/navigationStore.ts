import { create } from 'zustand'

interface NavigationState {
  isMenuOpen: boolean
  activeSection: string
  isScrolled: boolean
  isHeaderVisible: boolean
  isTransitioning: boolean
  openMenu: () => void
  closeMenu: () => void
  toggleMenu: () => void
  setActiveSection: (section: string) => void
  setIsScrolled: (scrolled: boolean) => void
  setIsHeaderVisible: (visible: boolean) => void
  setIsTransitioning: (transitioning: boolean) => void
}

export const useNavigationStore = create<NavigationState>((set) => ({
  isMenuOpen: false,
  activeSection: '',
  isScrolled: false,
  isHeaderVisible: true,
  isTransitioning: false,
  openMenu: () => set({ isMenuOpen: true }),
  closeMenu: () => set({ isMenuOpen: false }),
  toggleMenu: () => set((state) => ({ isMenuOpen: !state.isMenuOpen })),
  setActiveSection: (section) => set({ activeSection: section }),
  setIsScrolled: (scrolled) => set({ isScrolled: scrolled }),
  setIsHeaderVisible: (visible) => set({ isHeaderVisible: visible }),
  setIsTransitioning: (transitioning) => set({ isTransitioning: transitioning }),
}))
