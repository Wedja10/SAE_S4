document.addEventListener("DOMContentLoaded", function () {
    const urlParams = new URLSearchParams(window.location.search);
    const modal = document.getElementById("modal");
    const modalMessage = document.getElementById("modal-message");
    const closeModal = document.querySelector(".close");

    let message = "";
    if (urlParams.has("success")) {
        const successType = urlParams.get("success");
        if (successType === "verification_email_sent") {
            message = "Un email de vérification vous a été envoyé.";
        }
    } else if (urlParams.has("error")) {
        const errorType = urlParams.get("error");
        switch (errorType) {
            case "email_invalid":
                message = "L'email fourni est invalide.";
                break;
            case "password_mismatch":
                message = "Les mots de passe ne correspondent pas.";
                break;
            case "weak_password":
                message = "Le mot de passe ne respecte pas les critères de sécurité.";
                break;
            case "email_send_failed":
                message = "L'envoi de l'email a échoué. Vérifiez votre connexion ou réessayez plus tard.";
                break;
            case "registration_failed":
                message = "L'inscription a échoué, veuillez réessayer.";
                break;
            case "invalid_credentials":
                message = "Identifiants incorrects. Veuillez réessayer.";
                break;
            case "account_not_verified":
                message = "Votre compte n'a pas encore été vérifié. Veuillez consulter votre email.";
                break;
            case "must_be_logged":
                message = "Vous devez être connecter pour accéder à cette page.";
                break;
            case "require":
                message = "Email de récupération envoyé.";
                break;
            case "password_reset":
                message = "Mot de passe réinitialisé.";
                break;
            default:
                message = "Une erreur inconnue s'est produite.";
        }
    }

    if (message !== "") {
        modalMessage.innerText = message;
        modal.style.display = "block";
    }

    closeModal.addEventListener("click", function () {
        modal.style.display = "none";
    });

    window.addEventListener("click", function (event) {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    });
});
