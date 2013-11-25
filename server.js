var express = require('express');
var app = express();
var exec = require('child_process').exec;
var http = require('http');

var database = new Database("127.0.0.1", 5984);

//------------------------
// WEBSERVER
//------------------------

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

//GET PLANNED ACTIONS
app.use("/plannedActions" ,function(req, res, next){
	database.GetPlannedActions(function(data) {
		res.send(data)
	});
});

//REMOVE PLANNED ACTIONS
app.use("/removePlannedAction" ,function(req, res, next){
	database.RemoveFromDB(req.query.id, req.query.rev)
	res.send("Removing from DB")
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
console.log("[INFO]: Application listening at port 80");

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
		
	//If timedate is a day lower than todays date, add it to 00:00 today (this allows for smarter macros)
	if (this.timedate + 86400000 < Date.now() && this.timedate != "") {
		midnightToday = new Date(new Date(Date.now()).getFullYear(), new Date(Date.now()).getMonth(), new Date(Date.now()).getDate()).getTime(); //The value of 00:00 today
		
		if (parseInt(this.timedate) + midnightToday < Date.now()) {this.timedate = parseInt(this.timedate) + midnightToday + 86400000;} //If if has already passed, shift it forward a day
		else {this.timedate = parseInt(this.timedate) + midnightToday;}
	}
		
	//Delay defaults to 0
	if (delay == undefined) {this.delay = 0;}
	
	//Functions
	this.execute = function(addToDB) {
		if (this.timedate < Date.now() || this.timedate == "") {
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
	this.CheckDB = function() { //Check if commands should be executed now
		var options = this.options;
		
		options.path = "/actions/_design/homecontrol/_view/byDate";
		options.method = "GET";

		var self = this;
		data = "";
		
		console.log("[INFO]: Database check initiated");
		req = http.request(options, function(res) {
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
	
	this.RemoveFromDB = function(DatabaseId, rev) { //Remove command with the databaseID and rev from the DB
		var options = this.options;
		
		options.path = "/actions/" + DatabaseId + "?rev=" + rev;
		options.method = "DELETE";
		
		req = http.request(options, function(res) {
			res.setEncoding("utf8");
			
			res.on('end', function () {
				console.log("[DB]: CMD removed from DB");
			});
		});
		req.end()
	}
	
	this.AddToDB = function(action){ //Add an action to the DB
		var options = this.options;
		
		options.path = "/actions";
		options.method = "POST";
		options.headers = {'Content-Type': 'application/json'}
		
		var req = http.request(options, function(res) {
			res.setEncoding('utf8');
			res.on('data', function (chunk) {
				console.log("[DB] CMD added to DB:" + chunk);
			});
		});
		req.write(JSON.stringify(action));
		req.end()
	}
	
	this.GetPlannedActions = function(callback) { //Execute function callback with the data as argument
		var options = this.options;
		
		options.path = "/actions/_design/homecontrol/_view/byDate";
		options.method = "GET";
				
		var data = "";
		
		console.log("[INFO]: Gathering data from database");
		req = http.request(options, function(res) {
			res.setEncoding("utf8");
			
			res.on("data", function (chunk) {
				data += chunk;
			});
			
			res.on('end', function () {	
				data = JSON.stringify(JSON.parse(data).rows)
				callback(data);
			});
		});
		req.end()
	}
}