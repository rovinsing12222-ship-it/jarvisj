import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Wheat,
  Award,
  CheckCircle2,
  Printer,
  Download,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  Edit3,
  Save,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  FileText,
  Phone,
  CreditCard,
  Landmark,
  Maximize2,
  Volume2,
  Eye,
  RefreshCw,
  UserCheck,
  MapPin,
  Calendar,
  X,
  Share2,
  Globe,
  ArrowRight,
  HelpCircle,
  Link as LinkIcon,
  Search,
  Zap,
  Hammer,
  Sun,
  HeartPulse,
  Filter,
  Building2,
  Sliders,
} from 'lucide-react';
import QRCode from 'qrcode';
import { triggerHaptic } from '../utils/deviceHardware';

export interface RegistrationPortalItem {
  id: string;
  category: 'central_agri' | 'state_portal' | 'citizen_welfare';
  title: string;
  hindiTitle: string;
  badge: string;
  badgeColor: string;
  authority: string;
  description: string;
  url: string;
  btnLabel: string;
  keyFeature: string;
  state?: string;
}

export const ALL_REGISTRATION_PORTALS: RegistrationPortalItem[] = [
  // --- 1. केंद्रीय कृषि एवं किसान योजनाएं (Central Agriculture & Farmer Registrations) ---
  {
    id: 'agristack-portal',
    category: 'central_agri',
    title: 'AgriStack - Digital Farmer ID',
    hindiTitle: 'राष्ट्रीय डिजिटल किसान पहचान पत्र (AgriStack ID)',
    badge: '12-Digit Farmer ID',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
    authority: 'केंद्रीय कृषि एवं किसान कल्याण मंत्रालय, भारत सरकार',
    description: 'आधार ई-केवाईसी व खसरा/खतौनी सीधे लिंक कर 12 अंकों की स्थायी डिजिटल किसान आईडी बनाएं। सभी सरकारी योजनाओं हेतु एकल मान्य आईडी।',
    url: 'https://agristack.gov.in',
    btnLabel: 'AgriStack पोर्टल खोलें',
    keyFeature: 'डिजिटल लैंड रिकॉर्ड व eKYC आधारित एकल किसान पहचान',
  },
  {
    id: 'pm-kisan-new-reg',
    category: 'central_agri',
    title: 'PM-Kisan New Registration',
    hindiTitle: 'पीएम-किसान सम्मान निधि (नया किसान पंजीकरण)',
    badge: '₹6,000/वर्ष DBT',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
    authority: 'Department of Agriculture & Farmers Welfare, GoI',
    description: 'आधार नंबर व ओटीपी से सीधे नया किसान पंजीकरण करें। हर 4 माह में ₹2,000 की किस्त (वार्षिक ₹6,000) सीधे बैंक खाते में पाएं।',
    url: 'https://pmkisan.gov.in/RegistrationFormNew.aspx',
    btnLabel: 'नया किसान रजिस्ट्रेशन लिंक',
    keyFeature: 'शत-प्रतिशत प्रत्यक्ष लाभ अंतरण (100% DBT Transfer)',
  },
  {
    id: 'pmfby-crop-insurance',
    category: 'central_agri',
    title: 'PM Fasal Bima Yojana (PMFBY)',
    hindiTitle: 'प्रधानमंत्री फसल बीमा योजना (ऑनलाइन पंजीकरण)',
    badge: 'फसल सुरक्षा बीमा',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
    authority: 'कृषि एवं किसान कल्याण मंत्रालय, भारत सरकार',
    description: 'सूखा, बाढ़, ओलावृष्टि व कीट प्रकोप से फसल क्षति की सुरक्षा हेतु मात्र 1.5% से 2% प्रीमियम पर व्यापक फसल बीमा सुरक्षा पंजीकरण।',
    url: 'https://pmfby.gov.in/farmerRegistrationForm',
    btnLabel: 'फसल बीमा पंजीकरण लिंक',
    keyFeature: 'खड़ी फसल व कटाई उपरांत नुकसान की 100% भरपाई क्लेम',
  },
  {
    id: 'enam-farmer-reg',
    category: 'central_agri',
    title: 'e-NAM (National Agriculture Market)',
    hindiTitle: 'ई-नाम राष्ट्रीय कृषि बाजार (किसान विक्रेता पंजीकरण)',
    badge: '1400+ मंडियां लाइव',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40',
    authority: 'Small Farmers Agribusiness Consortium (SFAC)',
    description: 'देश की 1400 से अधिक पंजीकृत कृषि मंडियों में अपनी फसल की सीधी ऑनलाइन पारदर्शी नीलामी कराएं व सर्वोत्तम मूल्य पाएं।',
    url: 'https://enam.gov.in/web/stakeholders_registration',
    btnLabel: 'e-NAM किसान रजिस्ट्रेशन',
    keyFeature: 'बिना बिचौलियों के अंतर्राज्यीय फसल व्यापार व सीधा ऑनलाइन भुगतान',
  },
  {
    id: 'kcc-loan-portal',
    category: 'central_agri',
    title: 'Kisan Credit Card (KCC Loan)',
    hindiTitle: 'किसान क्रेडिट कार्ड (रियायती फसली ऋण आवेदन)',
    badge: '4% ब्याज दर • ₹3 लाख',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
    authority: 'Ministry of Agriculture & RBI/NABARD',
    description: 'बिना किसी गिरवी/बंधक ₹1.60 लाख और अधिकतम ₹3.00 लाख तक का 4% रियायती ब्याज दर पर अल्पकालिक कृषि ऋण आवेदन।',
    url: 'https://pmkisan.gov.in',
    btnLabel: 'KCC ऑनलाइन आवेदन लिंक',
    keyFeature: '3% ब्याज छूट (Prompt Repayment Incentive) सहित सुलभ ऋण',
  },
  {
    id: 'smam-tractor-subsidy-portal',
    category: 'central_agri',
    title: 'SMAM Tractor & Farm Machinery',
    hindiTitle: 'कृषि यंत्रीकरण व ट्रैक्टर सब्सिडी पोर्टल (SMAM)',
    badge: '50% से 80% सब्सिडी',
    badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-400/40',
    authority: 'Mechanization & Technology Division, MoA&FW',
    description: 'ट्रैक्टर, रोटावेटर, रीपर, कल्टीवेटर, लेजर लैंड लेवलर व कस्टम हायरिंग सेंटर स्थापना हेतु 50% से 80% तक का ऑनलाइन सरकारी अनुदान।',
    url: 'https://agrimachinery.nic.in/Farmer/Management/Index',
    btnLabel: 'कृषि यंत्र सब्सिडी पंजीकरण',
    keyFeature: 'आधुनिक कृषि यंत्र व ट्रैक्टर खरीद पर सीधी DBT सब्सिडी',
  },
  {
    id: 'soil-health-card-portal',
    category: 'central_agri',
    title: 'Soil Health Card (मृदा स्वास्थ्य)',
    hindiTitle: 'मृदा स्वास्थ्य कार्ड ऑनलाइन पोर्टल व जांच',
    badge: 'मुफ्त मिट्टी जांच',
    badgeColor: 'bg-lime-500/20 text-lime-300 border-lime-400/40',
    authority: 'Integrated Nutrient Management, MoA&FW',
    description: 'खेत की मिट्टी में 12 आवश्यक पोषक तत्वों की निःशुल्क वैज्ञानिक जांच, उर्वरक अनुशंसा और डिजिटल मृदा स्वास्थ्य कार्ड डाउनलोड।',
    url: 'https://soilhealth.dac.gov.in',
    btnLabel: 'Soil Health Card पोर्टल',
    keyFeature: 'उर्वरक लागत में 20% तक की बचत व पैदावार में वृद्धि',
  },
  {
    id: 'pm-kisan-maandhan',
    category: 'central_agri',
    title: 'PM Kisan Maandhan Yojana',
    hindiTitle: 'प्रधानमंत्री किसान मानधन योजना (मासिक पेंशन)',
    badge: '₹3,000/माह पेंशन',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-400/40',
    authority: 'कृषि मंत्रालय व भारतीय जीवन बीमा निगम (LIC)',
    description: '18 से 40 वर्ष के छोटे व सीमांत किसानों के लिए वृद्धावस्था सामाजिक सुरक्षा। 60 वर्ष की आयु उपरांत ₹3,000 प्रति माह सुनिश्चित पेंशन।',
    url: 'https://maandhan.in',
    btnLabel: 'किसान पेंशन रजिस्ट्रेशन',
    keyFeature: '50% अंशदान किसान व 50% अंशदान केंद्र सरकार द्वारा देय',
  },
  {
    id: 'pm-kusum-solar-pump',
    category: 'central_agri',
    title: 'PM-KUSUM Solar Agri Pump',
    hindiTitle: 'पीएम कुसुम योजना (सोलर कृषि पंप 60%-90% सब्सिडी)',
    badge: '60%-90% सोलर सब्सिडी',
    badgeColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-400/40',
    authority: 'Ministry of New & Renewable Energy (MNRE)',
    description: 'डीजल और बिजली पंप से मुक्ति। खेतों में सोलर पंप लगाने पर 60% सरकारी सब्सिडी + 30% बैंक लोन। किसान को केवल 10% लागत देनी होती है।',
    url: 'https://pmkusum.mnre.gov.in',
    btnLabel: 'कुसुम सोलर पंप पंजीकरण',
    keyFeature: 'अतिरिक्त सौर ऊर्जा ग्रिड को बेचकर किसानों को अतिरिक्त आय',
  },
  {
    id: 'pashu-kcc-portal',
    category: 'central_agri',
    title: 'Pashu Kisan Credit Card (PKCC)',
    hindiTitle: 'पशु किसान क्रेडिट कार्ड (डेयरी व पशुपालन ऋण)',
    badge: '₹1.60 लाख कोलैटरल-फ्री',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-400/40',
    authority: 'Department of Animal Husbandry & Dairying, GoI',
    description: 'गाय, भैंस, बकरी व कुक्कुट पालन के चारे व रखरखाव खर्च हेतु 4% प्रभावी ब्याज दर पर बिना किसी गारंटी ₹1.60 लाख तक का ऋण।',
    url: 'https://dahd.nic.in',
    btnLabel: 'पशु केसीसी पोर्टल लिंक',
    keyFeature: 'प्रति गाय ₹40,783 और प्रति भैंस ₹60,249 तक का आसान ऋण',
  },
  {
    id: 'jaivik-kheti-pkvy',
    category: 'central_agri',
    title: 'Jaivik Kheti / PKVY Organic Farming',
    hindiTitle: 'जैविक खेती पोर्टल (परम्परागत कृषि विकास योजना)',
    badge: '₹50,000/हेक्टेयर अनुदान',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
    authority: 'Department of Agriculture & Farmers Welfare',
    description: 'जैविक प्रमाणीकरण, जैविक इनपुट खरीद व सीधे उपभोक्ताओं को जैविक उत्पाद बेचने हेतु राष्ट्रीय ई-मार्केटप्लेस पंजीकरण।',
    url: 'https://www.jaivikkheti.in',
    btnLabel: 'जैविक खेती पोर्टल लिंक',
    keyFeature: 'जैविक क्लस्टर निर्माण व निशुल्क जैविक उत्पाद ई-दुकान',
  },
  {
    id: 'midh-horticulture-mission',
    category: 'central_agri',
    title: 'National Horticulture Mission (MIDH)',
    hindiTitle: 'राष्ट्रीय बागवानी मिशन (पॉलीहाउस व फल-सब्जी सब्सिडी)',
    badge: '40%-50% बागवानी सब्सिडी',
    badgeColor: 'bg-lime-500/20 text-lime-300 border-lime-400/40',
    authority: 'Mission for Integrated Development of Horticulture',
    description: 'पॉलीहाउस, शेडनेट, मशरूम यूनिट, फलदार बगीचे, कोल्ड स्टोरेज व पैकहाउस स्थापना हेतु 40% से 50% पूंजीगत अनुदान पंजीकरण।',
    url: 'https://midh.gov.in',
    btnLabel: 'MIDH बागवानी पोर्टल',
    keyFeature: 'उद्यानिकी फसलों से प्रति एकड़ 3 गुना तक अधिक मुनाफा',
  },

  // --- 2. सभी राज्यों के आधिकारिक किसान पंजीकरण पोर्टल (All Major State Farmer Portals) ---
  {
    id: 'state-up-agri',
    category: 'state_portal',
    state: 'उत्तर प्रदेश (Uttar Pradesh)',
    title: 'UP Agriculture - पारदर्शी किसान सेवा',
    hindiTitle: 'उत्तर प्रदेश पारदर्शी किसान सेवा पोर्टल',
    badge: 'UP DBT Kisan',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
    authority: 'कृषि विभाग, उत्तर प्रदेश शासन',
    description: 'किसान पंजीकरण संख्या प्राप्त करें, प्रमाणित बीजों पर छूट, कृषि रक्षा रसायन, सोलर पंप टोकन बुकिंग व कृषि यंत्रों पर अनुदान।',
    url: 'http://upagriculture.com',
    btnLabel: 'UP Agriculture पोर्टल',
    keyFeature: 'सभी राज्य स्तरीय कृषि अनुदानों हेतु एकल अनिवार्य पंजीकरण',
  },
  {
    id: 'state-bihar-dbt',
    category: 'state_portal',
    state: 'बिहार (Bihar)',
    title: 'Bihar DBT Agriculture Portal',
    hindiTitle: 'बिहार प्रत्यक्ष लाभ अंतरण (DBT Agriculture)',
    badge: '13-अंकीय किसान पंजीकरण',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
    authority: 'कृषि विभाग, बिहार सरकार',
    description: '13-अंकों का किसान पंजीकरण, डीजल अनुदान, बीज अनुदान, इनपुट सब्सिडी व कृषि यांत्रिकीकरण हेतु ऑनलाइन आवेदन।',
    url: 'https://dbtagriculture.bihar.gov.in',
    btnLabel: 'बिहार DBT पोर्टल खोलें',
    keyFeature: 'आधार आधारित वन-क्लिक किसान पंजीकरण व स्टेटस ट्रैकिंग',
  },
  {
    id: 'state-mp-saara',
    category: 'state_portal',
    state: 'मध्य प्रदेश (Madhya Pradesh)',
    title: 'MP SAARA - किसान कल्याण व गिरदावरी',
    hindiTitle: 'मध्य प्रदेश सारा (SAARA) भू-अभिलेख व किसान पोर्टल',
    badge: '₹6,000 CM कल्याण',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
    authority: 'राजस्व एवं किसान कल्याण विभाग, मध्य प्रदेश',
    description: 'मुख्यमंत्री किसान कल्याण योजना (अतिरिक्त ₹6,000/वर्ष), ई-उपार्जन, फसल गिरदावरी व नामांतरण भू-अभिलेख सेवाएं।',
    url: 'https://saara.mp.gov.in',
    btnLabel: 'MP SAARA पोर्टल खोलें',
    keyFeature: 'सीएम किसान कल्याण व पीएम-किसान दोनों का संयुक्त सत्यापन',
  },
  {
    id: 'state-rajasthan-rajkisan',
    category: 'state_portal',
    state: 'राजस्थान (Rajasthan)',
    title: 'Raj Kisan Saathi - राज किसान साथी',
    hindiTitle: 'राजस्थान राज किसान साथी पोर्टल (जन आधार आधारित)',
    badge: 'तारबंदी व डिग्गी सब्सिडी',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
    authority: 'कृषि एवं उद्यानिकी विभाग, राजस्थान सरकार',
    description: 'जन आधार कार्ड से तारबंदी योजना, खेत तलाई, डिग्गी निर्माण, ड्रिप व फव्वारा सिंचाई एवं कृषि पाइपलाइन हेतु ऑनलाइन आवेदन।',
    url: 'https://rajkisan.rajasthan.gov.in',
    btnLabel: 'राज किसान साथी पोर्टल',
    keyFeature: '150+ किसान योजनाओं के लिए एकल खिड़की डिजिटल प्लेटफार्म',
  },
  {
    id: 'state-haryana-fasal',
    category: 'state_portal',
    state: 'हरियाणा (Haryana)',
    title: 'Meri Fasal Mera Byora (मेरी फसल मेरा ब्यौरा)',
    hindiTitle: 'हरियाणा मेरी फसल मेरा ब्यौरा किसान पोर्टल',
    badge: 'MSP फसल खरीद',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
    authority: 'कृषि एवं किसान कल्याण विभाग, हरियाणा',
    description: 'एमएसपी पर गेहूं व धान खरीद पंजीकरण, भावांतर भरपाई योजना, फसल खराबा मुआवजा और खाद-बीज सब्सिडी हेतु अनिवार्य पोर्टल।',
    url: 'https://fasal.haryana.gov.in',
    btnLabel: 'मेरी फसल मेरा ब्यौरा लिंक',
    keyFeature: 'मंडी गेट पास, ई-खरीद व 72 घंटे में सीधा बैंक खाते में भुगतान',
  },
  {
    id: 'state-punjab-anaaj',
    category: 'state_portal',
    state: 'पंजाब (Punjab)',
    title: 'Punjab Anaaj Kharid & Kheti Portal',
    hindiTitle: 'पंजाब अनाज खरीद व किसान पंजीकरण पोर्टल',
    badge: 'J-Form & MSP Payment',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
    authority: 'खाद्य, नागरिक आपूर्ति व उपभोक्ता मामले विभाग, पंजाब',
    description: 'गेहूं व धान खरीद हेतु किसान पंजीकरण, डिजिटल जे-फॉर्म डाउनलोड, सीधा बैंक खाता भुगतान (DBT) व फसल अवशेष प्रबंधन सब्सिडी।',
    url: 'https://anaajkharid.in',
    btnLabel: 'पंजाब अनाज खरीद पोर्टल',
    keyFeature: 'डिजिटल जे-फॉर्म द्वारा त्वरित बैंक ऋण व कानूनी फसल बिक्री प्रमाण',
  },
  {
    id: 'state-maharashtra-mahadbt',
    category: 'state_portal',
    state: 'महाराष्ट्र (Maharashtra)',
    title: 'MahaDBT Farmer - महाडीबीटी शेतकरी',
    hindiTitle: 'महाराष्ट्र महाडीबीटी शेतकरी योजना पोर्टल',
    badge: 'नमो शेतकरी योजना',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
    authority: 'कृषी विभाग, महाराष्ट्र शासन',
    description: 'नमो शेतकरी महासन्मान निधी (₹6,000/वर्ष), सूक्ष्म सिंचन, कृषी यांत्रिकीकरण व फलोत्पादन योजनांसाठी थेट ऑनलाइन अर्ज।',
    url: 'https://mahadbt.maharashtra.gov.in',
    btnLabel: 'MahaDBT पोर्टल खोलें',
    keyFeature: 'लॉटरी पद्धतीने पारदर्शक निवड आणि थेट बँक खात्यात अनुदान जमा',
  },
  {
    id: 'state-gujarat-ikhedut',
    category: 'state_portal',
    state: 'गुजरात (Gujarat)',
    title: 'i-Khedut Portal - આઈ-ખેડૂત પોર્ટલ',
    hindiTitle: 'गुजरात आई-खेड़ूत किसान कल्याण पोर्टल',
    badge: 'ખેતીવાડી યોજનાઓ',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
    authority: 'कृषि, किसान कल्याण और सहकारिता विभाग, गुजरात',
    description: 'ખેતીવાડી સાધનો, બાગાયત યોજના, દેશી ગાય પાલન સહાય (₹900/માસ), ડ્રિપ ઇરિગેશન અને તાર ફેન્સિંગ માટે ઓનલાઇન અરજી.',
    url: 'https://ikhedut.gujarat.gov.in',
    btnLabel: 'i-Khedut पोर्टल खोलें',
    keyFeature: '7/12 અને 8-અ ભૂમિ અભિલેખ સાથે સીધું લિન્કિંગ',
  },
  {
    id: 'state-karnataka-fruits',
    category: 'state_portal',
    state: 'कर्नाटक (Karnataka)',
    title: 'FRUITS Karnataka (FID Portal)',
    hindiTitle: 'कर्नाटक FRUITS किसान पहचान पोर्टल',
    badge: 'FRUITS FID Card',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
    authority: 'Department of Agriculture & e-Governance, Karnataka',
    description: 'Farmer Registration and Unified Beneficiary Information System (FRUITS). Get unique FID to receive all agri subsidies.',
    url: 'https://fruits.karnataka.gov.in',
    btnLabel: 'FRUITS पोर्टल खोलें',
    keyFeature: 'Integrated with Bhoomi RTC land registry and Aadhaar',
  },
  {
    id: 'state-odisha-kalia',
    category: 'state_portal',
    state: 'ओडिशा (Odisha)',
    title: 'KALIA & Krushak Odisha',
    hindiTitle: 'ओडिशा कालिया योजना व कृषक ओडिशा पोर्टल',
    badge: '₹10,000 कालिया सहायता',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
    authority: 'Department of Agriculture & Farmers Empowerment, Odisha',
    description: 'कृषक आजीविका एवं आय संवर्धन (कालिया योजना) में छोटे, सीमांत व भूमिहीन कृषि श्रमिकों हेतु वित्तीय सहायता व फसल ऋण ब्याज माफी।',
    url: 'https://kalia.odisha.gov.in',
    btnLabel: 'कालिया पोर्टल खोलें',
    keyFeature: 'भूमिहीन कृषि मजदूरों के लिए विशेष वित्तीय सहायता',
  },
  {
    id: 'state-chhattisgarh-kisan',
    category: 'state_portal',
    state: 'छत्तीसगढ़ (Chhattisgarh)',
    title: 'KISAN Portal / Rajiv Gandhi Nyay',
    hindiTitle: 'छत्तीसगढ़ किसान पोर्टल व कृषि इनपुट सहायता',
    badge: 'धान खरीद इनपुट सहायता',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
    authority: 'कृषि विकास एवं किसान कल्याण विभाग, छत्तीसगढ़ शासन',
    description: 'धान व दलहन-तिलहन उत्पादक किसानों का एकीकृत पंजीकरण। समर्थन मूल्य पर फसल खरीद टोकन व कृषि इनपुट सब्सिडी सहायता।',
    url: 'https://kisan.cg.nic.in',
    btnLabel: 'छत्तीसगढ़ किसान पोर्टल',
    keyFeature: 'भुइयां भू-अभिलेख से सीधे लिंक गिरदावरी व टोकन सिस्टम',
  },
  {
    id: 'state-jharkhand-krishi',
    category: 'state_portal',
    state: 'झारखंड (Jharkhand)',
    title: 'Jharkhand Farmer Registration',
    hindiTitle: 'झारखंड राज्य किसान पंजीकरण पोर्टल',
    badge: 'सुखाड़ राहत व कृषि आशीर्वाद',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
    authority: 'कृषि, पशुपालन एवं सहकारिता विभाग, झारखंड सरकार',
    description: 'झारखंड फसल राहत योजना (JRFRY), मुख्यमंत्री कृषि आशीर्वाद योजना, बीज व खाद अनुदान हेतु ऑनलाइन किसान रजिस्ट्रेशन।',
    url: 'https://farmer.jharkhand.gov.in',
    btnLabel: 'झारखंड किसान पोर्टल',
    keyFeature: 'बिना प्रीमियम शून्य लागत सूखा व बाढ़ फसल क्षति राहत',
  },
  {
    id: 'state-uttarakhand-agri',
    category: 'state_portal',
    state: 'उत्तराखंड (Uttarakhand)',
    title: 'Uttarakhand Agriculture Portal',
    hindiTitle: 'उत्तराखंड राज्य कृषि एवं उद्यान पोर्टल',
    badge: 'पर्वतीय कृषि व पॉलीहाउस',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
    authority: 'कृषि एवं कृषक कल्याण विभाग, उत्तराखंड सरकार',
    description: 'पर्वतीय क्षेत्रों हेतु पॉलीहाउस योजना, सेब व फलदार वृक्षारोपण, जैविक खाद अनुदान व मिनी ट्रैक्टर सब्सिडी ऑनलाइन पंजीकरण।',
    url: 'https://agriculture.uk.gov.in',
    btnLabel: 'UK Agriculture पोर्टल',
    keyFeature: '100% जैविक राज्य मिशन व पारंपरिक मोटे अनाज (श्री अन्न) प्रोत्साहन',
  },
  {
    id: 'state-hp-agrisnet',
    category: 'state_portal',
    state: 'हिमाचल प्रदेश (Himachal Pradesh)',
    title: 'HP Agrisnet - कृषि सूचना नेटवर्क',
    hindiTitle: 'हिमाचल प्रदेश एग्रिसनेट (HP Agrisnet) पोर्टल',
    badge: 'प्राकृतिक खेती व एंटी-हेल',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
    authority: 'Department of Agriculture, Himachal Pradesh',
    description: 'प्राकृतिक खेती खुशहाल किसान योजना, एंटी-हेल गन/नेट 80% सब्सिडी, सौर बाड़बंदी योजना व पॉलीहाउस निर्माण अनुदान।',
    url: 'https://hpagrisnet.gov.in',
    btnLabel: 'HP Agrisnet पोर्टल',
    keyFeature: 'सेब व फल उत्पादक बागवानों हेतु विशेष सुरक्षा उपकरण सब्सिडी',
  },
  {
    id: 'state-wb-krishak-bandhu',
    category: 'state_portal',
    state: 'पश्चिम बंगाल (West Bengal)',
    title: 'Krishak Bandhu (কৃষক বন্ধু)',
    hindiTitle: 'पश्चिम बंगाल कृषक बंधु योजना पोर्टल',
    badge: '₹10,000/वर्ष + ₹2L बीमा',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
    authority: 'Department of Agriculture, Govt. of West Bengal',
    description: 'वार्षिक ₹10,000 की वित्तीय सहायता (दो किस्तों में) एवं 18-60 वर्ष के कृषकों के लिए ₹2 लाख का निःशुल्क जीवन बीमा लाभ।',
    url: 'https://krishakbandhu.wb.gov.in',
    btnLabel: 'कृषक बंधु पोर्टल लिंक',
    keyFeature: 'प्रत्येक किसान व बटाईदार को अनिवार्य मृत्यु बीमा सुरक्षा',
  },
  {
    id: 'state-ap-rythu-bharosa',
    category: 'state_portal',
    state: 'आंध्र प्रदेश (Andhra Pradesh)',
    title: 'YSR Rythu Bharosa (వైఎస్సార్ రైతు భరోసా)',
    hindiTitle: 'आंध्र प्रदेश रायथु भरोसा किसान पोर्टल',
    badge: '₹13,500 वार्षिक सहायता',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
    authority: 'Agriculture Department, Government of Andhra Pradesh',
    description: 'प्रति वर्ष ₹13,500 की इनपुट वित्तीय सहायता, शून्य ब्याज फसल ऋण और पट्टेदार किसानों (CCRC) को भी सीधे बैंक खाते में भुगतान।',
    url: 'https://ysrrythubharosa.ap.gov.in',
    btnLabel: 'Rythu Bharosa पोर्टल',
    keyFeature: 'पट्टेदार व काश्तकार किसानों को भी संपूर्ण सरकारी सहायता',
  },
  {
    id: 'state-telangana-rythu-bandhu',
    category: 'state_portal',
    state: 'तेलंगाना (Telangana)',
    title: 'Rythu Bandhu - రైతు బంధు',
    hindiTitle: 'तेलंगाना रायथु बंधु कृषि निवेश सहायता पोर्टल',
    badge: '₹10,000/एकड़ प्रति वर्ष',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
    authority: 'Agriculture & Co-operation Department, Telangana',
    description: 'खरीफ व रबी फसलों के लिए ₹10,000 प्रति एकड़ फसल निवेश सहायता और रायथु बीमा के तहत ₹5 लाख का शत-प्रतिशत निःशुल्क जीवन बीमा।',
    url: 'https://rythubandhu.telangana.gov.in',
    btnLabel: 'Rythu Bandhu पोर्टल',
    keyFeature: 'धरणी पोर्टल से सीधे भू-अभिलेख आधारित प्रत्यक्ष बैंक अंतरण',
  },
  {
    id: 'state-assam-agri-dbt',
    category: 'state_portal',
    state: 'असम (Assam)',
    title: 'Assam Agriculture DBT Portal',
    hindiTitle: 'असम कृषि निदेशालय प्रत्यक्ष लाभ अंतरण पोर्टल',
    badge: 'ट्रेक्टर व कृषि यंत्र सब्सिडी',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
    authority: 'Directorate of Agriculture, Government of Assam',
    description: 'मुख्यमंत्री समग्र ग्राम्य उन्नयन योजना, ट्रैक्टर वितरण सब्सिडी, कस्टम हायरिंग सेंटर एवं बाढ़ राहत कृषि इनपुट सहायता पंजीकरण।',
    url: 'https://diragri.assam.gov.in',
    btnLabel: 'असम कृषि पोर्टल खोलें',
    keyFeature: 'पूर्वोत्तर किसानों हेतु 70% तक ट्रैक्टर व पावर टिलर अनुदान',
  },

  // --- 3. नागरिक पहचान, श्रम व सामाजिक कल्याण योजनाएं (Citizen Welfare, Labor & Identity) ---
  {
    id: 'eshram-card-registration',
    category: 'citizen_welfare',
    title: 'e-Shram Portal (ई-श्रम कार्ड)',
    hindiTitle: 'ई-श्रम कार्ड ऑनलाइन नया पंजीकरण (श्रमिक कल्याण)',
    badge: '₹2L दुर्घटना बीमा',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40',
    authority: 'श्रम एवं रोजगार मंत्रालय, भारत सरकार',
    description: 'असंगठित कामगार, कृषि मजदूर, प्रवासी श्रमिक और दैनिक वेतनभोगियों हेतु 12-अंकों का यूनिवर्सल अकाउंट नंबर (UAN) व दुर्घटना बीमा।',
    url: 'https://register.eshram.gov.in',
    btnLabel: 'ई-श्रम नया रजिस्ट्रेशन लिंक',
    keyFeature: 'निःशुल्क पंजीकरण, राष्ट्रीय पहचान और आपातकालीन राहत में प्राथमिकता',
  },
  {
    id: 'ayushman-bharat-pmjay',
    category: 'citizen_welfare',
    title: 'Ayushman Bharat (PM-JAY)',
    hindiTitle: 'आयुष्मान भारत कार्ड ऑनलाइन आवेदन व eKYC',
    badge: '₹5 लाख मुफ्त इलाज',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
    authority: 'National Health Authority (NHA), GoI',
    description: 'प्रति परिवार प्रति वर्ष ₹5 लाख तक का देश के किसी भी सरकारी या सूचीबद्ध निजी अस्पताल में कैशलेस व पूर्णतः मुफ्त इलाज कार्ड।',
    url: 'https://beneficiary.nha.gov.in',
    btnLabel: 'आयुष्मान कार्ड पोर्टल खोलें',
    keyFeature: '70 वर्ष से अधिक आयु के सभी वरिष्ठ नागरिकों हेतु ₹5 लाख अतिरिक्त कवर',
  },
  {
    id: 'pm-surya-ghar-portal',
    category: 'citizen_welfare',
    title: 'PM Surya Ghar: Muft Bijli Yojana',
    hindiTitle: 'पीएम सूर्य घर मुफ्त बिजली योजना (रूफटॉप सोलर)',
    badge: '300 यूनिट मुफ्त बिजली',
    badgeColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-400/40',
    authority: 'Ministry of New and Renewable Energy (MNRE)',
    description: 'हर माह 300 यूनिट मुफ्त बिजली पाने हेतु छत पर सोलर पैनल लगाएं। केंद्र सरकार द्वारा ₹78,000 तक की सीधी बैंक सब्सिडी।',
    url: 'https://pmsuryaghar.gov.in',
    btnLabel: 'सूर्य घर रूफटॉप रजिस्ट्रेशन',
    keyFeature: 'बिजली बिल शून्य और अतिरिक्त बिजली ग्रिड को बेचकर कमाई',
  },
  {
    id: 'pm-vishwakarma-reg',
    category: 'citizen_welfare',
    title: 'PM Vishwakarma Scheme',
    hindiTitle: 'पीएम विश्वकर्मा योजना नया पंजीकरण (कारीगर व शिल्पकार)',
    badge: '₹15,000 टूलकिट + ₹3L लोन',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
    authority: 'Ministry of MSME, Government of India',
    description: 'बढ़ई, लोहार, कुम्हार, राजमिस्त्री, मोची, दर्जी आदि 18 पारंपरिक कारीगरों हेतु ₹15,000 टूलकिट वाउचर व 5% रियायती ब्याज पर ₹3 लाख का लोन।',
    url: 'https://pmvishwakarma.gov.in',
    btnLabel: 'विश्वकर्मा नया रजिस्ट्रेशन लिंक',
    keyFeature: 'कौशल प्रशिक्षण के दौरान प्रतिदिन ₹500 का स्टाइपेंड व प्रमाण पत्र',
  },
  {
    id: 'pmay-gramin-portal',
    category: 'citizen_welfare',
    title: 'PM Awas Yojana - Gramin (PMAY-G)',
    hindiTitle: 'प्रधानमंत्री आवास योजना ग्रामीण (पक्का मकान)',
    badge: '₹1,20,000 सीधा अनुदान',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-400/40',
    authority: 'ग्रामीण विकास मंत्रालय, भारत सरकार',
    description: 'कच्चे या जीर्ण-शीर्ण मकानों में रहने वाले ग्रामीण गरीब परिवारों को पक्का मकान बनाने हेतु ₹1.20 लाख से ₹1.30 लाख की सीधी सहायता।',
    url: 'https://pmayg.nic.in',
    btnLabel: 'पीएम आवास पोर्टल खोलें',
    keyFeature: 'मनरेगा के तहत 90-95 दिनों की मजदूरी व शौचालय हेतु अतिरिक्त ₹12,000',
  },
  {
    id: 'uidai-aadhaar-appointment',
    category: 'citizen_welfare',
    title: 'UIDAI Aadhaar Appointment & Update',
    hindiTitle: 'आधार कार्ड ऑनलाइन नया नामांकन व अपडेट स्लॉट बुक',
    badge: 'UIDAI Official',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-400/40',
    authority: 'Unique Identification Authority of India (UIDAI)',
    description: 'नया आधार कार्ड बनवाने हेतु आधार सेवा केंद्र स्लॉट बुकिंग, मोबाइल नंबर/पता ऑनलाइन अपडेट एवं सुरक्षित पीवीसी कार्ड ऑर्डर।',
    url: 'https://appointments.uidai.gov.in',
    btnLabel: 'UIDAI अपॉइंटमेंट बुक करें',
    keyFeature: 'ऑनलाइन अपॉइंटमेंट से बिना लाइन लगे तुरंत सेवा',
  },
  {
    id: 'pan-card-nsdl-apply',
    category: 'citizen_welfare',
    title: 'PAN Card Online Apply (Protean / NSDL)',
    hindiTitle: 'नया पैन कार्ड ऑनलाइन आवेदन (Protean/NSDL)',
    badge: '10 Min Instant e-PAN',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/40',
    authority: 'Income Tax Department, Government of India',
    description: 'फॉर्म 49A के माध्यम से नया पैन कार्ड ऑनलाइन अप्लाई करें। आधार ई-साइन से पेपरलेस आवेदन व तुरंत डिजिटल ई-पैन डाउनलोड।',
    url: 'https://www.onlineservices.nsdl.com/paam/endUserRegisterContact.html',
    btnLabel: 'नया पैन कार्ड अप्लाई लिंक',
    keyFeature: 'डिजिटल आधार ई-केवाईसी सत्यापन से 24-48 घंटे में पैन जनरेशन',
  },
  {
    id: 'voter-id-eci-form6',
    category: 'citizen_welfare',
    title: 'National Voters Portal (ECI Voter ID)',
    hindiTitle: 'नया वोटर पहचान पत्र ऑनलाइन पंजीकरण (फॉर्म 6)',
    badge: 'ECI Form 6 Online',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-400/40',
    authority: 'Election Commission of India (ECI)',
    description: '18 वर्ष पूर्ण होने पर नए मतदाता पहचान पत्र (Voter ID) हेतु फॉर्म 6 ऑनलाइन भरें एवं डिजिटल e-EPIC कार्ड मुफ्त डाउनलोड करें।',
    url: 'https://voters.eci.gov.in',
    btnLabel: 'वोटर कार्ड रजिस्ट्रेशन लिंक',
    keyFeature: 'रंगीन प्लास्टिक ईपीआईसी कार्ड डाक द्वारा सीधे घर के पते पर प्राप्त',
  },
  {
    id: 'nfsa-ration-card-portals',
    category: 'citizen_welfare',
    title: 'NFSA Ration Card State Portals',
    hindiTitle: 'राष्ट्रीय खाद्य सुरक्षा राशन कार्ड ऑनलाइन पोर्टल',
    badge: 'मुफ्त राशन • NFSA',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
    authority: 'खाद्य एवं सार्वजनिक वितरण विभाग, भारत सरकार',
    description: 'प्रधानमंत्री गरीब कल्याण अन्न योजना के तहत मुफ्त 5 किलो राशन प्रति व्यक्ति। सभी राज्यों के नए राशन कार्ड का सीधा ऑनलाइन लिंक।',
    url: 'https://nfsa.gov.in/portal/ration_card_state_portals_aa',
    btnLabel: 'राज्यवार राशन कार्ड लिंक',
    keyFeature: 'One Nation One Ration Card (ONORC) द्वारा देश में कहीं भी राशन प्राप्त',
  },
  {
    id: 'udyam-msme-reg',
    category: 'citizen_welfare',
    title: 'Udyam MSME Registration (उद्योग आधार)',
    hindiTitle: 'उद्यम एमएसएमई पंजीकरण (मुफ्त आजीवन व्यापार रजिस्ट्रेशन)',
    badge: 'Zero Fee • Instant Certificate',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-400/40',
    authority: 'Ministry of MSME, Government of India',
    description: 'दुकानदार, व्यापारी, कुटीर व लघु उद्योगपतियों हेतु शून्य शुल्क पर आजीवन मान्य सरकारी उद्यम पंजीकरण और मुद्रा लोन में प्राथमिकता।',
    url: 'https://udyamregistration.gov.in',
    btnLabel: 'उद्यम रजिस्ट्रेशन पोर्टल',
    keyFeature: 'बिना किसी कागजी दस्तावेज के केवल आधार व पैन से 5 मिनट में रजिस्ट्रेशन',
  },
];

