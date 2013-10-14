var express = require('express');
var app = express();
var exec = require('child_process').exec;

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

	var actionsRaw = JSON.parse(req.query.cmd)
	
	actionsRaw.forEach(function(actionRaw) {
		action = new Action(actionRaw.cmd, actionRaw.id, actionRaw.delay, actionRaw.timedate);
		action.execute();
	});
	
	res.send("Commands:" + req.query.cmd);
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
	this.timedate = timedate;
	
	//Delay defaults to 0
	if (delay == undefined) {this.delay = 0;}
	
	//Functions
	this.execute = function() {
		setTimeout(function(){
			console.log("[CMD] tdtool --" + command + " " + id); //Log command
			exec("tdtool --" + command + " " + id); //Execute command
		}, (delay * 1000)); //Times 1000 to make ms
	}
}
