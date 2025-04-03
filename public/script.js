document.addEventListener("DOMContentLoaded", () => {
    const themeStyle = document.getElementById("theme-style");
    const loginForm = document.getElementById("login-form");
    const registerForm = document.getElementById("register-form");
    const formTitle = document.getElementById("form-title");
    const messageBox = document.getElementById("message-box");

    const loginBtn = document.getElementById("login-btn");
    const registerBtn = document.getElementById("register-btn");
    const submitRegisterBtn = document.getElementById("submit-register-btn");
    const cancelRegisterBtn = document.getElementById("cancel-register-btn");
    const themeToggleBtn = document.getElementById("theme-toggle-btn");

    function showMessage(message, type = "error") {
        messageBox.textContent = message;
        messageBox.className = type;
        setTimeout(() => {
            messageBox.textContent = "";
            messageBox.className = "";
        }, 3000);
    }

    if (localStorage.getItem("theme") === "dark") {
        themeStyle.setAttribute("href", "dark-theme.css");
    } else {
        themeStyle.setAttribute("href", "styles.css");
    }

    themeToggleBtn.addEventListener("click", () => {
        if (themeStyle.getAttribute("href") === "styles.css") {
            themeStyle.setAttribute("href", "dark-theme.css");
            localStorage.setItem("theme", "dark");
        } else {
            themeStyle.setAttribute("href", "styles.css");
            localStorage.setItem("theme", "light");
        }
    });

    registerBtn.addEventListener("click", () => {
        loginForm.style.display = "none";
        registerForm.style.display = "block";
        formTitle.textContent = "Регистрация";
    });

    cancelRegisterBtn.addEventListener("click", () => {
        loginForm.style.display = "block";
        registerForm.style.display = "none";
        formTitle.textContent = "Вход";
    });

    loginBtn.addEventListener("click", () => {
        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;

        fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        }).then(response => response.json())
          .then(data => {
              if (data.success) {
                  window.location.href = "/profile";
              } else {
                  showMessage("Ошибка входа: неверные данные", "error");
              }
          })
          .catch(() => showMessage("Ошибка сервера", "error"));
    });

    submitRegisterBtn.addEventListener("click", () => {
        const username = document.getElementById("new-username").value;
        const password = document.getElementById("new-password").value;

        fetch('/registr', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        }).then(response => response.json())
          .then(data => {
              if (data.message === "Пользователь создан") {
                  showMessage("Успешная регистрация! Теперь войдите", "success");
                  cancelRegisterBtn.click();
              } else {
                  showMessage("Ошибка регистрации: " + data.message, "error");
              }
          })
          .catch(() => showMessage("Ошибка сервера", "error"));
    });
});
