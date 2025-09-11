import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { BookOpen, Home, Mail, Presentation, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useEffect, Suspense, lazy } from 'react';
import { motion } from "framer-motion";
import { Toaster } from "./components/ui/toaster";
import { toast } from "./components/ui/use-toast";
import RootLayout from './layouts/RootLayout';
import Loader from "./components/ui/loader";
import { useTheme } from "./contexts/ThemeContext";
import { ProgressProvider } from "./contexts/ProgressContext";

// Import des pages admin
import AdminLoginPage from './app/admin/login/page';
import AdminDashboardPage from './app/admin/dashboard/page';

import AdminBanksPage from './app/admin/banks/page';
import AdminUsersPage from './app/admin/users/page';
import AdminFormationsPage from './features/admin/components/AdminFormationsPage';
import AdminStatsPage from './app/admin/stats/page';
import AdminSettingsPage from './app/admin/settings/page';
import BankDetailPage from './features/admin/components/BankDetailPage';
import { AdminLayoutWrapper } from './app/admin/layout';

const slides = [
  {
    image: '', // pas d'image de fond
    imageWebp: '',
    title: '',
    text: (
      <div className="relative flex flex-col sm:flex-row items-center justify-center w-full h-full min-h-[220px] gap-4 sm:gap-10 overflow-hidden">
        {/* Décorations SVG : traits obliques bleu foncé */}
        <svg className="absolute left-0 top-0 w-24 h-24 sm:w-48 sm:h-48 opacity-30 -rotate-12 -translate-x-4 sm:-translate-x-8 -translate-y-4 sm:-translate-y-8 z-0" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <line x1="10" y1="90" x2="90" y2="10" stroke="#15344B" strokeWidth="8" strokeLinecap="round" />
          <line x1="30" y1="100" x2="100" y2="30" stroke="#15344B" strokeWidth="5" strokeLinecap="round" />
        </svg>
        <svg className="absolute right-0 bottom-0 w-24 h-24 sm:w-48 sm:h-48 opacity-20 rotate-12 translate-x-4 sm:translate-x-8 translate-y-4 sm:translate-y-8 z-0" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <line x1="10" y1="90" x2="90" y2="10" stroke="#15344B" strokeWidth="8" strokeLinecap="round" />
          <line x1="0" y1="70" x2="70" y2="0" stroke="#15344B" strokeWidth="5" strokeLinecap="round" />
        </svg>
        {/* Logo */}
        <div className="flex flex-col sm:flex-row items-center justify-center px-4 sm:px-10 md:px-16 lg:px-24 py-6 sm:py-8 gap-4 sm:gap-6">
        {/* Logo */}
        <div className="flex-shrink-0 flex justify-center w-full sm:w-1/2">
          <img
            src="/images/BAI-3.png"
            alt="BAI Formation Consulting"
            className="h-40 sm:h-64 md:h-80 lg:h-[28rem] w-auto"
          />
        </div>

        {/* Texte */}
        <div className="text-center sm:text-left text-brand-blue text-base sm:text-xl md:text-3xl lg:text-4xl font-bold font-sans tracking-wide uppercase w-full sm:w-1/2 px-2 sm:px-4">
          Nos formations sont destinées aux commerciaux du secteur de la banque, de l'assurance et de l'immobilier
        </div>
      </div>


      </div>
    ),
    link: null,
    intro: true,
    bg: '#F8F6F2',
  },
  {
    image: "/images/pexels-banque-7821702.jpg",
    imageWebp: "/images/banque.webp",
    title: "Banque",
    text: (
      <motion.div
        initial={{ opacity: 0, x: -15 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1 }}
        className="hidden md:flex text-base md:text-lg items-center justify-center w-full max-w-4xl mx-auto text-center"
      >
        <span className="px-4 py-2 text-white">
          Des formations sur mesure destinées à vos Chargés de clientèle et Conseillers (Conseillers Accueil, Conseillers Clientèle Particuliers, Conseillers Clientèle Professionnels, Conseillers privés, Conseillers en Gestion de Patrimoine) <br /> <br /><span className='bg-white font-bold text-green-600'> Dans le but</span> de leur permettre de : se préparer à la négociation, poser le cadre global de la négociation, isoler les points de blocage, valoriser mon offre.
        </span>
      </motion.div>
    ),
    link: "/banque"
  },
  {
    image: "/images/pexels-assurance-5255183.jpg",
    imageWebp: "/images/assurance.webp",
    title: "Assurance & Prévoyance",
    text: (
      <motion.div
        initial={{ opacity: 0, x: -15 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1 }}
        className="hidden md:flex text-base md:text-lg items-center justify-center w-full max-w-4xl mx-auto text-center"
      >
        <span className="px-4 py-2 text-white">
        Dans cet univers, nos formations vont outiller vos Conseillers Commerciaux afin d'aborder sereinement chacun des univers ci-dessous : 
        <br /><br /><span className='bg-white font-bold text-green-600'>IARD</span> (Professionnels et Particuliers) : MRH, AUTO, MULTIRISQUE PRO, PRÉVOYANCE
        <br /><span className='bg-white font-bold text-green-600'>PRÉVOYANCE</span> (Professionnels et Particuliers) : CAPITAL DÉCÈS, GARANTIE DES ACCIDENTS DE LA VIE, GARANTIE OBSÈQUES, HOMME CLÉ, INDEMNITÉ JOURNALIÈRE.
        </span>
      </motion.div>
    ),
    link: "/assurance"
  },
  {
    image: "https://images.pexels.com/photos/439391/pexels-photo-439391.jpeg",
    imageWebp: "/images/immobilier.webp",
    title: "Immobilier",
    text: (
      <motion.div
        initial={{ opacity: 0, x: -15 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1 }}
        className="hidden md:flex text-base md:text-lg items-center justify-center w-full max-w-4xl mx-auto text-center"
      >
        <span className="px-4 py-2 text-white">
        Des formations conçues et pensées pour vos agents immobiliers (commerciaux)<br/> <br/><span className='bg-white text-green-600 font-bold'>Afin de</span> leur permettre de : Répondre efficacement aux demandes des acteurs du secteur immobilier (locataires et acquéreurs).
        </span>
      </motion.div>
    ),
    link: "/immobilier"
  }
];

