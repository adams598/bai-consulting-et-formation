import React from "react";
import { Link } from "react-router-dom";
import { useEffect } from "react";

const sousThematiques = [
  {
    id: "quotidien",
    titre: "Banque au quotidien & PNB",
    description: "Nous vous accompagnons sur la démarche relationnelle et commerciale qui entoure le choix des services bancaires. Découvrez comment guider vos clients dans le choix de leurs services bancaires et augmenter le Produit Net Bancaire grâce à des méthodes éprouvées et des outils adaptés.",
    image: "/images/pexels-banque-210990.jpg",
    alt: "Banque au quotidien",
  },
  {
    id: "activite",
    titre: "Activité choisie vs subie",
    description: "Accompagner les Chargés de Clientèle dans le pilotage de leur activité au quotidien afin d'être efficaces dans la gestion de l'administratif et du temps commercial.",
    image: "https://images.pexels.com/photos/3184298/pexels-photo-3184298.jpeg",
    alt: "Activité choisie",
  },
  {
    id: "epargne",
    titre: "Epargne",
    description: "Optimisez la gestion de l'épargne de vos clients grâce à nos formations spécialisées. Maîtrisez les produits d'épargne et développez une stratégie de conseil personnalisée pour chaque profil client.",
    image: "/images/pexels-finance-164527.jpg",
    alt: "Epargne",
  },
  {
    id: "metiers",
    titre: "Spécificités métiers",
    description: "Conseillers Accueil, Particuliers, Professionnels, Privé, Gestion de Patrimoine : aborder les spécificités propres à chaque métier.",
    image: "/images/pexels-equipe-1181675.jpg",
    alt: "Différents métiers bancaires",
  },
  {
    id: "conquete",
    titre: "Conquête client",
    description: "Prospection (terrain et téléphonique) et recommandation pour booster le développement du portefeuille clients.",
    image: "/images/pexels-presentation-3184465.jpg",
    alt: "Prospection client banque",
  },
  {
    id: "demarche",
    titre: "Démarche commerciale",
    description: "Accompagnement à chaque étape de la démarche commerciale, de la prise de contact à la conclusion de la vente.",
    image: "/images/pexels-reunion-3184292.jpg",
    alt: "Démarche commerciale banque",
  },
  {
    id: "rdv",
    titre: "Rendez-vous téléphonique",
    description: "Intégrer le rendez-vous téléphonique dans l'activité commerciale, posture et émotions à transmettre.",
    image: "/images/pexels-bureau-210647.jpg",
    alt: "Rendez-vous téléphonique banque",
  },
  {
    id: "kyc",
    titre: "KYC (Know Your Customer)",
    description: "Importance de la mise à jour des données clients et des opportunités commerciales associées.",
    image: "/images/pexels-consultation-3183171.jpg",
    alt: "KYC banque",
  },
  {
    id: "digital",
    titre: "Digitalisation",
    description: "Utilisation des services bancaires et d'assurance en self-care, avantages de la digitalisation.",
    image: "/images/pexels-analyse-267614.jpg",
    alt: "Digitalisation banque",
  },
  {
    id: "nps",
    titre: "Satisfaction client (NPS)",
    description: "Impact de la satisfaction client sur le développement du PNB.",
    image: "/images/pexels-planification-3183197.jpg",
    alt: "Satisfaction client banque",
  },
];

export default function BanquePage() {
  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.replace('#', '');
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100); // attendre le rendu
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
            // poster="/images/pexels-banque-7821702.jpg"
          >
            <source src="/videos/banque.mp4" type="video/mp4" />
            Votre navigateur ne supporte pas la vidéo.
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/10" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
            <h1 className="text-5xl md:text-6xl font-extrabold text-[#C7B299] drop-shadow-lg mb-4" >Banque</h1>
            <p className="text-2xl md:text-3xl text-white font-medium drop-shadow mb-4 max-w-2xl mx-auto">
              Découvrez nos solutions de formation adaptées à vos besoins professionnels.
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
                <button className="mt-4 px-6 py-3 rounded-full bg-[#1B5E20] text-white font-bold shadow hover:bg-[#388E3C] transition">Contactez-nous</button>
              </Link>
            </div>
          </section>
        ))}
      </div>
    </main>
  );
} 