export interface FarmerProfileData {
  farmerId: string;
  farmerName: string;
  fatherName: string;
  mobile: string;
  aadhaarRef: string;
  dob: string;
  gender: string;
  state: string;
  district: string;
  tehsil: string;
  village: string;
  pincode: string;
  landHolding: string;
  khasraNo: string;
  primaryCrops: string[];
  soilHealthCard: string;
  ekycStatus: 'VERIFIED' | 'PENDING';
  landSeeding: 'YES' | 'NO';
  dbtStatus: 'ACTIVE' | 'INACTIVE';
  bankName: string;
  accountMasked: string;
  ifsc: string;
  pmKisanStatus: string;
  kccLimit: string;
  pmfbyPolicy: string;
  issueDate: string;
  validThru: string;
  avatarType?: 'default' | 'male_turban' | 'female_saree' | 'young_farmer';
}

const STORAGE_KEY = 'rp_jansabha_farmer_profile';

export const DEFAULT_FARMER_PROFILE: FarmerProfileData = {
  farmerId: 'IND-AGRI-9842-8412-2026',
  farmerName: 'रमेश कुमार शर्मा (Ramesh Kumar Sharma)',
  fatherName: 'श्री रामेश्वर शर्मा (Rameshwar Sharma)',
  mobile: '+91 98421 08477',
  aadhaarRef: '•••• •••• 8412',
  dob: '12/08/1982',
  gender: 'पुरुष (Male)',
  state: 'उत्तर प्रदेश (Uttar Pradesh)',
  district: 'वाराणसी (Varanasi)',
  tehsil: 'पिंडरा (Pindra)',
  village: 'शिवपुर (Shivpur)',
  pincode: '221003',
  landHolding: '2.40 हेक्टेयर (लगभग 9.6 बीघा)',
  khasraNo: 'खसरा सं. 142/1, 142/2, खाता सं. 89',
  primaryCrops: ['गेहूं (Wheat)', 'धान (Paddy)', 'सरसों (Mustard)', 'सब्जियां (Vegetables)'],
  soilHealthCard: 'सत्यापित (Optimal N-P-K, pH 7.2)',
  ekycStatus: 'VERIFIED',
  landSeeding: 'YES',
  dbtStatus: 'ACTIVE',
  bankName: 'भारतीय स्टेट बैंक (State Bank of India)',
  accountMasked: '•••• •••• 3419',
  ifsc: 'SBIN0001234',
  pmKisanStatus: '18वीं किस्त जारी (₹2,000 सफल DBT भुगतान)',
  kccLimit: '₹3,00,000 (4% रियायती ब्याज दर)',
  pmfbyPolicy: 'PMFBY-UP-2026-99214 (सक्रिय फसल बीमा)',
  issueDate: '15 Oct 2026',
  validThru: '31 Dec 2030',
  avatarType: 'male_turban',
};

