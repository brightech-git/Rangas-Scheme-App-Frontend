// src/utils/Fonts.tsx

import { useFonts as useExpoFonts } from 'expo-font';

const useFonts = () => {
  const [fontsLoaded, error] = useExpoFonts({
    // ── Poppins (only used weights) ───────────────
    'Poppins-Regular':        require('../assets/fonts/Poppins/Poppins-Regular.ttf'),
    'Poppins-Medium':         require('../assets/fonts/Poppins/Poppins-Medium.ttf'),
    'Poppins-SemiBold':       require('../assets/fonts/Poppins/Poppins-SemiBold.ttf'),
    'Poppins-Bold':           require('../assets/fonts/Poppins/Poppins-Bold.ttf'),
    // ── Brand fonts ───────────────────────────────
    'TrajanPro-Regular':      require('../assets/fonts/TrajanPro-Regular.ttf'),
    'TrajanPro-Bold':         require('../assets/fonts/TrajanPro-Bold.otf'),
  });

  return fontsLoaded || !!error;
};

export default useFonts;
