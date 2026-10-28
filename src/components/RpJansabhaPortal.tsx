import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  ExternalLink,
  Shield,
  CreditCard,
  FileText,
  Landmark,
  HeartPulse,
  Wheat,
  PiggyBank,
  Utensils,
  Laptop,
  FileCheck,
  PhoneCall,
  AlertCircle,
  Sparkles,
  ChevronRight,
  Compass,
  Building2,
  Sun,
  Zap,
  Hammer,
  GraduationCap,
  Baby,
  Coins,
  Briefcase,
  Users,
  Home,
  CheckCircle2,
  Copy,
  Check,
  Phone,
  RefreshCw,
  QrCode,
  Printer,
  Download,
  Info,
  Clock,
  Send,
  MessageSquare,
  HelpCircle,
  Volume2,
  Headphones,
  FileSpreadsheet,
  Award,
  Bell,
  BellRing,
  History,
  Sliders,
} from 'lucide-react';
import { triggerHaptic, sendLocalNotification, requestNotificationPermission } from '../utils/deviceHardware';
import { GovSchemesModal } from './GovSchemesModal';
import { FarmerProfile } from './FarmerProfile';
import {
  getStoredGovSchemes,
  GovScheme,
  syncGovSchemesWithOfficialPortals,
  pollGovernmentSchemesApi,
  initBackgroundSyncService,
  is24hBackgroundSyncActive,
  set24hBackgroundSyncActive,
  getNextPollCountdown,
  getLastPollTimestamp,
  getBackgroundSyncLogs,
  getLastSyncTime,
  BackgroundSyncLog,
} from '../utils/govSchemesEngine';

export interface ServiceItem {
  id: string;
  category: 'farmer' | 'gov' | 'bank' | 'scheme' | 'csc' | 'support';
  title: string;
  hindiTitle?: string;
  description: string;
  url: string;
  btnLabel: string;
  icon: React.ReactNode;
  iconBg: string;
  badgeColor: string;
  authority?: string;
  helpline?: string;
  benefits?: string[];
  documents?: string[];
  eligibility?: string[];
}

