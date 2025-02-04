<?php
require '../back/cnx.php';
require '../back/back_function.php';
session_start();

checkLogin();

?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard</title>
    <link rel="stylesheet" href="../style/main.css">
</head>
<body>
    <div class="container">
        <h2>Bienvenue sur votre tableau de bord</h2>
        <p>Connecté en tant que : <strong><?php echo getEmailById($_SESSION['user_id']); ?></strong></p>
        <a href="../back/logout.php" class="btn">Se déconnecter</a>
    </div>
</body>
</html>
