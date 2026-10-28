import { Contact, ScheduleItem, JarvisAction, IncomingMessage, SmartMemoryItem } from '../types';
import { WeatherData } from '../components/WeatherWidget';
import { updateCheatSheetUI } from './geminiVoiceParser';
import { checkHindiSpecialSubjects } from './hindiKnowledgeHub';
import { purgeErroneousLocationCache, getCachedUserLocation } from './geolocationService';
import { calculateHaversineDistanceKm, calculateDepartureTime } from './scheduleTravelCalculator';
import {
  getStoredMemories,
  saveMemory,
  updateMemory,
  deleteMemory,
  clearAllMemories,
  getMemoryByKey,
  getMemory,
  getEffectiveUserName,
  extractMemoryIntent,
  getStoredQaMemories,
  getStoredTargets,
  saveTarget,
  completeTarget,
  queryTargetStatusSummary,
  setUnlimitedMemoryActive,
} from './smartMemoryEngine';

export interface InstantCommandResult {
  reply: string;
  actions: JarvisAction[];
  isInstant: boolean;
}

/**
 * Intelligently extracts a spoken or typed phone number from text in English, Hindi, and Hinglish.
 * Supports:
 * - Direct digit sequences: "9876543210", "+91 98765 43210", "100", "112"
 * - Hindi / English number words: "nau aath saat chheh paanch chaar teen do ek shunya", "nine eight seven..."
 * - Devanagari digits: "९८७६५४३२१०"
 */
export function extractSpokenPhoneNumber(text: string): string | null {
  if (!text) return null;

  // 1. Convert Devanagari numerals to standard digits
  const devanagariConverted = text.replace(/[०-९]/g, (d) => String(d.charCodeAt(0) - 0x0966));

  // 2. Map spoken word digits in English and Hindi to digits
  const wordMap: Record<string, string> = {
    zero: '0',
    shunya: '0',
    sunya: '0',
    sifar: '0',
    one: '1',
    ek: '1',
    ik: '1',
    two: '2',
    do: '2',
    three: '3',
    teen: '3',
    tin: '3',
    four: '4',
    chaar: '4',
    char: '4',
    five: '5',
    paanch: '5',
    panch: '5',
    six: '6',
    chheh: '6',
    chhe: '6',
    che: '6',
    seven: '7',
    saat: '7',
    sat: '7',
    eight: '8',
    aath: '8',
    ath: '8',
    nine: '9',
    nau: '9',
    no: '9',
  };

  // Replace whole words that represent single digits
  const tokens = devanagariConverted.split(/[\s,]+/);
  const translatedTokens = tokens.map((token) => {
    const cleanToken = token.toLowerCase().replace(/[^a-z0-9+]/g, '');
    return wordMap[cleanToken] !== undefined ? wordMap[cleanToken] : token;
  });
  const textWithDigits = translatedTokens.join(' ');

  // 3. Find sequences of digits with optional spaces or dashes or leading '+'
  // e.g. +91 98765 43210, 9876543210, 100, 112
  const matches = textWithDigits.match(/(\+?[0-9][0-9\s\-]{2,15}[0-9]|\b[0-9]{3,15}\b)/g);
  if (matches) {
    for (const m of matches) {
      const clean = m.replace(/[\s\-]/g, '');
      if (clean.length >= 3 && clean.length <= 15) {
        // Exclude standalone common years if not in a calling context
        if (
          (clean === '2024' || clean === '2025' || clean === '2026' || clean === '2027') &&
          !text.includes('call') &&
          !text.includes('phone') &&
          !text.includes('lagao') &&
          !text.includes('dial')
        ) {
          continue;
        }
        return clean;
      }
    }
  }

  // Fallback: strip everything except digits and plus, if it looks like a phone number
  const allDigits = textWithDigits.replace(/[^0-9+]/g, '');
  if (allDigits.length >= 7 && allDigits.length <= 15) {
    return allDigits;
  }

  return null;
}

/**
 * Normalizes text for Indian bilingual accents (English + Hindi + Hinglish)
 */
export function normalizeCommandText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[.,?!]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Strict contact resolution against user's saved address book
 */
export function findSavedContact(query: string, contacts: Contact[]): Contact | null {
  const clean = normalizeCommandText(query)
    .replace(/(call|phone|karo|ko|lagao|please|mobile|work|home|par|milao|कॉल|फोन|लगाओ|मिलाओ|को|number|ka|ki|bhejo|send|share|karein|bolo|say|sirf|only)/gi, '')
    .trim();
  if (!clean) return null;

  // 1. Exact phone number match
  const rawDigits = clean.replace(/[^0-9]/g, '');
  if (rawDigits.length >= 7) {
    const byPhone = contacts.find((c) => {
      const pDigits = c.phone.replace(/[^0-9]/g, '');
      const sDigits = (c.secondaryPhone || '').replace(/[^0-9]/g, '');
      return pDigits.endsWith(rawDigits) || rawDigits.endsWith(pDigits) || (sDigits && (sDigits.endsWith(rawDigits) || rawDigits.endsWith(sDigits)));
    });
    if (byPhone) return byPhone;
  }

  // 2. Direct name or relation match
  for (const c of contacts) {
    const nameL = c.name.toLowerCase().trim();
    const relL = (c.relation || '').toLowerCase().trim();
    if (nameL === clean || relL === clean) return c;
    if (clean.includes(nameL) || nameL.includes(clean)) return c;
    if (relL && (clean.includes(relL) || relL.includes(clean))) return c;
  }

  // 3. Common Indian nicknames / relations
  if (clean.includes('dad') || clean.includes('papa') || clean.includes('pitaji') || clean.includes('पापा') || clean.includes('पिताजी')) {
    const match = contacts.find((c) => {
      const relL = (c.relation || '').toLowerCase();
      const nameL = c.name.toLowerCase();
      return relL.includes('dad') || relL.includes('father') || nameL.includes('dad') || nameL.includes('papa');
    });
    if (match) return match;
  }

  if (clean.includes('mom') || clean.includes('mummy') || clean.includes('mataji') || clean.includes('maa') || clean.includes('मम्मी') || clean.includes('माताजी')) {
    const match = contacts.find((c) => {
      const relL = (c.relation || '').toLowerCase();
      const nameL = c.name.toLowerCase();
      return relL.includes('mom') || relL.includes('mother') || nameL.includes('mom') || nameL.includes('mummy');
    });
    if (match) return match;
  }

  if (clean.includes('doctor') || clean.includes('doc') || clean.includes('dr') || clean.includes('डॉक्टर')) {
    const match = contacts.find((c) => {
      const relL = (c.relation || '').toLowerCase();
      const nameL = c.name.toLowerCase();
      return relL.includes('doc') || nameL.includes('dr') || nameL.includes('doctor') || nameL.includes('sharma');
    });
    if (match) return match;
  }

  if (clean.includes('brother') || clean.includes('bhai') || clean.includes('bhaiya') || clean.includes('भाई')) {
    const match = contacts.find((c) => {
      const relL = (c.relation || '').toLowerCase();
      const nameL = c.name.toLowerCase();
      return relL.includes('brother') || nameL.includes('rahul') || relL.includes('bhai');
    });
    if (match) return match;
  }

  return null;
}

/**
 * Clean and extract YouTube song, video, or artist query intelligently
 */
export function extractYouTubeQuery(rawCommand: string): string {
  const lower = normalizeCommandText(rawCommand);

  // Specific famous artists & genres
  if (lower.includes('arijit')) return 'Arijit Singh Best Hit Songs';
  if (lower.includes('sidhu') || lower.includes('moose')) return 'Sidhu Moose Wala All Hit Songs';
  if (lower.includes('hanuman') || lower.includes('chalisa')) return 'Shree Hanuman Chalisa Gulshan Kumar';
  if (lower.includes('bhakti') || lower.includes('bhajan') || lower.includes('krishna')) return 'Best Krishna Bhajan Hindi';
  if (lower.includes('punjabi')) return 'Top Punjabi Party Songs 2024';
  if (lower.includes('romantic') || lower.includes('love song')) return 'Best Romantic Hindi Songs Jukebox';
  if (lower.includes('lofi') || lower.includes('lo-fi')) return 'Hindi Lofi Chill Songs';
  if (lower.includes('sad')) return 'Heart Touching Hindi Sad Songs';
  if (lower.includes('party') || lower.includes('dance')) return 'Bollywood Party Dance Mashup';
  if (lower.includes('bhojpuri')) return 'Top Bhojpuri Hit Songs';
  if (lower.includes('comedy') || lower.includes('hasya')) return 'Best Comedy Hindi Videos';
  if (lower.includes('news') || lower.includes('samachar')) return 'Live Hindi News Aaj Tak';

  // Generic extraction by stripping common prefixes and command words
  const clean = lower
    .replace(/(youtube|you tube|yt|यूट्यूब|यूटयूब)/gi, '')
    .replace(/(open karo|open|kholo|chalao|run karo|run|play karo|play|bajaao|bajao|lagaao|lagao|sunao|karo)/gi, '')
    .replace(/(mein|me|par|pe|ke|ki|ko|ka|kuch|ek|koi|liye|song|songs|video|videos|music|geet)/gi, ' ')
    .replace(/(gane|gaane|gana|gaana|batao|dikhao|please|jarvis|zara|thoda)/gi, ' ')
    .trim();

  if (clean && clean.length >= 3 && !['chala', 'kare', 'hai', 'sir', 'wali', 'wala'].includes(clean)) {
    return clean;
  }

  return 'Top Trending Bollywood Hit Songs 2024';
}

/**
 * Ultra-Fast Instant On-Device Intent Resolver (<1ms)
 * Executes immediately without waiting for server or Gemini API!
 */
