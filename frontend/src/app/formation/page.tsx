import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, PiggyBank, ShieldCheck, Building2, Users, Target, Briefcase } from 'lucide-react';
import { motion } from 'framer-motion';

export default function FormationPage() {
  const formations = [
    {
      id: 'banque',
      title: 'Conseiller Bancaire',
      description: 'Des formations sur mesure destinées aux conseillers bancaires pour maîtriser les techniques de négociation, la gestion de portefeuille clients et le développement commercial.',
      icon: <PiggyBank className="w-12 h-12 text-[#C7B299]" />,
      link: '/banque',
      topics: [
        'Banque au quotidien & PNB',
        'Techniques de négociation',
        'Gestion de portefeuille',
        'Épargne et placements',
        'Conquête client',
        'Démarche commerciale'
      ],
      image: '/images/pexels-banque-7821702.jpg',
    },
    {
      id: 'assurance',
      title: 'Conseiller en Assurance',
      description: 'Formations pour outiller vos conseillers commerciaux afin d\'aborder tous les univers d\'assurance : IARD, Prévoyance, avec compétences en vente et accompagnement client.',
      icon: <ShieldCheck className="w-12 h-12 text-[#C7B299]" />,
      link: '/assurance',
      topics: [
        'IARD (MRH, Auto, Professionnels)',
        'Prévoyance',
        'Techniques commerciales',
        'Accompagnement client',
        'Produits d\'assurance',
        'Conseil patrimonial'
      ],
      image: '/images/pexels-assurance-5255183.jpg',
    },
    {
      id: 'microfinance',
      title: 'Microfinance',
      description: 'Formations spécialisées en microfinance pour développer vos compétences dans l\'inclusion financière et l\'accompagnement des petits entrepreneurs et populations vulnérables.',
      icon: <Building2 className="w-12 h-12 text-[#C7B299]" />,
      link: '/microfinance',
      topics: [
        'Produits de microfinance',
        'Évaluation du crédit',
        'Accompagnement de projets',
        'Gestion des risques',
        'Relation client',
        'Inclusion financière'
      ],
      image: '/images/immobilier.webp',
    },
    {
      id: 'coaching',
      title: 'Coaching Commercial',
      description: 'Programmes de coaching intensifs pour développer vos compétences commerciales, techniques de vente, gestion d\'équipe et atteinte des objectifs.',
      icon: <Briefcase className="w-12 h-12 text-[#C7B299]" />,
      link: '/coaching',
      topics: [
        'Techniques de vente',
        'Prospection efficace',
        'Gestion d\'équipe',
        'Leadership commercial',
        'Atteinte des objectifs',
        'Développement personnel'
      ],
      image: '/images/presentation.jpg',
    }
  ];

  const targetAudience = [
    {
      title: 'Étudiants',
      description: 'Du Bac à Bac+5, préparez-vous aux métiers de la finance et de l\'assurance dès vos études.',
      icon: '🎓'
    },
    {
      title: 'Professionnels en poste',
      description: 'Améliorez vos compétences et accélérez votre évolution de carrière.',
      icon: '💼'
    },
    {
      title: 'Jeunes diplômés',
      description: 'Acquérez les compétences recherchées et intégrez les plus grandes institutions financières.',
      icon: '🚀'
    },
    {
      title: 'En reconversion',
      description: 'Changez de carrière en toute confiance avec nos formations adaptées.',
      icon: '🔄'
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8F6F2] dark:bg-dark-bg-primary">
      {/* HERO Section avec image 4K */}
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
        
        {/* Image du diplômé sans background */}
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
            src="/images/diplome.png"
            alt="Homme diplômé souriant"
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
            transition={{ 
              duration: 0.8,
              ease: "easeOut"
            }}
          >
            Formez-vous et accédez aux institutions financières africaines
          </motion.h1>
          
          {/* Paragraphe avec animation */}
          <motion.p 
            className="text-lg md:text-xl text-gray-100 max-w-2xl drop-shadow-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.8,
              delay: 0.2,
              ease: "easeOut"
            }}
          >
            Développez vos compétences et accédez aux métiers de commerciaux dans les institutions financières en Afrique
          </motion.p>
        </div>
      </div>

      {/* NOS FORMATIONS Section */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div id="nosformations" className="mb-16">
          <motion.h2 
            className="text-3xl md:text-4xl font-bold text-[#00314B] dark:text-dark-text-primary mb-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            Nos Formations
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {formations.map((formation, index) => (
              <motion.div
                key={formation.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group bg-white dark:bg-dark-bg-secondary rounded-lg shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
              >
                {/* Image */}
                <div className="relative h-40 overflow-hidden bg-gray-200 dark:bg-dark-bg-primary">
                  <img
                    src={formation.image}
                    alt={formation.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-all duration-300" />
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    {formation.icon}
                    <h3 className="text-lg font-bold text-[#00314B] dark:text-dark-text-primary">
                      {formation.title}
                    </h3>
                  </div>

                  <p className="text-sm text-gray-700 dark:text-dark-text-secondary mb-4">
                    {formation.description}
                  </p>

                  {/* Topics */}
                  <div className="mb-4">
                    <ul className="space-y-1">
                      {formation.topics.slice(0, 2).map((topic, idx) => (
                        <li key={idx} className="text-xs text-gray-600 dark:text-dark-text-secondary flex items-start gap-2">
                          <span className="text-[#C7B299] mt-0.5">•</span>
                          {topic}
                        </li>
                      ))}
                      {formation.topics.length > 2 && (
                        <li className="text-xs text-[#C7B299] font-medium">
                          +{formation.topics.length - 2} autre{formation.topics.length - 2 > 1 ? 's' : ''}
                        </li>
                      )}
                    </ul>
                  </div>

                  {/* CTA Button */}
                  <Link
                    to={formation.link}
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

        {/* POUR QUI ? Section */}
        <div id="pourqui" className="mb-16">
          <motion.h2 
            className="text-3xl md:text-4xl font-bold text-[#00314B] dark:text-dark-text-primary mb-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            Pour Qui ?
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {targetAudience.map((audience, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-lg p-6 hover:shadow-xl transition-all duration-300 text-center"
              >
                <div className="text-5xl mb-4">{audience.icon}</div>
                <h3 className="text-xl font-bold text-[#00314B] dark:text-dark-text-primary mb-3">
                  {audience.title}
                </h3>
                <p className="text-gray-700 dark:text-dark-text-secondary text-sm">
                  {audience.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* NOTRE OBJECTIF Section */}
        <motion.div 
          id="objectifs"
          className="mb-16 bg-white dark:bg-dark-bg-secondary rounded-lg shadow-lg p-10"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="max-w-3xl mx-auto">
            <div className="flex items-start gap-4">
              <Target className="w-8 h-8 text-[#C7B299] flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-3xl font-bold text-[#00314B] dark:text-dark-text-primary mb-4">
                  Notre Objectif
                </h2>
                <p className="text-lg text-gray-700 dark:text-dark-text-secondary mb-4">
                  <strong>Vous rendre opérationnel et vous connecter aux institutions financières</strong>
                </p>
                <p className="text-gray-700 dark:text-dark-text-secondary">
                  Au-delà de la formation, nous misons sur votre succès en créant des ponts avec les plus grandes institutions financières d'Afrique. Nos formations ne se limitent pas à l'apprentissage : elles incluent un accompagnement personnalisé, du coaching commercial et une mise en relation concrète avec nos partenaires recruteurs.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* OPPORTUNITÉS Section */}
        <motion.div 
          id="opportunites"
          className="bg-gradient-to-r from-[#C7B299] to-[#b89968] rounded-lg shadow-xl p-10 md:p-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="max-w-3xl mx-auto text-center">
            <Users className="w-12 h-12 text-white mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Opportunités d'Emploi
            </h2>
            <p className="text-lg text-white/90 mb-8">
              Postulez gratuitement auprès de nos partenaires des institutions financières
            </p>
            <Link
              to="/opportunites"
              className="inline-flex items-center justify-center gap-2 bg-[#00314B] text-white hover:bg-white hover:text-[#00314B] font-bold py-4 px-8 rounded-lg transition-all duration-300 group/btn text-lg"
            >
              Déposer ma candidature
              <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
