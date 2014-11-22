var express = require('express');
var app = express();
var exec = require('child_process').exec;
var http = require('http');
var fs = require('fs');

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
	
	res.send("Commands:" + req.query.cmd + "<script>window.location = '/';</script>");
});

//GET PLANNED ACTIONS
app.use("/plannedActions" ,function(req, res, next){
	database.GetPlannedActions(function(data) {
		res.send(data)
	});
});

//REMOVE PLANNED ACTIONS
app.use("/removePlannedAction" ,function(req, res, next){
	database.RemoveFromDB(req.query.id)
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

//Read database from file
database.readFile();

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
	if (parseInt(this.timedate) + 86400000 < Date.now() && this.timedate != "") {
		midnightToday = new Date(new Date(Date.now()).getFullYear(), new Date(Date.now()).getMonth(), new Date(Date.now()).getDate()).getTime(); //The value of 00:00 today
		
		if (parseInt(this.timedate) + midnightToday < Date.now()) {this.timedate = parseInt(this.timedate) + midnightToday + 86400000;} //If if has already passed, shift it forward a day
		else {this.timedate = parseInt(this.timedate) + midnightToday;}
	}
		
	//Delay defaults to 0
	if (delay == undefined) {this.delay = 0;}
	
	//Functions
	this.execute = function(addToDB) {
		if (this.timedate == "") {
			console.log("[CMD] tdtool --" + command + " " + id); //Log command
			exec("tdtool --" + command + " " + id); //Execute command
			return true;
		}
		else if (this.timedate < Date.now()) {
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

	var data = [];
	
	//Functions
	this.CheckDB = function() { //Check if commands should be executed now
		console.log("[DB] Database check initiated");
		var self = this;
		
		var actionsToRemove = [];
		
		data.forEach(function(action) {
			executed = action.execute(false);
			if (executed) {
				actionsToRemove.push(action.databaseId);
			}
		});
		
		actionsToRemove.forEach(function(databaseId){
			self.RemoveFromDB(databaseId);
		});
		
		console.log("[DB] Database check done");
		}
	
	this.RemoveFromDB = function(databaseIdToRemove) { //Remove command with the databaseId and rev from the DB
		var indexToRemove;
		
		data.forEach(function(action, actionIndex){
			if (action.databaseId == databaseIdToRemove) {indexToRemove = actionIndex}
		});
		
		data.splice(indexToRemove, 1);
		console.log("[DB] CMD removed from DB:" + databaseIdToRemove);
		this.writeFile();
	}
	
	this.AddToDB = function(action){ //Add an action to the DB
		action.databaseId = this.nextDatabaseId();
		data.push(action);
		
		console.log("[DB] CMD added to DB:" + JSON.stringify(action));
		this.writeFile();
	}
	
	this.GetPlannedActions = function(callback) { //Execute function callback with the database data as argument
		callback(JSON.stringify(data));
	}
	
	this.nextDatabaseId = function(){ //Return next database id
		if (data[0] == undefined) {return 0;}
		else {		
			var nextDatabaseId = data[0].databaseId;
			data.forEach(function(action, actionIndex){
				if (action.databaseId > nextDatabaseId){nextDatabaseId = action.databaseId;}
			});
			return nextDatabaseId + 1;
		}
	}
	
	this.writeFile = function(){
		fs.writeFile('data.txt', JSON.stringify(data), 'utf8')
		console.log("[FS] File written");
	}
	
	this.readFile = function(){
		fs.readFile('/test.txt','utf8', function(err, fileData){
			if (err) {
				return console.log(err);
			}
			data = JSON.parse(fileData);
			console.log("[FS] File read");
		})
	}
}
