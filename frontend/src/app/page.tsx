import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Presentation, BookOpen, Home, TrendingUp, Mail } from "lucide-react";
import { OptimizedImage } from "../components/OptimizedMedia";
import { Helmet } from "react-helmet";
import { OrganizationJsonLd } from "../components/JsonLd";

export default function HomePage() {
  return (
    <>
      <Helmet>
        {/* Balises meta SEO */}
        <title>BAI Consulting et Formation - Formations professionnelles Banque, Assurance, Immobilier</title>
        <meta name="description" content="BAI Formation Consulting - Des formations professionnelles d'excellence pour les secteurs de la banque, de l'assurance et de l'immobilier. +200 professionnels accompagnés, 98% de satisfaction." />
        <meta name="keywords" content="formation, banque, assurance, immobilier, consulting, professionnel, formation continue, expertise, accompagnement" />
        <meta name="author" content="BAI Formation Consulting" />
        <meta name="robots" content="index, follow" />
        
        {/* Open Graph pour les réseaux sociaux */}
        <meta property="og:title" content="BAI Consulting et Formation - Formations professionnelles" />
        <meta property="og:description" content="Formations professionnelles d'excellence pour les secteurs de la banque, de l'assurance et de l'immobilier. +200 professionnels accompagnés." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://bai-consultingetformation.com" />
        <meta property="og:image" content="https://bai-consultingetformation.com/images/BAI-3.png" />
        <meta property="og:site_name" content="BAI Formation Consulting" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="BAI Consulting et Formation" />
        <meta name="twitter:description" content="Formations professionnelles d'excellence pour les secteurs de la banque, de l'assurance et de l'immobilier." />
        <meta name="twitter:image" content="https://bai-consultingetformation.com/images/BAI-3.png" />
        
        {/* Balises supplémentaires */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="canonical" href="https://bai-consultingetformation.com" />
      </Helmet>
      
      <OrganizationJsonLd
        name="BAI Formation Consulting"
        url="https://bai-consultingetformation.com"
        logo="https://bai-consultingetformation.com/images/BAI-3.png"
        description="Formations professionnelles d'excellence pour les secteurs de la banque, de l'assurance et de l'immobilier"
        address={{
          streetAddress: "12 rue de la Formation",
          addressLocality: "Paris",
          postalCode: "75001",
          addressCountry: "FR"
        }}
        contactPoint={{
          telephone: "+33 1 23 45 67 89",
          contactType: "customer service"
        }}
      />
      
      <div className="flex flex-col min-h-screen bg-[#F8F8F8]">
        <main className="flex-1">
          {/* Hero Section */}
          <section className="relative bg-[#00314B] text-white py-28 rounded-b-3xl shadow-2xl mb-16">
            <div className="container mx-auto flex flex-col md:flex-row items-center gap-16 px-6">
              <div className="flex-1 space-y-10">
                <h1 className="text-6xl md:text-7xl font-extrabold leading-tight tracking-wide mb-4">
                  <span className="bg-[#1B5E20] px-4 py-2 rounded-xl">FORMATION & CONSULTING</span>
                </h1>
                <p className="text-2xl md:text-3xl text-[#C7B299] mb-4 font-semibold" style={{lineHeight: '1.4', letterSpacing: '0.03em'}}>Comprenez notre offre en moins de 5 secondes&nbsp;: <span className="text-white">accompagnement, expertise, résultats.</span></p>
                <p className="text-xl md:text-2xl text-white mb-8">+200 professionnels accompagnés – 98% de satisfaction</p>
                <div className="flex flex-col sm:flex-row gap-6">
                  <Link to="/apprenant/inscription">
                    <Button className="rounded-full px-8 py-4 text-lg font-bold shadow-lg bg-[#1B5E20] hover:bg-[#388E3C]">Découvrir nos formations</Button>
                  </Link>
                  <Link to="/contact">
                    <Button variant="outline" className="rounded-full px-8 py-4 text-lg font-bold border-white text-white hover:bg-white hover:text-[#00314B] shadow-lg">Nous contacter</Button>
                  </Link>
                </div>
              </div>
              <div className="flex-1 flex justify-center">
                <div className="relative w-full max-w-md">
                  <OptimizedImage 
                    src="/images/optimized/pexels-consulting-5905445-medium.webp" 
                    alt="BAI Formation Consulting" 
                    className="rounded-3xl shadow-2xl w-full object-cover"
                    width={400}
                    height={300}
                    quality={85}
                    format="webp"
                    lazy={false}
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-3xl">
                    <Button variant="outline" className="border-white text-white hover:bg-white hover:text-[#00314B] rounded-full px-6 py-3 font-bold">
                      <Presentation className="mr-2 h-5 w-5" />
                      Voir la présentation
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Domaines d'expertise */}
          <section className="container mx-auto py-20 space-y-12">
            <h2 className="text-4xl font-extrabold text-[#00314B] text-center mb-12">Nos domaines d'expertise</h2>
            <div className="grid md:grid-cols-3 gap-10">
              {/* Carte Banque */}
              <div className="group bg-white rounded-3xl shadow-2xl p-8 flex flex-col items-center transition-all hover:scale-105 hover:shadow-3xl">
                <OptimizedImage 
                  src="/images/optimized/pexels-banque-7821702-medium.webp" 
                  alt="Banque" 
                  className="w-32 h-32 object-cover rounded-2xl mb-6 shadow-lg group-hover:scale-110 transition-transform"
                  width={128}
                  height={128}
                  quality={80}
                  format="webp"
                  lazy={true}
                />
                <h3 className="text-2xl font-bold text-[#00314B] mb-4">Banque</h3>
                <p className="text-lg text-gray-700 text-center mb-6">Formations en conformité bancaire, gestion de patrimoine, crédit et financement.</p>
                <Link to="/banque">
                  <Button className="rounded-full px-6 py-3 w-full font-bold bg-[#C7B299] hover:bg-[#bfa77a]">En savoir plus</Button>
                </Link>
                <Link to="/contact">
                  <Button variant="outline" className="rounded-full px-6 py-3 w-full font-bold border-[#00314B] text-[#00314B] hover:bg-[#1B5E20] hover:text-white mt-2">Contactez-nous</Button>
                </Link>
              </div>
              {/* Carte Assurance */}
              <div className="group bg-white rounded-3xl shadow-2xl p-8 flex flex-col items-center transition-all hover:scale-105 hover:shadow-3xl">
                <OptimizedImage 
                  src="/images/optimized/pexels-assurance-7821701-medium.webp" 
                  alt="Assurance et prévoyance" 
                  className="w-32 h-32 object-cover rounded-2xl mb-6 shadow-lg group-hover:scale-110 transition-transform"
                  width={128}
                  height={128}
                  quality={80}
                  format="webp"
                  lazy={true}
                />
                <h3 className="text-2xl font-bold text-[#00314B] mb-4">Assurance & Prévoyance</h3>
                <p className="text-lg text-gray-700 text-center mb-6">Formations en assurance vie, prévoyance, gestion des risques et sinistres.</p>
                <Link to="/assurance">
                  <Button className="rounded-full px-6 py-3 w-full font-bold bg-[#C7B299] hover:bg-[#bfa77a]">En savoir plus</Button>
                </Link>
                <Link to="/contact">
                  <Button variant="outline" className="rounded-full px-6 py-3 w-full font-bold border-[#00314B] text-[#00314B] hover:bg-[#1B5E20] hover:text-white mt-2">Contactez-nous</Button>
                </Link>
              </div>
              {/* Carte Immobilier */}
              <div className="group bg-white rounded-3xl shadow-2xl p-8 flex flex-col items-center transition-all hover:scale-105 hover:shadow-3xl">
                <OptimizedImage 
                  src="/images/optimized/pexels-immobilier-7578986-medium.webp" 
                  alt="Immobilier" 
                  className="w-32 h-32 object-cover rounded-2xl mb-6 shadow-lg group-hover:scale-110 transition-transform"
                  width={128}
                  height={128}
                  quality={80}
                  format="webp"
                  lazy={true}
                />
                <h3 className="text-2xl font-bold text-[#00314B] mb-4">Immobilier</h3>
                <p className="text-lg text-gray-700 text-center mb-6">Formations en transaction immobilière, gestion locative et expertise immobilière.</p>
                <Link to="/immobilier">
                  <Button className="rounded-full px-6 py-3 w-full font-bold bg-[#C7B299] hover:bg-[#bfa77a]">En savoir plus</Button>
                </Link>
                <Link to="/contact">
                  <Button variant="outline" className="rounded-full px-6 py-3 w-full font-bold border-[#00314B] text-[#00314B] hover:bg-[#1B5E20] hover:text-white mt-2">Contactez-nous</Button>
                </Link>
              </div>
            </div>
          </section>

          {/* À propos */}
          <section className="py-20">
            <div className="container mx-auto flex flex-col md:flex-row items-center gap-16 px-6">
              <div className="flex-1 flex justify-center">
                <OptimizedImage 
                  src="/images/optimized/pexels-presentation-3184465-medium.webp" 
                  alt="À propos de BAI Consulting" 
                  className="rounded-3xl shadow-2xl w-full max-w-md object-cover"
                  width={400}
                  height={300}
                  quality={85}
                  format="webp"
                  lazy={true}
                />
              </div>
              <div className="flex-1 space-y-8">
                <h2 className="text-4xl font-extrabold text-[#00314B] mb-4">À propos de BAI Consulting</h2>
                <p className="text-xl text-gray-700">Fondée par des experts des secteurs de la banque, de l'assurance et de l'immobilier, BAI Consulting met son expertise au service de votre développement professionnel.</p>
                <p className="text-xl text-gray-700">Nous proposons des formations adaptées aux besoins des professionnels et des entreprises, avec une approche pratique et opérationnelle.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start gap-4">
                    <BookOpen className="h-8 w-8 text-[#00314B]" />
                    <div>
                      <h3 className="text-lg font-bold text-[#00314B]">Formations adaptées</h3>
                      <p className="text-gray-600">Des parcours sur mesure selon vos besoins.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <TrendingUp className="h-8 w-8 text-[#00314B]" />
                    <div>
                      <h3 className="text-lg font-bold text-[#00314B]">Suivi personnalisé</h3>
                      <p className="text-gray-600">Un accompagnement tout au long de votre parcours.</p>
                    </div>
                  </div>
                </div>
                <Link to="/solutions">
                  <Button className="rounded-full px-8 py-4 text-lg font-bold shadow-lg bg-[#C7B299] hover:bg-[#bfa77a]">Découvrir nos solutions</Button>
                </Link>
                <Link to="/contact">
                  <Button variant="outline" className="rounded-full px-8 py-4 text-lg font-bold border-[#00314B] text-[#00314B] hover:bg-[#1B5E20] hover:text-white mt-4">Contactez-nous</Button>
                </Link>
              </div>
            </div>
          </section>

          {/* Contact CTA */}
          <section className="py-20 bg-[#C7B299] text-[#00314B] rounded-3xl shadow-2xl mx-4 md:mx-0">
            <div className="container mx-auto text-center">
              <h2 className="text-4xl font-extrabold mb-6">Prêt à faire évoluer votre carrière&nbsp;?</h2>
              <p className="text-2xl max-w-2xl mx-auto mb-10">
                Contactez-nous dès aujourd'hui pour découvrir comment nos formations peuvent vous aider à atteindre vos objectifs professionnels.
              </p>
              <Link to="/contact">
                <Button className="rounded-full px-8 py-4 text-lg font-bold bg-[#00314B] text-white hover:bg-[#00263a] shadow-lg">
                  <Mail className="mr-2 h-5 w-5" />
                  Nous contacter
                </Button>
              </Link>
            </div>
          </section>
        </main>

        <footer className="bg-[#00314B] text-white py-16 mt-20 rounded-t-3xl shadow-2xl">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-4 gap-12">
              <div>
                <div className="flex items-center mb-4">
                  <span className="text-2xl font-extrabold">BAI</span>
                  <span className="ml-2 text-[#C7B299] text-xl font-bold">Formation Consulting</span>
                </div>
                <p className="text-gray-300 mb-4">
                  Des formations professionnelles pour les secteurs de la banque, de l'assurance et de l'immobilier.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4 text-[#C7B299]">Formations</h3>
                <ul className="space-y-2">
                  <li>
                    <Link to="/banque" className="text-gray-300 hover:text-white transition-colors">Banque</Link>
                  </li>
                  <li>
                    <Link to="/assurance" className="text-gray-300 hover:text-white transition-colors">Assurance & Prévoyance</Link>
                  </li>
                  <li>
                    <Link to="/immobilier" className="text-gray-300 hover:text-white transition-colors">Immobilier</Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4 text-[#C7B299]">Liens utiles</h3>
                <ul className="space-y-2">
                  <li>
                    <Link to="/solutions" className="text-gray-300 hover:text-white transition-colors">Nos solutions</Link>
                  </li>
                  <li>
                    <Link to="/contact" className="text-gray-300 hover:text-white transition-colors">Contact</Link>
                  </li>
                  <li>
                    <Link to="/mentions-legales" className="text-gray-300 hover:text-white transition-colors">Mentions légales</Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4 text-[#C7B299]">Contact</h3>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-center">
                    <Home className="h-5 w-5 mr-2" />
                    12 rue de la Formation, 75001 Paris
                  </li>
                  <li className="flex items-center">
                    <Mail className="h-5 w-5 mr-2" />
                    contact@bai-consulting.com
                  </li>
                </ul>
              </div>
            </div>
            <div className="border-t border-[#C7B299]/30 mt-12 pt-8 text-center text-gray-400">
              <p>&copy; {new Date().getFullYear()} BAI Formation Consulting. Tous droits réservés.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}