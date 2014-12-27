var http = require('http');
var express = require('express');
var app = express();


var Database = require("./database.js");
database = new Database('data.txt');

Action = require("./action.js");

//------------------------
// INITIATION
//------------------------

//Bind webbserver to port 8080
app.listen(8080); 
console.log("[INFO]: Application listening at port 8080");

//Read database from file
database.readFile();

//Update database every 10 sec
setInterval( function(){database.update()}, 10000);



//------------------------
// WEBSERVER
//------------------------

//Static files
app.use("/index.html", function(req, res, next) {res.sendfile(__dirname + "/www/index.html");});
app.use("/script.js", function(req, res, next) {res.sendfile(__dirname + "/www/script.js");});
app.use("/style.css", function(req, res, next) {res.sendfile(__dirname + "/www/style.css");});
app.use("/jquery-1.11.1.min.js", function(req, res, next) {res.sendfile(__dirname + "/www/jquery-1.11.1.min.js");});

//Run or add the specified commands
app.use("/cmd" ,function(req, res, next){
	
	var actionsRaw = JSON.parse(req.query.cmd);
	
	actionsRaw.forEach(function(actionRaw) {
		action = new Action(actionRaw.command, actionRaw.delay, actionRaw.timedate, actionRaw.repeatInterval);
				
		//If the actions isn't executed, add it to the database
		if(!action.execute(true)){ 
			database.addToDB(action);
		}
	});
	
	res.send("Commands:" + req.query.cmd + "<script>window.location = '/';</script>");
});

//Return the currently planned actions
app.use("/plannedActions" ,function(req, res, next){
	database.getPlannedActions(function(data) {
		res.send(data);
	});
});

//Remove specified planned action
app.use("/removePlannedAction" ,function(req, res, next){
	database.removeFromDB(req.query.id)
	res.send("Removing from DB")
});

//Redirect every other request to "/"
app.use("/", function(req, res, next) {
	if (req.path.length > 1) {res.redirect("/");}
	else {res.sendfile(__dirname + "/www/index.html");}
;});