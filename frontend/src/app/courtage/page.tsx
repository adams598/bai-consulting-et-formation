import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Home, TrendingUp, Building2, MapPin, CheckCircle, Users, Phone } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CourtageAboutPage() {
  const services = [
    {
      id: 'achat',
      title: 'Achat Immobilier',
      description: 'Concrétisez vos projets immobiliers en Afrique avec notre accompagnement complet.',
      icon: <Home className="w-12 h-12 text-[#C7B299]" />,
      link: '/courtage/achat',
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
      link: '/courtage/investissement',
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
      link: '/courtage/credit',
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
    <div className="min-h-screen bg-[#F8F6F2] dark:bg-dark-bg-primary">
      {/* HERO Section */}
      <div 
        className="relative bg-cover bg-center bg-no-repeat min-h-[500px] md:min-h-[600px] flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage: 'url(/images/formation-hero-4k.jpg)',
          backgroundAttachment: 'fixed'
        }}
      >
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
          {/* Titre avec animation */}
          <motion.h1 
            className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 drop-shadow-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            Financez vos projets immobiliers en Afrique depuis l'Europe
          </motion.h1>
          
          {/* Paragraphe avec animation */}
          <motion.p 
            className="text-lg md:text-xl text-gray-100 max-w-2xl drop-shadow-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          >
            Un interlocuteur unique en Europe qui sécurise votre projet en Afrique
          </motion.p>
        </div>
      </div>

      {/* NOS SERVICES Section */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="mb-16">
          <motion.h2 
            className="text-3xl md:text-4xl font-bold text-[#00314B] dark:text-dark-text-primary mb-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            Nos Services
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group bg-white dark:bg-dark-bg-secondary rounded-lg shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-[#C7B299] to-[#b89968] p-6">
                  {service.icon}
                  <h3 className="text-xl font-bold text-white mt-3">
                    {service.title}
                  </h3>
                </div>

                {/* Content */}
                <div className="p-5">
                  <p className="text-sm text-gray-700 dark:text-dark-text-secondary mb-4">
                    {service.description}
                  </p>

                  {/* Features */}
                  <div className="mb-4">
                    <ul className="space-y-2">
                      {service.features.slice(0, 3).map((feature, idx) => (
                        <li key={idx} className="text-xs text-gray-600 dark:text-dark-text-secondary flex items-start gap-2">
                          <CheckCircle className="w-3 h-3 text-[#C7B299] mt-0.5 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                      {service.features.length > 3 && (
                        <li className="text-xs text-[#C7B299] font-medium">
                          +{service.features.length - 3} autre{service.features.length - 3 > 1 ? 's' : ''}
                        </li>
                      )}
                    </ul>
                  </div>

                  {/* CTA Button */}
                  <Link
                    to={service.link}
                    className="inline-flex items-center justify-center gap-2 w-full bg-[#C7B299] text-[#00314B] hover:bg-[#00314B] hover:text-white font-semibold py-2 px-3 rounded-lg transition-all duration-300 group/btn text-sm"
                  >
                    En savoir plus
                    <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* LES PROBLÈMES Section */}
        <motion.div 
          id="problemes"
          className="mb-16 bg-red-50 dark:bg-red-900/20 rounded-lg shadow-lg p-10"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-[#00314B] dark:text-dark-text-primary mb-6">
              Les Problèmes (Contexte actuel)
            </h2>
            <div className="space-y-4">
              {problems.map((problem, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-start gap-3"
                >
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-700 dark:text-dark-text-secondary">{problem}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* NOS SOLUTIONS Section */}
        <motion.div 
          id="solutions"
          className="mb-16 bg-green-50 dark:bg-green-900/20 rounded-lg shadow-lg p-10"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-[#00314B] dark:text-dark-text-primary mb-6">
              Nos Solutions BAI CONSULTING ET FORMATION
            </h2>
            <p className="text-lg font-semibold text-[#C7B299] mb-6 italic">
              "Un interlocuteur unique en Europe qui sécurise votre projet en Afrique"
            </p>
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
          </div>
        </motion.div>

        {/* PAYS D'INTERVENTION Section */}
        <div id="focuspays" className="mb-16">
          <motion.h2 
            className="text-3xl md:text-4xl font-bold text-[#00314B] dark:text-dark-text-primary mb-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            Nous intervenons dans plusieurs pays
          </motion.h2>
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
        </div>

        {/* PREUVE SOCIALE & STORYTELLING Section */}
        <div className="grid gap-6 mb-16 lg:grid-cols-2">
          <motion.div 
            id="preuvesociale"
            className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-lg p-8"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-[#00314B] dark:text-dark-text-primary mb-4">Preuve sociale</h2>
            <p className="text-gray-700 dark:text-dark-text-secondary mb-4">
              Cas clients et partenariats qui montrent notre capacité à sécuriser les projets immobiliers depuis l'Europe vers l'Afrique.
            </p>
            <ul className="space-y-3">
              <li className="rounded-lg border border-gray-200 dark:border-dark-bg-primary p-4">
                <p className="font-semibold text-[#00314B] dark:text-dark-text-primary">Cas client : financement rapide</p>
                <p className="text-sm text-gray-600 dark:text-dark-text-secondary">Analyse de dossier en France et déblocage de crédit immobilier pour un expatrié au Cameroun.</p>
              </li>
              <li className="rounded-lg border border-gray-200 dark:border-dark-bg-primary p-4">
                <p className="font-semibold text-[#00314B] dark:text-dark-text-primary">Témoignage</p>
                <p className="text-sm text-gray-600 dark:text-dark-text-secondary">« Une équipe réactive qui a simplifié toutes les étapes de mon projet. »</p>
              </li>
            </ul>
          </motion.div>

          <motion.div 
            id="storytelling"
            className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-lg p-8"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-[#00314B] dark:text-dark-text-primary mb-4">Notre storytelling</h2>
            <p className="text-gray-700 dark:text-dark-text-secondary mb-4">
              Nous intervenons à tous les niveaux du développement du secteur financier africain : formation, conseil et courtage, en connectant une diaspora qualifiée aux banques locales.
            </p>
            <p className="text-sm text-gray-600 dark:text-dark-text-secondary">
              Notre valeur unique est de proposer un interlocuteur européen capable de sécuriser votre projet en Afrique grâce à un réseau de partenaires locaux de confiance.
            </p>
          </motion.div>
        </div>

        {/* PROCESS Section */}
        <motion.div 
          id="process"
          className="mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-[#00314B] dark:text-dark-text-primary mb-12 text-center">
            Notre Processus Client
          </h2>
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
                  className="relative bg-white dark:bg-dark-bg-secondary rounded-lg shadow-lg p-6 text-center hover:shadow-xl transition-all duration-300"
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
        </motion.div>

        {/* CTA Section */}
        <motion.div 
          className="bg-gradient-to-r from-[#C7B299] to-[#b89968] rounded-lg shadow-xl p-10 md:p-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
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
              className="inline-flex items-center justify-center gap-2 bg-[#00314B] text-white hover:bg-white hover:text-[#00314B] font-bold py-4 px-8 rounded-lg transition-all duration-300 group/btn text-lg"
            >
              Prendre Rendez-vous
              <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
