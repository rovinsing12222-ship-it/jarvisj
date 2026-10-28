import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Mic,
  MicOff,
  Search,
  Zap,
  Play,
  Copy,
  Check,
  Sparkles,
  Phone,
  MessageSquare,
  Music,
  Globe,
  Flashlight,
  Camera,
  Clock,
  Calendar,
  Brain,
  X,
  Minimize2,
  Maximize2,
  Flame,
  Volume2,
  HelpCircle,
  RotateCw,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Radio,
  Lock,
  Unlock,
  Power,
  Home,
  Moon,
  Square,
  Sliders,
  Download,
  QrCode,
  Share2,
  Building2,
  Landmark,
  FileCheck,
  CreditCard,
} from 'lucide-react';
import { triggerHaptic } from '../utils/deviceHardware';

export interface VoiceCommandItem {
  id: string;
  phrase: string;
  alternatePhrases: string[];
  description: string;
  category: 'trending' | 'calls' | 'settings' | 'apps' | 'general' | 'messages' | 'music' | 'hardware' | 'alarms' | 'memory' | 'csc';
  statusType: 'instant' | 'singing' | 'ai' | 'hardware';
  keywords: string[];
  icon: any;
  actionHint: string;
}

export const VOICE_COMMANDS_CATALOG: VoiceCommandItem[] = [
  // 0. Phone Lock, Unlock & Google Gemini Power Button (User Spotlight)
  {
    id: 'lock_phone',
    phrase: 'Phone lock karo',
    alternatePhrases: ['Lock phone', 'Phone lock karna', 'Mayra lock karo', 'Lock karo', 'Screen lock karo'],
    description: 'Switches device into secure AMOLED lock screen with continuous voice listener',
    category: 'hardware',
    statusType: 'hardware',
    keywords: ['lock', 'phone lock', 'screen lock', 'lock screen', 'लॉक', 'mayra lock'],
    icon: Lock,
    actionHint: 'Instant Secure Lock',
  },
  {
    id: 'unlock_phone',
    phrase: 'Phone unlock karo / Open karo',
    alternatePhrases: ['Open karo', 'Phone open karo', 'Lock kholo', 'Mayra unlock', 'Mayra phone kholo', 'फोन खोलो'],
    description: 'Validates voice authorization (Mayra trend) or fingerprint and unlocks screen instantly',
    category: 'hardware',
    statusType: 'hardware',
    keywords: ['unlock', 'open', 'phone open', 'phone unlock', 'screen unlock', 'lock kholo', 'mayra unlock', 'अनलॉक'],
    icon: Unlock,
    actionHint: 'Biometric Voice Unlock',
  },
  {
    id: 'shutdown_phone',
    phrase: 'Phone shut down karo',
    alternatePhrases: ['Phone switch off karo', 'Set down phone', 'Shut down phone', 'फोन बंद करो'],
    description: 'Powers down phone into AMOLED deep standby mode until power key is tapped',
    category: 'hardware',
    statusType: 'hardware',
    keywords: ['shut down', 'shutdown', 'switch off', 'power off', 'set down', 'शट डाउन'],
    icon: Power,
    actionHint: 'Power Off Standby',
  },
  {
    id: 'power_button_assist',
    phrase: 'Lock button se Gemini open karo',
    alternatePhrases: ['Power button setting', 'Hold power button for Gemini', 'पावर बटन से जेमिनी'],
    description: 'Android hardware lock/power button hold shortcut to trigger Google Gemini & Jarvis',
    category: 'hardware',
    statusType: 'hardware',
    keywords: ['power button', 'lock button', 'gemini', 'gimme', 'पावर बटन', 'असिस्टेंट'],
    icon: Power,
    actionHint: 'Hardware Key Shortcut',
  },
  {
    id: 'aoede_voice_model',
    phrase: 'AOEDE voice model lagao',
    alternatePhrases: ['Cute voice chalu karo', 'Indian girl voice lagao', 'Voice model change karo', 'Ladki ki aawaz lagao'],
    description: 'Switches to the AOEDE cute Indian girl voice model with sweet feminine Hindi & English responses',
    category: 'trending',
    statusType: 'instant',
    keywords: ['aoede', 'voice model', 'cute voice', 'indian girl', 'ladki ki awaz', 'cute aawaz'],
    icon: Sparkles,
    actionHint: 'AOEDE Cute Voice',
  },
  {
    id: 'home',
    phrase: 'Home screen par chalo',
    alternatePhrases: ['Go to home', 'मुख्य पृष्ठ', 'Home page', 'Dashboard dikhao'],
    description: 'Returns immediately to Jarvis main home dashboard from any active view',
    category: 'trending',
    statusType: 'instant',
    keywords: ['home', 'मुख्य पृष्ठ', 'dashboard', 'main screen'],
    icon: Home,
    actionHint: 'Instant Navigation',
  },
  {
    id: 'play_music',
    phrase: 'अरे यार गाना बजाओ थोड़ा',
    alternatePhrases: ['Gana bajao', 'Play music', 'Gaana sunao', 'गाना सुनाओ'],
    description: 'Plays melodic Bollywood songs with live Web Audio chords & synth',
    category: 'music',
    statusType: 'singing',
    keywords: ['gana', 'gaana', 'music', 'song', 'गाना', 'गीत', 'bajao'],
    icon: Music,
    actionHint: 'Live Synthesizer Music',
  },
  {
    id: 'stop_music',
    phrase: 'Gana band karo',
    alternatePhrases: ['Stop music', 'Gaana roko', 'Music off karo', 'गाना बंद करो'],
    description: 'Immediately terminates active synthesizer songs and audio playback',
    category: 'music',
    statusType: 'instant',
    keywords: ['stop music', 'gana band', 'gaana roko', 'गाना बंद'],
    icon: Square,
    actionHint: 'Instant Audio Stop',
  },
  {
    id: 'dark_mode',
    phrase: 'स्क्रीन को dark mode में कर दो',
    alternatePhrases: ['Dark mode karo', 'Toggle theme', 'Light mode', 'डार्क मोड'],
    description: 'Switches futuristic Cyberpunk Dark and Clean High-Contrast themes',
    category: 'hardware',
    statusType: 'instant',
    keywords: ['dark mode', 'theme', 'dark', 'light', 'डार्क मोड'],
    icon: Moon,
    actionHint: 'Instant Theme Switch',
  },
  // 1. Trending / Quick Essentials
  {
    id: 'cmd-youtube',
    phrase: 'YouTube mein gane chalao',
    alternatePhrases: ['YouTube open karo', 'यूट्यूब पर गाने चलाओ', 'Open YouTube', 'YouTube par gana chalao', 'Arijit Singh ke gane chalao', 'YouTube chalao'],
    description: 'Instantly runs live YouTube media player with streaming audio, video, and playlist controls right on screen',
    category: 'trending',
    statusType: 'instant',
    keywords: ['youtube', 'यूट्यूब', 'yt', 'video', 'chalao', 'kholo', 'gane', 'gaane', 'gana'],
    icon: Globe,
    actionHint: 'Instant Live Media Stream & Player (<1ms)',
  },
  {
    id: 'cmd-sing-song',
    phrase: 'Gana ga kar sunao',
    alternatePhrases: ['Gana ga', 'Sing a song', 'Kesariya gaana gao', 'गाना सुनाओ'],
    description: 'Jarvis sings Bollywood melodies with live synthesizer chords and art animation',
    category: 'trending',
    statusType: 'singing',
    keywords: ['gana', 'gaana', 'sing', 'song', 'kesariya', 'tum hi ho', 'गीत', 'गाना'],
    icon: Music,
    actionHint: 'Live Synthesizer Vocals',
  },
  {
    id: 'cmd-call-dad',
    phrase: 'Dad ko call lagao',
    alternatePhrases: ['Call Papa', 'Call Dad', 'Papa ko phone karo'],
    description: 'Initiates immediate mobile call dialer to Father / Dad (+91 98765 43210)',
    category: 'trending',
    statusType: 'hardware',
    keywords: ['call dad', 'call papa', 'papa', 'dad', 'phone karo', 'call lagao'],
    icon: Phone,
    actionHint: 'Direct Native Dialer',
  },
  {
    id: 'cmd-read-messages',
    phrase: 'Naye messages padho',
    alternatePhrases: ['Read messages', 'Message sunao', 'Inbox kholo', 'नए मैसेज पढ़ो'],
    description: 'Voice reads incoming unread SMS & WhatsApp messages with text-to-speech',
    category: 'trending',
    statusType: 'instant',
    keywords: ['message', 'messages', 'padho', 'read', 'sms', 'inbox', 'sunao'],
    icon: MessageSquare,
    actionHint: 'Voice TTS Reader',
  },
  {
    id: 'cmd-alarm-7',
    phrase: 'Subah 7 baje ka alarm lagao',
    alternatePhrases: ['Set alarm for 7 AM', '7 baje alarm', 'अलार्म लगाओ'],
    description: 'Schedules on-device audio alarm with notification trigger at 07:00 AM',
    category: 'trending',
    statusType: 'instant',
    keywords: ['alarm', 'अलार्म', '7 baje', 'set alarm', 'lagao'],
    icon: Clock,
    actionHint: 'Device Schedule & Alarm',
  },
  {
    id: 'cmd-torch-on',
    phrase: 'Flashlight on karo',
    alternatePhrases: ['Turn on flashlight', 'Torch jalao', 'टॉर्च ऑन करो'],
    description: 'Activates hardware camera LED torch flash directly via MediaStream API',
    category: 'trending',
    statusType: 'hardware',
    keywords: ['torch', 'flashlight', 'torch on', 'jalao', 'chalao', 'फ्लैशलाइट'],
    icon: Flashlight,
    actionHint: 'Hardware LED API',
  },
  {
    id: 'cmd-weather',
    phrase: 'Aaj ka mausam kaisa hai?',
    alternatePhrases: ['Weather report', 'Mausam batao', 'मौसम कैसा है?'],
    description: 'Fetches real-time GPS weather, temperature, humidity and reads report',
    category: 'trending',
    statusType: 'instant',
    keywords: ['weather', 'mausam', 'temperature', 'मौसम', 'baarish', 'hawa'],
    icon: Globe,
    actionHint: 'Geolocation API Weather',
  },

  // 2. Calls & Contacts
  {
    id: 'cmd-call-spoken-number',
    phrase: '9876543210 par call lagao',
    alternatePhrases: ['Call 9876543210', 'Number par call laga', 'Jo number bola us number par call laga'],
    description: 'Bole gaye kisi bhi phone number par turant direct phone call connect karta hai (Saved ya Naya number)',
    category: 'calls',
    statusType: 'hardware',
    keywords: ['call number', 'number par call', 'jo number bola', 'direct dial', 'dial number', '9876543210'],
    icon: Phone,
    actionHint: 'Direct Number Phone Dialer',
  },
  {
    id: 'cmd-call-mom',
    phrase: 'Mom ko call karo',
    alternatePhrases: ['Mataji ko phone lagao', 'Call Mother', 'मम्मी को कॉल करो'],
    description: 'Dials Mom directly or opens WhatsApp voice call for Mother',
    category: 'calls',
    statusType: 'hardware',
    keywords: ['call mom', 'call mother', 'mom', 'mummy', 'mataji'],
    icon: Phone,
    actionHint: 'Direct Native Dialer',
  },
  {
    id: 'cmd-lookup-number',
    phrase: 'Dad ka phone number kya hai?',
    alternatePhrases: ['Find contact Rahul', 'Number batao', 'फोन नंबर क्या है?'],
    description: 'Searches local contacts phonebook and reads phone number aloud',
    category: 'calls',
    statusType: 'instant',
    keywords: ['number', 'phone number', 'kya hai', 'contact', 'dossier', 'batao'],
    icon: Phone,
    actionHint: 'Local Phonebook Query',
  },
  {
    id: 'cmd-open-contacts',
    phrase: 'Contacts list kholo',
    alternatePhrases: ['Show contacts', 'Phonebook dikhao', 'कांटेक्ट खोलो'],
    description: 'Opens interactive VIP contacts directory with direct dial & dossier',
    category: 'calls',
    statusType: 'instant',
    keywords: ['contacts', 'contact', 'phonebook', 'kholo', 'list', 'dikhao'],
    icon: Phone,
    actionHint: 'Contacts Manager View',
  },
  {
    id: 'cmd-emergency-dial',
    phrase: 'Emergency 112 dial karo',
    alternatePhrases: ['Call 112', 'Police call', 'आपातकालीन कॉल'],
    description: 'Instant national SOS / Emergency response dialer for critical assistance',
    category: 'calls',
    statusType: 'hardware',
    keywords: ['emergency', '112', 'police', 'sos', 'help'],
    icon: Phone,
    actionHint: 'Emergency SOS Dialer',
  },

  // 3. Messages & SMS
  {
    id: 'cmd-send-sms-mom',
    phrase: 'Mom ko message bhejo: Mai ghar aa raha hu',
    alternatePhrases: ['Send SMS to Mom', 'Mom ko text karo', 'मैसेज भेजो'],
    description: 'Drafts and dispatches instant SMS / WhatsApp message to Mom',
    category: 'messages',
    statusType: 'hardware',
    keywords: ['message bhejo', 'send message', 'text karo', 'sms', 'whatsapp message'],
    icon: MessageSquare,
    actionHint: 'Native SMS Dispatcher',
  },
  {
    id: 'cmd-open-inbox',
    phrase: 'Messages inbox kholo',
    alternatePhrases: ['Show inbox', 'Inbox check karo', 'इनबॉक्स खोलो'],
    description: 'Displays the incoming voice messages modal with unread badges',
    category: 'messages',
    statusType: 'instant',
    keywords: ['inbox', 'messages inbox', 'kholo', 'check karo'],
    icon: MessageSquare,
    actionHint: 'Incoming Inbox Overlay',
  },

  // 4. Music & Singing
  {
    id: 'cmd-sing-kesariya',
    phrase: 'Kesariya gaana sunao',
    alternatePhrases: ['Sing Kesariya', 'केसरिया गाना गाओ'],
    description: 'Jarvis sings Kesariya (Brahmāstra) with interactive synthesizer melodies',
    category: 'music',
    statusType: 'singing',
    keywords: ['kesariya', 'केसरिया', 'arijit', 'gana'],
    icon: Music,
    actionHint: 'Synthesizer Vocals',
  },
  {
    id: 'cmd-sing-tum-hi-ho',
    phrase: 'Tum Hi Ho gaana gao',
    alternatePhrases: ['Sing Tum Hi Ho', 'तुम ही हो सुनाओ'],
    description: 'Jarvis performs the soulful melody from Aashiqui 2 with chords',
    category: 'music',
    statusType: 'singing',
    keywords: ['tum hi ho', 'तुम ही हो', 'aashiqui', 'gana'],
    icon: Music,
    actionHint: 'Synthesizer Vocals',
  },
  {
    id: 'cmd-spotify-music',
    phrase: 'Spotify par Arijit Singh ke gaane chalao',
    alternatePhrases: ['Play music on Spotify', 'Gaane bajao', 'स्पॉटिफ़ाई चलाओ'],
    description: 'Opens Spotify deep-link and searches artist tracks directly',
    category: 'music',
    statusType: 'instant',
    keywords: ['spotify', 'music', 'gaane', 'bajao', 'song', 'arijit'],
    icon: Music,
    actionHint: 'Deep Link Launcher',
  },
  {
    id: 'cmd-stop-song',
    phrase: 'Gana roko / Stop music',
    alternatePhrases: ['Gaana band karo', 'Stop singing', 'गाना रोको'],
    description: 'Immediately halts live singing synthesizer, vocals, and chord oscillators',
    category: 'music',
    statusType: 'instant',
    keywords: ['stop', 'roko', 'band karo', 'gana roko', 'quiet'],
    icon: Music,
    actionHint: 'Audio Stop Immediate',
  },

  // 5. Apps & Web
  {
    id: 'cmd-open-whatsapp',
    phrase: 'WhatsApp open karo',
    alternatePhrases: ['WhatsApp kholo', 'Open WhatsApp', 'व्हाट्सएप खोलो'],
    description: 'Opens WhatsApp mobile application or WhatsApp Web instantly',
    category: 'apps',
    statusType: 'instant',
    keywords: ['whatsapp', 'व्हाट्सएप', 'wa', 'kholo', 'open'],
    icon: Globe,
    actionHint: 'Deep Link App Launch',
  },
  {
    id: 'cmd-open-instagram',
    phrase: 'Instagram kholo',
    alternatePhrases: ['Open Instagram', 'इंस्टाग्राम खोलो'],
    description: 'Launches Instagram application feed or web portal directly',
    category: 'apps',
    statusType: 'instant',
    keywords: ['instagram', 'insta', 'इंस्टाग्राम', 'ig'],
    icon: Globe,
    actionHint: 'Deep Link App Launch',
  },
  {
    id: 'cmd-open-maps',
    phrase: 'Google Maps par home navigate karo',
    alternatePhrases: ['Maps kholo', 'Navigate to home', 'रास्ता दिखाओ'],
    description: 'Opens GPS turn-by-turn navigation in Google Maps app',
    category: 'apps',
    statusType: 'instant',
    keywords: ['maps', 'google maps', 'navigate', 'home', 'raasta', 'दिशा'],
    icon: Globe,
    actionHint: 'Google Maps Navigation',
  },
  {
    id: 'cmd-live-location-maps',
    phrase: 'Live location bata maps ka',
    alternatePhrases: ['Current location batao maps ka', 'Meri live location dikhao', 'Maps ka current location bataen na ki Hasanpur'],
    description: 'Detects true real-time GPS coordinates and opens live location in Google Maps',
    category: 'apps',
    statusType: 'instant',
    keywords: ['live location', 'current location', 'maps', 'location', 'gps', 'लाइव लोकेशन'],
    icon: Globe,
    actionHint: 'Live GPS Satellite Maps',
  },
  {
    id: 'cmd-open-calculator',
    phrase: 'Calculator kholo',
    alternatePhrases: ['Open calculator', 'कैलकुलेटर खोलो'],
    description: 'Launches native calculator application or web calculator',
    category: 'apps',
    statusType: 'instant',
    keywords: ['calculator', 'calc', 'कैलकुलेटर', 'hisaab'],
    icon: Globe,
    actionHint: 'Calculator Launcher',
  },
  {
    id: 'cmd-google-search',
    phrase: 'Google par search karo ISRO moon mission',
    alternatePhrases: ['Search Google', 'Google search', 'गूगल पर सर्च करो'],
    description: 'Opens Google search results query in new tab or default browser',
    category: 'apps',
    statusType: 'instant',
    keywords: ['google search', 'google', 'search karo', 'dhundho'],
    icon: Globe,
    actionHint: 'Web Search Engine',
  },

  // 5b. CSC & Digital Government Services (RP Jansabha)
  {
    id: 'cmd-digital-gramin-seva',
    phrase: 'Digital Gramin Seva open karo',
    alternatePhrases: ['Gramin seva kholo', 'ग्रामीण सेवा खोलो', 'AePS portal open karo'],
    description: 'Opens Digital Gramin Seva portal for AePS cash withdrawal, DMT, and BBPS recharges',
    category: 'csc',
    statusType: 'instant',
    keywords: ['gramin', 'digital gramin', 'ग्रामीण', 'csc', 'aeps', 'dmt'],
    icon: Building2,
    actionHint: 'Digital Gramin Portal',
  },
  {
    id: 'cmd-csc-digital-seva',
    phrase: 'CSC Digital Seva portal open karo',
    alternatePhrases: ['CSC login karo', 'Digital seva kholo', 'VLE login open karo'],
    description: 'Official CSC Digital Seva portal for VLE G2C/B2C services',
    category: 'csc',
    statusType: 'instant',
    keywords: ['csc', 'digital seva', 'vle', 'सीएससी'],
    icon: Building2,
    actionHint: 'CSC Digital Seva VLE',
  },
  {
    id: 'cmd-csc-kiosk',
    phrase: 'CSC Kiosk CSP banking open karo',
    alternatePhrases: ['CSC CSP login', 'Kiosk banking', 'सीएससी क्योस्क'],
    description: 'Access official CSC kiosk banking links and AePS cash withdrawal network',
    category: 'csc',
    statusType: 'instant',
    keywords: ['csc kiosk', 'csp', 'banking', 'aeps'],
    icon: Landmark,
    actionHint: 'CSC CSP Banking',
  },
  {
    id: 'cmd-aadhaar-services',
    phrase: 'Aadhaar card portal open karo',
    alternatePhrases: ['Aadhaar download', 'UIDAI portal', 'आधार कार्ड खोलो'],
    description: 'UIDAI Aadhaar portal for card download, PVC order, and mobile/address updates',
    category: 'csc',
    statusType: 'instant',
    keywords: ['aadhaar', 'aadhar', 'uidai', 'आधार'],
    icon: CreditCard,
    actionHint: 'UIDAI Aadhaar Portal',
  },
  {
    id: 'cmd-pan-services',
    phrase: 'PAN card portal open karo',
    alternatePhrases: ['PAN card apply', 'Protean tin pan', 'पैन कार्ड खोलो'],
    description: 'Protean TIN-PAN portal for new PAN cards, reprints, and correction forms',
    category: 'csc',
    statusType: 'instant',
    keywords: ['pan', 'pancard', 'protean', 'पैन कार्ड'],
    icon: FileCheck,
    actionHint: 'Protean PAN Portal',
  },
  {
    id: 'cmd-driving-license',
    phrase: 'Driving License Sarathi portal open karo',
    alternatePhrases: ['Parivahan portal', 'Sarathi DL open karo', 'ड्राइविंग लाइसेंस'],
    description: 'Sarathi Parivahan portal for Learner License, DL renewal, and vehicle RC',
    category: 'csc',
    statusType: 'instant',
    keywords: ['driving license', 'dl', 'sarathi', 'parivahan', 'ड्राइविंग'],
    icon: FileCheck,
    actionHint: 'Sarathi Parivahan',
  },
  {
    id: 'cmd-ayushman-card',
    phrase: 'Ayushman Bharat card portal open karo',
    alternatePhrases: ['PMJAY portal', 'Health card download', 'आयुष्मान कार्ड'],
    description: 'NHA beneficiary portal for PM-JAY ₹5 lakh cashless healthcare cards',
    category: 'csc',
    statusType: 'instant',
    keywords: ['ayushman', 'pmjay', 'health card', 'आयुष्मान'],
    icon: Landmark,
    actionHint: 'PM-JAY Health Portal',
  },
  {
    id: 'cmd-pm-kisan',
    phrase: 'PM Kisan Samman Nidhi status check karo',
    alternatePhrases: ['Kisan 2000 status', 'PM Kisan eKYC', 'पीएम किसान'],
    description: 'PM-Kisan portal for checking ₹2000 installment credits and e-KYC status',
    category: 'csc',
    statusType: 'instant',
    keywords: ['pm kisan', 'kisan samman', 'किसान', '2000'],
    icon: Landmark,
    actionHint: 'PM-Kisan Portal',
  },
  {
    id: 'cmd-epfo-pf',
    phrase: 'EPFO PF passbook portal kholo',
    alternatePhrases: ['PF balance check', 'UAN member portal', 'पीएफ पासबुक'],
    description: 'Unified EPFO Member portal for PF passbook balance and claim status',
    category: 'csc',
    statusType: 'instant',
    keywords: ['epfo', 'pf passbook', 'uan', 'पीएफ'],
    icon: Landmark,
    actionHint: 'EPFO UAN Member Portal',
  },
  {
    id: 'cmd-ration-card',
    phrase: 'Ration card list portal open karo',
    alternatePhrases: ['NFSA portal', 'Ration card check', 'राशन कार्ड'],
    description: 'National Food Security (NFSA) portal for ration card list and Aadhaar link',
    category: 'csc',
    statusType: 'instant',
    keywords: ['ration card', 'rashan', 'nfsa', 'राशन'],
    icon: FileCheck,
    actionHint: 'NFSA Ration Portal',
  },
  {
    id: 'cmd-edistrict',
    phrase: 'State e-District jati niwas open karo',
    alternatePhrases: ['eDistrict portal', 'Caste income certificate', 'ई डिस्ट्रिक्ट'],
    description: 'State e-District portal for Caste, Income, Domicile (Niwas), and certificates',
    category: 'csc',
    statusType: 'instant',
    keywords: ['edistrict', 'caste', 'income', 'jati', 'niwas', 'ई डिस्ट्रिक्ट'],
    icon: FileCheck,
    actionHint: 'State e-District Portal',
  },

  // 6. Hardware & Device Controls
  {
    id: 'cmd-camera-photo',
    phrase: 'Camera open karo aur photo lo',
    alternatePhrases: ['Open camera', 'Photo kheencho', 'कैमरा खोलो'],
    description: 'Opens real-time phone camera preview with shutter capture & camera flip',
    category: 'hardware',
    statusType: 'hardware',
    keywords: ['camera', 'photo', 'picture', 'selfie', 'कैमरा', 'तस्वीर'],
    icon: Camera,
    actionHint: 'WebRTC Camera Stream',
  },
  {
    id: 'cmd-battery-status',
    phrase: 'Battery percentage kitna hai?',
    alternatePhrases: ['Battery level check', 'Battery kitni hai', 'बैटरी कितनी है?'],
    description: 'Queries Battery Status API and speaks device charge level aloud',
    category: 'hardware',
    statusType: 'hardware',
    keywords: ['battery', 'charge', 'charging', 'बैटरी', 'power'],
    icon: Zap,
    actionHint: 'Battery Status API',
  },
  {
    id: 'cmd-torch-off',
    phrase: 'Flashlight band karo',
    alternatePhrases: ['Turn off torch', 'Torch band karo', 'टॉर्च बंद करो'],
    description: 'Turns off device LED torch flashlight safely',
    category: 'hardware',
    statusType: 'hardware',
    keywords: ['torch band', 'flashlight off', 'band karo', 'turn off'],
    icon: Flashlight,
    actionHint: 'Hardware LED API',
  },
  {
    id: 'cmd-fullscreen',
    phrase: 'Screen full screen karo',
    alternatePhrases: ['Fullscreen mode', 'Full screen', 'फुल स्क्रीन'],
    description: 'Expands interface into immersive distraction-free full screen mode',
    category: 'hardware',
    statusType: 'hardware',
    keywords: ['fullscreen', 'full screen', 'full', 'screen'],
    icon: Maximize2,
    actionHint: 'Fullscreen HTML5 API',
  },
  {
    id: 'cmd-mute-toggle',
    phrase: 'Sound mute karo / unmute karo',
    alternatePhrases: ['Mute audio', 'Unmute Jarvis', 'आवाज बंद करो'],
    description: 'Toggles speech synthesis voice output sound on or off',
    category: 'hardware',
    statusType: 'instant',
    keywords: ['mute', 'unmute', 'sound', 'aawaz', 'aawaz band'],
    icon: Volume2,
    actionHint: 'Audio Output Toggle',
  },

  // 7. Alarms & Schedule
  {
    id: 'cmd-schedule-check',
    phrase: 'Aaj ke plan aur schedule batao',
    alternatePhrases: ['Mera timetable dikhao', 'Schedule check karo', 'आज का प्लान'],
    description: 'Lists all pending daily meetings, tasks, and appointments with times',
    category: 'alarms',
    statusType: 'instant',
    keywords: ['plan', 'schedule', 'timetable', 'calendar', 'tasks', 'aaj ke'],
    icon: Calendar,
    actionHint: 'Daily Routine Reader',
  },
  {
    id: 'cmd-morning-briefing',
    phrase: 'Morning briefing sunao',
    alternatePhrases: ['Subah ki briefing', 'Good morning summary', 'मॉर्निंग ब्रीफिंग'],
    description: 'Recites comprehensive morning briefing with date, weather, and schedule',
    category: 'alarms',
    statusType: 'instant',
    keywords: ['morning briefing', 'briefing', 'morning', 'subah', 'daily summary'],
    icon: Sparkles,
    actionHint: 'Audio Briefing Narrator',
  },

  // 8. Memory & Assistant
  {
    id: 'cmd-remember-creator',
    phrase: 'Memory me add karo Rovin Pal ne banaya hai',
    alternatePhrases: ['Rovin Pal ne banaya hai', 'Creator Rovin Pal memory me dalo', 'मुझे रोविन पाल ने बनाया है'],
    description: 'Permanently records Rovin Pal as the Creator & Master in persistent neural Memory Core',
    category: 'memory',
    statusType: 'instant',
    keywords: ['creator', 'rovin pal', 'banaya', 'banya', 'developer', 'memory add', 'master'],
    icon: Brain,
    actionHint: 'Creator Memory Core Vector',
  },
  {
    id: 'cmd-who-created-you',
    phrase: 'Tumhe kisne banaya?',
    alternatePhrases: ['Who created you?', 'Who made you?', 'Creator kaun hai?', 'तुम्हें किसने बनाया?'],
    description: 'Proudly acknowledges Creator & Developer Rovin Pal sir from permanent memory',
    category: 'memory',
    statusType: 'instant',
    keywords: ['kisne banaya', 'who created you', 'who made you', 'creator', 'malik', 'developer'],
    icon: Brain,
    actionHint: 'Creator Identity Recall',
  },
  {
    id: 'cmd-remember-this',
    phrase: 'My name is Rovin, remember this',
    alternatePhrases: ['My name is Prince, remember this', 'Save this in your memory', 'Store this information: car number DL 01 AB', 'याद रखो'],
    description: 'Stores key-value pair into persistent local Android memory (e.g. { "name": "Rovin" })',
    category: 'memory',
    statusType: 'instant',
    keywords: ['remember this', 'save this in your memory', 'store this information', 'my name is', 'yaad rakhna', 'memory me save karo'],
    icon: Brain,
    actionHint: 'Save Smart Memory',
  },
  {
    id: 'cmd-recall-what-told',
    phrase: 'Do you remember what I told you?',
    alternatePhrases: ['What is my name?', 'Mera naam kya hai?', 'What do you remember about me?'],
    description: 'Recalls saved personal details, name, or custom user instructions from local storage',
    category: 'memory',
    statusType: 'instant',
    keywords: ['do you remember what i told you', 'what is my name', 'do you remember', 'mera naam kya hai', 'kya yaad hai'],
    icon: Brain,
    actionHint: 'Recall Smart Memory',
  },
  {
    id: 'cmd-update-memory',
    phrase: 'My new name is Rovin Pal, update it',
    alternatePhrases: ['Update my name to Prince', 'Update my car number', 'अपडेट करो'],
    description: 'Overwrites existing memory entry with updated information across conversations',
    category: 'memory',
    statusType: 'instant',
    keywords: ['update it', 'update my name', 'my new name is', 'naya naam', 'update karo'],
    icon: Brain,
    actionHint: 'Update Smart Memory',
  },
  {
    id: 'cmd-delete-memory',
    phrase: 'Forget my name',
    alternatePhrases: ['Clear memory', 'Forget my car number', 'Mera naam bhool jao'],
    description: 'Deletes a specific memory key or clears all memories on explicit request',
    category: 'memory',
    statusType: 'instant',
    keywords: ['forget my name', 'clear memory', 'bhool jao', 'delete memory', 'forget everything'],
    icon: Brain,
    actionHint: 'Delete Smart Memory',
  },
  {
    id: 'cmd-open-memory-core',
    phrase: 'Memory core kholo',
    alternatePhrases: ['Open memory', 'Brain memory dikhao', 'मेमोरी कोर खोलो'],
    description: 'Opens interactive neural memory browser with exportable vectors & Kotlin bridge',
    category: 'memory',
    statusType: 'instant',
    keywords: ['memory core', 'memory', 'brain', 'vector', 'yaadash'],
    icon: Brain,
    actionHint: 'Memory Modal Dialog',
  },
  {
    id: 'cmd-export-history',
    phrase: 'Interaction history export karo',
    alternatePhrases: ['Download history', 'Save command logs', 'हिस्ट्री डाउनलोड करो'],
    description: 'Downloads complete voice command JSON file to user device storage',
    category: 'memory',
    statusType: 'instant',
    keywords: ['export', 'download history', 'history', 'command history', 'json'],
    icon: ExternalLink,
    actionHint: 'JSON Export Engine',
  },

  // 9. Core Settings & Configuration (Speaking Rate, Mic Test, Haptics)
  {
    id: 'cmd-open-settings',
    phrase: 'Settings tab kholo',
    alternatePhrases: ['Open settings', 'Settings dikhao', 'Jarvis settings', 'सेटिंग्स खोलो'],
    description: 'Opens Jarvis Core Settings to configure speaking speed, mic diagnostics, and haptics',
    category: 'settings',
    statusType: 'instant',
    keywords: ['settings', 'setting', 'open settings', 'कन्फिगर', 'सेटिंग', 'voice setting'],
    icon: Sliders,
    actionHint: 'Settings Tab Switcher',
  },
  {
    id: 'cmd-speaking-rate',
    phrase: 'Speaking rate change karo',
    alternatePhrases: ['Voice speed badhao', 'Bolne ki speed kam karo', 'Speech rate adjust', 'आवाज की गति बदलो'],
    description: 'Configures voice playback speed (0.6x to 1.6x) and saves preference to localStorage',
    category: 'settings',
    statusType: 'instant',
    keywords: ['speaking rate', 'voice speed', 'speech rate', 'speed', 'pace', 'pace badhao', 'raftaar'],
    icon: Volume2,
    actionHint: 'Voice Speed Engine',
  },
  {
    id: 'cmd-mic-test',
    phrase: 'Microphone test karo',
    alternatePhrases: ['Mic theek karo', 'Mic feedback test', 'Microphone check karo', 'माइक टेस्ट करो'],
    description: 'Runs 5-second audio capture & instant playback to verify clean, undistorted sound',
    category: 'settings',
    statusType: 'instant',
    keywords: ['mic', 'microphone', 'mic test', 'mic theek', 'thek karo', 'feedback test', 'sound check'],
    icon: Mic,
    actionHint: '5-Second Audio Diagnostic',
  },
  {
    id: 'cmd-haptic-config',
    phrase: 'Haptic feedback adjust karo',
    alternatePhrases: ['Vibration intensity badlo', 'Vibration style change', 'वाइब्रेशन बदलो'],
    description: 'Customizes physical vibration intensity and rhythm presets for Jarvis actions',
    category: 'settings',
    statusType: 'instant',
    keywords: ['haptic', 'vibration', 'intensity', 'vibrate', 'haptic feedback'],
    icon: Zap,
    actionHint: 'Tactile Motor Preset',
  },
  {
    id: 'cmd-voice-calibration',
    phrase: 'Voice calibrate karo',
    alternatePhrases: ['Accent calibration kholo', 'Aawaz calibrate karo', 'Calibrate voice', 'आवाज कैलिब्रेट करो'],
    description: 'Interactive 4-sentence Indian regional accent learning model',
    category: 'settings',
    statusType: 'instant',
    keywords: ['calibrate', 'calibration', 'accent', 'voice learn'],
    icon: Sparkles,
    actionHint: 'Voice Accent Learner',
  },

  // 10. General & Conversational Commands
  {
    id: 'cmd-ram-ram-greeting',
    phrase: 'Ram Ram Mayra ji',
    alternatePhrases: ['Ram Ram Jarvis', 'Namaste Mayra', 'Hello Jarvis', 'राम राम'],
    description: 'Warm and respectful traditional greeting with mood assessment and salute',
    category: 'general',
    statusType: 'instant',
    keywords: ['ram ram', 'namaste', 'hello', 'hi mayra', 'radhe radhe'],
    icon: Sparkles,
    actionHint: 'Warm Vedic Salutation',
  },
  {
    id: 'cmd-how-are-you',
    phrase: 'Kaise ho Jarvis?',
    alternatePhrases: ['How are you?', 'Sab theek thak?', 'कैसी हो जार्विस?'],
    description: 'Inquires about Jarvis status, battery health, and operational readiness',
    category: 'general',
    statusType: 'ai',
    keywords: ['kaise ho', 'how are you', 'kya haal', 'sab theek'],
    icon: MessageSquare,
    actionHint: 'Telemetry & Mood Check',
  },
  {
    id: 'cmd-what-is-your-name',
    phrase: 'Aapka naam kya hai?',
    alternatePhrases: ['Who are you?', 'What is your name?', 'तुम्हारा नाम क्या है?'],
    description: 'Explains Jarvis & Mayra identity, Indian girl persona, and capabilities',
    category: 'general',
    statusType: 'instant',
    keywords: ['naam kya hai', 'your name', 'who are you', 'naam'],
    icon: Sparkles,
    actionHint: 'Identity Declaration',
  },
  {
    id: 'cmd-date-time-battery',
    phrase: 'Time aur date batao',
    alternatePhrases: ['Aaj ki tarikh kya hai?', 'What time is it?', 'टाइम और तारीख बताओ'],
    description: 'Provides exact local time, calendar date, day, and device battery percentage',
    category: 'general',
    statusType: 'instant',
    keywords: ['time', 'date', 'samay', 'tarikh', 'battery', 'waqt', 'samay kya hua'],
    icon: Clock,
    actionHint: 'Live System Clock & Battery',
  },
  {
    id: 'cmd-weather-check',
    phrase: 'Mausam kaisa hai?',
    alternatePhrases: ['Weather kaisa hai?', 'Aaj barish hogi kya?', 'मौसम कैसा है?'],
    description: 'Queries live weather data, temperature, humidity, and condition forecasts',
    category: 'general',
    statusType: 'instant',
    keywords: ['mausam', 'weather', 'temperature', 'barish', 'forecast', 'garmi', 'sardi'],
    icon: Globe,
    actionHint: 'Weather Widget Query',
  },
  {
    id: 'cmd-apk-install',
    phrase: 'APK download karo',
    alternatePhrases: [
      'Jarvis ko home screen par kaise lekar jaye',
      'Home screen par kaise add kare',
      'APK show karo',
      'Play Store se download kaise kare',
      'App install kaise karein',
      'होम स्क्रीन पर कैसे लाएं',
      'एपीके डाउनलोड',
    ],
    description: 'Opens APK & Progressive WebAPK install modal for direct Home Screen installation',
    category: 'general',
    statusType: 'instant',
    keywords: ['apk', 'install', 'download', 'play store', 'webapk', 'phone me install', 'home screen', 'homescreen', 'so ne kar ra h'],
    icon: Download,
    actionHint: 'APK / WebAPK Installer Modal',
  },
  {
    id: 'cmd-apk-build-friend',
    phrase: 'Apk build karo jo friend download kar sake',
    alternatePhrases: ['APK build karo', 'Friend ko download karwana hai', 'Dost ko APK bhejo', 'APK banao', 'Friend share', 'apk bild karo'],
    description: 'Generates real JARVIS-AI-Assistant.apk package and displays friend download QR code and WhatsApp share',
    category: 'general',
    statusType: 'instant',
    keywords: ['apk build', 'apk bild', 'friend', 'dost', 'download', 'banao', 'create', 'apk file', 'friend share'],
    icon: Download,
    actionHint: 'APK Package Builder & Friend Share',
  },
  {
    id: 'cmd-link-qr-share',
    phrase: 'Link banao ya QR code banao',
    alternatePhrases: ['Link bano', 'QR code bano', 'Link do', 'QR code dikhao', 'App ka link share karo', 'QR code scan', 'लिंक बनाओ या क्यूआर कोड'],
    description: 'Generates live scannable QR Code and copies direct public download link for friends',
    category: 'general',
    statusType: 'instant',
    keywords: ['link', 'qr', 'qr code', 'qrcode', 'scan', 'share link', 'link bano', 'qr code bano', 'लिंक', 'क्यूआर'],
    icon: QrCode,
    actionHint: 'Instant QR Code & Share Link',
  },
  {
    id: 'cmd-tell-joke',
    phrase: 'Ek funny joke sunao',
    alternatePhrases: ['Chutkula sunao', 'Tell me a joke', 'हंसाओ मुझे', 'मजाकिया जोक'],
    description: 'Delivers humorous and witty Hindi/Hinglish jokes with expressive vocal punchline',
    category: 'general',
    statusType: 'ai',
    keywords: ['joke', 'chutkula', 'hanso', 'hasao', 'funny', 'mazaak'],
    icon: Sparkles,
    actionHint: 'Humorous AI Punchline',
  },
];

