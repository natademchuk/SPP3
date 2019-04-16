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

let taskInfo = [];
let userInfo = { userName: "12", userPassword: "12" };
let SECRET;


let verifyToken = function(req, res, next) {
    const token = req.cookies.token;
    jwt.verify(token, SECRET, function(err, decoded) {
        if (err) {
            res.status(401);
        } else {
            //next();
            res.status(200);
        }

    });
    next();
};

app.get('/login', function(req, res) { //console.log('req.files >>>', req.files);     // console.log(req.body);
    taskInfo = [];
    res.status(200);
    res.render("login");
    console.log('get /login success');
});

app.post('/login', urlencodedParser, function(req, res) { //console.log('req.files >>>', req.files);     // console.log(req.body);
    SECRET = Date.now().toString();
    userInfo.userName = req.body.uName;
    userInfo.userPassword = req.body.uPassword;

    const token = jwt.sign({ userName: userInfo.userName, userPassword: userInfo.userPassword }, SECRET);
    res.cookie("token", token);
    res.sendStatus(200);

    console.log('post /login success');
});

app.get('/', verifyToken, function(req, res) {
    // res.status(200);
    res.render("index", { taskInfo });
    console.log('get / success');
});

app.post('/', verifyToken, urlencodedParser, function(req, res) { //console.log('req.files >>>', req.files);     // console.log(req.body);
    req.files.myFile.name = req.files.myFile.name.split(' ').join('_');
    let myFile = req.files.myFile;
    let uploadPath = __dirname + '/public/downloadfiles/' + myFile.name;
    myFile.mv(uploadPath);

    let downloadPath = '/public/downloadfiles/' + myFile.name;
    let temptask = { task: req.body.task, status: req.body.status, efdate: req.body.fdate, filename: myFile.name, filepath: downloadPath };
    taskInfo.push(temptask);
    //res.status(200);
    res.json(temptask);
    console.log('post / success');
});

app.put('/', verifyToken, urlencodedParser, function(req, res) { //console.log('req.files >>>', req.files); 
    req.files.myFile.name = req.files.myFile.name.split(' ').join('_');
    let myFile = req.files.myFile;
    let uploadPath = __dirname + '/public/downloadfiles/' + myFile.name;
    myFile.mv(uploadPath);

    let downloadPath = '/public/downloadfiles/' + myFile.name;
    let temptask = { task: req.body.task, status: req.body.status, efdate: req.body.fdate, filename: myFile.name, filepath: downloadPath };
    taskInfo.splice(req.body.tasknum, 1, temptask);
    //res.status(200);
    res.json(temptask);
    console.log('put / success');

});

app.listen(8000, function() {
    console.log('server.js listening on port 8000!');
});