// Composant pour gérer le défilement fluide
function ScrollToAnchor() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const element = document.querySelector(location.hash);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [location]);

  return null;
}

// Remplacement des imports statiques par React.lazy
const LoginPage = lazy(() => import('./pages/Login'));
const DashboardPage = lazy(() => import('./pages/Dashboard'));
const ContactPage = lazy(() => import('./app/contact/page'));
const BanquePage = lazy(() => import('./app/banque/page'));
const AssurancePage = lazy(() => import('./app/assurance/page'));
const ImmobilierPage = lazy(() => import('./app/immobilier/page'));
const SolutionsPage = lazy(() => import('./app/solutions/page'));
// Pages de formation (à implémenter plus tard)
// const CoursesPage = lazy(() => import('./features/learner/pages/CoursesPage'));
// const CourseDetailPage = lazy(() => import('./features/learner/pages/CourseDetailPage'));
// const CertificatesPage = lazy(() => import('./features/learner/pages/CertificatesPage'));
// const SettingsPage = lazy(() => import('./features/learner/pages/SettingsPage'));
// const ProgressionPage = lazy(() => import('./features/learner/pages/ProgressionPage'));

// Fonction utilitaire pour précharger une image
function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve();
    img.onerror = () => reject();
    img.src = src;
  });
}
// Fonction utilitaire pour précharger une vidéo
function preloadVideo(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.onloadeddata = () => resolve();
    video.onerror = () => reject();
    video.src = src;
    // Pour forcer le chargement
    video.load();
  });
}

