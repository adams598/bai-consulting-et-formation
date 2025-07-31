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
  const [openIndex, setOpenIndex] = React.useState<number | null>(null);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [mobileOpenIndex, setMobileOpenIndex] = React.useState<number | null>(null);
  const { theme, toggleTheme } = useTheme();

  // Mémoriser les éléments de navigation pour éviter les re-renders
  const memoizedNavItems = useMemo(() => navItems, []);

  // Callbacks optimisés
  const handleMouseEnter = useCallback((idx: number) => {
    setOpenIndex(idx);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setOpenIndex(null);
  }, []);

  const handleMobileToggle = useCallback(() => {
    setMobileOpen((prev) => !prev);
  }, []);

  const handleMobileClose = useCallback(() => {
    setMobileOpen(false);
  }, []);

  return (
    <nav className="w-full bg-[#F8F6F2] dark:bg-dark-bg-primary text-[#00314B] dark:text-dark-text-primary shadow-lg z-50 relative transition-colors duration-200">
      <div className="container mx-auto flex items-center justify-between py-3 px-4">
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

        {/* Menu desktop */}
        <ul className="hidden xl:flex gap-6 items-center">
          {memoizedNavItems.map((item, idx) => (
            <li key={item.label} className="relative group">
              <Link
                to={item.to}
                className={`flex items-center px-3 py-2 rounded transition-colors font-medium hover:text-[#C7B299] dark:hover:text-dark-accent ${
                  location.pathname.startsWith(item.to) ? 'text-[#C7B299] dark:text-dark-accent font-bold' : ''
                }`}
                onMouseEnter={() => handleMouseEnter(idx)}
                onMouseLeave={handleMouseLeave}
              >
                {item.icon}
                {item.label}
              </Link>
              {item.submenu && (
                <div
                  className={`absolute left-0 mt-2 min-w-[220px] bg-white dark:bg-dark-bg-secondary text-[#00314B] dark:text-dark-text-primary rounded shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-50 ${
                    openIndex === idx ? 'opacity-100 pointer-events-auto' : ''
                  }`}
                  onMouseEnter={() => handleMouseEnter(idx)}
                  onMouseLeave={handleMouseLeave}
                >
                  <ul className="py-2">
                    {item.submenu.map((sub) => (
                      <li key={sub.to}>
                        <Link
                          to={sub.to}
                          className="block px-4 py-2 hover:bg-[#C7B299]/20 dark:hover:bg-dark-accent/20 rounded transition-colors"
                        >
                          {sub.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          ))}
        </ul>
        <div className="hidden xl:block">
          <Link to="/apprenant/connexion">
            <Button variant="secondary" className="flex items-center gap-2 bg-[#C7B299] text-[#00314B] hover:bg-[#00314B] hover:text-white border-none">
              <User className="w-5 h-5" />
              Espace apprenant
            </Button>
          </Link>
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
            <Link to="/apprenant/connexion" onClick={handleMobileClose}>
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