export const PRESET_FARMER_PROFILES: { name: string; subtitle: string; data: FarmerProfileData }[] = [
  {
    name: 'रमेश कुमार शर्मा',
    subtitle: 'सीमांत किसान, वाराणसी (UP)',
    data: DEFAULT_FARMER_PROFILE,
  },
  {
    name: 'सुनीता देवी',
    subtitle: 'महिला SHG व जैविक किसान, सीहोर (MP)',
    data: {
      farmerId: 'IND-AGRI-7731-9014-2026',
      farmerName: 'सुनीता देवी (Sunita Devi)',
      fatherName: 'धर्मपत्नी श्री राजेश वर्मा (W/o Rajesh Verma)',
      mobile: '+91 97543 21098',
      aadhaarRef: '•••• •••• 9014',
      dob: '05/04/1988',
      gender: 'महिला (Female)',
      state: 'मध्य प्रदेश (Madhya Pradesh)',
      district: 'सीहोर (Sehore)',
      tehsil: 'आष्टा (Ashta)',
      village: 'मेहतवाड़ा (Mehatwada)',
      pincode: '466116',
      landHolding: '1.80 हेक्टेयर (लगभग 7.2 बीघा)',
      khasraNo: 'खसरा सं. 88/2, खाता सं. 34',
      primaryCrops: ['सोयाबीन (Soybean)', 'चना (Gram)', 'जैविक सब्जियां (Organic)'],
      soilHealthCard: 'सत्यापित (Organic Carbon 0.85%)',
      ekycStatus: 'VERIFIED',
      landSeeding: 'YES',
      dbtStatus: 'ACTIVE',
      bankName: 'बैंक ऑफ इंडिया (Bank of India)',
      accountMasked: '•••• •••• 7820',
      ifsc: 'BKID0009876',
      pmKisanStatus: '18वीं किस्त जारी (₹2,000 सफल DBT भुगतान)',
      kccLimit: '₹2,50,000 (4% रियायती ब्याज दर)',
      pmfbyPolicy: 'PMFBY-MP-2026-88129 (सक्रिय फसल बीमा)',
      issueDate: '15 Oct 2026',
      validThru: '31 Dec 2030',
      avatarType: 'female_saree',
    },
  },
  {
    name: 'बलविंदर सिंह',
    subtitle: 'प्रगतिशील किसान, लुधियाना (Punjab)',
    data: {
      farmerId: 'IND-AGRI-6612-4439-2026',
      farmerName: 'बलविंदर सिंह (Balwinder Singh)',
      fatherName: 'श्री गुरनाम सिंह (Gurnam Singh)',
      mobile: '+91 98140 55432',
      aadhaarRef: '•••• •••• 4439',
      dob: '22/11/1979',
      gender: 'पुरुष (Male)',
      state: 'पंजाब (Punjab)',
      district: 'लुधियाना (Ludhiana)',
      tehsil: 'खन्ना (Khanna)',
      village: 'दहेड़ू (Daheru)',
      pincode: '141401',
      landHolding: '4.50 हेक्टेयर (लगभग 18 एकड़)',
      khasraNo: 'खसरा सं. 201/4, 201/5, खाता सं. 112',
      primaryCrops: ['बासमती धान (Basmati)', 'गेहूं (Wheat)', 'मक्का (Maize)', 'आलू (Potato)'],
      soilHealthCard: 'सत्यापित (Precision Soil Map Issued)',
      ekycStatus: 'VERIFIED',
      landSeeding: 'YES',
      dbtStatus: 'ACTIVE',
      bankName: 'पंजाब नेशनल बैंक (PNB)',
      accountMasked: '•••• •••• 5591',
      ifsc: 'PUNB0123400',
      pmKisanStatus: '18वीं किस्त जारी (₹2,000 सफल DBT भुगतान)',
      kccLimit: '₹3,00,000 (4% रियायती ब्याज दर)',
      pmfbyPolicy: 'PMFBY-PB-2026-44012 (सक्रिय फसल बीमा)',
      issueDate: '15 Oct 2026',
      validThru: '31 Dec 2030',
      avatarType: 'young_farmer',
    },
  },
];

