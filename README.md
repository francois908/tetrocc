# Tétro.cc — V2 (Vite + Supabase + Vercel)

Site one-page et mini-CMS de sorties cyclistes. L'interface publique est utilisable **immédiatement**, même sans Supabase, avec les trois sorties 2027 de `public/rides.json`. Le CMS nécessite la configuration ci-dessous : les modifications sont persistées dans Supabase et non dans le fichier JSON.

## Développement local

```bash
npm install
npm run dev
```

Pour tester la version compilée : `npm run build` puis `npm run preview`.

## Déployer avec GitHub + Vercel

1. Créer un dépôt GitHub et y envoyer le contenu de ce dossier (les fichiers à la racine du dépôt, pas le dossier parent).
2. Dans Vercel, **Add New > Project**, importer ce dépôt. Framework **Vite** (détection automatique). Build `npm run build`, output `dist`.
3. Pour activer le CMS, créer un projet sur Supabase, ouvrir **SQL Editor** et exécuter `supabase/schema.sql` **une seule fois** sur un projet vierge. Cela crée tables, permissions RLS, bucket photos et trois sorties.
4. Dans Supabase **Authentication > Users**, créer/inviter un utilisateur avec un courriel et mot de passe (confirmer son adresse si requis). Copier son UUID et exécuter dans SQL Editor :
   ```sql
   insert into public.admin_users(user_id) values ('UUID_DU_COMPTE_ADMIN');
   ```
5. Dans Vercel **Project > Settings > Environment Variables**, définir `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` (clé **publishable/anon**, **jamais** `service_role`). Valeurs depuis Supabase **Project Settings > API**. Ajouter les mêmes dans `.env` local si souhaité (voir `.env.example`).
6. Redéployer dans Vercel après l'ajout des variables. Le site public lit alors les sorties depuis Supabase et `/admin` donne accès à la connexion.

## Fonctionnalités

- Accueil : **trois prochaines sorties** publiées (si toutes les dates sont passées, affiche les trois dernières publiées).
- `/sorties/oka-2027`, `/sorties/mascouche-2027`, `/sorties/laval-est-2027` : pages de sortie avec iframe Ride with GPS et lien externe.
- `/admin` : connexion, création, édition, suppression, publication/brouillon/annulation, photos de couverture, galerie et réglages.
- Images : stockage Supabase Storage, bucket `club-photos` (max 8 Mo, JPG/PNG/WebP).
- Les sorties brouillon/annulées ne sont **pas** publiques dans cette version. La date passée est automatiquement retirée des « prochaines sorties ».

## Points à vérifier avant mise en ligne

- **Mascouche et Laval Est partagent actuellement le même parcours RWGPS** `55340222` : valeur reprise exactement de la demande; corriger Laval Est dans l'admin si ce n'est pas volontaire.
- Heure, distance, vitesse et lieu de rencontre sont laissés vides, plutôt que devinés.
- `bonjour@tetro.cc` est une adresse **provisoire**; changer les liens `mailto:` dans `index.html` avant publication.
- La galerie et les réglages sont administrables et stockés dans Supabase; pour le moment la galerie publique affiche les images historiques statiques. Voir section suivante.
- Pour un domaine personnalisé, le configurer dans Vercel > Domains et chez le fournisseur DNS.

## Sécurité

- Le formulaire de connexion utilise Supabase Auth. L'autorisation repose sur la table `admin_users` et des politiques **RLS**, pas sur le masquage du bouton `/admin`.
- Ne jamais publier la clé `service_role`. Les variables `VITE_*` sont exposées au navigateur et doivent être des clés publiques.
- Pour ajouter un administrateur, créer son utilisateur Auth et ajouter son UUID à `admin_users` via SQL Editor.
- Pour la production, personnaliser la configuration des courriels Auth dans Supabase et limiter les inscriptions publiques si nécessaire.

## Changements v2.1

- Photos d'archive recadrées (`archive-velo-v2.jpg`, `archive-duo-v2.jpg`) pour retirer les anciennes dates imprimées dessus. Les originaux avec dates ne sont plus utilisés.
- Galerie publique : affiche trois photos par défaut, remplacées automatiquement par les photos ajoutées dans `/admin`.
- `npm run dev` et `npm run preview` reproduisent maintenant les adresses `/admin` et `/sorties/...` comme sur Vercel.
- Le texte « À propos » de départ dans Supabase reprend celui du site (avant, il le remplaçait par une phrase plus courte).
- Suppression d'une photo : ajout de la permission manquante dans Supabase Storage.
- Recommandé : Supabase > Authentication > Sign In / Providers > désactiver « Allow new users to sign up » une fois le compte admin créé.
