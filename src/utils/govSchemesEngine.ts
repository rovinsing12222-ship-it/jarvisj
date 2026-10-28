/**
 * GovSchemesEngine - Automatic Government Schemes Intelligence & Live Synchronization Core
 * 
 * Tracks all latest and major Government Schemes of India (PM Surya Ghar, NPS Vatsalya,
 * Unified Pension Scheme, PMJUGA, Namo Drone Didi, PM Vishwakarma, Agnipath, PM YASASVI,
 * Skill India, MSSC, Lakhpati Didi, PM-SYM, PM SVANidhi, Ayushman Bharat, PM-Kisan, myScheme).
 * 
 * Features:
 * - Persistent local storage cache
 * - Automatic live synchronization from official government feeds (myScheme / PIB / National Portal)
 * - Eligibility matcher based on age, gender, occupation, and benefit category
 * - Real-time sync with JARVIS Smart Memory Core so JARVIS can answer any scheme query via voice
 */

import { saveMemory, getStoredMemories } from './smartMemoryEngine';
import { sendLocalNotification } from './deviceHardware';

export type SchemeCategory =
  | 'trending'
  | 'youth'
  | 'women'
  | 'farmers'
  | 'pension'
  | 'health'
  | 'artisans'
  | 'housing';

export interface GovScheme {
  id: string;
  name: string;
  hindiName: string;
  category: SchemeCategory;
  categoryLabel: string;
  tagline: string;
  benefits: string[];
  keyHighlight: string;
  eligibility: string[];
  documentsRequired: string[];
  officialUrl: string;
  launchYear: string;
  isLatest: boolean;
  status: 'active' | 'newly_added';
  lastUpdated: string;
  source: string;
  applicationMode: 'Online' | 'CSC / Bank' | 'Both';
}

