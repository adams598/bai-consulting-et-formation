import "../index.css";
import { Toaster } from "../components/ui/toaster";
import { AuthProvider } from "../providers/auth-provider";
import Navbar from "../components/Navbar";
import { Suspense, lazy } from "react";

// Lazy loading des composants non critiques
const LazyToaster = lazy(() => import("../components/ui/toaster").then(module => ({ default: module.Toaster })));

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <AuthProvider>
        {children}
        <Suspense fallback={null}>
          <LazyToaster />
        </Suspense>
      </AuthProvider>
    </>
  );
}