// 1. Core Services Data (Identity, Banking, CSC, Farmers, Welfare)
const BASE_SERVICES_DATA: ServiceItem[] = [
  // --- FARMER SERVICES (किसान सेवाएं) ---
  {
    id: 'digital-farmer-id',
    category: 'farmer',
    title: 'Digital Farmer ID (AgriStack)',
    hindiTitle: 'डिजिटल किसान पहचान पत्र (AgriStack Farmer ID)',
    description: '12-digit Unique Digital Farmer ID linked with Land Records, e-KYC, and PM-Kisan for hassle-free benefits.',
    url: 'https://agristack.gov.in',
    btnLabel: 'Farmer ID Portal',
    icon: <Award className="w-7 h-7 text-amber-500" />,
    iconBg: 'bg-amber-50 border-amber-200',
    badgeColor: 'text-amber-700 bg-amber-100',
    authority: 'Ministry of Agriculture & Digital India',
    helpline: '1800-180-1551',
    benefits: [
      '12 अंकों की अद्वितीय डिजिटल पहचान जिससे सभी कृषि योजनाओं का लाभ तुरंत मिलता है।',
      'खसरा-खतौनी, आधार और बैंक खाता सीधे लिंक, बार-बार दस्तावेज जमा करने से मुक्ति।',
      'पीएम-किसान, फसल बीमा, केसीसी लोन और खाद सब्सिडी में बिना रुकावट सीधा लाभ।',
    ],
    documents: ['आधार कार्ड', 'खतौनी नकल (भू-अभिलेख)', 'आधार से लिंक मोबाइल नंबर', 'बैंक पासबुक'],
    eligibility: ['सभी भूमिधारक, सीमांत, छोटे व पट्टेदार भारतीय किसान।'],
  },
  {
    id: 'pm-kisan-portal',
    category: 'farmer',
    title: 'PM-Kisan Samman Nidhi',
    hindiTitle: 'पीएम-किसान सम्मान निधि',
    description: 'Direct financial assistance of ₹6,000 per year in 3 equal installments to all eligible farmer families.',
    url: 'https://pmkisan.gov.in',
    btnLabel: 'PM-Kisan Portal',
    icon: <Wheat className="w-7 h-7 text-emerald-600" />,
    iconBg: 'bg-emerald-50 border-emerald-200',
    badgeColor: 'text-emerald-700 bg-emerald-100',
    authority: 'Ministry of Agriculture & Farmers Welfare',
    helpline: '155261 / 1800-11-5526',
    benefits: [
      '₹6,000 प्रति वर्ष सीधे आधार-सीडेड बैंक खाते में डीबीटी द्वारा।',
      'हर 4 महीने पर ₹2,000 की किस्त (अप्रैल-जुलाई, अगस्त-नवंबर, दिसंबर-मार्च)।',
      'मोबाइल ऐप पर फेस ऑथेंटिकेशन से घर बैठे ई-केवाईसी की सुविधा।',
    ],
    documents: ['आधार कार्ड', 'जमीन की खतौनी (खसरा/खता संख्या)', 'बैंक पासबुक', 'सक्रिय मोबाइल'],
    eligibility: ['खेती योग्य भूमि के मालिक किसान परिवार। संस्थागत व आयकर दाता अपात्र हैं।'],
  },
  {
    id: 'kisan-credit-card',
    category: 'farmer',
    title: 'Kisan Credit Card (KCC)',
    hindiTitle: 'किसान क्रेडिट कार्ड (सस्ता कृषि ऋण)',
    description: 'Subsidized 4% interest crop loans up to ₹3 lakh with collateral-free limit up to ₹1.60 lakh.',
    url: 'https://pmkisan.gov.in',
    btnLabel: 'Apply KCC',
    icon: <CreditCard className="w-7 h-7 text-amber-600" />,
    iconBg: 'bg-amber-50 border-amber-200',
    badgeColor: 'text-amber-700 bg-amber-100',
    authority: 'RBI & NABARD',
    helpline: '1800-180-1551',
    benefits: [
      'मात्र 4% रियायती ब्याज दर पर ₹3 लाख तक कृषि ऋण।',
      'बिना किसी जमीन बंधक के ₹1.60 लाख तक तुरंत स्वीकृति।',
      'खाद, बीज और फसल रखरखाव के लिए लचीली क्रेडिट सीमा।',
    ],
    documents: ['आवेदन फॉर्म', 'आधार कार्ड', 'जमीन की फर्द (खतौनी)', 'पासपोर्ट फोटो', 'बैंक खाता'],
    eligibility: ['सभी किसान, काश्तकार और स्वयं सहायता समूह (SHG) सदस्य।'],
  },
  {
    id: 'pm-fasal-bima',
    category: 'farmer',
    title: 'PM Fasal Bima Yojana (PMFBY)',
    hindiTitle: 'प्रधानमंत्री फसल बीमा योजना',
    description: 'Comprehensive crop insurance against drought, floods, hailstorms, and unseasonal weather damage.',
    url: 'https://pmfby.gov.in',
    btnLabel: 'Crop Insurance',
    icon: <Shield className="w-7 h-7 text-blue-600" />,
    iconBg: 'bg-blue-50 border-blue-200',
    badgeColor: 'text-blue-700 bg-blue-100',
    authority: 'Ministry of Agriculture',
    helpline: '14447',
    benefits: [
      'रबी फसलों पर मात्र 1.5% और खरीफ पर 2% नाममात्र प्रीमियम।',
      'फसल नुकसान के 72 घंटे के अंदर सीधे ऐप या टोल-फ्री 14447 पर क्लेम दर्ज।',
      'मुआवजा सीधे बैंक खाते में डीबीटी द्वारा।',
    ],
    documents: ['बुवाई प्रमाण पत्र', 'खतौनी नकल', 'आधार कार्ड', 'बैंक पासबुक'],
    eligibility: ['अधिसूचित क्षेत्र में अधिसूचित फसल उगाने वाले सभी किसान।'],
  },
  {
    id: 'enam-mandi',
    category: 'farmer',
    title: 'National Agriculture Market (e-NAM)',
    hindiTitle: 'राष्ट्रीय कृषि बाजार (ई-नाम मंडी)',
    description: 'Online trading platform connecting 1,300+ APMC mandis across India for transparent competitive prices.',
    url: 'https://enam.gov.in',
    btnLabel: 'e-NAM Portal',
    icon: <Building2 className="w-7 h-7 text-teal-600" />,
    iconBg: 'bg-teal-50 border-teal-200',
    badgeColor: 'text-teal-700 bg-teal-100',
    authority: 'Small Farmers Agri-Business Consortium (SFAC)',
    helpline: '1800-270-0224',
    benefits: [
      '1,300+ मंडियों के व्यापारियों से अपनी उपज के लिए पारदर्शी ऑनलाइन बोली।',
      'बिचौलियों और आढ़तियों की कमीशनखोरी से मुक्ति, बेहतर दाम।',
      'बिक्री राशि सीधे बैंक खाते में ऑनलाइन हस्तांतरित।',
    ],
    documents: ['आधार कार्ड', 'बैंक पासबुक', 'मंडी पंजीकरण प्रमाण', 'मोबाइल नंबर'],
    eligibility: ['भारत का कोई भी किसान जो अपनी कृषि उपज बेचना चाहता है।'],
  },
  {
    id: 'soil-health-card',
    category: 'farmer',
    title: 'Soil Health Card Portal',
    hindiTitle: 'मृदा स्वास्थ्य कार्ड (Soil Health)',
    description: 'Get free soil test reports, nutrient status, and customized fertilizer dosage recommendations for your farm.',
    url: 'https://soilhealth.dac.gov.in',
    btnLabel: 'Soil Card Portal',
    icon: <FileSpreadsheet className="w-7 h-7 text-lime-600" />,
    iconBg: 'bg-lime-50 border-lime-200',
    badgeColor: 'text-lime-700 bg-lime-100',
    authority: 'Ministry of Agriculture',
    helpline: '1800-180-1551',
    benefits: ['खेत की मिट्टी में 12 पोषक तत्वों की जांच और सही खाद की सलाह।', 'उर्वरक लागत में 20% तक बचत।'],
    documents: ['खसरा नंबर', 'आधार कार्ड', 'मोबाइल नंबर'],
    eligibility: ['सभी किसान।'],
  },
  {
    id: 'pm-krishi-sinchayee',
    category: 'farmer',
    title: 'PM Krishi Sinchayee (Per Drop More Crop)',
    hindiTitle: 'ड्रिप व स्प्रिंकलर सिंचाई सब्सिडी',
    description: 'Up to 55% to 80% government subsidy on drip and sprinkler micro-irrigation systems for higher yield.',
    url: 'https://pmksy.gov.in',
    btnLabel: 'Sinchayee Portal',
    icon: <Zap className="w-7 h-7 text-cyan-600" />,
    iconBg: 'bg-cyan-50 border-cyan-200',
    badgeColor: 'text-cyan-700 bg-cyan-100',
    authority: 'Ministry of Agriculture & Jal Shakti',
    helpline: '1800-180-1551',
    benefits: ['ड्रिप व स्प्रिंकलर सिस्टम पर 55% से 80% तक सब्सिडी।', 'पानी की 50% बचत व 40% अधिक उत्पादन।'],
    documents: ['आधार कार्ड', 'खतौनी', 'सिंचाई स्रोत प्रमाण', 'बैंक पासबुक'],
    eligibility: ['सभी किसान जिनके पास सिंचाई हेतु पानी का स्रोत उपलब्ध है।'],
  },
  {
    id: 'smam-tractor-subsidy',
    category: 'farmer',
    title: 'SMAM Tractor & Agri Machinery Subsidy',
    hindiTitle: 'कृषि यंत्र व ट्रैक्टर सब्सिडी (SMAM)',
    description: 'Get 50% to 80% subsidy on purchase of tractors, rotavators, power tillers, and modern farm tools.',
    url: 'https://agrimachinery.nic.in',
    btnLabel: 'Machinery Subsidy',
    icon: <Hammer className="w-7 h-7 text-orange-600" />,
    iconBg: 'bg-orange-50 border-orange-200',
    badgeColor: 'text-orange-700 bg-orange-100',
    authority: 'Ministry of Agriculture',
    helpline: '1800-180-1551',
    benefits: ['ट्रैक्टर व कृषि यंत्रों पर 50% तक सब्सिडी।', 'कस्टम हायरिंग सेंटर पर 80% तक अनुदान।'],
    documents: ['आधार कार्ड', 'खतौनी', 'बैंक पासबुक', 'यंत्र कोटेशन'],
    eligibility: ['सभी किसान जिन्होंने पिछले 3 से 5 वर्षों में उसी यंत्र पर सब्सिडी न ली हो।'],
  },
  {
    id: 'pashu-kisan-credit',
    category: 'farmer',
    title: 'Pashu Kisan Credit Card (PKCC)',
    hindiTitle: 'पशु किसान क्रेडिट कार्ड (डेयरी लोन)',
    description: 'Collateral-free working capital loan up to ₹1.60 lakh at 4% effective interest for cows, buffaloes, and goats.',
    url: 'https://dahd.nic.in',
    btnLabel: 'Pashu KCC',
    icon: <Coins className="w-7 h-7 text-rose-600" />,
    iconBg: 'bg-rose-50 border-rose-200',
    badgeColor: 'text-rose-700 bg-rose-100',
    authority: 'Department of Animal Husbandry',
    helpline: '1800-180-1551',
    benefits: ['प्रति गाय ₹40,783 और प्रति भैंस ₹60,249 तक का 4% ब्याज पर ऋण।', 'बिना किसी गारंटी ₹1.60 लाख तक बैंक लोन।'],
    documents: ['आधार कार्ड', 'पैन कार्ड', 'पशु स्वास्थ्य प्रमाण पत्र', 'बैंक पासबुक'],
    eligibility: ['दुधारू पशु पालक किसान।'],
  },

  // --- IDENTITY & DL (पहचान पत्र व ड्राइविंग) ---
  {
    id: 'aadhaar',
    category: 'gov',
    title: 'Aadhaar Services (UIDAI)',
    hindiTitle: 'आधार कार्ड सेवाएं (UIDAI)',
    description: 'Download Aadhaar, update mobile/address, check linking status, or book enrollment appointment.',
    url: 'https://uidai.gov.in',
    btnLabel: 'UIDAI Portal',
    icon: <CreditCard className="w-7 h-7 text-blue-600" />,
    iconBg: 'bg-blue-50 border-blue-200',
    badgeColor: 'text-blue-700 bg-blue-100',
    authority: 'UIDAI, Government of India',
    helpline: '1947',
    benefits: ['सुरक्षित डिजिटल आधार डाउनलोड', 'मोबाइल व पता ऑनलाइन अपडेट', 'बैंक व पैन सीडिंग स्थिति जांच'],
    documents: ['पहचान प्रमाण (POI)', 'पते का प्रमाण (POA)', 'जन्म तिथि प्रमाण'],
    eligibility: ['सभी भारतीय निवासी नागरिक।'],
  },
  {
    id: 'pan',
    category: 'gov',
    title: 'PAN Card Services',
    hindiTitle: 'पैन कार्ड सेवाएं (Protean / UTI)',
    description: 'Apply for fresh PAN card, reprint physical card, or link Aadhaar with PAN online.',
    url: 'https://www.protean-tinpan.com',
    btnLabel: 'Apply PAN Card',
    icon: <FileText className="w-7 h-7 text-indigo-600" />,
    iconBg: 'bg-indigo-50 border-indigo-200',
    badgeColor: 'text-indigo-700 bg-indigo-100',
    authority: 'Income Tax Department',
    helpline: '1800-180-1961',
    benefits: ['नया पैन कार्ड आवेदन', 'आधार-पैन लिंकिंग सत्यापन', 'ई-पैन तुरंत डाउनलोड'],
    documents: ['आधार कार्ड', 'पासपोर्ट फोटो', 'हस्ताक्षर'],
    eligibility: ['सभी भारतीय नागरिक व कंपनियां।'],
  },
  {
    id: 'dl',
    category: 'gov',
    title: 'Driving License (Sarathi)',
    hindiTitle: 'ड्राइविंग लाइसेंस (परिवहन सारथी)',
    description: "Apply for Learner's License, DL renewal, duplicate DL, and vehicle RC services online.",
    url: 'https://parivahan.gov.in',
    btnLabel: 'Parivahan Portal',
    icon: <Shield className="w-7 h-7 text-cyan-600" />,
    iconBg: 'bg-cyan-50 border-cyan-200',
    badgeColor: 'text-cyan-700 bg-cyan-100',
    authority: 'Ministry of Road Transport & Highways',
    helpline: '0120-4925505',
    benefits: ['लर्नर लाइसेंस ऑनलाइन टेस्ट', 'स्थाई डीएल आवेदन व स्लॉट बुकिंग', 'वाहन आरसी सेवाएं'],
    documents: ['आधार कार्ड', 'उम्र प्रमाण', 'पता प्रमाण', 'मेडिकल सर्टिफिकेट (फॉर्म 1A)'],
    eligibility: ['18 वर्ष या उससे अधिक आयु के नागरिक (गियरलेस हेतु 16 वर्ष)।'],
  },
  {
    id: 'voter',
    category: 'gov',
    title: 'Voter ID (ECI Portal)',
    hindiTitle: 'मतदाता पहचान पत्र (ECI)',
    description: 'New voter registration (Form 6), correction of entry, constituency shift, and e-EPIC download.',
    url: 'https://voters.eci.gov.in',
    btnLabel: 'Voters Portal',
    icon: <FileCheck className="w-7 h-7 text-purple-600" />,
    iconBg: 'bg-purple-50 border-purple-200',
    badgeColor: 'text-purple-700 bg-purple-100',
    authority: 'Election Commission of India',
    helpline: '1950',
    benefits: ['नया वोटर कार्ड ऑनलाइन आवेदन', 'डिजिटल e-EPIC कार्ड डाउनलोड', 'वोटर लिस्ट में नाम खोज'],
    documents: ['आधार कार्ड', 'निवास प्रमाण', 'पासपोर्ट फोटो'],
    eligibility: ['18 वर्ष पूर्ण कर चुके सभी भारतीय नागरिक।'],
  },
  {
    id: 'passport',
    category: 'gov',
    title: 'Passport Seva',
    hindiTitle: 'पासपोर्ट सेवा पोर्टल',
    description: 'Apply for fresh or reissue passport, track application status, and book PSK appointments.',
    url: 'https://www.passportindia.gov.in',
    btnLabel: 'Passport Portal',
    icon: <Compass className="w-7 h-7 text-sky-600" />,
    iconBg: 'bg-sky-50 border-sky-200',
    badgeColor: 'text-sky-700 bg-sky-100',
    authority: 'Ministry of External Affairs',
    helpline: '1800-258-1800',
    benefits: ['ऑनलाइन पासपोर्ट आवेदन', 'तत्काल व सामान्य श्रेणी स्लॉट बुकिंग', 'आवेदन स्थिति की रियल-टाइम ट्रैकिंग'],
    documents: ['आधार कार्ड', 'पैन कार्ड', 'जन्म प्रमाण पत्र', 'बैंक पासबुक'],
    eligibility: ['सभी भारतीय नागरिक।'],
  },

  // --- BANKING & CSP (बैंकिंग सेवाएं) ---
  {
    id: 'sbi',
    category: 'bank',
    title: 'SBI Online Account & Banking',
    hindiTitle: 'एसबीआई ऑनलाइन बैंक खाता',
    description: 'Instant zero-balance savings bank account opening with Video KYC verification online.',
    url: 'https://onlinesbi.sbi',
    btnLabel: 'Open Account',
    icon: <Landmark className="w-7 h-7 text-emerald-600" />,
    iconBg: 'bg-emerald-50 border-emerald-200',
    badgeColor: 'text-emerald-700 bg-emerald-100',
    authority: 'State Bank of India',
    helpline: '1800-1234 / 1800-2100',
    benefits: ['घर बैठे वीडियो केवाईसी द्वारा खाता खोलें', 'तुरंत डेबिट कार्ड व इंटरनेट बैंकिंग', 'बिना शाखा जाए सुरक्षित बैंकिंग'],
    documents: ['आधार कार्ड', 'पैन कार्ड', 'सक्रिय मोबाइल'],
    eligibility: ['18 वर्ष से अधिक आयु के भारतीय नागरिक।'],
  },
  {
    id: 'csc-csp',
    category: 'bank',
    title: 'CSC Digital Kiosk (CSP & AePS)',
    hindiTitle: 'सीएससी डिजिटल कियोस्क व एईपीएस',
    description: 'Access official CSC banking gateway, AePS fingerprint cash withdrawal networks, and Micro-ATM services.',
    url: 'https://csccloud.in',
    btnLabel: 'Login CSP',
    icon: <Laptop className="w-7 h-7 text-teal-600" />,
    iconBg: 'bg-teal-50 border-teal-200',
    badgeColor: 'text-teal-700 bg-teal-100',
    authority: 'CSC e-Governance Services',
    helpline: '14599',
    benefits: ['आधार आधारित नकदी निकासी (AePS)', 'डायरेक्ट मनी ट्रांसफर (DMT)', 'बैलेंस पूछताछ व मिनी स्टेटमेंट'],
    documents: ['सीएससी वीएलई आईडी', 'बायोमेट्रिक डिवाइस', 'आधार कार्ड'],
    eligibility: ['अधिकृत सीएससी संचालक व नागरिक।'],
  },
  {
    id: 'itr',
    category: 'bank',
    title: 'Income Tax e-Filing Portal',
    hindiTitle: 'आयकर ई-फाइलिंग पोर्टल (ITR)',
    description: 'File Income Tax Return (ITR), verify refund status, and link Aadhaar with PAN.',
    url: 'https://www.incometax.gov.in',
    btnLabel: 'ITR Portal',
    icon: <FileText className="w-7 h-7 text-green-600" />,
    iconBg: 'bg-green-50 border-green-200',
    badgeColor: 'text-green-700 bg-green-100',
    authority: 'Income Tax Department',
    helpline: '1800-103-0025',
    benefits: ['निःशुल्क ऑनलाइन आईटीआर फाइलिंग', 'रिफंड स्टेटस लाइव ट्रैकिंग', 'फॉर्म 26AS व AIS डाउनलोड'],
    documents: ['पैन कार्ड', 'आधार कार्ड', 'फॉर्म 16', 'बैंक खाता विवरण'],
    eligibility: ['करदाता नागरिक व वेतनभोगी कर्मचारी।'],
  },

  // --- CSC & CITIZEN SERVICES ---
  {
    id: 'csc-sewa',
    category: 'csc',
    title: 'CSC Digital Seva Connect',
    hindiTitle: 'सीएससी डिजिटल सेवा कनेक्ट',
    description: 'Central CSC VLE login for 400+ G2C, B2C, utility bills, passport, and pension citizen services.',
    url: 'https://digitalseva.csc.gov.in',
    btnLabel: 'Login Digital Seva',
    icon: <Laptop className="w-7 h-7 text-violet-600" />,
    iconBg: 'bg-violet-50 border-violet-200',
    badgeColor: 'text-violet-700 bg-violet-100',
    authority: 'CSC e-Governance India Ltd.',
    helpline: '14599',
    benefits: ['400+ सरकारी व गैर-सरकारी सेवाओं का एकल मंच', 'बिजली, पानी व गैस बिल भुगतान', 'पैन, आधार व आयुष्मान सेवाएं'],
    documents: ['वीएलई क्रेडेंशियल्स'],
    eligibility: ['पंजीकृत सीएससी केंद्र संचालक।'],
  },
  {
    id: 'digital-gramin-seva',
    category: 'csc',
    title: 'Digital Gramin Seva',
    hindiTitle: 'डिजिटल ग्रामीण सेवा',
    description: 'Rural digital kiosk partner portal for AePS cash withdrawal, DMT money transfer, BBPS utility bills, and citizen services.',
    url: 'https://digitalgraminseva.in',
    btnLabel: 'Login Gramin Seva',
    icon: <Building2 className="w-7 h-7 text-emerald-600" />,
    iconBg: 'bg-emerald-50 border-emerald-200',
    badgeColor: 'text-emerald-700 bg-emerald-100',
    authority: 'Digital Gramin Seva Kendra',
    helpline: '011-411-82828',
    benefits: ['ग्रामीण क्षेत्रों में नकदी निकासी व जमा', 'माइक्रो एटीएम व मनी ट्रांसफर', 'सभी यूटिलिटी बिल पेमेंट'],
    documents: ['रिटेलर आईडी प्रमाण'],
    eligibility: ['ग्रामीण उद्यमी व ग्राहक।'],
  },
  {
    id: 'e-district',
    category: 'csc',
    title: 'State e-District Services',
    hindiTitle: 'ई-डिस्ट्रिक्ट (जाति, आय, निवास प्रमाण)',
    description: 'Apply for Caste, Income, Domicile (Niwas), Birth, Death, and Disability certificates online.',
    url: 'https://india.gov.in',
    btnLabel: 'National Portal',
    icon: <FileCheck className="w-7 h-7 text-purple-600" />,
    iconBg: 'bg-purple-50 border-purple-200',
    badgeColor: 'text-purple-700 bg-purple-100',
    authority: 'State Governments & MeitY',
    helpline: '1800-111-555',
    benefits: ['डिजिटली हस्ताक्षरित वैध प्रमाण पत्र', 'दफ्तरों के चक्कर से मुक्ति', 'ऑनलाइन सत्यापन कोड सहित'],
    documents: ['आधार कार्ड', 'राशन कार्ड', 'स्व-घोषणा पत्र', 'फोटो'],
    eligibility: ['संबंधित राज्य के निवासी।'],
  },
];

