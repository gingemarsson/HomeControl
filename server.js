var express = require('express');
var app = express();
var exec = require('child_process').exec;
var http = require('http');

//------------------------
// WEBSERVER
//------------------------

console.log("Application listening");

//FILES
app.use("/index.html", function(req, res, next) {res.sendfile(__dirname + "/www/index.html");});
app.use("/script.js", function(req, res, next) {res.sendfile(__dirname + "/www/script.js");});
app.use("/style.css", function(req, res, next) {res.sendfile(__dirname + "/www/style.css");});


//CMD
app.use("/cmd" ,function(req, res, next){
	
	var actionsRaw = JSON.parse(req.query.cmd);
	
	actionsRaw.forEach(function(actionRaw) {
		action = new Action(actionRaw.command, actionRaw.id, actionRaw.delay, actionRaw.timedate);
		action.execute(true);
	});
	
	res.send("Commands:" + req.query.cmd);
});

//MANUALLY TRIGGER DATABSE CHECK
app.use("/DB-check" ,function(req, res, next){
	CheckDB();
	res.send("Database checked");
});


//REDIRECT EVERYTHING ELSE TO "/"
app.use("/", function(req, res, next) {
	if (req.path.length > 1) {res.redirect("/");}
	else {res.sendfile(__dirname + "/www/index.html");}
;});

app.listen(80); //the port you want to use

//------------------------
// ACTION CLASS
//------------------------

function Action (command, id, delay, timedate) {

	//Variables
	this.command = String(command).replace(/[^onf]/g,"");
	this.id = String(id).replace(/[^0-9|a-z|A-Z]/g,"");
	this.delay = String(delay).replace(/[^0-9]/g,"");
	this.timedate = String(timedate).replace(/[^0-9]/g,"");
	
	//Delay defaults to 0
	if (delay == undefined) {this.delay = 0;}
	
	//Functions
	this.execute = function(addToDB) {
		if (parseInt(timedate) < Date.now() || timedate == undefined) {
			setTimeout(function(){
				console.log("[CMD] tdtool --" + command + " " + id); //Log command
				exec("tdtool --" + command + " " + id); //Execute command
			}, (delay * 1000)); //Times 1000 to make ms
		}
		else if (addToDB){
			var options = {
				hostname: '127.0.0.1',
				port: 5984,
				path: '/actions',
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				}
			};
			var req = http.request(options, function(res) {
				res.setEncoding('utf8');
				res.on('data', function (chunk) {
					console.log("[DB] " + chunk);
				});
			});
			req.write(JSON.stringify(this));
			req.end()
		}
	}
}

function CheckDB () {
	var data = "";
	var options = {
		hostname: "127.0.0.1",
		port: 5984,
		path: "/actions/_design/homecontrol/_view/byDate",
		method: "GET",
	};
	var req = http.request(options, function(res) {
		res.setEncoding("utf8");
		
		res.on("data", function (chunk) {
			data += chunk;
		});
		
		res.on('end', function () {
			console.log("[INFO]: Database checked");
			actionsRaw = JSON.parse(data).rows;
			actionsRaw.forEach(function(actionRaw) {
				action = new Action(actionRaw.value.command, actionRaw.value.id, actionRaw.value.delay, actionRaw.value.timedate);
				action.execute(false);
			});
		});
	});
	req.end()
}
//Check Database every minute
setInterval( CheckDB, 60000);