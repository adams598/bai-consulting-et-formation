import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Briefcase, TrendingUp, Building2, CheckCircle, Users, Lightbulb, Globe } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ConseillPage() {
  const challenges = [
    {
      icon: <Building2 className="w-8 h-8 text-[#C7B299]" />,
      title: 'Difficulté à obtenir des financements bancaires',
      description: 'Les banques demandent des critères stricts difficiles à démontrer'
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-[#C7B299]" />,
      title: 'Manque de structuration financière',
      description: 'Votre activité manque d\'organisation et de chiffres clairs'
    },
    {
      icon: <Briefcase className="w-8 h-8 text-[#C7B299]" />,
      title: 'Dossiers de crédit incomplets ou non conformes',
      description: 'Les documents présentés ne répondent pas aux standards bancaires'
    },
    {
      icon: <Users className="w-8 h-8 text-[#C7B299]" />,
      title: 'Difficulté à convaincre les banques',
      description: 'Votre profil d\'emprunteur n\'est pas optimisé'
    }
  ];

  const solutions = [
    {
      id: 'structuration',
      title: 'Structuration Financière',
      icon: <TrendingUp className="w-12 h-12 text-white" />,
      description: 'Nous organisons votre activité de manière professionnelle',
      details: [
        'Analyse complète de votre activité',
        'Mise en place d\'indicateurs financiers',
        'Organisation de vos flux et gestion'
      ]
    },
    {
      id: 'montage',
      title: 'Montage de Dossiers de Financement',
      icon: <Briefcase className="w-12 h-12 text-white" />,
      description: 'Nous construisons votre dossier bancaire parfait',
      details: [
        'Préparation de business plan',
        'Structuration du dossier bancaire',
        'Optimisation de votre profil emprunteur'
      ]
    },
    {
      id: 'relation',
      title: 'Mise en Relation avec les Banques',
      icon: <Globe className="w-12 h-12 text-white" />,
      description: 'Nous vous ouvrons les portes des institutions financières',
      details: [
        'Identification des partenaires adaptés',
        'Présentation de votre dossier',
        'Accompagnement jusqu\'à validation'
      ]
    }
  ];

  const targetAudience = [
    {
      title: 'PME en Croissance',
      description: 'Accélérez votre développement avec des financements adaptés',
      icon: '📈'
    },
    {
      title: 'Entrepreneurs',
      description: 'Structurez vos projets et accédez au financement',
      icon: '🚀'
    },
    {
      title: 'Startups',
      description: 'Levez des fonds et développez votre activité rapidement',
      icon: '💡'
    },
    {
      title: 'Entreprises en Recherche de Financement',
      description: 'Trouvez les ressources nécessaires à votre croissance',
      icon: '🎯'
    }
  ];

  const advantages = [
    {
      title: 'Compréhension des Exigences Bancaires',
      description: 'Nous connaissons précisément ce que les banques recherchent dans un dossier'
    },
    {
      title: 'Double Expertise Europe / Afrique',
      description: 'Nous maîtrisons les standards internationaux et les contextes locaux'
    },
    {
      title: 'Approche Orientée Résultats',
      description: 'Chaque action est alignée sur votre objectif de financement'
    }
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
        
        {/* Image Conseil animée */}
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
            src="/images/conseil.png"
            alt="Conseil pour entreprises africaines"
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
            Accompagner les Entreprises Africaines à se Structurer
          </motion.h1>
          
          {/* Paragraphe avec animation */}
          <motion.p 
            className="text-lg md:text-xl text-gray-100 max-w-2xl drop-shadow-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          >
            Nous accompagnons les entreprises africaines à mieux se structurer et à mobiliser des financements auprès d'institutions financières
          </motion.p>
        </div>
      </div>

      {/* NOTRE MISSION Section */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <motion.div 
          id="mission"
          className="mb-16 bg-white dark:bg-dark-bg-secondary rounded-lg shadow-lg p-10"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-[#00314B] dark:text-dark-text-primary mb-6">
              Notre Mission
            </h2>
            <p className="text-lg text-gray-700 dark:text-dark-text-secondary leading-relaxed">
              Nous aidons les entreprises locales africaines à <strong>structurer leur activité</strong> et à <strong>mobiliser des financements bancaires</strong> pour accélérer leur croissance. Notre approche combine expertise financière, connaissance des exigences bancaires et compréhension profonde des contextes locaux africains.
            </p>
          </div>
        </motion.div>

        {/* Vid="enjeux" OS ENJEUX Section */}
        <div id="enjeux" className="mb-16">
          <motion.h2 
            className="text-3xl md:text-4xl font-bold text-[#00314B] dark:text-dark-text-primary mb-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            Vos Enjeux
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {challenges.map((challenge, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-lg p-6 hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">{challenge.icon}</div>
                  <div>
                    <h3 className="font-semibold text-[#00314B] dark:text-dark-text-primary mb-2">
                      {challenge.title}
                    </h3>
                    <p className="text-sm text-gray-700 dark:text-dark-text-secondary">
                      {challenge.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Nid="solutions" OS SOLUTIONS Section */}
        <div id="solutions" className="mb-16">
          <motion.h2 
            className="text-3xl md:text-4xl font-bold text-[#00314B] dark:text-dark-text-primary mb-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            Nos Solutions
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {solutions.map((solution, idx) => (
              <motion.div
                key={solution.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-[#C7B299] to-[#b89968] rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
              >
                <div className="p-8 h-full flex flex-col">
                  <div className="flex items-center gap-3 mb-4">
                    {solution.icon}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    {solution.title}
                  </h3>
                  <p className="text-white/90 text-sm mb-6 flex-grow">
                    {solution.description}
                  </p>
                  <ul className="space-y-2">
                    {solution.details.map((detail, didx) => (
                      <li key={didx} className="text-white text-sm flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Pid="pourqui" OUR QUI ? Section */}
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
                <h3 className="text-lg font-bold text-[#00314B] dark:text-dark-text-primary mb-3">
                  {audience.title}
                </h3>
                <p className="text-gray-700 dark:text-dark-text-secondary text-sm">
                  {audience.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* NOTRE VALEUR AJOUTÉE Section */}
        <motion.div 
          id="valeurajoutee"
          className="mb-16 bg-white dark:bg-dark-bg-secondary rounded-lg shadow-lg p-10"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-[#00314B] dark:text-dark-text-primary mb-8 text-center">
              Notre Valeur Ajoutée
            </h2>
            <div className="space-y-6">
              {advantages.map((advantage, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-start gap-4"
                >
                  <Lightbulb className="w-6 h-6 text-[#C7B299] flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-[#00314B] dark:text-dark-text-primary mb-1">
                      {advantage.title}
                    </h3>
                    <p className="text-gray-700 dark:text-dark-text-secondary">
                      {advantage.description}
                    </p>
                  </div>
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
            <Briefcase className="w-12 h-12 text-white mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Structurez Votre Entreprise
            </h2>
            <p className="text-lg text-white/90 mb-8">
              Et accédez au financement pour accélérer votre croissance
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
