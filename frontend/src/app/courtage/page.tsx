import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Home, TrendingUp, Building2, MapPin, CheckCircle, Users, Phone, Sparkles } from 'lucide-react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';

// Composants d'animation avancés
const AnimatedText = ({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) => {
  const letters = text.split('');

  return (
    <motion.div className={className}>
      {letters.map((letter, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.5,
            delay: delay + index * 0.05,
            ease: "easeOut"
          }}
          className="inline-block"
        >
          {letter === ' ' ? '\u00A0' : letter}
        </motion.span>
      ))}
    </motion.div>
  );
};

const FloatingParticles = () => {
  const particles = Array.from({ length: 20 }, (_, i) => i);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle}
          className="absolute w-1 h-1 bg-white/20 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -100, 0],
            x: [0, Math.random() * 50 - 25, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

export default function CourtageAboutPage() {
  const services = [
    {
      id: 'achat',
      title: 'Achat Immobilier',
      description: 'Concrétisez vos projets immobiliers en Afrique avec notre accompagnement complet.',
      icon: <Home className="w-12 h-12 text-[#C7B299]" />,
      link: '/contact',
      features: [
        'Sourcing de biens immobiliers',
        'Analyse de projets',
        'Négociation commerciale',
        'Financement adapté',
        'Suivi administratif',
        'Signature et clôture'
      ]
    },
    {
      id: 'investissement',
      title: 'Investissement Locatif',
      description: 'Générez des revenus réguliers en investissant dans l\'immobilier africain.',
      icon: <TrendingUp className="w-12 h-12 text-[#C7B299]" />,
      link: '/contact',
      features: [
        'Analyse de rentabilité',
        'Sélection des meilleurs biens',
        'Structuration fiscale',
        'Financement optimisé',
        'Gestion locative',
        'Suivi des rendements'
      ]
    },
    {
      id: 'credit',
      title: 'Accès au Crédit Local',
      description: 'Accédez facilement au crédit auprès des meilleures institutions bancaires africaines.',
      icon: <Building2 className="w-12 h-12 text-[#C7B299]" />,
      link: '/contact',
      features: [
        'Analyse de dossier',
        'Mise en relation bancaire',
        'Montage de dossier',
        'Négociation conditions',
        'Suivi déblocage',
        'Accompagnement juridique'
      ]
    }
  ];

  const countries = [
    {
      id: 'cameroun',
      name: 'Cameroun',
      flag: '🇨🇲',
      description: 'Notre principal marché avec partenariats exclusifs',
      partners: [
        { name: 'Crédit Foncier du Cameroun (CFC)', type: 'Partenaire principal' },
        { name: 'RELESTATE', type: 'Promouvoir local' }
      ],
      projects: ['Résidences secondaires', 'Investissement locatif', 'Immobilier professionnel']
    },
    {
      id: 'cotedivoire',
      name: 'Côte d\'Ivoire',
      flag: '🇨🇮',
      description: 'Marché dynamique avec fortes opportunités',
      partners: [
        { name: 'Chambre nationale des promoteurs et constructeurs', type: 'Partenaire' },
        { name: 'Banque de l\'Habitat', type: 'Partenaire financier' },
        { name: 'BNI', type: 'Partenaire financier' },
        { name: 'NSIA Banque', type: 'Partenaire financier' },
        { name: 'NSIA Assurance', type: 'Partenaire' }
      ],
      projects: ['Projets résidentiels', 'Copropriétés', 'Programmes commerciaux']
    }
  ];

  const processSteps = [
    { step: 1, title: 'Prise de contact', description: 'Écoute et compréhension de vos objectifs' },
    { step: 2, title: 'Analyse du dossier', description: 'Évaluation complète de votre profil' },
    { step: 3, title: 'Présentation aux banques', description: 'Mise en relation avec nos partenaires' },
    { step: 4, title: 'Validation et montage', description: 'Structuration du financement' },
    { step: 5, title: 'Suivi jusqu\'au financement', description: 'Accompagnement jusqu\'à déblocage' }
  ];

  const problems = [
    'Difficulté d\'obtenir un crédit à distance',
    'Manque de confiance des banques africaines',
    'Complexité administrative',
    'Mauvaise expérience avec les banques locales'
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">
      {/* HERO Section */}
      <div
        className="relative bg-cover bg-center bg-no-repeat min-h-[500px] md:min-h-[600px] flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage: 'url(/images/formation-hero-4k.jpg)',
          backgroundAttachment: 'fixed'
        }}
      >
        {/* Particules flottantes */}
        <FloatingParticles />

        {/* Formes géométriques animées */}
        <motion.div
          className="absolute top-20 left-20 w-20 h-20 border-2 border-white/20 rounded-full"
          animate={{
            rotate: 360,
            scale: [1, 1.2, 1],
          }}
          transition={{
            rotate: { duration: 20, repeat: Infinity, ease: "linear" },
            scale: { duration: 4, repeat: Infinity, ease: "easeInOut" }
          }}
        />
        <motion.div
          className="absolute bottom-32 right-32 w-16 h-16 bg-[#C7B299]/20 rounded-lg"
          animate={{
            rotate: -360,
            x: [0, 20, 0],
            y: [0, -20, 0],
          }}
          transition={{
            rotate: { duration: 15, repeat: Infinity, ease: "linear" },
            x: { duration: 6, repeat: Infinity, ease: "easeInOut" },
            y: { duration: 8, repeat: Infinity, ease: "easeInOut" }
          }}
        />

        {/* Overlay gradient avec animation subtile */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-[#00314B]/85 via-[#00314B]/70 to-[#1a4d6a]/75"
          initial={{ opacity: 0.7 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        ></motion.div>

        {/* Image Courtage animée */}
        <motion.div
          className="absolute bottom-0 right-0 w-72 md:w-80 lg:w-[30rem] h-auto opacity-100 hidden sm:block z-0"
          initial={{ opacity: 0, x: 100, scale: 0.9, y: 0 }}
          animate={{ opacity: 1, x: 0, scale: 1, y: [0, -10, 0] }}
          transition={{
            x: { duration: 0.8, delay: 0.3, ease: "easeOut" },
            opacity: { duration: 0.8, delay: 0.3, ease: "easeOut" },
            scale: { duration: 0.8, delay: 0.3, ease: "easeOut" },
            y: { duration: 4.5, repeat: Infinity, repeatType: "reverse", ease: "easeInOut", delay: 1 }
          }}
        >
          <img
            src="/images/courtage.png"
            alt="Courtage"
            className="w-full h-full object-contain drop-shadow-2xl"
            style={{
              filter: 'drop-shadow(0 10px 40px rgba(0,0,0,0.5))',
              textShadow: 'none'
            }}
          />
        </motion.div>

        {/* Contenu du Hero */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 py-20 md:py-32 text-white text-center md:text-left">
          {/* Titre avec animation lettre par lettre */}
          <div className="mb-6">
            <AnimatedText
              text="Courtage Immobilier"
              className="text-4xl md:text-5xl lg:text-6xl font-bold drop-shadow-lg block"
              delay={0.1}
            />
            <motion.div
              className="h-1 w-32 bg-[#C7B299] mx-auto md:mx-0 mt-4"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1, delay: 2, ease: "easeOut" }}
            />
          </div>

          {/* Paragraphe avec animation améliorée */}
          <motion.p
            className="text-lg md:text-xl text-gray-100 max-w-2xl drop-shadow-md mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 2.5, ease: "easeOut" }}
          >
            Votre partenaire privilégié pour investir dans l'immobilier africain avec un accompagnement complet et sécurisé.
          </motion.p>

          {/* Boutons CTA avec animations */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 3, ease: "easeOut" }}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 bg-[#C7B299] hover:bg-[#b89968] text-[#00314B] font-bold py-4 px-8 rounded-full transition-all duration-300 group/btn shadow-lg hover:shadow-xl"
              >
                <Sparkles className="w-5 h-5" />
                Commencer mon projet
                <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
            {/* <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                to="#services"
                className="inline-flex items-center justify-center gap-2 bg-transparent border-2 border-white/30 hover:border-white text-white font-semibold py-4 px-8 rounded-full transition-all duration-300 backdrop-blur-sm"
              >
                Découvrir nos services
              </Link>
            </motion.div> */}
          </motion.div>
        </div>
      </div>

      {/* NOS SERVICES Section */}
      <motion.section
        className="py-10 sm:py-16 bg-slate-50 dark:bg-slate-950"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            className="mb-16 space-y-8 text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <div className="inline-flex items-center rounded-full bg-brand-beige/10 text-brand-blue px-4 py-2 text-sm font-semibold uppercase tracking-[0.22em]">
              <Sparkles className="w-4 h-4 mr-2" />
              Nos services
            </div>
            {/* <AnimatedText
              text="Nos Services"
              className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white"
              delay={0.2}
            /> */}
            <motion.div
              className="mx-auto mt-3 h-1.5 w-24 rounded-full bg-brand-blue"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
            />
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.15,
                  delayChildren: 0.3,
                },
              },
            }}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {services.map((service, index) => (
              <motion.div
                key={service.id}
                variants={{
                  hidden: { opacity: 0, y: 50, scale: 0.9 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    transition: {
                      type: "spring",
                      damping: 20,
                      stiffness: 100,
                      delay: index * 0.1,
                    },
                  },
                }}
                whileHover={{
                  y: -8,
                  scale: 1.02,
                  transition: { duration: 0.3, ease: "easeOut" }
                }}
                className="group bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200 dark:border-slate-700 shadow-sm shadow-slate-200/40 dark:shadow-none overflow-hidden hover:shadow-2xl hover:shadow-brand-blue/20 transition-all duration-500"
              >
                {/* Header avec animation */}
                <motion.div
                  className="bg-gradient-to-r from-[#C7B299] to-[#b89968] p-6 relative overflow-hidden"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: "100%" }}
                    transition={{ duration: 0.8 }}
                  />
                  <motion.div
                    className="relative z-10"
                    initial={{ scale: 0.8, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                  >
                    {service.icon}
                    <h3 className="text-xl font-bold text-white mt-3">
                      {service.title}
                    </h3>
                  </motion.div>
                </motion.div>

                {/* Content */}
                <div className="p-5">
                  <motion.p
                    className="text-sm text-slate-600 dark:text-slate-300 mb-4"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                  >
                    {service.description}
                  </motion.p>

                  {/* Features avec animation stagger */}
                  <motion.div
                    className="mb-4"
                    variants={{
                      hidden: { opacity: 0 },
                      visible: {
                        opacity: 1,
                        transition: {
                          staggerChildren: 0.05,
                          delayChildren: 0.4 + index * 0.1,
                        },
                      },
                    }}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                  >
                    <ul className="space-y-2">
                      {service.features.slice(0, 3).map((feature, idx) => (
                        <motion.li
                          key={idx}
                          variants={{
                            hidden: { opacity: 0, x: -10 },
                            visible: { opacity: 1, x: 0 }
                          }}
                          className="text-xs text-gray-600 dark:text-dark-text-secondary flex items-start gap-2"
                        >
                          <motion.div
                            whileHover={{ scale: 1.2, color: "#C7B299" }}
                            transition={{ duration: 0.2 }}
                          >
                            <CheckCircle className="w-3 h-3 text-[#C7B299] mt-0.5 flex-shrink-0" />
                          </motion.div>
                          {feature}
                        </motion.li>
                      ))}
                      {service.features.length > 3 && (
                        <motion.li
                          variants={{
                            hidden: { opacity: 0, x: -10 },
                            visible: { opacity: 1, x: 0 }
                          }}
                          className="text-xs text-brand-blue font-medium"
                        >
                          +{service.features.length - 3} autres prestations
                        </motion.li>
                      )}
                    </ul>
                  </motion.div>

                  {/* CTA Button avec animation sophistiquée */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                  >
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Link
                        to={service.link}
                        className="inline-flex items-center justify-center gap-2 w-full bg-brand-blue text-white hover:bg-brand-blue/90 font-semibold py-3 px-4 rounded-full transition-all duration-300 group/btn text-sm relative overflow-hidden"
                      >
                        <motion.span
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                          initial={{ x: "-100%" }}
                          whileHover={{ x: "100%" }}
                          transition={{ duration: 0.6 }}
                        />
                        <span className="relative z-10">En savoir plus</span>
                        <motion.div
                          whileHover={{ x: 4 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ArrowRight className="w-3 h-3" />
                        </motion.div>
                      </Link>
                    </motion.div>
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

        {/* LES PROBLÈMES Section */}
        <motion.section 
          id="problemes"
          className="mb-16 bg-red-50 dark:bg-red-900/20 rounded-[28px] shadow-xl p-10"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className="max-w-3xl mx-auto">
            <div className="space-y-4 text-center mb-8">
              <div className="inline-flex items-center rounded-full bg-brand-beige/10 text-brand-blue px-4 py-2 text-sm font-semibold uppercase tracking-[0.22em]">
                Les problèmes
              </div>
              {/* <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">
                Les Problèmes (Contexte actuel)
              </h2> */}
              <div className="mx-auto mt-3 h-1.5 w-24 rounded-full bg-brand-blue" />
            </div>
            <div className="space-y-4">
              {problems.map((problem, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-start gap-3 bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200 dark:border-slate-700 shadow-sm shadow-slate-200/40 dark:shadow-none p-6"
                >
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-slate-600 dark:text-slate-300">{problem}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* NOS SOLUTIONS Section */}
        <motion.section 
          id="solutions"
          className="mb-16 bg-slate-50 dark:bg-slate-950 rounded-[28px] shadow-xl p-10"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className="max-w-3xl mx-auto text-center mb-10">
            <div className="inline-flex items-center rounded-full bg-brand-beige/10 text-brand-blue px-4 py-2 text-sm font-semibold uppercase tracking-[0.22em]">
              Nos solutions
            </div>
            {/* <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mt-4">
              Nos Solutions BAI CONSULTING ET FORMATION
            </h2> */}
            <div className="mx-auto mt-3 h-1.5 w-24 rounded-full bg-brand-blue" />
            <p className="text-lg font-semibold text-brand-blue mb-6 italic mt-6">
              "Un interlocuteur unique en Europe qui sécurise votre projet en Afrique"
            </p>
          </div>
          <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-[#00314B] dark:text-dark-text-primary">Analyse de dossier en France</h3>
                  <p className="text-sm text-gray-700 dark:text-dark-text-secondary">Évaluation complète avant la présentation aux banques</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-[#00314B] dark:text-dark-text-primary">Mise en relation avec banques locales</h3>
                  <p className="text-sm text-gray-700 dark:text-dark-text-secondary">Accès à nos partenaires de confiance en Afrique</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-[#00314B] dark:text-dark-text-primary">Suivi jusqu'au déblocage</h3>
                  <p className="text-sm text-gray-700 dark:text-dark-text-secondary">Accompagnement complet jusqu'à finalisation</p>
                </div>
              </div>
            </div>
        </motion.section>

        {/* PAYS D'INTERVENTION Section */}
        <motion.section 
          id="focuspays"
          className="mb-16 bg-slate-50 dark:bg-slate-950 rounded-[28px] shadow-xl p-10"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className="text-center mb-10">
            <div className="inline-flex items-center rounded-full bg-brand-beige/10 text-brand-blue px-4 py-2 text-sm font-semibold uppercase tracking-[0.22em]">
              Nos marchés
            </div>
            {/* <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mt-4">
              Nous intervenons dans plusieurs pays
            </h2> */}
            <div className="mx-auto mt-3 h-1.5 w-24 rounded-full bg-brand-blue" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {countries.map((country, idx) => (
              <motion.div
                key={country.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-lg p-8 hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-6xl">{country.flag}</span>
                  <div>
                    <h3 className="text-2xl font-bold text-[#00314B] dark:text-dark-text-primary">{country.name}</h3>
                    <p className="text-sm text-[#C7B299]">{country.description}</p>
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
                  <h4 className="font-semibold text-[#00314B] dark:text-dark-text-primary mb-3">Nos partenaires</h4>
                  <div className="space-y-2 mb-6">
                    {country.partners.map((partner, pidx) => (
                      <div key={pidx} className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-[#C7B299] mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{partner.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{partner.type}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <h4 className="font-semibold text-[#00314B] dark:text-dark-text-primary mb-2">Types de projets financés</h4>
                  <div className="space-y-1">
                    {country.projects.map((project, pidx) => (
                      <p key={pidx} className="text-sm text-gray-700 dark:text-dark-text-secondary flex items-start gap-2">
                        <span className="text-[#C7B299]">✓</span>
                        {project}
                      </p>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* PREUVE SOCIALE & STORYTELLING Section */}
        <motion.section
          className="mb-16 bg-slate-50 dark:bg-slate-950 rounded-[28px] shadow-xl p-10"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className="max-w-7xl mx-auto text-center mb-10">
            <div className="inline-flex items-center rounded-full bg-brand-beige/10 text-brand-blue px-4 py-2 text-sm font-semibold uppercase tracking-[0.22em]">
              Preuve sociale
            </div>
            {/* <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mt-4">
              Preuve sociale & storytelling
            </h2> */}
            <div className="mx-auto mt-3 h-1.5 w-24 rounded-full bg-brand-blue" />
          </div>
          <div className="grid gap-6 mb-16 lg:grid-cols-2">
            <motion.div 
              id="preuvesociale"
              className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200 dark:border-slate-700 shadow-sm shadow-slate-200/40 dark:shadow-none p-8"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h3 className="text-3xl font-semibold text-slate-900 dark:text-white mb-4">Preuve sociale</h3>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                Cas clients et partenariats qui montrent notre capacité à sécuriser les projets immobiliers depuis l'Europe vers l'Afrique.
              </p>
              <ul className="space-y-3">
                <li className="rounded-[20px] border border-slate-200 dark:border-slate-700 p-4">
                  <p className="font-semibold text-slate-900 dark:text-white">Cas client : financement rapide</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">Analyse de dossier en France et déblocage de crédit immobilier pour un expatrié au Cameroun.</p>
                </li>
                <li className="rounded-[20px] border border-slate-200 dark:border-slate-700 p-4">
                  <p className="font-semibold text-slate-900 dark:text-white">Témoignage</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">« Une équipe réactive qui a simplifié toutes les étapes de mon projet. »</p>
                </li>
              </ul>
            </motion.div>

            <motion.div 
              id="storytelling"
              className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200 dark:border-slate-700 shadow-sm shadow-slate-200/40 dark:shadow-none p-8"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <h3 className="text-3xl font-semibold text-slate-900 dark:text-white mb-4">Notre storytelling</h3>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                Nous intervenons à tous les niveaux du développement du secteur financier africain : formation, conseil et courtage, en connectant une diaspora qualifiée aux banques locales.
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Notre valeur unique est de proposer un interlocuteur européen capable de sécuriser votre projet en Afrique grâce à un réseau de partenaires locaux de confiance.
              </p>
            </motion.div>
          </div>
        </motion.section>

        {/* PROCESS Section */}
        <motion.section 
          id="process"
          className="mb-16 bg-slate-50 dark:bg-slate-950 rounded-[28px] shadow-xl p-10"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className="text-center mb-12">
            <div className="inline-flex items-center rounded-full bg-brand-beige/10 text-brand-blue px-4 py-2 text-sm font-semibold uppercase tracking-[0.22em]">
              Processus client
            </div>
            {/* <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mt-4">
              Notre Processus Client
            </h2> */}
            <div className="mx-auto mt-3 h-1.5 w-24 rounded-full bg-brand-blue" />
          </div>
          <div className="relative">
            {/* Ligne de connexion */}
            <div className="hidden lg:block absolute top-20 left-0 right-0 h-1 bg-gradient-to-r from-[#C7B299] to-[#b89968]"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {processSteps.map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  viewport={{ once: true }}
                  className="relative bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200 dark:border-slate-700 shadow-sm shadow-slate-200/40 dark:shadow-none p-6 text-center hover:shadow-xl transition-all duration-300"
                >
                  <div className="w-12 h-12 bg-[#C7B299] text-white rounded-full flex items-center justify-center font-bold mx-auto mb-3 text-lg">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-[#00314B] dark:text-dark-text-primary mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-700 dark:text-dark-text-secondary">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* CTA Section */}
        <motion.section 
          className="bg-gradient-to-r from-[#C7B299] to-[#b89968] rounded-[28px] shadow-xl p-10 md:p-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className="max-w-3xl mx-auto text-center">
            <Phone className="w-12 h-12 text-white mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Vous avez un projet immobilier ?
            </h2>
            <p className="text-lg text-white/90 mb-8">
              Vous avez une idée, un projet concret ? Prenez rendez-vous et parlons-en !
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center gap-2 bg-brand-blue text-white hover:bg-brand-blue/90 font-bold py-4 px-8 rounded-full transition-all duration-300 group/btn text-lg"
            >
              Prendre Rendez-vous
              <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
            </Link>
          </div>
        </motion.section>
    </div>
  );
}
