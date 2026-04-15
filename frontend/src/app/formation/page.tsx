import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, PiggyBank, ShieldCheck, Building2, Users, Target, Briefcase, Sparkles, TrendingUp, Award } from 'lucide-react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';

// Composant pour animation de texte lettre par lettre
const AnimatedText = ({ text, className = "", delay = 0 }) => {
  const letters = Array.from(text);

  const container = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.03, delayChildren: delay * i },
    }),
  };

  const child = {
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100,
      },
    },
    hidden: {
      opacity: 0,
      y: 20,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100,
      },
    },
  };

  return (
    <motion.span
      className={className}
      variants={container}
      initial="hidden"
      animate="visible"
    >
      {letters.map((letter, index) => (
        <motion.span key={index} variants={child}>
          {letter === " " ? "\u00A0" : letter}
        </motion.span>
      ))}
    </motion.span>
  );
};

// Composant pour animation de compteur
const AnimatedCounter = ({ from, to, duration = 2 }) => {
  const [count, setCount] = React.useState(from);

  React.useEffect(() => {
    let startTime;
    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = (currentTime - startTime) / (duration * 1000);

      if (progress < 1) {
        setCount(Math.floor(from + (to - from) * progress));
        requestAnimationFrame(animate);
      } else {
        setCount(to);
      }
    };
    requestAnimationFrame(animate);
  }, [from, to, duration]);

  return <span>{count.toLocaleString()}</span>;
};