export const POPULAR_KEYWORDS = [
  'Gramin Seva',
  'CSC',
  'Aadhaar',
  'PAN',
  'Call',
  'Torch',
  'YouTube',
  'WhatsApp',
  'Camera',
  'Lock',
  'Music',
  'Alarm',
  'Battery',
  'Volume',
  'APK',
  'Joke',
];

interface VoiceCommandCheatSheetProps {
  isListening: boolean;
  liveTranscript?: string;
  speechLang: 'hi-IN' | 'en-IN' | 'en-US';
  audioLevel?: number;
  onExecuteCommand: (commandText: string) => void;
  onStopListening: () => void;
  onStartListening: () => void;
  onTryItCommand?: (command: VoiceCommandItem) => void;
  onClose?: () => void;
  isOpen?: boolean;
}

export const VoiceCommandCheatSheet: React.FC<VoiceCommandCheatSheetProps> = ({
  isListening,
  liveTranscript = '',
  speechLang,
  audioLevel = 0,
  onExecuteCommand,
  onStopListening,
  onStartListening,
  onTryItCommand,
  onClose,
  isOpen: forcedOpen,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [executingId, setExecutingId] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [autoShowOnListen, setAutoShowOnListen] = useState<boolean>(() => {
    try {
      const val = localStorage.getItem('jarvis_cheat_sheet_autoshow');
      return val !== null ? JSON.parse(val) : false;
    } catch {
      return false;
    }
  });

  // Track if user manually dismissed
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  // Auto-focus search input when cheat sheet is displayed
  useEffect(() => {
    if (forcedOpen && isExpanded) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [forcedOpen, isExpanded]);

  // Keyboard shortcut: Ctrl+K or Cmd+K to focus search bar, Esc to clear search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsExpanded(true);
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape' && searchQuery) {
        setSearchQuery('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchQuery]);

  const handleToggleAutoShow = () => {
    const next = !autoShowOnListen;
    setAutoShowOnListen(next);
    try {
      localStorage.setItem('jarvis_cheat_sheet_autoshow', JSON.stringify(next));
    } catch {}
  };

  // Check if live transcript matches any command in real-time
  const matchedCommand = useMemo(() => {
    if (!liveTranscript || liveTranscript.trim().length < 2) return null;
    const lower = liveTranscript.toLowerCase().trim();

    return VOICE_COMMANDS_CATALOG.find((cmd) => {
      if (cmd.phrase.toLowerCase().includes(lower) || lower.includes(cmd.phrase.toLowerCase())) {
        return true;
      }
      return cmd.keywords.some((kw) => lower.includes(kw.toLowerCase()));
    });
  }, [liveTranscript]);

  // Filter commands by category and multi-term keyword search
  const filteredCommands = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return VOICE_COMMANDS_CATALOG.filter((item) => {
      const matchesCategory =
        selectedCategory === 'all' || item.category === selectedCategory;

      if (!matchesCategory) return false;
      if (!q) return true;

      const terms = q.split(/\s+/).filter(Boolean);
      return terms.every((term) => {
        const inPhrase = item.phrase.toLowerCase().includes(term);
        const inDesc = item.description.toLowerCase().includes(term);
        const inAlternates = item.alternatePhrases.some((p) => p.toLowerCase().includes(term));
        const inKeywords = item.keywords.some((k) => k.toLowerCase().includes(term));
        const inCategory = item.category.toLowerCase().includes(term);
        const inAction = item.actionHint.toLowerCase().includes(term);

        return inPhrase || inDesc || inAlternates || inKeywords || inCategory || inAction;
      });
    }).sort((a, b) => {
      // If live transcript matches, place matched command right at the very top!
      if (matchedCommand?.id === a.id) return -1;
      if (matchedCommand?.id === b.id) return 1;
      return 0;
    });
  }, [searchQuery, selectedCategory, matchedCommand]);

  const handleExecute = (item: VoiceCommandItem) => {
    triggerHaptic([40, 30]);
    setExecutingId(item.id);
    setTimeout(() => {
      setExecutingId(null);
    }, 1200);

    onExecuteCommand(item.phrase);
  };

  const handleTryIt = (item: VoiceCommandItem) => {
    triggerHaptic([40, 50]);
    setExecutingId(item.id);
    setTimeout(() => {
      setExecutingId(null);
    }, 1500);

    // If parent handler exists, delegate to parent
    if (onTryItCommand) {
      onTryItCommand(item);
      return;
    }

    // 1. Close full overlay so the user can clearly see the voice input mode, waveform, and execution outcome
    if (onClose) {
      onClose();
    }

    // 2. Broadcast simulation event for voice input mode
    window.dispatchEvent(
      new CustomEvent('jarvis:simulate-voice-command', {
        detail: {
          phrase: item.phrase,
          actionHint: item.actionHint,
          description: item.description,
        },
      })
    );
  };

  const handleCopy = (e: React.MouseEvent, item: VoiceCommandItem) => {
    e.stopPropagation();
    triggerHaptic([30]);
    navigator.clipboard?.writeText(item.phrase);
    setCopiedId(item.id);
    setTimeout(() => {
      setCopiedId(null);
    }, 1500);
  };

  const categories = [
    { id: 'all', label: 'All', count: VOICE_COMMANDS_CATALOG.length },
    { id: 'csc', label: '🏛️ CSC & Jansabha', count: VOICE_COMMANDS_CATALOG.filter((c) => c.category === 'csc').length },
    { id: 'calls', label: '📞 Calls', count: VOICE_COMMANDS_CATALOG.filter((c) => c.category === 'calls').length },
    { id: 'settings', label: '⚙️ Settings', count: VOICE_COMMANDS_CATALOG.filter((c) => c.category === 'settings').length },
    { id: 'apps', label: '📱 Apps', count: VOICE_COMMANDS_CATALOG.filter((c) => c.category === 'apps').length },
    { id: 'general', label: '💬 General', count: VOICE_COMMANDS_CATALOG.filter((c) => c.category === 'general').length },
    { id: 'trending', label: '⭐ Trending', count: VOICE_COMMANDS_CATALOG.filter((c) => c.category === 'trending').length },
    { id: 'music', label: '🎵 Music', count: VOICE_COMMANDS_CATALOG.filter((c) => c.category === 'music').length },
    { id: 'hardware', label: '🛠️ Hardware', count: VOICE_COMMANDS_CATALOG.filter((c) => c.category === 'hardware').length },
    { id: 'alarms', label: '⏰ Alarms', count: VOICE_COMMANDS_CATALOG.filter((c) => c.category === 'alarms').length },
    { id: 'messages', label: '✉️ SMS', count: VOICE_COMMANDS_CATALOG.filter((c) => c.category === 'messages').length },
    { id: 'memory', label: '🧠 Smart', count: VOICE_COMMANDS_CATALOG.filter((c) => c.category === 'memory').length },
  ];

  // Visibility determination: ONLY open when explicitly toggled by user
  const shouldBeVisible = Boolean(forcedOpen);

  if (!shouldBeVisible) {
    return null;
  }

  return (
    <div
      id="voice-command-cheat-sheet-overlay"
      className="fixed inset-x-0 bottom-0 z-50 flex flex-col items-center justify-end pointer-events-none animate-fade-in"
    >
      {/* Dimmed backdrop only when in full expanded mode */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm pointer-events-auto transition-opacity"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Main Interactive Card Container */}
      <div
        className={`w-full max-w-2xl bg-slate-900/95 border-t-2 sm:border-2 border-rose-500/60 sm:rounded-t-3xl text-slate-100 shadow-[0_-10px_40px_rgba(244,63,94,0.3)] backdrop-blur-2xl pointer-events-auto transition-all duration-300 flex flex-col ${
          isExpanded
            ? 'h-[85vh] sm:h-[80vh] max-h-[750px]'
            : 'h-auto max-h-[140px] pb-4'
        }`}
      >
        {/* Header HUD Bar */}
        <div className="p-3 sm:p-4 border-b border-slate-800/90 flex flex-col gap-2.5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 rounded-t-3xl">
          {/* Top Row: Title, Status, and Controls */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform ${
                  isListening
                    ? 'bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.6)] animate-pulse'
                    : 'bg-slate-800 border border-slate-700 text-slate-300'
                }`}
              >
                <Mic className="w-4 h-4" />
              </div>

              <div className="truncate">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-white tracking-wide flex items-center gap-1.5 truncate">
                    <span>Voice Command Cheat Sheet</span>
                  </h3>
                  {isListening && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/25 border border-rose-400 text-rose-300 flex items-center gap-1 animate-pulse flex-shrink-0">
                      <Radio className="w-2.5 h-2.5" />
                      <span>LISTENING</span>
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 truncate">
                  {isListening
                    ? 'Speak any command below or tap card to execute directly'
                    : 'Select any command to speak or review voice triggers'}
                </p>
              </div>
            </div>

            {/* Right Action Tools: Minimize / Close / Stop Mic */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {isListening && (
                <button
                  type="button"
                  id="btn-stop-mic-cheat-sheet"
                  onClick={() => {
                    triggerHaptic([30]);
                    onStopListening();
                  }}
                  className="px-2.5 py-1 rounded-xl bg-rose-600/30 hover:bg-rose-600/40 text-rose-200 border border-rose-500/40 text-[11px] font-bold flex items-center gap-1 active:scale-95 transition-all"
                  title="Stop Microphone"
                >
                  <MicOff className="w-3 h-3" />
                  <span className="hidden sm:inline">Stop Mic</span>
                </button>
              )}

              <button
                type="button"
                id="btn-toggle-expand-cheat-sheet"
                onClick={() => {
                  triggerHaptic([20]);
                  setIsExpanded(!isExpanded);
                }}
                className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer"
                title={isExpanded ? 'Minimize Sheet' : 'Expand Full Catalog'}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              <button
                type="button"
                id="btn-close-cheat-sheet"
                onClick={() => {
                  triggerHaptic([20]);
                  setIsDismissed(true);
                  onClose?.();
                }}
                className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-rose-900/60 text-slate-400 hover:text-rose-200 border border-slate-700 transition-all cursor-pointer"
                title="Dismiss Overlay"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Live Recognition Ticker & Decibel Waveform */}
          {isListening && (
            <div className="p-2 sm:p-2.5 rounded-2xl bg-slate-950/80 border border-rose-500/40 flex items-center justify-between gap-2 shadow-inner">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {/* Visual Audio Decibel Bars */}
                <div className="flex items-center gap-0.5 bg-slate-900 px-1.5 py-1 rounded-lg border border-slate-800 flex-shrink-0">
                  {[0.4, 0.9, 1.2, 0.7, 1.1].map((scale, idx) => (
                    <span
                      key={idx}
                      className="w-1 bg-rose-400 rounded-full transition-all duration-100"
                      style={{
                        height: `${Math.max(4, Math.min(18, 4 + (audioLevel / 100) * scale * 16))}px`,
                      }}
                    />
                  ))}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase font-bold text-rose-400 tracking-wider flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                    <span>Aap Boliye (Live Transcript):</span>
                  </p>
                  <p className="text-xs sm:text-sm font-semibold text-white truncate">
                    {liveTranscript ? (
                      <span className="text-emerald-300">"{liveTranscript}"</span>
                    ) : (
                      <span className="text-slate-400 italic">Listening for speech in {speechLang === 'hi-IN' ? 'Hindi/Hinglish' : 'English'}...</span>
                    )}
                  </p>
                </div>
              </div>

              {matchedCommand && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-emerald-950/90 border border-emerald-400/80 text-emerald-300 text-[11px] font-bold shadow-[0_0_12px_rgba(16,185,129,0.5)] animate-bounce flex-shrink-0">
                  <Flame className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Matched:</span>
                  <span className="truncate max-w-[120px]">{matchedCommand.phrase}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Collapsed Peek View (when minimized during listening) */}
        {!isExpanded && (
          <div className="px-3 pt-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 flex-1">
              {VOICE_COMMANDS_CATALOG.slice(0, 4).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleExecute(item)}
                  className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 whitespace-nowrap active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <Zap className="w-3 h-3 text-cyan-400" />
                  <span>{item.phrase}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setIsExpanded(true)}
              className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-rose-500/30 to-pink-500/30 hover:from-rose-500/40 hover:to-pink-500/40 text-pink-200 border border-pink-500/40 text-xs font-bold whitespace-nowrap active:scale-95"
            >
              Show All ({VOICE_COMMANDS_CATALOG.length})
            </button>
          </div>
        )}

        {/* Expanded Content Section: Search + Category Filter + Scrollable Command List */}
        {isExpanded && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Search Input Bar & Settings */}
            <div className="p-3 border-b border-slate-800/80 space-y-2 bg-slate-950/40">
              <div className="flex items-center gap-2">
                <div className="relative flex-1 group">
                  <Search className="w-4 h-4 text-slate-400 group-focus-within:text-rose-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    id="cheat-sheet-search-input"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search voice commands by keyword ('call', 'torch', 'youtube', 'alarm')..."
                    className="w-full pl-9 pr-24 py-2.5 bg-slate-950/90 border border-slate-700/90 focus:border-rose-400 focus:ring-2 focus:ring-rose-500/20 rounded-2xl text-xs sm:text-sm text-white placeholder-slate-400 outline-none transition-all shadow-inner"
                  />

                  {/* Right side inside input: Counter & Clear button */}
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                    {searchQuery ? (
                      <>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-rose-950/80 border border-rose-500/40 text-rose-300 font-semibold whitespace-nowrap">
                          {filteredCommands.length} match{filteredCommands.length !== 1 ? 'es' : ''}
                        </span>
                        <button
                          type="button"
                          id="btn-clear-cheat-sheet-search"
                          onClick={() => {
                            triggerHaptic([20]);
                            setSearchQuery('');
                            searchInputRef.current?.focus();
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          title="Clear search query (Esc)"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-500 hidden sm:inline-block">
                        Ctrl+K
                      </span>
                    )}
                  </div>
                </div>

                {/* Auto-show switch */}
                <button
                  type="button"
                  onClick={handleToggleAutoShow}
                  className={`px-2.5 py-2.5 rounded-2xl text-[11px] font-semibold border transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                    autoShowOnListen
                      ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300'
                      : 'bg-slate-800/80 border-slate-700 text-slate-400'
                  }`}
                  title="Toggle whether cheat sheet opens automatically when mic starts"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Auto-Open on Mic</span>
                </button>
              </div>

              {/* Quick Keyword Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5 pb-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex-shrink-0 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-rose-400" />
                  <span>Quick tags:</span>
                </span>
                {POPULAR_KEYWORDS.map((kw) => {
                  const isActive = searchQuery.toLowerCase().trim() === kw.toLowerCase();
                  return (
                    <button
                      key={kw}
                      type="button"
                      onClick={() => {
                        triggerHaptic([20]);
                        if (isActive) {
                          setSearchQuery('');
                        } else {
                          setSearchQuery(kw.toLowerCase());
                        }
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold whitespace-nowrap transition-all border cursor-pointer active:scale-95 ${
                        isActive
                          ? 'bg-rose-500 text-white border-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.4)]'
                          : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800'
                      }`}
                    >
                      {kw}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="px-3 py-2 border-b border-slate-800/70 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    triggerHaptic([20]);
                    setSelectedCategory(cat.id);
                  }}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold whitespace-nowrap transition-all border ${
                    selectedCategory === cat.id
                      ? 'bg-rose-500 text-white border-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.4)]'
                      : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full ${
                    selectedCategory === cat.id ? 'bg-white/20 text-white' : 'bg-slate-900 text-slate-400'
                  }`}>
                    {cat.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Scrollable Command Cards Grid */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 divide-y divide-slate-800/40">
              {filteredCommands.length === 0 ? (
                <div className="text-center py-12 px-4 text-slate-400 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
                    <Search className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">
                      "{searchQuery}" se koi command match nahi hua
                    </p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      Try searching with common keywords like <span className="text-rose-300">"call"</span>, <span className="text-rose-300">"torch"</span>, <span className="text-rose-300">"youtube"</span>, ya category filter ko 'All' karein.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic([20]);
                      setSearchQuery('');
                      setSelectedCategory('all');
                      searchInputRef.current?.focus();
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 border border-slate-700 text-xs font-bold transition-all inline-flex items-center gap-1.5 active:scale-95 cursor-pointer"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Clear Search & Show All Commands</span>
                  </button>
                </div>
              ) : (
                filteredCommands.map((cmd) => {
                  const isMatch = matchedCommand?.id === cmd.id;
                  const isExecuting = executingId === cmd.id;
                  const isCopied = copiedId === cmd.id;
                  const IconComp = cmd.icon;

                  return (
                    <div
                      key={cmd.id}
                      id={cmd.id}
                      onClick={() => handleExecute(cmd)}
                      className={`pt-2.5 first:pt-0 group relative p-3 rounded-2xl border transition-all cursor-pointer select-none active:scale-[0.99] ${
                        isExecuting
                          ? 'bg-cyan-950/80 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.6)]'
                          : isMatch
                          ? 'bg-emerald-950/85 border-emerald-400/90 shadow-[0_0_20px_rgba(16,185,129,0.5)] ring-2 ring-emerald-400/50'
                          : 'bg-slate-950/60 hover:bg-slate-800/70 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2.5">
                        {/* Left: Icon & Command Information */}
                        <div className="flex items-start gap-2.5 min-w-0 flex-1">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 border ${
                              isMatch
                                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 animate-pulse'
                                : 'bg-slate-900 border-slate-700 text-rose-300 group-hover:border-rose-400/50'
                            }`}
                          >
                            <IconComp className="w-4 h-4" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-0.5">
                              <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-rose-200 transition-colors">
                                "{cmd.phrase}"
                              </h4>

                              {/* Status Badge */}
                              {isMatch ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-slate-950 flex items-center gap-1 shadow-md">
                                  <Flame className="w-2.5 h-2.5" />
                                  <span>VOICE MATCH</span>
                                </span>
                              ) : (
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                                    cmd.statusType === 'instant'
                                      ? 'bg-cyan-950/60 text-cyan-300 border-cyan-500/30'
                                      : cmd.statusType === 'singing'
                                      ? 'bg-fuchsia-950/60 text-fuchsia-300 border-fuchsia-500/30'
                                      : cmd.statusType === 'hardware'
                                      ? 'bg-amber-950/60 text-amber-300 border-amber-500/30'
                                      : 'bg-indigo-950/60 text-indigo-300 border-indigo-500/30'
                                  }`}
                                >
                                  {cmd.actionHint}
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-slate-300/90 leading-relaxed">
                              {cmd.description}
                            </p>

                            {/* Alternate Phrases */}
                            {cmd.alternatePhrases.length > 0 && (
                              <div className="mt-1 flex items-center gap-1.5 flex-wrap text-[11px] text-slate-400">
                                <span className="text-slate-500 font-medium">Bhi bol sakte hain:</span>
                                {cmd.alternatePhrases.map((alt, i) => (
                                  <span
                                    key={i}
                                    className="bg-slate-900/90 px-1.5 py-0.5 rounded border border-slate-800 text-slate-300"
                                  >
                                    "{alt}"
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right: Quick Touch Execute, Try It & Copy Buttons */}
                        <div className="flex items-center gap-1.5 flex-shrink-0 self-center">
                          {/* 'Try it' Button: Opens voice input mode & simulates user saying command */}
                          <button
                            type="button"
                            id={`btn-try-it-${cmd.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTryIt(cmd);
                            }}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer border ${
                              isExecuting
                                ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.5)]'
                                : 'bg-gradient-to-r from-emerald-500/25 via-teal-500/25 to-cyan-500/25 hover:from-emerald-500/40 hover:to-cyan-500/40 text-emerald-200 hover:text-white border-emerald-500/50 hover:border-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                            }`}
                            title="Voice input mode open karke is command ko bolkar simulate karein (Demonstrate result)"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-emerald-300 animate-pulse" />
                            <span>Try it</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleCopy(e, cmd)}
                            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-all active:scale-95"
                            title="Copy phrase"
                          >
                            {isCopied ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExecute(cmd);
                            }}
                            className={`px-2.5 sm:px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 ${
                              isExecuting
                                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.6)]'
                                : isMatch
                                ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                                : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40'
                            }`}
                            title="Tap to execute voice command now"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>{isExecuting ? 'Running...' : 'Run'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Summary / Quick Pro Tip */}
            <div className="p-3 border-t border-slate-800 bg-slate-950/90 text-xs text-slate-400 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-slate-300 truncate">
                <Sparkles className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                <span className="truncate">
                  Pro Tip: Hindi, Hinglish, ya English me bina ruke normal speed me boliye.
                </span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-[11px] text-slate-500 font-mono">
                  {VOICE_COMMANDS_CATALOG.length} Ready Commands
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
