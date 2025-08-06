// Global state for onboarding completion
let globalSetOnboardingComplete: ((complete: boolean) => void) | null = null;

export const setGlobalOnboardingComplete = (setter: (complete: boolean) => void) => {
  globalSetOnboardingComplete = setter;
};

export const completeOnboarding = () => {
  if (globalSetOnboardingComplete) {
    console.log('Completing onboarding...');
    globalSetOnboardingComplete(true);
    // Verify the state change
    setTimeout(() => {
      console.log('Onboarding state should be updated now');
    }, 50);
  } else {
    console.warn('globalSetOnboardingComplete is not set');
  }
}; 

export const handleLogout = () => {
  if (globalSetOnboardingComplete) {
    console.log('Logging out...');
    globalSetOnboardingComplete(false);
  } else {
    console.warn('globalSetOnboardingComplete is not set');
  }
};