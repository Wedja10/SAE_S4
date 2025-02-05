<?php
require '../back/back_function.php';
session_start();
session_unset();
session_destroy();
?>
<!DOCTYPE html>
<html lang="fr">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Demande de renouvelement de mot de passe</title>
    <link rel="stylesheet" href="../style/style.css">
</head>

<body>
    <div class="container">
        <h2>Réinitialiser le mot de passe</h2>
        <form action="../back/back_require_reset_password.php" method="post">
            <label for="email">Email :</label>
            <input type="email" name="email" id="email" required>

            <button type="submit" name="requiremdp">Réinitialiser le mot de passe</button>
        </form>
        <p><a href="index.php">Retour</a></p>
    </div>

    <div id="modal" class="modal">
        <div class="modal-content">
            <span class="close">&times;</span>
            <p id="modal-message"></p>
        </div>
    </div>

    <script src="../js/modal.js"></script>
</body>

</html>