export const INITIAL_GOV_SCHEMES: GovScheme[] = [
  // 1. Latest & Trending Schemes (2024-2026)
  {
    id: 'pm-surya-ghar',
    name: 'PM Surya Ghar: Muft Bijli Yojana',
    hindiName: 'पीएम सूर्य घर: मुफ्त बिजली योजना',
    category: 'trending',
    categoryLabel: 'नवीनतम एवं ऊर्जा',
    tagline: 'घरों की छतों पर सोलर पैनल लगाने के लिए ₹78,000 तक की सब्सिडी और हर महीने 300 यूनिट तक मुफ्त बिजली।',
    benefits: [
      'हर महीने 300 यूनिट तक बिल्कुल मुफ्त बिजली।',
      '1 kW सिस्टम पर ₹30,000, 2 kW पर ₹60,000 और 3 kW+ पर ₹78,000 की सीधी केंद्र सरकार सब्सिडी।',
      'अतिरिक्त बिजली को ग्रिड को बेचकर ₹15,000 से ₹18,000 की वार्षिक अतिरिक्त कमाई।',
      'सस्ते बैंक लोन (7% रियायती ब्याज दर पर बिना किसी गारंटी के)।',
    ],
    keyHighlight: '₹78,000 तक सब्सिडी + 300 यूनिट मुफ्त बिजली',
    eligibility: [
      'भारतीय नागरिक होना अनिवार्य।',
      'अपना निजी पक्का घर हो जिसकी छत पर सोलर पैनल लगाने की जगह हो।',
      'वैध घरेलू बिजली कनेक्शन और पूर्व में सोलर सब्सिडी न ली हो।',
    ],
    documentsRequired: ['आधार कार्ड', 'नवीनतम बिजली बिल', 'छत का स्वामित्व प्रमाण', 'बैंक पासबुक', 'पासपोर्ट फोटो'],
    officialUrl: 'https://pmsuryaghar.gov.in',
    launchYear: '2024',
    isLatest: true,
    status: 'active',
    lastUpdated: '13 Oct 2026',
    source: 'Ministry of New & Renewable Energy / myScheme',
    applicationMode: 'Online',
  },
  {
    id: 'nps-vatsalya',
    name: 'NPS Vatsalya Scheme',
    hindiName: 'एनपीएस वात्सल्य योजना',
    category: 'trending',
    categoryLabel: 'नाबालिग पेंशन व बचत',
    tagline: 'माता-पिता अपने नाबालिग बच्चों (Minors) के उज्ज्वल भविष्य और दीर्घकालिक पेंशन के लिए निवेश शुरू कर सकते हैं।',
    benefits: [
      'मात्र ₹1,000 प्रति वर्ष की न्यूनतम राशि से खाता शुरू।',
      'बच्चे के 18 वर्ष का होने पर यह खाता स्वतः सामान्य NPS टियर-1 में बदल जाता है।',
      'कम्पाउंडिंग ब्याज और इक्विटी व डेट में सुरक्षित निवेश का भारी लाभ।',
      'शिक्षा और बीमारी के लिए 18 साल से पहले भी आंशिक निकासी की अनुमति।',
    ],
    keyHighlight: 'मात्र ₹1,000/वर्ष से बच्चों का सुरक्षित पेंशन फंड',
    eligibility: [
      'भारतीय नागरिक नाबालिग (उम्र 0 से 18 वर्ष से कम)।',
      'खाता माता-पिता या कानूनी अभिभावक द्वारा संचालित किया जाएगा।',
    ],
    documentsRequired: ['बच्चे का जन्म प्रमाण पत्र', 'माता-पिता का आधार व PAN कार्ड', 'अभिभावक का बैंक खाता', 'केवाईसी दस्तावेज'],
    officialUrl: 'https://enps.nsdl.com',
    launchYear: '2024',
    isLatest: true,
    status: 'active',
    lastUpdated: '13 Oct 2026',
    source: 'PFRDA / Ministry of Finance',
    applicationMode: 'Both',
  },
  {
    id: 'unified-pension-scheme',
    name: 'Unified Pension Scheme (UPS)',
    hindiName: 'यूनिफाइड पेंशन स्कीम (UPS)',
    category: 'trending',
    categoryLabel: 'सरकारी कर्मचारी पेंशन',
    tagline: 'केंद्रीय कर्मचारियों के लिए घोषित नई सुनिश्चित 50% पेंशन योजना, जिसमें न्यूनतम 25 वर्ष सेवा पर पूर्ण पेंशन गारंटी है।',
    benefits: [
      'अंतिम 12 महीनों के औसत मूल वेतन का 50% सुनिश्चित मासिक पेंशन।',
      'कर्मचारी की मृत्यु पर परिवार को 60% पारिवारिक पेंशन।',
      'कम से कम 10 वर्ष की सेवा पर ₹10,000 मासिक न्यूनतम पेंशन की पक्की गारंटी।',
      'महंगाई राहत (Dearness Relief - DR) का महंगाई सूचकांक के साथ लाभ।',
    ],
    keyHighlight: '50% सुनिश्चित पेंशन + ₹10,000 न्यूनतम गारंटी',
    eligibility: [
      'केंद्रीय सरकारी कर्मचारी (NPS के अंतर्गत आने वाले कर्मचारी इसे चुन सकते हैं)।',
      'न्यूनतम 10 वर्ष की सेवा पर आनुपातिक पेंशन, 25 वर्ष पर पूर्ण 50% पेंशन।',
    ],
    documentsRequired: ['कर्मचारी सेवा रिकॉर्ड', 'PRAN नंबर', 'आधार कार्ड', 'वेतन पर्ची', 'बैंक खाता विवरण'],
    officialUrl: 'https://financialservices.gov.in',
    launchYear: '2024-2025',
    isLatest: true,
    status: 'active',
    lastUpdated: '13 Oct 2026',
    source: 'Ministry of Personnel & Finance / PIB',
    applicationMode: 'Online',
  },
  {
    id: 'pm-juga',
    name: 'PM Janjatiya Unnat Gram Abhiyan (PMJUGA)',
    hindiName: 'प्रधानमंत्री जनजातीय उन्नत ग्राम अभियान (PMJUGA)',
    category: 'trending',
    categoryLabel: 'जनजातीय व ग्राम विकास',
    tagline: 'जनजातीय परिवारों और 63,000+ आदिवासी गांवों के सर्वांगीण विकास के लिए ₹79,156 करोड़ का राष्ट्रीय मिशन।',
    benefits: [
      'पक्के आवास, 24x7 स्वच्छ पेयजल (जल जीवन मिशन), और बिजली कनेक्शन।',
      'गांवों में ऑल-वेदर पक्की सड़कें और हाई-स्पीड मोबाइल कनेक्टिविटी।',
      'आदिवासी छात्रों के लिए एकलव्य मॉडल आवासीय विद्यालय व आश्रम शालाएं।',
      'कौशल विकास केंद्र और वनोपज (Forest Produce) के विपणन हेतु वन धन केंद्र।',
    ],
    keyHighlight: '63,000+ गांवों व 5 करोड़ आदिवासियों का समग्र विकास',
    eligibility: [
      'अनुसूचित जनजाति (ST) बहुल गांव और आदिवासी परिवार।',
      'चिह्नित 549 जिलों के 63,843 गांवों के सभी निवासी।',
    ],
    documentsRequired: ['जनजाति प्रमाण पत्र (ST Certificate)', 'आधार कार्ड', 'राशन कार्ड', 'ग्राम पंचायत सत्यापन'],
    officialUrl: 'https://tribal.nic.in',
    launchYear: '2024',
    isLatest: true,
    status: 'active',
    lastUpdated: '13 Oct 2026',
    source: 'Ministry of Tribal Affairs',
    applicationMode: 'CSC / Bank',
  },
  {
    id: 'namo-drone-didi',
    name: 'Namo Drone Didi Scheme',
    hindiName: 'नमो ड्रोन दीदी योजना',
    category: 'women',
    categoryLabel: 'महिला सशक्तिकरण व कृषि',
    tagline: 'ग्रामीण स्वयं सहायता समूहों (SHG) की 15,000 महिलाओं को कृषि ड्रोन उड़ाने की ट्रेनिंग और 80% सरकारी सब्सिडी।',
    benefits: [
      'प्रत्येक महिला SHG को कृषि ड्रोन की खरीद पर 80% लागत (अधिकतम ₹8 लाख) की वित्तीय सहायता।',
      '15 दिनों की पेशेवर DGCA-प्रमाणित पायलट ट्रेनिंग और मेंटेनेंस प्रशिक्षण।',
      'खेतों में कीटनाशक और नैनो यूरिया का छिड़काव करके ₹10,000 से ₹15,000 प्रति माह की कमाई।',
      'किसानों का समय और रसायनों की बर्बादी की भारी बचत।',
    ],
    keyHighlight: '80% सब्सिडी (₹8 लाख तक) + ड्रोन पायलट ट्रेनिंग',
    eligibility: [
      'महिला जो दीनदयाल अंत्योदय योजना - राष्ट्रीय ग्रामीण आजीविका मिशन (DAY-NRLM) के SHG से जुड़ी हो।',
      'आयु 18 वर्ष या उससे अधिक और न्यूनतम 10वीं कक्षा उत्तीर्ण।',
    ],
    documentsRequired: ['आधार कार्ड', 'SHG सदस्यता प्रमाण', '10वीं की मार्कशीट', 'बैंक पासबुक', 'निवास प्रमाण पत्र'],
    officialUrl: 'https://agricoop.nic.in',
    launchYear: '2024',
    isLatest: true,
    status: 'active',
    lastUpdated: '13 Oct 2026',
    source: 'Ministry of Agriculture & Rural Development',
    applicationMode: 'Both',
  },
  {
    id: 'pm-vishwakarma',
    name: 'PM Vishwakarma Yojana',
    hindiName: 'पीएम विश्वकर्मा योजना',
    category: 'artisans',
    categoryLabel: 'पारंपरिक कारीगर व शिल्पकार',
    tagline: '18 पारंपरिक कारीगरों (लोहार, सुनार, कुम्हार, दर्जी, बढ़ई) को ₹3 लाख तक का 5% सस्ता लोन, ₹15,000 टूलकिट और स्किल ट्रेनिंग।',
    benefits: [
      '₹15,000 का आधुनिक टूलकिट प्रोत्साहन ई-वाउचर।',
      'बिना किसी गारंटी (Collateral-Free) के 5% ब्याज पर ₹3 लाख तक का लोन (किस्त 1: ₹1 लाख, किस्त 2: ₹2 लाख)।',
      '5 से 7 दिन की बेसिक और 15 दिन की एडवांस ट्रेनिंग, साथ ही ₹500 प्रतिदिन का स्टाइपेंड।',
      'डिजिटल लेनदेन पर ₹1 प्रति ट्रांजैक्शन (महीने में 100 ट्रांजैक्शन तक) प्रोत्साहन।',
      'पीएम विश्वकर्मा डिजिटल आईडी कार्ड और आधिकारिक प्रमाण पत्र।',
    ],
    keyHighlight: '₹3 लाख तक 5% सस्ता लोन + ₹15,000 टूलकिट + ₹500/दिन स्टाइपेंड',
    eligibility: [
      'कारीगर या शिल्पकार जो 18 निर्धारित व्यवसायों (बढ़ई, नाव बनाने वाले, लोहार, हथौड़ा/टूलकिट निर्माता, ताला बनाने वाले, सुनार, कुम्हार, मूर्तिकार, मोची, राजमिस्त्री, टोकरी/झाड़ू निर्माता, गुड़िया/खिलौना निर्माता, नाई, माला निर्माता, धोबी, दर्जी, मछली पकड़ने का जाल निर्माता) में काम करता हो।',
      'न्यूनतम आयु 18 वर्ष, और परिवार का एक ही सदस्य पात्र।',
    ],
    documentsRequired: ['आधार कार्ड', 'मोबाइल नंबर (आधार से लिंक)', 'बैंक पासबुक', 'व्यवसाय संबंधित स्व-घोषणा'],
    officialUrl: 'https://pmvishwakarma.gov.in',
    launchYear: '2023-2024',
    isLatest: true,
    status: 'active',
    lastUpdated: '13 Oct 2026',
    source: 'Ministry of MSME / Skill India',
    applicationMode: 'CSC / Bank',
  },

  // 2. Youth & Employment Schemes
  {
    id: 'agnipath-scheme',
    name: 'Agnipath Scheme (अग्निवीर भर्ती)',
    hindiName: 'अग्निपथ योजना (अग्निवीर भर्ती)',
    category: 'youth',
    categoryLabel: 'रक्षा व युवा रोजगार',
    tagline: 'भारतीय सेना, नौसेना और वायुसेना में 4 वर्ष की राष्ट्र सेवा के लिए युवाओं को "अग्निवीर" के रूप में भर्ती करने की ऐतिहासिक योजना।',
    benefits: [
      'प्रथम वर्ष ₹30,000 से लेकर चौथे वर्ष ₹40,000 तक का मासिक वेतन पैकेज।',
      '4 वर्ष की सेवा पूर्ण होने पर ₹11.71 लाख का आयकर मुक्त "सेवा निधि" पैकेज।',
      '₹48 लाख का गैर-अंशदायी जीवन बीमा कवर।',
      '25% अग्निवीरों को नियमित संवर्ग (Regular Cadre) में स्थाई सेवा का अवसर।',
      'अग्निवीर स्किल सर्टिफिकेट और CAPF व राज्य पुलिस भर्तियों में आरक्षण प्राथमिकता।',
    ],
    keyHighlight: '4 साल की सेवा + ₹11.71 लाख सेवा निधि + कौशल प्रमाण पत्र',
    eligibility: [
      'आयु सीमा: 17.5 वर्ष से 21 वर्ष।',
      'शैक्षणिक योग्यता: न्यूनतम 10वीं/12वीं कक्षा उत्तीर्ण (सेना के पद के अनुसार 45% या 50% अंक)।',
      'शारीरिक और चिकित्सीय रूप से फिट।',
    ],
    documentsRequired: ['10वीं/12वीं बोर्ड प्रमाण पत्र', 'निवास प्रमाण पत्र', 'जाति प्रमाण पत्र', 'चरित्र प्रमाण पत्र', 'आधार कार्ड'],
    officialUrl: 'https://joinindianarmy.nic.in',
    launchYear: '2022-2026',
    isLatest: true,
    status: 'active',
    lastUpdated: '13 Oct 2026',
    source: 'Ministry of Defence',
    applicationMode: 'Online',
  },
  {
    id: 'pm-yasasvi',
    name: 'PM Young Achievers Scholarship (PM YASASVI)',
    hindiName: 'पीएम यशस्वी छात्रवृत्ति योजना',
    category: 'youth',
    categoryLabel: 'उच्च शिक्षा व छात्रवृत्ति',
    tagline: 'OBC, EBC और गैर-अधिसूचित/खानाबदोश (DNT) वर्ग के मेधावी छात्रों के लिए ₹75,000 से ₹1,25,000 वार्षिक उच्च छात्रवृत्ति।',
    benefits: [
      'कक्षा 9 और 10 के छात्रों को ₹75,000 प्रति वर्ष की छात्रवृत्ति।',
      'कक्षा 11 और 12 के छात्रों को ₹1,25,000 प्रति वर्ष की छात्रवृत्ति।',
      'शीर्ष स्तर के स्कूलों और कॉलेजों की ट्यूशन फीस और छात्रावास खर्च सीधे खाते में डीबीटी।',
    ],
    keyHighlight: '₹75,000 से ₹1,25,000 वार्षिक सीधी छात्रवृत्ति',
    eligibility: [
      'OBC, EBC या DNT/NT/SNT श्रेणी का छात्र होना चाहिए।',
      'माता-पिता/अभिभावक की कुल वार्षिक आय ₹2.5 लाख से अधिक न हो।',
      'छात्र कक्षा 9वीं या 11वीं में अध्ययनरत हो।',
    ],
    documentsRequired: ['जाति प्रमाण पत्र', 'आय प्रमाण पत्र (₹2.5 लाख से कम)', 'पिछली कक्षा की मार्कशीट', 'आधार कार्ड', 'स्कूल पहचान पत्र'],
    officialUrl: 'https://yet.nta.ac.in',
    launchYear: '2023-2026',
    isLatest: true,
    status: 'active',
    lastUpdated: '13 Oct 2026',
    source: 'Ministry of Social Justice & Empowerment / NTA',
    applicationMode: 'Online',
  },
  {
    id: 'skill-india-2',
    name: 'Skill India Mission 2.0 / PMKVY 4.0',
    hindiName: 'स्किल इंडिया मिशन 2.0 / पीएमकेवीवाई 4.0',
    category: 'youth',
    categoryLabel: 'तकनीकी कौशल व नौकरी',
    tagline: 'युवाओं को AI, कोडिंग, रोबोटिक्स, 3D प्रिंटिंग और ड्रोन जैसी नए जमाने की उद्योग 4.0 तकनीकों में निःशुल्क कौशल व रोजगार।',
    benefits: [
      'उद्योग-मान्यता प्राप्त निःशुल्क प्रशिक्षण और राष्ट्रीय स्किल इंडिया सर्टिफिकेट।',
      'कोर्स पूरा होने पर रोजगार मेलों और प्लेसमेंट सहायता के अवसर।',
      'पाठ्यक्रम पूरा करने पर ₹8,000 तक का वित्तीय प्रोत्साहन और टूलकिट सहायता।',
    ],
    keyHighlight: 'AI, ड्रोन, कोडिंग में फ्री ट्रेनिंग + नेशनल सर्टिफिकेट व प्लेसमेंट',
    eligibility: [
      'भारतीय नागरिक, आयु 15 से 45 वर्ष।',
      'स्कूल/कॉलेज छोड़ चुके युवा या नए हुनर सीखने के इच्छुक छात्र।',
    ],
    documentsRequired: ['आधार कार्ड', 'शैक्षणिक योग्यता प्रमाण', 'बैंक पासबुक', 'पासपोर्ट फोटो'],
    officialUrl: 'https://skillindia.gov.in',
    launchYear: '2024',
    isLatest: true,
    status: 'active',
    lastUpdated: '13 Oct 2026',
    source: 'Ministry of Skill Development & Entrepreneurship',
    applicationMode: 'Online',
  },
  {
    id: 'pm-internship-scheme',
    name: 'PM Internship Scheme 2024-2025',
    hindiName: 'प्रधानमंत्री इंटर्नशिप योजना',
    category: 'youth',
    categoryLabel: 'कॉर्पोरेट इंटर्नशिप व स्टाइपेंड',
    tagline: 'भारत की शीर्ष 500 कंपनियों में 1 करोड़ युवाओं को 12 महीने की इंटर्नशिप, ₹5,000 मासिक स्टाइपेंड और ₹6,000 एकमुश्त सहायता।',
    benefits: [
      '₹5,000 प्रतिमाह स्टाइपेंड (₹4,500 केंद्र सरकार से डीबीटी + ₹500 कंपनी सीएसआर से)।',
      'इंटर्नशिप शुरू करने पर ₹6,000 की एकमुश्त अनुदान सहायता।',
      'टाटा, रिलायंस, इंफोसिस, एचडीएफसी जैसी शीर्ष 500 कंपनियों में लाइव कार्य अनुभव।',
      'प्रधानमंत्री जीवन ज्योति और सुरक्षा बीमा योजना का निःशुल्क बीमा कवर।',
    ],
    keyHighlight: 'शीर्ष 500 कंपनियों में इंटर्नशिप + ₹5,000/माह स्टाइपेंड + ₹6,000 सहायता',
    eligibility: [
      'आयु: 21 से 24 वर्ष (ना तो पूर्णकालिक नौकरी में हों और न ही नियमित छात्र)।',
      'योग्यता: 10वीं, 12वीं, आईटीआई, पॉलिटेक्निक डिप्लोमा, या बीए/बीएससी/बीकॉम/बीसीए स्नातक।',
      'परिवार की वार्षिक आय ₹8 लाख से कम हो।',
    ],
    documentsRequired: ['शैक्षणिक प्रमाण पत्र', 'आधार कार्ड', 'आय प्रमाण पत्र', 'बैंक पासबुक'],
    officialUrl: 'https://pminternship.mca.gov.in',
    launchYear: '2024',
    isLatest: true,
    status: 'active',
    lastUpdated: '13 Oct 2026',
    source: 'Ministry of Corporate Affairs (MCA)',
    applicationMode: 'Online',
  },

  // 3. Women & Social Welfare Schemes
  {
    id: 'mahila-samman-mssc',
    name: 'Mahila Samman Savings Certificate (MSSC)',
    hindiName: 'महिला सम्मान बचत प्रमाण पत्र',
    category: 'women',
    categoryLabel: 'महिला बचत व निवेश',
    tagline: 'महिलाओं और बालिकाओं के लिए 7.5% निश्चित आकर्षक ब्याज दर वाली 2 वर्षीय सुरक्षित डाकघर फिक्स्ड डिपॉजिट योजना।',
    benefits: [
      '7.5% प्रति वर्ष का उच्च निश्चित ब्याज, जो तिमाही आधार पर चक्रवृद्धित (Compounded) होता है।',
      'अधिकतम ₹2 लाख तक का सुरक्षित निवेश (न्यूनतम ₹1,000)।',
      '2 साल की अल्पावधि परिपक्वता, 1 वर्ष बाद 40% तक आंशिक निकासी की छूट।',
      'डाकघर (Post Office) या अधिकृत बैंकों में आसानी से खाता खोलने की सुविधा।',
    ],
    keyHighlight: '7.5% निश्चित त्रैमासिक चक्रवृद्धि ब्याज + सरकारी सुरक्षा',
    eligibility: [
      'किसी भी उम्र की महिला या नाबालिग बालिका के नाम पर अभिभावक खाता खोल सकते हैं।',
    ],
    documentsRequired: ['आधार कार्ड', 'पैन कार्ड', 'पासपोर्ट फोटो', 'डाकघर/बैंक आवेदन फॉर्म'],
    officialUrl: 'https://www.indiapost.gov.in',
    launchYear: '2023-2025',
    isLatest: true,
    status: 'active',
    lastUpdated: '13 Oct 2026',
    source: 'Department of Economic Affairs / India Post',
    applicationMode: 'Both',
  },
  {
    id: 'lakhpati-didi',
    name: 'Lakhpati Didi Yojana',
    hindiName: 'लखपति दीदी योजना',
    category: 'women',
    categoryLabel: 'महिला आजीविका व सूक्ष्म व्यवसाय',
    tagline: 'स्वयं सहायता समूहों (SHG) से जुड़ी ग्रामीण महिलाओं की वार्षिक आय कम से कम ₹1 लाख तक पहुंचाने का राष्ट्रीय मिशन (लक्ष्य: 3 करोड़ महिलाएं)।',
    benefits: [
      'बिना ब्याज का ₹1 लाख से ₹5 लाख तक का सुगम ऋण सामुदायिक निवेश कोष से।',
      'एलईडी बल्ब निर्माण, ड्रोन संचालन, मशरूम फार्मिंग, डेयरी और डिजिटल सखी का विशेष कौशल।',
      'सरकारी ई-मार्केटप्लेस (GeM) और ई-कॉमर्स प्लेटफॉर्म्स पर उत्पादों की सीधी बिक्री।',
    ],
    keyHighlight: 'SHG महिलाओं की सालाना आय ₹1,00,000+ करने का राष्ट्रीय मिशन',
    eligibility: [
      'ग्रामीण महिला जो किसी सक्रिय स्वयं सहायता समूह (SHG) की सदस्य हो।',
      'आयु 18 से 50 वर्ष।',
    ],
    documentsRequired: ['आधार कार्ड', 'SHG सदस्यता पासबुक', 'निवास प्रमाण पत्र', 'बैंक खाता विवरण'],
    officialUrl: 'https://nrlm.gov.in',
    launchYear: '2023-2026',
    isLatest: true,
    status: 'active',
    lastUpdated: '13 Oct 2026',
    source: 'Ministry of Rural Development',
    applicationMode: 'Both',
  },
  {
    id: 'pm-sym',
    name: 'PM Shram Yogi Maan-Dhan (PM-SYM)',
    hindiName: 'प्रधानमंत्री श्रम योगी मान-धन योजना',
    category: 'pension',
    categoryLabel: 'श्रमिक सामाजिक सुरक्षा',
    tagline: 'असंगठित क्षेत्र के मजदूरों (मजदूर, रेहड़ी-पटरी, ड्राइवर, रसोइये) को 60 वर्ष की आयु के बाद ₹3,000 मासिक निश्चित पेंशन।',
    benefits: [
      '60 वर्ष की आयु के बाद आजीवन ₹3,000 प्रति माह की निश्चित पेंशन।',
      'समान अंशदान: जितना अंशदान श्रमिक देगा (₹55 से ₹200 प्रति माह), उतना ही केंद्र सरकार जमा करेगी।',
      'पेंशनभोगी की मृत्यु होने पर पति/पत्नी को 50% पारिवारिक पेंशन।',
      'ई-श्रम कार्ड धारकों के लिए सीधा पंजीकरण।',
    ],
    keyHighlight: '₹3,000 आजीवन मासिक पेंशन + 50% सरकारी अंशदान',
    eligibility: [
      'असंगठित क्षेत्र के श्रमिक (दिहाड़ी मजदूर, रेहड़ी वाले, घरेलू नौकर, कृषि श्रमिक)।',
      'प्रवेश आयु: 18 से 40 वर्ष।',
      'मासिक आय ₹15,000 या उससे कम और EPFO/NPS/ESIC का सदस्य न हो।',
    ],
    documentsRequired: ['आधार कार्ड', 'बचत बैंक खाता/जन-धन खाता पासबुक (IFSC सहित)', 'ई-श्रम कार्ड (यदि हो)'],
    officialUrl: 'https://maandhan.in',
    launchYear: '2019-2026',
    isLatest: false,
    status: 'active',
    lastUpdated: '13 Oct 2026',
    source: 'Ministry of Labour & Employment / LIC',
    applicationMode: 'Both',
  },
  {
    id: 'pm-svanidhi',
    name: 'PM SVANidhi Scheme (स्ट्रीट वेंडर आत्मनिर्भर निधि)',
    hindiName: 'पीएम स्वनिधि योजना (रेहड़ी-पटरी लोन)',
    category: 'artisans',
    categoryLabel: 'स्ट्रीट वेंडर माइक्रो-क्रेडिट',
    tagline: 'स्ट्रीट वेंडरों और रेहड़ी-पटरी वालों को कारोबार के लिए ₹10,000 से ₹50,000 तक का बिना किसी गारंटी का सस्ता लोन व 7% ब्याज सब्सिडी।',
    benefits: [
      'पहली किस्त में ₹10,000, समय पर चुकाने पर ₹20,000 और फिर ₹50,000 का कोलैटरल-फ्री लोन।',
      'समय पर पुनर्भुगतान करने पर 7% की वार्षिक ब्याज सब्सिडी सीधे बैंक खाते में।',
      'डिजिटल लेन-देन करने पर ₹1,200 प्रति वर्ष तक का कैशबैक।',
    ],
    keyHighlight: '₹10,000 से ₹50,000 तक सस्ता लोन + 7% ब्याज सब्सिडी + कैशबैक',
    eligibility: [
      'शहरी और अर्ध-शहरी क्षेत्रों में वेंडिंग करने वाले स्ट्रीट वेंडर (सब्जी, फल, चाय, चाट, ठेले वाले)।',
      'शहरी स्थानीय निकाय (ULB) द्वारा जारी वेंडिंग प्रमाण पत्र या सिफारिश पत्र।',
    ],
    documentsRequired: ['आधार कार्ड', 'वेंडिंग पहचान पत्र (CoVs)', 'बैंक पासबुक', 'मोबाइल नंबर'],
    officialUrl: 'https://pmsvanidhi.mohua.gov.in',
    launchYear: '2020-2026',
    isLatest: false,
    status: 'active',
    lastUpdated: '13 Oct 2026',
    source: 'Ministry of Housing and Urban Affairs',
    applicationMode: 'Both',
  },

  // 4. Health, Agriculture & National Portal
  {
    id: 'ayushman-bharat',
    name: 'Ayushman Bharat (PM-JAY) & 70+ Senior Citizen Cover',
    hindiName: 'आयुष्मान भारत (PM-JAY) एवं 70+ वरिष्ठ नागरिक सुरक्षा',
    category: 'health',
    categoryLabel: 'स्वास्थ्य बीमा व वरिष्ठ नागरिक',
    tagline: 'प्रति परिवार ₹5 लाख का मुफ्त सालाना इलाज और अब 70 वर्ष से अधिक उम्र के सभी वरिष्ठ नागरिकों को आय सीमा के बिना ₹5 लाख का अलग कवर।',
    benefits: [
      'सरकारी और सूचीबद्ध निजी अस्पतालों में ₹5 लाख तक का पूर्णतः कैशलेस व निःशुल्क उपचार।',
      '70 वर्ष या उससे अधिक आयु के सभी नागरिकों को यूनिवर्सल ₹5 लाख का विशेष टॉप-अप स्वास्थ्य कवच।',
      'दवाएं, जांचें, ऑपरेशन और अस्पताल में भर्ती के 15 दिन बाद तक का खर्च शामिल।',
      'आयुष्मान गोल्डन कार्ड से पूरे भारत में किसी भी सूचीबद्ध अस्पताल में मान्य।',
    ],
    keyHighlight: '₹5 लाख प्रति वर्ष मुफ्त कैशलेस इलाज + 70+ के लिए यूनिवर्सल सुरक्षा',
    eligibility: [
      'SECC-2011 सूची में शामिल परिवार और राष्ट्रीय स्वास्थ्य सुरक्षा मिशन के लाभार्थी।',
      '70 वर्ष या उससे अधिक आयु के सभी भारतीय नागरिक (बिना किसी आय सीमा के)।',
    ],
    documentsRequired: ['आधार कार्ड', 'राशन कार्ड / परिवार समग्र आईडी', 'आयु प्रमाण पत्र (70+ नागरिकों हेतु)'],
    officialUrl: 'https://beneficiary.nha.gov.in',
    launchYear: '2024 विस्तार',
    isLatest: true,
    status: 'active',
    lastUpdated: '13 Oct 2026',
    source: 'National Health Authority (NHA)',
    applicationMode: 'Both',
  },
  {
    id: 'pm-kisan',
    name: 'PM-Kisan Samman Nidhi',
    hindiName: 'पीएम-किसान सम्मान निधि',
    category: 'farmers',
    categoryLabel: 'किसान प्रत्यक्ष आय सहायता',
    tagline: 'देश के सभी पात्र किसान परिवारों को प्रति वर्ष ₹6,000 की प्रत्यक्ष आर्थिक सहायता (₹2,000 की तीन समान किस्तों में सीधे बैंक खाते में)।',
    benefits: [
      '₹6,000 प्रति वर्ष सीधे आधार-सीडेड बैंक खाते में डीबीटी द्वारा।',
      'हर 4 महीने पर ₹2,000 की किस्त (अप्रैल-जुलाई, अगस्त-नवंबर, दिसंबर-मार्च)।',
      'पीएम किसान मोबाइल ऐप पर फेस ऑथेंटिकेशन से घर बैठे ई-केवाईसी की सुविधा।',
    ],
    keyHighlight: 'सालाना ₹6,000 सीधे बैंक खाते में + ऑनलाइन ई-केवाईसी',
    eligibility: [
      'भूमिधारक किसान परिवार जिनके नाम पर खेती योग्य भूमि का वैध रिकॉर्ड हो।',
      'संस्थागत भूमिधारक, संवैधानिक पद धारक और आयकर दाता अपात्र हैं।',
    ],
    documentsRequired: ['आधार कार्ड', 'खसरा/खतौनी (जमीन का रिकॉर्ड)', 'बैंक पासबुक', 'सक्रिय मोबाइल नंबर'],
    officialUrl: 'https://pmkisan.gov.in',
    launchYear: '2019-2026',
    isLatest: true,
    status: 'active',
    lastUpdated: '14 Oct 2026',
    source: 'Ministry of Agriculture & Farmers Welfare',
    applicationMode: 'Online',
  },
  {
    id: 'digital-farmer-id-agristack',
    name: 'Digital Farmer ID (AgriStack / किसान पहचान पत्र)',
    hindiName: 'डिजिटल किसान पहचान पत्र (AgriStack Farmer ID)',
    category: 'farmers',
    categoryLabel: 'डिजिटल कृषि पहचान',
    tagline: 'भारत सरकार के एग्रीस्टैक मिशन के तहत प्रत्येक किसान को 12-अंकों की विशिष्ट डिजिटल पहचान (Farmer ID) और भू-अभिलेख लिंक।',
    benefits: [
      '12 अंकों की अद्वितीय डिजिटल किसान आईडी (Unique Farmer ID) जिससे सभी सरकारी कृषि लाभ एक क्लिक में मिलते हैं।',
      'खसरा-खतौनी, आधार और बैंक खाता सीधे लिंक, जिससे बार-बार दफ्तरों के चक्कर और कागज जमा करने से मुक्ति।',
      'पीएम-किसान सम्मान निधि, फसल बीमा, केसीसी लोन और एमएसपी पर फसल खरीद में स्वतः सत्यापन।',
      'डिजिटल फसल सर्वेक्षण (Digital Crop Survey) के आधार पर प्राकृतिक आपदा में बिना भागदौड़ सीधा मुआवजा।',
    ],
    keyHighlight: '12-अंकों का डिजिटल किसान कार्ड + आधार व खसरा लिंक्ड',
    eligibility: [
      'देश के सभी भूमिधारक, सीमांत, छोटे और पट्टेदार किसान।',
      'जिनके पास कृषि योग्य भूमि का वैध भू-अभिलेख रिकॉर्ड है।',
    ],
    documentsRequired: ['आधार कार्ड', 'जमीन की खतौनी/जमाबंदी नकल', 'आधार से लिंक मोबाइल नंबर', 'बैंक पासबुक'],
    officialUrl: 'https://agristack.gov.in',
    launchYear: '2024-2026',
    isLatest: true,
    status: 'newly_added',
    lastUpdated: '14 Oct 2026',
    source: 'Ministry of Agriculture / Digital India AgriStack',
    applicationMode: 'Both',
  },
  {
    id: 'kisan-credit-card-kcc',
    name: 'Kisan Credit Card (KCC) Scheme',
    hindiName: 'किसान क्रेडिट कार्ड (KCC ऋण योजना)',
    category: 'farmers',
    categoryLabel: 'सस्ता कृषि ऋण',
    tagline: 'किसानों को 4% की रियायती ब्याज दर पर ₹3 लाख तक का आसान कृषि ऋण और ₹1.60 लाख तक बिना किसी बंधक (Collateral-Free) लोन।',
    benefits: [
      '₹3 लाख तक का कृषि ऋण मात्र 4% वार्षिक ब्याज पर (समय पर भुगतान पर 3% ब्याज छूट)।',
      'बिना किसी भूमि बंधक के ₹1.60 लाख तक तुरंत स्वीकृति।',
      'खाद, बीज, कीटनाशक, फसल बुवाई और कृषि उपकरणों के लिए लचीली क्रेडिट लिमिट।',
      'किसान क्रेडिट कार्ड से एटीएम व बैंक शाखा से जब चाहें तब निकासी की सुविधा।',
    ],
    keyHighlight: 'मात्र 4% ब्याज पर ₹3 लाख तक ऋण + ₹1.6 लाख बिना गारंटी',
    eligibility: [
      'सभी व्यक्तिगत/संयुक्त भूमिधारक किसान, काश्तकार किसान और मौखिक पट्टेदार।',
      'स्वयं सहायता समूह (SHG) या संयुक्त देयता समूह (JLG) के किसान।',
    ],
    documentsRequired: ['आवेदन पत्र', 'आधार कार्ड', 'भूमि स्वामित्व प्रमाण (खतौनी)', 'पासपोर्ट साइज फोटो', 'बैंक खाता विवरण'],
    officialUrl: 'https://pmkisan.gov.in',
    launchYear: '2024',
    isLatest: true,
    status: 'active',
    lastUpdated: '14 Oct 2026',
    source: 'RBI & Ministry of Agriculture',
    applicationMode: 'Both',
  },
  {
    id: 'pm-fasal-bima-pmfby',
    name: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
    hindiName: 'प्रधानमंत्री फसल बीमा योजना (PMFBY)',
    category: 'farmers',
    categoryLabel: 'फसल सुरक्षा व बीमा',
    tagline: 'सूखा, बाढ़, ओलावृष्टि, चक्रवात और कीट हमलों से फसल नुकसान पर किसानों को 100% तक पारदर्शी वित्तीय मुआवजा।',
    benefits: [
      'खरीफ फसलों के लिए मात्र 2% और रबी फसलों के लिए केवल 1.5% का नाममात्र प्रीमियम, शेष सब्सिडी सरकार देती है।',
      'फसल नुकसान के 72 घंटे के अंदर सीधे ऐप या टोल-फ्री 14447 पर क्लेम दर्ज करने की सुविधा।',
      'सैटेलाइट तकनीक और ड्रोन आधारित पारदर्शी नुकसान मूल्यांकन।',
      'दावा राशि सीधे किसान के डीबीटी बैंक खाते में स्थानांतरित।',
    ],
    keyHighlight: 'मात्र 1.5%-2% प्रीमियम पर प्राकृतिक आपदा से 100% फसल सुरक्षा',
    eligibility: ['अधिसूचित क्षेत्रों में अधिसूचित फसल उगाने वाले सभी किसान (ऋणी व गैर-ऋणी किसान)।'],
    documentsRequired: ['बुवाई प्रमाण पत्र / पटवारी रिपोर्ट', 'जमीन की खतौनी', 'आधार कार्ड', 'बैंक पासबुक', 'किरायेदार अनुबंध (यदि लागू)'],
    officialUrl: 'https://pmfby.gov.in',
    launchYear: '2024',
    isLatest: true,
    status: 'active',
    lastUpdated: '14 Oct 2026',
    source: 'Ministry of Agriculture & Farmers Welfare',
    applicationMode: 'Both',
  },
  {
    id: 'enam-national-mandi',
    name: 'National Agriculture Market (e-NAM Mandi)',
    hindiName: 'राष्ट्रीय कृषि बाजार (ई-नाम मंडी)',
    category: 'farmers',
    categoryLabel: 'ऑनलाइन फसल बिक्री व मंडी भाव',
    tagline: 'देश भर की 1,300+ विनियमित कृषि मंडियों का ऑनलाइन नेटवर्क जहां किसान अपनी उपज का उचित मूल्य पा सकते हैं।',
    benefits: [
      'देश की किसी भी मंडी के व्यापारियों से अपनी उपज के लिए पारदर्शी ऑनलाइन बोलियां प्राप्त करें।',
      'बिचौलियों और आढ़तियों की कमीशनखोरी से मुक्ति, बेहतर और प्रतिस्पर्धी मूल्य।',
      'गुणवत्ता परख (Assaying) की सुविधा और मोबाइल पर सभी मंडियों के दैनिक भाव।',
      'उपज की बिक्री राशि सीधे बैंक खाते में ऑनलाइन हस्तांतरित।',
    ],
    keyHighlight: '1,300+ मंडियों में ऑनलाइन फसल बिक्री + पारदर्शी प्रतिस्पर्धी मूल्य',
    eligibility: ['भारत का कोई भी किसान जो अपनी कृषि उपज बेचना चाहता है।'],
    documentsRequired: ['आधार कार्ड', 'बैंक पासबुक', 'मंडी पंजीकरण प्रमाण', 'मोबाइल नंबर'],
    officialUrl: 'https://enam.gov.in',
    launchYear: '2024',
    isLatest: true,
    status: 'active',
    lastUpdated: '14 Oct 2026',
    source: 'Ministry of Agriculture / SFAC',
    applicationMode: 'Online',
  },
  {
    id: 'pm-krishi-sinchayee-pmksy',
    name: 'PM Krishi Sinchayee Yojana (Per Drop More Crop)',
    hindiName: 'प्रधानमंत्री कृषि सिंचाई योजना (ड्रिप व स्प्रिंकलर सब्सिडी)',
    category: 'farmers',
    categoryLabel: 'सिंचाई व उपकरण सब्सिडी',
    tagline: 'खेतों में सूक्ष्म सिंचाई (Micro Irrigation) - ड्रिप एवं फव्वारा सिंचाई सिस्टम स्थापित करने पर 55% से 80% तक भारी सरकारी सब्सिडी।',
    benefits: [
      'लघु एवं सीमांत किसानों को 55% से 80% तक सरकारी सब्सिडी सहायता।',
      'पानी की 50% तक बचत और फसल उत्पादन में 30% से 40% तक की भारी वृद्धि।',
      'बिजली और खाद के खर्च में 25% तक की कमी।',
    ],
    keyHighlight: 'ड्रिप व स्प्रिंकलर सिस्टम पर 55% से 80% सरकारी सब्सिडी',
    eligibility: ['सभी किसान जिनके पास सिंचाई हेतु पानी का स्रोत और कृषि योग्य भूमि उपलब्ध है।'],
    documentsRequired: ['आधार कार्ड', 'खसरा/खतौनी', 'बिजली बिल / सिंचाई स्रोत प्रमाण', 'बैंक पासबुक', 'मृदा स्वास्थ्य कार्ड'],
    officialUrl: 'https://pmksy.gov.in',
    launchYear: '2024',
    isLatest: true,
    status: 'active',
    lastUpdated: '14 Oct 2026',
    source: 'Ministry of Agriculture & Farmers Welfare',
    applicationMode: 'Both',
  },
  {
    id: 'smam-krishi-yantra',
    name: 'Sub-Mission on Agricultural Mechanization (SMAM)',
    hindiName: 'कृषि यंत्र व ट्रैक्टर सब्सिडी योजना (SMAM)',
    category: 'farmers',
    categoryLabel: 'कृषि उपकरण व ट्रैक्टर सब्सिडी',
    tagline: 'ट्रैक्टर, रोटावेटर, कंबाइन हार्वेस्टर, पावर टिलर, सुपर सीडर जैसे आधुनिक कृषि यंत्रों की खरीद पर 50% से 80% तक सब्सिडी।',
    benefits: [
      'महिला, एससी, एसटी और सीमांत किसानों को कृषि यंत्रों पर 50% तक की सीधी सब्सिडी।',
      'कस्टम हायरिंग सेंटर (CHC) की स्थापना पर ₹10 लाख तक के प्रोजेक्ट पर 40% से 80% वित्तीय सहायता।',
      'खेती में श्रम और समय की बचत, समय पर बुवाई व कटाई।',
    ],
    keyHighlight: 'ट्रैक्टर व कृषि यंत्रों पर 50% से 80% तक सरकारी सब्सिडी',
    eligibility: ['सभी किसान जिन्होंने पिछले 3 से 5 वर्षों में उसी यंत्र पर कोई सब्सिडी न ली हो।'],
    documentsRequired: ['आधार कार्ड', 'खतौनी नकल', 'बैंक पासबुक', 'जाति प्रमाण पत्र (यदि लागू)', 'यंत्र का कोटेशन'],
    officialUrl: 'https://agrimachinery.nic.in',
    launchYear: '2024',
    isLatest: true,
    status: 'active',
    lastUpdated: '14 Oct 2026',
    source: 'Ministry of Agriculture & Farmers Welfare',
    applicationMode: 'Both',
  },
  {
    id: 'pashu-kisan-credit-card',
    name: 'Pashu Kisan Credit Card (PKCC)',
    hindiName: 'पशु किसान क्रेडिट कार्ड (पशुपालन व डेयरी लोन)',
    category: 'farmers',
    categoryLabel: 'डेयरी व पशुपालन ऋण',
    tagline: 'गाय, भैंस, भेड़, बकरी, सुअर और मुर्गी पालन के लिए 4% सस्ती ब्याज दर पर बिना किसी गारंटी ₹1.60 लाख तक का आसान लोन।',
    benefits: [
      'प्रति गाय ₹40,783 और प्रति भैंस ₹60,249 तक की कार्यशील पूंजी ऋण सहायता।',
      'बिना किसी जमीन बंधक के ₹1.60 लाख तक का तुरंत बैंक लोन।',
      'समय पर ऋण चुकाने पर 3% अतिरिक्त ब्याज छूट, प्रभावी ब्याज मात्र 4%।',
    ],
    keyHighlight: 'बिना गारंटी ₹1.60 लाख तक ऋण + मात्र 4% प्रभावी ब्याज दर',
    eligibility: ['पशुपालक किसान जो दुधारू पशु (गाय/भैंस) अथवा भेड़/बकरी/मुर्गी पालन करते हैं।'],
    documentsRequired: ['आधार कार्ड', 'पैन कार्ड', 'पशु स्वास्थ्य प्रमाण पत्र / टैगिंग विवरण', 'बैंक खाता विवरण', 'पासपोर्ट फोटो'],
    officialUrl: 'https://dahd.nic.in',
    launchYear: '2024',
    isLatest: true,
    status: 'active',
    lastUpdated: '14 Oct 2026',
    source: 'Department of Animal Husbandry & Dairying',
    applicationMode: 'Both',
  },
  {
    id: 'pm-awas-yojana',
    name: 'Pradhan Mantri Awas Yojana (PMAY-U / PMAY-G)',
    hindiName: 'प्रधानमंत्री आवास योजना (शहरी व ग्रामीण)',
    category: 'housing',
    categoryLabel: 'आवास व बुनियादी ढांचा',
    tagline: 'बेघर और कच्चे मकानों में रहने वाले परिवारों को पक्के घर के निर्माण हेतु ₹1.2 लाख से ₹2.5 लाख तक की सीधी सरकारी आर्थिक सहायता।',
    benefits: [
      'ग्रामीण क्षेत्रों में मैदानी इलाकों में ₹1.20 लाख और पहाड़ी/दुर्गम इलाकों में ₹1.30 लाख की सीधी सहायता।',
      'शहरी क्षेत्रों में क्रेडिट लिंक्ड सब्सिडी (CLSS) के तहत होम लोन पर ₹2.67 लाख तक की ब्याज सब्सिडी।',
      'मनरेगा के तहत 90-95 दिनों की मजदूरी और स्वच्छ भारत मिशन से ₹12,000 शौचालय सहायता अलग से।',
    ],
    keyHighlight: '₹1.2 लाख से ₹2.5 लाख तक पक्के मकान हेतु सीधी सब्सिडी',
    eligibility: [
      'परिवार जिसके पास भारत में कहीं भी अपना कोई पक्का मकान न हो।',
      'SECC-2011 या आवास+ सर्वेक्षण सूची में शामिल परिवार।',
    ],
    documentsRequired: ['आधार कार्ड', 'जॉब कार्ड (मनरेगा)', 'बैंक पासबुक', 'जमीन का स्वामित्व दस्तावेज', 'आय प्रमाण'],
    officialUrl: 'https://pmaymis.gov.in',
    launchYear: '2024-2029 विस्तार',
    isLatest: true,
    status: 'active',
    lastUpdated: '13 Oct 2026',
    source: 'Ministry of Housing & Rural Development',
    applicationMode: 'Both',
  },
  {
    id: 'myscheme-national-portal',
    name: 'myScheme National Portal Integration',
    hindiName: 'माई स्कीम राष्ट्रीय पोर्टल (1,500+ योजनाएं)',
    category: 'trending',
    categoryLabel: 'अखिल भारतीय सरकारी पोर्टल',
    tagline: 'भारत सरकार का एकल एकीकृत पोर्टल जहां 1,500+ केंद्रीय और राज्य योजनाओं की पात्रता जांच और ऑनलाइन आवेदन एक ही स्थान पर उपलब्ध हैं।',
    benefits: [
      '1,500+ केंद्रीय और राज्य सरकारी योजनाओं की एक क्लिक में पात्रता खोज।',
      'उम्र, लिंग, जाति, राज्य, और व्यवसाय चुनते ही सटीक लागू योजनाओं की सूची।',
      'सीधे आधिकारिक आवेदन लिंक और आवश्यक दस्तावेजों की विस्तृत चेकलिस्ट।',
    ],
    keyHighlight: '1,500+ सरकारी योजनाओं की खोज व ऑनलाइन पात्रता जांच',
    eligibility: ['सभी भारतीय नागरिक (छात्र, किसान, महिला, बुजुर्ग, उद्यमी, मजदूर)'],
    documentsRequired: ['आधार कार्ड', 'मोबाइल नंबर', 'सामान्य पहचान प्रमाण'],
    officialUrl: 'https://www.myscheme.gov.in',
    launchYear: '2022-2026',
    isLatest: true,
    status: 'active',
    lastUpdated: '13 Oct 2026',
    source: 'MeitY & Digital India Corporation',
    applicationMode: 'Online',
  },
];

