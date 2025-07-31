import React, { useEffect } from "react";
import { OptimizedImage, OptimizedVideo } from "../../components/OptimizedMedia";
import { Link } from "react-router-dom";

const sousThematiques = [
  {
    id: "iard-part",
    titre: "Univers Particuliers - IARD Part (MRH, Auto, PNO)",
    description: "MRH (Multirisque Habitation), Assurance Auto, PNO (Assurance propriétaire non occupant) : des solutions pour protéger les biens de vos clients particuliers.",
    image: "/images/optimized/pexels-habitation-auto-106399-medium.webp",
    alt: "Habitation et auto"
  },
  {
    id: "prev-part",
    titre: "Univers Particuliers - Prévoyance",
    description: "GOBS (Garantie Obsèques), MAV/GAV/AAV (Assurance des accidents de la vie), Assurance Décès : protégez la famille et l'avenir de vos clients.",
    image: "/images/optimized/family-7257182_1280-medium.webp",
    alt: "Famille et prévoyance"
  },
  {
    id: "iard-pro",
    titre: "Univers Professionnels - IARD Pro",
    description: "MRPRO (Multirisque Professionnelle), Assurance Auto Professionnelle : des solutions adaptées aux besoins des professionnels.",
    image: "/images/presentation.jpg",
    alt: "Entreprise et pro"
  },
  {
    id: "prev-pro",
    titre: "Univers Professionnels - Prévoyance Pro",
    description: "Assurance Homme Clé, Prévoyance PRO+ (IJ + CAPITAL en cas de DCPTIA) : sécurisez l'activité et la pérennité de l'entreprise.",
    image: "/images/cadenas.jpg",
    alt: "Santé et prévoyance pro"
  },
];

export default function AssurancePage() {
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
            className="w-full h-full object-cover object-[center_top] object-top"
            autoPlay
            loop
            muted
            playsInline
          >
            <source src="/videos/assurance.mp4" type="video/mp4" />
            Votre navigateur ne supporte pas la vidéo.
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/10" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
            <h1 className="text-5xl md:text-6xl font-extrabold text-[#C7B299] drop-shadow-lg mb-4">Assurance & Prévoyance</h1>
            <p className="text-2xl md:text-3xl text-white font-medium drop-shadow mb-4 max-w-2xl mx-auto">
              Protégez vos clients et leur avenir grâce à nos solutions de formation.
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
                <OptimizedImage
                  src={sous.image}
                  alt={sous.alt}
                  className="w-[320px] h-[220px] object-cover object-center"
                  width={320}
                  height={220}
                  quality={80}
                  format="webp"
                  lazy={true}
                />
              </div>
            </div>
            <div className="md:w-1/2 w-full flex flex-col justify-center text-left">
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#C7B299] mb-4">{sous.titre}</h2>
              <p className="text-lg md:text-xl text-gray-800 mb-2 leading-relaxed">{sous.description}</p>
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