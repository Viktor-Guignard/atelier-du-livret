# Déploiement — récupération auto du panier par Stripe (Netlify, gratuit sans CB)

Deux fonctions serveur, hébergées gratuitement sur Netlify (pas de Firebase Blaze, pas de carte bancaire requise) :

- **`create-checkout`** — bouton « Générer le lien de paiement » dans l'admin. Lit la commande dans Firestore, reconstruit le panier exact (un livret = une ligne) et crée une session Stripe Checkout.
- **`stripe-webhook`** — appelée par Stripe dès qu'un client paie. Marque la commande payée, crée la facture et l'envoie au client automatiquement.

Le reste du site (GitHub Pages, `livretsdemesse.fr`) ne change pas — Netlify n'héberge ici que ces deux petites fonctions.

## 1. Créer un compte Netlify (gratuit, aucune CB demandée)

[app.netlify.com/signup](https://app.netlify.com/signup) — connecte-toi avec ton compte GitHub, ça évite un mot de passe de plus.

## 2. Connecter le dépôt

**Add a new site → Import an existing project → GitHub** → choisis `Viktor-Guignard/atelier-du-livret`.

Netlify détecte automatiquement `netlify.toml` à la racine (base `netlify/`, functions dans `netlify/functions/`). Laisse les réglages par défaut → **Deploy site**.

Une fois déployé, Netlify te donne une URL du style `https://un-nom-aleatoire.netlify.app`. Va dans **Site settings → Change site name** pour la renommer, par exemple `livretsdemesse-stripe` (donnant `https://livretsdemesse-stripe.netlify.app`).

⚠️ **Si tu choisis un autre nom**, préviens-moi (ou modifie toi-même la constante `NETLIFY_FUNCTIONS_URL` en haut de [`js/core/firebase.js`](../js/core/firebase.js)) pour qu'elle corresponde exactement à ton URL.

## 3. Créer la clé de service Firebase (accès à Firestore, gratuit)

Firebase Console → ⚙️ **Paramètres du projet** → **Comptes de service** → **Générer une nouvelle clé privée** → un fichier `.json` se télécharge. **Ne le commite jamais dans le dépôt.**

Encode-le en base64 (dans le Terminal) :

```bash
base64 -i ~/Downloads/livret-de-messe-firebase-adminsdk-*.json | pbcopy
```

Le résultat est maintenant dans ton presse-papiers.

## 4. Récupérer les clés Stripe

Compte Stripe **Imprigraphic** :

- **Développeurs → Clés API → Clé secrète** (`sk_test_…` pour tester d'abord, `sk_live_…` pour le réel)
- **Développeurs → Webhooks → Ajouter un point de terminaison** :
  - URL : `https://<ton-site>.netlify.app/.netlify/functions/stripe-webhook`
  - Événement : `checkout.session.completed`
  - Copie la **clé secrète de signature** (`whsec_…`)

## 5. Variables d'environnement Netlify

**Site settings → Environment variables → Add a variable**, trois variables :

| Nom | Valeur |
|---|---|
| `FIREBASE_SERVICE_ACCOUNT_B64` | le base64 collé à l'étape 3 |
| `STRIPE_SECRET_KEY` | ta clé secrète Stripe |
| `STRIPE_WEBHOOK_SECRET` | le `whsec_…` de l'étape 4 |

Puis **Deploys → Trigger deploy → Deploy site** pour que les fonctions repartent avec ces valeurs.

## 6. Tester avant le réel

Reste en clés **test** Stripe : dans l'admin, ouvre une commande → « Générer le lien de paiement » → paie avec `4242 4242 4242 4242` (date future, CVC quelconque) → vérifie que la commande passe automatiquement à « ✓ Payée » avec une facture, sans avoir touché à « Marquer payée ».

Une fois validé, remplace `STRIPE_SECRET_KEY` et `STRIPE_WEBHOOK_SECRET` par les clés **live** (nouveau webhook à créer en mode production dans Stripe), et redéploie.

## Repli manuel

Le champ « lien de paiement » et le bouton « Marquer payée + envoyer la facture » restent dans l'admin : tant que Netlify n'est pas branché, ou pour un paiement reçu autrement (virement, chèque), le flux manuel fonctionne exactement comme avant.