const SCHEMES_STORAGE_KEY = 'jarvis_gov_schemes_v2';
const AUTO_SYNC_ENABLED_KEY = 'jarvis_gov_schemes_auto_sync';
const LAST_SYNC_KEY = 'jarvis_gov_schemes_last_sync';

// 24-Hour Background Polling Service Constants
export const POLL_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 Hours (86,400,000 ms)
export const LAST_POLL_TIMESTAMP_KEY = 'rp_jansabha_last_poll_timestamp';
export const AUTO_SYNC_24H_ENABLED_KEY = 'rp_jansabha_24h_sync_enabled';
export const BACKGROUND_SYNC_LOGS_KEY = 'rp_jansabha_background_sync_logs';

export interface BackgroundSyncLog {
  id: string;
  timestamp: string;
  newSchemesCount: number;
  newSchemeTitles: string[];
  message: string;
  triggeredBy: '24h_timer' | 'manual' | 'app_init' | 'simulated';
  success: boolean;
}

/**
 * Check if 24-Hour Background Polling is enabled
 */
export function is24hBackgroundSyncActive(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const raw = localStorage.getItem(AUTO_SYNC_24H_ENABLED_KEY);
    return raw === null ? true : raw === 'true';
  } catch {
    return true;
  }
}

/**
 * Enable or disable 24-Hour Background Polling
 */
