import React, { useEffect } from "react";
import { Link } from "react-router-dom";

const sousThematiques = [
  {
    id: "location",
    titre: "Location immobilière",
    description: "Accompagnement des clients dans la recherche d'un bien immobilier à la location, avec différentes approches commerciales adaptées.",
    image: "/images/pexels-immobilier-439391.jpg",
    alt: "Location immobilière"
  },
  {
    id: "vente",
    titre: "Vente immobilière",
    description: "Conseil et accompagnement dans la recherche et l'achat d'un bien immobilier, que ce soit pour un primo-accédant ou non, en abordant les spécificités des programmes immobiliers (VEFA).",
    image: "/images/immobilier-cles.png",
    alt: "Vente immobilière"
  },
  {
    id: "hautdegamme",
    titre: "Immobilier Haut de Gamme",
    description: "Un focus particulier sur l'immobilier haut de gamme, nécessitant une démarche commerciale spécifique et personnalisée.",
    image: "/images/pexels-maison-323780.jpg",
    alt: "Immobilier haut de gamme"
  },
];

export default function ImmobilierPage() {
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
    <main className="pb-8 sm:pb-12 lg:pb-16 font-sans overflow-x-hidden w-full">
      {/* Vidéo de couverture avec overlay sombre et texte centré */}
      <section className="w-full max-w-full overflow-hidden">
        <div className="w-full h-56 xs:h-64 sm:h-72 md:h-80 lg:h-96 xl:h-[420px] 2xl:h-[480px] relative flex items-center justify-center">
          <video
            className="w-full h-full object-cover object-center"
            autoPlay
            loop
            muted
            playsInline
          >
            <source src="/videos/immo.mp4" type="video/mp4" />
            Votre navigateur ne supporte pas la vidéo.
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/10" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-2 xs:px-3 sm:px-4 lg:px-6">
            <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-[#C7B299] drop-shadow-lg mb-2 sm:mb-3 lg:mb-4 leading-tight">
              Immobilier
            </h1>
            <p className="text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-white font-medium drop-shadow mb-2 sm:mb-3 lg:mb-4 max-w-[95vw] sm:max-w-sm md:max-w-lg lg:max-w-xl xl:max-w-2xl mx-auto leading-relaxed">
              Maîtrisez la démarche commerciale qui entoure la location ou l'acquisition d'un bien immobilier
            </p>
          </div>
        </div>
      </section>
      {/* Sous-thématiques */}
      <div className="max-w-6xl mx-auto px-2 xs:px-3 sm:px-4 md:px-6 lg:px-8 mt-8 sm:mt-12 md:mt-16 lg:mt-20 space-y-8 sm:space-y-12 md:space-y-16 lg:space-y-20">
        {sousThematiques.map((sous, idx) => (
          <section
            key={sous.id}
            id={sous.id}
            className={`flex flex-col lg:flex-row ${idx % 2 === 1 ? 'lg:flex-row-reverse' : ''} items-center gap-4 sm:gap-6 md:gap-8 lg:gap-10 xl:gap-12 bg-white rounded-2xl sm:rounded-3xl shadow-lg sm:shadow-xl lg:shadow-2xl p-3 xs:p-4 sm:p-6 md:p-8 lg:p-10 xl:p-12 transition-all duration-300 hover:shadow-2xl group w-full max-w-full`}
          >
            <div className="lg:w-1/2 w-full flex justify-center items-center mb-4 sm:mb-6 lg:mb-0">
              <div className="overflow-hidden rounded-xl sm:rounded-2xl shadow-lg transition-transform duration-300 group-hover:scale-105 group-hover:shadow-2xl w-full max-w-[95vw] xs:max-w-[320px] md:max-w-[360px] lg:max-w-[400px] xl:max-w-[450px]">
                <img
                  src={sous.image}
                  alt={sous.alt}
                  className="w-full h-auto aspect-[16/11] object-cover object-center"
                  loading="lazy"
                />
              </div>
            </div>
            <div className="lg:w-1/2 w-full flex flex-col justify-center text-center lg:text-left">
              <h2 className="text-2xl sm:text-3xl md:text-3xl lg:text-4xl font-extrabold text-[#9C7B3E] drop-shadow mt-3 mb-2 sm:mb-3 md:mb-4 leading-tight text-center lg:text-left">
                {sous.titre}
              </h2>
              <p className="text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-gray-800 mb-2 leading-relaxed">
                {sous.description}
              </p>
              <Link to="/contact">
                <button className="mt-4 px-6 py-3 rounded-full bg-[#1B5E20] text-white font-bold shadow hover:bg-[#388E3C] transition">Contactez-nous</button>
              </Link>
            </div>
          </section>
        ))}
      </div>
    </main>
  );
} 