const preloadAssets = async () => {
  // Images du diaporama
  const images = [
    "/images/pexels-banque-7821702.jpg",
    "/images/banque.webp",
    "/images/pexels-assurance-5255183.jpg",
    "/images/assurance.webp",
    "/images/immobilier.webp",
    // Images page assurance
    "/images/optimized/pexels-habitation-auto-106399-medium.webp",
    "/images/optimized/family-7257182_1280-medium.webp",
    "/images/presentation.jpg",
    "/images/cadenas.jpg",
  ];
  // Vidéos principales
  const videos = [
    "/videos/assurance.mp4"
  ];
  await Promise.all([
    ...images.map(preloadImage),
    ...videos.map(preloadVideo)
  ]);
};

function App() {
  const [isReady, setIsReady] = React.useState(false);

  React.useEffect(() => {
    preloadAssets().then(() => setIsReady(true));
  }, []);

  if (!isReady) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-white z-50 fixed top-0 left-0">
        <Loader size={64} color="#C7B299" />
        <span className="ml-4 text-2xl text-[#C7B299] font-semibold animate-pulse">Chargement...</span>
      </div>
    );
  }

  console.log('App.tsx : composant App monté');
  return (
    <RootLayout>
      <ScrollToAnchor />
      <Suspense fallback={<div className="w-full h-screen flex items-center justify-center"><Loader size={56} color="#C7B299" /><span className="ml-4 text-xl text-[#C7B299] font-semibold animate-pulse">Chargement...</span></div>}>
        <Routes>
            {/* Routes Admin */}
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin" element={<AdminLayoutWrapper />}>
              <Route index element={<AdminDashboardPage />} />
              <Route path="dashboard" element={<AdminDashboardPage />} />
              <Route path="formations" element={<AdminFormationsPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="banks" element={<AdminBanksPage />} />
              <Route path="banks/:bankId" element={<BankDetailPage />} />
              <Route path="stats" element={<AdminStatsPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
            </Route>
          
          {/* Routes Apprenant */}
          <Route path="/apprenant/connexion" element={<LoginPage />} />
          <Route path="/apprenant/dashboard" element={<DashboardPage />} />
          <Route path="/apprenant" element={<DashboardPage />} />
          {/* Routes de formation temporairement désactivées
          <Route path="/apprenant/courses" element={<CoursesPage />} />
          <Route path="/apprenant/courses/:id" element={<CourseDetailPage />} />
          <Route path="/apprenant/certificates" element={<CertificatesPage />} />
          <Route path="/apprenant/parametres" element={<SettingsPage />} />
          <Route path="/apprenant/progression" element={<ProgressionPage />} />
          */}
          
          {/* Routes Publiques */}
          <Route path="/" element={<HomePage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/banque" element={<BanquePage />} />
          <Route path="/assurance" element={<AssurancePage />} />
          <Route path="/immobilier" element={<ImmobilierPage />} />
          <Route path="/solutions" element={<SolutionsPage />} />
        </Routes>
      </Suspense>
    </RootLayout>
  );
}

function HomePage() {
  console.log('App.tsx : composant HomePage monté');
  const { theme } = useTheme();
  const [current, setCurrent] = React.useState(0);
  const [isSliding, setIsSliding] = React.useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const [showDescription, setShowDescription] = React.useState<number | null>(null);

  const goToSlide = (idx: number) => {
    if (isSliding || idx === current) return;
    setIsSliding(true);
    setTimeout(() => {
      setCurrent(idx);
      setIsSliding(false);
    }, 500);
  };

  const nextSlide = () => goToSlide((current + 1) % slides.length);
  const prevSlide = () => goToSlide((current - 1 + slides.length) % slides.length);

  React.useEffect(() => {
    if (isSliding) return;
    timeoutRef.current = setTimeout(() => {
      nextSlide();
    }, 6000);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [current, isSliding]);

  // Ajout d'une classe globale sur le body (dans le composant racine ou dans le div principal)
  document.body.classList.add('overflow-x-hidden');

  return (
    <div className={`flex flex-col min-h-screen font-sans ${theme === 'dark' ? 'bg-[#23211E]' : 'bg-gradient-to-b from-white to-[#c4b69b]'} overflow-x-hidden`}>
      <main className="flex-1">
        {/* Bouton de test pour le toast */}
        {/* <div className="fixed top-4 right-4 z-[9999]">
          <button
            onClick={() => toast({ title: "Test de notification", description: "Le système de toast fonctionne !" })}
            className="bg-brand-blue text-white px-4 py-2 rounded shadow hover:bg-brand-blue/90"
          >
            Tester la notification
          </button>
        </div> */}
        {/* Diaporama d'images thématiques */}
        <section className="relative w-full left-1/2 right-1/2 -mx-[50vw] max-w-none" style={{ position: 'relative', left: '50%', right: '50%', width: '100vw', marginLeft: '-50vw', marginRight: '-50vw' }}>
          <div className="w-full h-72 sm:h-80 md:h-[420px] relative flex items-center justify-center overflow-hidden bg-black/80">
            {/* Slides coulissantes */}
            <div className="absolute inset-0 flex transition-transform duration-700" style={{ transform: `translateX(-${current * 100}%)` }}>
              {slides.map((slide, idx) => (
                <div
                  key={slide.title || idx}
                  className="w-full h-72 sm:h-80 md:h-[420px] flex-shrink-0 relative flex items-center justify-center"
                  style={{ minWidth: '100vw', maxWidth: '100vw' }}
                >
                  {/* Slide d'intro : fond uni, pas d'image */}
                  {slide.intro ? (
                    <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-[#F8F6F2]">
                      {slide.text}
                    </div>
                  ) : (
                    <>
                      <picture>
                        <source srcSet={slide.imageWebp} type="image/webp" />
                        <img
                          src={slide.image}
                          alt={slide.title}
                          width="1200"
                          height="420"
                          className="w-full h-full object-cover object-center brightness-75"
                          loading={idx === 0 ? "eager" : "lazy"}
                        />
                      </picture>
                      <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-center px-2 sm:px-4 pb-8 sm:pb-12">
                        <h2 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-white drop-shadow-lg max-w-full mb-4 text-center leading-normal tracking-wider break-words whitespace-normal">
                          {slide.title}
                        </h2>
                        {slide.link && typeof slide.link === 'string' && slide.link !== '' && (
                          <Link to={slide.link} tabIndex={-1} className="z-10">
                            <button
                              className="bg-brand-beige text-brand-blue px-4 sm:px-6 py-2 rounded-full font-semibold text-base sm:text-lg shadow-lg hover:bg-brand-beige/90 transition-colors mt-2 sm:mt-4"
                              onClick={e => {
                                e.preventDefault();
                                setShowDescription(idx);
                                setIsSliding(true); // stop le carrousel
                              }}
                            >
                              En savoir plus
                            </button>
                          </Link>
                        )}
                      </div>
                      {/* Page beige animée avec texte descriptif */}
                      {showDescription === idx && (
                        <motion.div
                          initial={{ x: '-100%' }}
                          animate={{ x: 0 }}
                          exit={{ x: '-100%' }}
                          transition={{ duration: 0.5 }}
                          className="absolute inset-0 z-30 flex items-center justify-center bg-brand-beige/60 backdrop-blur-sm"
                        >
                          <div className="relative w-full h-full flex items-center justify-center">
                            {/* Croix de fermeture en haut à droite */}
                            <button
                              className="absolute top-4 right-4 text-3xl text-red-600 hover:text-red-800 font-bold bg-transparent rounded-full p-2 shadow focus:outline-none z-40"
                              aria-label="Fermer"
                              onClick={() => {
                                setShowDescription(null);
                                setIsSliding(false); // relance le carrousel
                              }}
                            >
                              &times;
                            </button>
                            <div className="bg-brand-beige/80 rounded-lg shadow-lg p-3 sm:p-6 md:p-8 max-w-xs sm:max-w-md md:max-w-2xl mx-auto text-brand-blue text-sm sm:text-base md:text-lg text-center overflow-y-auto" style={{ maxHeight: '80vh' }}>
                              <h2 className="text-base sm:text-xl md:text-4xl font-bold mb-2 sm:mb-3 md:mb-6">{slide.title}</h2>
                              <div className="text-xs sm:text-sm md:text-base leading-relaxed whitespace-pre-line">
                                {/* Affichage du texte descriptif, sans classe responsive qui le masque */}
                                {typeof slide.text === 'string' ? slide.text : ''}
                                {typeof slide.text !== 'string' ? React.Children.map(slide.text.props.children, (child, i) => (
                                  <span key={i} className="block mb-2 last:mb-0">{child}</span>
                                )) : null}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
            {/* Flèches de navigation */}
            <button
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white rounded-full p-1 sm:p-2 z-20 transition"
              onClick={prevSlide}
              aria-label="Précédent"
              style={{ pointerEvents: isSliding ? 'none' : 'auto' }}
            >
              <ChevronLeft className="w-6 h-6 sm:w-7 sm:h-7" />
            </button>
            <button
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white rounded-full p-1 sm:p-2 z-20 transition"
              onClick={nextSlide}
              aria-label="Suivant"
              style={{ pointerEvents: isSliding ? 'none' : 'auto' }}
            >
              <ChevronRight className="w-6 h-6 sm:w-7 sm:h-7" />
            </button>
            {/* Points de navigation */}
            <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 flex gap-1 sm:gap-2 z-20">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full border border-white transition-all duration-300 ${idx === current ? 'bg-white scale-125' : 'bg-white/50'}`}
                  onClick={() => goToSlide(idx)}
                  aria-label={`Aller à la slide ${idx + 1}`}
                  style={{ pointerEvents: isSliding ? 'none' : 'auto' }}
                />
              ))}
            </div>
          </div>
        </section>
        {/* Mini bandeau séparateur bleu foncé avec dégradé vers le beige */}
        <div className="w-full h-6 sm:h-8 bg-gradient-to-r from-[#15344B] via-[#15344B] to-[#C7B299]" />
        {/* Titre avant la vidéo de présentation */}
        {/* <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-center text-brand-beige mt-8 sm:mt-12 mb-4 sm:mb-6 break-words whitespace-normal">Découvrez l'expérience BAI Consulting en vidéo</h2> */}
        {/* Section vidéo de présentation avec image détourée */}
        {/*
        <section className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-8 md:gap-16 py-10 md:py-20 px-2 sm:px-4">
          <img
            src="/images/accueil.png"
            alt="Homme souriant en costume pointant"
            className="w-full max-w-[700px] sm:max-w-[36rem] md:max-w-[44rem] h-auto object-contain mb-6 md:mb-0 md:mr-20"
            style={{ background: 'none' }}
          />
        </section>
        */}
        <section className="py-10 sm:py-16 bg-gray-50 dark:bg-dark-bg-primary">
          <div className="container mx-auto px-2 sm:px-4 md:px-8 lg:px-12">
            <div className="text-center mb-10 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl font-bold text-brand-blue dark:text-brand-beige break-words whitespace-normal">Nos domaines d'expertise</h2>
              <p className="mt-2 sm:mt-4 text-base sm:text-lg text-gray-600 dark:text-white max-w-xl sm:max-w-3xl mx-auto">
                Des formations spécialisées dispensées par des professionnels du secteur.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-lg overflow-hidden transform transition-all hover:scale-105">
                <div className="h-40 sm:h-48 bg-gray-200 dark:bg-dark-bg-secondary relative">
                  <img 
                    src="/images/pexels-banque-7821702.jpg"
                    alt="Services bancaires"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4 sm:p-6 dark:bg-dark-bg-secondary">
                  <h3 className="text-lg sm:text-xl font-bold text-brand-blue dark:text-brand-beige break-words whitespace-normal">Banque</h3>
                  <p className="mt-1 sm:mt-2 text-gray-600 text-sm sm:text-base dark:text-white break-words whitespace-normal">
                  Formations sur la démarche relationnelle et commerciale, les rebonds commerciaux, la satisfaction client, l'augmentation du PNB de la banque.
                  </p>
                  <Link to="/banque">
                    <button className="mt-3 sm:mt-4 w-full bg-brand-blue text-white px-2 sm:px-4 py-2 rounded hover:bg-brand-blue/90 transition-colors text-sm sm:text-base">
                      En savoir plus
                    </button>
                  </Link>
                </div>
              </div>

              <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-lg overflow-hidden transform transition-all hover:scale-105">
                <div className="h-40 sm:h-48 bg-gray-200 relative">
                  <img 
                    src="/images/pexels-assurance-5255183.jpg"
                    alt="Assurance et prévoyance"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4 sm:p-6 dark:bg-dark-bg-secondary">
                  <h3 className="text-lg sm:text-xl font-bold text-brand-blue dark:text-brand-beige break-words whitespace-normal">Assurance & Prévoyance</h3>
                  <p className="mt-1 sm:mt-2 text-gray-600 text-sm sm:text-base dark:text-white break-words whitespace-normal">
                    Formations sur l'IARD, la prévoyance, la gestion des risques et sinistres.
                  </p>
                  <Link to="/assurance">
                    <button className="mt-3 sm:mt-4 w-full bg-brand-blue text-white px-2 sm:px-4 py-2 rounded hover:bg-brand-blue/90 transition-colors text-sm sm:text-base">
                      En savoir plus
                    </button>
                  </Link>
                </div>
              </div>

              <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-lg overflow-hidden transform transition-all hover:scale-105">
                <div className="h-40 sm:h-48 bg-gray-200 relative">
                  <img 
                    src="https://images.pexels.com/photos/439391/pexels-photo-439391.jpeg"
                    alt="Services immobiliers"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4 sm:p-6 dark:bg-dark-bg-secondary">
                  <h3 className="text-lg sm:text-xl font-bold text-brand-blue dark:text-brand-beige break-words whitespace-normal">Immobilier</h3>
                  <p className="mt-1 sm:mt-2 text-gray-600 text-sm sm:text-base dark:text-white break-words whitespace-normal">
                    Formations en transaction immobilière, gestion locative et expertise immobilière.
                  </p>
                  <Link to="/immobilier">
                    <button className="mt-3 sm:mt-4 w-full bg-brand-blue text-white px-2 sm:px-4 py-2 rounded hover:bg-brand-blue/90 transition-colors text-sm sm:text-base">
                      En savoir plus
                    </button>
                  </Link>
                </div>
              </div>
            </div>
            <div className="flex justify-center mt-8">
              <Link to="/contact">
                <button className="bg-brand-beige text-brand-blue dark:bg-dark-bg-primary dark:text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-brand-beige/80 transition-colors text-lg">
                  Contactez-nous
                </button>
              </Link>
            </div>
          </div>
        </section>

        <section className="py-16 bg-white dark:bg-dark-bg-primary">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="relative h-96 rounded-lg overflow-hidden shadow-xl">
                <img 
                  src="/images/concept-de-banniere-de-collegues-de-travail-avec-espace-de-copie.jpg"
                  alt="À propos de BAI Consulting"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-6">
                <h2 className="text-3xl font-bold text-brand-blue dark:text-brand-beige break-words whitespace-normal">À propos de BAI Consulting</h2>
                <p className="text-gray-600 dark:text-white break-words whitespace-normal">
                  Fondée par des experts des secteurs de la banque, de l'assurance et de l'immobilier, BAI Consulting met son expertise au service de la montée en compétence de vos équipes commerciales et de leur développement professionnel.
                </p>
                <p className="text-gray-600 dark:text-white break-words whitespace-normal">
                Nous proposons des formations adaptées aux besoins des professionnels et des entreprises avec une approche pratique et opérationnelle.
                </p>
                <p className="text-gray-600 dark:text-white break-words whitespace-normal">
                Nos formations sont également destinées à des personnes de niveau Bac à Bac+5 désireuses de devenir des commerciaux du secteur de la banque, de l'assurance et de l'immobilier (conseiller bancaire, conseiller en assurance ou agent immobilier).
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <BookOpen className="h-6 w-6 text-brand-blue dark:text-brand-beige" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white break-words whitespace-normal">Formations adaptées</h3>
                      <p className="mt-2 text-gray-600 dark:text-white break-words whitespace-normal">Des parcours sur mesure selon vos besoins.</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <TrendingUp className="h-6 w-6 text-brand-blue dark:text-brand-beige" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white break-words whitespace-normal">Suivi personnalisé</h3>
                      <p className="mt-2 text-gray-600 dark:text-white break-words whitespace-normal">Un accompagnement tout au long de votre parcours.</p>
                    </div>
                  </div>
                </div>
                <div className="flex justify-center mt-8">
                  <Link to="/contact">
                    <button className="bg-brand-beige text-brand-blue dark:bg-dark-bg-primary dark:text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-brand-beige/80 transition-colors text-lg">
                      Contactez-nous
                    </button>
                  </Link>
                </div>
                <Link to="/solutions">
                  <button className="bg-brand-blue text-white dark:text-brand-beige px-6 py-4 mt-6 rounded font-semibold hover:bg-brand-blue/90 transition-colors">
                    Découvrir nos solutions
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-brand-blue text-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold break-words whitespace-normal">Prêt à faire évoluer votre carrière ?</h2>
            <p className="mt-4 text-xl max-w-2xl mx-auto break-words whitespace-normal">
              Contactez-nous dès aujourd'hui pour découvrir comment nos formations peuvent vous aider à atteindre vos objectifs professionnels.
            </p>
            <Link to="/contact">
              <button className="mt-8 bg-brand-beige dark:bg-dark-bg-primary text-brand-blue dark:text-white px-6 py-3 rounded font-semibold hover:bg-brand-beige/80 transition-colors flex items-center mx-auto">
                <Mail className="mr-2 h-5 w-5" />
                Nous contacter
              </button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center">
                <span className="text-2xl font-bold">BAI</span>
                <span className="ml-2 text-brand-beige">Formation Consulting</span>
              </div>
              <p className="mt-4 text-gray-400">
                Des formations professionnelles pour les secteurs de la banque, de l'assurance et de l'immobilier.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Formations</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/banque" className="text-gray-400 hover:text-white transition-colors">
                    Banque
                  </Link>
                </li>
                <li>
                  <Link to="/assurance" className="text-gray-400 hover:text-white transition-colors">
                    Assurance & Prévoyance
                  </Link>
                </li>
                <li>
                  <Link to="/immobilier" className="text-gray-400 hover:text-white transition-colors">
                    Immobilier
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Liens utiles</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/solutions" className="text-gray-400 hover:text-white transition-colors">
                    Nos solutions
                  </Link>
                </li>
                {/* <li>
                  <Link to="/contact" className="text-gray-400 hover:text-white transition-colors">
                    Contact
                  </Link>
                </li> */}
              </ul>
            </div>
            {/* <div>
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <ul className="space-y-2 text-gray-400">
                <li className="flex items-center">
                  <Home className="h-5 w-5 mr-2" />
                  12 rue de la Formation, 75001 Paris
                </li>
                <li className="flex items-center">
                  <Mail className="h-5 w-5 mr-2" />
                  contact@bai-consulting.com
                </li>
              </ul>
            </div> */}
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} BAI Formation Consulting. Tous droits réservés.</p>
          </div>
          <div className="flex justify-center mt-8">
            <Link to="/contact">
              <button className="bg-brand-beige text-brand-blue dark:bg-dark-bg-primary dark:text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-brand-beige/80 transition-colors text-lg">
                Contactez-nous
              </button>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;