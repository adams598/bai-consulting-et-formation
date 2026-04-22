import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Briefcase, TrendingUp, Building2, CheckCircle, Users, Lightbulb, Globe, Sparkles } from 'lucide-react';
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
          {/* Titre avec animation lettre par lettre */}
          <div className="mb-6">
            <AnimatedText
              text="Conseils en Structuration"
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
            Accompagnez votre entreprise africaine vers la réussite avec notre expertise en structuration et financement.
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
                Structurer mon projet
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

      {/* NOTRE MISSION Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div 
          id="mission"
          className="mb-16 bg-slate-50 dark:bg-slate-950 rounded-[28px] shadow-xl p-10"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className="max-w-3xl mx-auto text-center mb-10">
            <div className="inline-flex items-center rounded-full dark:bg-brand-beige bg-brand-beige/10 text-brand-blue px-4 py-2 text-sm font-semibold uppercase tracking-[0.22em]">
              Notre mission
            </div>
            {/* <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mt-4">
              Notre Mission
            </h2> */}
            <div className="mx-auto mt-3 h-1.5 w-24 rounded-full dark:bg-brand-beige bg-brand-blue" />
          </div>
          <div className="max-w-3xl mx-auto">
            <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              Nous aidons les entreprises africaines à mieux se structurer et à mobiliser des financements auprès d'institutions financières, avec un accompagnement adapté aux réalités locales.
            </p>
          </div>
        </motion.div>

        <motion.section
          id="enjeux"
          className="mb-16 bg-slate-50 dark:bg-slate-950 rounded-[28px] shadow-xl p-10"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className="text-center mb-10">
            <div className="inline-flex items-center rounded-full  dark:bg-brand-beige bg-brand-beige/10 text-brand-blue px-4 py-2 text-sm font-semibold uppercase tracking-[0.22em]">
              Vos enjeux
            </div>
            {/* <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mt-4">
              Vos Enjeux
            </h2> */}
            <div className="mx-auto mt-3 h-1.5 w-24 rounded-full  dark:bg-brand-beige bg-brand-blue" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {challenges.map((challenge, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200 dark:border-slate-700 shadow-sm shadow-slate-200/40 dark:shadow-none p-6 hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">{challenge.icon}</div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                      {challenge.title}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      {challenge.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <motion.section
          id="solutions"
          className="mb-16 bg-slate-50 dark:bg-slate-950 rounded-[28px] shadow-xl p-10"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className="text-center mb-10">
            <div className="inline-flex items-center rounded-full bg-brand-beige/10 dark:bg-brand-beige text-brand-blue px-4 py-2 text-sm font-semibold uppercase tracking-[0.22em]">
              Nos solutions
            </div>
            {/* <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mt-4">
              Nos Solutions
            </h2> */}
            <div className="mx-auto mt-3 h-1.5 w-24 rounded-full  dark:bg-brand-beige bg-brand-blue" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {solutions.map((solution, idx) => (
              <motion.div
                key={solution.id}
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  type: "spring",
                  damping: 20,
                  stiffness: 100,
                  delay: idx * 0.1
                }}
                viewport={{ once: true }}
                whileHover={{
                  y: -8,
                  scale: 1.02,
                  transition: { duration: 0.3, ease: "easeOut" }
                }}
                className="bg-gradient-to-br from-[#C7B299] to-[#b89968] rounded-[28px] shadow-lg overflow-hidden hover:shadow-2xl hover:shadow-brand-blue/20 transition-all duration-500"
              >
                <div className="p-8 h-full flex flex-col">
                  <motion.div
                    className="flex items-center gap-3 mb-4"
                    initial={{ scale: 0.8, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + idx * 0.1 }}
                  >
                    {solution.icon}
                  </motion.div>
                  <motion.h3
                    className="text-xl font-bold text-white mb-2"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + idx * 0.1 }}
                  >
                    {solution.title}
                  </motion.h3>
                  <motion.p
                    className="text-white/90 text-sm mb-6 flex-grow"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 + idx * 0.1 }}
                  >
                    {solution.description}
                  </motion.p>
                  <motion.ul
                    className="space-y-2"
                    variants={{
                      hidden: { opacity: 0 },
                      visible: {
                        opacity: 1,
                        transition: {
                          staggerChildren: 0.05,
                          delayChildren: 0.5 + idx * 0.1,
                        },
                      },
                    }}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                  >
                    {solution.details.map((detail, didx) => (
                      <motion.li
                        key={didx}
                        variants={{
                          hidden: { opacity: 0, x: -10 },
                          visible: { opacity: 1, x: 0 }
                        }}
                        className="text-white text-sm flex items-start gap-2"
                      >
                        <motion.div
                          whileHover={{ scale: 1.2, color: "#00314B" }}
                          transition={{ duration: 0.2 }}
                        >
                          <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        </motion.div>
                        {detail}
                      </motion.li>
                    ))}
                  </motion.ul>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <motion.section
          id="pourqui"
          className="mb-16 bg-slate-50 dark:bg-slate-950 rounded-[28px] shadow-xl p-10"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className="text-center mb-10">
            <div className="inline-flex items-center rounded-full dark:bg-brand-beige bg-brand-beige/10 text-brand-blue px-4 py-2 text-sm font-semibold uppercase tracking-[0.22em]">
              Pour qui ?
            </div>
            {/* <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mt-4">
              Pour Qui ?
            </h2> */}
            <div className="mx-auto mt-3 h-1.5 w-24 rounded-full dark:bg-brand-beige bg-brand-blue" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {targetAudience.map((audience, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200 dark:border-slate-700 shadow-sm shadow-slate-200/40 dark:shadow-none p-6 hover:shadow-xl transition-all duration-300 text-center"
              >
                <div className="text-5xl mb-4">{audience.icon}</div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
                  {audience.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-300 text-sm">
                  {audience.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <motion.section
          id="valeurajoutee"
          className="mb-16 bg-slate-50 dark:bg-slate-950 rounded-[28px] shadow-xl p-10"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className="max-w-3xl mx-auto text-center mb-10">
            <div className="inline-flex items-center rounded-full bg-brand-beige/10  dark:bg-brand-beige text-brand-blue px-4 py-2 text-sm font-semibold uppercase tracking-[0.22em]">
              Notre valeur ajoutée
            </div>
            {/* <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mt-4">
              Notre Valeur Ajoutée
            </h2> */}
            <div className="mx-auto mt-3 h-1.5 w-24 rounded-full  dark:bg-brand-beige bg-brand-blue" />
          </div>
          <div className="space-y-6">
            {advantages.map((advantage, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200 dark:border-slate-700 shadow-sm shadow-slate-200/40 dark:shadow-none p-6 flex items-start gap-4"
              >
                <Lightbulb className="w-6 h-6 text-[#C7B299] flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                    {advantage.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300">
                    {advantage.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <motion.section 
          className="bg-gradient-to-r from-[#C7B299] to-[#b89968] rounded-[28px] shadow-xl p-10 md:p-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          viewport={{ once: true, amount: 0.2 }}
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
              className="inline-flex items-center justify-center gap-2 bg-brand-blue text-white hover:bg-brand-blue/90 font-bold py-4 px-8 rounded-full transition-all duration-300 group/btn text-lg"
            >
              Prendre Rendez-vous
              <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
            </Link>
          </div>
        </motion.section>
      </div>
    </div>
  );
}

