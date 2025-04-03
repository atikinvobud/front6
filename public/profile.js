document.addEventListener("DOMContentLoaded", async () => {
    const themeStyle = document.getElementById("theme-style");
    const themeBtn = document.getElementById("toggle-theme");
    const logoutBtn = document.getElementById("logout");
    const refreshBtn = document.getElementById("refresh-data");
    const messageBox = document.getElementById("message-box");
    const dataContainer = document.getElementById("data-container");
    const usernameEl = document.getElementById("username");

    function showMessage(message, type) {
        if (!messageBox) return;
        messageBox.textContent = message;
        messageBox.className = `message-box ${type}`;
        messageBox.style.display = "block";
        setTimeout(() => {
            messageBox.style.display = "none";
        }, 3000);
    }

    try {
        console.log("Проверка авторизации...");
        const authRes = await fetch("/check-auth", { credentials: "include" });
        const authData = await authRes.json();

        if (!authData.authenticated) {
            console.log("Не авторизован, перенаправление на главную страницу.");
            window.location.href = "/";
            return;
        }

        console.log("Пользователь авторизован:", authData.user.username);
        usernameEl.textContent = `Пользователь: ${authData.user.username}`;
    } catch (error) {
        console.error("Ошибка проверки авторизации", error);
        showMessage("Ошибка проверки авторизации", "error");
        return;
    }

    if (localStorage.getItem("theme") === "dark") {
        themeStyle.href = "dark-theme.css";
    } else {
        themeStyle.href = "styles.css";
    }

    themeBtn.addEventListener("click", () => {
        const isDark = themeStyle.href.includes("dark-theme.css");
        themeStyle.href = isDark ? "styles.css" : "dark-theme.css";
        localStorage.setItem("theme", isDark ? "light" : "dark");
    });

    async function fetchData() {
        try {
            console.log("Запрос данных с сервера...");
            const res = await fetch("/data", { credentials: "include" });

            if (!res.ok) {
                if (res.status === 401) {
                    showMessage("Сессия истекла, пожалуйста, войдите снова.", "error");
                    console.log("Ошибка 401: Сессия истекла");
                } else {
                    showMessage("Ошибка загрузки данных", "error");
                    console.log("Ошибка загрузки данных, статус:", res.status);
                }
                return;
            }

            const data = await res.json();
            console.log("Полученные данные:", data);

            if (!data.cachedAt) {
                showMessage("Ошибка: отсутствует timestamp в данных", "error");
                return;
            }

            const lastCacheTime = localStorage.getItem("lastCacheTime");
            console.log("Последнее сохраненное время кэша:", lastCacheTime);

            if (lastCacheTime && parseInt(lastCacheTime, 10) === data.cachedAt) {
                console.log("Данные не изменились, обновление не требуется.");
                return;
            }

            localStorage.setItem("lastCacheTime", data.cachedAt);
            dataContainer.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
            showMessage("Данные успешно обновлены!", "success");
        } catch (error) {
            console.error("Ошибка сервера при получении данных:", error);
            showMessage("Ошибка сервера", "error");
        }
    }

    refreshBtn.addEventListener("click", fetchData);

    fetchData();

    logoutBtn.addEventListener("click", async () => {
        try {
            console.log("Выход из системы...");
            const res = await fetch("/logout", { method: "POST", credentials: "include" });

            if (res.ok) {
                console.log("Выход выполнен, перенаправление на главную страницу.");
                window.location.href = "/";
            } else {
                showMessage("Ошибка выхода", "error");
            }
        } catch (error) {
            console.error("Ошибка при выходе:", error);
            showMessage("Ошибка сервера", "error");
        }
    });
});
