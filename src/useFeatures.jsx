// Hook pour les feature flags
// Usage: const { isEnabled, isLoading } = useFeature('leaderboard');

import { useState, useEffect, createContext, useContext } from 'react';

// Context pour partager les features dans toute l'app
const FeaturesContext = createContext({
  features: {},
  isLoading: true,
});

// Provider à mettre au root de l'app
export function FeaturesProvider({ children }) {
  const [features, setFeatures] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFeatures = async () => {
      try {
        const response = await fetch('/api/features');
        const data = await response.json();
        setFeatures(data.features || {});
      } catch (error) {
        console.error('Failed to load features:', error);
        setFeatures({});
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeatures();
  }, []);

  // Afficher un écran de chargement tant que les features ne sont pas chargées
  if (isLoading) {
    return (
      <div className="h-screen bg-stone-100 flex items-center justify-center">
        <div className="text-pink-400 text-xl animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <FeaturesContext.Provider value={{ features, isLoading }}>
      {children}
    </FeaturesContext.Provider>
  );
}

// Hook pour vérifier si une feature est activée
export function useFeature(featureName) {
  const { features, isLoading } = useContext(FeaturesContext);
  return {
    isEnabled: features[featureName] === true,
    isLoading,
  };
}

// Hook pour récupérer toutes les features
export function useFeatures() {
  return useContext(FeaturesContext);
}

// Composant pour afficher conditionnellement du contenu
export function Feature({ name, children, fallback = null }) {
  const { isEnabled, isLoading } = useFeature(name);
  
  if (isLoading) return fallback;
  if (!isEnabled) return fallback;
  
  return children;
}