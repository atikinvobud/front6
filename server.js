const express = require("express");
const fs = require("fs");
const path = require("path");
const sessions = require("express-session");
const bcrypt = require("bcrypt");
const MemoryStore = require("memorystore")(sessions);
const cors = require("cors");

const app = express();
const port = 8000;
const cacheFile = path.join(__dirname, "cache.json");

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.use(
    cors({
        origin: "http://localhost:8000",
        credentials: true, 
    })
);

app.use((req, res, next) => {
    console.log("Cookies:", req.headers.cookie);
    next();
});

app.use(
    sessions({
        secret: "your_secret_key_here",
        resave: false,
        saveUninitialized: false,
        store: new MemoryStore({ checkPeriod: 86400000 }),
        cookie: {
            secure: false, 
            httpOnly: true,
            maxAge: 86400000, 
            sameSite: "lax", 
        },
    })
);

let users = [];

async function hashPassword(password) {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
}

async function checkPassword(enteredPassword, storedHash) {
    return await bcrypt.compare(enteredPassword, storedHash);
}

function checkauth(req, res, next) {
    console.log("Проверка авторизации. Сессия:", req.session);
    if (req.session.user) {
        return next();
    }
    res.status(401).json({ authenticated: false });
}

function logUsersState(action) {
    console.log(`${action}:`, JSON.stringify(users, null, 2));
}

app.get("/", (req, res) => {
    fs.readFile(path.join(__dirname, "public", "index.html"), "utf8", (err, data) => {
        if (err) res.status(404).send("Ошибка: файл index.html не найден");
        else res.send(data);
    });
});

app.get("/profile", checkauth, (req, res) => {
    fs.readFile(path.join(__dirname, "public", "profile.html"), "utf8", (err, data) => {
        if (err) res.status(404).send("Ошибка: файл profile.html не найден");
        else res.send(data);
    });
});

app.post("/registr", async (req, res) => {
    const { username, password } = req.body;

    if (users.find((u) => u.username === username)) {
        return res.status(400).json({ message: "Пользователь уже существует" });
    }
    try {
        const hashedPassword = await hashPassword(password);
        users.push({ id: users.length + 1, username, password: hashedPassword });
        logUsersState("Пользователь зарегистрирован");
        return res.status(201).json({ message: "Пользователь создан" });
    } catch (error) {
        return res.status(500).json({ message: "Ошибка сервера при хэшировании" });
    }
});

app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    const user = users.find((u) => u.username === username);

    if (!user) {
        return res.status(404).json({ message: "Пользователь не найден" });
    }

    const isPasswordCorrect = await checkPassword(password, user.password);
    if (!isPasswordCorrect) {
        return res.status(401).json({ message: "Неверный пароль" });
    }

    req.session.user = { username: user.username };
    logUsersState("Пользователь авторизован");

    res.status(200)
        .cookie("connect.sid", req.sessionID, { httpOnly: true, sameSite: "lax" })
        .json({ success: true });
});


app.post("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.status(500).send("Ошибка выхода");
        res.clearCookie("connect.sid");
        logUsersState("Пользователь вышел");
        res.status(200).json({ success: true });
    });
});

app.get("/data", checkauth, (req, res) => {
    console.log("Сессия:", req.session);

    let cachedData = null;

    if (fs.existsSync(cacheFile)) {
        try {
            const fileContent = fs.readFileSync(cacheFile, "utf8").trim();
            if (fileContent) {
                cachedData = JSON.parse(fileContent);
                console.log("Содержимое кэша:", cachedData);
            } else {
                console.log("Кэш-файл пуст.");
            }
        } catch (err) {
            console.error("Ошибка чтения кэш-файла", err);
        }
    }

    const now = Date.now();
    console.log("Текущее время:", now);
    console.log("Разница с кэшем:", now - (cachedData?.timestamp || 0));

    if (cachedData && now - cachedData.timestamp < 60000) {
        console.log("Используем кэшированные данные.");
        return res.status(200).json({ cachedAt: cachedData.timestamp });
    }

    const cacheData = { timestamp: now };

    try {
        fs.writeFileSync(cacheFile, JSON.stringify(cacheData, null, 2), "utf-8");
        console.log("Кэш обновлен.");
    } catch (err) {
        console.error("Ошибка при записи кэш-файла", err);
    }

    return res.status(200).json({ cachedAt: cacheData.timestamp });
});

app.get("/check-auth", (req, res) => {
    console.log("Проверка авторизации. Сессия ID:", req.sessionID);
    console.log("Сессия:", req.session);

    if (req.session.user) {
        return res.status(200).json({ authenticated: true, user: req.session.user });
    }
    return res.status(200).json({ authenticated: false });
});

app.listen(port, () => {
    console.log("Сервер запущен на порту", port);
});
