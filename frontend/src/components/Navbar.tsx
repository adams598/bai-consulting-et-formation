import { Link, useLocation } from "react-router-dom";
import { PiggyBank, ShieldCheck, Building2, Lightbulb, Mail, User, Home, Menu, X, Sun, Moon, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "./ui/button";
import React, { useMemo, useCallback } from "react";
import { useTheme } from "../contexts/ThemeContext";
import SearchBar from "./SearchBar";

const navItems = [
  // {
  //   label: "Accueil",
  //   icon: <Home className="inline mr-2 w-5 h-5" />,
  //   to: "/",
  // },
   {
    label: "Courtage Diaspora",
    icon: <PiggyBank className="inline mr-2 w-5 h-5" />,
    to: "/courtage",
    submenu: [
      { label: "Les problèmes (Contexte actuel)", to: "/courtage#problemes" },
      { label: "Les solutions", to: "/courtage#solutions" },
      { label: "Focus pays", to: "/courtage#focuspays" },
      { label: "Notre process client", to: "/courtage#process" },
      { label: "Preuve sociale", to: "/courtage#preuvesociale" },
      { label: "Notre storytelling", to: "/courtage#storytelling" },
    ],
  },
     {
    label: "Formation et employabilité",
    icon: <PiggyBank className="inline mr-2 w-5 h-5" />,
    to: "/formation",
    submenu: [
      { label: "Nos formations", to: "/formation#nosformations"},
      { label: "Pour Qui ?", to: "/formation#pourqui"},
      { label: "Notre objectif", to: "/formation#objectifs"},
      { label: "Notre Opportunités", to: "/formation#opportunites"},
    ],
  },
  // {
  //   label: "Conseil aux entreprises",
  //   icon: <PiggyBank className="inline mr-2 w-5 h-5" />,
  //   to: "/conseil",
  //   submenu: [
  //     { label: "Nos formations", to: "/formation#nosformations"},
  //     { label: "Pour Qui ?", to: "/formation#pourqui"},
  //     { label: "Notre objectif", to: "/formation#objectifs"},
  //     { label: "Notre Opportunités", to: "/formation#opportunites"},
  //   ],
  // },
  {
    label: "Banque",
    icon: <PiggyBank className="inline mr-2 w-5 h-5" />,
    to: "/banque",
    submenu: [
      { label: "Banque au quotidien & PNB", to: "/banque#quotidien" },
      { label: "Activité choisie vs subie", to: "/banque#activite" },
      { label: "Epargne", to: "/banque#epargne" },
      { label: "Spécificités métiers", to: "/banque#metiers" },
      { label: "Conquête client", to: "/banque#conquete" },
      { label: "Démarche commerciale", to: "/banque#demarche" },
      { label: "Rendez-vous téléphonique", to: "/banque#rdv" },
      { label: "KYC", to: "/banque#kyc" },
      { label: "Digitalisation", to: "/banque#digital" },
      { label: "Satisfaction client (NPS)", to: "/banque#nps" },
    ],
  },
  {
    label: "Assurance",
    icon: <ShieldCheck className="inline mr-2 w-5 h-5" />,
    to: "/assurance",
    submenu: [
      { label: "IARD Part (MRH, Auto, PNO)", to: "/assurance#iard-part" },
      { label: "Prévoyance Particulier", to: "/assurance#prev-part" },
      { label: "IARD Pro", to: "/assurance#iard-pro" },
      { label: "Prévoyance Pro", to: "/assurance#prev-pro" },
    ],
  },
  {
    label: "Immobilier",
    icon: <Building2 className="inline mr-2 w-5 h-5" />,
    to: "/immobilier",
    submenu: [
      { label: "Location immobilière", to: "/immobilier#location" },
      { label: "Vente immobilière", to: "/immobilier#vente" },
      { label: "Programmes immobiliers (VEFA)", to: "/immobilier#vefa" },
      { label: "Immobilier Haut de Gamme", to: "/immobilier#hautdegamme" },
    ],
  },
  {
    label: "Nos solutions",
    icon: <Lightbulb className="inline mr-2 w-5 h-5" />,
    to: "/solutions",
    submenu: [
      { label: "Conférence", to: "/solutions#conference" },
      { label: "Consulting", to: "/solutions#consulting" },
      { label: "Formations", to: "/solutions#formations" },
    ],
  },
  {
    label: "Contact",
    icon: <Mail className="inline mr-2 w-5 h-5" />,
    to: "/contact",
    submenu: [
      { label: "Demande d'information", to: "/contact#info" },
      { label: "Prendre rendez-vous", to: "/contact#rdv" },
      { label: "Devis personnalisé", to: "/contact#devis" },
    ],
  },
];

export default function Navbar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [mobileOpenIndex, setMobileOpenIndex] = React.useState<number | null>(null);
  const { theme, toggleTheme } = useTheme();
  const [isExpanded, setIsExpanded] = React.useState(false);

  // Mémoriser les éléments de navigation pour éviter les re-renders
  const memoizedNavItems = useMemo(() => navItems, []);

  // Callbacks optimisés
  const handleMobileToggle = useCallback(() => {
    setMobileOpen((prev) => !prev);
  }, []);

  const handleMobileClose = useCallback(() => {
    setMobileOpen(false);
  }, []);

  return (
    <nav 
      className="w-full bg-[#F8F6F2] dark:bg-dark-bg-primary text-[#00314B] dark:text-dark-text-primary shadow-lg z-50 relative h-16 transition-all duration-500"
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >

        <div className="container mx-auto flex items-center justify-between py-3 px-4 h-full">
          <Link to="/" className="flex items-center gap-2">
            {/* <img src="/logo-bai-fc.svg" alt="BAI Formation Consulting" className="h-10 w-auto" /> */}
            <span className="text-2xl font-extrabold tracking-tight">BAI</span>
            <span className="ml-1 text-[#C7B299] dark:text-dark-accent text-lg font-bold">Formation & Consulting</span>
          </Link>

          <div className="flex items-center gap-4">
            {/* Barre de recherche */}
            <SearchBar />

            {/* Bouton de basculement du thème */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-dark-bg-secondary transition-colors"
              aria-label={theme === 'dark' ? 'Passer au mode clair' : 'Passer au mode sombre'}
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-yellow-400" />
              ) : (
                <Moon className="w-5 h-5 text-gray-600" />
              )}
            </button>

            {/* Hamburger pour mobile */}
            <button
              className="xl:hidden p-2 rounded focus:outline-none focus:ring-2 focus:ring-[#C7B299]"
              onClick={handleMobileToggle}
              aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
            >
              {mobileOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
            </button>
          </div>

          {/* Menu desktop - liens principaux seulement */}
          <ul className="hidden xl:flex gap-6 items-center">
            {memoizedNavItems.map((item) => (
              <li key={item.label}>
                <Link
                  to={item.to}
                  className={`flex items-center px-3 py-2 rounded transition-colors font-medium hover:text-[#C7B299] dark:hover:text-dark-accent ${
                    location.pathname.startsWith(item.to) ? 'text-[#C7B299] dark:text-dark-accent font-bold' : ''
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="hidden xl:block">
            <Link to="/admin/login">
              <Button variant="secondary" className="flex items-center gap-2 bg-[#C7B299] text-[#00314B] hover:bg-[#00314B] hover:text-white border-none">
                <User className="w-5 h-5" />
                Espace apprenant
              </Button>
            </Link>
          </div>
        </div>

        {/* Panneau étendu au survol */}
        <div className={`hidden xl:block absolute top-0 left-0 w-full bg-[#F8F6F2] dark:bg-dark-bg-secondary shadow-lg border-b border-gray-200 dark:border-dark-bg-primary z-40 transition-opacity duration-500 ${isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="h-full bg-[#F8F6F2] dark:bg-dark-bg-secondary shadow-lg border-b border-gray-200 dark:border-dark-bg-primary">
          <div className="container mx-auto py-4 h-full flex items-center">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 w-full">
              {memoizedNavItems.map((item) => (
                <div key={item.label} className="flex flex-col">
                  <Link
                    to={item.to}
                    className="font-semibold text-[#00314B] dark:text-dark-text-primary hover:text-[#C7B299] dark:hover:text-dark-accent mb-3 text-base"
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                  {item.submenu && (
                    <ul className="space-y-2">
                      {item.submenu.map((sub) => (
                        <li key={sub.to}>
                          <Link
                            to={sub.to}
                            className="text-sm text-gray-700 dark:text-dark-text-secondary hover:text-[#C7B299] dark:hover:text-dark-accent transition-colors hover:bg-gray-100 dark:hover:bg-dark-bg-primary rounded px-2 py-1"
                          >
                            {sub.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Menu mobile */}
      {mobileOpen && (
        <div className="xl:hidden fixed inset-0 bg-black/40 z-40" onClick={handleMobileClose} />
      )}
      <div
        className={`xl:hidden fixed top-0 right-0 h-full w-4/5 max-w-xs bg-[#F8F6F2] dark:bg-dark-bg-primary dark:text-white dark:hover:text-[#C7B299] shadow-lg z-50 transform transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ willChange: 'transform', maxWidth: '20rem', overflowY: 'auto' }}
      >
        <div className="flex flex-col h-full p-6 gap-6">
          <div className="flex items-center justify-between mb-4">
            <Link to="/" className="flex items-center gap-2" onClick={handleMobileClose}>
              <span className="text-2xl font-extrabold tracking-tight">BAI</span>
              <span className="ml-1 text-[#C7B299] text-lg font-bold">Formation & Consulting</span>
            </Link>
            <button onClick={handleMobileClose} aria-label="Fermer le menu">
              <X className="w-7 h-7" />
            </button>
          </div>
          <ul className="flex flex-col gap-4">
            {memoizedNavItems.map((item, idx) => (
              <li key={item.label}>
                {item.submenu ? (
                  <button
                    type="button"
                    className={`w-full flex items-center justify-between px-3 py-2 rounded transition-colors font-medium hover:text-[#C7B299] dark:hover:text-[#C7B299] ${location.pathname.startsWith(item.to) ? 'text-[#C7B299] font-bold' : ''}`}
                    onClick={() => setMobileOpenIndex(mobileOpenIndex === idx ? null : idx)}
                  >
                    <span className="flex items-center break-words whitespace-normal max-w-[14rem]">{item.icon}{item.label}</span>
                    {mobileOpenIndex === idx ? <ChevronUp className="w-5 h-5 ml-2" /> : <ChevronDown className="w-5 h-5 ml-2" />}
                  </button>
                ) : (
                  <Link
                    to={item.to}
                    className={`flex items-center px-3 py-2 rounded transition-colors font-medium hover:text-[#C7B299] dark:hover:text-[#C7B299] ${location.pathname.startsWith(item.to) ? 'text-[#C7B299] font-bold' : ''}`}
                    onClick={handleMobileClose}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                )}
                {item.submenu && mobileOpenIndex === idx && (
                  <ul className="ml-6 mt-2 flex flex-col gap-1 bg-white dark:bg-dark-bg-secondary rounded shadow-lg py-2">
                    {item.submenu.map((sub) => (
                      <li key={sub.to}>
                        <Link
                          to={sub.to}
                          className="block px-4 py-3 text-base hover:bg-[#C7B299]/20 dark:hover:bg-dark-accent/20 hover:text-[#C7B299] dark:hover:text-[#C7B299] rounded transition-colors break-words whitespace-normal max-w-[13rem]"
                          onClick={handleMobileClose}
                        >
                          {sub.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
          <div className="mt-auto">
            <Link to="/admin/login" onClick={handleMobileClose}>
              <Button variant="secondary" className="w-full flex items-center justify-center gap-2 bg-[#C7B299] text-[#00314B] hover:bg-[#00314B] hover:text-white border-none">
                <User className="w-5 h-5" />
                Espace apprenant
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
} 