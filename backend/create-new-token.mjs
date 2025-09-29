import jwt from "jsonwebtoken";

// Récupérer l'ID de l'utilisateur admin actuel
const ADMIN_USER_ID = "cmfz6h1ss0000wxin8jlkyn9f"; // ID de l'admin créé
const JWT_SECRET = "dev-secret-key-123";

// Créer un nouveau token JWT
const token = jwt.sign(
  {
    userId: ADMIN_USER_ID,
    role: "SUPER_ADMIN",
  },
  JWT_SECRET,
  { expiresIn: "24h" }
);

console.log("🔑 Nouveau token JWT créé:");
console.log(`Token: ${token}`);
console.log(`\n📋 Pour tester l'API calendrier:`);
console.log(
  `curl -X GET "http://localhost:3000/api/calendar-integration/google/auth-url" -H "Authorization: Bearer ${token}"`
);