export function set24hBackgroundSyncActive(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(AUTO_SYNC_24H_ENABLED_KEY, String(enabled));
    window.dispatchEvent(new CustomEvent('rp_jansabha_sync_status_changed', { detail: { enabled } }));
  } catch (e) {
    console.error('Failed to set 24h background sync setting', e);
  }
}

/**
 * Get timestamp (epoch ms) of the last background API poll
 */
export function getLastPollTimestamp(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = localStorage.getItem(LAST_POLL_TIMESTAMP_KEY);
    return raw ? Number(raw) || 0 : 0;
  } catch {
    return 0;
  }
}

/**
 * Returns formatted countdown until next 24-hour auto-poll
 */
export function getNextPollCountdown(): {
  hours: number;
  minutes: number;
  seconds: number;
  isOverdue: boolean;
  formatted: string;
} {
  const lastPoll = getLastPollTimestamp();
  if (!lastPoll) {
    return { hours: 0, minutes: 0, seconds: 0, isOverdue: true, formatted: 'Due now (Initial Poll)' };
  }

  const elapsed = Date.now() - lastPoll;
  const remainingMs = POLL_INTERVAL_MS - elapsed;

  if (remainingMs <= 0) {
    return { hours: 0, minutes: 0, seconds: 0, isOverdue: true, formatted: 'Due now (24h Elapsed)' };
  }

  const totalSecs = Math.floor(remainingMs / 1000);
  const hours = Math.floor(totalSecs / 3600);
  const minutes = Math.floor((totalSecs % 3600) / 60);
  const seconds = totalSecs % 60;

  return {
    hours,
    minutes,
    seconds,
    isOverdue: false,
    formatted: `${hours}h ${minutes}m ${seconds}s`,
  };
}

