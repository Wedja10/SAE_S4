<?php
require 'cnx.php';
require_once 'sendmail.php';
require 'back_function.php';

if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['register'])) {
    $email = filter_var($_POST['email'], FILTER_VALIDATE_EMAIL);
    $password = $_POST['password'];
    $confirm_password = $_POST['confirm_password'];

    if (!$email) {
        header("Location: ../register.php?error=email_invalid");
        exit();
    }
    if (!isValidPassword($password)) {
        header("Location: ../register.php?error=weak_password&email=" . $email . "");
        exit();
    }
    if ($password !== $confirm_password) {
        header("Location: ../register.php?error=password_mismatch");
        exit();
    }

    $securedPassword = securePassword($password);
    $token = generateToken();
    $expiration = date("Y-m-d H:i:s", strtotime("+10 minutes"));

    $stmt = $pdo->prepare("INSERT INTO users (email, password, token, token_expiration, is_verified) VALUES (:email, :password, :token, :expiration, 0)");
    $stmt->bindParam(':email', $email);
    $stmt->bindParam(':password', $securedPassword);
    $stmt->bindParam(':token', $token);
    $stmt->bindParam(':expiration', $expiration);

    if ($stmt->execute()) {
        $verificationLink = "http://localhost/form/verify.php?token=$token";
        $subject = 'Vérification de votre compte';
        $body = "Cliquez sur ce lien pour valider votre compte: <a href='$verificationLink'>$verificationLink</a>";
        sendmail($email, $subject, $body);
        header("Location: ../index.php?success=verification_email_sent");
        exit();
    } else {
        header("Location: ../register.php?error=registration_failed");
        exit();
    }
}
