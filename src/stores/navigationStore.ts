import { create } from 'zustand'

interface NavigationState {
  isMenuOpen: boolean
  activeSection: string
  isScrolled: boolean
  isTransitioning: boolean
  openMenu: () => void
  closeMenu: () => void
  toggleMenu: () => void
  setActiveSection: (section: string) => void
  setIsScrolled: (scrolled: boolean) => void
  setIsTransitioning: (transitioning: boolean) => void
}

export const useNavigationStore = create<NavigationState>((set) => ({
  isMenuOpen: false,
  activeSection: '',
  isScrolled: false,
  isTransitioning: false,
  openMenu: () => set({ isMenuOpen: true }),
  closeMenu: () => set({ isMenuOpen: false }),
  toggleMenu: () => set((state) => ({ isMenuOpen: !state.isMenuOpen })),
  setActiveSection: (section) => set({ activeSection: section }),
  setIsScrolled: (scrolled) => set({ isScrolled: scrolled }),
  setIsTransitioning: (transitioning) => set({ isTransitioning: transitioning }),
}))
