var http = require('http');
var express = require('express');
var app = express();


var Database = require("./database.js");
database = new Database('data.txt');

Action = require("./action.js");
TimeManager = require("./timeManager.js");

//------------------------
// CONFIGURATION
//------------------------

var PORT = 80;
var UPDATEINTERVAL = 10000;
TimeManager.setLocation(59, 18);

//------------------------
// INITIATION
//------------------------

//Bind webbserver to port PORT
app.listen(PORT); 
console.log("[INFO]: Application listening at port " + PORT);

//Read database from file
database.readFile();

//Update database every 10 sec
setInterval( function(){database.update()}, UPDATEINTERVAL);



//------------------------
// WEBSERVER
//------------------------

//Static files in the www-folder
app.use(express.static(__dirname + '/www'));

//The content of the website
app.use("/websiteContent", function(req, res, next) {res.sendfile(__dirname + "/website.txt");});

//Run or add the specified commands
app.use("/cmd" ,function(req, res, next){
	
	var actionsRaw = JSON.parse(req.query.cmd);
	
	actionsRaw.forEach(function(actionRaw) {
		if(isNaN(actionRaw.timedate)) {actionRaw.timedate = TimeManager.getTime(actionRaw.timedate);}
	
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