import { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'it' | 'el' | 'hr' | 'sq' | 'sr';

const translations: Record<Language, Record<string, string>> = {
  en: {
    dashboard: 'Dashboard',
    map: 'Map',
    social: 'Social',
    journal: 'Journal',
    statistics: 'Statistics',
    socialTitle: 'Social and learning hub',
    mapTitle: 'Map',
    journalTitle: 'Journal',
    statisticsTitle: 'Statistics',
    forestFireResources: '🌲 Forest Fire Prevention Resources',
    viewProfileInstagram: 'View profile on Instagram',
    createEntry: 'Create Entry',
    addMedia: 'Add photo or video',
    titleLabel: 'Title',
    descriptionLabel: 'Description',
    entryTitle: 'Entry title',
    writeObservation: 'Write your observation...',
    createTrackNotes: 'Create and track your ARCA field notes.',
  },
  it: {
    dashboard: 'Pannello',
    map: 'Mappa',
    social: 'Social',
    journal: 'Diario',
    statistics: 'Statistiche',
    socialTitle: 'Hub sociale e di apprendimento',
    mapTitle: 'Mappa',
    journalTitle: 'Diario',
    statisticsTitle: 'Statistiche',
    forestFireResources: '🌲 Risorse di Prevenzione degli Incendi Forestali',
    viewProfileInstagram: 'Visualizza profilo su Instagram',
    createEntry: 'Crea Voce',
    addMedia: 'Aggiungi foto o video',
    titleLabel: 'Titolo',
    descriptionLabel: 'Descrizione',
    entryTitle: 'Titolo della voce',
    writeObservation: 'Scrivi la tua osservazione...',
    createTrackNotes: 'Crea e traccia le tue note di campo ARCA.',
  },
  el: {
    dashboard: 'Ταμπλό',
    map: 'Χάρτης',
    social: 'Κοινωνικά',
    journal: 'Ημερολόγιο',
    statistics: 'Στατιστικά',
    socialTitle: 'Κέντρο κοινωνικής ενημέρωσης',
    mapTitle: 'Χάρτης',
    journalTitle: 'Ημερολόγιο',
    statisticsTitle: 'Στατιστικά',
    forestFireResources: '🌲 Πόροι Πρόληψης Δασικών Πυρκαγιών',
    viewProfileInstagram: 'Προβολή προφίλ στο Instagram',
    createEntry: 'Δημιουργία Εισαγωγής',
    addMedia: 'Προσθήκη φωτογραφίας ή βίντεο',
    titleLabel: 'Τίτλος',
    descriptionLabel: 'Περιγραφή',
    entryTitle: 'Τίτλος εισαγωγής',
    writeObservation: 'Γράψτε την παρατήρησή σας...',
    createTrackNotes: 'Δημιουργήστε και παρακολουθήστε τις σημειώσεις πεδίου ARCA.',
  },
  hr: {
    dashboard: 'Nadzorna ploča',
    map: 'Karta',
    social: 'Društvene mreže',
    journal: 'Dnevnik',
    statistics: 'Statistika',
    socialTitle: 'Društveni i obrazovni centar',
    mapTitle: 'Karta',
    journalTitle: 'Dnevnik',
    statisticsTitle: 'Statistika',
    forestFireResources: '🌲 Resursi za Prevenciju Šumskih Požara',
    viewProfileInstagram: 'Pogledajte profil na Instagramu',
    createEntry: 'Kreiraj Unos',
    addMedia: 'Dodaj fotografiju ili video',
    titleLabel: 'Naslov',
    descriptionLabel: 'Opis',
    entryTitle: 'Naslov unosa',
    writeObservation: 'Napišite svoju promatranje...',
    createTrackNotes: 'Kreirajte i pratite svoje bilješke s terena ARCA.',
  },
  sq: {
    dashboard: 'Tabela kontrolluese',
    map: 'Harta',
    social: 'Social',
    journal: 'Djetar',
    statistics: 'Statistika',
    socialTitle: 'Qendra shoqerore dhe e mësimit',
    mapTitle: 'Harta',
    journalTitle: 'Djetar',
    statisticsTitle: 'Statistika',
    forestFireResources: '🌲 Resurse për Parandalimin e Zjarreve të Pyllit',
    viewProfileInstagram: 'Shikoni profilin në Instagram',
    createEntry: 'Krijo Hyrje',
    addMedia: 'Shtoni foto ose video',
    titleLabel: 'Titulli',
    descriptionLabel: 'Përshkrimi',
    entryTitle: 'Titulli i hyrjes',
    writeObservation: 'Shkruani vëzhgimin tuaj...',
    createTrackNotes: 'Krijoni dhe gjurmoni shënimet tuaja të fushës ARCA.',
  },
  sr: {
    dashboard: 'Контролна табла',
    map: 'Мапа',
    social: 'Друштвене мреже',
    journal: 'Дневник',
    statistics: 'Статистика',
    socialTitle: 'Друштвени и образовни центар',
    mapTitle: 'Мапа',
    journalTitle: 'Дневник',
    statisticsTitle: 'Статистика',
    forestFireResources: '🌲 Ресурси за Спречавање Шумских Пожара',
    viewProfileInstagram: 'Погледајте профил на Инстаграму',
    createEntry: 'Направи Унос',
    addMedia: 'Додајте фотографију или видео',
    titleLabel: 'Наслов',
    descriptionLabel: 'Опис',
    entryTitle: 'Наслов уноса',
    writeObservation: 'Напишите своју опсервацију...',
    createTrackNotes: 'Направите и пратите своје напомене са терена ARCA.',
  },
};

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string): string => {
    return translations[language][key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
