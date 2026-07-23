# Déploiement — récupération auto du panier par Stripe

Ce dossier contient deux Cloud Functions Firebase :

- **`createCheckoutSession`** — bouton « Générer le lien de paiement » dans l'admin. Lit la commande dans Firestore, reconstruit le panier exact (un livret = une ligne) et crée une session Stripe Checkout. Plus besoin de taper le montant à la main.
- **`stripeWebhook`** — appelée par Stripe dès qu'un client paie. Marque la commande payée, crée la facture et l'envoie au client automatiquement, sans passer par l'admin.

## 1. Passer Firebase en plan Blaze

Les Cloud Functions qui appellent un service externe (Stripe) demandent le plan **Blaze** (pay‑as‑you‑go). Gratuit tant que le volume reste faible — largement le cas ici.

Firebase Console → ⚙️ Paramètres du projet → Utilisation et facturation → **Modifier le forfait** → Blaze.

## 2. Installer les outils (une seule fois)

```bash
npm install -g firebase-tools
firebase login
```

## 3. Installer les dépendances des fonctions

```bash
cd functions
npm install
```

## 4. Récupérer les clés Stripe

Dans le dashboard Stripe (compte **Imprigraphic**, bascule **Mode production** une fois prêt) :

- **Développeurs → Clés API → Clé secrète** (commence par `sk_live_…`, ou `sk_test_…` pour tester d'abord)
- **Développeurs → Webhooks → Ajouter un point de terminaison** :
  - URL : `https://europe-west1-livret-de-messe.cloudfunctions.net/stripeWebhook` (obtenue après le premier déploiement, voir étape 6)
  - Événement à écouter : `checkout.session.completed`
  - Copier la **Clé secrète de signature** (`whsec_…`)

## 5. Enregistrer les secrets

```bash
firebase functions:secrets:set STRIPE_SECRET_KEY
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
```

(collez la valeur quand demandé — jamais dans le code, jamais commité)

## 6. Déployer

```bash
firebase deploy --only functions
```

La sortie donne l'URL du webhook (`stripeWebhook`) — c'est celle à coller dans Stripe si vous ne l'aviez pas encore (étape 4), puis relancer `firebase deploy --only functions` si vous changez le webhook secret après coup.

## 7. Autoriser EmailJS côté serveur

Le webhook envoie la facture au client via l'API REST d'EmailJS (mêmes identifiants que le site). Par défaut, EmailJS bloque les appels qui ne viennent pas d'un navigateur.

EmailJS → **Account → Security** → désactiver *"Allow non-browser requests"* le bloque, donc **l'activer** (l'inverse de son nom : c'est l'option qui autorise les appels serveur comme celui-ci).

## 8. Tester avant le réel

Restez en clé **test** Stripe (`sk_test_…` / webhook test) : dans l'admin, cliquez « Générer le lien de paiement », payez avec la carte `4242 4242 4242 4242`, et vérifiez que la commande passe automatiquement à « ✓ Payée » avec une facture, sans avoir touché à « Marquer payée ».

Une fois validé, remplacez les deux secrets par les clés **live** et redéployez :

```bash
firebase functions:secrets:set STRIPE_SECRET_KEY
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
firebase deploy --only functions
```

## Repli manuel

Le champ « lien de paiement » et le bouton « Marquer payée + envoyer la facture » restent dans l'admin : si les Functions ne sont pas encore déployées, ou pour un paiement reçu autrement (virement, chèque), le flux manuel fonctionne toujours exactement comme avant.
