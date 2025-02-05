<?php
session_start(); 
require 'cnx.php';
require 'back_function.php';

if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['login'])) {
    $email = isset($_POST['email']) ? filter_var($_POST['email'], FILTER_VALIDATE_EMAIL) : false;
    $password = isset($_POST['password']) ? trim($_POST['password']) : '';

    if (!$email || empty($password)) {
        insertLog("Tentative de connexion échouée : Identifiants invalides", "Erreur");
        header("Location: ../login/index.php?error=invalid_credentials");
        exit();
    }

    $stmt = $pdo->prepare("SELECT id, password, is_verified FROM users WHERE email = :email");
    $stmt->bindParam(':email', $email, PDO::PARAM_STR);
    $stmt->execute();
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user && verifyPassword($password, $user['password'])) {
        if ($user['is_verified'] == 0) {
            insertLog("Connexion refusée : Compte non vérifié", "Erreur");
            header("Location: ../login/index.php?error=account_not_verified");
            exit();
        }

        $_SESSION['user_id'] = $user['id'];
        insertLog("Connexion réussie pour l'utilisateur ID : " . $user['id'], "Succès");
        header("Location: ../connect/index.php");
        exit();
    } else {
        insertLog("Tentative de connexion échouée : Mot de passe ou email incorrect", "Erreur");
        header("Location: ../login/index.php?error=invalid_credentials");
        exit();
    }
}
