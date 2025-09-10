const path = require('path');
const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const saltRounds = 10;

// --- 1. Récupérer le nouveau mot de passe depuis la ligne de commande ---
const newPassword = process.argv[2];

if (!newPassword) {
    console.error("\x1b[31m%s\x1b[0m", "ERREUR : Vous devez fournir un nouveau mot de passe.");
    console.log("Usage : node reset-owner-password.js <nouveau_mot_de_passe>");
    process.exit(1); // Arrête le script avec un code d'erreur
}

// --- 2. Définir le chemin vers la base de données ---
// Assurez-vous que ce chemin est correct par rapport à l'emplacement du script
const dbPath = path.join(process.cwd(), 'database', 'main.db');
let db;

try {
    // --- 3. Se connecter à la base de données ---
    db = new Database(dbPath);
    console.log("Connecté à la base de données avec succès.");

    // --- 4. Hasher le nouveau mot de passe ---
    console.log("Hashage du nouveau mot de passe...");
    const newPasswordHash = bcrypt.hashSync(newPassword, saltRounds);

    // --- 5. Mettre à jour le mot de passe dans la base de données ---
    // On cible l'utilisateur qui a le rôle 'Propriétaire'. C'est plus robuste que de cibler le nom d'utilisateur.
    const stmt = db.prepare("UPDATE users SET password_hash = ? WHERE role = 'Propriétaire'");
    const info = stmt.run(newPasswordHash);

    if (info.changes > 0) {
        console.log("\x1b[32m%s\x1b[0m", `SUCCÈS : Le mot de passe pour ${info.changes} compte(s) Propriétaire a été réinitialisé.`);
        console.log("Le propriétaire peut maintenant se connecter avec le nouveau mot de passe.");
    } else {
        console.warn("\x1b[33m%s\x1b[0m", "AVERTISSEMENT : Aucun compte avec le rôle 'Propriétaire' n'a été trouvé. Aucune modification n'a été effectuée.");
    }

} catch (error) {
    console.error("\x1b[31m%s\x1b[0m", "UNE ERREUR EST SURVENUE :");
    console.error(error.message);
} finally {
    // --- 6. Fermer la connexion à la base de données ---
    if (db) {
        db.close();
        console.log("Connexion à la base de données fermée.");
    }
}