// Official 24x7 Citizen & Customer Care Directory
const CUSTOMER_SERVICE_HELPLINES = [
  {
    name: 'Kisan Call Centre (KCC)',
    hindiName: 'किसान कॉल सेंटर (कृषि सलाह व समस्या)',
    number: '1800-180-1551',
    hours: '24x7 Toll-Free (22 Languages)',
    category: 'farmer',
    badge: 'Farmers',
    desc: 'फसल रोग, खाद, बीज, मौसम, मंडी भाव और सरकारी कृषि योजनाओं की विशेषज्ञ सलाह।',
  },
  {
    name: 'PM-Kisan Samman Nidhi Helpline',
    hindiName: 'पीएम-किसान हेल्पलाइन',
    number: '155261',
    altNumber: '1800-11-5526',
    hours: '24x7 Toll-Free',
    category: 'farmer',
    badge: 'PM-Kisan',
    desc: 'पीएम-किसान किस्त न आने, ई-केवाईसी में समस्या, बैंक सीडिंग या आवेदन सुधार हेतु।',
  },
  {
    name: 'Aadhaar Helpdesk (UIDAI)',
    hindiName: 'आधार हेल्पलाइन (यूआईडीएआई)',
    number: '1947',
    hours: '24x7 Toll-Free (All Languages)',
    category: 'gov',
    badge: 'Aadhaar',
    desc: 'आधार डाउनलोड, मोबाइल अपडेट, बायोमेट्रिक लॉक/अनलॉक और ऑथेंटिकेशन सहायता।',
  },
  {
    name: 'Ayushman Bharat (PM-JAY)',
    hindiName: 'आयुष्मान भारत राष्ट्रीय हेल्पलाइन',
    number: '14555',
    altNumber: '1800-11-4477',
    hours: '24x7 Free Service',
    category: 'scheme',
    badge: 'Health',
    desc: '₹5 लाख मुफ्त इलाज, सूचीबद्ध अस्पताल की जानकारी, और 70+ वरिष्ठ नागरिक कार्ड सहायता।',
  },
  {
    name: 'PM Fasal Bima Yojana (Crop Insurance)',
    hindiName: 'प्रधानमंत्री फसल बीमा हेल्पलाइन',
    number: '14447',
    hours: '24x7 Active',
    category: 'farmer',
    badge: 'Insurance',
    desc: 'बेमौसम बारिश, ओलावृष्टि या सूखे से फसल नुकसान पर 72 घंटे में क्लेम दर्ज करें।',
  },
  {
    name: 'National Consumer Helpline (NCH)',
    hindiName: 'राष्ट्रीय उपभोक्ता हेल्पलाइन',
    number: '1915',
    hours: '24x7 Toll-Free',
    category: 'support',
    badge: 'Consumer',
    desc: 'ऑनलाइन धोखाधड़ी, बैंक गड़बड़ी, दोषपूर्ण उत्पाद व सेवा शिकायत निवारण।',
  },
  {
    name: 'National Cyber Crime Reporting',
    hindiName: 'साइबर अपराध हेल्पलाइन',
    number: '1930',
    hours: '24x7 Immediate Emergency',
    category: 'support',
    badge: 'Cyber Fraud',
    desc: 'बैंक खाते से अनधिकृत पैसे कटने, ओटीपी फ्रॉड, या ऑनलाइन ठगी पर तुरंत कॉल करें।',
  },
  {
    name: 'All-in-One National Emergency',
    hindiName: 'राष्ट्रीय आपातकालीन सेवा',
    number: '112',
    hours: '24x7 Toll-Free',
    category: 'support',
    badge: 'Emergency',
    desc: 'पुलिस, एम्बुलेंस, अग्निशमन (फायर) और आपदा राहत के लिए एकल आपात नंबर।',
  },
];

