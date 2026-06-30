// src/i18n/translations.ts

export type TranslationKeys = {
  // Navigation / Sidebar
  home: string;
  portfolio: string;
  buyGold: string;
  sellGold: string;
  transactions: string;
  profile: string;
  settings: string;
  signOut: string;
  darkMode: string;
  lightMode: string;
  language: string;
  selectLanguage: string;

  // Home screen sections
  goldPrice: string;
  invest: string;
  history: string;
  offers: string;

  // Common
  welcome: string;
  balance: string;
  buy: string;
  sell: string;
  cancel: string;
  confirm: string;
  save: string;
  close: string;
  retry: string;
  loading: string;
  success: string;
  error: string;
  warning: string;

  // Gold
  goldSIP: string;
  startSIP: string;
  buyNow: string;
  viewPortfolio: string;
  goldRate: string;
  purity: string;
  returns: string;
  invested: string;
  currentValue: string;

  // Auth / KYC
  verifyOTP: string;
  enterPIN: string;
  kycPending: string;
  verifyNow: string;

  // Descriptions
  dashboardOverview: string;
  trackAssets: string;
  investInGold: string;
  liquidateHoldings: string;
  viewHistory: string;
  manageAccount: string;
  preferences: string;
};

export type LangCode =
  | 'en' | 'hi' | 'ta' | 'te' | 'kn' | 'ml' | 'mr' | 'gu'
  | 'bn' | 'pa' | 'or' | 'as' | 'ur' | 'sa' | 'ks' | 'sd'
  | 'ne' | 'kok' | 'mni' | 'doi' | 'sat' | 'mai' | 'bo';

