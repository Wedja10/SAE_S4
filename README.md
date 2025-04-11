# SAE_S4 - WikiGame

## Description
Ce projet est un jeu de course à travers Wikipedia où les joueurs peuvent, interagir entre eux, et utiliser divers artefacts pour trouver les articles à travers Wikipedia.

## Prérequis
- Node.js
- NPM
- Une connexion à MongoDB

## Installation

### 1. Cloner le dépôt
```bash
git clone https://github.com/Wedja10/SAE_S4
cd SAE_S4
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Configuration de l'environnement
Le projet utilise un fichier `.env`. Voici les champs à remplir :
```
MONGODB_URI = Votre URI de connexion à MongoDB
WS_PORT = 4000
```

## Lancement du projet

Pour démarrer le projet, vous devez lancer deux processus :

### 1. Le serveur backend
Ouvrez un terminal et exécutez :
```bash
node ./src/backend/js/server.js
```
Le serveur WebSocket démarrera sur le port 4000 (configuré dans le fichier `.env`).

### 2. Le serveur de développement frontend
Dans un autre terminal, exécutez :
```bash
npm run dev
```

Le jeu sera accessible à l'adresse indiquée dans la console, généralement `http://localhost:5173`.

## Fonctionnalités principales

- Création de lobbies pour jouer avec des amis
- Mode multijoueur avec chat en temps réel
- Divers artefacts et pouvoirs à utiliser pendant le jeu
- Challenges quotidiens sur l'appli mobile
- Paramètres de jeu personnalisables

## Structure du projet

- `/src/backend` : Code du serveur Node.js et API
- `/src/componnents` : Composants React pour l'interface utilisateur
- `/src/services` : Services pour la gestion des connexions WebSocket
- `/src/style` : Fichiers CSS pour le style de l'application
- `/src/view` : Composants de vue principaux de l'application

## Dépannage

### Problèmes courants
- Si le serveur backend ne démarre pas, vérifiez que vous pouvez accéder à MongoDB Atlas ou que votre instance MongoDB locale est en cours d'exécution
- Si vous rencontrez des problèmes de connexion WebSocket, assurez-vous que le port 4000 est disponible (ou modifiez la valeur WS_PORT dans le fichier `.env`)

### Logs
- Les logs du serveur fournissent des informations détaillées sur les connexions et les événements du jeu
- Vérifiez la console du navigateur pour les erreurs côté client

---

Développé dans le cadre du projet BUT Info SAE S4.
