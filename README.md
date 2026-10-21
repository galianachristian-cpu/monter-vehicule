# Montée en véhicule — CS Cruzy / Quarante

**Adresse de l’application :** https://galianachristian-cpu.github.io/monter-vehicule/

Application de contrôle des engins à la prise de garde (« la montée en véhicule »).
Chaque pompier se connecte avec son nom, choisit l'engin, scanne le compteur et signale les soucis.

- **Compteur** : lecture automatique des chiffres par l'appareil photo (corrigeable à la main), photo jointe.
- **Niveaux** : gasoil, eau, AdBlue, additif (jauge 1 à 6, « plein fait »).
- **Essais** : transmissions, gyro / 2 tons, pneus, pompe, ARI, oxygène, DSA… selon le type d'engin.
- **Armement** : inventaire facultatif selon les FAT SDIS 34 2026 (VSAV, FPT, VSRTU, CCF, CCFU, CCGC, FMOGP).
- **Défauts** : gravité mineur / majeur / indisponible, photos, suivi jusqu'à « réglé ».
- **Hors ligne** : les montées restent sur le téléphone et partent dès que le réseau revient.
- **QR codes des pochettes** : chaque engin a son lien direct (`…/#engin=vsav-215`). Les étiquettes à imprimer (6 × 9 cm, avec le personnage du centre) sont générées par l'appli. Les anciens QR codes (formulaires Google) restent reconnus par le scanner de l'appli une fois associés à leur engin.
- **VSAV** : suivi du protocole hygiène n°2 (désinfection complète hebdomadaire).
- **Responsable** (code) : engins, heure de relève, QR code d'activation des téléphones, étiquettes, export CSV.

## Stockage

Les données sont des fichiers dans un **dépôt GitHub privé** dédié (aucun autre service) :

```
config.json                                   réglages du centre (engins, relève, code)
controles/AAAA/MM/<date>_<engin>_<statut>_<compteur>_<pompier>.json
anomalies/ouvertes/<engin>_<date>_<n>_<gravité>.json
anomalies/resolues/…
photos/AAAA/MM/….jpg
hygiene/<engin>_<date>.json                   protocole hygiène n°2 (VSAV)
assets/personnage-….jpg                       image des étiquettes
```

## Mise en service (une seule fois)

1. Créer le dépôt **privé** `monter-vehicule-data` (cocher « Add a README »).
2. Créer un jeton : GitHub → Settings → Developer settings → Personal access tokens → **Fine-grained tokens** → Generate
   - Repository access : *Only select repositories* → `monter-vehicule-data`
   - Permissions : **Contents → Read and write** (rien d'autre)
   - Expiration : 1 an (à renouveler)
3. Ouvrir l'appli → « Configuration manuelle » → coller le jeton → *Relier ce téléphone*.
4. Réglages → Espace responsable → choisir un code → **Activer un téléphone** : afficher le QR code aux pompiers.

Si le lien d'activation circule hors du centre : révoquer le jeton sur GitHub, en créer un nouveau, réactiver les téléphones.

Fichiers : `index.html` (l'appli), `fat.js` (fiches armement type), `sw.js` (hors ligne), `manifest.webmanifest` + icônes (installation sur l'écran d'accueil).
