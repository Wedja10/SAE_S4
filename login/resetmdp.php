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
    <title>Réinitialisation de mot de passe</title>
    <link rel="stylesheet" href="../style/style.css">
</head>

<body>
    <div class="container">
        <h2>Réinitialiser le mot de passe</h2>
        <form action="../back/back_reset_password.php" method="post">

            <label for="password">Mot de passe :</label>
            <input type="password" name="password" id="password" required>

            <label for="confirm_password">Confirmer le mot de passe :</label>
            <input type="password" name="confirm_password" id="confirm_password" required>

            <input type="hidden" name="email" id="email" value="<?php echo $_GET['email']; ?>">

            <button type="submit" name="resetmdp">Réinitialiser le mot de passe</button>
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