const translations: Record<LangCode, TranslationKeys> = {
  en: {
    home: 'Home', portfolio: 'Portfolio', buyGold: 'Buy Gold', sellGold: 'Sell Gold',
    transactions: 'Transactions', profile: 'Profile', settings: 'Settings',
    signOut: 'Sign Out', darkMode: 'Dark Mode', lightMode: 'Light Mode',
    language: 'Language', selectLanguage: 'Select Language',
    goldPrice: 'Gold Price', invest: 'Invest', history: 'History', offers: 'Offers',
    welcome: 'Welcome back 👋', balance: 'Balance',
    buy: 'Buy', sell: 'Sell', cancel: 'Cancel', confirm: 'Confirm',
    save: 'Save', close: 'Close', retry: 'Retry', loading: 'Loading…',
    success: 'Success', error: 'Error', warning: 'Warning',
    goldSIP: 'Gold SIP', startSIP: 'Start SIP', buyNow: 'Buy Now',
    viewPortfolio: 'View Portfolio', goldRate: 'Gold Rate', purity: 'Purity',
    returns: 'Returns', invested: 'Invested', currentValue: 'Current Value',
    verifyOTP: 'Verify OTP', enterPIN: 'Enter PIN', kycPending: 'KYC Pending', verifyNow: 'Verify Now',
    dashboardOverview: 'Dashboard overview', trackAssets: 'Track your assets',
    investInGold: 'Invest in gold', liquidateHoldings: 'Liquidate holdings',
    viewHistory: 'View history', manageAccount: 'Manage account', preferences: 'Preferences',
  },
  hi: {
    home: 'होम', portfolio: 'पोर्टफोलियो', buyGold: 'सोना खरीदें', sellGold: 'सोना बेचें',
    transactions: 'लेनदेन', profile: 'प्रोफ़ाइल', settings: 'सेटिंग्स',
    signOut: 'साइन आउट', darkMode: 'डार्क मोड', lightMode: 'लाइट मोड',
    language: 'भाषा', selectLanguage: 'भाषा चुनें',
    goldPrice: 'सोने का भाव', invest: 'निवेश', history: 'इतिहास', offers: 'ऑफर',
    welcome: 'वापस स्वागत है 👋', balance: 'बैलेंस',
    buy: 'खरीदें', sell: 'बेचें', cancel: 'रद्द करें', confirm: 'पुष्टि करें',
    save: 'सहेजें', close: 'बंद करें', retry: 'पुनः प्रयास', loading: 'लोड हो रहा है…',
    success: 'सफलता', error: 'त्रुटि', warning: 'चेतावनी',
    goldSIP: 'गोल्ड SIP', startSIP: 'SIP शुरू करें', buyNow: 'अभी खरीदें',
    viewPortfolio: 'पोर्टफोलियो देखें', goldRate: 'सोने की दर', purity: 'शुद्धता',
    returns: 'रिटर्न', invested: 'निवेशित', currentValue: 'वर्तमान मूल्य',
    verifyOTP: 'OTP सत्यापित करें', enterPIN: 'PIN दर्ज करें', kycPending: 'KYC लंबित', verifyNow: 'अभी सत्यापित करें',
    dashboardOverview: 'डैशबोर्ड अवलोकन', trackAssets: 'संपत्ति ट्रैक करें',
    investInGold: 'सोने में निवेश', liquidateHoldings: 'होल्डिंग्स बेचें',
    viewHistory: 'इतिहास देखें', manageAccount: 'खाता प्रबंधित करें', preferences: 'प्राथमिकताएं',
  },
  ta: {
    home: 'முகப்பு', portfolio: 'போர்ட்ஃபோலியோ', buyGold: 'தங்கம் வாங்கு', sellGold: 'தங்கம் விற்கு',
    transactions: 'பரிவர்த்தனைகள்', profile: 'சுயவிவரம்', settings: 'அமைப்புகள்',
    signOut: 'வெளியேறு', darkMode: 'இருண்ட பயன்முறை', lightMode: 'ஒளி பயன்முறை',
    language: 'மொழி', selectLanguage: 'மொழியை தேர்ந்தெடு',
    goldPrice: 'தங்க விலை', invest: 'முதலீடு', history: 'வரலாறு', offers: 'சலுகைகள்',
    welcome: 'மீண்டும் வரவேற்கிறோம் 👋', balance: 'இருப்பு',
    buy: 'வாங்கு', sell: 'விற்கு', cancel: 'ரத்து செய்', confirm: 'உறுதிப்படுத்து',
    save: 'சேமி', close: 'மூடு', retry: 'மீண்டும் முயற்சி', loading: 'ஏற்றுகிறது…',
    success: 'வெற்றி', error: 'பிழை', warning: 'எச்சரிக்கை',
    goldSIP: 'தங்க SIP', startSIP: 'SIP தொடங்கு', buyNow: 'இப்போது வாங்கு',
    viewPortfolio: 'போர்ட்ஃபோலியோ பார்', goldRate: 'தங்க விகிதம்', purity: 'தூய்மை',
    returns: 'வருமானம்', invested: 'முதலீடு செய்தது', currentValue: 'தற்போதைய மதிப்பு',
    verifyOTP: 'OTP சரிபார்', enterPIN: 'PIN உள்ளிடு', kycPending: 'KYC நிலுவை', verifyNow: 'இப்போது சரிபார்',
    dashboardOverview: 'டாஷ்போர்டு கண்ணோட்டம்', trackAssets: 'சொத்துக்களை கண்காணி',
    investInGold: 'தங்கத்தில் முதலீடு', liquidateHoldings: 'பங்குகளை விற்கு',
    viewHistory: 'வரலாறு பார்', manageAccount: 'கணக்கை நிர்வகி', preferences: 'விருப்பங்கள்',
  },
  te: {
    home: 'హోమ్', portfolio: 'పోర్ట్‌ఫోలియో', buyGold: 'బంగారం కొనండి', sellGold: 'బంగారం అమ్మండి',
    transactions: 'లావాదేవీలు', profile: 'ప్రొఫైల్', settings: 'సెట్టింగ్‌లు',
    signOut: 'సైన్ అవుట్', darkMode: 'డార్క్ మోడ్', lightMode: 'లైట్ మోడ్',
    language: 'భాష', selectLanguage: 'భాష ఎంచుకోండి',
    goldPrice: 'బంగారం ధర', invest: 'పెట్టుబడి', history: 'చరిత్ర', offers: 'ఆఫర్లు',
    welcome: 'తిరిగి స్వాగతం 👋', balance: 'బ్యాలెన్స్',
    buy: 'కొనండి', sell: 'అమ్మండి', cancel: 'రద్దు', confirm: 'నిర్ధారించు',
    save: 'సేవ్', close: 'మూసివేయి', retry: 'మళ్ళీ ప్రయత్నించు', loading: 'లోడ్ అవుతోంది…',
    success: 'విజయం', error: 'లోపం', warning: 'హెచ్చరిక',
    goldSIP: 'గోల్డ్ SIP', startSIP: 'SIP ప్రారంభించు', buyNow: 'ఇప్పుడు కొనండి',
    viewPortfolio: 'పోర్ట్‌ఫోలియో చూడండి', goldRate: 'బంగారం రేటు', purity: 'స్వచ్ఛత',
    returns: 'రాబడి', invested: 'పెట్టుబడి పెట్టారు', currentValue: 'ప్రస్తుత విలువ',
    verifyOTP: 'OTP ధృవీకరించు', enterPIN: 'PIN నమోదు', kycPending: 'KYC పెండింగ్', verifyNow: 'ఇప్పుడు ధృవీకరించు',
    dashboardOverview: 'డాష్‌బోర్డ్ అవలోకనం', trackAssets: 'ఆస్తులను ట్రాక్ చేయండి',
    investInGold: 'బంగారంలో పెట్టుబడి', liquidateHoldings: 'హోల్డింగ్స్ అమ్మండి',
    viewHistory: 'చరిత్ర చూడండి', manageAccount: 'ఖాతా నిర్వహించండి', preferences: 'ప్రాధాన్యతలు',
  },
  kn: {
    home: 'ಮನೆ', portfolio: 'ಪೋರ್ಟ್‌ಫೋಲಿಯೋ', buyGold: 'ಚಿನ್ನ ಖರೀದಿಸಿ', sellGold: 'ಚಿನ್ನ ಮಾರಿ',
    transactions: 'ವ್ಯವಹಾರಗಳು', profile: 'ಪ್ರೊಫೈಲ್', settings: 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
    signOut: 'ಸೈನ್ ಔಟ್', darkMode: 'ಡಾರ್ಕ್ ಮೋಡ್', lightMode: 'ಲೈಟ್ ಮೋಡ್',
    language: 'ಭಾಷೆ', selectLanguage: 'ಭಾಷೆ ಆಯ್ಕೆಮಾಡಿ',
    goldPrice: 'ಚಿನ್ನದ ಬೆಲೆ', invest: 'ಹೂಡಿಕೆ', history: 'ಇತಿಹಾಸ', offers: 'ಆಫರ್‌ಗಳು',
    welcome: 'ಮತ್ತೆ ಸ್ವಾಗತ 👋', balance: 'ಬ್ಯಾಲೆನ್ಸ್',
    buy: 'ಖರೀದಿಸಿ', sell: 'ಮಾರಿ', cancel: 'ರದ್ದು', confirm: 'ದೃಢೀಕರಿಸಿ',
    save: 'ಉಳಿಸಿ', close: 'ಮುಚ್ಚಿ', retry: 'ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ', loading: 'ಲೋಡ್ ಆಗುತ್ತಿದೆ…',
    success: 'ಯಶಸ್ಸು', error: 'ದೋಷ', warning: 'ಎಚ್ಚರಿಕೆ',
    goldSIP: 'ಗೋಲ್ಡ್ SIP', startSIP: 'SIP ಪ್ರಾರಂಭಿಸಿ', buyNow: 'ಈಗ ಖರೀದಿಸಿ',
    viewPortfolio: 'ಪೋರ್ಟ್‌ಫೋಲಿಯೋ ನೋಡಿ', goldRate: 'ಚಿನ್ನದ ದರ', purity: 'ಶುದ್ಧತೆ',
    returns: 'ಆದಾಯ', invested: 'ಹೂಡಿಕೆ ಮಾಡಲಾಗಿದೆ', currentValue: 'ಪ್ರಸ್ತುತ ಮೌಲ್ಯ',
    verifyOTP: 'OTP ಪರಿಶೀಲಿಸಿ', enterPIN: 'PIN ನಮೂದಿಸಿ', kycPending: 'KYC ಬಾಕಿ', verifyNow: 'ಈಗ ಪರಿಶೀಲಿಸಿ',
    dashboardOverview: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಅವಲೋಕನ', trackAssets: 'ಆಸ್ತಿಗಳನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ',
    investInGold: 'ಚಿನ್ನದಲ್ಲಿ ಹೂಡಿಕೆ', liquidateHoldings: 'ಹೋಲ್ಡಿಂಗ್ಸ್ ಮಾರಿ',
    viewHistory: 'ಇತಿಹಾಸ ನೋಡಿ', manageAccount: 'ಖಾತೆ ನಿರ್ವಹಿಸಿ', preferences: 'ಆದ್ಯತೆಗಳು',
  },
  ml: {
    home: 'ഹോം', portfolio: 'പോർട്ട്‌ഫോളിയോ', buyGold: 'സ്വർണം വാങ്ങുക', sellGold: 'സ്വർണം വിൽക്കുക',
    transactions: 'ഇടപാടുകൾ', profile: 'പ്രൊഫൈൽ', settings: 'ക്രമീകരണങ്ങൾ',
    signOut: 'സൈൻ ഔട്ട്', darkMode: 'ഡാർക്ക് മോഡ്', lightMode: 'ലൈറ്റ് മോഡ്',
    language: 'ഭാഷ', selectLanguage: 'ഭാഷ തിരഞ്ഞെടുക്കുക',
    goldPrice: 'സ്വർണ വില', invest: 'നിക്ഷേപം', history: 'ചരിത്രം', offers: 'ഓഫറുകൾ',
    welcome: 'തിരിച്ചു സ്വാഗതം 👋', balance: 'ബാലൻസ്',
    buy: 'വാങ്ങുക', sell: 'വിൽക്കുക', cancel: 'റദ്ദാക്കുക', confirm: 'സ്ഥിരീകരിക്കുക',
    save: 'സേവ്', close: 'അടയ്ക്കുക', retry: 'വീണ്ടും ശ്രമിക്കുക', loading: 'ലോഡ് ചെയ്യുന്നു…',
    success: 'വിജയം', error: 'പിശക്', warning: 'മുന്നറിയിപ്പ്',
    goldSIP: 'ഗോൾഡ് SIP', startSIP: 'SIP ആരംഭിക്കുക', buyNow: 'ഇപ്പോൾ വാങ്ങുക',
    viewPortfolio: 'പോർട്ട്‌ഫോളിയോ കാണുക', goldRate: 'സ്വർണ നിരക്ക്', purity: 'ശുദ്ധത',
    returns: 'വരുമാനം', invested: 'നിക്ഷേപിച്ചത്', currentValue: 'നിലവിലെ മൂല്യം',
    verifyOTP: 'OTP പരിശോധിക്കുക', enterPIN: 'PIN നൽകുക', kycPending: 'KYC തീർക്കാനുണ്ട്', verifyNow: 'ഇപ്പോൾ പരിശോധിക്കുക',
    dashboardOverview: 'ഡാഷ്‌ബോർഡ് അവലോകനം', trackAssets: 'ആസ്തികൾ ട്രാക്ക് ചെയ്യുക',
    investInGold: 'സ്വർണത്തിൽ നിക്ഷേപം', liquidateHoldings: 'ഹോൾഡിംഗ്സ് വിൽക്കുക',
    viewHistory: 'ചരിത്രം കാണുക', manageAccount: 'അക്കൗണ്ട് നിയന്ത്രിക്കുക', preferences: 'മുൻഗണനകൾ',
  },
  mr: {
    home: 'मुख्यपृष्ठ', portfolio: 'पोर्टफोलिओ', buyGold: 'सोने खरेदी करा', sellGold: 'सोने विका',
    transactions: 'व्यवहार', profile: 'प्रोफाइल', settings: 'सेटिंग्ज',
    signOut: 'साइन आउट', darkMode: 'डार्क मोड', lightMode: 'लाइट मोड',
    language: 'भाषा', selectLanguage: 'भाषा निवडा',
    goldPrice: 'सोन्याची किंमत', invest: 'गुंतवणूक', history: 'इतिहास', offers: 'ऑफर',
    welcome: 'परत स्वागत आहे 👋', balance: 'शिल्लक',
    buy: 'खरेदी करा', sell: 'विका', cancel: 'रद्द करा', confirm: 'पुष्टी करा',
    save: 'जतन करा', close: 'बंद करा', retry: 'पुन्हा प्रयत्न करा', loading: 'लोड होत आहे…',
    success: 'यश', error: 'त्रुटी', warning: 'इशारा',
    goldSIP: 'गोल्ड SIP', startSIP: 'SIP सुरू करा', buyNow: 'आत्ता खरेदी करा',
    viewPortfolio: 'पोर्टफोलिओ पहा', goldRate: 'सोन्याचा दर', purity: 'शुद्धता',
    returns: 'परतावा', invested: 'गुंतवणूक केली', currentValue: 'सध्याचे मूल्य',
    verifyOTP: 'OTP सत्यापित करा', enterPIN: 'PIN प्रविष्ट करा', kycPending: 'KYC प्रलंबित', verifyNow: 'आत्ता सत्यापित करा',
    dashboardOverview: 'डॅशबोर्ड आढावा', trackAssets: 'मालमत्ता ट्रॅक करा',
    investInGold: 'सोन्यात गुंतवणूक', liquidateHoldings: 'होल्डिंग्ज विका',
    viewHistory: 'इतिहास पहा', manageAccount: 'खाते व्यवस्थापित करा', preferences: 'प्राधान्ये',
  },
  gu: {
    home: 'હોમ', portfolio: 'પોર્ટફોલિયો', buyGold: 'સોનું ખરીદો', sellGold: 'સોનું વેચો',
    transactions: 'વ્યવહારો', profile: 'પ્રોફાઇલ', settings: 'સેટિંગ્સ',
    signOut: 'સાઇન આઉટ', darkMode: 'ડાર્ક મોડ', lightMode: 'લાઇટ મોડ',
    language: 'ભાષા', selectLanguage: 'ભાષા પસંદ કરો',
    goldPrice: 'સોનાની કિંમત', invest: 'રોકાણ', history: 'ઇતિહાસ', offers: 'ઓફર',
    welcome: 'પાછા સ્વાગત છે 👋', balance: 'બેલેન્સ',
    buy: 'ખરીદો', sell: 'વેચો', cancel: 'રદ કરો', confirm: 'પુષ્ટિ કરો',
    save: 'સાચવો', close: 'બંધ કરો', retry: 'ફરી પ્રયાસ', loading: 'લોડ થઈ રહ્યું છે…',
    success: 'સફળતા', error: 'ભૂલ', warning: 'ચેતવણી',
    goldSIP: 'ગોલ્ડ SIP', startSIP: 'SIP શરૂ કરો', buyNow: 'હમણાં ખરીદો',
    viewPortfolio: 'પોર્ટફોલિયો જુઓ', goldRate: 'સોનાનો દર', purity: 'શુદ્ધતા',
    returns: 'વળતર', invested: 'રોકાણ કર્યું', currentValue: 'વર્તમાન મૂલ્ય',
    verifyOTP: 'OTP ચકાસો', enterPIN: 'PIN દાખલ કરો', kycPending: 'KYC બાકી', verifyNow: 'હમણાં ચકાસો',
    dashboardOverview: 'ડેશબોર્ડ ઝાંખી', trackAssets: 'સંપત્તિ ટ્રૅક કરો',
    investInGold: 'સોનામાં રોકાણ', liquidateHoldings: 'હોલ્ડિંગ્સ વેચો',
    viewHistory: 'ઇતિહાસ જુઓ', manageAccount: 'ખાતું સંચાલિત કરો', preferences: 'પ્રાધાન્યતાઓ',
  },
  // Remaining languages fall back to English
  bn: {} as TranslationKeys, pa: {} as TranslationKeys, or: {} as TranslationKeys,
  as: {} as TranslationKeys, ur: {} as TranslationKeys, sa: {} as TranslationKeys,
  ks: {} as TranslationKeys, sd: {} as TranslationKeys, ne: {} as TranslationKeys,
  kok: {} as TranslationKeys, mni: {} as TranslationKeys, doi: {} as TranslationKeys,
  sat: {} as TranslationKeys, mai: {} as TranslationKeys, bo: {} as TranslationKeys,
};

// Fill remaining languages with English fallback
const fallbackLangs: LangCode[] = ['bn','pa','or','as','ur','sa','ks','sd','ne','kok','mni','doi','sat','mai','bo'];
fallbackLangs.forEach(code => { translations[code] = { ...translations.en }; });

export default translations;
