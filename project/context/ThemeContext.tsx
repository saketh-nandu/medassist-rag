import React, { createContext, useContext, useState, useCallback } from 'react';
import { lightColors, darkColors, ThemeColors } from '@/constants/theme';

// ─── TRANSLATIONS ─────────────────────────────────────────────────────────────

const translations: Record<string, Record<string, string>> = {
  English: {
    home: 'Home', chat: 'Chat', nearby: 'Nearby', monitor: 'Monitor', profile: 'Profile',
    goodMorning: 'Good Morning', goodAfternoon: 'Good Afternoon', goodEvening: 'Good Evening',
    howAreYou: 'How are you feeling today?',
    describeSymptoms: 'Describe your symptoms...',
    quickActions: 'Quick Actions', checkSymptoms: 'Check\nSymptoms',
    uploadImage: 'Upload\nImage', findNearby: 'Find Nearby\nHelp',
    emergencyHelp: 'Emergency Help', callAmbulance: 'Call 108 · Find nearest hospital',
    todayOverview: "Today's Overview", recentActivity: 'Recent Activity',
    dailyHealthTip: 'Daily Health Tip',
    healthMonitor: 'Health Monitor', trackBody: 'Track your body & medications',
    reminders: 'Reminders', bodyMap: 'Body Map',
    todayProgress: "Today's Progress", medicationsTaken: 'medications taken',
    addReminder: 'Add', medicines: 'Medicines', noReminders: 'No reminders yet',
    tapToAdd: 'Tap + Add to set up your medicine reminders',
    medicineName: 'Medicine Name', dosage: 'Dosage', time: 'Time',
    cancel: 'Cancel', save: 'Save', add: 'Add Reminder',
    nearbyHealthcare: 'Nearby Healthcare', searching: 'Searching near you...',
    settings: 'Settings', notifications: 'Notifications', darkMode: 'Dark Mode',
    privacyMode: 'Privacy Mode', language: 'Language', about: 'About HosFind',
    signOut: 'Sign Out', medicalProfile: 'Medical Profile',
    bloodType: 'Blood Type', allergies: 'Allergies', conditions: 'Conditions',
    savedReports: 'Saved Reports', editProfile: 'Edit Profile',
    takeMedicine: 'Time to take your medicine!', medicineTaken: 'Mark as taken',
    snoozeMedicine: 'Snooze 30 min',
  },
  Hindi: {
    home: 'होम', chat: 'चैट', nearby: 'नज़दीकी', monitor: 'मॉनिटर', profile: 'प्रोफ़ाइल',
    goodMorning: 'सुप्रभात', goodAfternoon: 'नमस्कार', goodEvening: 'शुभ संध्या',
    howAreYou: 'आज आप कैसा महसूस कर रहे हैं?',
    describeSymptoms: 'अपने लक्षण बताएं...',
    quickActions: 'त्वरित क्रियाएं', checkSymptoms: 'लक्षण\nजांचें',
    uploadImage: 'छवि\nअपलोड', findNearby: 'नज़दीकी\nसहायता',
    emergencyHelp: 'आपातकालीन सहायता', callAmbulance: '108 कॉल करें · निकटतम अस्पताल',
    todayOverview: 'आज का अवलोकन', recentActivity: 'हाल की गतिविधि',
    dailyHealthTip: 'दैनिक स्वास्थ्य सुझाव',
    healthMonitor: 'स्वास्थ्य मॉनिटर', trackBody: 'शरीर और दवाएं ट्रैक करें',
    reminders: 'रिमाइंडर', bodyMap: 'शरीर का नक्शा',
    todayProgress: 'आज की प्रगति', medicationsTaken: 'दवाएं ली गईं',
    addReminder: 'जोड़ें', medicines: 'दवाइयां', noReminders: 'अभी कोई रिमाइंडर नहीं',
    tapToAdd: 'दवा रिमाइंडर सेट करने के लिए + जोड़ें दबाएं',
    medicineName: 'दवा का नाम', dosage: 'खुराक', time: 'समय',
    cancel: 'रद्द करें', save: 'सहेजें', add: 'रिमाइंडर जोड़ें',
    nearbyHealthcare: 'नज़दीकी स्वास्थ्य सेवा', searching: 'आपके पास खोज रहे हैं...',
    settings: 'सेटिंग्स', notifications: 'सूचनाएं', darkMode: 'डार्क मोड',
    privacyMode: 'गोपनीयता मोड', language: 'भाषा', about: 'HosFind के बारे में',
    signOut: 'साइन आउट', medicalProfile: 'चिकित्सा प्रोफ़ाइल',
    bloodType: 'रक्त प्रकार', allergies: 'एलर्जी', conditions: 'स्थितियां',
    savedReports: 'सहेजी गई रिपोर्ट', editProfile: 'प्रोफ़ाइल संपादित करें',
    takeMedicine: 'दवा लेने का समय!', medicineTaken: 'ली गई के रूप में चिह्नित करें',
    snoozeMedicine: '30 मिनट स्नूज़',
  },
  Telugu: {
    home: 'హోమ్', chat: 'చాట్', nearby: 'సమీపంలో', monitor: 'మానిటర్', profile: 'ప్రొఫైల్',
    goodMorning: 'శుభోదయం', goodAfternoon: 'శుభ మధ్యాహ్నం', goodEvening: 'శుభ సాయంత్రం',
    howAreYou: 'ఈరోజు మీరు ఎలా అనుభవిస్తున్నారు?',
    describeSymptoms: 'మీ లక్షణాలను వివరించండి...',
    quickActions: 'త్వరిత చర్యలు', checkSymptoms: 'లక్షణాలు\nతనిఖీ',
    uploadImage: 'చిత్రం\nఅప్‌లోడ్', findNearby: 'సమీప\nసహాయం',
    emergencyHelp: 'అత్యవసర సహాయం', callAmbulance: '108 కాల్ · సమీప ఆసుపత్రి',
    todayOverview: 'నేటి అవలోకనం', recentActivity: 'ఇటీవలి కార్యకలాపం',
    dailyHealthTip: 'రోజువారీ ఆరోగ్య చిట్కా',
    healthMonitor: 'ఆరోగ్య మానిటర్', trackBody: 'శరీరం మరియు మందులు ట్రాక్ చేయండి',
    reminders: 'రిమైండర్లు', bodyMap: 'శరీర మ్యాప్',
    todayProgress: 'నేటి పురోగతి', medicationsTaken: 'మందులు తీసుకున్నారు',
    addReminder: 'జోడించు', medicines: 'మందులు', noReminders: 'ఇంకా రిమైండర్లు లేవు',
    tapToAdd: 'మందు రిమైండర్లు సెట్ చేయడానికి + జోడించు నొక్కండి',
    medicineName: 'మందు పేరు', dosage: 'మోతాదు', time: 'సమయం',
    cancel: 'రద్దు చేయి', save: 'సేవ్ చేయి', add: 'రిమైండర్ జోడించు',
    nearbyHealthcare: 'సమీప ఆరోగ్య సేవ', searching: 'మీ సమీపంలో వెతుకుతున్నాం...',
    settings: 'సెట్టింగ్‌లు', notifications: 'నోటిఫికేషన్లు', darkMode: 'డార్క్ మోడ్',
    privacyMode: 'గోప్యత మోడ్', language: 'భాష', about: 'HosFind గురించి',
    signOut: 'సైన్ అవుట్', medicalProfile: 'వైద్య ప్రొఫైల్',
    bloodType: 'రక్త రకం', allergies: 'అలెర్జీలు', conditions: 'పరిస్థితులు',
    savedReports: 'సేవ్ చేసిన నివేదికలు', editProfile: 'ప్రొఫైల్ సవరించు',
    takeMedicine: 'మందు తీసుకునే సమయం!', medicineTaken: 'తీసుకున్నట్లు గుర్తించు',
    snoozeMedicine: '30 నిమిషాలు స్నూజ్',
  },
  Tamil: {
    home: 'முகப்பு', chat: 'அரட்டை', nearby: 'அருகில்', monitor: 'கண்காணிப்பு', profile: 'சுயவிவரம்',
    goodMorning: 'காலை வணக்கம்', goodAfternoon: 'மதிய வணக்கம்', goodEvening: 'மாலை வணக்கம்',
    howAreYou: 'இன்று நீங்கள் எப்படி உணர்கிறீர்கள்?',
    describeSymptoms: 'உங்கள் அறிகுறிகளை விவரிக்கவும்...',
    quickActions: 'விரைவு செயல்கள்', checkSymptoms: 'அறிகுறிகள்\nசரிபார்க்க',
    uploadImage: 'படம்\nபதிவேற்று', findNearby: 'அருகில்\nஉதவி',
    emergencyHelp: 'அவசர உதவி', callAmbulance: '108 அழைக்கவும்',
    todayOverview: 'இன்றைய கண்ணோட்டம்', recentActivity: 'சமீபத்திய செயல்பாடு',
    dailyHealthTip: 'தினசரி சுகாதார குறிப்பு',
    healthMonitor: 'சுகாதார கண்காணிப்பு', trackBody: 'உடல் மற்றும் மருந்துகளை கண்காணிக்கவும்',
    reminders: 'நினைவூட்டல்கள்', bodyMap: 'உடல் வரைபடம்',
    todayProgress: 'இன்றைய முன்னேற்றம்', medicationsTaken: 'மருந்துகள் எடுக்கப்பட்டன',
    addReminder: 'சேர்', medicines: 'மருந்துகள்', noReminders: 'இன்னும் நினைவூட்டல்கள் இல்லை',
    tapToAdd: 'மருந்து நினைவூட்டல்களை அமைக்க + சேர் அழுத்தவும்',
    medicineName: 'மருந்து பெயர்', dosage: 'அளவு', time: 'நேரம்',
    cancel: 'ரத்து செய்', save: 'சேமி', add: 'நினைவூட்டல் சேர்',
    nearbyHealthcare: 'அருகில் உள்ள சுகாதார சேவை', searching: 'உங்களுக்கு அருகில் தேடுகிறோம்...',
    settings: 'அமைப்புகள்', notifications: 'அறிவிப்புகள்', darkMode: 'இருண்ட பயன்முறை',
    privacyMode: 'தனியுரிமை பயன்முறை', language: 'மொழி', about: 'HosFind பற்றி',
    signOut: 'வெளியேறு', medicalProfile: 'மருத்துவ சுயவிவரம்',
    bloodType: 'இரத்த வகை', allergies: 'ஒவ்வாமைகள்', conditions: 'நிலைமைகள்',
    savedReports: 'சேமிக்கப்பட்ட அறிக்கைகள்', editProfile: 'சுயவிவரம் திருத்து',
    takeMedicine: 'மருந்து எடுக்கும் நேரம்!', medicineTaken: 'எடுத்ததாக குறி',
    snoozeMedicine: '30 நிமிடம் ஒத்திவை',
  },
};

// ─── CONTEXT ──────────────────────────────────────────────────────────────────

interface ThemeContextType {
  colors: ThemeColors;
  darkMode: boolean;
  toggleDarkMode: () => void;
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string) => string;
  availableLanguages: string[];
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const AVAILABLE_LANGUAGES = Object.keys(translations);

export function ThemeProvider({ children, darkMode, toggleDarkMode }: {
  children: React.ReactNode;
  darkMode: boolean;
  toggleDarkMode: () => void;
}) {
  const [language, setLanguage] = useState('English');

  const colors = darkMode ? darkColors : lightColors;

  const t = useCallback((key: string): string => {
    return translations[language]?.[key] || translations['English']?.[key] || key;
  }, [language]);

  return (
    <ThemeContext.Provider value={{
      colors, darkMode, toggleDarkMode,
      language, setLanguage,
      t, availableLanguages: AVAILABLE_LANGUAGES,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
