<?php

function generateToken($length = 32) {
    return bin2hex(random_bytes($length));
}

function securePassword($password) {
    $salt = bin2hex(random_bytes(16)); 
    $hashedPassword = hash('sha512', $salt . $password);
    return $salt . ':' . $hashedPassword; 
}

function isValidPassword($password) {
    return preg_match('/^(?=.*[0-9])(?=.*[a-z])(?=.*[!@#$%^&*()_+\-=\[\]{};:\\|,.<>\/?]).{12,}$/', $password);
}

function checkLogin() {
    if (!isset($_SESSION['user_id'])) {
        header("Location: ../index.php?error=must_be_logged");
        exit();
    }
}

function verifyPassword($password, $storedPassword) {
    list($salt, $hash) = explode(':', $storedPassword);
    return hash('sha512', $salt . $password) === $hash;
}

function logout() {
    session_unset();
    session_destroy();
    header("Location: ../index.php");
    exit();
}

function getEmailById($userId) {
    global $pdo;
    $stmt = $pdo->prepare("SELECT email FROM users WHERE id = :id");
    $stmt->bindParam(':id', $userId);
    $stmt->execute();
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    return $user ? $user['email'] : NULL;
}

function insertLog($action, $statut) {
    global $pdo;
    $ip = isset($_SERVER['HTTP_CLIENT_IP']) ? $_SERVER['HTTP_CLIENT_IP'] : (isset($_SERVER['HTTP_X_FORWARDED_FOR']) ? explode(',', $_SERVER['HTTP_X_FORWARDED_FOR'])[0] : $_SERVER['REMOTE_ADDR']);
    $email = isset($_SESSION['user_id']) ? getEmailById($_SESSION['user_id']) : NULL;
    
    $stmt = $pdo->prepare("INSERT INTO logs (ip, email, action, statut, created_at) VALUES (:ip, :email, :action, :statut, NOW())");
    $stmt->bindParam(':ip', $ip);
    $stmt->bindParam(':email', $email);
    $stmt->bindParam(':action', $action);
    $stmt->bindParam(':statut', $statut);
    $stmt->execute();
}

?>