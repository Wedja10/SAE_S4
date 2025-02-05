<?php
session_start();
require '../back/cnx.php';

if (isset($_GET['token'])) {
    $token = $_GET['token'];
    
    $stmt = $pdo->prepare("SELECT id, token_expiration FROM users WHERE token = :token AND is_verified = 0");
    $stmt->bindParam(':token', $token);
    $stmt->execute();
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($user) {
        if (strtotime($user['token_expiration']) > time()) {
            $updateStmt = $pdo->prepare("UPDATE users SET is_verified = 1, token = NULL, token_expiration = NULL WHERE id = :id");
            $updateStmt->bindParam(':id', $user['id']);
            $updateStmt->execute();
            
            echo "<html><head><title>Vérification réussie</title><link rel='stylesheet' href='style/verify.css'></head><body>";
            echo "<h2>Votre compte a été vérifié avec succès !</h2>";
            echo "<p><a href='index.php'>Cliquez ici pour vous connecter</a></p>";
            echo "</body></html>";
            exit();
        } else {
            echo "<html><head><title>Token expiré</title><link rel='stylesheet' href='style/verify.css'></head><body>";
            echo "<h2>Le lien de vérification a expiré.</h2>";
            echo "<p><a href='register.php'>Cliquez ici pour recommencer l'inscription</a></p>";
            echo "</body></html>";
            exit();
        }
    } else {
        echo "<html><head><title>Token invalide</title><link rel='stylesheet' href='style/verify.css'></head><body>";
        echo "<h2>Le lien de vérification est invalide.</h2>";
        echo "<p><a href='register.php'>Cliquez ici pour recommencer l'inscription</a></p>";
        echo "</body></html>";
        exit();
    }
} else {
    echo "<html><head><title>Token manquant</title><link rel='stylesheet' href='style/verify.css'></head><body>";
    echo "<h2>Aucun token fourni.</h2>";
    echo "<p><a href='register.php'>Cliquez ici pour recommencer l'inscription</a></p>";
    echo "</body></html>";
    exit();
}
?>
