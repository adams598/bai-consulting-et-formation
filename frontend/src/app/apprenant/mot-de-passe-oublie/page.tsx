"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/providers/auth-provider";
import { Link } from 'react-router-dom';
import { useState } from "react";

export default function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await requestPasswordReset(email);
      toast({
        title: "Email envoyé",
        description:
          "Si un compte existe avec cet email, vous recevrez un lien pour réinitialiser votre mot de passe.",
      });
      setEmail("");
    } catch (error) {
      toast({
        title: "Erreur",
        description:
          "Une erreur est survenue lors de l'envoi de l'email. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground dark:bg-dark-bg-primary dark:text-dark-text-primary transition-colors duration-200">
      <header className="bg-brand-blue text-white dark:bg-dark-accent dark:text-white py-4">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <Link to="/" className="flex items-center">
              <span className="text-2xl font-bold">BAI</span>
              <span className="ml-2 text-brand-beige dark:text-dark-bg-primary text-xl">Formation Consulting</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white dark:bg-dark-bg-secondary dark:border-dark-accent">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Mot de passe oublié</CardTitle>
            <CardDescription>
              Entrez votre adresse email pour recevoir un lien de réinitialisation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Envoi en cours..." : "Envoyer le lien"}
              </Button>
            </form>
          </CardContent>
          <CardFooter>
            <Link to="/admin/login" className="text-sm text-brand-blue dark:text-dark-accent hover:underline w-full text-center">
              Retour à la connexion
            </Link>
          </CardFooter>
        </Card>
      </main>

      <footer className="py-6 bg-gray-200 dark:bg-dark-bg-secondary">
        <div className="container mx-auto px-4 text-center text-gray-600 dark:text-gray-400 text-sm">
          <p>&copy; {new Date().getFullYear()} BAI Formation Consulting. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}