// Composant pour particules flottantes
const FloatingParticles = () => {
  const particles = Array.from({ length: 20 }, (_, i) => i);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle}
          className="absolute w-1 h-1 bg-[#C7B299]/20 rounded-full"
          initial={{
            x: Math.random() * window.innerWidth,
            y: window.innerHeight + 100,
            scale: 0,
          }}
          animate={{
            y: -100,
            scale: [0, 1, 0],
            x: Math.random() * window.innerWidth,
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            delay: Math.random() * 5,
          }}
        />
      ))}
    </div>
  );
};

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
      link: '/contact',
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
      link: '/contact',
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">
      {/* HERO Section avec image 4K */}
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
            alt="diplome"
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
              text="Formations Professionnelles"
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
            Développez vos compétences dans la <strong>banque</strong>, <strong>l'assurance</strong> et la <strong>microfinance</strong> avec nos formations sur mesure.
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
                Commencer ma formation
                <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                to="#formations"
                className="inline-flex items-center justify-center gap-2 bg-transparent border-2 border-white/30 hover:border-white text-white font-semibold py-4 px-8 rounded-full transition-all duration-300 backdrop-blur-sm"
              >
                Découvrir nos formations
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>



      <motion.section
        className="py-10 sm:py-16 bg-slate-50 dark:bg-slate-950"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            id="nosformations"
            className="mb-16 space-y-8 text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <div className="inline-flex items-center rounded-full bg-brand-beige/10 text-brand-blue px-4 py-2 text-sm font-semibold uppercase tracking-[0.22em]">
              <Sparkles className="w-4 h-4 mr-2" />
              Nos formations
            </div>
            <AnimatedText
              text="Nos Formations"
              className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white"
              delay={0.2}
            />
            <motion.div
              className="mx-auto mt-3 h-1.5 w-24 rounded-full bg-brand-blue"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
            />
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.1,
                  delayChildren: 0.3,
                },
              },
            }}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {formations.map((formation, index) => (
              <motion.div
                key={formation.id}
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
                className="group rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm shadow-slate-200/40 dark:shadow-none overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-brand-blue/20"
              >
                {/* Image avec overlay animé */}
                <div className="relative h-40 overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <motion.img
                    src={formation.image}
                    alt={formation.title}
                    className="w-full h-full object-cover"
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-t from-brand-blue/60 via-transparent to-transparent"
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                  <motion.div
                    className="absolute top-4 right-4 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
                    whileHover={{
                      scale: 1.1,
                      rotate: 360,
                      backgroundColor: "rgba(255,255,255,0.3)"
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    >
                      {formation.icon}
                    </motion.div>
                  </motion.div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <motion.div
                    className="flex items-center gap-2 mb-3"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                  >
                    <motion.div
                      className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-beige/10 text-brand-blue"
                      whileHover={{
                        scale: 1.1,
                        backgroundColor: "#C7B299",
                        color: "#00314B"
                      }}
                      transition={{ duration: 0.2 }}
                    >
                      {formation.icon}
                    </motion.div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                      {formation.title}
                    </h3>
                  </motion.div>

                  <motion.p
                    className="text-sm text-slate-600 dark:text-slate-300 mb-4"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                  >
                    {formation.description}
                  </motion.p>

                  {/* Topics avec animation stagger */}
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
                      {formation.topics.slice(0, 2).map((topic, idx) => (
                        <motion.li
                          key={idx}
                          variants={{
                            hidden: { opacity: 0, x: -10 },
                            visible: { opacity: 1, x: 0 }
                          }}
                          className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2"
                        >
                          <motion.span
                            className="text-brand-blue mt-0.5"
                            whileHover={{ scale: 1.5, color: "#C7B299" }}
                            transition={{ duration: 0.2 }}
                          >
                            •
                          </motion.span>
                          {topic}
                        </motion.li>
                      ))}
                      {formation.topics.length > 2 && (
                        <motion.li
                          variants={{
                            hidden: { opacity: 0, x: -10 },
                            visible: { opacity: 1, x: 0 }
                          }}
                          className="text-xs text-brand-blue font-medium"
                        >
                          +{formation.topics.length - 2} autre{formation.topics.length - 2 > 1 ? 's' : ''}
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
                        to={formation.link}
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

        {/* POUR QUI ? Section */}
        <motion.section
          id="pourqui"
          className="mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <div className="space-y-8 text-center mb-12">
            <div className="inline-flex items-center rounded-full bg-brand-beige/10 text-brand-blue px-4 py-2 text-sm font-semibold uppercase tracking-[0.22em]">
              Pour Qui ?
            </div>
            {/* <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">
              Pour Qui ?
            </h2> */}
            <div className="mx-auto mt-3 h-1.5 w-24 rounded-full bg-brand-blue" />
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
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
                  {audience.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-300 text-sm">
                  {audience.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* NOTRE OBJECTIF Section */}
        <motion.section 
          id="objectifs"
          className="mb-16 bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200 dark:border-slate-700 shadow-sm shadow-slate-200/40 dark:shadow-none p-10"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className="max-w-3xl mx-auto">
            <div className="flex items-start gap-4">
              <Target className="w-8 h-8 text-[#C7B299] flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-4">
                  Notre Objectif
                </h2>
                <p className="text-lg text-slate-600 dark:text-slate-300 mb-4">
                  <strong>Vous rendre opérationnel et vous connecter aux institutions financières</strong>
                </p>
                <p className="text-slate-600 dark:text-slate-300">
                  Au-delà de la formation, nous misons sur votre succès en créant des ponts avec les plus grandes institutions financières d'Afrique. Nos formations ne se limitent pas à l'apprentissage : elles incluent un accompagnement personnalisé, du coaching commercial et une mise en relation concrète avec nos partenaires recruteurs.
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* OPPORTUNITÉS Section */}
        <motion.section 
          id="opportunites"
          className="bg-gradient-to-r from-[#C7B299] to-[#b89968] rounded-[28px] shadow-xl p-10 md:p-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          viewport={{ once: true, amount: 0.2 }}
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
              className="inline-flex items-center justify-center gap-2 bg-brand-blue text-white hover:bg-brand-blue/90 font-bold py-4 px-8 rounded-full transition-all duration-300 group/btn text-lg"
            >
              Déposer ma candidature
              <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
            </Link>
          </div>
        </motion.section>
      </div>
  );
}
