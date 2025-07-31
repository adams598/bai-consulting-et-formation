"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/providers/auth-provider";
import { Link } from 'react-router-dom';
import { useState } from "react";

export default function LoginPage() {
  const { login } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      await login(formData.email, formData.password);
      toast({
        title: "Connexion réussie",
        description: "Vous êtes maintenant connecté à votre espace apprenant.",
      });
    } catch (error) {
      toast({
        title: "Erreur de connexion",
        description:
          "Email ou mot de passe incorrect. Veuillez réessayer.",
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
            <CardTitle className="text-2xl font-bold">Espace apprenant</CardTitle>
            <CardDescription>
              Connectez-vous à votre espace personnel pour accéder à vos formations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="votre@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Connexion en cours..." : "Se connecter"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Link to="/apprenant/mot-de-passe-oublie" className="text-sm text-brand-blue dark:text-dark-accent hover:underline w-full text-center">
              Mot de passe oublié?
            </Link>
            <div className="text-center text-sm text-gray-600 dark:text-gray-400 w-full">
              <p>Vous n'avez pas de compte? Contactez votre administrateur pour obtenir un accès.</p>
            </div>
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