interface FarmerProfileProps {
  onSpeakJarvisGuide?: (text: string) => void;
  onVerifyExternalId?: (id: string) => void;
}

export const FarmerProfile: React.FC<FarmerProfileProps> = ({
  onSpeakJarvisGuide,
  onVerifyExternalId,
}) => {
  // Load persistent profile from localStorage
  const [profile, setProfile] = useState<FarmerProfileData>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? { ...DEFAULT_FARMER_PROFILE, ...JSON.parse(raw) } : DEFAULT_FARMER_PROFILE;
    } catch {
      return DEFAULT_FARMER_PROFILE;
    }
  });

  const [activeSide, setActiveSide] = useState<'front' | 'back'>('front');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<FarmerProfileData>(profile);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedQrPayload, setCopiedQrPayload] = useState(false);
  const [copiedLinkUrl, setCopiedLinkUrl] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [linksCategoryTab, setLinksCategoryTab] = useState<'all' | 'central_agri' | 'state_portal' | 'citizen_welfare'>('all');
  const [linksSearchQuery, setLinksSearchQuery] = useState<string>('');
  const cardRef = useRef<HTMLDivElement>(null);

  // Filtered registration portals based on active category and live search
  const filteredRegistrationPortals = useMemo(() => {
    return ALL_REGISTRATION_PORTALS.filter((item) => {
      const matchesCategory =
        linksCategoryTab === 'all' || item.category === linksCategoryTab;
      if (!matchesCategory) return false;

      if (!linksSearchQuery.trim()) return true;

      const q = linksSearchQuery.toLowerCase().trim();
      return (
        item.title.toLowerCase().includes(q) ||
        item.hindiTitle.toLowerCase().includes(q) ||
        item.authority.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.keyFeature.toLowerCase().includes(q) ||
        (item.state && item.state.toLowerCase().includes(q)) ||
        item.url.toLowerCase().includes(q)
      );
    });
  }, [linksCategoryTab, linksSearchQuery]);

  const handleCopyLink = (url: string, label: string) => {
    triggerHaptic([20]);
    try {
      navigator.clipboard.writeText(url);
      setCopiedLinkUrl(url);
      setStatusMessage(`लिंक कॉपी हो गया: ${label} (${url})`);
      setTimeout(() => setCopiedLinkUrl(null), 3000);
      setTimeout(() => setStatusMessage(null), 3500);
    } catch {
      setCopiedLinkUrl(url);
      setTimeout(() => setCopiedLinkUrl(null), 3000);
    }
  };

  // Generate structured verification payload for the QR code
  const qrVerificationPayload = useMemo(() => {
    return JSON.stringify(
      {
        schema: 'AGRISTACK_NATIONAL_FARMER_ID_V1',
        kisanId: profile.farmerId,
        name: profile.farmerName,
        father: profile.fatherName,
        state: profile.state,
        district: profile.district,
        tehsil: profile.tehsil,
        village: profile.village,
        land: profile.landHolding,
        khasra: profile.khasraNo,
        crops: profile.primaryCrops,
        ekyc: profile.ekycStatus,
        dbt: profile.dbtStatus,
        pmKisan: profile.pmKisanStatus,
        kcc: profile.kccLimit,
        validThru: profile.validThru,
        verifyUrl: `https://agristack.gov.in/verify?kid=${encodeURIComponent(profile.farmerId)}`,
        verifiedAt: new Date().toISOString(),
      },
      null,
      2
    );
  }, [profile]);

  // Generate QR code data URL whenever the profile changes
  useEffect(() => {
    let isMounted = true;
    QRCode.toDataURL(qrVerificationPayload, {
      width: 320,
      margin: 1,
      color: {
        dark: '#022c22', // deep emerald forest
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => {
        if (isMounted) setQrDataUrl(url);
      })
      .catch((err) => {
        console.error('[FarmerProfile] QR Code Generation failed:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [qrVerificationPayload]);

  // Save profile to localStorage
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic([30, 40]);
    setProfile(editForm);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(editForm));
    } catch (err) {
      console.error('Failed to save farmer profile', err);
    }
    setIsEditing(false);
    setStatusMessage('किसान प्रोफाइल सफलतापूर्वक सहेज लिया गया (Profile Saved Successfully)');
    setTimeout(() => setStatusMessage(null), 3000);

    if (onSpeakJarvisGuide) {
      onSpeakJarvisGuide(
        `किसान प्रोफाइल अपडेट कर दी गई है। नया किसान आईडी कार्ड और क्यूआर कोड तैयार है।`
      );
    }
  };

  // Reset to default
  const handleResetToDefault = () => {
    triggerHaptic([20]);
    setProfile(DEFAULT_FARMER_PROFILE);
    setEditForm(DEFAULT_FARMER_PROFILE);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_FARMER_PROFILE));
    } catch (err) {
      console.error('Failed to reset farmer profile', err);
    }
    setIsEditing(false);
    setStatusMessage('डिफ़ॉल्ट किसान प्रोफाइल लोड की गई');
    setTimeout(() => setStatusMessage(null), 2500);
  };

  // Select a preset profile
  const handleApplyPreset = (presetData: FarmerProfileData) => {
    triggerHaptic([25]);
    setProfile(presetData);
    setEditForm(presetData);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(presetData));
    } catch (err) {
      console.error('Failed to apply preset', err);
    }
    setIsEditing(false);
    setStatusMessage(`प्रोफाइल लोड हुई: ${presetData.farmerName}`);
    setTimeout(() => setStatusMessage(null), 3000);

    if (onSpeakJarvisGuide) {
      onSpeakJarvisGuide(
        `प्रोफाइल लोड की गई: ${presetData.farmerName}. डिजिटल किसान आईडी ${presetData.farmerId}.`
      );
    }
  };

  // Copy Kisan ID
  const handleCopyKisanId = () => {
    triggerHaptic([20]);
    try {
      navigator.clipboard.writeText(profile.farmerId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2500);
    } catch {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2500);
    }
  };

  // Copy full QR payload
  const handleCopyQrPayload = () => {
    triggerHaptic([20]);
    try {
      navigator.clipboard.writeText(qrVerificationPayload);
      setCopiedQrPayload(true);
      setTimeout(() => setCopiedQrPayload(false), 2500);
    } catch {
      setCopiedQrPayload(true);
      setTimeout(() => setCopiedQrPayload(false), 2500);
    }
  };

  // Print card
  const handlePrintCard = () => {
    triggerHaptic([30]);
    window.print();
  };

  // Read card details aloud
  const handleSpeakCard = () => {
    triggerHaptic([20]);
    if (onSpeakJarvisGuide) {
      const summary = `राष्ट्रीय डिजिटल किसान पहचान पत्र. किसान का नाम: ${profile.farmerName}. किसान आईडी: ${profile.farmerId}. ग्राम: ${profile.village}, जिला: ${profile.district}, ${profile.state}. कुल कृषि भूमि: ${profile.landHolding}. खसरा संख्या: ${profile.khasraNo}. मुख्य फसलें: ${profile.primaryCrops.join(', ')}. ई-केवाईसी और बैंक डीबीटी स्थिति सक्रिय है.`;
      onSpeakJarvisGuide(summary);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Top Banner & Quick Controls */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-[#0d2818] to-slate-950 border-2 border-emerald-500/50 shadow-2xl relative overflow-hidden">
        {/* Glow background accents */}
        <div className="absolute right-0 top-0 w-80 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-0 bottom-0 w-80 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-emerald-500/30">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)] shrink-0">
              <Wheat className="w-7 h-7 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  किसान प्रोफाइल व डिजिटल किसान पहचान पत्र (Kisan ID)
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-400 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                  AgriStack Verified
                </span>
              </div>
              <p className="text-xs text-emerald-200/90 mt-1">
                भारत सरकार डिजिटल कृषि मिशन • क्यूआर कोड प्रमाणीकरण, भू-अभिलेख लिंकिंग और पीएम-किसान सम्मान निधि सत्यापन।
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                triggerHaptic([20]);
                setIsEditing(!isEditing);
                setEditForm(profile);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                isEditing
                  ? 'bg-amber-400 text-slate-950'
                  : 'bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/60 text-emerald-300'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditing ? 'संपादन रद्द करें' : 'प्रोफाइल संपादित करें (Edit Profile)'}</span>
            </button>

            <button
              type="button"
              onClick={handleSpeakCard}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 cursor-pointer transition-all active:scale-95"
              title="Speak Kisan details with JARVIS"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status Toast */}
        {statusMessage && (
          <div className="my-3 p-3 rounded-2xl bg-emerald-500/20 border border-emerald-400/60 text-emerald-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Preset Profiles Selector */}
        <div className="mt-4 pt-3 border-t border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2 text-slate-300 font-medium">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>त्वरित डेमो किसान प्रोफाइल चुनें (Quick Presets):</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {PRESET_FARMER_PROFILES.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplyPreset(p.data)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 border ${
                  profile.farmerId === p.data.farmerId
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold shadow-md'
                    : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:text-white hover:border-emerald-500/50'
                }`}
                title={p.subtitle}
              >
                <span>{p.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 1. COMPREHENSIVE ALL-IN-ONE ONLINE REGISTRATION LINKS HUB & GUIDES */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-emerald-950/40 to-slate-900 border-2 border-emerald-500/50 shadow-2xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 right-1/4 w-96 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-emerald-500/30">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-400 shrink-0 shadow-md">
              <LinkIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-white">
                  सभी ऑनलाइन सरकारी पंजीकरण लिंक (All Official Registration Links Hub)
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-400 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                  40+ Portals Verified
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                राष्ट्रीय डिजिटल किसान आईडी (AgriStack), पीएम-किसान, सभी 18+ राज्यों के किसान पोर्टल, फसल बीमा, केसीसी लोन, ई-श्रम, आयुष्मान व सूर्य घर
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://agristack.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow transition-all cursor-pointer active:scale-95"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>AgriStack पोर्टल</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="https://pmkisan.gov.in/RegistrationFormNew.aspx"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow transition-all cursor-pointer active:scale-95"
            >
              <Wheat className="w-3.5 h-3.5" />
              <span>PM-Kisan नया फॉर्म</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Live Search & Filter Bar */}
        <div className="my-4 space-y-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={linksSearchQuery}
              onChange={(e) => setLinksSearchQuery(e.target.value)}
              placeholder="योजना, राज्य या कीवर्ड खोजें (उदा: UP, बिहार, MP, राजस्थान, ट्रैक्टर, आयुष्मान, सूर्य घर, केसीसी, राशन)..."
              className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-slate-950/80 border border-emerald-500/30 text-white placeholder-slate-400 text-xs focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all"
            />
            {linksSearchQuery && (
              <button
                type="button"
                onClick={() => setLinksSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            <button
              type="button"
              onClick={() => {
                triggerHaptic([15]);
                setLinksCategoryTab('all');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap cursor-pointer transition-all ${
                linksCategoryTab === 'all'
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                  : 'bg-slate-950/70 border border-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <span>सभी पंजीकरण लिंक ({ALL_REGISTRATION_PORTALS.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic([15]);
                setLinksCategoryTab('central_agri');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap cursor-pointer transition-all flex items-center gap-1.5 ${
                linksCategoryTab === 'central_agri'
                  ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                  : 'bg-slate-950/70 border border-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <Wheat className="w-3.5 h-3.5 text-amber-400" />
              <span>केंद्रीय कृषि योजनाएं ({ALL_REGISTRATION_PORTALS.filter((i) => i.category === 'central_agri').length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic([15]);
                setLinksCategoryTab('state_portal');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap cursor-pointer transition-all flex items-center gap-1.5 ${
                linksCategoryTab === 'state_portal'
                  ? 'bg-emerald-400 text-slate-950 shadow-md font-black'
                  : 'bg-slate-950/70 border border-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>सभी राज्य किसान पोर्टल ({ALL_REGISTRATION_PORTALS.filter((i) => i.category === 'state_portal').length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic([15]);
                setLinksCategoryTab('citizen_welfare');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap cursor-pointer transition-all flex items-center gap-1.5 ${
                linksCategoryTab === 'citizen_welfare'
                  ? 'bg-cyan-400 text-slate-950 shadow-md font-black'
                  : 'bg-slate-950/70 border border-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>नागरिक पहचान व कल्याण ({ALL_REGISTRATION_PORTALS.filter((i) => i.category === 'citizen_welfare').length})</span>
            </button>
          </div>
        </div>

        {/* Dynamic Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-3">
          {filteredRegistrationPortals.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl bg-slate-950/85 border border-emerald-500/30 hover:border-emerald-400/80 transition-all flex flex-col justify-between shadow-lg group"
            >
              <div>
                {/* Header: Badge & Category */}
                <div className="flex items-center justify-between gap-1.5 mb-2">
                  <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold truncate max-w-[170px] ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                  {item.state && (
                    <span className="text-[10px] text-amber-300/90 font-mono font-medium truncate">
                      {item.state.split(' ')[0]}
                    </span>
                  )}
                </div>

                {/* Title & Hindi Title */}
                <h4 className="font-extrabold text-white text-sm group-hover:text-amber-300 transition-colors">
                  {item.hindiTitle}
                </h4>
                <div className="text-[10px] font-mono text-emerald-300/90 mb-1.5">
                  {item.title}
                </div>

                {/* Authority Tag */}
                <div className="text-[10px] text-slate-400 mb-1.5 font-medium flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate">{item.authority}</span>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                  {item.description}
                </p>

                {/* Key feature bullet */}
                <div className="mt-2.5 p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/20 text-[11px] text-emerald-300 flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{item.keyFeature}</span>
                </div>

                {/* Official URL preview */}
                <div className="mt-2 text-[10px] font-mono text-slate-400 bg-slate-900/90 px-2 py-1 rounded-lg border border-slate-800 truncate">
                  {item.url}
                </div>
              </div>

              {/* Action Buttons: 1-Click Open & Copy */}
              <div className="flex items-center gap-2 mt-3.5 pt-2.5 border-t border-slate-800">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow cursor-pointer active:scale-95"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="truncate">{item.btnLabel}</span>
                </a>

                <button
                  type="button"
                  onClick={() => handleCopyLink(item.url, item.hindiTitle)}
                  className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 border border-slate-700 cursor-pointer active:scale-95 transition-all"
                  title="Copy link to clipboard"
                >
                  {copiedLinkUrl === item.url ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty Search Feedback */}
        {filteredRegistrationPortals.length === 0 && (
          <div className="py-12 text-center text-slate-400 bg-slate-950/60 rounded-3xl border border-slate-800 my-4">
            <Search className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-white">कोई पंजीकरण लिंक नहीं मिला</p>
            <p className="text-xs text-slate-400 mt-1">
              "{linksSearchQuery}" के लिए कोई परिणाम नहीं मिला। कृपया दूसरा कीवर्ड आज़माएं।
            </p>
            <button
              type="button"
              onClick={() => {
                setLinksSearchQuery('');
                setLinksCategoryTab('all');
              }}
              className="mt-3 px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold cursor-pointer"
            >
              सभी 40+ लिंक देखें
            </button>
          </div>
        )}

        {/* 4-Step How to Create Guide + Required Documents */}
        <div className="mt-6 pt-5 border-t border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
          {/* Step Guide (Spans 2 cols on md) */}
          <div className="md:col-span-2 p-4 rounded-2xl bg-black/40 border border-emerald-500/30">
            <h5 className="font-bold text-amber-300 mb-2.5 flex items-center gap-1.5 text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>किसान आईडी व सरकारी योजनाओं में ऑनलाइन पंजीकरण का 4-चरणीय तरीका:</span>
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] leading-relaxed">
              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="font-bold text-emerald-400 block mb-0.5">स्टेप 1: आधार व OTP सत्यापन</span>
                <span className="text-slate-300">
                  ऊपर दिए गए आधिकारिक पोर्टल लिंक पर 'New Registration' पर क्लिक करें। 12-अंकों का आधार नंबर दर्ज कर मोबाइल पर आए OTP से प्रमाणीकृत करें।
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="font-bold text-emerald-400 block mb-0.5">स्टेप 2: भू-अभिलेख / खसरा लिंकिंग</span>
                <span className="text-slate-300">
                  अपना राज्य, जिला, तहसील व ग्राम चुनें। खतौनी/खसरा/खाता संख्या और धारित कुल भूमि का क्षेत्रफल (हेक्टेयर/एकड़) दर्ज करें।
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="font-bold text-emerald-400 block mb-0.5">स्टेप 3: बैंक खाता व DBT सीडिंग</span>
                <span className="text-slate-300">
                  सब्सिडी व आर्थिक सहायता राशि सीधे पाने हेतु आधार-सीडेड बैंक खाता संख्या व IFSC कोड सत्यापित करें।
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="font-bold text-emerald-400 block mb-0.5">स्टेप 4: डिजिटल आईडी कार्ड प्राप्त</span>
                <span className="text-slate-300">
                  सत्यापन पूर्ण होते ही 12-अंकों की स्थायी डिजिटल किसान पहचान पत्र (Kisan ID) जनरेट हो जाती है। इसे तुरंत डाउनलोड व सेव कर लें।
                </span>
              </div>
            </div>
          </div>

          {/* Required Docs & Toll Free Helplines */}
          <div className="p-4 rounded-2xl bg-black/40 border border-amber-500/30 flex flex-col justify-between">
            <div>
              <h5 className="font-bold text-amber-300 mb-2 flex items-center gap-1.5 text-xs">
                <FileText className="w-4 h-4 text-amber-400" />
                <span>आवश्यक दस्तावेज (Required Documents):</span>
              </h5>
              <ul className="space-y-1.5 text-[11px] text-slate-300">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>आधार कार्ड (Aadhaar Card)</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>खतौनी / खसरा नकल (Land Bhulekh)</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>आधार-लिंक मोबाइल नंबर (Active OTP)</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>बैंक पासबुक (DBT Active Bank)</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>पासपोर्ट आकार की नवीनतम फोटो</span>
                </li>
              </ul>
            </div>

            <div className="mt-3.5 pt-3 border-t border-slate-800 text-[11px] space-y-1">
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                राष्ट्रीय टोल-फ्री हेल्पलाइन (24x7 Helpdesk):
              </span>
              <div className="flex items-center justify-between font-mono font-bold text-emerald-400">
                <span>1800-180-1551</span>
                <span className="text-amber-300 text-[10px] font-sans">किसान कॉल सेंटर</span>
              </div>
              <div className="flex items-center justify-between font-mono font-bold text-cyan-400 text-[10px]">
                <span>155261 / 011-24300606</span>
                <span className="text-slate-300 font-sans">पीएम-किसान</span>
              </div>
              <div className="flex items-center justify-between font-mono font-bold text-purple-400 text-[10px]">
                <span>14555 (आयुष्मान) • 14434 (ई-श्रम)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Form (Visible when isEditing is true) */}
      {isEditing && (
        <form
          onSubmit={handleSaveProfile}
          className="p-5 sm:p-6 rounded-3xl bg-slate-900/95 border-2 border-amber-400/60 shadow-2xl space-y-4 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-extrabold text-white">
                किसान प्रोफाइल विवरण संपादित करें (Edit Profile Details)
              </h3>
            </div>
            <button
              type="button"
              onClick={handleResetToDefault}
              className="text-xs text-slate-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>डिफ़ॉल्ट सेट करें</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
            {/* Farmer ID */}
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                डिजिटल किसान पहचान संख्या (Farmer ID):
              </label>
              <input
                type="text"
                value={editForm.farmerId}
                onChange={(e) => setEditForm({ ...editForm, farmerId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-400"
                required
              />
            </div>

            {/* Farmer Name */}
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                किसान का पूरा नाम (Full Name):
              </label>
              <input
                type="text"
                value={editForm.farmerName}
                onChange={(e) => setEditForm({ ...editForm, farmerName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-medium focus:outline-none focus:border-emerald-400"
                required
              />
            </div>

            {/* Father's / Husband's Name */}
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                पिता/पति का नाम (Father/Husband):
              </label>
              <input
                type="text"
                value={editForm.fatherName}
                onChange={(e) => setEditForm({ ...editForm, fatherName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-400"
                required
              />
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                मोबाइल नंबर (Mobile Phone):
              </label>
              <input
                type="text"
                value={editForm.mobile}
                onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-400"
              />
            </div>

            {/* State */}
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                राज्य (State):
              </label>
              <input
                type="text"
                value={editForm.state}
                onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-400"
                required
              />
            </div>

            {/* District */}
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                जिला (District):
              </label>
              <input
                type="text"
                value={editForm.district}
                onChange={(e) => setEditForm({ ...editForm, district: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-400"
                required
              />
            </div>

            {/* Tehsil / Block */}
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                तहसील / ब्लॉक (Tehsil):
              </label>
              <input
                type="text"
                value={editForm.tehsil}
                onChange={(e) => setEditForm({ ...editForm, tehsil: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-400"
              />
            </div>

            {/* Village */}
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                ग्राम पंचायत / गांव (Village):
              </label>
              <input
                type="text"
                value={editForm.village}
                onChange={(e) => setEditForm({ ...editForm, village: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-400"
                required
              />
            </div>

            {/* Land Holding */}
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                कुल भूमि (Total Land Holding):
              </label>
              <input
                type="text"
                value={editForm.landHolding}
                onChange={(e) => setEditForm({ ...editForm, landHolding: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-emerald-300 font-bold focus:outline-none focus:border-emerald-400"
                required
              />
            </div>

            {/* Khasra / Khata No */}
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                खसरा व खाता संख्या (Khasra No):
              </label>
              <input
                type="text"
                value={editForm.khasraNo}
                onChange={(e) => setEditForm({ ...editForm, khasraNo: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-400"
              />
            </div>

            {/* Primary Crops */}
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                मुख्य फसलें (comma separated):
              </label>
              <input
                type="text"
                value={editForm.primaryCrops.join(', ')}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    primaryCrops: e.target.value.split(',').map((c) => c.trim()).filter(Boolean),
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-400"
              />
            </div>

            {/* PM Kisan Status */}
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                पीएम-किसान स्थिति (PM Kisan Status):
              </label>
              <input
                type="text"
                value={editForm.pmKisanStatus}
                onChange={(e) => setEditForm({ ...editForm, pmKisanStatus: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-amber-300 font-medium focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Bank Name */}
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                बैंक का नाम (DBT Bank):
              </label>
              <input
                type="text"
                value={editForm.bankName}
                onChange={(e) => setEditForm({ ...editForm, bankName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-400"
              />
            </div>

            {/* KCC Limit */}
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                किसान क्रेडिट कार्ड सीमा (KCC Limit):
              </label>
              <input
                type="text"
                value={editForm.kccLimit}
                onChange={(e) => setEditForm({ ...editForm, kccLimit: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-400"
              />
            </div>

            {/* Crop Insurance Policy */}
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                फसल बीमा (PMFBY Policy):
              </label>
              <input
                type="text"
                value={editForm.pmfbyPolicy}
                onChange={(e) => setEditForm({ ...editForm, pmfbyPolicy: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-400"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer"
            >
              रद्द करें (Cancel)
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg cursor-pointer active:scale-95"
            >
              <Save className="w-3.5 h-3.5" />
              <span>सहेजें व नया QR कोड बनाएं (Save Profile)</span>
            </button>
          </div>
        </form>
      )}

      {/* Card View Switcher Tabs (Front vs Back) */}
      <div className="flex items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            कार्ड व्यू (Card Side):
          </span>
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800">
            <button
              type="button"
              onClick={() => {
                triggerHaptic([15]);
                setActiveSide('front');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSide === 'front'
                  ? 'bg-emerald-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              मुख पृष्ठ (Front Side)
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic([15]);
                setActiveSide('back');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSide === 'back'
                  ? 'bg-emerald-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              पृष्ठ भाग (Back Side - भू-अभिलेख व बैंक)
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyKisanId}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
            title="Copy Farmer ID to Clipboard"
          >
            {copiedId ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-bold">कॉपी हो गया!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>आईडी कॉपी करें</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handlePrintCard}
            className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all active:scale-95"
            title="Print or Save Kisan ID Card as PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>प्रिंट / सेव कार्ड</span>
          </button>
        </div>
      </div>

      {/* --- THE DIGITAL KISAN ID CARD --- */}
      <div
        ref={cardRef}
        id="digital-kisan-id-card"
        className="w-full max-w-2xl mx-auto rounded-3xl bg-gradient-to-br from-[#0c2e1f] via-[#124b33] to-[#0a2318] border-2 border-emerald-400/90 shadow-[0_12px_40px_rgba(0,0,0,0.6)] text-white relative overflow-hidden transition-all duration-300"
      >
        {/* Indian Tricolor Ribbon Header */}
        <div className="h-2.5 w-full bg-gradient-to-r from-orange-500 via-white to-green-600 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-blue-800" />
        </div>

        {/* Card Background Watermark Graphics */}
        <div className="absolute right-4 bottom-4 text-emerald-400/10 font-black text-8xl pointer-events-none select-none tracking-tighter">
          KISAN
        </div>

        <div className="p-5 sm:p-7 relative z-10">
          {/* Card Government Header */}
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-emerald-400/30">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-900/90 border border-emerald-400/60 flex items-center justify-center text-amber-300 shrink-0 shadow-md">
                <Wheat className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <div className="text-[10px] font-mono tracking-widest uppercase text-emerald-200 font-bold">
                  भारत सरकार • DIGITAL AGRICULTURE MISSION
                </div>
                <h3 className="text-base sm:text-lg font-black text-amber-300 tracking-wide">
                  राष्ट्रीय डिजिटल किसान पहचान पत्र (AGRISTACK KISAN ID)
                </h3>
              </div>
            </div>

            <div className="flex flex-col items-end">
              <span className="px-2 py-0.5 rounded-full bg-emerald-950/90 border border-emerald-400 text-emerald-300 text-[9px] font-mono font-bold flex items-center gap-1 shadow-sm">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>OFFICIALLY VERIFIED</span>
              </span>
              <span className="text-[9px] text-slate-300 font-mono mt-0.5">
                Val: {profile.validThru}
              </span>
            </div>
          </div>

          {/* FRONT SIDE CONTENT */}
          {activeSide === 'front' && (
            <div className="pt-4 space-y-4 animate-in fade-in duration-200">
              {/* Main Photo, Core ID & Real Dynamic QR Code */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-2xl bg-black/40 border border-emerald-500/30 shadow-inner">
                {/* Farmer Photo & Chip */}
                <div className="flex flex-col items-center shrink-0">
                  <div className="w-24 h-28 rounded-2xl bg-gradient-to-b from-emerald-900 to-emerald-950 border-2 border-emerald-400/60 flex flex-col items-center justify-center text-center p-2 shadow-lg relative overflow-hidden">
                    {/* Simulated smart card chip */}
                    <div className="w-8 h-6 rounded bg-gradient-to-br from-amber-300 to-amber-500 border border-amber-600 mb-1 flex items-center justify-center opacity-90">
                      <div className="w-4 h-3 border border-amber-800/40 grid grid-cols-2 gap-0.5" />
                    </div>
                    <Wheat className="w-8 h-8 text-emerald-300" />
                    <span className="text-[9px] font-bold text-emerald-100 mt-1 uppercase tracking-wider">
                      किसान
                    </span>
                  </div>
                  <span className="text-[8px] font-mono text-emerald-300/80 mt-1">
                    AGRISTACK CHIP
                  </span>
                </div>

                {/* Farmer Core Information */}
                <div className="flex-1 w-full text-center sm:text-left space-y-1.5">
                  <div>
                    <div className="text-[11px] text-emerald-200/90 font-medium">
                      डिजिटल किसान पहचान संख्या (Digital Kisan ID):
                    </div>
                    <div className="text-lg sm:text-xl font-mono font-black text-amber-300 tracking-wider">
                      {profile.farmerId}
                    </div>
                  </div>

                  <div>
                    <div className="text-base sm:text-lg font-black text-white">
                      {profile.farmerName}
                    </div>
                    <div className="text-xs text-slate-200">
                      पिता/पति: <strong>{profile.fatherName}</strong>
                    </div>
                  </div>

                  <div className="text-xs text-slate-300 flex items-center justify-center sm:justify-start gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>
                      {profile.village}, {profile.tehsil}, {profile.district}, {profile.state} - {profile.pincode}
                    </span>
                  </div>

                  <div className="text-xs text-slate-300">
                    मोबाइल: <span className="font-mono text-emerald-200">{profile.mobile}</span> • आधार:{' '}
                    <span className="font-mono text-slate-300">{profile.aadhaarRef}</span>
                  </div>
                </div>

                {/* Real Dynamic QR Code Generator Display */}
                <div className="flex flex-col items-center shrink-0 p-2.5 rounded-2xl bg-white text-slate-950 shadow-md">
                  {qrDataUrl ? (
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic([15]);
                        setIsQrModalOpen(true);
                      }}
                      className="group cursor-pointer block relative"
                      title="Click to Enlarge QR Code & View Verification Payload"
                    >
                      <img
                        src={qrDataUrl}
                        alt={`QR Code for Kisan ID ${profile.farmerId}`}
                        className="w-24 h-24 sm:w-28 sm:h-28 rounded-lg object-contain transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-emerald-950/20 opacity-0 group-hover:opacity-100 rounded-lg flex items-center justify-center transition-opacity">
                        <Maximize2 className="w-5 h-5 text-emerald-800 drop-shadow" />
                      </div>
                    </button>
                  ) : (
                    <div className="w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
                    </div>
                  )}
                  <span className="text-[8px] font-mono font-black mt-1 text-emerald-900 tracking-wider">
                    SCAN TO VERIFY
                  </span>
                  <span className="text-[7px] text-slate-500 font-mono">
                    AgriStack Secure Key
                  </span>
                </div>
              </div>

              {/* Land Holding & Crop Profile Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="p-2.5 rounded-xl bg-black/30 border border-emerald-500/20">
                  <div className="text-[10px] text-slate-300">कुल भूमि (Land Holding):</div>
                  <div className="font-bold text-emerald-200 mt-0.5">{profile.landHolding}</div>
                </div>

                <div className="p-2.5 rounded-xl bg-black/30 border border-emerald-500/20">
                  <div className="text-[10px] text-slate-300">खसरा / खाता संख्या:</div>
                  <div className="font-bold text-emerald-200 mt-0.5 truncate" title={profile.khasraNo}>
                    {profile.khasraNo}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-black/30 border border-emerald-500/20">
                  <div className="text-[10px] text-slate-300">e-KYC स्थिति:</div>
                  <div className="font-bold text-emerald-400 mt-0.5 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{profile.ekycStatus}</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-black/30 border border-emerald-500/20">
                  <div className="text-[10px] text-slate-300">बैंक DBT स्थिति:</div>
                  <div className="font-bold text-amber-300 mt-0.5 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{profile.dbtStatus}</span>
                  </div>
                </div>
              </div>

              {/* Primary Crops Badges */}
              <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/20 flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-[10px] text-slate-300 font-semibold mr-1">मुख्य फसलें (Crops):</span>
                {profile.primaryCrops.map((crop, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-lg bg-emerald-400/20 border border-emerald-400/40 text-emerald-200 text-[10px] font-medium"
                  >
                    {crop}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* BACK SIDE CONTENT */}
          {activeSide === 'back' && (
            <div className="pt-4 space-y-3.5 animate-in fade-in duration-200">
              <div className="p-3.5 rounded-2xl bg-black/40 border border-emerald-500/30 text-xs space-y-2">
                <h4 className="font-bold text-amber-300 flex items-center gap-1.5">
                  <Landmark className="w-4 h-4 text-amber-400" />
                  <span>सरकारी कल्याणकारी योजना व बैंक लिंकिंग विवरण:</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                  <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">पीएम-किसान सम्मान निधि स्थिति:</span>
                    <span className="font-bold text-emerald-300 text-[11px] block mt-0.5">
                      {profile.pmKisanStatus}
                    </span>
                  </div>

                  <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">संबद्ध बैंक खाता (DBT Seeded):</span>
                    <span className="font-bold text-slate-200 text-[11px] block mt-0.5 font-mono">
                      {profile.bankName} ({profile.accountMasked})
                    </span>
                  </div>

                  <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">किसान क्रेडिट कार्ड (KCC Loan):</span>
                    <span className="font-bold text-amber-300 text-[11px] block mt-0.5">
                      {profile.kccLimit}
                    </span>
                  </div>

                  <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">प्रधानमंत्री फसल बीमा योजना (PMFBY):</span>
                    <span className="font-bold text-emerald-300 text-[11px] block mt-0.5">
                      {profile.pmfbyPolicy}
                    </span>
                  </div>
                </div>
              </div>

              {/* Soil Health & Land Verification */}
              <div className="p-3 rounded-2xl bg-black/40 border border-emerald-500/30 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">मृदा स्वास्थ्य कार्ड (Soil Health Card):</span>
                  <span className="font-bold text-emerald-300">{profile.soilHealthCard}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">भू-अभिलेख लिंकिंग (Land Seeding):</span>
                  <span className="font-bold text-emerald-400 flex items-center gap-1 justify-end">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>सत्यापित (VERIFIED)</span>
                  </span>
                </div>
              </div>

              {/* Official Helplines & Verification Authority */}
              <div className="p-3 rounded-2xl bg-emerald-950/80 border border-emerald-400/40 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-300 block">किसान कॉल सेंटर (टोल-फ्री हेल्पलाइन):</span>
                    <span className="font-mono font-bold text-amber-300 text-sm">1800-180-1551</span>
                  </div>
                </div>

                <div className="text-left sm:text-right text-[10px] text-slate-400 font-mono">
                  <div>Issue Date: {profile.issueDate}</div>
                  <div>Authority: Ministry of Agriculture, GoI</div>
                </div>
              </div>
            </div>
          )}

          {/* Barcode & Card Footer */}
          <div className="mt-4 pt-3 border-t border-emerald-400/30 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            {/* Visual Barcode Pattern */}
            <div className="flex items-center gap-1 opacity-80 overflow-hidden max-w-full">
              {[4, 2, 6, 2, 5, 3, 2, 6, 4, 2, 5, 3, 4, 2, 6, 2, 5, 3, 4, 2, 6, 2, 4, 3, 5, 2, 6, 4].map(
                (w, idx) => (
                  <div
                    key={idx}
                    className="h-5 bg-emerald-300 rounded-xs"
                    style={{ width: `${w}px` }}
                  />
                )
              )}
            </div>

            <div className="flex items-center gap-2">
              <a
                href="https://agristack.gov.in"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-emerald-300 hover:text-white flex items-center gap-1 underline underline-offset-2"
              >
                <span>agristack.gov.in</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ENLARGED QR CODE & VERIFICATION MODAL */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-emerald-400/80 rounded-3xl max-w-lg w-full p-6 shadow-2xl text-white relative animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">डिजिटल किसान क्यूआर कोड (Kisan QR Code)</h3>
                  <p className="text-xs text-slate-400 font-mono">{profile.farmerId}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsQrModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-4 flex flex-col items-center">
              <div className="p-4 rounded-3xl bg-white shadow-xl border-4 border-emerald-400">
                {qrDataUrl && (
                  <img
                    src={qrDataUrl}
                    alt={`Enlarged QR Code for ${profile.farmerId}`}
                    className="w-56 h-56 object-contain"
                  />
                )}
              </div>
              <p className="text-xs text-slate-300 text-center mt-3 max-w-sm">
                यह क्यूआर कोड किसान के वास्तविक भू-अभिलेख, ई-केवाईसी, बैंक डीबीटी व फसल विवरण को सुरक्षित रूप से कूटबद्ध (encode) करता है।
              </p>
            </div>

            {/* Encoded JSON Payload Box */}
            <div className="flex-1 overflow-hidden flex flex-col min-h-0 bg-slate-950 rounded-2xl border border-slate-800 p-3 mb-4">
              <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800 text-[11px]">
                <span className="text-slate-400 font-mono">Encoded QR Verification Payload:</span>
                <button
                  type="button"
                  onClick={handleCopyQrPayload}
                  className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer font-semibold"
                >
                  {copiedQrPayload ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>Payload Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Payload</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="flex-1 overflow-y-auto text-[10px] font-mono text-emerald-300/90 whitespace-pre leading-relaxed select-all">
                {qrVerificationPayload}
              </pre>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
              {qrDataUrl && (
                <a
                  href={qrDataUrl}
                  download={`Kisan_ID_QR_${profile.farmerId}.png`}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow cursor-pointer transition-all active:scale-95"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>QR कोड डाउनलोड करें</span>
                </a>
              )}

              <button
                type="button"
                onClick={() => setIsQrModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer"
              >
                बंद करें (Close)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
