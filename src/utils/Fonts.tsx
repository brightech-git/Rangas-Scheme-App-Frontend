// src/utils/Fonts.tsx

import { useFonts as useExpoFonts } from 'expo-font';

const useFonts = () => {
  const [fontsLoaded, error] = useExpoFonts({
    // ── Poppins ───────────────────────────────────
    'Poppins-Thin':           require('../assets/fonts/Poppins/Poppins-Thin.ttf'),
    'Poppins-ExtraLight':     require('../assets/fonts/Poppins/Poppins-ExtraLight.ttf'),
    'Poppins-Light':          require('../assets/fonts/Poppins/Poppins-Light.ttf'),
    'Poppins-Regular':        require('../assets/fonts/Poppins/Poppins-Regular.ttf'),
    'Poppins-Medium':         require('../assets/fonts/Poppins/Poppins-Medium.ttf'),
    'Poppins-SemiBold':       require('../assets/fonts/Poppins/Poppins-SemiBold.ttf'),
    'Poppins-Bold':           require('../assets/fonts/Poppins/Poppins-Bold.ttf'),
    'Poppins-ExtraBold':      require('../assets/fonts/Poppins/Poppins-ExtraBold.ttf'),
    'Poppins-Black':          require('../assets/fonts/Poppins/Poppins-Black.ttf'),
    // ── Poppins Italics ───────────────────────────
    'Poppins-ThinItalic':       require('../assets/fonts/Poppins/Poppins-ThinItalic.ttf'),
    'Poppins-ExtraLightItalic': require('../assets/fonts/Poppins/Poppins-ExtraLightItalic.ttf'),
    'Poppins-LightItalic':      require('../assets/fonts/Poppins/Poppins-LightItalic.ttf'),
    'Poppins-Italic':           require('../assets/fonts/Poppins/Poppins-Italic.ttf'),
    'Poppins-MediumItalic':     require('../assets/fonts/Poppins/Poppins-MediumItalic.ttf'),
    'Poppins-SemiBoldItalic':   require('../assets/fonts/Poppins/Poppins-SemiBoldItalic.ttf'),
    'Poppins-BoldItalic':       require('../assets/fonts/Poppins/Poppins-BoldItalic.ttf'),
    'Poppins-ExtraBoldItalic':  require('../assets/fonts/Poppins/Poppins-ExtraBoldItalic.ttf'),
    'Poppins-BlackItalic':      require('../assets/fonts/Poppins/Poppins-BlackItalic.ttf'),
    // ── Brand fonts ───────────────────────────────
    'TrajanPro-Regular':      require('../assets/fonts/TrajanPro-Regular.ttf'),
    'TrajanPro-Bold':         require('../assets/fonts/TrajanPro-Bold.otf'),
  });

  return fontsLoaded || !!error;
};

export default useFonts;