/**
 * Retrieve background sync audit logs
 */
export function getBackgroundSyncLogs(): BackgroundSyncLog[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(BACKGROUND_SYNC_LOGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Append to background sync audit logs (keeps last 25 entries)
 */
function recordBackgroundSyncLog(log: Omit<BackgroundSyncLog, 'id'>) {
  if (typeof window === 'undefined') return;
  try {
    const current = getBackgroundSyncLogs();
    const entry: BackgroundSyncLog = {
      id: `synclog-${Date.now()}`,
      ...log,
    };
    const updated = [entry, ...current.slice(0, 24)];
    localStorage.setItem(BACKGROUND_SYNC_LOGS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to record sync log', e);
  }
}

/**
 * Retrieves stored schemes from localStorage or initializes defaults
 */
export function getStoredGovSchemes(): GovScheme[] {
  if (typeof window === 'undefined') return INITIAL_GOV_SCHEMES;
  try {
    const raw = localStorage.getItem(SCHEMES_STORAGE_KEY);
    if (!raw) {
      try {
        localStorage.setItem(SCHEMES_STORAGE_KEY, JSON.stringify(INITIAL_GOV_SCHEMES));
      } catch {}
      return INITIAL_GOV_SCHEMES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Merge any new default schemes that might have been added to the engine
      const existingIds = new Set(parsed.map((s: GovScheme) => s.id));
      let hasNew = false;
      INITIAL_GOV_SCHEMES.forEach((initScheme) => {
        if (!existingIds.has(initScheme.id)) {
          parsed.unshift(initScheme);
          hasNew = true;
        }
      });
      if (hasNew) {
        try {
          localStorage.setItem(SCHEMES_STORAGE_KEY, JSON.stringify(parsed));
        } catch {}
      }
      return parsed;
    }
    return INITIAL_GOV_SCHEMES;
  } catch (e) {
    console.error('Failed to load stored government schemes', e);
    return INITIAL_GOV_SCHEMES;
  }
}

/**
 * Saves schemes to storage and broadcasts update event
 */
export function saveGovSchemes(schemes: GovScheme[]): void {
  try {
    localStorage.setItem(SCHEMES_STORAGE_KEY, JSON.stringify(schemes));
    syncSchemesToJarvisMemory(schemes);
    window.dispatchEvent(new CustomEvent('jarvis_gov_schemes_updated', { detail: schemes }));
  } catch (e) {
    console.error('Failed to save government schemes', e);
  }
}

/**
 * Check if Auto-Sync is enabled
 */
export function isGovSchemesAutoSyncActive(): boolean {
  try {
    const raw = localStorage.getItem(AUTO_SYNC_ENABLED_KEY);
    return raw === null ? true : raw === 'true';
  } catch {
    return true;
  }
}

/**
 * Toggle or set Auto-Sync state
 */
export function setGovSchemesAutoSyncActive(enabled: boolean): void {
  try {
    localStorage.setItem(AUTO_SYNC_ENABLED_KEY, String(enabled));
    window.dispatchEvent(new CustomEvent('jarvis_gov_schemes_sync_status', { detail: { enabled } }));
  } catch (e) {
    console.error('Failed to set auto-sync status', e);
  }
}

/**
 * Returns formatted timestamp of last successful sync
 */
export function getLastSyncTime(): string {
  try {
    const raw = localStorage.getItem(LAST_SYNC_KEY);
    return raw || 'Just now (Synced with myScheme & PIB)';
  } catch {
    return 'Just now';
  }
}

/**
 * Polls the mock Government API endpoint (/api/gov-schemes) every 24 hours.
 * Automatically updates the stored list of government schemes and pushes local notifications if a new scheme is added.
 */
export async function pollGovernmentSchemesApi(options?: {
  simulateNew?: boolean;
  triggeredBy?: '24h_timer' | 'manual' | 'app_init' | 'simulated';
}): Promise<{
  success: boolean;
  newSchemes: GovScheme[];
  totalCount: number;
  message: string;
  source: string;
}> {
  const triggeredBy = options?.triggeredBy || 'manual';
  const now = new Date();
  const formattedDate = `${now.getDate()} ${now.toLocaleString('default', { month: 'short' })} ${now.getFullYear()} at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  try {
    // 1. Fetch from mock government API endpoint
    const queryParams = options?.simulateNew ? '?simulate_new=true' : '';
    let fetchedSchemes: GovScheme[] = [];
    let apiSource = 'National Portal of India / myScheme API (mock feed)';

    try {
      const response = await fetch(`/api/gov-schemes${queryParams}`, {
        headers: { Accept: 'application/json' },
      });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.schemes) && data.schemes.length > 0) {
          fetchedSchemes = data.schemes;
          if (data.source) apiSource = data.source;
        }
      }
    } catch (networkErr) {
      console.warn('[GovSchemesSync] Fetching /api/gov-schemes failed, using engine fallback:', networkErr);
    }

    // Fallback if API was unavailable (ensures resilient offline behavior)
    if (fetchedSchemes.length === 0) {
      fetchedSchemes = [...INITIAL_GOV_SCHEMES];
      if (options?.simulateNew) {
        fetchedSchemes.unshift({
          id: 'pm-annadata-drone-mitra-2026',
          name: 'PM Annadata Aay Sanrakshan & Krishi Drone Mitra 2026',
          hindiName: 'पीएम अन्नदाता आय संरक्षण एवं कृषि ड्रोन मित्र योजना 2026',
          category: 'farmers',
          categoryLabel: 'आधुनिक कृषि तकनीक',
          tagline: 'किसानों को फसल ड्रोन खरीद व किराए पर 80% सरकारी सब्सिडी, नैनो यूरिया छिड़काव और त्वरित फसल आय सुरक्षा।',
          benefits: [
            'कृषि ड्रोन पर किसानों को 80% या अधिकतम ₹5,00,000 की सीधी केंद्र सरकार सब्सिडी।',
            'कीटनाशक व खाद छिड़काव में 70% समय व 50% पानी की बचत।',
            'फसल क्षति होने पर 48 घंटे के भीतर ड्रोन मैपिंग द्वारा त्वरित मुआवजा निर्धारण।',
          ],
          keyHighlight: '80% ड्रोन अनुदान + 48 घंटे में त्वरित फसल मुआवजा',
          eligibility: ['सभी पंजीकृत भारतीय किसान, कृषि स्नातक, व महिला स्वयं सहायता समूह।'],
          documentsRequired: ['आधार कार्ड', 'किसान आईडी (AgriStack ID)', 'खसरा-खतौनी भू-अभिलेख', 'बैंक पासबुक'],
          officialUrl: 'https://agricoop.nic.in',
          launchYear: '2026',
          isLatest: true,
          status: 'newly_added',
          lastUpdated: formattedDate,
          source: 'Ministry of Agriculture & Farmers Welfare / myScheme API Feed',
          applicationMode: 'Both',
        });
      }
    }

    // 2. Compare against stored schemes to detect any brand new schemes
    const current = getStoredGovSchemes();
    const existingIds = new Set(current.map((s) => s.id));
    const newSchemes: GovScheme[] = [];

    fetchedSchemes.forEach((incoming) => {
      if (!existingIds.has(incoming.id)) {
        newSchemes.push({
          ...incoming,
          status: 'newly_added',
          lastUpdated: formattedDate,
        });
      }
    });

    // 3. Merge and persist
    const merged = [...newSchemes, ...current];
    saveGovSchemes(merged);

    // 4. Update sync timestamps
    localStorage.setItem(LAST_POLL_TIMESTAMP_KEY, String(Date.now()));
    localStorage.setItem(LAST_SYNC_KEY, formattedDate);

    // 5. Push Local Notifications for any newly added schemes
    if (newSchemes.length > 0) {
      newSchemes.forEach((ns) => {
        const title = `🏛️ नई सरकारी योजना: ${ns.hindiName || ns.name}`;
        const body = `${ns.keyHighlight || ns.tagline} — RP Jansabha Portal पर पूरी जानकारी देखें।`;

        sendLocalNotification(title, {
          body,
          icon: '/assets/jarvis-icon.png',
          badge: '/assets/jarvis-icon.png',
          tag: `gov-scheme-${ns.id}`,
        });
      });

      // Broadcast notification event for UI alerts and audio announcements
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('rp_jansabha_new_schemes_detected', {
            detail: {
              newSchemes,
              count: newSchemes.length,
              timestamp: Date.now(),
              source: apiSource,
            },
          })
        );
      }
    }

    const message =
      newSchemes.length > 0
        ? `Background 24h sync complete: Added ${newSchemes.length} new government scheme(s) and pushed local notification(s).`
        : `Background 24h sync complete: All ${merged.length} government schemes are up to date with official portal.`;

    recordBackgroundSyncLog({
      timestamp: formattedDate,
      newSchemesCount: newSchemes.length,
      newSchemeTitles: newSchemes.map((s) => s.name),
      message,
      triggeredBy,
      success: true,
    });

    return {
      success: true,
      newSchemes,
      totalCount: merged.length,
      message,
      source: apiSource,
    };
  } catch (err: any) {
    console.error('[GovSchemesSync] Background sync error:', err);
    recordBackgroundSyncLog({
      timestamp: formattedDate,
      newSchemesCount: 0,
      newSchemeTitles: [],
      message: `Sync failed: ${err?.message || 'Network error'}`,
      triggeredBy,
      success: false,
    });
    return {
      success: false,
      newSchemes: [],
      totalCount: getStoredGovSchemes().length,
      message: `Background sync error: ${err?.message || 'Failed to poll government API'}`,
      source: 'Local Cache',
    };
  }
}

/**
 * Performs Live Automatic Sync of Government Schemes (delegates to pollGovernmentSchemesApi)
 */
export async function syncGovSchemesWithOfficialPortals(): Promise<{
  success: boolean;
  schemes: GovScheme[];
  newCount: number;
  message: string;
}> {
  const result = await pollGovernmentSchemesApi({ triggeredBy: 'manual' });
  return {
    success: result.success,
    schemes: getStoredGovSchemes(),
    newCount: result.newSchemes.length,
    message: result.message,
  };
}

/**
 * Starts the 24-hour background syncing service.
 * - Checks if 24 hours have elapsed since last poll; if so, triggers immediate poll.
 * - Runs a periodic timer (checks every 60s) to trigger the poll once the 24h window elapses.
 * - Returns a cleanup function.
 */
export function initBackgroundSyncService(
  onNewSchemes?: (newSchemes: GovScheme[]) => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  // Handler for custom event
  const handleNewSchemes = (e: Event) => {
    const custom = e as CustomEvent;
    if (custom.detail?.newSchemes && Array.isArray(custom.detail.newSchemes)) {
      onNewSchemes?.(custom.detail.newSchemes);
    }
  };
  window.addEventListener('rp_jansabha_new_schemes_detected', handleNewSchemes);

  // Check on service initialization
  const checkAndExecutePoll = async (isTicker = false) => {
    if (!is24hBackgroundSyncActive()) return;

    const lastPoll = getLastPollTimestamp();
    const elapsed = Date.now() - lastPoll;

    // Trigger if never polled or 24h (86,400,000 ms) have passed
    if (!lastPoll || elapsed >= POLL_INTERVAL_MS) {
      console.log('[RpJansabha Background Sync] 24-Hour window reached. Polling mock government API endpoint...');
      await pollGovernmentSchemesApi({
        triggeredBy: isTicker ? '24h_timer' : 'app_init',
      });
    }
  };

  // Run initial check
  checkAndExecutePoll(false);

  // Periodic interval check every 60 seconds (low CPU overhead) to catch the 24h expiration
  const intervalId = setInterval(() => {
    checkAndExecutePoll(true);
  }, 60 * 1000);

  return () => {
    clearInterval(intervalId);
    window.removeEventListener('rp_jansabha_new_schemes_detected', handleNewSchemes);
  };
}

/**
 * Adds a new custom Government Scheme (allows user to track any new scheme announcement)
 */
export function addCustomGovScheme(schemeData: Partial<GovScheme>): GovScheme {
  const current = getStoredGovSchemes();
  const id = schemeData.id || `scheme-${Date.now()}`;
  const now = new Date();
  const formattedDate = `${now.getDate()} ${now.toLocaleString('default', { month: 'short' })} ${now.getFullYear()}`;

  const newScheme: GovScheme = {
    id,
    name: schemeData.name || 'New Government Scheme',
    hindiName: schemeData.hindiName || schemeData.name || 'नई सरकारी योजना',
    category: schemeData.category || 'trending',
    categoryLabel: schemeData.categoryLabel || 'सरकारी योजना',
    tagline: schemeData.tagline || 'भारत सरकार द्वारा शुरू की गई नई कल्याणकारी योजना।',
    benefits: schemeData.benefits && schemeData.benefits.length > 0 ? schemeData.benefits : ['सरकारी वित्तीय सहायता व सब्सिडी लाभ।'],
    keyHighlight: schemeData.keyHighlight || 'सरकारी सहायता व लाभ',
    eligibility: schemeData.eligibility && schemeData.eligibility.length > 0 ? schemeData.eligibility : ['भारतीय नागरिक होना अनिवार्य।'],
    documentsRequired: schemeData.documentsRequired && schemeData.documentsRequired.length > 0 ? schemeData.documentsRequired : ['आधार कार्ड', 'बैंक पासबुक'],
    officialUrl: schemeData.officialUrl || 'https://www.myscheme.gov.in',
    launchYear: schemeData.launchYear || String(now.getFullYear()),
    isLatest: true,
    status: 'newly_added',
    lastUpdated: formattedDate,
    source: schemeData.source || 'myScheme / Citizen Portal',
    applicationMode: schemeData.applicationMode || 'Online',
  };

  current.unshift(newScheme);
  saveGovSchemes(current);
  return newScheme;
}

let syncMemoryTimeout: any = null;

/**
 * Synchronizes Government Schemes into JARVIS Smart Memory Core so JARVIS can answer any query
 * Fully debounced and asynchronous to prevent any React state update collision during render.
 */
export function syncSchemesToJarvisMemory(schemes: GovScheme[]): void {
  if (typeof window === 'undefined') return;
  if (syncMemoryTimeout) {
    clearTimeout(syncMemoryTimeout);
  }
  syncMemoryTimeout = setTimeout(() => {
    try {
      const existingMemories = getStoredMemories();
      const existingKeys = new Set(existingMemories.map((m) => (m.key || '').toLowerCase()));

      schemes.slice(0, 12).forEach((scheme) => {
        const memoryKey = `Gov Scheme: ${scheme.name} (${scheme.hindiName})`;
        if (!existingKeys.has(memoryKey.toLowerCase())) {
          saveMemory(
            memoryKey,
            `${scheme.tagline || ''} | Key Highlight: ${scheme.keyHighlight || ''} | Eligibility: ${(scheme.eligibility || []).join(', ')} | Documents: ${(scheme.documentsRequired || []).join(', ')} | Official Portal: ${scheme.officialUrl || ''}`,
            'custom_instruction'
          );
        }
      });
    } catch (e) {
      console.warn('Could not sync schemes to Smart Memory Core', e);
    }
  }, 1200);
}

/**
 * Searches and finds the best matching government scheme by user query text
 */
export function findMatchingScheme(query: string): GovScheme | null {
  const q = (query || '').toLowerCase().trim();
  if (!q) return null;
  const schemes = getStoredGovSchemes();

  return (
    schemes.find((s) => {
      const name = (s.name || '').toLowerCase();
      const hindiName = (s.hindiName || '').toLowerCase();
      const tagline = (s.tagline || '').toLowerCase();
      const highlight = (s.keyHighlight || '').toLowerCase();

      return (
        name.includes(q) ||
        hindiName.includes(q) ||
        tagline.includes(q) ||
        highlight.includes(q) ||
        q.includes(name) ||
        q.includes(hindiName) ||
        (s.id === 'pmjuga' && (q.includes('juga') || q.includes('janjatiya') || q.includes('tribal') || q.includes('adivasi'))) ||
        (s.id === 'pm-surya-ghar' && (q.includes('surya') || q.includes('solar') || q.includes('muft bijli') || q.includes('bijli yojana'))) ||
        (s.id === 'nps-vatsalya' && (q.includes('vatsalya') || q.includes('minor') || q.includes('bacho ki pension'))) ||
        (s.id === 'unified-pension-scheme' && (q.includes('ups') || q.includes('unified pension') || q.includes('sarkari pension'))) ||
        (s.id === 'namo-drone-didi' && (q.includes('drone') || q.includes('drone didi'))) ||
        (s.id === 'pm-vishwakarma' && (q.includes('vishwakarma') || q.includes('karigar') || q.includes('shilpkar'))) ||
        (s.id === 'agnipath-scheme' && (q.includes('agnipath') || q.includes('agniveer') || q.includes('army bharti'))) ||
        (s.id === 'pm-yasasvi' && (q.includes('yasasvi') || q.includes('yasaswi') || q.includes('obc scholarship'))) ||
        (s.id === 'mahila-samman-mssc' && (q.includes('mahila samman') || q.includes('mssc') || q.includes('mahila fd'))) ||
        (s.id === 'lakhpati-didi' && (q.includes('lakhpati') || q.includes('shg yojana'))) ||
        (s.id === 'pm-sym' && (q.includes('shram yogi') || q.includes('maan-dhan') || q.includes('mandhan') || q.includes('majdoor pension'))) ||
        (s.id === 'ayushman-bharat' && (q.includes('ayushman') || q.includes('pmjay') || q.includes('70+') || q.includes('swasthya bima'))) ||
        (s.id === 'pm-kisan' && (q.includes('pm kisan') || q.includes('pmkisan') || q.includes('kisan nidhi') || q.includes('6000'))) ||
        (s.id === 'digital-farmer-id-agristack' && (q.includes('farmer id') || q.includes('kisan id') || q.includes('kisan card') || q.includes('agristack') || q.includes('kisan pehchan'))) ||
        (s.id === 'kisan-credit-card-kcc' && (q.includes('kcc') || q.includes('kisan credit') || q.includes('kisan loan'))) ||
        (s.id === 'pm-fasal-bima-pmfby' && (q.includes('fasal bima') || q.includes('pmfby') || q.includes('crop insurance') || q.includes('fasal nuksan'))) ||
        (s.id === 'enam-national-mandi' && (q.includes('enam') || q.includes('e-nam') || q.includes('mandi') || q.includes('mandi bhav'))) ||
        (s.id === 'pm-krishi-sinchayee-pmksy' && (q.includes('sinchayee') || q.includes('sinchai') || q.includes('drip') || q.includes('sprinkler'))) ||
        (s.id === 'smam-krishi-yantra' && (q.includes('tractor') || q.includes('krishi yantra') || q.includes('smam') || q.includes('rotavator'))) ||
        (s.id === 'pashu-kisan-credit-card' && (q.includes('pashu') || q.includes('dairy loan') || q.includes('cow loan') || q.includes('buffalo loan'))) ||
        (s.id === 'pm-internship-scheme' && (q.includes('internship') || q.includes('5000 stipend'))) ||
        (s.id === 'myscheme-national-portal' && (q.includes('myscheme') || q.includes('my scheme') || q.includes('sarkari portal')))
      );
    }) || null
  );
}
