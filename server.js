var express = require('express');
var app = express();
var exec = require('child_process').exec;
var http = require('http');

var database = new Database("127.0.0.1", 5984);

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
	database.CheckDB();
	res.send("[INFO] Database checked");
});


//REDIRECT EVERYTHING ELSE TO "/"
app.use("/", function(req, res, next) {
	if (req.path.length > 1) {res.redirect("/");}
	else {res.sendfile(__dirname + "/www/index.html");}
;});

//Bind webbserver to port 80
app.listen(80); 

//Check database every 10 sec
setInterval( function(){database.CheckDB()}, 10000);

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
			return true;
		}
		else if (addToDB){
			database.AddToDB(this);
		}
		return false;
	}
}

//------------------------
// Database CLASS
//------------------------

function Database (hostname, port) {
	
	this.options = {
		'hostname': hostname,
		'port': port,
		};
	
	//Functions
	this.CheckDB = function() {
		this.options.path = "/actions/_design/homecontrol/_view/byDate";
		this.options.method = "GET";

		var self = this;
		data = "";
		
		console.log("[INFO]: Database check initiated");
		req = http.request(this.options, function(res) {
			res.setEncoding("utf8");
			
			res.on("data", function (chunk) {
				data += chunk;
			});
			
			res.on('end', function () {
				actionsRaw = JSON.parse(data).rows;
				actionsRaw.forEach(function(actionRaw) {
					action = new Action(actionRaw.value.command, actionRaw.value.id, actionRaw.value.delay, actionRaw.value.timedate);
					executed = action.execute(false);
					if (executed) {
						self.RemoveFromDB(actionRaw.id, actionRaw.value.rev);
					}
				});
			});
		});
		req.end()
		console.log("[INFO]: Database check done");
	}
	
	this.RemoveFromDB = function(DatabaseId, rev) {
		this.options.path = "/actions/" + DatabaseId + "?rev=" + rev;
		this.options.method = "DELETE";
		
		req = http.request(this.options, function(res) {
			res.setEncoding("utf8");
			
			res.on('end', function () {
				console.log("[DB]: CMD removed from DB");
			});
		});
		req.end()
	}
	
	this.AddToDB = function(action){
		this.options.path = "/actions";
		this.options.method = "POST";
		this.options.headers = {'Content-Type': 'application/json'}
		
		var req = http.request(this.options, function(res) {
			res.setEncoding('utf8');
			res.on('data', function (chunk) {
				console.log("[DB] CMD added to DB:" + chunk);
			});
		});
		req.write(JSON.stringify(action));
		req.end()
	}
}