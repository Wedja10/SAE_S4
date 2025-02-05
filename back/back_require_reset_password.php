<?php
require 'cnx.php';
require_once 'sendmail.php';
require 'back_function.php';

if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['requiremdp'])) {
    $email = filter_var($_POST['email'], FILTER_VALIDATE_EMAIL);

    $verificationLink = "http://localhost/form/resetmdp.php?email=$email";
    $subject = 'Réinitialiser le mot de passe';
    $body = "Cliquez sur ce lien pour réinitialiser le mot de passe de votre compte: <a href='$verificationLink'>$verificationLink</a>";
    sendmail($email, $subject, $body);
    header("Location: ../login/index.php?success=require");
    exit();
}