interface RpJansabhaPortalProps {
  initialTab?: 'all' | 'farmer' | 'support' | 'scheme' | 'gov' | 'bank' | 'csc';
  onSpeakJarvisGuide?: (text: string) => void;
}

export const RpJansabhaPortal: React.FC<RpJansabhaPortalProps> = ({ initialTab, onSpeakJarvisGuide }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'farmer' | 'support' | 'scheme' | 'gov' | 'bank' | 'csc'>(
    initialTab || 'all'
  );

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [isSchemesModalOpen, setIsSchemesModalOpen] = useState(false);
  const [govSchemes, setGovSchemes] = useState<GovScheme[]>(() => getStoredGovSchemes());
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncText, setLastSyncText] = useState(() => getLastSyncTime());
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // --- 24-HOUR BACKGROUND SYNC SERVICE & NOTIFICATION STATE ---
  const [is24hSyncOn, setIs24hSyncOn] = useState(() => is24hBackgroundSyncActive());
  const [countdownText, setCountdownText] = useState(() => getNextPollCountdown().formatted);
  const [syncLogsModalOpen, setSyncLogsModalOpen] = useState(false);
  const [syncLogs, setSyncLogs] = useState<BackgroundSyncLog[]>(() => getBackgroundSyncLogs());
  const [newlyAddedSchemeBanner, setNewlyAddedSchemeBanner] = useState<GovScheme | null>(null);
  const [notificationPermissionState, setNotificationPermissionState] = useState<NotificationPermission>(() => {
    return typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'denied';
  });
  const [isSimulatingNewScheme, setIsSimulatingNewScheme] = useState(false);

  // Initialize 24-Hour Background Polling Service on Mount
  useEffect(() => {
    const cleanup = initBackgroundSyncService((newSchemes) => {
      if (newSchemes.length > 0) {
        setNewlyAddedSchemeBanner(newSchemes[0]);
        if (onSpeakJarvisGuide) {
          onSpeakJarvisGuide(
            `नई सरकारी योजना जोड़ी गई है: ${newSchemes[0].hindiName || newSchemes[0].name}. ${newSchemes[0].keyHighlight}`
          );
        }
      }
      setGovSchemes(getStoredGovSchemes());
      setLastSyncText(getLastSyncTime());
      setSyncLogs(getBackgroundSyncLogs());
      setCountdownText(getNextPollCountdown().formatted);
    });

    // 1-second interval to update countdown ticker
    const ticker = setInterval(() => {
      setCountdownText(getNextPollCountdown().formatted);
    }, 1000);

    return () => {
      cleanup();
      clearInterval(ticker);
    };
  }, [onSpeakJarvisGuide]);

  // Selected Service Detail Modal (safe launcher to avoid "Page not working")
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);

  // --- CUSTOMER SERVICE GRIEVANCE / TICKET STATE ---
  const [grievanceCategory, setGrievanceCategory] = useState('farmer');
  const [citizenName, setCitizenName] = useState('');
  const [citizenPhone, setCitizenPhone] = useState('');
  const [citizenProblem, setCitizenProblem] = useState('');
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [ticketSubmittedSuccess, setTicketSubmittedSuccess] = useState<string | null>(null);
  const [myTickets, setMyTickets] = useState<
    Array<{
      ticketId: string;
      category: string;
      name: string;
      phone: string;
      problem: string;
      date: string;
      status: 'Received' | 'Officer Assigned' | 'Under Investigation' | 'Resolved';
    }>
  >(() => {
    try {
      const raw = localStorage.getItem('rp_jansabha_user_tickets');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Listen for automatic scheme synchronization updates
  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const custom = e as CustomEvent;
      if (custom.detail && Array.isArray(custom.detail)) {
        setGovSchemes(custom.detail);
      } else {
        setGovSchemes(getStoredGovSchemes());
      }
      setLastSyncText(getLastSyncTime());
      setSyncLogs(getBackgroundSyncLogs());
    };
    window.addEventListener('jarvis_gov_schemes_updated', handleUpdate);
    return () => window.removeEventListener('jarvis_gov_schemes_updated', handleUpdate);
  }, []);

  // Merge static services with dynamic auto-updated government schemes
  const allServices = useMemo(() => {
    const existingIds = new Set(BASE_SERVICES_DATA.map((s) => s.id));
    const dynamicItems: ServiceItem[] = [];

    (govSchemes || []).forEach((gs) => {
      if (!existingIds.has(gs.id)) {
        // Map scheme categories to portal tab categories
        let cat: 'farmer' | 'gov' | 'bank' | 'scheme' | 'csc' | 'support' = 'scheme';
        if (gs.category === 'farmers') cat = 'farmer';

        dynamicItems.push({
          id: gs.id,
          category: cat,
          title: gs.name,
          hindiTitle: gs.hindiName,
          description: `${gs.keyHighlight} — ${gs.tagline}`,
          url: gs.officialUrl,
          btnLabel: 'आवेदन पोर्टल',
          icon: <Sparkles className="w-7 h-7 text-amber-500" />,
          iconBg: 'bg-amber-50 border-amber-200',
          badgeColor: 'text-amber-700 bg-amber-100',
          authority: gs.source || 'भारत सरकार / myScheme',
          helpline: '1800-111-555',
          benefits: gs.benefits,
          documents: gs.documentsRequired,
          eligibility: gs.eligibility,
        });
      }
    });

    return [...BASE_SERVICES_DATA, ...dynamicItems];
  }, [govSchemes]);

  // Filtered services
  const filteredServices = useMemo(() => {
    const q = (searchQuery || '').toLowerCase().trim();
    return allServices.filter((s) => {
      const matchTab = activeTab === 'all' || s.category === activeTab;
      const title = (s.title || '').toLowerCase();
      const hindi = (s.hindiTitle || '').toLowerCase();
      const desc = (s.description || '').toLowerCase();
      const cat = (s.category || '').toLowerCase();
      const auth = (s.authority || '').toLowerCase();

      const matchSearch =
        !q ||
        title.includes(q) ||
        hindi.includes(q) ||
        desc.includes(q) ||
        cat.includes(q) ||
        auth.includes(q);

      return matchTab && matchSearch;
    });
  }, [searchQuery, activeTab, allServices]);

  // Handle Manual Synchronize
  const handleManualSync = async () => {
    setIsSyncing(true);
    triggerHaptic([30, 50]);
    try {
      const res = await syncGovSchemesWithOfficialPortals();
      setGovSchemes(res.schemes);
      setLastSyncText(getLastSyncTime());
      if (onSpeakJarvisGuide) {
        onSpeakJarvisGuide(`Government schemes successfully synchronized. Total ${res.schemes.length} schemes are active.`);
      }
    } finally {
      setTimeout(() => setIsSyncing(false), 600);
    }
  };

  // Toggle 24-Hour Background Polling
  const handleToggle24hSync = () => {
    triggerHaptic([25]);
    const next = !is24hSyncOn;
    set24hBackgroundSyncActive(next);
    setIs24hSyncOn(next);
    if (onSpeakJarvisGuide) {
      onSpeakJarvisGuide(
        next
          ? '24-hour background government schemes sync activated. Mock government API will be polled every 24 hours.'
          : '24-hour background sync paused.'
      );
    }
  };

  // Trigger 24-Hour Poll on Demand
  const handleTrigger24hPollNow = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    triggerHaptic([30, 40]);
    try {
      const res = await pollGovernmentSchemesApi({ triggeredBy: 'manual' });
      setGovSchemes(getStoredGovSchemes());
      setLastSyncText(getLastSyncTime());
      setSyncLogs(getBackgroundSyncLogs());
      setCountdownText(getNextPollCountdown().formatted);
      if (res.newSchemes && res.newSchemes.length > 0) {
        setNewlyAddedSchemeBanner(res.newSchemes[0]);
      }
      if (onSpeakJarvisGuide) {
        onSpeakJarvisGuide(res.message);
      }
    } finally {
      setTimeout(() => setIsSyncing(false), 600);
    }
  };

  // Simulate New Government Scheme via 24h Background Polling Service
  const handleSimulateNewScheme = async () => {
    if (isSimulatingNewScheme) return;
    setIsSimulatingNewScheme(true);
    triggerHaptic([40, 60, 40]);
    try {
      const res = await pollGovernmentSchemesApi({
        simulateNew: true,
        triggeredBy: 'simulated',
      });
      setGovSchemes(getStoredGovSchemes());
      setLastSyncText(getLastSyncTime());
      setSyncLogs(getBackgroundSyncLogs());
      setCountdownText(getNextPollCountdown().formatted);
      if (res.newSchemes && res.newSchemes.length > 0) {
        setNewlyAddedSchemeBanner(res.newSchemes[0]);
        if (onSpeakJarvisGuide) {
          onSpeakJarvisGuide(
            `नई सरकारी योजना सफलतापूर्वक प्राप्त हुई: ${res.newSchemes[0].hindiName || res.newSchemes[0].name}. स्थानीय नोटिफिकेशन भेजा गया है।`
          );
        }
      }
    } finally {
      setTimeout(() => setIsSimulatingNewScheme(false), 800);
    }
  };

  // Request Local Notification Permission
  const handleRequestNotificationPermission = async () => {
    triggerHaptic([20]);
    const perm = await requestNotificationPermission();
    setNotificationPermissionState(perm);
    if (perm === 'granted') {
      sendLocalNotification('🏛️ RP Jansabha Portal: Notifications Enabled', {
        body: '24-hour background syncing service will push alerts when new government schemes are launched.',
        icon: '/assets/jarvis-icon.png',
      });
      if (onSpeakJarvisGuide) {
        onSpeakJarvisGuide('Local notification permission granted. You will receive alerts when new schemes are added.');
      }
    }
  };

  // Safe launcher handler (avoids "Page not working")
  const handleOpenOfficialUrl = (url: string, title: string) => {
    triggerHaptic([30]);
    if (onSpeakJarvisGuide) {
      onSpeakJarvisGuide(`Opening verified official portal for ${title}.`);
    }
    try {
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      window.location.href = url;
    }
  };

  const handleCopyLink = (url: string) => {
    triggerHaptic([20]);
    try {
      navigator.clipboard.writeText(url);
      setCopiedLink(url);
      setTimeout(() => setCopiedLink(null), 2500);
    } catch {
      setCopiedLink(url);
      setTimeout(() => setCopiedLink(null), 2500);
    }
  };

  // --- SUBMIT GRIEVANCE / CALLBACK TICKET ---
  const handleSubmitGrievance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!citizenName.trim() || !citizenPhone.trim() || !citizenProblem.trim()) return;

    setIsSubmittingTicket(true);
    triggerHaptic([40, 60]);
    setTimeout(() => {
      const newTicketId = `JANSUNWAI-${Math.floor(10000 + Math.random() * 90000)}`;
      const now = new Date();
      const dateStr = `${now.getDate()} ${now.toLocaleString('default', { month: 'short' })} ${now.getFullYear()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

      const newTicket = {
        ticketId: newTicketId,
        category: grievanceCategory,
        name: citizenName.trim(),
        phone: citizenPhone.trim(),
        problem: citizenProblem.trim(),
        date: dateStr,
        status: 'Officer Assigned' as const,
      };

      const updated = [newTicket, ...myTickets];
      setMyTickets(updated);
      try {
        localStorage.setItem('rp_jansabha_user_tickets', JSON.stringify(updated));
      } catch {}

      setIsSubmittingTicket(false);
      setTicketSubmittedSuccess(newTicketId);
      setCitizenProblem('');

      if (onSpeakJarvisGuide) {
        onSpeakJarvisGuide(`Your complaint has been registered with ticket ID ${newTicketId}. An officer will contact you within 24 hours.`);
      }
    }, 800);
  };

  return (
    <div className="w-full flex flex-col items-center select-none pb-28">
      {/* 1. Header Banner */}
      <div className="w-full rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-[#0a192f] via-[#0f2d42] to-[#1e3a5f] text-white shadow-2xl relative overflow-hidden border border-slate-700/60 mb-6">
        <div className="absolute -right-8 -top-8 w-48 h-48 bg-amber-400/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-8 -bottom-8 w-48 h-48 bg-emerald-400/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 text-center max-w-3xl mx-auto flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Digital India & Citizen Services Hub</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-wide text-white drop-shadow-sm">
            RP JANSABHA
          </h1>
          <p className="text-amber-400 font-medium text-sm sm:text-base mt-1">
            राष्ट्रीय डिजिटल सेवा सहायता, किसान पहचान पत्र (AgriStack) व 24x7 ग्राहक सेवा
          </p>
          <p className="text-xs text-slate-300 max-w-xl mt-2 leading-relaxed">
            One-Stop Verified Gateway for Farmer ID, PM-Kisan, Driving License, Aadhaar, Banking CSP, Ayushman Bharat, Government Schemes & 24x7 Citizen Helpdesk.
          </p>

          {/* Quick Stats Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 mt-4">
            <span className="px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700 text-[11px] text-slate-200 flex items-center gap-1.5 font-medium">
              <Wheat className="w-3.5 h-3.5 text-amber-400" />
              <span>किसान पहचान पत्र (AgriStack)</span>
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700 text-[11px] text-slate-200 flex items-center gap-1.5 font-medium">
              <Headphones className="w-3.5 h-3.5 text-cyan-400" />
              <span>24x7 ग्राहक सेवा व जनसुनवाई</span>
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700 text-[11px] text-slate-200 flex items-center gap-1.5 font-medium">
              <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
              <span>ऑटो-अपडेट योजना इंजन</span>
            </span>
          </div>
        </div>
      </div>

      {/* 2A. Newly Added Government Scheme Alert Banner (Triggered by 24h Background Polling) */}
      {newlyAddedSchemeBanner && (
        <div className="w-full max-w-5xl mb-6 p-4 rounded-3xl bg-gradient-to-r from-emerald-950/90 via-slate-900 to-amber-950/90 border-2 border-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.35)] relative overflow-hidden animate-in fade-in slide-in-from-top-3 duration-300">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-400 text-emerald-300 shrink-0 shadow-lg">
                <BellRing className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-400 text-slate-950 shadow">
                    🔔 NEW SCHEME DETECTED BY 24H BACKGROUND SYNC
                  </span>
                  <span className="text-[11px] font-mono text-emerald-300">
                    {newlyAddedSchemeBanner.launchYear || '2026'} • {newlyAddedSchemeBanner.categoryLabel}
                  </span>
                  <span className="text-[10px] text-amber-300 font-mono">
                    Local Notification Pushed
                  </span>
                </div>
                <h4 className="text-base sm:text-lg font-black text-white">
                  {newlyAddedSchemeBanner.hindiName}
                </h4>
                <p className="text-xs text-amber-200/90 font-medium mt-0.5">
                  {newlyAddedSchemeBanner.name}
                </p>
                <p className="text-xs text-slate-300 mt-1.5 line-clamp-2">
                  {newlyAddedSchemeBanner.tagline || newlyAddedSchemeBanner.keyHighlight}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto shrink-0 justify-end">
              {onSpeakJarvisGuide && (
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic([20]);
                    onSpeakJarvisGuide(
                      `नई सरकारी योजना: ${newlyAddedSchemeBanner.hindiName || newlyAddedSchemeBanner.name}. ${newlyAddedSchemeBanner.keyHighlight}`
                    );
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  title="Listen to audio briefing"
                >
                  <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">जार्विस से सुनें</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic([25]);
                  setSelectedService({
                    id: newlyAddedSchemeBanner.id,
                    category: newlyAddedSchemeBanner.category === 'farmers' ? 'farmer' : 'scheme',
                    title: newlyAddedSchemeBanner.name,
                    hindiTitle: newlyAddedSchemeBanner.hindiName,
                    description: newlyAddedSchemeBanner.tagline,
                    url: newlyAddedSchemeBanner.officialUrl,
                    btnLabel: 'Official Portal',
                    icon: <Award className="w-7 h-7 text-emerald-400" />,
                    iconBg: 'bg-emerald-50 border-emerald-200',
                    badgeColor: 'text-emerald-700 bg-emerald-100',
                    authority: newlyAddedSchemeBanner.source,
                    benefits: newlyAddedSchemeBanner.benefits,
                    documents: newlyAddedSchemeBanner.documentsRequired,
                    eligibility: newlyAddedSchemeBanner.eligibility,
                  });
                }}
                className="px-4 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-lg active:scale-95 transition-all"
              >
                <Info className="w-3.5 h-3.5" />
                <span>विवरण देखें (View Details)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic([15]);
                  setNewlyAddedSchemeBanner(null);
                }}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
                title="Dismiss banner"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2B. 24-Hour Government Background Syncing Service Panel */}
      <div className="w-full max-w-5xl mb-6 p-4 sm:p-5 rounded-3xl bg-slate-900/95 border border-amber-500/30 backdrop-blur-md shadow-xl relative overflow-hidden">
        {/* Glow ambient background accents */}
        <div className="absolute top-0 right-0 w-80 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Row */}
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3.5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl border ${is24hSyncOn ? 'bg-amber-400/20 border-amber-400/40 text-amber-300 shadow-md' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                  <span>24-Hour Government Background Sync Service</span>
                  <span className="text-xs text-amber-300/80 font-normal hidden sm:inline">(24 घंटे का ऑटो-सिंक)</span>
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold flex items-center gap-1.5 shadow-sm ${
                  is24hSyncOn
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${is24hSyncOn ? 'bg-emerald-400 animate-ping' : 'bg-rose-400'}`} />
                  {is24hSyncOn ? 'Active (Auto-Polling Every 24h)' : 'Paused'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Automatically polls mock government API endpoint every 24 hours to update government schemes and push local notifications on new additions.
              </p>
            </div>
          </div>

          {/* Toggle Button */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleToggle24hSync}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer transition-all active:scale-95 ${
                is24hSyncOn
                  ? 'bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-300'
                  : 'bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${is24hSyncOn ? 'bg-emerald-400' : 'bg-slate-500'}`} />
              <span>{is24hSyncOn ? '24h Sync Enabled' : 'Enable 24h Sync'}</span>
            </button>
          </div>
        </div>

        {/* Status Metrics Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 my-3.5">
          {/* 1. Countdown to next poll */}
          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Next Auto-Poll</span>
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xs sm:text-sm font-mono font-black text-amber-300">
                {countdownText}
              </span>
            </div>
            <span className="text-[9px] text-slate-500 mt-0.5 font-mono">Cycle: 24h (86,400s)</span>
          </div>

          {/* 2. Mock API Endpoint */}
          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Mock Gov API</span>
            </span>
            <div className="mt-1 font-mono text-[11px] text-cyan-300 font-bold truncate" title="/api/gov-schemes">
              GET /api/gov-schemes
            </div>
            <span className="text-[9px] text-slate-500 mt-0.5">myScheme & PIB Live Feed</span>
          </div>

          {/* 3. Last Polled */}
          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Last Sync Time</span>
            </span>
            <div className="mt-1 text-[11px] text-slate-200 font-medium truncate" title={lastSyncText}>
              {lastSyncText}
            </div>
            <span className="text-[9px] text-emerald-400/80 mt-0.5">{govSchemes.length} Schemes Active</span>
          </div>

          {/* 4. Local Notification Status */}
          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1">
                <Bell className="w-3.5 h-3.5 text-purple-400" />
                <span>Push Alerts</span>
              </span>
              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                notificationPermissionState === 'granted'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-amber-500/20 text-amber-300'
              }`}>
                {notificationPermissionState === 'granted' ? 'Allowed' : notificationPermissionState}
              </span>
            </div>
            <div className="mt-1">
              {notificationPermissionState === 'granted' ? (
                <span className="text-[11px] text-purple-300 font-bold flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-400" />
                  Local Push Active
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleRequestNotificationPermission}
                  className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 cursor-pointer"
                >
                  Enable Notifications
                </button>
              )}
            </div>
            <span className="text-[9px] text-slate-500 mt-0.5">Alerts when new scheme added</span>
          </div>
        </div>

        {/* Action Controls Bar */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {/* Poll Mock API Now button */}
            <button
              type="button"
              onClick={handleTrigger24hPollNow}
              disabled={isSyncing}
              className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold flex items-center gap-1.5 shadow-md cursor-pointer active:scale-95 transition-all"
              title="Immediately poll mock government API endpoint and update schemes"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Polling API...' : 'Poll Mock API Now (ताज़ा जांच करें)'}</span>
            </button>

            {/* Simulate New Scheme Addition & Push Notification */}
            <button
              type="button"
              onClick={handleSimulateNewScheme}
              disabled={isSimulatingNewScheme}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 hover:from-emerald-500/30 hover:to-cyan-500/30 border border-emerald-400/50 text-emerald-300 font-bold flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow"
              title="Simulate the arrival of a new government scheme and test local notification push"
            >
              <Sparkles className={`w-3.5 h-3.5 text-amber-400 ${isSimulatingNewScheme ? 'animate-spin' : ''}`} />
              <span>{isSimulatingNewScheme ? 'Injecting Scheme...' : 'Simulate New Scheme (+ Notification)'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* View Sync Audit Logs button */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic([15]);
                setSyncLogs(getBackgroundSyncLogs());
                setSyncLogsModalOpen(true);
              }}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
            >
              <History className="w-3.5 h-3.5 text-cyan-400" />
              <span>Sync Audit Logs ({syncLogs.length})</span>
            </button>

            {/* Open Full Schemes Catalog Modal */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic([20]);
                setIsSchemesModalOpen(true);
              }}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Award className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">All Schemes</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Navigation Tabs (Prominently featuring Farmer ID & Customer Service) */}
      <div className="w-full max-w-5xl flex items-center justify-start sm:justify-center overflow-x-auto no-scrollbar gap-2 mb-6 p-1.5 bg-slate-950/70 border border-slate-800 rounded-2xl">
        <button
          type="button"
          onClick={() => {
            triggerHaptic([15]);
            setActiveTab('all');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'all'
              ? 'bg-amber-400 text-slate-950 shadow-md scale-100'
              : 'text-slate-300 hover:text-white hover:bg-slate-850'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>सभी सेवाएं (All Services)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            triggerHaptic([20]);
            setActiveTab('farmer');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'farmer'
              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25 scale-100'
              : 'text-emerald-400 hover:text-emerald-300 hover:bg-slate-850'
          }`}
        >
          <Wheat className="w-4 h-4 text-emerald-400" />
          <span>🌾 किसान पहचान पत्र व सेवाएं (Farmer ID)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            triggerHaptic([20]);
            setActiveTab('support');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'support'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25 scale-100'
              : 'text-cyan-400 hover:text-cyan-300 hover:bg-slate-850'
          }`}
        >
          <Headphones className="w-4 h-4 text-cyan-400" />
          <span>🎧 24x7 ग्राहक सेवा व जनसुनवाई (Helpdesk)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            triggerHaptic([15]);
            setActiveTab('scheme');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'scheme'
              ? 'bg-amber-400 text-slate-950 shadow-md scale-100'
              : 'text-slate-300 hover:text-white hover:bg-slate-850'
          }`}
        >
          <Coins className="w-4 h-4" />
          <span>सरकारी योजनाएं (Schemes)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            triggerHaptic([15]);
            setActiveTab('gov');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'gov'
              ? 'bg-amber-400 text-slate-950 shadow-md scale-100'
              : 'text-slate-300 hover:text-white hover:bg-slate-850'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>पहचान पत्र (IDs & DL)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            triggerHaptic([15]);
            setActiveTab('bank');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'bank'
              ? 'bg-amber-400 text-slate-950 shadow-md scale-100'
              : 'text-slate-300 hover:text-white hover:bg-slate-850'
          }`}
        >
          <Landmark className="w-4 h-4" />
          <span>बैंकिंग व सीएसपी</span>
        </button>

        <button
          type="button"
          onClick={() => {
            triggerHaptic([15]);
            setActiveTab('csc');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'csc'
              ? 'bg-amber-400 text-slate-950 shadow-md scale-100'
              : 'text-slate-300 hover:text-white hover:bg-slate-850'
          }`}
        >
          <Laptop className="w-4 h-4" />
          <span>CSC सेवाएं</span>
        </button>
      </div>

      {/* 4. DEDICATED FARMER PROFILE & DIGITAL KISAN ID CARD COMPONENT */}
      {activeTab === 'farmer' && (
        <div className="w-full max-w-5xl mb-8 animate-in fade-in duration-200">
          <FarmerProfile onSpeakJarvisGuide={onSpeakJarvisGuide} />
        </div>
      )}

      {/* Quick Access Card for Farmer ID when viewing 'all' */}
      {activeTab === 'all' && (
        <div className="w-full max-w-5xl mb-8 p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-emerald-950/80 border-2 border-emerald-500/40 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400 text-emerald-400 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              <Wheat className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">
                  डिजिटल किसान पहचान पत्र व प्रोफाइल (Farmer Profile & Kisan ID)
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-400 text-slate-950 text-[10px] font-black uppercase">
                  AgriStack
                </span>
              </div>
              <p className="text-xs text-emerald-200/90 mt-0.5">
                अपना राष्ट्रीय डिजिटल किसान पहचान पत्र देखें, भू-अभिलेख विवरण संपादित करें और वास्तविक क्यूआर कोड जनरेट करें।
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              triggerHaptic([20]);
              setActiveTab('farmer');
            }}
            className="px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg cursor-pointer transition-all active:scale-95 shrink-0"
          >
            <QrCode className="w-4 h-4" />
            <span>किसान प्रोफाइल व QR कार्ड खोलें</span>
          </button>
        </div>
      )}

      {/* 5. DEDICATED CUSTOMER SERVICE & 24x7 HELPDESK (Visible when 'support' is active) */}
      {activeTab === 'support' && (
        <div className="w-full max-w-5xl mb-8 space-y-6 animate-in fade-in duration-200">
          {/* Support Banner */}
          <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-slate-900 via-[#0c2438] to-slate-950 border-2 border-cyan-500/50 shadow-2xl relative overflow-hidden">
            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)] shrink-0">
                <Headphones className="w-7 h-7 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                  24x7 ग्राहक सेवा व जनसुनवाई केंद्र (Citizen Helpdesk)
                </h2>
                <p className="text-xs text-cyan-200/90 mt-1">
                  सरकारी योजना, किसान सम्मान निधि, आधार, या बैंकिंग संबंधी समस्या के लिए तुरंत आधिकारिक हेल्पलाइन पर बात करें या ऑनलाइन शिकायत दर्ज करें।
                </p>
              </div>
            </div>

            {/* Online Grievance / Jan Sunwai Ticket Form */}
            <form onSubmit={handleSubmitGrievance} className="mt-5 p-5 rounded-2xl bg-slate-950/80 border border-cyan-500/30">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Send className="w-4 h-4 text-cyan-400" />
                <span>जनसुनवाई में समस्या दर्ज करें (File Grievance / Request Callback)</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    विभाग / श्रेणी चुनें:
                  </label>
                  <select
                    value={grievanceCategory}
                    onChange={(e) => setGrievanceCategory(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-cyan-400"
                  >
                    <option value="farmer">🌾 पीएम-किसान व किसान सहायता</option>
                    <option value="aadhaar">🪪 आधार कार्ड व पहचान पत्र</option>
                    <option value="banking">🏦 बैंकिंग, सीएसपी व पेंशन</option>
                    <option value="scheme">📜 अन्य सरकारी योजनाएं</option>
                    <option value="general">❓ सामान्य नागरिक सहायता</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    आपका नाम (Your Name):
                  </label>
                  <input
                    type="text"
                    value={citizenName}
                    onChange={(e) => setCitizenName(e.target.value)}
                    placeholder="उदा. रमेश कुमार"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-cyan-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    मोबाइल नंबर (Phone Number):
                  </label>
                  <input
                    type="tel"
                    value={citizenPhone}
                    onChange={(e) => setCitizenPhone(e.target.value)}
                    placeholder="उदा. 9876543210"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-cyan-400 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  अपनी समस्या या प्रश्न का विवरण दें:
                </label>
                <textarea
                  value={citizenProblem}
                  onChange={(e) => setCitizenProblem(e.target.value)}
                  placeholder="अपनी समस्या लिखें (उदा. मेरी पीएम-किसान की 17वीं किस्त खाते में नहीं आई, या आधार ई-केवाईसी में अंगूठे का निशान मैच नहीं हो रहा है)..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-cyan-400 resize-none"
                  required
                />
              </div>

              {/* Quick Problem Templates */}
              <div className="flex flex-wrap items-center gap-1.5 mb-3">
                <span className="text-[10px] text-slate-400">त्वरित सुझाव:</span>
                {[
                  'पीएम-किसान 17वीं किस्त नहीं मिली',
                  'फार्मर आईडी में जमीन लिंक नहीं हो रही',
                  'आधार में मोबाइल नंबर अपडेट कराना है',
                  'सोलर रूफटॉप सब्सिडी की स्थिति जाननी है',
                ].map((template) => (
                  <button
                    key={template}
                    type="button"
                    onClick={() => setCitizenProblem(template)}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-750 text-cyan-300 text-[10px] cursor-pointer"
                  >
                    + {template}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-800">
                <div className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  <span>आपकी शिकायत सीधे संबंधित जनसुनवाई पोर्टल पर सुरक्षित दर्ज होगी।</span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingTicket}
                  className="px-5 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmittingTicket ? 'दर्ज हो रहा है...' : 'शिकायत दर्ज करें (Submit Ticket)'}</span>
                </button>
              </div>

              {ticketSubmittedSuccess && (
                <div className="mt-3 p-3 rounded-xl bg-emerald-950/80 border border-emerald-400 text-emerald-200 text-xs flex items-center justify-between">
                  <div>
                    <strong>सफलतापूर्वक दर्ज!</strong> आपका टिकट नंबर है:{' '}
                    <span className="font-mono font-bold text-amber-300">{ticketSubmittedSuccess}</span>
                  </div>
                  <span className="text-[10px] bg-emerald-900 px-2 py-0.5 rounded-full text-emerald-300">
                    24 घंटे में सहायता
                  </span>
                </div>
              )}
            </form>
          </div>

          {/* Active Citizen Tickets Tracker */}
          {myTickets.length > 0 && (
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>आपकी दर्ज शिकायतें व टिकट स्थिति (My Grievance Tickets)</span>
              </h3>

              <div className="space-y-2.5">
                {myTickets.slice(0, 3).map((t) => (
                  <div key={t.ticketId} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-amber-400">{t.ticketId}</span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-300 uppercase">
                          {t.category}
                        </span>
                      </div>
                      <p className="text-slate-300 mt-1 line-clamp-1">{t.problem}</p>
                      <span className="text-[10px] text-slate-500 mt-0.5 block">{t.date}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/40 text-[11px] font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{t.status}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 24x7 Official Helpline Directory */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <PhoneCall className="w-5 h-5 text-emerald-400" />
              <span>आधिकारिक 24x7 टोल-फ्री हेल्पलाइन डायरेक्टरी (Toll-Free Helplines)</span>
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              किसी भी सरकारी सहायता के लिए सीधे टोल-फ्री नंबर पर कॉल करें। कोई शुल्क नहीं लगता।
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {CUSTOMER_SERVICE_HELPLINES.map((hl) => (
                <div
                  key={hl.number}
                  className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-cyan-400/50 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/30 font-semibold">
                        {hl.badge}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-medium">{hl.hours}</span>
                    </div>

                    <h4 className="text-sm font-bold text-white">{hl.name}</h4>
                    <p className="text-[11px] text-amber-300/90 font-medium mt-0.5">{hl.hindiName}</p>
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                      {hl.desc}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2">
                    <a
                      href={`tel:${hl.number}`}
                      onClick={() => triggerHaptic([30])}
                      className="flex-1 py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>{hl.number}</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => handleCopyLink(hl.number)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer active:scale-95"
                      title="Copy phone number"
                    >
                      {copiedLink === hl.number ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 6. Government Schemes & Auto-Update Feature Banner */}
      <div className="w-full max-w-5xl p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-950/70 via-slate-900 to-indigo-950/70 border border-amber-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 shadow-lg">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0 shadow-[0_0_12px_rgba(245,158,11,0.3)]">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-white">
                भारत सरकार की नई व सबसे महत्वपूर्ण योजनाएं (Auto-Update Engine)
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                Live Synced
              </span>
            </div>
            <p className="text-xs text-amber-200/80 mt-0.5">
              PM Surya Ghar, NPS Vatsalya, UPS, PM Vishwakarma, Drone Didi, Lakhpati Didi, Farmer ID, PM Kisan & 25+ Schemes
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            triggerHaptic([30]);
            setIsSchemesModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-md cursor-pointer whitespace-nowrap active:scale-95"
        >
          <span>योजनाएं व पात्रता जांचें (Open Hub)</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 7. Search Input Bar */}
      <div className="w-full max-w-xl relative mb-6">
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search service (e.g., Farmer ID, Kisan, PAN, Aadhaar, CSC, Solar, PF)..."
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-900 border border-slate-750 text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 text-sm shadow-md transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded-lg"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* 8. Main Services Grid */}
      {filteredServices.length > 0 ? (
        <div className="w-full max-w-5xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-amber-400/50 hover:shadow-xl transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
                    {service.icon}
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 uppercase tracking-wider font-semibold">
                    {service.category}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-100 group-hover:text-amber-400 transition-colors">
                  {service.title}
                </h3>
                {service.hindiTitle && (
                  <div className="text-xs text-amber-300/80 font-medium mt-0.5">
                    {service.hindiTitle}
                  </div>
                )}
                <p className="text-xs text-slate-300 leading-relaxed mt-2 line-clamp-3">
                  {service.description}
                </p>
              </div>

              {/* Action Buttons: Details Drawer & Official Link */}
              <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic([20]);
                    setSelectedService(service);
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
                >
                  <Info className="w-3.5 h-3.5 text-amber-400" />
                  <span>विवरण (Details)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenOfficialUrl(service.url, service.title)}
                  className="py-2 px-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-md cursor-pointer"
                >
                  <span>{service.btnLabel}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="w-full max-w-md p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center my-8">
          <Search className="w-10 h-10 text-slate-500 mx-auto mb-2" />
          <h4 className="text-base font-semibold text-slate-200">No Services Found</h4>
          <p className="text-xs text-slate-400 mt-1">
            "{searchQuery}" से मैच होने वाली कोई सेवा नहीं मिली। Try searching "Farmer ID", "PM Kisan", "Aadhaar", or "PF".
          </p>
        </div>
      )}

      {/* 9. Floating WhatsApp Help / Citizen Desk Button */}
      <a
        href="https://wa.me/919999999999?text=Hello%20RP%20Jansabha,%20I%20need%20assistance%20with%20government%20services"
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => triggerHaptic([25])}
        className="fixed bottom-24 right-5 sm:right-8 z-40 px-4 py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-[0_4px_20px_rgba(16,185,129,0.4)] transition-all active:scale-95"
        title="Contact RP Jansabha Help Desk"
      >
        <PhoneCall className="w-4 h-4" />
        <span>24x7 Helpdesk</span>
      </a>

      {/* 10. Footer & Disclaimer */}
      <div className="w-full max-w-5xl mt-12 p-6 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-center">
        <p className="text-xs text-slate-300 font-medium">
          &copy; 2026 RP Jansabha. All Rights Reserved.
        </p>
        <p className="text-[11px] text-slate-400 max-w-2xl mx-auto mt-2 leading-relaxed">
          <strong>Disclaimer:</strong> RP Jansabha is an independent digital assistance directory connecting citizens to verified official portals (uidai.gov.in, pmkisan.gov.in, agristack.gov.in, pmsuryaghar.gov.in). We do not store or collect private financial data.
        </p>
      </div>

      {/* 11. SAFE SERVICE DETAIL & LAUNCHER MODAL (Fixes "Page not working" issues) */}
      {selectedService && (
        <div
          id="service-detail-modal-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 select-none animate-in fade-in duration-200"
        >
          <div className="w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-6 sm:p-7 text-white max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 shrink-0">
                  {selectedService.icon}
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white">
                    {selectedService.title}
                  </h3>
                  {selectedService.hindiTitle && (
                    <p className="text-xs text-amber-300 font-medium mt-0.5">
                      {selectedService.hindiTitle}
                    </p>
                  )}
                  {selectedService.authority && (
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      अधिकार क्षेत्र: {selectedService.authority}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedService(null)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Description & Highlights */}
            <div className="mt-4">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                योजना / सेवा का विवरण (Overview):
              </h4>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                {selectedService.description}
              </p>
            </div>

            {/* Key Benefits */}
            {selectedService.benefits && selectedService.benefits.length > 0 && (
              <div className="mt-4 p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                <h4 className="text-xs font-bold text-emerald-400 mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>मुख्य लाभ व सहायता (Key Benefits):</span>
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {selectedService.benefits.map((b, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-emerald-400 shrink-0">•</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Eligibility & Documents */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 text-xs">
              {selectedService.eligibility && (
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                  <h5 className="font-bold text-amber-300 mb-1.5">पात्रता (Eligibility):</h5>
                  <p className="text-slate-300 leading-relaxed">
                    {selectedService.eligibility.join(', ')}
                  </p>
                </div>
              )}

              {selectedService.documents && (
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                  <h5 className="font-bold text-cyan-300 mb-1.5">जरूरी दस्तावेज (Required Documents):</h5>
                  <p className="text-slate-300 leading-relaxed">
                    {selectedService.documents.join(', ')}
                  </p>
                </div>
              )}
            </div>

            {/* Official Website URL & Copy Box */}
            <div className="mt-4 p-3 rounded-2xl bg-black/40 border border-slate-800 flex items-center justify-between gap-3 text-xs">
              <div className="overflow-hidden">
                <span className="text-[10px] text-slate-400 block">आधिकारिक पोर्टल लिंक (Official URL):</span>
                <span className="font-mono text-amber-300 text-[11px] truncate block">
                  {selectedService.url}
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleCopyLink(selectedService.url)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs flex items-center gap-1 shrink-0 cursor-pointer"
              >
                {copiedLink === selectedService.url ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">कॉपी हो गया!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>लिंक कॉपी करें</span>
                  </>
                )}
              </button>
            </div>

            {/* Modal Bottom Actions */}
            <div className="mt-6 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
              {onSpeakJarvisGuide && (
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic([20]);
                    onSpeakJarvisGuide(`${selectedService.title}. ${selectedService.description}`);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 cursor-pointer"
                >
                  <Volume2 className="w-4 h-4 text-amber-400" />
                  <span>जार्विस से सुनें (Voice)</span>
                </button>
              )}

              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setSelectedService(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer"
                >
                  बंद करें (Close)
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenOfficialUrl(selectedService.url, selectedService.title)}
                  className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs flex items-center gap-2 shadow-lg cursor-pointer active:scale-95"
                >
                  <span>आधिकारिक पोर्टल खोलें</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 12. 24-Hour Background Polling Audit Logs Modal */}
      {syncLogsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">24-Hour Background Sync Audit Logs</h3>
                  <p className="text-xs text-slate-400">
                    Government API Polling History & Local Notification Dispatch Records
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSyncLogsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Summary info banner */}
            <div className="my-3 p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">
                Endpoint: <strong className="text-cyan-300">GET /api/gov-schemes</strong>
              </span>
              <span className="text-slate-400">
                Interval: <strong className="text-amber-300">24 Hours (86,400s)</strong>
              </span>
              <span className="text-slate-400">
                Total Logs: <strong className="text-emerald-400">{syncLogs.length}</strong>
              </span>
            </div>

            {/* Logs List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[50vh]">
              {syncLogs.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  No sync logs recorded yet. Click &quot;Poll Mock API Now&quot; to perform initial background sync.
                </div>
              ) : (
                syncLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-3 rounded-2xl border text-xs ${
                      log.success
                        ? 'bg-slate-950/70 border-slate-800'
                        : 'bg-rose-950/20 border-rose-800/40 text-rose-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            log.success ? 'bg-emerald-400' : 'bg-rose-400'
                          }`}
                        />
                        <span className="font-bold text-white capitalize">
                          Trigger: {log.triggeredBy.replace('_', ' ')}
                        </span>
                        {log.newSchemesCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                            +{log.newSchemesCount} New Scheme Detected & Notification Pushed
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-[10px] text-slate-400">
                        {log.timestamp}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {log.message}
                    </p>

                    {log.newSchemeTitles && log.newSchemeTitles.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-850 flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] text-slate-400">Added Schemes:</span>
                        {log.newSchemeTitles.map((title, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-amber-400/10 border border-amber-400/30 text-amber-300 text-[10px] font-mono"
                          >
                            {title}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={handleSimulateNewScheme}
                disabled={isSimulatingNewScheme}
                className="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Simulate New Scheme & Push Notification</span>
              </button>

              <button
                type="button"
                onClick={() => setSyncLogsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 13. Government Schemes & Auto-Update Modal */}
      <GovSchemesModal
        isOpen={isSchemesModalOpen}
        onClose={() => setIsSchemesModalOpen(false)}
        onSpeakScheme={onSpeakJarvisGuide}
      />
    </div>
  );
};
