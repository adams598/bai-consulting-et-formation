import React, { useEffect } from "react";
import { Link } from "react-router-dom";

const sousThematiques = [
  {
    id: "conference",
    titre: "Conférence",
    description: "Nos conférences sont conçues pour partager notre expertise et nos connaissances avec vos équipes. Animées par des professionnels expérimentés, elles permettent d'aborder des sujets spécifiques et d'échanger sur les meilleures pratiques du secteur.",
    image: "/images/presentation.jpg",
    alt: "Conférence professionnelle",
  },
  {
    id: "consulting",
    titre: "Consulting",
    description: "Notre service de consulting vous accompagne dans l'optimisation de vos processus commerciaux et la mise en place de stratégies efficaces. Nous analysons vos besoins spécifiques et vous proposons des solutions sur mesure pour améliorer vos performances.",
    image: "/images/pexels-reunion-3184292.jpg",
    alt: "Consulting professionnel",
  },
  {
    id: "formations",
    titre: "Formations",
    description: "Nos formations sont conçues pour développer les compétences de vos équipes commerciales. De la banque à l'assurance en passant par l'immobilier, nous proposons des parcours adaptés à chaque métier et niveau d'expérience.",
    image: "/images/pexels-presentation-3184465.jpg",
    alt: "Formation professionnelle",
  },
];

export default function SolutionsPage() {
  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.replace('#', '');
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, []);

  return (
    <main className="pb-16 font-sans">
      {/* Vidéo de couverture avec overlay sombre et texte centré */}
      <section className="relative w-full left-1/2 right-1/2 -mx-[50vw] max-w-none" style={{ position: 'relative', left: '50%', right: '50%', width: '100vw', marginLeft: '-50vw', marginRight: '-50vw' }}>
        <div className="w-full h-80 md:h-[420px] relative flex items-center justify-center">
          <video
            className="w-full h-full object-cover object-center"
            autoPlay
            loop
            muted
            playsInline
          >
            <source src="/videos/solutions.mp4" type="video/mp4" />
            Votre navigateur ne supporte pas la vidéo.
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/10" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
            <h1 className="text-5xl md:text-6xl font-extrabold text-[#C7B299] drop-shadow-lg mb-4">Nos solutions</h1>
            <p className="text-2xl md:text-3xl text-white font-medium drop-shadow mb-4 max-w-2xl mx-auto">
             Des solutions adaptées à vos besoins professionnels
            </p>
            <p className="text-md md:text-lg text-white/90 max-w-3xl mx-auto drop-shadow">
             Formation en e-learning, formation en présentiel, conférence et consulting
            </p>
          </div>
        </div>
      </section>

      {/* Sous-thématiques */}
      <div className="max-w-6xl mx-auto px-4 mt-16 space-y-16">
        {sousThematiques.map((sous, idx) => (
          <section
            key={sous.id}
            id={sous.id}
            className={`flex flex-col md:flex-row ${idx % 2 === 1 ? 'md:flex-row-reverse' : ''} items-center gap-8 bg-white rounded-3xl shadow-xl p-8 md:p-12 transition-all duration-300 hover:shadow-2xl group`}
          >
            <div className="md:w-1/2 w-full flex justify-center items-center mb-6 md:mb-0">
              <div className="overflow-hidden rounded-2xl shadow-lg transition-transform duration-300 group-hover:scale-105 group-hover:shadow-2xl">
                <img
                  src={sous.image}
                  alt={sous.alt}
                  className="w-[320px] h-[220px] object-cover object-center"
                  loading="lazy"
                />
              </div>
            </div>
            <div className="md:w-1/2 w-full flex flex-col justify-center text-left">
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#C7B299] mb-4">{sous.titre}</h2>
              <p className="text-lg md:text-xl text-gray-800 mb-2 leading-relaxed">{sous.description}</p>
              <Link to="/contact">
                <button className="mt-4 px-6 py-3 rounded-full bg-[#1B5E20] text-white font-bold shadow hover:bg-[#388E3C] transition">Demander un devis</button>
              </Link>
            </div>
          </section>
        ))}
      </div>
    </main>
  );
} 