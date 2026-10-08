/* =====================================================
   META NFT — PASSWORD SYSTEM UI
   Secure Change Password + OTP
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        console.log(
            "Meta NFT Password System UI loaded."
        );


        /* =================================================
           ELEMENTS
        ================================================= */

        const emailInput =
            document.getElementById(
                "passwordSystemEmail"
            );

        const otpInput =
            document.getElementById(
                "passwordSystemOtp"
            );

        const getOtpButton =
            document.getElementById(
                "passwordSystemGetOtp"
            );

        const newPasswordInput =
            document.getElementById(
                "passwordSystemNewPassword"
            );

        const confirmPasswordInput =
            document.getElementById(
                "passwordSystemConfirmPassword"
            );

        const submitButton =
            document.getElementById(
                "passwordSystemSubmit"
            );

        const form =
            document.getElementById(
                "changePasswordForm"
            );

        const message =
            document.getElementById(
                "passwordSystemMessage"
            );


        /* =================================================
           MESSAGE HELPER
        ================================================= */

        function showMessage(
            text,
            type = "info"
        ) {

            if (!message) {
                return;
            }

            message.textContent =
                text;

            message.className =
                "password-system-message " +
                "password-system-message-" +
                type;

        }


        /* =================================================
           LOAD REGISTERED EMAIL
        ================================================= */

        async function loadRegisteredEmail() {

            try {

                const response =
                    await fetch(
                        "/api/password/change-password/email",
                        {
                            method: "GET",
                            credentials: "include"
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok || !data.success) {

                    showMessage(
                        data.message ||
                        "Unable to load registered email.",
                        "error"
                    );

                    return;

                }


                if (emailInput) {

                    emailInput.value =
                        data.email || "";

                }


            } catch (error) {

                console.error(
                    "PASSWORD EMAIL LOAD ERROR:",
                    error
                );


                showMessage(
                    "Unable to load registered email.",
                    "error"
                );

            }

        }


        /* =================================================
           GET OTP
        ================================================= */

        if (getOtpButton) {

            getOtpButton.addEventListener(
                "click",
                async () => {

                    try {

                        getOtpButton.disabled =
                            true;

                        getOtpButton.textContent =
                            "SENDING...";


                        showMessage(
                            "Sending verification code...",
                            "info"
                        );


                        const response =
                            await fetch(
                                "/api/password/change-password/request-otp",
                                {
                                    method: "POST",
                                    credentials: "include"
                                }
                            );


                        const data =
                            await response.json();


                        if (!response.ok || !data.success) {

                            showMessage(
                                data.message ||
                                "Unable to send verification code.",
                                "error"
                            );

                            getOtpButton.disabled =
                                false;

                            getOtpButton.textContent =
                                "GET OTP";

                            return;

                        }


                        if (
                            emailInput &&
                            data.email
                        ) {

                            emailInput.value =
                                data.email;

                        }


                        showMessage(
                            "Verification code sent to your registered email.",
                            "success"
                        );


                        let seconds = 60;


                        getOtpButton.textContent =
                            `RESEND IN ${seconds}s`;


                        const timer =
                            setInterval(
                                () => {

                                    seconds--;

                                    if (
                                        seconds <= 0
                                    ) {

                                        clearInterval(
                                            timer
                                        );

                                        getOtpButton.disabled =
                                            false;

                                        getOtpButton.textContent =
                                            "GET OTP";

                                        return;

                                    }


                                    getOtpButton.textContent =
                                        `RESEND IN ${seconds}s`;

                                },
                                1000
                            );


                    } catch (error) {

                        console.error(
                            "PASSWORD OTP ERROR:",
                            error
                        );


                        showMessage(
                            "Unable to send verification code.",
                            "error"
                        );


                        getOtpButton.disabled =
                            false;

                        getOtpButton.textContent =
                            "GET OTP";

                    }

                }
            );

        }


        /* =================================================
           PASSWORD VISIBILITY
        ================================================= */

        document
            .querySelectorAll(
                "[data-password-toggle]"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            const targetId =
                                button.getAttribute(
                                    "data-password-toggle"
                                );


                            const input =
                                document.getElementById(
                                    targetId
                                );


                            if (!input) {
                                return;
                            }


                            if (
                                input.type ===
                                "password"
                            ) {

                                input.type =
                                    "text";

                                button.textContent =
                                    "🙈";

                            } else {

                                input.type =
                                    "password";

                                button.textContent =
                                    "👁";

                            }

                        }
                    );

                }
            );


        /* =================================================
           PASSWORD STRENGTH
        ================================================= */

        const strengthBars =
            document.querySelectorAll(
                ".password-system-strength span"
            );

        const strengthText =
            document.getElementById(
                "passwordSystemStrengthText"
            );


        if (newPasswordInput) {

            newPasswordInput.addEventListener(
                "input",
                () => {

                    const password =
                        newPasswordInput.value;


                    let score = 0;


                    if (password.length >= 8) {
                        score++;
                    }

                    if (/[A-Z]/.test(password)) {
                        score++;
                    }

                    if (/[a-z]/.test(password)) {
                        score++;
                    }

                    if (/[0-9]/.test(password)) {
                        score++;
                    }


                    strengthBars.forEach(
                        (bar, index) => {

                            bar.classList.toggle(
                                "active",
                                index < score
                            );

                        }
                    );


                    if (!password) {

                        strengthText.textContent =
                            "Enter a strong password";

                    } else if (score <= 1) {

                        strengthText.textContent =
                            "Weak password";

                    } else if (score === 2) {

                        strengthText.textContent =
                            "Fair password";

                    } else if (score === 3) {

                        strengthText.textContent =
                            "Good password";

                    } else {

                        strengthText.textContent =
                            "Strong password";

                    }

                }
            );

        }


        /* =================================================
           CHANGE PASSWORD
        ================================================= */

        if (form) {

            form.addEventListener(
                "submit",
                async event => {

                    event.preventDefault();


                    const otp =
                        otpInput
                            ? otpInput.value.trim()
                            : "";


                    const newPassword =
                        newPasswordInput
                            ? newPasswordInput.value
                            : "";


                    const confirmPassword =
                        confirmPasswordInput
                            ? confirmPasswordInput.value
                            : "";


                    if (!/^\d{6}$/.test(otp)) {

                        showMessage(
                            "Please enter the 6-digit verification code.",
                            "error"
                        );

                        return;

                    }


                    if (!newPassword) {

                        showMessage(
                            "Please enter a new password.",
                            "error"
                        );

                        return;

                    }


                    if (
                        newPassword !==
                        confirmPassword
                    ) {

                        showMessage(
                            "New password and confirm password do not match.",
                            "error"
                        );

                        return;

                    }


                    try {

                        submitButton.disabled =
                            true;

                        submitButton.textContent =
                            "CHANGING...";


                        showMessage(
                            "Changing your password...",
                            "info"
                        );


                        const response =
                            await fetch(
                                "/api/password/change-password/confirm",
                                {
                                    method: "POST",
                                    credentials: "include",
                                    headers: {
                                        "Content-Type":
                                            "application/json"
                                    },
                                    body:
                                        JSON.stringify({
                                            otp,
                                            newPassword,
                                            confirmPassword
                                        })
                                }
                            );


                        const data =
                            await response.json();


                        if (
                            !response.ok ||
                            !data.success
                        ) {

                            showMessage(
                                data.message ||
                                "Unable to change password.",
                                "error"
                            );

                            submitButton.disabled =
                                false;

                            submitButton.textContent =
                                "CHANGE PASSWORD";

                            return;

                        }


                        showMessage(
                            "Password changed successfully.",
                            "success"
                        );


                        if (otpInput) {
                            otpInput.value = "";
                        }

                        if (newPasswordInput) {
                            newPasswordInput.value = "";
                        }

                        if (confirmPasswordInput) {
                            confirmPasswordInput.value = "";
                        }


                        strengthBars.forEach(
                            bar => {
                                bar.classList.remove(
                                    "active"
                                );
                            }
                        );


                        if (strengthText) {

                            strengthText.textContent =
                                "Enter a strong password";

                        }


                        submitButton.disabled =
                            false;

                        submitButton.textContent =
                            "CHANGE PASSWORD";


                    } catch (error) {

                        console.error(
                            "PASSWORD CHANGE ERROR:",
                            error
                        );


                        showMessage(
                            "Unable to change password.",
                            "error"
                        );


                        submitButton.disabled =
                            false;

                        submitButton.textContent =
                            "CHANGE PASSWORD";

                    }

                }
            );

        }


        /* =================================================
           INITIAL LOAD
        ================================================= */

        loadRegisteredEmail();

    }
);