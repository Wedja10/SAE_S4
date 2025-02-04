<?php
require 'back/back_function.php';
session_start();
session_unset();
session_destroy();
?>
<!DOCTYPE html>
<html lang="fr">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Inscription</title>
    <link rel="stylesheet" href="style/style.css">
</head>

<body>
    <div class="container">
        <h2>Inscription</h2>
        <form action="back/back_register.php" method="POST">
            <label for="email">Email :</label>
            <input type="email" name="email" id="email" value="<?php echo isset($_GET['email']) ? htmlspecialchars($_GET['email']) : ''; ?>" required>

            <label for="password">Mot de passe :</label>
            <input type="password" name="password" id="password" required>

            <label for="confirm_password">Confirmer le mot de passe :</label>
            <input type="password" name="confirm_password" id="confirm_password" required>

            <button type="submit" name="register">S'inscrire</button>
        </form>
        <p>Déjà un compte ? <a href="index.php">Connectez-vous ici</a></p>
    </div>

    <div id="modal" class="modal">
        <div class="modal-content">
            <span class="close">&times;</span>
            <p id="modal-message"></p>
        </div>
    </div>

    <script src="js/modal.js"></script>
</body>

</html>