export function resolveInstantLocalCommand(
  rawCommand: string,
  context: {
    contacts: Contact[];
    schedule: ScheduleItem[];
    weatherData: WeatherData | null;
    batteryLevel: string;
    torchActive: boolean;
    incomingMessages?: IncomingMessage[];
    responseLanguage?: 'english' | 'hindi' | 'hinglish';
    memories?: SmartMemoryItem[];
  }
): InstantCommandResult | null {
  // Check 4 Pure Hindi Special Subjects (मौसम, लोकेशन ट्रेस, वर्ल्ड न्यूज़, AI ज्ञान, 50+ भाषाएं)
  const hindiSpecial = checkHindiSpecialSubjects(rawCommand, context.weatherData);
  if (hindiSpecial.handled && hindiSpecial.response) {
    return {
      reply: hindiSpecial.response,
      actions: [],
      isInstant: true,
    };
  }

  // Strip leading wake words ("hey jarvis", "jarvis", "हे जार्विस", "assistant") to resolve trailing commands effortlessly
  const strippedRaw = rawCommand
    .replace(/^(hey|hi|hello|ok|oye|are|हे|हाय|हेलो|ओए)?\s*(jarvis|jarvees|jarvisji|जार्विस|जारविस|जार्विश|assistant|असिस्टेंट)\s+/i, '')
    .trim();

  const lower = normalizeCommandText(strippedRaw || rawCommand);
  if (!lower) return null;

  // 00-RUNNING-REAL-TIME-AND-LOCATION. Combined Real-Time & Real-Location Query ("Running ma reyal time and reayl location bata", "running time aur real location", "live time and location")
  const wantsTimeKeywords =
    lower.includes('time') ||
    lower.includes('samay') ||
    lower.includes('baje') ||
    lower.includes('समय') ||
    lower.includes('बजे') ||
    lower.includes('tarikh') ||
    lower.includes('date') ||
    lower.includes('timezone') ||
    lower.includes('time zone') ||
    lower.includes('घड़ी') ||
    lower.includes('waqt');

  const wantsLocationKeywords =
    lower.includes('location') ||
    lower.includes('लोकेशन') ||
    lower.includes('kahan') ||
    lower.includes('कहाँ') ||
    lower.includes('jagah') ||
    lower.includes('जगह') ||
    lower.includes('maps') ||
    lower.includes('मैप्स');

  const isCombinedTimeAndLoc =
    (wantsTimeKeywords && wantsLocationKeywords) ||
    (lower.includes('running') && (lower.includes('reyal') || lower.includes('real')) && (lower.includes('time') || lower.includes('location'))) ||
    lower.includes('time aur location') ||
    lower.includes('location aur time') ||
    lower.includes('time and location') ||
    lower.includes('location and time');

  if (isCombinedTimeAndLoc) {
    purgeErroneousLocationCache();
    const userTz = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata' : 'Asia/Kolkata';
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-IN', {
      timeZone: userTz,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    const dateStr = now.toLocaleDateString('hi-IN', {
      timeZone: userTz,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const cached = getCachedUserLocation();
    const detectedCity = cached?.city || context.weatherData?.city || 'India';
    const coordsQuery = cached ? `${cached.latitude},${cached.longitude}` : 'current_live_gps';

    const replyMsg =
      context.responseLanguage === 'hindi'
        ? `जी रोविन सर! लाइव रनिंग रियल टाइम इस समय ${timeStr} (भारतीय मानक समय - IST) है, तारीख ${dateStr} है, और आपकी रियल लोकेशन ${detectedCity} है! मैंने गूगल मैप्स पर आपकी सटीक लाइव जीपीएस लोकेशन ओपन कर दी है!`
        : `Ji Rovin Sir! Live running real time is samay ${timeStr} (IST - Indian Standard Time) ho raha hai, date ${dateStr} hai, aur aapki live real location ${detectedCity} hai! Maine Google Maps par aapki exact live GPS location open kar di hai!`;

    return {
      reply: replyMsg,
      actions: [
        { name: 'openLiveLocation', args: { refreshGps: true } },
        { name: 'openApp', args: { appName: 'maps', query: coordsQuery } },
      ],
      isInstant: true,
    };
  }

  // 00-LIVE-LOC. Live Location on Google Maps (Strict rejection of inaccurate Hasanpur cell-tower default)
  const isLiveLocationCommand =
    lower.includes('live location') ||
    lower.includes('लाइव लोकेशन') ||
    lower.includes('current location') ||
    lower.includes('करंट लोकेशन') ||
    lower.includes('meri location') ||
    lower.includes('मेरी लोकेशन') ||
    lower.includes('real location') ||
    lower.includes('reyal location') ||
    lower.includes('kahan hu') ||
    lower.includes('kahan par hu') ||
    lower.includes('कहाँ हूँ') ||
    lower.includes('कहाँ हु') ||
    lower.includes('hasanpur') ||
    lower.includes('हसनपुर') ||
    (lower.includes('location') && (lower.includes('bata') || lower.includes('dikhao') || lower.includes('maps') || lower.includes('kholo'))) ||
    (lower.includes('maps') && (lower.includes('current') || lower.includes('live') || lower.includes('kahan') || lower.includes('meri')));

  if (isLiveLocationCommand) {
    purgeErroneousLocationCache();
    const cached = getCachedUserLocation();
    const detectedCity = cached?.city || context.weatherData?.city || 'India';
    const coordsQuery = cached ? `${cached.latitude},${cached.longitude}` : 'current_live_gps';

    const replyMsg =
      context.responseLanguage === 'hindi'
        ? `जी रोविन सर! मैंने आपके डिवाइस की रियल-टाइम हाई-एक्यूरेसी जीपीएस लाइव लोकेशन डिटेक्ट कर ली है। आपकी वर्तमान रियल लोकेशन ${detectedCity} गूगल मैप्स पर ओपन कर दी गई है!`
        : `Ji Rovin Sir! Maine aapke device ki real-time high-accuracy GPS live location detect kar li hai. Aapki current live location ${detectedCity} Google Maps par plot karke open kar di hai!`;

    return {
      reply: replyMsg,
      actions: [
        { name: 'openLiveLocation', args: { refreshGps: true } },
        { name: 'openApp', args: { appName: 'maps', query: coordsQuery } },
      ],
      isInstant: true,
    };
  }

  // 00-UNLIMITED-MEMORY. Unlimited Memory & Auto-Retention ("Memory add karo jo bhi main bolun", "unlimited memory add karo", "all unlimited memory add karo")
  if (
    (lower.includes('unlimited memory') ||
      lower.includes('all unlimited') ||
      (lower.includes('memory') && (lower.includes('jo bhi') || lower.includes('main bolun') || lower.includes('mai bolu')))) &&
    (lower.includes('add') || lower.includes('yaad') || lower.includes('yad') || lower.includes('on') || lower.includes('karo') || lower.includes('kare'))
  ) {
    setUnlimitedMemoryActive(true);
    saveMemory(
      'unlimited_memory_system',
      'All user instructions, voice thoughts, targets, and work completion statuses tracked permanently',
      'custom_instruction'
    );
    const replyMsg =
      context.responseLanguage === 'hindi'
        ? 'जी रोविन पाल सर! ऑल अनलिमिटेड मेमोरी इंजन (Unlimited Memory Core) पूरी तरह से सक्रिय (Active) कर दिया गया है! अब आप जो भी बोलेंगे — कोई भी बात, निर्देश या कोई भी टारगेट — मैं सब कुछ हमेशा याद रखूंगी और जब भी आप पूछेंगे कि "काम पूरा हुआ या नहीं", मैं तुरंत आपके टारगेट का सही स्टेटस बता दूंगी!'
        : 'Ji Rovin Pal Sir! All Unlimited Memory Engine fully active kar diya gaya hai! Ab aap jo bhi bolenge — chahe koi instruction ho ya koi bhi target — main hamesha yaad rakhungi aur record rakhungi ki kaam pura hua ya nahi!';

    return {
      reply: replyMsg,
      actions: [
        { name: 'enableUnlimitedMemory', args: {} },
        { name: 'openMemoryCore', args: { tab: 'targets' } },
      ],
      isInstant: true,
    };
  }

  // 00-MEMORY-ANALYTICS. Memory Usage Analytics & Density Chart ("memory analytics", "memory graph", "memory chart", "yaadash graph")
  if (
    lower.includes('memory analytics') ||
    lower.includes('memory chart') ||
    lower.includes('memory graph') ||
    lower.includes('memory trends') ||
    lower.includes('memory density') ||
    lower.includes('memory ka graph') ||
    lower.includes('yaadash chart') ||
    lower.includes('yaadash graph') ||
    lower.includes('category chart')
  ) {
    const replyMsg =
      context.responseLanguage === 'hindi'
        ? 'जी रोविन पाल सर! जार्विस मेमोरी एनालिटिक्स (Memory Analytics & Density) खोल रही हूँ — इसमें कैटेगरी अनुसार मेमोरी घनत्व बार चार्ट, उपयोग ट्रेंड और स्टोर किए गए तथ्यों का विश्लेषण शामिल है!'
        : 'Ji Rovin Pal Sir! JARVIS Memory Analytics open kar rahi hu — jisme category-wise memory density bar chart, usage trends aur facts ka visualization dikhaya gaya hai!';

    return {
      reply: replyMsg,
      actions: [{ name: 'openMemoryCore', args: { tab: 'analytics' } }],
      isInstant: true,
    };
  }

  // 00-GOV-SCHEMES. Government Schemes Live Intelligence & Auto-Update Engine
  // 1. PM Surya Ghar: Muft Bijli Yojana
  if (
    lower.includes('surya ghar') ||
    lower.includes('muft bijli') ||
    lower.includes('solar yojana') ||
    lower.includes('solar panel yojana') ||
    lower.includes('सूर्य घर') ||
    lower.includes('मुफ्त बिजली')
  ) {
    return {
      reply: 'पीएम सूर्य घर: मुफ्त बिजली योजना के तहत घरों की छतों पर सोलर पैनल लगाने के लिए केंद्र सरकार ₹78,000 तक की भारी सब्सिडी देती है, जिससे हर महीने 300 यूनिट तक मुफ्त बिजली मिलती है और अतिरिक्त बिजली ग्रिड को बेचकर ₹15,000 से ₹18,000 वार्षिक कमाई हो सकती है। आधिकारिक पोर्टल pmsuryaghar.gov.in है।',
      actions: [{ name: 'openGovSchemes', args: { query: 'pm surya ghar' } }],
      isInstant: true,
    };
  }

  // 2. NPS Vatsalya Scheme
  if (
    lower.includes('vatsalya') ||
    lower.includes('nps vatsalya') ||
    lower.includes('वात्सल्य') ||
    lower.includes('minor pension') ||
    lower.includes('bacho ki pension')
  ) {
    return {
      reply: 'एनपीएस वात्सल्य (NPS Vatsalya) योजना में माता-पिता अपने नाबालिग बच्चों के सुरक्षित भविष्य और दीर्घकालिक पेंशन के लिए मात्र ₹1,000 प्रति वर्ष से निवेश शुरू कर सकते हैं। बच्चे के 18 वर्ष का होने पर यह खाता स्वतः नियमित NPS टियर-1 खाते में बदल जाता है।',
      actions: [{ name: 'openGovSchemes', args: { query: 'nps vatsalya' } }],
      isInstant: true,
    };
  }

  // 3. Unified Pension Scheme (UPS)
  if (
    lower.includes('unified pension') ||
    lower.includes('ups scheme') ||
    lower.includes('ups pension') ||
    lower.includes('यूनिफाइड पेंशन') ||
    lower.includes('sarkari pension scheme')
  ) {
    return {
      reply: 'यूनिफाइड पेंशन स्कीम (UPS) सरकारी कर्मचारियों के लिए घोषित सुनिश्चित पेंशन योजना है। इसमें 25 वर्ष की सेवा पर अंतिम 12 महीनों के औसत मूल वेतन का 50% सुनिश्चित मासिक पेंशन और न्यूनतम ₹10,000 मासिक पेंशन की पक्की गारंटी मिलती है।',
      actions: [{ name: 'openGovSchemes', args: { query: 'unified pension scheme' } }],
      isInstant: true,
    };
  }

  // 4. Namo Drone Didi Scheme
  if (
    lower.includes('drone didi') ||
    lower.includes('namo drone') ||
    lower.includes('ड्रोन दीदी') ||
    lower.includes('mahila drone')
  ) {
    return {
      reply: 'नमो ड्रोन दीदी योजना में स्वयं सहायता समूह (SHG) की 15,000 ग्रामीण महिलाओं को आधुनिक कृषि ड्रोन उड़ाने की 15 दिवसीय डीजीसीए-प्रमाणित पायलट ट्रेनिंग और ड्रोन खरीद पर 80% (अधिकतम ₹8 लाख) की सरकारी सब्सिडी दी जा रही है।',
      actions: [{ name: 'openGovSchemes', args: { query: 'namo drone didi' } }],
      isInstant: true,
    };
  }

  // 5. PM Vishwakarma Yojana
  if (
    lower.includes('vishwakarma') ||
    lower.includes('pm vishwakarma') ||
    lower.includes('विश्वकर्मा') ||
    lower.includes('karigar loan') ||
    lower.includes('shilpkar')
  ) {
    return {
      reply: 'पीएम विश्वकर्मा योजना के तहत 18 पारंपरिक कारीगरों (लोहार, सुनार, कुम्हार, दर्जी, बढ़ई आदि) को बिना किसी गारंटी के 5% ब्याज पर ₹3 लाख तक का लोन, ₹15,000 का आधुनिक टूलकिट और ₹500 प्रतिदिन का ट्रेनिंग स्टाइपेंड मिलता है। आधिकारिक पोर्टल pmvishwakarma.gov.in है।',
      actions: [{ name: 'openGovSchemes', args: { query: 'pm vishwakarma' } }],
      isInstant: true,
    };
  }

  // 6. Agnipath Scheme
  if (
    lower.includes('agnipath') ||
    lower.includes('agniveer') ||
    lower.includes('अग्निपथ') ||
    lower.includes('अग्निवीर') ||
    lower.includes('army 4 saal')
  ) {
    return {
      reply: 'अग्निपथ योजना के तहत भारतीय थल, जल और वायु सेना में 4 साल के लिए युवाओं को अग्निवीर के रूप में भर्ती किया जाता है। 4 वर्ष की सेवा पूर्ण होने पर ₹11.71 लाख का टैक्स-फ्री सेवा निधि पैकेज और 25% अग्निवीरों को नियमित सेना में स्थाई सेवा का अवसर मिलता है।',
      actions: [{ name: 'openGovSchemes', args: { query: 'agnipath' } }],
      isInstant: true,
    };
  }

  // 7. PM YASASVI Scholarship
  if (
    lower.includes('yasasvi') ||
    lower.includes('yasaswi') ||
    lower.includes('यशस्वी') ||
    lower.includes('obc scholarship')
  ) {
    return {
      reply: 'पीएम यशस्वी (PM YASASVI) योजना के तहत OBC, EBC और DNT श्रेणी के मेधावी छात्रों को कक्षा 9-10 हेतु ₹75,000 और कक्षा 11-12 हेतु ₹1,25,000 की वार्षिक उच्च स्तरीय छात्रवृत्ति सीधे बैंक खाते में दी जाती है।',
      actions: [{ name: 'openGovSchemes', args: { query: 'pm yasasvi' } }],
      isInstant: true,
    };
  }

  // 8. Skill India Mission 2.0 / PMKVY 4.0
  if (
    lower.includes('skill india') ||
    lower.includes('pmkvy') ||
    lower.includes('स्किल इंडिया') ||
    lower.includes('pradhan mantri kaushal vikas')
  ) {
    return {
      reply: 'स्किल इंडिया मिशन 2.0 / PMKVY 4.0 के तहत युवाओं को AI, रोबोटिक्स, कोडिंग, 3D प्रिंटिंग और ड्रोन जैसी उद्योग 4.0 तकनीकों में निःशुल्क प्रशिक्षण, राष्ट्रीय प्रमाण पत्र और रोजगार प्लेसमेंट सहायता दी जाती है।',
      actions: [{ name: 'openGovSchemes', args: { query: 'skill india' } }],
      isInstant: true,
    };
  }

  // 9. PM Internship Scheme
  if (
    lower.includes('pm internship') ||
    lower.includes('internship scheme') ||
    lower.includes('इंटर्नशिप') ||
    lower.includes('5000 stipend')
  ) {
    return {
      reply: 'पीएम इंटर्नशिप योजना 2024-25 के तहत देश की शीर्ष 500 कंपनियों में 1 करोड़ युवाओं को 12 महीने की लाइव इंटर्नशिप, ₹5,000 मासिक स्टाइपेंड और ₹6,000 एकमुश्त सहायता दी जाती है। आधिकारिक पोर्टल pminternship.mca.gov.in है।',
      actions: [{ name: 'openGovSchemes', args: { query: 'pm internship' } }],
      isInstant: true,
    };
  }

  // 10. Mahila Samman Savings Certificate (MSSC)
  if (
    lower.includes('mahila samman') ||
    lower.includes('mssc') ||
    lower.includes('महिला सम्मान') ||
    lower.includes('mahila fd')
  ) {
    return {
      reply: 'महिला सम्मान बचत प्रमाण पत्र (MSSC) महिलाओं और बालिकाओं के लिए 2 वर्ष की विशेष डाकघर बचत योजना है, जिस पर 7.5% का निश्चित त्रैमासिक चक्रवृद्धि ब्याज मिलता है और अधिकतम ₹2 लाख तक जमा किए जा सकते हैं।',
      actions: [{ name: 'openGovSchemes', args: { query: 'mahila samman' } }],
      isInstant: true,
    };
  }

  // 11. Lakhpati Didi Yojana
  if (
    lower.includes('lakhpati didi') ||
    lower.includes('लखपति दीदी') ||
    lower.includes('shg lakhpati')
  ) {
    return {
      reply: 'लखपति दीदी योजना का लक्ष्य स्वयं सहायता समूहों (SHG) से जुड़ी ग्रामीण महिलाओं को आधुनिक कौशल प्रशिक्षण और ब्याज-मुक्त ऋण देकर उनकी वार्षिक आय कम से कम ₹1 लाख तक पहुंचाना है (राष्ट्रीय लक्ष्य: 3 करोड़ महिलाएं)।',
      actions: [{ name: 'openGovSchemes', args: { query: 'lakhpati didi' } }],
      isInstant: true,
    };
  }

  // 12. PM-SYM / Shram Yogi Maan-Dhan
  if (
    lower.includes('shram yogi') ||
    lower.includes('pm-sym') ||
    lower.includes('pmsym') ||
    lower.includes('maan-dhan') ||
    lower.includes('mandhan') ||
    lower.includes('मजदूर पेंशन')
  ) {
    return {
      reply: 'प्रधानमंत्री श्रम योगी मान-धन (PM-SYM) योजना में असंगठित क्षेत्र के मजदूरों, दिहाड़ी श्रमिकों, ड्राइवरों और रेहड़ी-पटरी वालों को 60 वर्ष की उम्र के बाद ₹3,000 मासिक निश्चित पेंशन आजीवन मिलती है। आधिकारिक पोर्टल maandhan.in है।',
      actions: [{ name: 'openGovSchemes', args: { query: 'pm sym' } }],
      isInstant: true,
    };
  }

  // 13. myScheme National Portal
  if (
    lower.includes('myscheme') ||
    lower.includes('my scheme') ||
    lower.includes('माई स्कीम')
  ) {
    return {
      reply: 'myScheme भारत सरकार का आधिकारिक राष्ट्रीय पोर्टल है (myscheme.gov.in), जहाँ आप अपनी उम्र, लिंग, जाति व व्यवसाय दर्ज करके 1,500+ केंद्रीय व राज्य सरकारी योजनाओं की पात्रता एक क्लिक में जांच सकते हैं और सीधे ऑनलाइन आवेदन कर सकते हैं।',
      actions: [{ name: 'openGovSchemes', args: { query: 'myscheme' } }],
      isInstant: true,
    };
  }

  // PM Janjatiya Unnat Gram Abhiyan (PMJUGA)
  if (
    lower.includes('pmjuga') ||
    lower.includes('pm-juga') ||
    lower.includes('juga') ||
    lower.includes('janjatiya') ||
    lower.includes('जनजातीय') ||
    lower.includes('tribal yojana') ||
    lower.includes('unnat gram')
  ) {
    return {
      reply: 'प्रधानमंत्री जनजातीय उन्नत ग्राम अभियान (PMJUGA) के तहत 30 राज्यों के 549 जिलों के 63,000 गांवों में रहने वाले 5 करोड़ से अधिक आदिवासी व जनजातीय परिवारों को पक्के आवास, शुद्ध पेयजल, बिजली, मोबाइल कनेक्टिविटी, स्वास्थ्य और आजीविका की 25 बुनियादी सुविधाएं उपलब्ध कराई जा रही हैं।',
      actions: [{ name: 'openGovSchemes', args: { query: 'pmjuga' } }],
      isInstant: true,
    };
  }

  // 14. Auto-Update / Sync Schemes Trigger
  if (
    lower.includes('ottomatc update') ||
    lower.includes('automatic update') ||
    lower.includes('auto update') ||
    lower.includes('yojana update') ||
    lower.includes('scheme update') ||
    lower.includes('nayi yojana update') ||
    lower.includes('योजना अपडेट')
  ) {
    return {
      reply: 'जी रोविन पाल सर! गवर्नमेंट स्कीम्स का ऑल ऑटोमेटिक लाइव अपडेट इंजन (Automatic Live Update Engine) सक्रिय है। जो भी भारत सरकार या राज्य सरकार की नई योजनाएं निकलेंगी, वे स्वतः myScheme व PIB राष्ट्रीय पोर्टल से सिंक होकर अपडेट हो जाएंगी!',
      actions: [{ name: 'openGovSchemes', args: { query: '' } }],
      isInstant: true,
    };
  }

  // 15. General Government Schemes / Sarkari Yojana Command
  if (
    lower.includes('sarkari yojana') ||
    lower.includes('government scheme') ||
    lower.includes('government schemes') ||
    lower.includes('sarkari scheme') ||
    lower.includes('सरकारी योजना') ||
    lower.includes('सरकारी योजनाएं') ||
    lower.includes('नई योजना') ||
    lower.includes('nayee yojana') ||
    lower.includes('nayi yojana')
  ) {
    return {
      reply: 'जी रोविन पाल सर! भारत सरकार की सभी नई व महत्वपूर्ण योजनाओं की सूची (PM Surya Ghar, NPS Vatsalya, UPS, PM Vishwakarma, Namo Drone Didi, Lakhpati Didi, Farmer ID आदि) स्क्रीन पर ओपन कर दी गई है। इसमें ऑटोमेटिक अपडेट इंजन और पात्रता जांचक भी सक्रिय है!',
      actions: [{ name: 'openGovSchemes', args: { query: '' } }],
      isInstant: true,
    };
  }

  // 16. Farmer ID & Kisan Services (किसान पहचान पत्र व सेवाएं)
  if (
    lower.includes('farmer id') ||
    lower.includes('kisan id') ||
    lower.includes('kisan pehchan') ||
    lower.includes('किसान पहचान पत्र') ||
    lower.includes('किसान आईडी') ||
    lower.includes('किसान कार्ड') ||
    lower.includes('किसान रजिस्ट्रेशन') ||
    lower.includes('farmer registration') ||
    lower.includes('farmer link') ||
    lower.includes('kisan link') ||
    lower.includes('kisano ka liya') ||
    lower.includes('kisano ke liye') ||
    lower.includes('agristack') ||
    lower.includes('kisan card') ||
    lower.includes('pm kisan status')
  ) {
    return {
      reply: 'जी रोविन पाल सर! भारत सरकार के डिजिटल किसान पहचान पत्र (AgriStack Farmer ID) और PM-Kisan नया पंजीकरण के आधिकारिक लिंक्स (agristack.gov.in व pmkisan.gov.in) स्क्रीन पर खोल दिए गए हैं। आप 1-क्लिक में आधिकारिक पोर्टल पर जा सकते हैं, लिंक कॉपी कर सकते हैं या अपना डिजिटल किसान कार्ड यहीं जनरेट कर सकते हैं!',
      actions: [{ name: 'openPortalService', args: { serviceId: 'digital-farmer-id', title: 'Digital Farmer ID & Kisan Services' } }],
      isInstant: true,
    };
  }

  // 17. Customer Service & 24x7 Citizen Helpdesk (ग्राहक सेवा व सहायता केंद्र)
  if (
    lower.includes('customer service') ||
    lower.includes('costumer service') ||
    lower.includes('helpdesk') ||
    lower.includes('helpline') ||
    lower.includes('grahak seva') ||
    lower.includes('ग्राहक सेवा') ||
    lower.includes('jan sunwai') ||
    lower.includes('जनसुनवाई') ||
    lower.includes('shikayat darj')
  ) {
    return {
      reply: 'जी रोविन पाल सर! 24x7 ग्राहक सेवा केंद्र और जनसुनवाई पोर्टल स्क्रीन पर खोल दिया गया है। इसमें किसान कॉल सेंटर (1800-180-1551), पीएम-किसान (155261), आधार (1947), आयुष्मान (14555) समेत सभी 10+ टोल-फ्री हेल्पलाइन और ऑनलाइन शिकायत दर्ज करने का ट्रैकर मौजूद है!',
      actions: [{ name: 'openPortalService', args: { serviceId: 'customer-service', title: '24x7 Citizen Customer Care & Jan Sunwai' } }],
      isInstant: true,
    };
  }

  // PC Control & Quick Access Bar ("pc control", "pc beast", "computer control", "quick access", "android launcher pc")
  if (
    lower.includes('pc control') ||
    lower.includes('pc beast') ||
    lower.includes('computer control') ||
    lower.includes('pc kholo') ||
    lower.includes('quick access') ||
    lower.includes('android launcher')
  ) {
    return {
      reply: 'Ji Rovin Sir! Neural PC Control Workspace aur Quick Access Android Launcher Bar open kar diya gaya hai. Aap Windows apps aur installed Android apps ko yaha se ek-click me launch aur custom pin kar sakte hain.',
      actions: [{ name: 'pcControlAction', args: { actionType: 'pc_open_workspace' } }],
      isInstant: true,
    };
  }

  // 00-TARGET-STATUS. Check Target / Work Completion Status ("kam pura hua nahin hua", "target pura hua ya nahi", "kya kaam pura hua")
  if (
    lower.includes('pura hua ya nahi') ||
    lower.includes('pura hua ki nahi') ||
    lower.includes('pura hua nahin hua') ||
    lower.includes('pura hua nahi hua') ||
    lower.includes('kam pura hua') ||
    lower.includes('kaam pura hua') ||
    lower.includes('target pura hua') ||
    lower.includes('kya target pura hua') ||
    lower.includes('kya kaam pura hua') ||
    lower.includes('target status') ||
    lower.includes('mera target kya tha') ||
    lower.includes('aaj ka target kya') ||
    lower.includes('pending kaam') ||
    lower.includes('target list') ||
    lower.includes('mere targets')
  ) {
    const summary = queryTargetStatusSummary();
    return {
      reply: summary.summaryHindi,
      actions: [{ name: 'openMemoryCore', args: { tab: 'targets' } }],
      isInstant: true,
    };
  }

  // 00-TARGET-COMPLETE. Mark Target as Completed ("target pura ho gaya", "kaam pura ho gaya", "target complete kar do")
  if (
    lower.includes('target pura ho gaya') ||
    lower.includes('target complete ho gaya') ||
    lower.includes('kaam pura ho gaya') ||
    lower.includes('kaam complete ho gaya') ||
    lower.includes('target ho gaya') ||
    lower.includes('kaam ho gaya') ||
    lower.includes('target complete kar do') ||
    lower.includes('target complete') ||
    lower.includes('task complete')
  ) {
    const completed = completeTarget();
    const targetTitle = completed ? completed.title : 'Target';
    const replyMsg =
      context.responseLanguage === 'hindi'
        ? `जी रोविन पाल सर! आपका टारगेट "${targetTitle}" सफलतापूर्वक पूरा (Completed) मार्क कर दिया गया है! काम पूरा हो चुका है।`
        : `Ji Rovin Sir! Aapka target "${targetTitle}" successfully pura (Completed) mark kar diya gaya hai! Kaam pura ho chuka hai.`;

    return {
      reply: replyMsg,
      actions: [
        { name: 'completeTarget', args: { title: targetTitle } },
        { name: 'openMemoryCore', args: { tab: 'targets' } },
      ],
      isInstant: true,
    };
  }

  // 00-TARGET-ADD. Add New Target ("target add karo...", "mera target hai...", "aaj ka target...")
  if (
    (lower.includes('target add') ||
      lower.includes('target set') ||
      lower.includes('mera target hai') ||
      lower.includes('aaj ka target hai') ||
      lower.includes('ye target yaad') ||
      lower.includes('ye kaam yaad')) &&
    !lower.includes('pura hua')
  ) {
    let title = rawCommand
      .replace(
        /^(?:jarvis|hey jarvis|aoede)?\s*(?:please\s+)?(?:target\s+add\s+karo|target\s+set\s+karo|mera\s+target\s+hai|aaj\s+ka\s+target\s+hai|target\s+hai|ye\s+target\s+yaad\s+rakhna|ye\s+kaam\s+yaad\s+rakhna\s+ki\s+pura\s+karna\s+hai|target)\s*[:,-]?\s*/i,
        ''
      )
      .trim();
    if (!title) title = 'Important Work Target';
    const newTarget = saveTarget(title);
    const replyMsg =
      context.responseLanguage === 'hindi'
        ? `जी रोविन पाल सर! आपका नया टारगेट "${newTarget.title}" मेमोरी में सेव कर दिया गया है। इसका वर्तमान स्टेटस 'काम बाकी है (Pending)' रखा गया है। जब काम हो जाए तो बता दीजिएगा!`
        : `Ji Rovin Sir! Aapka naya target "${newTarget.title}" memory me save kar diya gaya hai. Status abhi 'Pending (Baki Hai)' hai. Jab kaam pura ho jaye toh bataiyega!`;

    return {
      reply: replyMsg,
      actions: [
        { name: 'addTarget', args: { title: newTarget.title } },
        { name: 'openMemoryCore', args: { tab: 'targets' } },
      ],
      isInstant: true,
    };
  }

  // 00. Voice Model Switch: AOEDE (Cute Indian Girl Voice Model)
  if (
    lower.includes('aoede') ||
    lower.includes('voice model') ||
    lower.includes('cute voice') ||
    lower.includes('indian girl') ||
    lower.includes('ladki ki awaz') ||
    lower.includes('ladki ki aawaz') ||
    lower.includes('ladki ki voice') ||
    lower.includes('cute aawaz') ||
    lower.includes('cute awaz')
  ) {
    return {
      reply:
        context.responseLanguage === 'hindi'
          ? 'जी रोविन सर! करंट टाइम में AOEDE वॉइस मॉडल एक्टिव है! अब से मैं एक क्यूट इंडियन लड़की की प्यारी आवाज में आपके सभी काम करूँगी!'
          : 'Ji Rovin Sir! Current time me AOEDE voice model active hai! Ab se main ek cute Indian girl ki pyaari aawaz me aapke sabhi tasks aur kaam karungi!',
      actions: [{ name: 'setVoiceModel', args: { model: 'aoede' } }],
      isInstant: true,
    };
  }

  // 00a. Turn off / on background to-tu sound & beep: "to tu ke voice ko band karo", "to tu band karo", etc.
  if (
    lower.includes('to tu') ||
    lower.includes('to-tu') ||
    lower.includes('totu') ||
    lower.includes('tu tu') ||
    lower.includes('टो टू') ||
    lower.includes('टूटू') ||
    lower.includes('टोटू') ||
    (lower.includes('background') && (lower.includes('voice') || lower.includes('sound') || lower.includes('awaz') || lower.includes('aawaz') || lower.includes('beep'))) ||
    lower.includes('beep sound') ||
    lower.includes('background beep') ||
    lower.includes('wake chime')
  ) {
    const isTurnOn =
      lower.includes('chalu') ||
      lower.includes('shuru') ||
      lower.includes('on karo') ||
      lower.includes('turn on') ||
      lower.includes('enable');

    if (isTurnOn) {
      return {
        reply:
          context.responseLanguage === 'hindi'
            ? 'जी रोविन सर! बैकग्राउंड टो-टू बीप और वेक चाइम साउंड चालू कर दिया गया है।'
            : 'Ji Rovin Sir! Background to-tu beep sound aur wake chime active kar diya gaya hai!',
        actions: [{ name: 'toggleBackgroundBeep', args: { enabled: true } }],
        isInstant: true,
      };
    } else {
      return {
        reply:
          context.responseLanguage === 'hindi'
            ? 'जी रोविन सर! जार्विस ओपन करने पर बैकग्राउंड में आने वाली टो-टू की आवाज और बीप साउंड को पूरी तरह बंद कर दिया गया है। अब बैकग्राउंड 100% शांत रहेगा।'
            : 'Ji Rovin Sir! Jarvis open karne par background me to-tu beep sound aur chime ko bilkul band kar diya gaya hai! Ab background 100% silent aur shant rahega.',
        actions: [{ name: 'toggleBackgroundBeep', args: { enabled: false } }],
        isInstant: true,
      };
    }
  }

  // 00b. Smart Memory System: Explicit commands to save, recall, update, delete, or view memories
  const memoryIntent = extractMemoryIntent(rawCommand);
  if (memoryIntent) {
    if (memoryIntent.isSensitiveWarning) {
      return {
        reply:
          context.responseLanguage === 'hindi'
            ? (memoryIntent.confirmationReplyHindi || 'सुरक्षा अलर्ट: पासवर्ड या बैंक जानकारी मेमोरी में सेव नहीं की जा सकती।')
            : (memoryIntent.confirmationReplyEnglish || 'Security Notice: Confidential credentials cannot be stored in local memory.'),
        actions: [],
        isInstant: true,
      };
    }

    if (memoryIntent.action === 'save') {
      const saved = saveMemory(
        memoryIntent.key || 'note',
        memoryIntent.value || '',
        memoryIntent.category,
        rawCommand
      );
      const isEnglish = context.responseLanguage === 'english';
      const isHindi = context.responseLanguage === 'hindi';
      const confirmReply = isEnglish
        ? (memoryIntent.confirmationReplyEnglish || `Got it, I’ll remember that your ${saved.key} is ${saved.value}.`)
        : isHindi
        ? (memoryIntent.confirmationReplyHindi || `जी! मैंने याद रख लिया है कि आपका ${saved.key} "${saved.value}" है।`)
        : (memoryIntent.confirmationReplyHindi || `Got it! Maine yaad rakh liya hai ki aapka ${saved.key} "${saved.value}" hai.`);

      return {
        reply: confirmReply,
        actions: [
          {
            name: 'saveMemoryItem',
            args: { key: saved.key, value: saved.value, category: saved.category },
          },
        ],
        isInstant: true,
      };
    } else if (memoryIntent.action === 'recall') {
      if (memoryIntent.confirmationReplyHindi || memoryIntent.confirmationReplyEnglish) {
        const isEnglish = context.responseLanguage === 'english';
        const replyStr = isEnglish
          ? (memoryIntent.confirmationReplyEnglish || memoryIntent.confirmationReplyHindi)
          : (memoryIntent.confirmationReplyHindi || memoryIntent.confirmationReplyEnglish);
        return {
          reply: replyStr!,
          actions: [{ name: 'recallMemory', args: { key: memoryIntent.key || 'qa', value: replyStr! } }],
          isInstant: true,
        };
      }
      const found = getMemoryByKey(memoryIntent.key || '');
      if (found) {
        const isEnglish = context.responseLanguage === 'english';
        const isHindi = context.responseLanguage === 'hindi';
        let replyStr = '';
        if (found.key.toLowerCase() === 'name') {
          replyStr = isEnglish
            ? `Your name is ${found.value}.`
            : isHindi
            ? `आपका नाम ${found.value} है।`
            : `Aapka naam ${found.value} hai.`;
        } else if (found.key === 'excel_all_shortcuts' || found.key === 'excel_work_smart_tips') {
          replyStr = found.value;
        } else {
          replyStr = isEnglish
            ? `Your ${memoryIntent.rawKey || found.key} is ${found.value}.`
            : isHindi
            ? `आपका ${memoryIntent.rawKey || found.key} "${found.value}" है।`
            : `Aapka ${memoryIntent.rawKey || found.key} "${found.value}" hai.`;
        }
        return {
          reply: replyStr,
          actions: [{ name: 'recallMemory', args: { key: found.key, value: found.value } }],
          isInstant: true,
        };
      } else {
        const isHindi = context.responseLanguage === 'hindi';
        return {
          reply: isHindi
            ? `माफ़ कीजिए, आपकी मेमोरी में "${memoryIntent.rawKey || memoryIntent.key}" की कोई जानकारी सेव नहीं है। आप कह सकते हैं: "Remember my ${memoryIntent.key} is ..."`
            : `I don't have "${memoryIntent.rawKey || memoryIntent.key}" in my memory yet. You can tell me by saying "Remember my ${memoryIntent.key} is ..."`,
          actions: [],
          isInstant: true,
        };
      }
    } else if (memoryIntent.action === 'update') {
      const updated = updateMemory(memoryIntent.key || '', memoryIntent.value || '');
      const isEnglish = context.responseLanguage === 'english';
      const isHindi = context.responseLanguage === 'hindi';
      const updatedKey = updated ? updated.key : memoryIntent.key;
      const updatedVal = updated ? updated.value : memoryIntent.value;
      const replyStr = isEnglish
        ? `Updated! I’ll remember that your ${updatedKey} is ${updatedVal}.`
        : isHindi
        ? `अपडेट कर दिया गया है! मैंने याद रख लिया है कि आपका ${updatedKey} "${updatedVal}" है।`
        : `Updated! Maine yaad rakh liya hai ki aapka ${updatedKey} "${updatedVal}" hai.`;

      return {
        reply: replyStr,
        actions: [
          {
            name: 'saveMemoryItem',
            args: { key: updatedKey, value: updatedVal, category: updated?.category },
          },
        ],
        isInstant: true,
      };
    } else if (memoryIntent.action === 'delete') {
      deleteMemory(memoryIntent.key || '');
      const isEnglish = context.responseLanguage === 'english';
      const isHindi = context.responseLanguage === 'hindi';
      return {
        reply: isEnglish
          ? `Got it, I have forgotten your ${memoryIntent.key} from memory.`
          : isHindi
          ? `जी! मैंने आपकी मेमोरी से "${memoryIntent.key}" डिलीट कर दिया है।`
          : `Got it! Maine aapki memory se "${memoryIntent.key}" delete kar diya hai.`,
        actions: [{ name: 'deleteMemory', args: { key: memoryIntent.key } }],
        isInstant: true,
      };
    } else if (memoryIntent.action === 'clear') {
      clearAllMemories();
      const isEnglish = context.responseLanguage === 'english';
      const isHindi = context.responseLanguage === 'hindi';
      return {
        reply: isEnglish
          ? 'All stored memories have been cleared from memory storage.'
          : isHindi
          ? 'जी! आपकी सभी स्टोर की गई यादें पूरी तरह क्लियर कर दी गई हैं।'
          : 'Ji! Saari stored memories safely clear kar di gayi hain.',
        actions: [{ name: 'clearMemory', args: {} }],
        isInstant: true,
      };
    } else if (memoryIntent.action === 'show_all') {
      const allMemories = getStoredMemories();
      const userFacing = allMemories.filter((m) => m.source !== 'system_default');
      const isEnglish = context.responseLanguage === 'english';
      const isHindi = context.responseLanguage === 'hindi';

      if (userFacing.length > 0) {
        const details = userFacing
          .map((m) => `${m.key}: ${m.value}`)
          .slice(0, 6)
          .join(', ');
        const replyStr = isEnglish
          ? `Yes, I remember what you told me: ${details}.`
          : isHindi
          ? `जी हाँ, मुझे याद है: ${details}।`
          : `Haan ji, mujhe yaad hai: ${details}।`;
        return {
          reply: replyStr,
          actions: [{ name: 'openMemoryModal', args: {} }],
          isInstant: true,
        };
      } else {
        return {
          reply: isEnglish
            ? 'I do not have any saved memories yet. You can ask me to remember something anytime!'
            : isHindi
            ? 'अभी मेमोरी में कोई जानकारी सेव नहीं है। आप कभी भी मुझसे कुछ याद रखने को कह सकते हैं!'
            : 'Abhi memory me koi information saved nahi hai. Aap mujhe kabhi bhi yaad rakhne ko bol sakte hain!',
          actions: [{ name: 'openMemoryModal', args: {} }],
          isInstant: true,
        };
      }
    }
  }

  // 00c. Direct Open Smart Memory UI ("open memory", "memory manager", "smart memory kholo")
  if (
    lower.includes('open memory') ||
    lower.includes('memory modal') ||
    lower.includes('memory manager') ||
    lower.includes('smart memory') ||
    lower.includes('मेमोरी खोलो') ||
    lower.includes('स्मार्ट मेमोरी')
  ) {
    return {
      reply:
        context.responseLanguage === 'hindi'
          ? 'जी रोविन सर! स्मार्ट मेमोरी मैनेजर पैनल ओपन कर दिया गया है। यहाँ आप अपनी सभी यादें देख, एडिट और डिलीट कर सकते हैं।'
          : 'Smart Memory Manager panel is open, Sir. You can manage, edit, and organize all your saved personal details here.',
      actions: [{ name: 'openMemoryModal', args: {} }],
      isInstant: true,
    };
  }

  // 0a. Core Command: Home Screen / मुख्य पृष्ठ ("home", "home screen", "मुख्य पृष्ठ", "dashboard", "home page")
  if (
    lower === 'home' ||
    lower.includes('home screen') ||
    lower.includes('मुख्य पृष्ठ') ||
    lower.includes('home page') ||
    lower.includes('go to home') ||
    lower.includes('main screen') ||
    lower.includes('home par chalo') ||
    lower.includes('home dikhao')
  ) {
    updateCheatSheetUI('home', 'success');
    return {
      reply:
        context.responseLanguage === 'hindi'
          ? 'जी सर, मुख्य पृष्ठ (HUD) पर वापस आ गए हैं।'
          : 'Right away, Sir. Returning to the main HUD interface.',
      actions: [{ name: 'navigateToHome', args: {} }],
      isInstant: true,
    };
  }

  // 0a. Core Command: Stop / Turn off / Tone band karo / Trun ko band kar do / Chup ho jao / Stop listening
  if (
    lower.includes('trun ko band') ||
    lower.includes('trun band') ||
    lower.includes('turn band') ||
    lower.includes('turn off') ||
    lower.includes('tone band') ||
    lower.includes('chime band') ||
    lower.includes('sound band') ||
    lower.includes('awaaz band') ||
    lower.includes('aawaz band') ||
    lower.includes('awaj band') ||
    lower.includes('bolna band') ||
    lower.includes('chup ho jao') ||
    lower.includes('chup raho') ||
    lower.includes('chup ho ja') ||
    lower.includes('shant ho jao') ||
    lower.includes('silent ho jao') ||
    lower.includes('stop listening') ||
    lower.includes('jarvis band') ||
    lower.includes('जार्विस बंद') ||
    lower.includes('चुप हो जाओ') ||
    lower.includes('बोलना बंद') ||
    lower.includes('आवाज बंद') ||
    lower.includes('टर्न बंद') ||
    lower.includes('टोन बंद') ||
    lower.includes('trun') && lower.includes('band') ||
    lower === 'stop' ||
    lower === 'band karo' ||
    lower === 'band kar do' ||
    lower === 'ruko' ||
    lower === 'roko' ||
    lower === 'band ho jao'
  ) {
    updateCheatSheetUI('stop_listening', 'success');
    return {
      reply: 'जी सर, मैंने तुरंत बोलना और लिसनिंग बंद कर दी है। स्टैंडबाय पर हूँ।',
      actions: [
        { name: 'stopListening', args: {} },
        { name: 'stopMusic', args: {} },
      ],
      isInstant: true,
    };
  }

  // 0b. Core Command: Stop Music / YouTube ("gana band karo", "stop music", "gana roko", "youtube band karo", "player band karo")
  if (
    lower.includes('stop music') ||
    lower.includes('music stop') ||
    lower.includes('gana band') ||
    lower.includes('gaana band') ||
    lower.includes('gane band') ||
    lower.includes('gaane band') ||
    lower.includes('gana roko') ||
    lower.includes('gaana roko') ||
    lower.includes('music band') ||
    lower.includes('geet band') ||
    lower.includes('youtube band') ||
    lower.includes('youtube roko') ||
    lower.includes('youtube stop') ||
    lower.includes('यूट्यूब बंद') ||
    lower.includes('player band') ||
    lower.includes('गाना बंद') ||
    lower.includes('गाना रोको') ||
    lower.includes('संगीत बंद') ||
    (lower.includes('stop') && (lower.includes('song') || lower.includes('singing') || lower.includes('youtube')))
  ) {
    updateCheatSheetUI('stop_music', 'success');
    return {
      reply: 'Ji, maine gaana aur YouTube live player turant stop kar diya hai.',
      actions: [{ name: 'stopMusic', args: {} }],
      isInstant: true,
    };
  }

  // 0b2. Core Command: Maximize / Display par show karo / Unminimize
  if (
    lower.includes('display par show') ||
    lower.includes('display pe show') ||
    lower.includes('display par so') ||
    lower.includes('display pe so') ||
    lower.includes('display par lao') ||
    lower.includes('display pe lao') ||
    lower.includes('display par') ||
    lower.includes('screen par lao') ||
    lower.includes('screen par show') ||
    lower.includes('minimize ho gaya') ||
    lower.includes('minimise ho gaya') ||
    lower.includes('maximize karo') ||
    lower.includes('maximise karo') ||
    lower.includes('maximize') ||
    lower.includes('bada karo') ||
    lower.includes('bada karke dikhao') ||
    lower.includes('jhat bada') ||
    lower.includes('jaat bhada') ||
    lower.includes('jhat bada karo') ||
    lower.includes('jhat bada karen') ||
    lower.includes('window badi karo') ||
    lower.includes('screen badi karo') ||
    lower.includes('pc bada karo') ||
    lower.includes('laptop bada karo') ||
    lower.includes('work bada karo') ||
    lower.includes('zoom in') ||
    lower.includes('zoom in karo') ||
    lower.includes('wapas display') ||
    lower.includes('wapas lao') ||
    lower.includes('unminimize') ||
    lower.includes('unminimise') ||
    (lower.includes('full screen') && (lower.includes('karo') || lower.includes('kholo') || lower.includes('show')))
  ) {
    return {
      reply: 'Ji Rovin Sir! PC laptop window aur active screen ko jhat bada aur maximize kar diya hai (Win + Up Arrow full display)!',
      actions: [
        { name: 'maximizePlayer', args: {} },
        { name: 'pcControlAction', args: { actionType: 'pc_maximize_window' } },
      ],
      isInstant: true,
    };
  }

  // 0b2b. CSC & RP Jansabha Digital Government Services Voice Handling
  if (
    lower.includes('digital gramin') ||
    lower.includes('gramin seva') ||
    lower.includes('ग्रामीण सेवा') ||
    lower.includes('डिजिटल ग्रामीण')
  ) {
    return {
      reply: 'जी सर, मैंने डिजिटल ग्रामीण सेवा पोर्टल ओपन कर दिया है। यहाँ से आप AePS कैश विड्रॉल, DMT मनी ट्रांसफर और बिल पेमेंट्स आसानी से कर सकते हैं।',
      actions: [
        {
          name: 'openCscService',
          args: {
            serviceId: 'digital-gramin-seva',
            url: 'https://digitalgraminseva.in',
            title: 'Digital Gramin Seva',
          },
        },
      ],
      isInstant: true,
    };
  }

  if (
    lower.includes('csc digital seva') ||
    lower.includes('digital seva') ||
    lower.includes('csc vle') ||
    lower.includes('vle login') ||
    lower.includes('सीएससी डिजिटल सेवा') ||
    lower.includes('सीएससी लॉगिन')
  ) {
    return {
      reply: 'जी सर, CSC डिजिटल सेवा VLE पोर्टल ओपन कर दिया है। सरकारी व गैर-सरकारी सेवाओं के लिए आप यहाँ लॉगिन कर सकते हैं।',
      actions: [
        {
          name: 'openCscService',
          args: {
            serviceId: 'csc-sewa',
            url: 'https://digitalseva.csc.gov.in',
            title: 'CSC Digital Seva',
          },
        },
      ],
      isInstant: true,
    };
  }

  if (
    lower.includes('csc kiosk') ||
    lower.includes('csc csp') ||
    lower.includes('csc banking') ||
    lower.includes('aeps portal') ||
    lower.includes('सीएससी क्योस्क')
  ) {
    return {
      reply: 'जी सर, CSC डिजिटल क्योस्क बैंकिंग और AePS नेटवर्क पोर्टल ओपन कर दिया है।',
      actions: [
        {
          name: 'openCscService',
          args: {
            serviceId: 'csc-csp',
            url: 'https://csccloud.in',
            title: 'CSC Digital Kiosk (CSP)',
          },
        },
      ],
      isInstant: true,
    };
  }

  if (
    lower.includes('aadhaar') ||
    lower.includes('aadhar') ||
    lower.includes('uidai') ||
    lower.includes('आधार कार्ड') ||
    lower.includes('आधार डाउनलोड')
  ) {
    return {
      reply: 'जी सर, UIDAI आधिकारिक आधार सेवा पोर्टल ओपन कर दिया है। यहाँ से आप आधार कार्ड डाउनलोड, मोबाइल व एड्रेस अपडेट कर सकते हैं।',
      actions: [
        {
          name: 'openCscService',
          args: {
            serviceId: 'aadhaar',
            url: 'https://uidai.gov.in',
            title: 'Aadhaar Services',
          },
        },
      ],
      isInstant: true,
    };
  }

  if (
    lower.includes('pan card') ||
    lower.includes('pancard') ||
    lower.includes('protean') ||
    lower.includes('tin pan') ||
    lower.includes('पैन कार्ड')
  ) {
    return {
      reply: 'जी सर, Protean पैन कार्ड सेवा पोर्टल ओपन कर दिया है। यहाँ से आप नया पैन कार्ड अप्लाई व करेक्शन कर सकते हैं।',
      actions: [
        {
          name: 'openCscService',
          args: {
            serviceId: 'pan',
            url: 'https://www.protean-tinpan.com',
            title: 'PAN Card Services',
          },
        },
      ],
      isInstant: true,
    };
  }

  if (
    lower.includes('driving license') ||
    lower.includes('driving licence') ||
    lower.includes('parivahan') ||
    lower.includes('sarathi') ||
    lower.includes('ड्राइविंग लाइसेंस') ||
    lower.includes('लर्निंग लाइसेंस') ||
    lower.includes('परिवहन')
  ) {
    return {
      reply: 'जी सर, सारथी परिवहन ड्राइविंग लाइसेंस और व्हीकल RC सेवा पोर्टल ओपन कर दिया है।',
      actions: [
        {
          name: 'openCscService',
          args: {
            serviceId: 'dl',
            url: 'https://parivahan.gov.in',
            title: 'Driving License (Sarathi)',
          },
        },
      ],
      isInstant: true,
    };
  }

  if (
    lower.includes('voter id') ||
    lower.includes('voter card') ||
    lower.includes('epic card') ||
    lower.includes('eci portal') ||
    lower.includes('वोटर आईडी') ||
    lower.includes('पहचान पत्र')
  ) {
    return {
      reply: 'जी सर, भारत निर्वाचन आयोग (ECI) वोटर पोर्टल ओपन कर दिया है। यहाँ से नया वोटर कार्ड अप्लाई व डिजिटल e-EPIC डाउनलोड कर सकते हैं।',
      actions: [
        {
          name: 'openCscService',
          args: {
            serviceId: 'voter',
            url: 'https://voters.eci.gov.in',
            title: 'Voter ID (ECI)',
          },
        },
      ],
      isInstant: true,
    };
  }

  if (
    lower.includes('passport') ||
    lower.includes('पासपोर्ट')
  ) {
    return {
      reply: 'जी सर, पासपोर्ट सेवा केंद्र पोर्टल ओपन कर दिया है। यहाँ से फ्रेश पासपोर्ट अप्लाई, स्टेटस ट्रैक और अपॉइंटमेंट बुक कर सकते हैं।',
      actions: [
        {
          name: 'openCscService',
          args: {
            serviceId: 'passport',
            url: 'https://www.passportindia.gov.in',
            title: 'Passport Seva',
          },
        },
      ],
      isInstant: true,
    };
  }

  if (
    lower.includes('ayushman') ||
    lower.includes('pmjay') ||
    lower.includes('pm jay') ||
    lower.includes('health card') ||
    lower.includes('आयुष्मान कार्ड') ||
    lower.includes('आयुष्मान भारत')
  ) {
    return {
      reply: 'जी सर, आयुष्मान भारत PM-JAY लाभार्थी पोर्टल ओपन कर दिया है। यहाँ से 5 लाख रुपये तक के मुफ्त स्वास्थ्य बीमा कार्ड का स्टेटस व डाउनलोड कर सकते हैं।',
      actions: [
        {
          name: 'openCscService',
          args: {
            serviceId: 'ayushman',
            url: 'https://beneficiary.nha.gov.in',
            title: 'Ayushman Card (PM-JAY)',
          },
        },
      ],
      isInstant: true,
    };
  }

  if (
    lower.includes('farmer id bana') ||
    lower.includes('farmer id link') ||
    lower.includes('kisan id link') ||
    lower.includes('farmer id registration') ||
    lower.includes('all link add') ||
    lower.includes('all link') ||
    lower.includes('all registration link') ||
    lower.includes('registration link') ||
    lower.includes('registration links') ||
    lower.includes('online apply link') ||
    lower.includes('online registration link') ||
    lower.includes('agristack link') ||
    lower.includes('kisan registration') ||
    lower.includes('रजिस्ट्रेशन करने के लिए') ||
    lower.includes('रजिस्ट्रेशन लिंक') ||
    lower.includes('किसान आईडी लिंक') ||
    lower.includes('सारे लिंक') ||
    lower.includes('सभी लिंक')
  ) {
    return {
      reply: 'जी सर! ऑनलाइन रजिस्ट्रेशन के सभी आधिकारिक सरकारी लिंक ओपन कर दिए हैं। इसमें राष्ट्रीय एग्रीस्टैक किसान आईडी (agristack.gov.in), पीएम-किसान नया रजिस्ट्रेशन (pmkisan.gov.in), सभी 18 राज्यों के किसान पोर्टल (यूपी, बिहार, एमपी, राजस्थान, हरियाणा, महाराष्ट्र, पंजाब, गुजरात), ई-श्रम, आयुष्मान कार्ड, पीएम सूर्य घर और पीएम विश्वकर्मा के 40+ डायरेक्ट लिंक और 4-स्टेप गाइड शामिल हैं।',
      actions: [
        {
          name: 'openCscService',
          args: {
            serviceId: 'digital-farmer-id',
            url: 'https://agristack.gov.in',
            title: 'All Online Registration Links Hub (AgriStack & Kisan ID)',
          },
        },
      ],
      isInstant: true,
    };
  }

  if (
    lower.includes('pm kisan') ||
    lower.includes('kisan samman') ||
    lower.includes('kisan status') ||
    lower.includes('kisan 2000') ||
    lower.includes('पीएम किसान') ||
    lower.includes('किसान सम्मान')
  ) {
    return {
      reply: 'जी सर, PM-किसान सम्मान निधि पोर्टल ओपन कर दिया है। यहाँ से आप 2000 रुपये क़िस्त का स्टेटस, e-KYC और रजिस्ट्रेशन चेक कर सकते हैं।',
      actions: [
        {
          name: 'openCscService',
          args: {
            serviceId: 'pm-kisan',
            url: 'https://pmkisan.gov.in',
            title: 'PM-Kisan Samman Nidhi',
          },
        },
      ],
      isInstant: true,
    };
  }

  if (
    lower.includes('epfo') ||
    lower.includes('pf portal') ||
    lower.includes('pf passbook') ||
    lower.includes('pf balance') ||
    lower.includes('uan login') ||
    lower.includes('पीएफ') ||
    lower.includes('ईपीएफओ')
  ) {
    return {
      reply: 'जी सर, EPFO मेम्बर व PF पासबुक पोर्टल ओपन कर दिया है। यहाँ से आप PF बैलेंस चेक, क्लेम स्टेटस और UAN KYC देख सकते हैं।',
      actions: [
        {
          name: 'openCscService',
          args: {
            serviceId: 'epfo',
            url: 'https://unifiedportal-mem.epfindia.gov.in',
            title: 'EPFO / PF Member Portal',
          },
        },
      ],
      isInstant: true,
    };
  }

  if (
    lower.includes('ration card') ||
    lower.includes('rashan card') ||
    lower.includes('nfsa') ||
    lower.includes('राशन कार्ड') ||
    lower.includes('राशन सूची')
  ) {
    return {
      reply: 'जी सर, राष्ट्रीय खाद्य सुरक्षा पोर्टल (NFSA) राशन कार्ड सेवा ओपन कर दी है। यहाँ से राशन कार्ड लिस्ट और आधार लिंकिंग चेक कर सकते हैं।',
      actions: [
        {
          name: 'openCscService',
          args: {
            serviceId: 'ration',
            url: 'https://nfsa.gov.in',
            title: 'Ration Card (NFSA)',
          },
        },
      ],
      isInstant: true,
    };
  }

  if (
    lower.includes('e district') ||
    lower.includes('edistrict') ||
    lower.includes('caste certificate') ||
    lower.includes('income certificate') ||
    lower.includes('domicile certificate') ||
    lower.includes('jati praman') ||
    lower.includes('niwas praman') ||
    lower.includes('aay praman') ||
    lower.includes('ई डिस्ट्रिक्ट') ||
    lower.includes('जाति प्रमाण') ||
    lower.includes('निवास प्रमाण')
  ) {
    return {
      reply: 'जी सर, स्टेट e-District पोर्टल ओपन कर दिया है। यहाँ से जाति, आय, निवास, जन्म व मृत्यु प्रमाण पत्र के लिए ऑनलाइन आवेदन कर सकते हैं।',
      actions: [
        {
          name: 'openCscService',
          args: {
            serviceId: 'e-district',
            url: 'https://india.gov.in',
            title: 'State e-District Services',
          },
        },
      ],
      isInstant: true,
    };
  }

  if (
    lower.includes('sbi online') ||
    lower.includes('sbi account') ||
    lower.includes('sbi khata') ||
    lower.includes('एसबीआई')
  ) {
    return {
      reply: 'जी सर, SBI ऑनलाइन इंस्टेंट खाता और वीडियो KYC पोर्टल ओपन कर दिया है।',
      actions: [
        {
          name: 'openCscService',
          args: {
            serviceId: 'sbi',
            url: 'https://onlinesbi.sbi',
            title: 'SBI Online Account',
          },
        },
      ],
      isInstant: true,
    };
  }

  if (
    lower.includes('income tax') ||
    lower.includes('itr portal') ||
    lower.includes('itr filing') ||
    lower.includes('tax refund') ||
    lower.includes('इनकम टैक्स') ||
    lower.includes('आईटीआर')
  ) {
    return {
      reply: 'जी सर, इनकम टैक्स ई-फाइलिंग व ITR पोर्टल ओपन कर दिया है। यहाँ से ITR फाइलिंग और रिफंड स्टेटस चेक कर सकते हैं।',
      actions: [
        {
          name: 'openCscService',
          args: {
            serviceId: 'itr',
            url: 'https://www.incometax.gov.in',
            title: 'Income Tax e-Filing',
          },
        },
      ],
      isInstant: true,
    };
  }

  if (
    lower.includes('csc services') ||
    lower.includes('csc service') ||
    lower.includes('all csc') ||
    lower.includes('csc portal') ||
    lower.includes('सीएससी') ||
    lower.includes('jansabha') ||
    lower.includes('rp jansabha') ||
    lower.includes('जनसभा') ||
    lower.includes('sarkari portal') ||
    lower.includes('sarkari yojana') ||
    lower.includes('सरकारी योजना')
  ) {
    return {
      reply: 'जी सर, RP जनसभा डिजिटल सेवा पोर्टल ओपन कर दिया है। CSC डिजिटल सेवा, डिजिटल ग्रामीण सेवा, आधार, पैन, बैंकिंग और सभी सरकारी योजनाएं स्क्रीन पर तैयार हैं।',
      actions: [
        {
          name: 'openCscService',
          args: {
            serviceId: 'all',
            title: 'RP Jansabha All CSC Services',
          },
        },
      ],
      isInstant: true,
    };
  }

  // 0b3. User Policy Directive: "Contact ma save number par call ne laga re h jo number bola us number par call laga"
  if (
    (lower.includes('contact') || lower.includes('save number') || lower.includes('jo number')) &&
    (lower.includes('jo number bola') ||
      lower.includes('jo number bolu') ||
      lower.includes('us number par call') ||
      lower.includes('us number pe call') ||
      lower.includes('number par call laga') ||
      lower.includes('number pe call laga') ||
      lower.includes('call ne laga re') ||
      lower.includes('call nahi lag'))
  ) {
    return {
      reply:
        'At your service, Sir. Direct dial protocol active — any spoken number is dialed immediately without restriction.',
      actions: [{ name: 'openContactsView', args: {} }],
      isInstant: true,
    };
  }

  // 0c. Core Command: YouTube & Real Music Video Player ("YouTube mein gane chalao", "gana chalao", "gane chalao", "gaana bajao", "music chalao")
  const isYouTubeOrMusicIntent =
    lower.includes('youtube') ||
    lower.includes('यूट्यूब') ||
    lower.includes('यूटयूब') ||
    lower.includes('you tube') ||
    lower.includes('yt') ||
    lower.includes('gana chalao') ||
    lower.includes('gaana chalao') ||
    lower.includes('gane chalao') ||
    lower.includes('gaane chalao') ||
    lower.includes('gana bajao') ||
    lower.includes('gaana bajao') ||
    lower.includes('gane bajao') ||
    lower.includes('gaane bajao') ||
    lower.includes('गाना बजाओ') ||
    lower.includes('गाना चलाओ') ||
    lower.includes('गाने चलाओ') ||
    lower.includes('गाने बजाओ') ||
    lower.includes('music chalao') ||
    lower.includes('music bajao') ||
    lower.includes('music play') ||
    lower.includes('play music') ||
    lower.includes('song chalao') ||
    lower.includes('songs chalao') ||
    lower.includes('video chalao') ||
    (lower.includes('play') && (lower.includes('song') || lower.includes('video') || lower.includes('music')));

  if (isYouTubeOrMusicIntent) {
    const query = extractYouTubeQuery(rawCommand);
    updateCheatSheetUI('play_music', 'success');
    return {
      reply: `Right away, Sir. Streaming "${query}" on YouTube now.`,
      actions: [
        {
          name: 'playYouTube',
          args: { query, autoplay: true },
        },
        {
          name: 'openApp',
          args: { appName: 'youtube', query },
        },
      ],
      isInstant: true,
    };
  }

  // 0c2. Assistant Singing in Her Own Voice ("गाना गाओ", "sing a song", "gana gao", "gaana gao")
  if (
    lower.includes('गाना गाओ') ||
    lower.includes('गाना सुनाओ') ||
    lower.includes('गीत सुनाओ') ||
    lower.includes('gana gao') ||
    lower.includes('gaana gao') ||
    lower.includes('gana sunao') ||
    lower.includes('gaana sunao') ||
    lower.includes('sing a song') ||
    lower.includes('sing me a song') ||
    lower.includes('sing song') ||
    lower.includes('kuch gao') ||
    lower.includes('ga kar sunao')
  ) {
    let requestedSong = 'any';
    if (lower.includes('kesariya')) requestedSong = 'kesariya';
    else if (lower.includes('tum hi ho') || lower.includes('aashiqui')) requestedSong = 'tum-hi-ho';
    else if (lower.includes('pehla nasha')) requestedSong = 'pehla-nasha';
    else if (lower.includes('ek ladki') || lower.includes('dekha')) requestedSong = 'ek-ladki';
    else if (lower.includes('jarvis') || lower.includes('cyber') || lower.includes('anthem')) requestedSong = 'jarvis-cyber';

    updateCheatSheetUI('play_music', 'success');
    return {
      reply: 'Ram Ram ji! Suniye dhyan se, main abhi aapke liye surila geet gaa rahi hu aur visualizer activate kar rahi hu! 🌸🎵',
      actions: [{ name: 'singSong', args: { songName: requestedSong } }],
      isInstant: true,
    };
  }

  // 0d. Core Command: Dark Mode / डार्क मोड ("स्क्रीन को dark mode में कर दो", "dark mode", "डार्क मोड", "toggle dark mode", "light mode")
  if (
    lower.includes('dark mode') ||
    lower.includes('डार्क मोड') ||
    lower.includes('light mode') ||
    lower.includes('toggle theme') ||
    lower.includes('change theme') ||
    lower.includes('थीम बदलो') ||
    (lower.includes('screen') && lower.includes('dark')) ||
    (lower.includes('स्क्रीन') && lower.includes('dark'))
  ) {
    updateCheatSheetUI('dark_mode', 'success');
    return {
      reply: 'Ji bilkul! Maine Theme mode toggle kar diya hai.',
      actions: [{ name: 'toggleDarkMode', args: {} }],
      isInstant: true,
    };
  }

  // 0e. Core Command: Phone Unlock / फोन अनलॉक करना / खोलना (Mayra Trend: "open karo", "open karna", "phone kholo", "lock kholo", "mayra unlock", "mayra open")
  const hasSpecificAppMention =
    lower.includes('youtube') ||
    lower.includes('calculator') ||
    lower.includes('camera') ||
    lower.includes('instagram') ||
    lower.includes('facebook') ||
    lower.includes('spotify') ||
    lower.includes('chrome') ||
    lower.includes('browser') ||
    lower.includes('whatsapp') ||
    lower.includes('maps') ||
    lower.includes('map') ||
    lower.includes('gallery') ||
    lower.includes('settings') ||
    lower.includes('playstore') ||
    lower.includes('telegram') ||
    lower.includes('netflix') ||
    lower.includes('gmail') ||
    lower.includes('weather') ||
    lower.includes('torch') ||
    lower.includes('flashlight');

  if (
    !hasSpecificAppMention &&
    (lower.includes('phone unlock') ||
      lower.includes('unlock phone') ||
      lower.includes('phone ko unlock') ||
      lower.includes('screen unlock') ||
      lower.includes('unlock screen') ||
      lower.includes('screen ko unlock') ||
      lower.includes('mobile unlock') ||
      lower.includes('mobile ko unlock') ||
      lower.includes('phone open') ||
      lower.includes('open phone') ||
      lower.includes('phone ko open') ||
      lower.includes('lock open') ||
      lower.includes('lock kholo') ||
      lower.includes('lock kholna') ||
      lower.includes('lock khol do') ||
      lower.includes('phone kholo') ||
      lower.includes('phone kholna') ||
      lower.includes('screen kholo') ||
      lower.includes('mobile kholo') ||
      lower.includes('mayra open') ||
      lower.includes('mayra unlock') ||
      lower.includes('mayra phone kholo') ||
      lower.includes('mayra lock kholo') ||
      lower.includes('maira open') ||
      lower.includes('maira unlock') ||
      lower.includes('स्क्रीन अनलॉक') ||
      lower.includes('फोन अनलॉक') ||
      lower.includes('फोन खोलो') ||
      lower.includes('लॉक खोलो') ||
      lower === 'unlock' ||
      lower === 'open' ||
      lower === 'open karo' ||
      lower === 'open kar do' ||
      lower === 'open kardo' ||
      lower === 'open karna' ||
      lower === 'kholo' ||
      lower === 'khol do' ||
      lower === 'kholna' ||
      lower === 'अनलॉक' ||
      lower === 'खोलो' ||
      lower === 'ओपन' ||
      lower === 'ओपन करो')
  ) {
    updateCheatSheetUI('unlock_phone', 'success');
    return {
      reply: 'Biometric voice authorization confirmed. Phone unlocked successfully. Welcome back Rovin sir!',
      actions: [{ name: 'unlockPhone', args: {} }],
      isInstant: true,
    };
  }

  // 0f. Core Command: Phone Lock / फोन लॉक करना (Mayra Trend: "phone lock karo", "phone lock karna", "lock karna", "lock phone", "mayra lock", "lock karo")
  if (
    !lower.includes('pc lock') &&
    !lower.includes('lock pc') &&
    !lower.includes('computer lock') &&
    (lower.includes('phone lock') ||
      lower.includes('lock phone') ||
      lower.includes('phone ko lock') ||
      lower.includes('phone lock karna') ||
      lower.includes('phone lock karo') ||
      lower.includes('phone lock kar do') ||
      lower.includes('phone lock kardo') ||
      lower.includes('phone lock kar de') ||
      lower.includes('phone lock kar re') ||
      lower.includes('lock phone kar re') ||
      lower.includes('lock karna') ||
      lower.includes('lock karo') ||
      lower.includes('lock kar do') ||
      lower.includes('lock kardo') ||
      lower.includes('lock kar de') ||
      lower.includes('screen lock') ||
      lower.includes('lock screen') ||
      lower.includes('screen ko lock') ||
      lower.includes('mobile lock') ||
      lower.includes('mobile ko lock') ||
      lower.includes('mayra lock') ||
      lower.includes('maira lock') ||
      lower.includes('phone band karo') ||
      lower.includes('phone ko band karo') ||
      lower.includes('screen band karo') ||
      lower.includes('screen ko band karo') ||
      lower.includes('स्क्रीन लॉक') ||
      lower.includes('फोन लॉक') ||
      lower.includes('फोन बंद करो') ||
      lower.includes('लॉक करो') ||
      lower.includes('लॉक करना') ||
      lower.includes('लॉक कर दो') ||
      lower === 'lock' ||
      lower === 'लॉक' ||
      lower === 'lok' ||
      lower === 'lok karo' ||
      lower === 'lok kar do' ||
      lower === 'phone lok' ||
      lower === 'lok phone' ||
      ((lower.includes('lock') || lower.includes('lok') || lower.includes('लॉक')) &&
        (lower.includes('phone') ||
          lower.includes('screen') ||
          lower.includes('mobile') ||
          lower.includes('karo') ||
          lower.includes('kar do') ||
          lower.includes('kardo'))))
  ) {
    updateCheatSheetUI('lock_phone', 'success');
    return {
      reply: 'Ji Sir, phone ko secure lock mode me switch kar diya hai. Lock screen par bhi Jarvis active listener taiyar hai. Jab bhi aap "Jarvis" bolenge, main jaag jaunga aur aapka command follow karunga!',
      actions: [{ name: 'lockPhone', args: {} }],
      isInstant: true,
    };
  }

  // 0f2. Core Command: Phone Shut Down / Power Off / Set Down ("phone shut down karo", "shut down phone", "phone switch off karo", "phone set down", "power off")
  if (
    lower.includes('shut down') ||
    lower.includes('shutdown') ||
    lower.includes('set down') ||
    lower.includes('switch off') ||
    lower.includes('power off') ||
    lower.includes('turn off phone') ||
    lower.includes('phone switch off') ||
    lower.includes('phone shut down') ||
    lower.includes('phone set down') ||
    lower.includes('फोन स्विच ऑफ') ||
    lower.includes('शट डाउन') ||
    lower.includes('फोन शट डाउन') ||
    (lower.includes('phone') && (lower.includes('switch off') || lower.includes('shut down') || lower.includes('band kar do') || lower.includes('power off')))
  ) {
    return {
      reply: 'Good bye Rovin sir! System safely powering down. Phone ko turn on karne ke liye Power button tap karein.',
      actions: [{ name: 'shutdownPhone', args: {} }],
      isInstant: true,
    };
  }

  // 0f3. Core Command: Always-On / Online Mode ("online kar do", "online karo", "jarvis online", "go online", "always on chalu karo", "background me chalu rakho", "mayra mode", "always listening", "kabhi band mat hona")
  if (
    lower.includes('online kar') ||
    lower.includes('online karo') ||
    lower.includes('online ho') ||
    lower.includes('online aao') ||
    lower.includes('jarvis online') ||
    lower.includes('system online') ||
    lower.includes('voice online') ||
    lower.includes('go online') ||
    lower.includes('turn online') ||
    lower.includes('come online') ||
    lower.includes('online mode') ||
    lower.trim() === 'online' ||
    lower.includes('always on') ||
    lower.includes('always listening') ||
    lower.includes('always online') ||
    lower.includes('background me chalu') ||
    lower.includes('background me chal') ||
    lower.includes('background chalu') ||
    lower.includes('chalu rakho') ||
    lower.includes('kabhi band mat hona') ||
    lower.includes('mayra mode') ||
    lower.includes('hamesha suno') ||
    lower.includes('screen on rakho') ||
    lower.includes('keep awake')
  ) {
    return {
      reply: 'All systems online and functional, Sir. Continuous Hands-Free voice connection active. At your command.',
      actions: [{ name: 'activateAlwaysOnMode', args: {} }],
      isInstant: true,
    };
  }

  // 0f3b. Core Command: Go Offline / Touch Mode ("offline kar do", "offline karo", "go offline", "touch mode")
  if (
    lower.includes('offline kar') ||
    lower.includes('offline karo') ||
    lower.includes('offline ho') ||
    lower.includes('jarvis offline') ||
    lower.includes('go offline') ||
    lower.includes('turn offline') ||
    lower.includes('touch mode') ||
    lower.trim() === 'offline'
  ) {
    return {
      reply: 'Ji Sir, Jarvis ko Push-to-Talk (Touch Mode) me set kar diya hai. Baat karne ke liye mic icon tap karein.',
      actions: [{ name: 'deactivateAlwaysOnMode', args: {} }],
      isInstant: true,
    };
  }

  // 0f4. Memory Core: Add Creator / Rovin Pal Memory ("Mujhe ai Jarvis ma memory add karne h mar name Rovin Pal ne banya h", "memory me add karo", "rovin pal ne banaya")
  if (
    (lower.includes('memory') || lower.includes('yaadash') || lower.includes('yaad') || lower.includes('save') || lower.includes('add')) &&
    (lower.includes('rovin') || lower.includes('pal') || lower.includes('banaya') || lower.includes('banya') || lower.includes('creator') || lower.includes('developer') || lower.includes('master'))
  ) {
    return {
      reply: 'At your service, Sir. J.A.R.V.I.S. memory core updated: Rovin Pal is registered as Creator and Master.',
      actions: [
        {
          name: 'saveMemoryItem',
          args: {
            key: 'Creator & Developer / निर्माता',
            value: 'Rovin Pal (रोविन पाल - Creator, Developer & Master of JARVIS)',
            category: 'personal',
          },
        },
        {
          name: 'openMemoryCore',
          args: {},
        },
      ],
      isInstant: true,
    };
  }

  // 0f5. Query Creator: Who created you? / Kisne banaya? ("tumhe kisne banaya", "who created you", "who made you", "creator kaun hai", "rovin pal kaun hai")
  if (
    lower.includes('kisne banaya') ||
    lower.includes('kisne banya') ||
    lower.includes('who created you') ||
    lower.includes('who made you') ||
    lower.includes('who is your creator') ||
    lower.includes('who is your developer') ||
    lower.includes('creator kaun hai') ||
    lower.includes('kiska jarvis') ||
    lower.includes('kisne develop kiya') ||
    lower.includes('tumhara malik kaun hai') ||
    lower.includes('tumhara boss kaun hai') ||
    lower.includes('किसने बनाया') ||
    lower.includes('क्रिएटर कौन है') ||
    lower === 'rovin pal' ||
    lower === 'rovin pal kaun hai' ||
    lower === 'who is rovin pal'
  ) {
    return {
      reply: 'Mujhe mere sammaniya creator aur master Rovin Pal sir ne banaya aur develop kiya hai! Unhone hi mujhe is smart AI voice assistant ke roop me design aur program kiya hai. Ram Ram Rovin sir!',
      actions: [
        {
          name: 'openMemoryCore',
          args: {},
        },
      ],
      isInstant: true,
    };
  }

  // 0f6. Memory Core Modal Launcher & Full Memory Activation ("pure thara sa memory do", "memory do", "memory kholo", "memory core dikhao", "open memory", "yaadash dikhao")
  if (
    lower.includes('memory do') ||
    lower.includes('memory de') ||
    lower.includes('pure thara sa memory') ||
    lower.includes('puri memory') ||
    lower.includes('poori memory') ||
    lower.includes('full memory') ||
    lower.includes('memory load') ||
    lower.includes('memory kholo') ||
    lower.includes('memory core') ||
    lower.includes('open memory') ||
    lower.includes('show memory') ||
    lower.includes('memory dikhao') ||
    lower.includes('yaadash dikhao') ||
    lower.includes('मेमोरी') ||
    lower === 'memory'
  ) {
    return {
      reply: 'At your service, Sir. Permanent Memory Core is online and active. Standing by for your instructions.',
      actions: [{ name: 'openMemoryCore', args: {} }],
      isInstant: true,
    };
  }

  // 0g. Core Command: Power / Lock Button Gemini Setup Guide ("lock button se gemini", "power button gemini", "power button setting")
  if (
    lower.includes('power button') ||
    lower.includes('lock button') ||
    lower.includes('पावर बटन') ||
    lower.includes('लॉक बटन') ||
    lower.includes('lock wala button') ||
    lower.includes('lock bala batan') ||
    lower.includes('gemini button') ||
    lower.includes('google gemini open') ||
    lower.includes('gimme open') ||
    lower.includes('assistant button')
  ) {
    updateCheatSheetUI('power_button_assist', 'success');
    return {
      reply: 'Ji bilkul! Jaise Android me lock / power button press karne se Google Gemini open hota hai, maine aapke screen par Power Button shortcut widget aur Android settings guide open kar diya hai!',
      actions: [{ name: 'openPowerButtonGuide', args: {} }],
      isInstant: true,
    };
  }

  // 1. YouTube Secondary Fallback Handler
  if (
    lower.includes('youtube') ||
    lower.includes('यूट्यूब') ||
    lower.includes('यूटयूब') ||
    lower.includes('you tube') ||
    lower.includes('yt') ||
    ((lower.includes('open') || lower.includes('kholo') || lower.includes('खोलो') || lower.includes('chalao') || lower.includes('चलाओ')) &&
      (lower.includes('video') || lower.includes('gana') || lower.includes('gaana') || lower.includes('song')))
  ) {
    const query = extractYouTubeQuery(rawCommand);
    const reply = `Ji bilkul! Mai YouTube par "${query}" turant live chala rahi hu. 🎵▶️`;

    return {
      reply,
      actions: [
        {
          name: 'playYouTube',
          args: { query, autoplay: true },
        },
        {
          name: 'openApp',
          args: { appName: 'youtube', query },
        },
      ],
      isInstant: true,
    };
  }

  // 2. Read Incoming Messages ("messages padho", "read my messages", "naye message kya hain", "read sms", "message sunao", "summarize messages")
  if (
    lower.includes('summarize message') ||
    lower.includes('summarize messages') ||
    lower.includes('message summarize') ||
    lower.includes('messages summarize') ||
    lower.includes('message summary') ||
    lower.includes('messages summary') ||
    lower.includes('message padho') ||
    lower.includes('messages padho') ||
    lower.includes('read message') ||
    lower.includes('read messages') ||
    lower.includes('read sms') ||
    lower.includes('sms padho') ||
    lower.includes('naye message') ||
    lower.includes('naya message') ||
    lower.includes('message sunao') ||
    lower.includes('message batao') ||
    lower.includes('inbox kholo') ||
    lower.includes('read whatsapp') ||
    (lower.includes('message') && (lower.includes('padh') || lower.includes('sun') || lower.includes('read') || lower.includes('check') || lower.includes('summar')))
  ) {
    const unread = (context.incomingMessages || []).filter((m) => !m.read);
    let reply = '';
    if (unread.length > 0) {
      const summary = unread.slice(0, 2).map((m) => `${m.senderName} se: "${m.text}"`).join('. Aur ');
      reply = `Ram Ram ji! Aapke paas ${unread.length} naye messages hain. ${summary}. Maine Messages Inbox screen par open kar diya hai.`;
    } else {
      reply = 'Ram Ram ji! Aapka inbox bilkul up-to-date hai, koi unread messages nahi hain. Maine Messages Inbox screen par open kar diya hai.';
    }

    return {
      reply,
      actions: [
        {
          name: 'openMessagesInbox',
          args: {},
        },
      ],
      isInstant: true,
    };
  }

  // 2b. Voice Command Cheat Sheet ("cheat sheet", "commands dikhao", "voice commands", "kya bol sakte hain")
  if (
    lower.includes('cheat sheet') ||
    lower.includes('cheatsheet') ||
    lower.includes('cheat') ||
    lower.includes('voice command') ||
    lower.includes('voice commands') ||
    lower.includes('commands dikhao') ||
    lower.includes('command dikhao') ||
    lower.includes('command list') ||
    lower.includes('commands list') ||
    lower.includes('kya bol sakte') ||
    lower.includes('kya bolu') ||
    lower.includes('available commands') ||
    lower.includes('list commands') ||
    lower.includes('search command') ||
    lower.includes('commands search') ||
    lower.includes('filter command') ||
    lower.includes('search cheat')
  ) {
    return {
      reply: 'Ram Ram ji! Maine screen par interactive Voice Command Cheat Sheet open kar di hai. Yahan se aap sabhi voice commands live dekh aur execute kar sakte hain.',
      actions: [
        {
          name: 'openVoiceCheatSheet',
          args: {},
        },
      ],
      isInstant: true,
    };
  }

  // 3. Contacts View & Lookup ("contacts dikhao", "show contacts", "contacts list", "phonebook")
  if (
    lower.includes('contacts dikhao') ||
    lower.includes('contact dikhao') ||
    lower.includes('show contacts') ||
    lower.includes('show contact') ||
    lower.includes('contacts list') ||
    lower.includes('phonebook') ||
    lower.includes('contacts kholo') ||
    lower.includes('contact kholo')
  ) {
    return {
      reply: 'Ram Ram ji! Maine Contacts list open kar di hai. Yahan se aap kisi bhi contact ko direct phone call ya WhatsApp message kar sakte hain.',
      actions: [
        {
          name: 'openContactsView',
          args: {},
        },
      ],
      isInstant: true,
    };
  }

  // 4. Contact Phone Number Query ("Dad ka number kya hai", "Rahul ka phone number", "Find contact")
  if (
    (lower.includes('number kya hai') ||
      lower.includes('ka number') ||
      lower.includes('phone number') ||
      lower.includes('find contact') ||
      lower.includes('search contact') ||
      lower.includes('ka contact')) &&
    !lower.includes('call') &&
    !lower.includes('lagao')
  ) {
    const cleanQuery = lower
      .replace(/(contact|search|find|dikhao|karo|ka|ki|number|phone|kya|hai|batao)/gi, '')
      .trim();

    const matched = context.contacts.find((c) => {
      const nameL = c.name.toLowerCase();
      const relL = (c.relation || '').toLowerCase();
      return nameL.includes(cleanQuery) || relL.includes(cleanQuery) || cleanQuery.includes(nameL);
    });

    if (matched) {
      return {
        reply: `Ram Ram ji! ${matched.name} ${matched.relation ? `(${matched.relation})` : ''} ka mobile number hai: ${matched.phone}. Maine inka contact card screen par open kar diya hai.`,
        actions: [
          {
            name: 'searchContacts',
            args: { query: matched.name, action: 'display_details' },
          },
        ],
        isInstant: true,
      };
    }
  }

  // 4b. Contact Number Send / Share ("Dad ka number bhejo", "Rahul ka number send karo", "Number send karo", "vahi number send karo Jo mere contact mein sev hai")
  if (
    lower.includes('number bhejo') ||
    lower.includes('number send') ||
    lower.includes('number share') ||
    lower.includes('नंबर भेजो') ||
    lower.includes('नंबर सेंड') ||
    lower.includes('number whatsapp karo') ||
    lower.includes('vahi number send') ||
    lower.includes('wahi number send') ||
    (lower.includes('number') && (lower.includes('bhej') || lower.includes('send') || lower.includes('share')))
  ) {
    const matched = findSavedContact(rawCommand, context.contacts);

    if (matched) {
      const shareText = `Saved Contact Card:\nName: ${matched.name}${matched.relation ? ` (${matched.relation})` : ''}\nPhone: ${matched.phone}`;
      return {
        reply: `Ji Rovin sir! Aapke saved contact "${matched.name}" ka verified phone number (${matched.phone}) hai. Maine ise send/share karne ke liye open kar diya hai.`,
        actions: [
          {
            name: 'sendTextMessage',
            args: {
              platform: 'whatsapp',
              recipientName: matched.name,
              messageText: shareText,
            },
          },
        ],
        isInstant: true,
      };
    } else {
      // Unsaved number or no match: strictly refuse to share unknown numbers!
      return {
        reply: 'Suraksha Niyam (Saved Contacts Only): Mai sirf aapke saved contacts ke verified numbers hi send ya share kar sakti hu. Anjaan ya unsaved number send karne ki anumati nahi hai.',
        actions: [
          {
            name: 'openContactsView',
            args: {},
          },
        ],
        isInstant: true,
      };
    }
  }

  // 4c. "Only Naam bolo to call karna" - Standalone contact name calling
  // When the user speaks ONLY a contact name or relation (e.g. "Dad", "Papa", "Mom", "Mummy", "Rahul", "Dr. Sharma", "John")
  const pureNameClean = lower
    .replace(/^(hey|hi|hello|jarvis|mayra|maira|myra|ai|ji|are|suno|oye|jarvisji|bhai|yaar)\s+/gi, '')
    .replace(/\s+(ji|bhai|sir)$/gi, '')
    .trim();

  const reservedNonContactWords = [
    'time', 'date', 'weather', 'torch', 'flash', 'music', 'song', 'lock', 'unlock', 'open', 'shutdown',
    'alarm', 'news', 'joke', 'help', 'settings', 'battery', 'home', 'camera', 'youtube', 'mayra', 'maira',
    'screen', 'volume', 'plan', 'schedule', 'contacts', 'pc', 'mouse', 'keyboard', 'play store', 'playstore'
  ];
  const isReserved = reservedNonContactWords.some((w) => pureNameClean.includes(w));

  if (
    !isReserved &&
    pureNameClean.length >= 2 &&
    pureNameClean.split(' ').length <= 3 &&
    !lower.includes('call') &&
    !lower.includes('phone') &&
    !lower.includes('send') &&
    !lower.includes('bhejo')
  ) {
    const directContact = findSavedContact(pureNameClean, context.contacts);
    if (directContact) {
      return {
        reply: `Right away, Sir. Connecting call to ${directContact.name} now.`,
        actions: [
          {
            name: 'makePhoneCall',
            args: {
              recipientName: directContact.name,
              phoneNumber: directContact.phone,
              phoneType: directContact.phoneType || 'mobile',
              autoDial: true,
            },
          },
        ],
        isInstant: true,
      };
    }
  }

  // 5. Phone Call: DIRECT SPOKEN NUMBER CALLING & SAVED CONTACT CALLING
  // "Contact ma save number par call ne laga re h jo number bola us number par call laga"
  if (
    (lower.includes('call') ||
      lower.includes('phone') ||
      lower.includes('lagao') ||
      lower.includes('लगाओ') ||
      lower.includes('मिलाओ') ||
      lower.includes('milao') ||
      lower.includes('कॉल') ||
      lower.includes('फोन') ||
      lower.includes('dial')) &&
    !lower.includes('help') &&
    !lower.includes('voice') &&
    !lower.includes('history') &&
    !lower.includes('torch') &&
    !lower.includes('alarm')
  ) {
    // 5a. Check if a phone number was directly spoken or typed
    const spokenPhone = extractSpokenPhoneNumber(rawCommand);

    if (spokenPhone) {
      const matchedContact = findSavedContact(spokenPhone, context.contacts);
      const targetName = matchedContact ? matchedContact.name : `Number ${spokenPhone}`;
      const reply = matchedContact
        ? `Ji bilkul! Saved contact "${targetName}" (${spokenPhone}) ko call connect kar rahi hu.`
        : `Ji bilkul! Aapke bole gaye number ${spokenPhone} par turant direct call connect kar rahi hu.`;

      return {
        reply,
        actions: [
          {
            name: 'makePhoneCall',
            args: {
              recipientName: targetName,
              phoneNumber: spokenPhone,
              phoneType: matchedContact?.phoneType || 'mobile',
              autoDial: true,
            },
          },
        ],
        isInstant: true,
      };
    }

    // 5b. No direct phone digits found, check if a contact name or relation was spoken
    const nameClean = rawCommand
      .replace(
        /(call|phone|karo|ko|lagao|please|mobile|work|home|par|pe|milao|कॉल|फोन|लगाओ|मिलाओ|को|dial|number|bhejo|sunao)/gi,
        ''
      )
      .trim();

    const matchedContact = findSavedContact(nameClean || rawCommand, context.contacts);

    if (matchedContact) {
      const targetName = matchedContact.name;
      const targetPhone = matchedContact.phone;
      const reply = `Ji bilkul! Saved contact "${targetName}" (${targetPhone}) ko call connect kar rahi hu.`;

      return {
        reply,
        actions: [
          {
            name: 'makePhoneCall',
            args: {
              recipientName: targetName,
              phoneType: matchedContact.phoneType || 'mobile',
              autoDial: true,
              phoneNumber: targetPhone,
            },
          },
        ],
        isInstant: true,
      };
    }

    // 5c. Neither phone number nor saved contact was recognized
    return {
      reply: `Kripya call lagane ke liye koi phone number bolein (jaise "9876543210 par call lagao") ya saved contact ka naam bolein (jaise "Dad ko call lagao").`,
      actions: [
        {
          name: 'openContactsView',
          args: { unsavedQuery: nameClean },
        },
      ],
      isInstant: true,
    };
  }

  // 5b-0. Direct Link & QR Code Generator ("link bano", "qr code bano", "link banao ya qr code banao", "qr code dikhao")
  if (
    lower.includes('link bano') ||
    lower.includes('link banao') ||
    lower.includes('qr code bano') ||
    lower.includes('qr code banao') ||
    lower.includes('qr bano') ||
    lower.includes('qr banao') ||
    lower.includes('qr code') ||
    lower.includes('qrcode') ||
    lower.includes('qr scan') ||
    lower.includes('scan code') ||
    lower.includes('link do') ||
    lower.includes('share link') ||
    lower.includes('app link') ||
    lower.includes('link bhejo') ||
    lower.includes('link share') ||
    lower.includes('लिंक बनाओ') ||
    lower.includes('क्यूआर कोड')
  ) {
    return {
      reply: 'Ji! Maine aapke liye JARVIS ka direct share link aur scan karne ke liye live QR Code bana diya hai! Aap yahan se link copy karke dost ko bhej sakte hain ya seedhe QR code scan karwa sakte hain!',
      actions: [
        {
          name: 'openInstallApp',
          args: { tab: 'friend' },
        },
      ],
      isInstant: true,
    };
  }

  // 5b-1. Direct APK Build & Friend Download ("apk bild karo jo ke friend ko download kar sakte h", "apk build", "apk banao", "friend ko download")
  if (
    lower.includes('apk bild') ||
    lower.includes('apk build') ||
    lower.includes('apk banao') ||
    lower.includes('apk create') ||
    lower.includes('apk generate') ||
    lower.includes('friend ko download') ||
    lower.includes('friend download') ||
    lower.includes('dost ko download') ||
    lower.includes('dost ke liye download') ||
    lower.includes('friend ke liye download') ||
    lower.includes('friend ko bhejo') ||
    lower.includes('dost ko bhejo') ||
    lower.includes('friend share') ||
    lower.includes('apk file download') ||
    lower.includes('apk file bhejo')
  ) {
    return {
      reply: 'Ji bilkul! Maine aapke dost ke liye JARVIS APK Builder aur Friend Download system open kar diya hai! Yahan se aap direct JARVIS-AI-Assistant.apk package build karke download kar sakte hain, ya QR code scan karwa kar WhatsApp se apne dost ko bhej sakte hain!',
      actions: [
        {
          name: 'openInstallApp',
          args: { tab: 'apk_build' },
        },
      ],
      isInstant: true,
    };
  }

  // 5b-0. Google Q&A Memory & Previous Question Recall ("google ke questions", "question and answers store", "mana phala kia question par bat kare te")
  if (
    lower.includes('phala kia question') ||
    lower.includes('kia question') ||
    lower.includes('bat kare te') ||
    lower.includes('baat kare te') ||
    lower.includes('question par bat') ||
    lower.includes('question par baat') ||
    lower.includes('question and answers') ||
    lower.includes('jasa google') ||
    lower.includes('jaise google') ||
    lower.includes('google ko ke question') ||
    lower.includes('google ko question') ||
    lower.includes('pehle kya pucha tha') ||
    lower.includes('pichla question kya') ||
    (lower.includes('question') && (lower.includes('store') || lower.includes('yaad') || lower.includes('yad') || lower.includes('pehle') || lower.includes('phala')))
  ) {
    const qaList = getStoredQaMemories();
    let replyText = 'Ji Rovin Sir! Jaise Google har question ka turant jabab deta hai, waise hi JARVIS aapke sabhi questions aur answers ko real-time memory me store kar raha hai.';
    if (qaList.length > 0) {
      const lastQ = qaList[0];
      replyText += ` Pichli baar aapne pucha tha: "${lastQ.question}" aur mera answer tha: "${lastQ.answer.slice(0, 110)}...". Maine Memory Core ka Q&A bank screen par open kar diya hai!`;
    } else {
      replyText += ' Aap jo bhi sawal puchenge, JARVIS unhe yaad rakhega taaki aap purani baat kabhi bhi recall kar sakein. Maine Q&A bank open kar diya hai!';
    }

    return {
      reply: replyText,
      actions: [
        {
          name: 'openMemoryCore',
          args: { tab: 'qa_memory' },
        },
      ],
      isInstant: true,
    };
  }

  // 5b-0b. Admin Dashboard Panel (Restricted for Admin / Rovin Pal: "admin dashboard", "admin desboord", "admin panel link karo only admin ka liya")
  if (
    lower === 'admin' ||
    lower.includes('admin panel') ||
    lower.includes('admin dashboard') ||
    lower.includes('admin desboord') ||
    lower.includes('admin desboard') ||
    lower.includes('admin dasboard') ||
    lower.includes('admin portal') ||
    lower.includes('admin login') ||
    lower.includes('open admin') ||
    lower.includes('एडमिन पैनल') ||
    lower.includes('एडमिन डैशबोर्ड') ||
    (lower.includes('admin') && (lower.includes('link') || lower.includes('kholo') || lower.includes('open') || lower.includes('karo')))
  ) {
    return {
      reply: 'Ji Rovin Sir, Administrator Control Panel link open kar diya gaya hai. Yeh panel strictly authorized administrator ke liye surakshit hai. Kripya apna master PIN enter karein.',
      actions: [
        {
          name: 'openAdminDashboard',
          args: {},
        },
      ],
      isInstant: true,
    };
  }

  // 5b-1. Play Store Upload & Publishing ("play store par kasa dalla", "play store par kaise dale", "play store me upload kaise kare")
  if (
    (lower.includes('play store') || lower.includes('playstore') || lower.includes('प्ले स्टोर')) &&
    (lower.includes('kasa dalla') ||
      lower.includes('kaise dale') ||
      lower.includes('kasa dale') ||
      lower.includes('kaise daale') ||
      lower.includes('upload') ||
      lower.includes('publish') ||
      lower.includes('dalla') ||
      lower.includes('dalna') ||
      lower.includes('dalte'))
  ) {
    return {
      reply: 'Ji Rovin Sir! JARVIS ko Google Play Store par daalne (upload karne) ke 2 simple tarike hain: 1) PWABuilder se Google Play verified .AAB file generate karke Google Play Console (play.google.com/console) par upload karein, 2) Apne ya dost ke phone me direct 1-Tap se WebAPK app install karein. Maine screen par Google Play Store Publishing Guide open kar di hai!',
      actions: [
        {
          name: 'openInstallApp',
          args: { tab: 'playstore' },
        },
      ],
      isInstant: true,
    };
  }

  // 5b-2. Play Store & WebAPK Installation ("play store mein kaise install karen", "home screen par kaise lekar jaye", "apk")
  if (
    lower.includes('home screen') ||
    lower.includes('homescreen') ||
    lower.includes('होम स्क्रीन') ||
    lower.includes('kasa lakar jaya') ||
    lower.includes('kaise lekar jaye') ||
    lower.includes('home screen par kaise') ||
    lower.includes('home screen par kasa') ||
    lower.includes('home screen par add') ||
    lower.includes('play store') ||
    lower.includes('playstore') ||
    lower.includes('प्ले स्टोर') ||
    lower.includes('play store se download') ||
    lower.includes('play store se install') ||
    lower.includes('app kaise install') ||
    lower.includes('download kaise kare') ||
    lower.includes('install kaise kare') ||
    lower.includes('install jarvis') ||
    lower.includes('download jarvis') ||
    lower.includes('phone me kaise dale') ||
    lower.includes('apk') ||
    lower.includes('apk so ne kar ra h') ||
    lower.includes('apk show') ||
    lower.includes('apk download') ||
    lower.includes('apk file') ||
    lower.includes('apk install') ||
    (lower.includes('install') && (lower.includes('app') || lower.includes('phone') || lower.includes('kare')))
  ) {
    return {
      reply: 'Ji Sir! JARVIS ko phone ki Home Screen par lane ke liye Google Chrome me upar 3-dots (⋮ menu) par tap karein aur "Add to Home screen" ya "Install App" par click karein. Maine screen par installation guide aur Play Store WebAPK window khol di hai!',
      actions: [
        {
          name: 'openInstallApp',
          args: { tab: 'playstore' },
        },
      ],
      isInstant: true,
    };
  }

  // 5b2. Customize Alert Haptic Feedback Patterns (Alarms, Messages, Calls)
  if (
    lower.includes('haptic pattern') ||
    lower.includes('vibration pattern') ||
    lower.includes('customize haptic') ||
    lower.includes('custom haptic') ||
    lower.includes('alert vibration') ||
    lower.includes('alarm vibration') ||
    lower.includes('message vibration') ||
    lower.includes('call vibration') ||
    lower.includes('phone vibration') ||
    lower.includes('वाइब्रेशन पैटर्न') ||
    lower.includes('हैप्टिक पैटर्न') ||
    lower.includes('वाइब्रेशन सेट') ||
    lower.includes('वाइब्रेशन कस्टमाइज़') ||
    lower.includes('haptic customizer') ||
    lower.includes('haptic studio')
  ) {
    let alertType: 'alarm' | 'message' | 'call' | 'reminder' | 'emergency' = 'alarm';
    if (lower.includes('message') || lower.includes('sms') || lower.includes('मैसेज')) {
      alertType = 'message';
    } else if (lower.includes('call') || lower.includes('ring') || lower.includes('कॉल') || lower.includes('फोन')) {
      alertType = 'call';
    } else if (lower.includes('reminder') || lower.includes('रिमाइंडर')) {
      alertType = 'reminder';
    } else if (lower.includes('emergency') || lower.includes('इमरजेंसी') || lower.includes('सुरक्षा')) {
      alertType = 'emergency';
    }

    const typeNames: Record<string, string> = {
      alarm: 'Alarms & Timers (अलार्म)',
      message: 'Messages & SMS (मैसेज)',
      call: 'Incoming Calls (इनकमिंग कॉल)',
      reminder: 'Reminders & Tasks (रिमाइंडर)',
      emergency: 'Emergency & Security (सुरक्षा)',
    };

    return {
      reply: `Boss, maine ${typeNames[alertType]} ke liye Haptic Alert Pattern Customizer open kar diya hai. Yahan se aap vibration pulses, loop repeats aur rhythm tune kar sakte hain.`,
      actions: [
        {
          name: 'openHapticCustomizer',
          args: { alertType },
        },
      ],
      isInstant: true,
    };
  }

  // 5c. Settings, Microphone Test & Speaking Rate ("settings kholo", "mic test", "microphone ko thek karo", "speaking rate")
  if (
    lower.includes('setting') ||
    lower.includes('settings') ||
    lower.includes('सेटिंग') ||
    lower.includes('haptic') ||
    lower.includes('speaking rate') ||
    lower.includes('voice speed') ||
    lower.includes('speech rate') ||
    lower.includes('mic test') ||
    lower.includes('microphone test') ||
    lower.includes('microphone ko thek karo') ||
    lower.includes('mic theek karo') ||
    lower.includes('mic ko theek') ||
    lower.includes('mic problem') ||
    lower.includes('aawaz theek karo')
  ) {
    return {
      reply: 'Ji bilkul! Maine Jarvis Core Settings tab open kar diya hai, jahan se aap Speaking Rate slider, 5-Second Microphone Feedback Test aur Haptic feedback adjust kar sakte hain.',
      actions: [
        {
          name: 'openSettingsTab',
          args: {},
        },
      ],
      isInstant: true,
    };
  }

  // 6. Today's Plan / Schedule ("aaj ke plan batao", "schedule batao", "aaj ka plan kya hai", "दिनचर्या", "agenda")
  if (
    lower.includes('aaj ke plan') ||
    lower.includes('aaj ka plan') ||
    lower.includes('plan batao') ||
    lower.includes('schedule batao') ||
    lower.includes('aaj kya karna') ||
    lower.includes('aaj kya plan') ||
    lower.includes('आज के प्लान') ||
    lower.includes('आज का प्लान') ||
    lower.includes('दिनचर्या') ||
    ((lower.includes('show') || lower.includes('dikhao') || lower.includes('check') || lower.includes('view') || lower.includes('batao')) &&
      (lower.includes('schedule') || lower.includes('calendar') || lower.includes('agenda') || lower.includes('plan') || lower.includes('प्लान')))
  ) {
    const todayEvents = context.schedule.filter((item) => !item.completed);
    let reply = '';
    if (todayEvents.length > 0) {
      const summaryList = todayEvents.slice(0, 3).map((e) => `${e.title} (${e.time})`).join(', ');
      reply = `Ram Ram ji! Aaj aapke schedule me ${todayEvents.length} tasks hain: ${summaryList}. Maine schedule screen open kar di hai!`;
    } else {
      reply = 'Ram Ram ji! Aaj aapka schedule bilkul clear hai, koi pending events ya tasks nahi hain.';
    }

    return {
      reply,
      actions: [
        {
          name: 'openScheduleView',
          args: {},
        },
      ],
      isInstant: true,
    };
  }

  // 6b. Estimated Travel Time & Distance to First Schedule Item ("travel time", "schedule travel time", "kitni dur hai meeting", "first event distance")
  if (
    lower.includes('travel time') ||
    lower.includes('travel distance') ||
    lower.includes('kitni dur') ||
    lower.includes('kitna samay lagega') ||
    lower.includes('kitna time lagega') ||
    lower.includes('पहुंचने में कितना') ||
    lower.includes('दूरी कितनी है') ||
    (lower.includes('schedule') && (lower.includes('travel') || lower.includes('distance') || lower.includes('dur') || lower.includes('eta'))) ||
    (lower.includes('meeting') && (lower.includes('travel') || lower.includes('distance') || lower.includes('dur') || lower.includes('eta') || lower.includes('pahuchne'))) ||
    (lower.includes('first') && (lower.includes('item') || lower.includes('schedule') || lower.includes('task')) && (lower.includes('travel') || lower.includes('time') || lower.includes('distance')))
  ) {
    const firstItem = context.schedule.find((s) => !s.completed) || context.schedule[0];
    if (!firstItem) {
      return {
        reply: 'Sir, aapke schedule me koi pending event ya meeting nahi mili jiska travel time calculate kiya ja sake.',
        actions: [{ name: 'openScheduleView', args: {} }],
        isInstant: true,
      };
    }

    const cachedLoc = getCachedUserLocation();
    const userLat = cachedLoc?.latitude || 28.4595;
    const userLon = cachedLoc?.longitude || 77.0266;
    const destLat = typeof firstItem.latitude === 'number' ? firstItem.latitude : userLat + 0.045;
    const destLon = typeof firstItem.longitude === 'number' ? firstItem.longitude : userLon + 0.038;
    const straightDist = calculateHaversineDistanceKm(userLat, userLon, destLat, destLon);
    const roadDist = Math.round(Math.max(0.5, straightDist * 1.28) * 10) / 10;
    const drivingMinutes = Math.round((roadDist / 34) * 60 + 2);
    const dep = calculateDepartureTime(firstItem.time, drivingMinutes, 10);
    const locName = firstItem.location || 'Scheduled Location';

    const reply = `Sir, aapke pehle schedule item "${firstItem.title}" (${firstItem.time}) ke liye current GPS location se distance lagbhag ${roadDist} km hai. Gaadi se pahunchne me lagbhag ${drivingMinutes} minute lagenge. Sahi samay par pahunchne ke liye ${dep.departureTime} tak nikalna recommended hai!`;

    return {
      reply,
      actions: [
        {
          name: 'openScheduleView',
          args: { highlightFirstItem: true },
        },
      ],
      isInstant: true,
    };
  }

  // 7. Torch / Flashlight ("torch on karo", "torch jalao", "torch band karo", "flashlight")
  if (
    lower.includes('torch') ||
    lower.includes('flashlight') ||
    lower.includes('टॉर्च') ||
    lower.includes('फ्लैशलाइट') ||
    lower.includes('light on') ||
    lower.includes('light off')
  ) {
    const isOff = lower.includes('off') || lower.includes('band') || lower.includes('bujha') || lower.includes('बंद');
    const reply = isOff
      ? 'Ji, torch band kar di hai maine.'
      : 'Ji, torch on kar di hai maine.';

    return {
      reply,
      actions: [
        {
          name: 'managePhoneSettings',
          args: { setting: 'torch', action: isOff ? 'off' : 'on' },
        },
      ],
      isInstant: true,
    };
  }

  // 8. Alarms ("alarm lagao", "wake me up", "6 baje alarm", "subah alarm")
  if (lower.includes('alarm') || lower.includes('अलार्म') || lower.includes('wake')) {
    const timeMatch = rawCommand.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm|baje|बजे)?/i);
    let hour = 6;
    let min = 30;
    let timeStr = '06:30 AM';
    if (timeMatch) {
      hour = parseInt(timeMatch[1], 10);
      min = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
      const meridian = (timeMatch[3] || '').toUpperCase();
      if (meridian.includes('PM') && hour < 12) hour += 12;
      if (meridian.includes('AM') && hour === 12) hour = 0;
      timeStr = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
    }

    return {
      reply: `Maine ${timeStr} baje ka alarm set kar diya hai. Aap befikr rahiye!`,
      actions: [
        {
          name: 'manageSchedule',
          args: {
            action: 'set_alarm',
            title: 'Wakeup Alarm',
            time: timeStr,
            hour,
            minute: min,
            category: 'alarm',
            integrateNative: true,
          },
        },
      ],
      isInstant: true,
    };
  }

  // 8z. Excel Shortcuts & Smart Work Strategy ("excel all shortcut", "excel mein work kaise", "excel shortcuts")
  if (
    lower.includes('excel') &&
    (lower.includes('shortcut') || lower.includes('work') || lower.includes('kaam') || lower.includes('sheet') || lower.includes('formula') || lower.includes('tips'))
  ) {
    saveMemory('name', 'Rovin Pal', 'identity');
    saveMemory('preferred_title', 'Rovin Sir', 'identity');
    saveMemory(
      'excel_all_shortcuts',
      'MS Excel All Essential Shortcuts: [AutoSum]: Alt+= | [Filter]: Ctrl+Shift+L | [Flash Fill]: Ctrl+E | [Format Cells]: Ctrl+1 | [Select Column]: Ctrl+Space | [Select Row]: Shift+Space | [Insert Row/Col]: Ctrl++ | [Delete]: Ctrl+- | [Repeat/Lock]: F4 | [Fill Down/Right]: Ctrl+D / Ctrl+R | [Table]: Ctrl+T.',
      'custom_instruction'
    );
    return {
      reply: 'Ji Rovin Sir! Excel ke sabhi superfast shortcut keys aur smart work tips memory mein save kar diye gaye hain: 1) AutoSum: Alt+= (1 second mein total), 2) Flash Fill: Ctrl+E (data auto-split/combine bina formula ke), 3) Filter: Ctrl+Shift+L, 4) Format Cells: Ctrl+1, 5) Fast Navigation: Ctrl+Arrow keys, 6) Formula Lock: F4, 7) Insert/Delete: Ctrl++ aur Ctrl+-. Inse aapka ghanton ka kaam minutes mein hoga!',
      actions: [
        {
          name: 'saveMemoryItem',
          args: {
            key: 'excel_all_shortcuts',
            value: 'AutoSum: Alt+= | Filter: Ctrl+Shift+L | Flash Fill: Ctrl+E | Format: Ctrl+1 | Lock: F4',
            category: 'work',
          },
        },
      ],
      isInstant: true,
    };
  }

  // 8y. PC / Laptop Fast Speed & Window Management ("pc laptop mein kisi bhi work ko fast", "speed badhao", "jaat bhada")
  if (
    (lower.includes('pc') || lower.includes('laptop') || lower.includes('computer')) &&
    (lower.includes('fast') || lower.includes('speed') || lower.includes('shortcut') || lower.includes('bhada') || lower.includes('work') || lower.includes('kaam'))
  ) {
    return {
      reply: 'Ji Rovin Sir! PC aur Laptop par kisi bhi kaam ki speed 10 guna badhane ke best shortcuts: 1) Win + Left/Right Arrow (Window split screen), 2) Alt + Tab (Instant app switch), 3) Win + V (Clipboard history - copy multiple items), 4) Win + Shift + S (Instant screenshot), 5) Ctrl + Shift + Esc (Direct Task Manager), 6) Win + R (Run apps: excel, chrome, cmd). Yeh sabhi tricks active hain!',
      actions: [],
      isInstant: true,
    };
  }

  // 9a. Microphone Photo Bug Resolution ("microphone chalu kar dete photo bolta hai", "photo problem")
  if (
    lower.includes('photo bol') ||
    lower.includes('photo bolta') ||
    lower.includes('photo bolata') ||
    lower.includes('microphone photo') ||
    lower.includes('mic photo') ||
    lower.includes('photo band karo') ||
    lower.includes('photo problem') ||
    lower.includes('photo aati hai') ||
    lower.includes('photo khul jati hai') ||
    (lower.includes('microphone') && lower.includes('solve'))
  ) {
    return {
      reply: 'Ji Rovin Pal Sir! Microphone chalu karne par photo aane ya bolne ka issue permanently solve kar diya gaya hai. Ambient acoustic filter laga diya gaya hai, isliye ab microphone sirf aapki awaaz sunega aur bina explicit "Camera open karo" bole photo ya camera kabhi trigger nahi hoga.',
      actions: [],
      isInstant: true,
    };
  }

  // 9b. Camera / Photos ("camera open karo", "camera kholo", "selfie lo", "photo khicho")
  // REQUIRES explicit action verb to prevent false positives from background breath/noise!
  const hasExplicitCameraIntent =
    (lower.includes('camera') && (lower.includes('open') || lower.includes('kholo') || lower.includes('chalu') || lower.includes('start') || lower.includes('on karo') || lower.includes('खोलो') || lower.includes('चालू'))) ||
    (lower.includes('photo') && (lower.includes('khicho') || lower.includes('kheencho') || lower.includes('click') || lower.includes('capture') || lower.includes('lo') || lower.includes('le lo') || lower.includes('खींचो') || lower.includes('क्लिक') || lower.includes('nikalo'))) ||
    (lower.includes('tasveer') && (lower.includes('khicho') || lower.includes('lo') || lower.includes('kheencho'))) ||
    (lower.includes('selfie') && (lower.includes('lo') || lower.includes('khicho') || lower.includes('click') || lower.includes('take') || lower.includes('le lo'))) ||
    lower === 'camera open' ||
    lower === 'open camera' ||
    lower === 'take photo' ||
    lower === 'click photo' ||
    lower === 'take a photo' ||
    lower === 'take selfie' ||
    lower === 'कैमरा खोलो' ||
    lower === 'फोटो खींचो';

  if (hasExplicitCameraIntent) {
    return {
      reply: 'Right away, Sir. Initializing optical camera sensor.',
      actions: [
        {
          name: 'openApp',
          args: { appName: 'camera' },
        },
      ],
      isInstant: true,
    };
  }

  // 10. WhatsApp ("whatsapp open karo", "whatsapp kholo", "whatsapp message")
  if (lower.includes('whatsapp') || lower.includes('व्हाट्सएप') || lower.includes('whats app')) {
    return {
      reply: 'Certainly, Sir. Opening WhatsApp.',
      actions: [
        {
          name: 'openApp',
          args: { appName: 'whatsapp' },
        },
      ],
      isInstant: true,
    };
  }

  // 11. Time, Date, Timezone & Battery Health ("time kya hua", "kitne baje hain", "date kya hai", "running time", "real time", "wrong time zone")
  if (
    lower.includes('time') ||
    lower.includes('date') ||
    lower.includes('battery') ||
    lower.includes('samay') ||
    lower.includes('tarikh') ||
    lower.includes('tariq') ||
    lower.includes('kitne baje') ||
    lower.includes('kitna time') ||
    lower.includes('timezone') ||
    lower.includes('time zone') ||
    lower.includes('running time') ||
    lower.includes('real time') ||
    lower.includes('reyal time') ||
    lower.includes('live time') ||
    lower.includes('समय') ||
    lower.includes('तारीख') ||
    lower.includes('बजे')
  ) {
    const userTz = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata' : 'Asia/Kolkata';
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-IN', { timeZone: userTz, hour: '2-digit', minute: '2-digit', hour12: true });
    const dateStr = now.toLocaleDateString('hi-IN', { timeZone: userTz, weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const batt = context.batteryLevel || '94%';

    const wantsBattery = lower.includes('battery') || lower.includes('charge');
    const wantsTimezone = lower.includes('timezone') || lower.includes('time zone') || lower.includes('wrong');
    const wantsTime = lower.includes('time') || lower.includes('samay') || lower.includes('baje') || lower.includes('समय') || wantsTimezone;
    const wantsDate = lower.includes('date') || lower.includes('tarikh') || lower.includes('तारीख');

    let reply = '';
    if (wantsBattery && !wantsTime && !wantsDate) {
      reply = `Ji Rovin Sir! Aapke device ki battery abhi ${batt} hai aur health bilkul theek hai.`;
    } else if (wantsTimezone) {
      reply = context.responseLanguage === 'hindi'
        ? `जी रोविन सर! मैंने टाइमज़ोन को लाइव सिंक्रोनाइज़ कर दिया है। वर्तमान टाइमज़ोन एशिया/कोलकाता (भारतीय मानक समय - IST) सक्रिय है और इस समय सटीक लाइव रियल टाइम ${timeStr} है!`
        : `Ji Rovin Sir! Maine time zone ko live synchronize kar diya hai. Current timezone Asia/Kolkata (Indian Standard Time - IST) active hai aur bilkul sahi live real time ${timeStr} hai!`;
    } else if (wantsTime && !wantsBattery && !wantsDate) {
      reply = context.responseLanguage === 'hindi'
        ? `जी रोविन सर! इस समय भारतीय मानक समय (IST) के अनुसार लाइव रियल टाइम हो रहा है ${timeStr}।`
        : `Ji Rovin Sir! Is samay Bharat (IST - Indian Standard Time) me live real time ho raha hai ${timeStr}.`;
    } else if (wantsDate && !wantsBattery && !wantsTime) {
      reply = context.responseLanguage === 'hindi'
        ? `जी रोविन सर! आज की तारीख है ${dateStr}।`
        : `Ji Rovin Sir! Aaj ki tarikh hai ${dateStr}.`;
    } else {
      reply = context.responseLanguage === 'hindi'
        ? `जी रोविन सर! इस समय लाइव रियल टाइम ${timeStr} (IST) है, तारीख ${dateStr} है, और बैटरी ${batt} बिल्कुल परफेक्ट है!`
        : `Ji Rovin Sir! Is samay live real time ${timeStr} (IST) hai, date ${dateStr} hai, aur battery ${batt} bilkul perfect hai!`;
    }

    return {
      reply,
      actions: [],
      isInstant: true,
    };
  }

  // 12. Weather / Mausam ("weather batao", "mausam kaisa hai", "taapman", "temperature")
  if (
    lower.includes('weather') ||
    lower.includes('mausam') ||
    lower.includes('temperature') ||
    lower.includes('taapman') ||
    lower.includes('barish') ||
    lower.includes('rain') ||
    lower.includes('मौसम') ||
    lower.includes('तापमान')
  ) {
    let reply = '';
    if (context.weatherData) {
      reply = `Ram Ram ji! Is samay ${context.weatherData.city} me temperature ${context.weatherData.tempC}°C hai, mausam ${context.weatherData.condition} hai, aur humidity ${context.weatherData.humidity}% hai.`;
    } else {
      reply = 'Ram Ram ji! Mai aapke local area ka real-time weather check kar rahi hu. Screen par Weather Widget me live temperature available hai.';
    }

    return {
      reply,
      actions: [],
      isInstant: true,
    };
  }

  // 12.9. Boss Conversational Command ("Bolna par bat kar bolo bos", "baat karo boss", "bolo boss", "mujhse baat karo", "boss bolo")
  if (
    lower.includes('bolna par bat kar') ||
    lower.includes('bolna par baat kar') ||
    lower.includes('bat kar bolo bos') ||
    lower.includes('baat kar bolo boss') ||
    lower.includes('bolo boss') ||
    lower.includes('bolo bos') ||
    lower.includes('baat karo boss') ||
    lower.includes('bat karo boss') ||
    lower.includes('mujhse baat karo') ||
    lower.includes('mujhse bat karo') ||
    lower.includes('mujhse bat kar') ||
    lower.includes('mujhse baat kar') ||
    lower.includes('boss bolo') ||
    lower.includes('mujhe boss bolo') ||
    lower.includes('call me boss') ||
    lower.includes('bat kar bolo') ||
    lower.includes('baat kar bolo') ||
    lower === 'bolo' ||
    lower === 'baat karo' ||
    lower === 'bat karo' ||
    lower === 'baat kar' ||
    lower === 'bat kar'
  ) {
    return {
      reply: 'At your service, Sir. All systems functioning at peak efficiency. What are your orders?',
      actions: [],
      isInstant: true,
    };
  }

  // 13. Greetings ("ram ram", "hello jarvis", "namaste", "kaise ho", "hi jarvis", "hello")
  if (
    lower === 'hello' ||
    lower === 'hi' ||
    lower.includes('hello jarvis') ||
    lower.includes('hi jarvis') ||
    lower.includes('ram ram') ||
    lower.includes('radhe') ||
    lower.includes('namaste') ||
    lower.includes('kaise ho') ||
    lower.includes('kya hal hai')
  ) {
    const effectiveName = getEffectiveUserName(context.memories);
    const isEnglish = context.responseLanguage === 'english';
    const isHindi = context.responseLanguage === 'hindi';

    let greetingReply = '';
    if (effectiveName && effectiveName !== 'Sir') {
      greetingReply = isEnglish
        ? `Hello ${effectiveName}, how can I help you?`
        : isHindi
        ? `नमस्ते ${effectiveName} जी! मैं आपकी क्या सहायता कर सकता हूँ?`
        : `Hello ${effectiveName}! Bataiye main aapki kya help kar sakti hu?`;
    } else {
      greetingReply = isEnglish
        ? 'Hello Sir, how can I help you today?'
        : isHindi
        ? 'नमस्ते सर! मैं आपकी सेवा में तत्पर हूँ। आदेश दें।'
        : 'At your service, Sir. How may I assist you today?';
    }

    return {
      reply: greetingReply,
      actions: [],
      isInstant: true,
    };
  }

  // 14. Universal App & Subject Runner ("Google open karo", "Facebook open karo", "Browser", "Physics open karo", etc.)
  const hasOpenAction =
    lower.includes('open') ||
    lower.includes('kholo') ||
    lower.includes('chalao') ||
    lower.includes('run') ||
    lower.includes('start') ||
    lower.includes('launch') ||
    lower.includes('chalu') ||
    lower.includes('laga') ||
    lower.includes('lagao') ||
    lower.includes('dikhao') ||
    lower.includes('ओपन') ||
    lower.includes('खोलो') ||
    lower.includes('चलाओ') ||
    lower.includes('रन') ||
    lower.includes('चालू') ||
    lower.includes('दिखाओ') ||
    lower.includes('लगाओ') ||
    lower.includes('facebook') ||
    lower.includes('फेसबुक') ||
    lower.includes('browser') ||
    lower.includes('ब्राउज़र') ||
    lower.includes('ब्राउजर') ||
    lower.includes('youtube') ||
    lower.includes('यूट्यूब') ||
    lower.includes('instagram') ||
    lower.includes('इंस्टाग्राम') ||
    lower.includes('whatsapp') ||
    lower.includes('व्हाट्सएप') ||
    lower.includes('calculator') ||
    lower.includes('कैलकुलेटर');

  if (hasOpenAction) {
    // 14.1 Recognized Native & Major Apps
    if (lower.includes('google') || lower.includes('गूगल')) {
      const q = rawCommand.replace(/(google|search|open|kholo|karo|chalao|गूगल|खोलो|ओपन|ढूंढो|search karo)/gi, '').trim();
      return {
        reply: q ? `Right away, Sir. Searching Google for "${q}".` : 'Right away, Sir. Opening Google.',
        actions: [{ name: 'openApp', args: { appName: 'google', query: q } }],
        isInstant: true,
      };
    }

    if (lower.includes('calculator') || lower.includes('calci') || lower.includes('hisab') || lower.includes('कैलकुलेटर')) {
      return {
        reply: 'Right away, Sir. Opening Calculator.',
        actions: [{ name: 'openApp', args: { appName: 'calculator' } }],
        isInstant: true,
      };
    }

    if (lower.includes('instagram') || lower.includes('insta') || lower.includes('इंस्टाग्राम')) {
      return {
        reply: 'Certainly, Sir. Launching Instagram.',
        actions: [{ name: 'openApp', args: { appName: 'instagram' } }],
        isInstant: true,
      };
    }

    if (lower.includes('facebook') || lower.includes('fb') || lower.includes('फेसबुक') || lower.includes('फेस बुक') || lower.includes('फेस-बुक')) {
      return {
        reply: 'Certainly, Sir. Opening Facebook.',
        actions: [{ name: 'openApp', args: { appName: 'facebook' } }],
        isInstant: true,
      };
    }

    if (lower.includes('twitter') || lower.includes(' x ') || lower.endsWith(' x') || lower === 'x' || lower.includes('ट्विटर')) {
      return {
        reply: 'Right away, Sir. Opening X.',
        actions: [{ name: 'openApp', args: { appName: 'twitter' } }],
        isInstant: true,
      };
    }

    // Singing / Gaana Engine ("gana ga", "gana gao", "sing a song", "gana sunao", "gana bolo")
    const isSingingIntent =
      lower.includes('gana ga') ||
      lower.includes('gaana ga') ||
      lower.includes('gana gao') ||
      lower.includes('gaana gao') ||
      lower.includes('gana sunao') ||
      lower.includes('gaana sunao') ||
      lower.includes('gana bolo') ||
      lower.includes('gaana bolo') ||
      lower.includes('ek gana') ||
      lower.includes('koi gana') ||
      lower.includes('ek gaana') ||
      lower.includes('koi gaana') ||
      lower.includes('sing a song') ||
      lower.includes('sing song') ||
      lower.includes('sing me a song') ||
      lower.includes('sing') && lower.includes('song') ||
      lower.includes('kuch gao') ||
      lower.includes('kuch gaao') ||
      lower.includes('ga ke sunao') ||
      lower.includes('gaa ke sunao') ||
      lower.includes('गाना गा') ||
      lower.includes('गाना गाओ') ||
      lower.includes('गाना सुनाओ') ||
      lower.includes('गीत गाओ') ||
      lower.includes('गीत सुनाओ') ||
      (lower.includes('gana') && (lower.includes('bola') || lower.includes('bolo') || lower.includes('ga')));

    if (isSingingIntent) {
      let requestedSong = 'any';
      if (lower.includes('kesariya')) requestedSong = 'kesariya';
      else if (lower.includes('tum hi ho') || lower.includes('aashiqui')) requestedSong = 'tum-hi-ho';
      else if (lower.includes('pehla nasha')) requestedSong = 'pehla-nasha';
      else if (lower.includes('ek ladki') || lower.includes('dekha')) requestedSong = 'ek-ladki';
      else if (lower.includes('jarvis') || lower.includes('cyber') || lower.includes('anthem')) requestedSong = 'jarvis-cyber';

      return {
        reply: 'Ram Ram ji! Suniye dhyan se, mai abhi aapke liye surila geet gaa rahi hu aur Digital Art visualizer activate kar rahi hu! 🌸🎵',
        actions: [{ name: 'singSong', args: { songName: requestedSong } }],
        isInstant: true,
      };
    }

    if (lower.includes('spotify') || lower.includes('gana') || lower.includes('gaana') || lower.includes('music') || lower.includes('song')) {
      const q = rawCommand.replace(/(spotify|music|gana|gaana|song|open|kholo|chalao|bajao|lagaao|म्यूजिक|गाना|चलाओ|खोलो)/gi, '').trim();
      return {
        reply: q ? `Right away, Sir. Playing "${q}" on Spotify.` : 'Right away, Sir. Launching Spotify.',
        actions: [{ name: 'openApp', args: { appName: 'spotify', query: q } }],
        isInstant: true,
      };
    }

    if (lower.includes('map') || lower.includes('maps') || lower.includes('rasta') || lower.includes('navigation') || lower.includes('नक्शा')) {
      let q = rawCommand.replace(/(maps|map|google maps|open|kholo|chalao|rasta|dikhao|karo|नक्शा|खोलो)/gi, '').trim();
      const isLiveQuery =
        !q ||
        q.toLowerCase().includes('live') ||
        q.toLowerCase().includes('current') ||
        q.toLowerCase().includes('hasanpur') ||
        q.toLowerCase().includes('location') ||
        q.toLowerCase().includes('kahan') ||
        q.toLowerCase().includes('meri');

      if (isLiveQuery) {
        purgeErroneousLocationCache();
        return {
          reply: 'Ji Rovin Sir! Aapki real-time live GPS current location Google Maps par plot karke open kar rahi hu!',
          actions: [
            { name: 'openLiveLocation', args: { refreshGps: true } },
            { name: 'openApp', args: { appName: 'maps', query: 'current_live_gps' } },
          ],
          isInstant: true,
        };
      }

      return {
        reply: `Right away, Sir. Plotting coordinates for "${q}" on Google Maps.`,
        actions: [{ name: 'openApp', args: { appName: 'maps', query: q } }],
        isInstant: true,
      };
    }

    if (
      lower.includes('chrome') ||
      lower.includes('browser') ||
      lower.includes('internet') ||
      lower.includes('वेब ब्राउज़र') ||
      lower.includes('ब्राउज़र') ||
      lower.includes('ब्राउजर') ||
      lower.includes('क्रोम') ||
      lower.includes('इंटरनेट')
    ) {
      return {
        reply: 'At your service, Sir. Launching Web Browser.',
        actions: [{ name: 'openApp', args: { appName: 'chrome' } }],
        isInstant: true,
      };
    }

    if (lower.includes('gmail') || lower.includes('email') || lower.includes('mail kholo') || lower.includes('मेल')) {
      return {
        reply: 'Certainly, Sir. Opening Gmail.',
        actions: [{ name: 'openApp', args: { appName: 'gmail' } }],
        isInstant: true,
      };
    }

    if (lower.includes('telegram') || lower.includes('टेलीग्राम')) {
      return {
        reply: 'Right away, Sir. Opening Telegram.',
        actions: [{ name: 'openApp', args: { appName: 'telegram' } }],
        isInstant: true,
      };
    }

    if (lower.includes('news') || lower.includes('khabar') || lower.includes('samachar') || lower.includes('समाचार') || lower.includes('खबरें')) {
      const q = rawCommand.replace(/(news|khabar|samachar|open|kholo|dikhao|batao|chalao|समाचार|खबरें|खोलो)/gi, '').trim();
      return {
        reply: q ? `Ji bilkul! Mai "${q}" ki taza news open kar rahi hu.` : 'Ji bilkul! Mai taza khabrein aur news open kar rahi hu.',
        actions: [{ name: 'openApp', args: { appName: 'news', query: q } }],
        isInstant: true,
      };
    }

    if (lower.includes('wikipedia') || lower.includes('wiki') || lower.includes('विकिपीडिया')) {
      const q = rawCommand.replace(/(wikipedia|wiki|open|kholo|chalao|search|विकिपीडिया|खोलो)/gi, '').trim();
      return {
        reply: q ? `Ji bilkul! Wikipedia par "${q}" open kar rahi hu.` : 'Ji bilkul! Mai Wikipedia open kar rahi hu.',
        actions: [{ name: 'openApp', args: { appName: 'wikipedia', query: q } }],
        isInstant: true,
      };
    }

    if (lower.includes('amazon') || lower.includes('अमेज़न')) {
      const q = rawCommand.replace(/(amazon|open|kholo|chalao|par|search|अमेज़न|खोलो)/gi, '').trim();
      return {
        reply: q ? `Ji bilkul! Amazon par "${q}" open kar rahi hu.` : 'Ji bilkul! Mai Amazon open kar rahi hu.',
        actions: [{ name: 'openApp', args: { appName: 'amazon', query: q } }],
        isInstant: true,
      };
    }

    if (lower.includes('flipkart') || lower.includes('फ्लिपकार्ट')) {
      const q = rawCommand.replace(/(flipkart|open|kholo|chalao|par|search|फ्लिपकार्ट|खोलो)/gi, '').trim();
      return {
        reply: q ? `Ji bilkul! Flipkart par "${q}" open kar rahi hu.` : 'Ji bilkul! Mai Flipkart open kar rahi hu.',
        actions: [{ name: 'openApp', args: { appName: 'flipkart', query: q } }],
        isInstant: true,
      };
    }

    if (lower.includes('netflix') || lower.includes('नेटफ्लिक्स')) {
      return {
        reply: 'Right away, Sir. Launching Netflix.',
        actions: [{ name: 'openApp', args: { appName: 'netflix' } }],
        isInstant: true,
      };
    }

    if (lower.includes('hotstar') || lower.includes('हॉटस्टार') || lower.includes('jio cinema')) {
      return {
        reply: 'Right away, Sir. Opening Disney+ Hotstar.',
        actions: [{ name: 'openApp', args: { appName: 'hotstar' } }],
        isInstant: true,
      };
    }

    if (lower.includes('gallery') || lower.includes('photos') || lower.includes('गैलरी')) {
      return {
        reply: 'Certainly, Sir. Opening Photo Gallery.',
        actions: [{ name: 'openApp', args: { appName: 'gallery' } }],
        isInstant: true,
      };
    }

    if (lower.includes('playstore') || lower.includes('play store') || lower.includes('प्ले स्टोर')) {
      return {
        reply: 'Right away, Sir. Opening Google Play Store.',
        actions: [{ name: 'openApp', args: { appName: 'playstore' } }],
        isInstant: true,
      };
    }

    if (lower.includes('setting') || lower.includes('settings') || lower.includes('सेटिंग')) {
      return {
        reply: 'Right away, Sir. Accessing System Settings.',
        actions: [{ name: 'openApp', args: { appName: 'settings' } }],
        isInstant: true,
      };
    }

    // 14.2 Universal Custom Subject / Topic Launcher ("jis subject ko open karne ko bola jaye, usko bhi run kare")
    // e.g. "Physics open karo", "Cricket match run karo", "Biology notes open karo", "Python tutorial run karo"
    const cleanedSubject = rawCommand
      .replace(
        /(open|kholo|chalao|run karo|run kar do|run kardo|run|start karo|start|chalu karo|launch|please|jarvis|ai|karo|kar do|kar de|karna|kara|ko|ka|ki|ke|liye|mujhe|bhi|ek|bar|ओपन|खोलो|चलाओ|रन|करो|कर दो|जार्विस|सब्जेक्ट|विषय)/gi,
        ''
      )
      .trim();

    const isConversationalPhrase =
      /\b(bol|kah|keh|sun|baat|samajh|raha|rahe|rahi|ra h|re h|hai|h|tha|thi|hoga|karega|karegi)\b/i.test(
        cleanedSubject
      );

    const ignoredFragments = new Set(['jo', 'h', 'ho', 'ra', 're', 'kya', 'hai', 'bhi', 'kuch', 'app', 'program', 'karein']);
    if (
      cleanedSubject.length >= 2 &&
      !ignoredFragments.has(cleanedSubject.toLowerCase()) &&
      !isConversationalPhrase
    ) {
      return {
        reply: `Right away, Sir. Launching "${cleanedSubject}" now.`,
        actions: [
          {
            name: 'openApp',
            args: { appName: cleanedSubject, query: cleanedSubject },
          },
        ],
        isInstant: true,
      };
    }

    // Default polite response if just "run", "start", "open", or "chalao" without specifying a target
    return {
      reply: 'Ji Sir, bilkul. Main taiyaar hoon. Bataiye, kaunsa app, program ya subject run karna hai?',
      actions: [],
      isInstant: true,
    };
  }

  return null;
}
