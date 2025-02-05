<?php
require 'cnx.php';
require_once 'sendmail.php';
require 'back_function.php';
$email = $_POST['email'];
$password = $_POST['password'];
$confirm_password = $_POST['confirm_password'];


$stmt = $pdo->prepare("SELECT id, password FROM users WHERE email = :email");
$stmt->bindParam(':email', $email);
$stmt->execute();
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if ($password !== $confirm_password) {
    header("Location: ../login/resetmdp.php?error=password_mismatch&email=".$email."");
    exit();
}

$hashedPassword = securePassword($newPassword);
$stmt = $pdo->prepare("UPDATE users SET password = :password WHERE id = :id");
$stmt->bindParam(':password', $hashedPassword);
$stmt->bindParam(':id', $user['id']);
$stmt->execute();

insertLog('Réinitialisation de mot de passe', 'Succès');
header("Location: ../login/index.php?success=password_reset");
exit();

?>