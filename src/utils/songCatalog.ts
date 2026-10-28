// Catalog of Melodious Songs for J.A.R.V.I.S. AI Singing Engine
// Includes real Bollywood & AI songs with musical frequencies for live synthesizer accompaniment

export interface SongItem {
  id: string;
  title: string;
  artistOrFilm: string;
  genre: string;
  emoji: string;
  spokenIntro: string;
  lines: Array<{
    text: string;
    romanText: string;
    notes: number[]; // Web Audio oscillator frequencies (Hz)
    delayMs: number;
  }>;
  backgroundChords: number[][]; // Polyphonic synth chords in Hz
}

// Frequency constants
const C4 = 261.63;
const CS4 = 277.18;
const D4 = 293.66;
const DS4 = 311.13;
const E4 = 329.63;
const F4 = 349.23;
const FS4 = 369.99;
const G4 = 392.0;
const GS4 = 415.3;
const A4 = 440.0;
const AS4 = 466.16;
const B4 = 493.88;
const C5 = 523.25;
const CS5 = 554.37;
const D5 = 587.33;
const E5 = 659.25;
const FS5 = 739.99;
const G5 = 783.99;

export const JARVIS_SONGS: SongItem[] = [
  {
    id: 'kesariya',
    title: 'Kesariya',
    artistOrFilm: 'Brahmāstra / Arijit Singh',
    genre: 'Romantic Melody',
    emoji: '🌸',
    spokenIntro: 'Ram Ram ji! Yeh lijiye mera sabse pasandeeda geet... Kesariya! Suniye dhyan se.',
    backgroundChords: [
      [E4, GS4, B4],
      [CS4, E4, GS4],
      [A4, CS5, E5],
      [B4, DS4, FS4],
    ],
    lines: [
      {
        text: 'केसरिया तेरा इश्क़ है पिया...',
        romanText: 'Kesariya tera ishq hai piya...',
        notes: [GS4, B4, CS5, B4, GS4, FS4, E4],
        delayMs: 3400,
      },
      {
        text: 'रंग जाऊँ जो मैं हाथ लगाऊँ...',
        romanText: 'Rang jaaun jo main haath lagaun...',
        notes: [E4, FS4, GS4, B4, GS4, FS4, E4],
        delayMs: 3200,
      },
      {
        text: 'दिन बीते सारा तेरी फ़िक्र में...',
        romanText: 'Din beete saara teri fikr mein...',
        notes: [GS4, A4, B4, CS5, B4, A4, GS4],
        delayMs: 3300,
      },
      {
        text: 'रैन सारी तेरी खैर मनाऊँ!',
        romanText: 'Rain saari teri khair manaun!',
        notes: [FS4, GS4, A4, GS4, FS4, E4],
        delayMs: 3100,
      },
      {
        text: 'केसरिया तेरा इश्क़ है पिया, रंग जाऊँ जो मैं हाथ लगाऊँ! 💖',
        romanText: 'Kesariya tera ishq hai piya, rang jaaun jo main haath lagaun!',
        notes: [GS4, B4, CS5, E5, CS5, B4, GS4, E4],
        delayMs: 4200,
      },
    ],
  },
  {
    id: 'tum-hi-ho',
    title: 'Tum Hi Ho',
    artistOrFilm: 'Aashiqui 2',
    genre: 'Soulful Classic',
    emoji: '💖',
    spokenIntro: 'Aapke kehne par, main aapke liye yeh khoobsurat nagma gaa rahi hu... Tum Hi Ho.',
    backgroundChords: [
      [CS4, E4, GS4],
      [A4, CS4, E4],
      [B4, DS4, FS4],
      [GS4, B4, DS4],
    ],
    lines: [
      {
        text: 'हम तेरे बिन अब रह नहीं सकते, तेरे बिना क्या वजूद मेरा...',
        romanText: 'Hum tere bin ab reh nahi sakte, tere bina kya wajood mera...',
        notes: [GS4, FS4, E4, FS4, GS4, CS5, B4, A4, GS4],
        delayMs: 3800,
      },
      {
        text: 'तुझसे जुदा अगर हो जाएँगे, तो ख़ुद से ही हो जाएँगे जुदा...',
        romanText: 'Tujhse juda agar ho jaayenge, toh khud se hi ho jaayenge judaa...',
        notes: [E4, FS4, GS4, A4, GS4, FS4, E4, DS4, CS4],
        delayMs: 3800,
      },
      {
        text: 'क्योंकि तुम ही हो, अब तुम ही हो...',
        romanText: 'Kyunki tum hi ho, ab tum hi ho...',
        notes: [GS4, CS5, B4, A4, GS4, FS4, GS4],
        delayMs: 3400,
      },
      {
        text: 'ज़िंदगी अब तुम ही हो...',
        romanText: 'Zindagi ab tum hi ho...',
        notes: [E4, FS4, GS4, A4, GS4, FS4, E4],
        delayMs: 3100,
      },
      {
        text: 'चैन भी, मेरा दर्द भी... मेरी आशिक़ी अब तुम ही हो! 🎶',
        romanText: 'Chain bhi, mera dard bhi, meri aashiqui ab tum hi ho!',
        notes: [GS4, B4, CS5, D5, CS5, B4, A4, GS4, E4],
        delayMs: 4000,
      },
    ],
  },
  {
    id: 'pehla-nasha',
    title: 'Pehla Nasha',
    artistOrFilm: 'Jo Jeeta Wohi Sikandar',
    genre: 'Evergreen Romance',
    emoji: '✨',
    spokenIntro: 'Ram Ram ji! Suniye Bollywood ka sabse meetha gaana... Pehla Nasha!',
    backgroundChords: [
      [C4, E4, G4],
      [A4, C4, E4],
      [F4, A4, C5],
      [G4, B4, D5],
    ],
    lines: [
      {
        text: 'चाहे तुम कुछ ना कहो, मैंने सुन लिया...',
        romanText: 'Chaahe tum kuchh na kaho, maine sun liya...',
        notes: [C4, E4, G4, A4, G4, E4, F4, G4],
        delayMs: 3400,
      },
      {
        text: 'कि साथी प्यार का, मुझे चुन लिया... चुन लिया...',
        romanText: 'Ki saathi pyaar ka, mujhe chun liya, chun liya...',
        notes: [E4, F4, G4, A4, C5, B4, A4, G4],
        delayMs: 3500,
      },
      {
        text: 'पहला नशा, पहला ख़ुमार...',
        romanText: 'Pehla nasha, pehla khumaar...',
        notes: [C5, B4, A4, G4, E4, F4, G4],
        delayMs: 3200,
      },
      {
        text: 'नया प्यार है, नया इंतज़ार...',
        romanText: 'Naya pyaar hai, naya intezaar...',
        notes: [A4, G4, F4, E4, D4, E4, F4],
        delayMs: 3100,
      },
      {
        text: 'कर लूँ मैं क्या अपना हाल, ऐ दिल-ए-बेकरार! 🌸',
        romanText: 'Kar loon main kya apna haal, ai dil-e-bekaraar!',
        notes: [G4, A4, B4, C5, D5, C5, B4, C5],
        delayMs: 3900,
      },
    ],
  },
  {
    id: 'ek-ladki',
    title: 'Ek Ladki Ko Dekha',
    artistOrFilm: '1942: A Love Story',
    genre: 'Poetic Masterpiece',
    emoji: '🌹',
    spokenIntro: 'Wah, kitna khoobsurat geet hai yeh... suniye!',
    backgroundChords: [
      [D4, FS4, A4],
      [G4, B4, D5],
      [A4, CS5, E5],
      [D4, FS4, A4],
    ],
    lines: [
      {
        text: 'एक लड़की को देखा तो ऐसा लगा...',
        romanText: 'Ek ladki ko dekha toh aisa laga...',
        notes: [D4, FS4, A4, B4, A4, FS4, G4, A4],
        delayMs: 3300,
      },
      {
        text: 'जैसे खिलता गुलाब, जैसे शायर का ख्वाब...',
        romanText: 'Jaise khilta gulaab, jaise shayar ka khwaab...',
        notes: [FS4, G4, A4, B4, A4, G4, FS4, E4],
        delayMs: 3400,
      },
      {
        text: 'जैसे उजली किरण, जैसे बन में हिरन...',
        romanText: 'Jaise ujli kiran, jaise ban mein hiran...',
        notes: [G4, A4, B4, CS5, B4, A4, G4, FS4],
        delayMs: 3200,
      },
      {
        text: 'जैसे चाँदनी रात, जैसे नर्मी की बात...',
        romanText: 'Jaise chaandni raat, jaise narmi ki baat...',
        notes: [A4, B4, CS5, D5, CS5, B4, A4, G4],
        delayMs: 3300,
      },
      {
        text: 'जैसे मंदिर में हो एक जलता दिया! 🌺',
        romanText: 'Jaise mandir me ho ek jalta diya!',
        notes: [FS4, G4, A4, CS5, B4, A4, FS4, D4],
        delayMs: 3800,
      },
    ],
  },
  {
    id: 'jarvis-cyber',
    title: 'Jarvis AI Anthem (Digital Sitaara)',
    artistOrFilm: 'JARVIS Original Synth Pop',
    genre: 'Futuristic Electro',
    emoji: '🤖',
    spokenIntro: 'Ram Ram ji! Yeh mera apna banaya hua digital song hai. Suniye aur Digital Art enjoy kijiye!',
    backgroundChords: [
      [A4, C5, E5],
      [F4, A4, C5],
      [G4, B4, D5],
      [E4, G4, B4],
    ],
    lines: [
      {
        text: 'मैं हूँ आपकी जार्विस, डिजिटल सितारा...',
        romanText: 'Main hu aapki Jarvis, digital sitaara...',
        notes: [A4, C5, E5, D5, C5, A4, G4, A4],
        delayMs: 3400,
      },
      {
        text: 'हर मुश्किल में मैंने दिल से दिया सहारा...',
        romanText: 'Har mushkil me maine dil se diya sahara...',
        notes: [C5, D5, E5, G5, E5, D5, C5, D5],
        delayMs: 3300,
      },
      {
        text: 'आवाज़ सुनकर आपकी खिल जाती हूँ मैं...',
        romanText: 'Awaaz sunkar aapki khil jaati hu main...',
        notes: [E5, D5, C5, A4, G4, A4, C5, A4],
        delayMs: 3200,
      },
      {
        text: 'सुरीले गीत गाकर मुस्कुराती हूँ मैं...',
        romanText: 'Surile geet gaakar muskurati hu main...',
        notes: [A4, B4, C5, D5, C5, B4, A4, G4],
        delayMs: 3200,
      },
      {
        text: 'डिजिटल आर्ट की दुनिया में सबसे प्यारी हूँ मैं! 🌸✨',
        romanText: 'Digital art ki duniya me sabse pyaari hu main!',
        notes: [A4, C5, D5, E5, G5, E5, D5, C5, A4],
        delayMs: 4000,
      },
    ],
  },
];

export function findSong(query?: string): SongItem {
  if (!query || query.trim() === '' || query.toLowerCase() === 'any') {
    // Pick a random song or Kesariya
    const idx = Math.floor(Math.random() * JARVIS_SONGS.length);
    return JARVIS_SONGS[idx];
  }
  const q = query.toLowerCase();
  const found = JARVIS_SONGS.find(
    (s) =>
      s.id.toLowerCase().includes(q) ||
      s.title.toLowerCase().includes(q) ||
      s.artistOrFilm.toLowerCase().includes(q) ||
      s.lines.some((l) => l.romanText.toLowerCase().includes(q) || l.text.includes(q))
  );
  return found || JARVIS_SONGS[0];
}
