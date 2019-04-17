const express = require('express');
const app = express();
app.set("view engine", "ejs");

const bodyParser = require("body-parser");
const urlencodedParser = bodyParser.urlencoded({ extended: false });
const jsonParser = express.json();

const fileUpload = require('express-fileupload');
app.use(fileUpload());

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
app.use(cookieParser());

app.use('/public', express.static('public'));

let utasks = []; //данные всех задач для конкретного пользователя
let SECRET;

const fs = require('fs');
let users = []; //данные всех пользователей {username:" ",password:" "}
let tasks = []; //данные всех задач для каждого пользователя {username:" ", utasks:[]}
let tempUsername = "";


function updateTasks(username, utasks) {
    let idx = tasks.findIndex(x => x.username === username);
    tasks.splice(idx, 1, { username, utasks });
}

function getUTasks(username) {
    utasks = tasks.find(x => x.username === username).utasks.slice();
}

let verifyToken = function(req, res, next) {
    const token = req.cookies.token;
    jwt.verify(token, SECRET, function(err, decoded) {
        if (err) {
            res.status(401);
            next();
        }
    });
    res.status(200);
    next();
};

let checkUserRegister = function(req, res, next) {
    if (users.findIndex(x => x.userName === req.body.uName) >= 0) {
        res.status(409).end(); //user exists
    } else
        next();
};
let checkUserLogin = function(req, res, next) {
    if (users.findIndex(x => x.userName === req.body.uName) < 0) {
        res.status(404).end(); //user doesn't exist
    } else {
        bcrypt.compare(req.body.uPassword, users.find(x => x.userName === req.body.uName).userPassword).then(function(cmpres) {
            if (cmpres)
                next();
            else
                res.status(401).end(); //wrong password
        });
    }
};

let register = function(req, res, next) {
    const saltRounds = 10;
    bcrypt.hash(req.body.uPassword, saltRounds).then(function(hash) {
        users.push({ userName: req.body.uName, userPassword: hash });
    });
    tasks.push({ username: req.body.uName, utasks: [] });
    next();
};
let login = function(req, res, next) {
    tempUsername = req.body.uName;
    getUTasks(req.body.uName);
    SECRET = Date.now().toString();
    let userInfo = { userName: req.body.uName, userPassword: req.body.uPassword };
    const token = jwt.sign({ userName: userInfo.userName, userPassword: userInfo.userPassword }, SECRET);
    res.cookie("token", token);
    next();
};

app.get('/register', function(req, res) {
    //utasks = [];
    res.status(200);
    res.render("autorisation", { title: "REGISTRATION", header: "Registration ", action: "Register" });
    console.log('get /register success');
});
app.post('/register', urlencodedParser, checkUserRegister, register, login, function(req, res) {
    res.sendStatus(200);
    console.log('post /register success');
});


app.get('/login', function(req, res) {
    //utasks = [];
    res.status(200);
    res.render("autorisation", { title: "LOGIN", header: "Welcome back ! ", action: "Login" });
    console.log('get /login success');
});
app.post('/login', urlencodedParser, checkUserLogin, login, function(req, res) {
    res.sendStatus(200);
    console.log('post /login success');
});


app.get('/', verifyToken, function(req, res) {
    //res.status(200);
    res.render("index", { utasks });
    console.log('get / success');
});

app.post('/', verifyToken, urlencodedParser, function(req, res) {
    req.files.myFile.name = req.files.myFile.name.split(' ').join('_');
    let myFile = req.files.myFile;
    let uploadPath = __dirname + '/public/downloadfiles/' + myFile.name;
    myFile.mv(uploadPath);

    let downloadPath = '/public/downloadfiles/' + myFile.name;
    let temptask = { task: req.body.task, status: req.body.status, efdate: req.body.fdate, filename: myFile.name, filepath: downloadPath };
    utasks.push(temptask);
    //res.status(200);
    res.json(temptask);

    updateTasks(tempUsername, utasks);
    console.log('post / success');
});

app.put('/', verifyToken, urlencodedParser, function(req, res) {
    req.files.myFile.name = req.files.myFile.name.split(' ').join('_');
    let myFile = req.files.myFile;
    let uploadPath = __dirname + '/public/downloadfiles/' + myFile.name;
    myFile.mv(uploadPath);

    let downloadPath = '/public/downloadfiles/' + myFile.name;
    let temptask = { task: req.body.task, status: req.body.status, efdate: req.body.fdate, filename: myFile.name, filepath: downloadPath };
    utasks.splice(req.body.tasknum, 1, temptask);
    //res.status(200);
    res.json(temptask);

    updateTasks(tempUsername, utasks);
    console.log('put / success');
});

process.on('SIGINT', (code) => {
    let usersdata = JSON.stringify(users, null, 2);
    let tasksdata = JSON.stringify(tasks, null, 2);

    fs.writeFile(__dirname + '/bd/users_bd.json', usersdata, (err) => {
        if (err) throw err;
        // console.log('Data written to file');
    });

    fs.writeFile(__dirname + '/bd/tasks_bd.json', tasksdata, (err) => {
        if (err) throw err;
        // console.log('Data written to file');
    });

    console.log(`server.js to exit with code: ${code}`);
    server.close(() =>
        console.log("server.js exit")
    );
});

const server = app.listen(8000, function() {
    fs.readFile(__dirname + '/bd/users_bd.json', (err, data) => {
        if (err) throw err;
        try {
            users = JSON.parse(data);
        } catch (e) {
            users = [];
            //console.log(e);
        }
        //console.log(users);
    });

    fs.readFile(__dirname + '/bd/tasks_bd.json', (err, data) => {
        if (err) throw err;
        try {
            tasks = JSON.parse(data);
        } catch (e) {
            tasks = [];
            //console.log(e);
        }
        //console.log(users);
    });

    console.log('server.js listening on port 8000!');
});