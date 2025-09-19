import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../providers/auth-provider';
import { useToast } from '../components/ui/use-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await login(email, password);
      toast({
        title: "Connexion réussie",
        description: "Bienvenue dans votre espace !",
      });
    } catch (err: any) {
      toast({
        title: "Erreur de connexion",
        description: err.message || "Email ou mot de passe incorrect",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-100 relative">
      {/* Image de fond BAI */}
      {/* <img
        src="/images/optimized/BAI-4.webp"
        alt="BAI background"
        className="absolute inset-0 mx-20 my-24 w-auto h-90 max-w-[600px] max-h-[80vh] left-0 right-0 top-0 bottom-0 z-0"
        style={{ opacity: 1.0 }}
      /> */}
      {/* Overlay pour lisibilité */}
      <div className="absolute inset-0 bg-white/60 z-10" />
      <main className="flex-1 flex items-center justify-center p-4 relative z-20">
        <div className="w-full max-w-md bg-white rounded-lg shadow-md">
          <div className="p-6 space-y-6">
            <div className="space-y-2 text-center">
              <h1 className="text-2xl font-bold text-gray-900">BAI Consulting Formation</h1>
              <p className="text-gray-600">
                Connectez-vous à votre espace personnel.
              </p>
            </div>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                  placeholder="votre@email.com"
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Mot de passe
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-brand-blue text-white py-2 px-4 rounded-md hover:bg-brand-blue/90 transition-colors disabled:opacity-60"
                disabled={loading}
              >
                {loading ? 'Connexion...' : 'Se connecter'}
              </button>
            </form>
            <div className="space-y-4">
              <Link
                to="/apprenant/mot-de-passe-oublie"
                className="block text-center text-sm text-brand-blue hover:underline"
              >
                Mot de passe oublié?
              </Link>
              <p className="text-center text-sm text-gray-600">
                Vous n'avez pas de compte? Contactez votre administrateur pour obtenir un accès.
              </p>
            </div>
          </div>
        </div>
      </main>
      <footer className="py-6 bg-gray-200 relative z-20">
        <div className="container mx-auto px-4 text-center text-gray-600 text-sm">
          <p>&copy; {new Date().getFullYear()} BAI Formation Consulting. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}