"use client";

import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { useToast } from "../../components/ui/use-toast";
import { useState } from "react";
import { Mail, MapPin, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { API_ENDPOINTS } from "../../config/api";
import { Helmet } from "react-helmet";

export default function ContactPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
    phone: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(API_ENDPOINTS.CONTACT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: "Message envoyé!",
          description: "Nous vous répondrons dans les plus brefs délais.",
        });
        setFormData({
          name: "",
          email: "",
          message: "",
          phone: "",
        });
      } else {
        toast({
          title: "Erreur",
          description: "Une erreur est survenue lors de l'envoi du message.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'envoi du message.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Contact - BAI Consulting et Formation</title>
        <meta name="description" content="Contactez BAI Formation Consulting pour vos besoins en formation professionnelle. Banque, assurance, immobilier. Devis gratuit et accompagnement personnalisé." />
        <meta name="keywords" content="contact, formation, banque, assurance, immobilier, devis, accompagnement" />
        <meta property="og:title" content="Contact - BAI Consulting et Formation" />
        <meta property="og:description" content="Contactez BAI Formation Consulting pour vos besoins en formation professionnelle." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://bai-consultingetformation.com/contact" />
        <link rel="canonical" href="https://bai-consultingetformation.com/contact" />
      </Helmet>
      
      <div className="min-h-screen bg-background text-foreground dark:bg-dark-bg-primary dark:text-dark-text-primary transition-colors duration-200">

      <div className="py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
              <h1 className="text-5xl font-extrabold text-[#00314B] dark:text-dark-accent mb-4 font-sans">Contactez-nous</h1>
              <p className="mt-4 text-lg text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
                Vous avez des questions sur nos formations ? N'hésitez pas à nous contacter, notre équipe vous répondra dans les plus brefs délais.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 mb-12">
              <section id="info" className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow p-6 border-t-4 border-[#00314B] dark:border-dark-accent">
                <h2 className="text-xl font-bold text-[#C7B299] dark:text-dark-accent mb-2">Demande d'information</h2>
                <p className="text-gray-900 dark:text-gray-200">Pour toute question sur nos offres, nos formations ou nos services, envoyez-nous votre demande d'information. Nous vous répondrons rapidement.</p>
            </section>
              <section id="rdv" className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow p-6 border-t-4 border-[#00314B] dark:border-dark-accent">
                <h2 className="text-xl font-bold text-[#C7B299] dark:text-dark-accent mb-2">Prendre rendez-vous</h2>
                <p className="text-gray-900 dark:text-gray-200">Vous souhaitez échanger avec un conseiller ? Précisez vos disponibilités et nous organiserons un rendez-vous selon vos besoins.</p>
            </section>
              <section id="devis" className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow p-6 border-t-4 border-[#00314B] dark:border-dark-accent">
                <h2 className="text-xl font-bold text-[#C7B299] dark:text-dark-accent mb-2">Devis personnalisé</h2>
                <p className="text-gray-900 dark:text-gray-200">Obtenez un devis sur mesure pour une prestation de formation ou de consulting adaptée à votre structure.</p>
            </section>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
              <Card className="bg-white dark:bg-dark-bg-secondary dark:border-dark-accent">
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Votre nom"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Votre email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="Votre numéro de téléphone (optionnel)"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      name="message"
                      placeholder="Votre message"
                      value={formData.message}
                      onChange={handleChange}
                      rows={6}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Envoi en cours..." : "Envoyer le message"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-8">
                {/* <div>
                  <h2 className="text-2xl font-bold text-brand-blue dark:text-dark-accent mb-4">
                  Informations de contact
                </h2>
                <div className="space-y-4">
                  <div className="flex items-start">
                      <MapPin className="h-6 w-6 text-brand-blue dark:text-dark-accent mr-4 mt-1" />
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-200">Adresse</h3>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                        12 rue de la Formation, 75001 Paris
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                      <Phone className="h-6 w-6 text-brand-blue dark:text-dark-accent mr-4 mt-1" />
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-200">Téléphone</h3>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">+33 1 23 45 67 89</p>
                  </div>
                    </div>
                  </div>
                </div> */}

              <div>
                  <h2 className="text-2xl font-bold text-brand-blue dark:text-dark-accent mb-4">
                  Horaires d&apos;ouverture
                </h2>
                <div className="space-y-2">
                  <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Lundi - Vendredi</span>
                      <span className="font-semibold">9h00 - 12h00 / 14h00 - 18h00</span>
                  </div>
                  <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Samedi - Dimanche</span>
                    <span className="font-semibold">Fermé</span>
                  </div>
                </div>
              </div>

                <div className="bg-brand-blue dark:bg-dark-accent text-white p-6 rounded-lg">
                  <h2 className="text-xl font-bold mb-4">Besoin d'une formation sur mesure ?</h2>
                <p className="mb-4">
                  Nous proposons des formations adaptées aux besoins spécifiques de votre entreprise.
                </p>
                <Link to="/solutions">
                  <Button variant="secondary" className="w-full">
                    Découvrir nos solutions
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}