# AquaCore · maquette

Maquette cliquable (UX/UI) d'AquaCore, la gestion d'un grossiste en poisson frais à Agadir :
du **bon d'achat au port** jusqu'à la **vente au marché**, avec le suivi des camions, des pertes et du bénéfice.

**Voir la démo : https://perfect-ace.github.io/aquacore-maquette/**

> Démonstration uniquement : toutes les données sont des exemples, rien n'est enregistré sur un serveur.
> Ce que vous saisissez reste dans votre navigateur ; « Réinitialiser la démo » repart de zéro.

## Écrans

- **Tableau de bord** : chiffres du jour, alertes, carte des camions en direct du port d'Agadir vers les marchés,
  suivi de chaque camion (port → route → marché → terminé, vendu / perdu / dans le camion).
- **Nouveau bon** : marchandise achetée au port, chauffeur-vendeur, marché, transport, répartition sur plusieurs camions.
- **Fiche d'un bon** : où est passé l'argent (ventes − achat − pertes − transport = bénéfice), chronologie, photos des pertes.
- **Analyse** : jour / semaine / année, et **par ville** : bénéfice, pertes et meilleurs produits de chaque marché.
- **Écran chauffeur** (téléphone) : gros boutons rouge / vert « Arrivé », déclaration des ventes et des pertes avec photo.

## Lancer en local

```bash
npm install
npm run dev
```

Puis ouvrir http://localhost:5180.

React · Vite · Tailwind CSS · lucide-react. Les notes de conception (en français) sont dans [NOTES.md](NOTES.md).
