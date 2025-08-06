// Global state for onboarding completion
let globalSetOnboardingComplete: ((complete: boolean) => void) | null = null;

export const setGlobalOnboardingComplete = (setter: (complete: boolean) => void) => {
  globalSetOnboardingComplete = setter;
};

export const completeOnboarding = () => {
  if (globalSetOnboardingComplete) {
    console.log('Completing onboarding...');
    // Use setTimeout to schedule the state update after the current render cycle
    setTimeout(() => {
      if (globalSetOnboardingComplete) {
        globalSetOnboardingComplete(true);
        console.log('Onboarding state updated');
      }
    }, 0);
  } else {
    console.warn('globalSetOnboardingComplete is not set');
  }
}; 

export const handleLogout = () => {
  if (globalSetOnboardingComplete) {
    console.log('Logging out...');
    // Use setTimeout to schedule the state update after the current render cycle
    setTimeout(() => {
      if (globalSetOnboardingComplete) {
        globalSetOnboardingComplete(false);
        console.log('Logout state updated');
      }
    }, 0);
  } else {
    console.warn('globalSetOnboardingComplete is not set');
  }
};