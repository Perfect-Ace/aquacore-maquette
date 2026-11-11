# AquaCore — maquette UX/UI (affichage uniquement)

Projet séparé de l'application AquaCore. Pas de base de données, pas de vraie connexion :
données d'exemple uniquement. Ces notes sont complétées au fur et à mesure des demandes du propriétaire.

**Objectif principal : la visualisation.** Aujourd'hui le propriétaire travaille avec de simples tableaux
(type Excel). La maquette doit montrer tout le processus de façon visuelle, bien plus parlante qu'un tableau.

## Le processus métier à visualiser

1. **Achat au port → bon (commande).** L'administrateur achète la marchandise au port et crée un **bon**
   (ex. : 5 kg de produit A, 50 kg de produit B, 20 kg de produit C).
2. **Chargement du camion.** Sur place, la marchandise du bon X est chargée dans le **camion** d'un chauffeur.
3. **Le chauffeur est aussi le vendeur (chauffeur-vendeur).** Il part avec le camion vers un marché,
   par exemple le **marché de Marrakech**.
4. **Vente sur place pendant plusieurs jours.** Il reste sur le marché **3 à 4 jours** et vend la marchandise.
5. **Déclarations du chauffeur-vendeur :**
   - ce qu'il a **vendu** ;
   - les **pertes** : un poisson qui a plus de 3 jours est perdu. Le chauffeur le **prend en photo**,
     le déclare en perte, puis il est jeté.

## 1. Espace administrateur

### 1.1 Connexion → tableau de bord
- L'administrateur se connecte et arrive directement sur le **tableau de bord**.
- Le tableau de bord est **très simple** et **très visuel**.

### 1.2 Ce que le tableau de bord doit montrer
- **Créer un bon** (achat au port) : produits + quantités.
- Les **bons créés**.
- **Le suivi des camions** : en route, arrivé ou pas, sur quel marché.
- Le **parcours complet** d'un bon : port → camion → route → marché → ventes et pertes.

### 1.3 Argent : tout doit être visible
- Pour chaque bon : **prix d'achat** au port, **coût du transport**, **pertes** (en kg et en DH),
  **ventes** et **gain / bénéfice** final.
- Exemple de lecture : « Bon acheté X DH, transport Y DH, pertes Z DH, vendu W DH → bénéfice B DH ».

### 1.4 Analyse des données (vue finale)
- Une vue d'analyse sur **tous les bons** : combien est entré (achats), combien est sorti (ventes),
  pertes, transport, **bénéfice**.
- Par **jour**, par **semaine** et par **année**.

## 2. Espace chauffeur-vendeur (téléphone) — maquette

- **Très, très simple** : les chauffeurs ne sont pas à l'aise avec la technologie.
- Peu d'écrans, très gros boutons, presque que du **vert / rouge** :
  - **Arrivé / pas encore arrivé** au marché.
- **Déclarations** très simples :
  - **Pertes** : il prend le poisson perdu **en photo** et le déclare.
  - **Ventes / gain** : il déclare ce qu'il a vendu (montant).

## Ce qui est construit (version 1 de la maquette, 11/11/2026)

Lancer : `npm run dev` dans ce dossier → http://localhost:5180 ; version en ligne : https://perfect-ace.github.io/aquacore-maquette/.
Données d'exemple : un an de bons générés + la situation « en direct » du jour. Les changements restent dans le
navigateur ; « Réinitialiser la démo » repart de zéro.

- **Connexion** (factice) → tableau de bord.
- **Tableau de bord** : chiffres du jour (achats, ventes, pertes, camions actifs), alertes (poisson au jour 3,
  camion en chargement), **carte des routes** port d'Agadir → marchés avec les camions en direct, fiche de chaque
  camion (étapes port → route → marché → terminé, barre vendu / perdu / dans le camion), derniers bons.
- **Nouveau bon** : produits + kg + prix, chauffeur-vendeur, marché, transport ; **répartition sur 2 ou 3 camions**.
- **Fiche d'un bon** : bénéfice, « où est passé l'argent » (ventes − achat du vendu − pertes − transport),
  devenir de chaque produit, par camion : étapes, chronologie, photos des pertes.
- **Analyse** : jour / semaine / année ; achats, ventes, pertes, transport, bénéfice, marge ; graphiques ;
  ventes par produit (taux de perte), bénéfice par chauffeur.
  - **Par ville** : une carte par marché (bénéfice, nombre de tournées, marge, pertes en % et kg, meilleur produit,
    produit le plus perdu), classées du meilleur au moins bon ; **grille produits × villes** colorée au choix par
    bénéfice, pertes (%) ou ventes ; toucher une case montre le détail, toucher une ville l'affiche seule.
- **Écran chauffeur** (téléphone) : gros bouton rouge « Pas encore arrivé » → vert « Arrivé » ; gros boutons
  **Vente** (poisson → kg → montant, avec alerte si le prix au kg semble faux) et **Perte** (photo → poisson → kg) ;
  ce qui reste dans le camion ; « Tournée terminée ».

Règles de calcul : bénéfice = ventes − coût d'achat des kg vendus − coût des kg perdus − transport. Les kg encore
dans le camion ne comptent pas encore. Jour de marché = jour calendaire (jour 1 = jour d'arrivée) ; à partir du
jour 3 avec du stock restant, le camion est « à surveiller ».

## Bons et camions
- Un bon peut être **réparti sur plusieurs camions** (ex. gros achat partagé entre 2 camions).
  Chaque camion porte sa part du bon (produits + kg) et suit son propre parcours.
