"use client";

import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { useToast } from "../../components/ui/use-toast";
import { useState } from "react";
import { Mail, MapPin, Phone, Clock, ArrowRight, Sparkles } from "lucide-react";
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
import { Link } from "react-router-dom";
import { API_ENDPOINTS } from "../../config/api";
import { Helmet } from "react-helmet";
// import { motion } from "framer-motion";

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
      
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-200">
        <div className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              className="text-center mb-16"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              viewport={{ once: true, amount: 0.2 }}
            >
              <div className="inline-flex items-center rounded-full bg-brand-beige/10  dark:bg-brand-beige text-brand-blue px-4 py-2 text-sm font-semibold uppercase tracking-[0.22em]">
                <Sparkles className="w-4 h-4 mr-2" />
                Nous contacter
              </div>

              <motion.div
                className="mx-auto mt-3 h-1.5 w-24 rounded-full  dark:bg-brand-beige bg-brand-blue"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
              />
              <motion.p
                className="mt-6 text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.7, ease: "easeOut" }}
              >
                Vous avez des questions sur nos formations ? N'hésitez pas à nous contacter, notre équipe vous répondra dans les plus brefs délais.
              </motion.p>
            </motion.div>

            <motion.section 
              className="mb-16 bg-slate-50 dark:bg-slate-950 rounded-[28px] shadow-xl p-10"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              viewport={{ once: true, amount: 0.2 }}
            >
              <div className="mb-12">
                <div className="text-center mb-10">
                  <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-brand-beige mb-4">
                    Comment pouvons-nous vous aider ?
                  </h2>
                  <p className="text-slate-600 dark:text-slate-300">
                    Sélectionnez le type de demande qui correspond le mieux à vos besoins
                  </p>
                </div>
                <motion.div
                  className="grid md:grid-cols-3 gap-6"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: {
                      opacity: 1,
                      transition: {
                        staggerChildren: 0.15,
                        delayChildren: 0.3,
                      },
                    },
                  }}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.2 }}
                >
                  <motion.div
                    id="info"
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
                        },
                      },
                    }}
                    whileHover={{
                      y: -8,
                      scale: 1.02,
                      transition: { duration: 0.3, ease: "easeOut" }
                    }}
                    className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200 dark:border-slate-700 shadow-sm shadow-slate-200/40 dark:shadow-none p-6 hover:shadow-2xl hover:shadow-brand-blue/20 transition-all duration-500"
                  >
                    <motion.div
                      className="flex items-center justify-center w-12 h-12 bg-[#C7B299]/10 rounded-full mb-3"
                      whileHover={{ scale: 1.1, backgroundColor: "#C7B299" }}
                      transition={{ duration: 0.2 }}
                    >
                      <Mail className="w-6 h-6 text-[#C7B299]" />
                    </motion.div>
                    <motion.h3
                      className="text-lg font-bold text-slate-900 dark:text-white mb-2"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2 }}
                    >
                      Demande d'information
                    </motion.h3>
                    <motion.p
                      className="text-sm text-slate-600 dark:text-slate-300"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 }}
                    >
                      Pour toute question sur nos offres, nos formations ou nos services.
                    </motion.p>
                  </motion.div>

                  <motion.div
                    id="rdv"
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
                          delay: 0.1,
                        },
                      },
                    }}
                    whileHover={{
                      y: -8,
                      scale: 1.02,
                      transition: { duration: 0.3, ease: "easeOut" }
                    }}
                    className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200 dark:border-slate-700 shadow-sm shadow-slate-200/40 dark:shadow-none p-6 hover:shadow-2xl hover:shadow-brand-blue/20 transition-all duration-500"
                  >
                    <motion.div
                      className="flex items-center justify-center w-12 h-12 bg-[#C7B299]/10 rounded-full mb-3"
                      whileHover={{ scale: 1.1, backgroundColor: "#C7B299" }}
                      transition={{ duration: 0.2 }}
                    >
                      <Clock className="w-6 h-6 text-[#C7B299]" />
                    </motion.div>
                    <motion.h3
                      className="text-lg font-bold text-slate-900 dark:text-white mb-2"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2 }}
                    >
                      Prendre rendez-vous
                    </motion.h3>
                    <motion.p
                      className="text-sm text-slate-600 dark:text-slate-300"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 }}
                    >
                      Échanger avec un conseiller selon vos disponibilités.
                    </motion.p>
                  </motion.div>

                  <motion.div
                    id="devis"
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
                          delay: 0.2,
                        },
                      },
                    }}
                    whileHover={{
                      y: -8,
                      scale: 1.02,
                      transition: { duration: 0.3, ease: "easeOut" }
                    }}
                    className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200 dark:border-slate-700 shadow-sm shadow-slate-200/40 dark:shadow-none p-6 hover:shadow-2xl hover:shadow-brand-blue/20 transition-all duration-500"
                  >
                    <motion.div
                      className="flex items-center justify-center w-12 h-12 bg-[#C7B299]/10 rounded-full mb-3"
                      whileHover={{ scale: 1.1, backgroundColor: "#C7B299" }}
                      transition={{ duration: 0.2 }}
                    >
                      <Mail className="w-6 h-6 text-[#C7B299]" />
                    </motion.div>
                    <motion.h3
                      className="text-lg font-bold text-slate-900 dark:text-white mb-2"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2 }}
                    >
                      Devis personnalisé
                    </motion.h3>
                    <motion.p
                      className="text-sm text-slate-600 dark:text-slate-300"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 }}
                    >
                      Un devis sur mesure adapté à votre structure.
                    </motion.p>
                  </motion.div>
                </motion.div>
              </div>
            </motion.section>
          </div>

            <div className="grid md:grid-cols-2 gap-12 mb-16">
              <motion.section 
                className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200 dark:border-slate-700 shadow-sm shadow-slate-200/40 dark:shadow-none p-8"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                viewport={{ once: true, amount: 0.2 }}
              >
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                  Envoyez-nous un message
                </h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-slate-700 dark:text-slate-300">Nom</Label>
                    <Input
                      id="name"
                      name="name"
                      className="dark:text-gray-900 dark:bg-white rounded-lg"
                      placeholder="Votre nom"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-700 dark:text-slate-300">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      className="dark:text-gray-900 dark:bg-white rounded-lg"
                      type="email"
                      placeholder="Votre email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-slate-700 dark:text-slate-300">Téléphone</Label>
                    <Input
                      id="phone"
                      name="phone"
                      className="dark:text-gray-900 dark:bg-white rounded-lg"
                      type="tel"
                      placeholder="Votre numéro de téléphone (optionnel)"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-slate-700 dark:text-slate-300">Message</Label>
                    <Textarea
                      id="message"
                      name="message"
                      className="dark:text-gray-900 dark:bg-white rounded-lg"
                      placeholder="Votre message"
                      value={formData.message}
                      onChange={handleChange}
                      rows={5}
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-brand-blue hover:bg-brand-blue/90 text-white font-semibold py-2 rounded-full transition-all duration-300" 
                    disabled={loading}
                  >
                    {loading ? "Envoi en cours..." : "Envoyer le message"}
                  </Button>
                </form>
              </motion.section>

              <motion.section 
                className="space-y-6"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                viewport={{ once: true, amount: 0.2 }}
              >
                <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200 dark:border-slate-700 shadow-sm shadow-slate-200/40 dark:shadow-none p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <Clock className="w-6 h-6 text-[#C7B299]" />
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                      Horaires d'ouverture
                    </h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
                      <span className="text-slate-600 dark:text-slate-300">Lundi - Vendredi</span>
                      <span className="font-semibold text-slate-900 dark:text-white">9h00 - 18h00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-300">Samedi - Dimanche</span>
                      <span className="font-semibold text-slate-900 dark:text-white">Fermé</span>
                    </div>
                  </div>
                </div>

                <motion.div 
                  className="bg-gradient-to-r from-[#C7B299] to-[#b89968] rounded-[28px] shadow-xl p-8 text-white"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
                  viewport={{ once: true }}
                >
                  <h3 className="text-2xl font-bold mb-3">
                    Besoin d'une formation sur mesure ?
                  </h3>
                  <p className="text-white/90 mb-6">
                    Nous proposons des formations adaptées aux besoins spécifiques de votre entreprise.
                  </p>
                  {/* <Link to="/formation" className="inline-flex items-center justify-center gap-2 bg-brand-blue hover:bg-brand-blue/90 text-white font-semibold py-3 px-6 rounded-full transition-all duration-300 group/btn">
                    Découvrir nos formations
                    <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                  </Link> */}
                </motion.div>
              </motion.section>
            </div>
            
        </div>
      </div>
      </>
  );
}