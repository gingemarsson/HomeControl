//------------------------
// DATABASE CLASS
//------------------------

/*
	This class represents a "database" of actions. It contains an
	array of the current actions can save a backup in a file. The 
	backup can also be loaded into the array.
*/

//Require methods to modify filesystem
var fs = require('fs');

//Set up stuff for sun calculation
var sunCalc = require('suncalc');
var availableTimes = ["sunrise", "sunriseEnd", "goldenHourEnd", "solarNoon", "goldenHour", "sunsetStart", "sunset", "dusk", "nauticalDusk", "night", "nadir", "nightEnd", "nauticalDawn", "dawn"];
var LAT = 59;
var LONG = 18;

//Constructor
function Database(filename) {
	this.data = [];
	this.dataChangedSinceLastUpdate = false;
	this.filename = filename;
};

	
//Functions
Database.prototype.update = function(){ //Check the database and, if there was any changes, update the database file
	this.checkDB();
		
	if(this.dataChangedSinceLastUpdate){
		this.writeFile();
		this.dataChangedSinceLastUpdate = false;
	}
}

Database.prototype.checkDB = function() { //Check if commands should be executed now, and execute those
	console.log("[DB] Database check initiated");
	var thisDatabase = this;
	
	var actionsToRemove = [];
	var actionsToAdd = [];
	
	this.data.forEach(function(action) {
		executed = action.execute();
		if (executed) {
			actionsToRemove.push(action.databaseId);
			
			//If the action has a numeric repeatInterval re-add it to the database
			if (action.repeatInterval != "" && action.repeatInterval > 0) {
				action.timedate = (+action.timedate) + (+action.repeatInterval); //Update the timedate
				actionsToAdd.push(action);
			}
			//If the repeatInterval is a string from sunCalc, calculate time of the specified event
			else if (availableTimes.indexOf(action.repeatInterval) >= 0)
			{
				if (sunCalc.getTimes(new Date(), LAT, LONG).sunrise.getTime() >= new Date().getTime()){ //If time of event today is after current time, use it
					action.timedate = sunCalc.getTimes(new Date(), LAT, LONG)[action.repeatInterval].getTime();
				}
				else { //Else, use tomorrows event instead
					action.timedate = sunCalc.getTimes(new Date(new Date().getTime() + 86400000), LAT, LONG)[action.repeatInterval].getTime();
				}
				actionsToAdd.push(action);
				//console.log(action.repeatInterval + " detected");
			}
		}
	});
	
	//Remove the executed actions
	actionsToRemove.forEach(function(databaseId){
		thisDatabase.removeFromDB(databaseId);
	});
	
	//Add actions that has a repeatInterval
	actionsToAdd.forEach(function(action){
		thisDatabase.addToDB(action);
	});
	
	console.log("[DB] Database check done");
	}

Database.prototype.removeFromDB = function(databaseIdToRemove) { //Remove command with the specified databaseId 
	var indexToRemove;
	
	this.data.forEach(function(action, actionIndex){
		if (action.databaseId == databaseIdToRemove) {indexToRemove = actionIndex}
	});
	
	this.data.splice(indexToRemove, 1);
	
	this.dataChangedSinceLastUpdate = true;
	console.log("[DB] CMD removed from DB:" + databaseIdToRemove);
}

Database.prototype.addToDB = function(action){ //Add an action to the DB
	action.databaseId = this.nextDatabaseId();
	this.data.push(action);
		
	this.dataChangedSinceLastUpdate = true;
	
	console.log("[DB] Command added to database (Id: " + action.databaseId + ")");
}

Database.prototype.getPlannedActions = function(callback) { //Execute function callback with the database data (sorted by date) as argument
	sortedData = this.data.slice(0);
	sortedData.sort(function(a,b){return a.timedate - b.timedate});
	callback(JSON.stringify(sortedData));
}

Database.prototype.nextDatabaseId = function(){ //Find and return next unused database id
	if (this.data[0] == undefined) {return 0;}
	else {		
		var highestDatabaseId = this.data[0].databaseId;
		this.data.forEach(function(action, actionIndex){
			if (action.databaseId > highestDatabaseId){highestDatabaseId = action.databaseId;}
		});
		return highestDatabaseId + 1;
	}
}

Database.prototype.writeFile = function(){ //Update the database file
	fs.writeFile(this.filename, JSON.stringify(this.data), 'utf8')
	console.log("[FS] File written");
}

Database.prototype.readFile = function(){ //Load database from file
	thisDatabase = this;
	
	fs.readFile(this.filename,'utf8', function(err, fileData){
		if (err) {
			return console.log(err);
		}
		thisDatabase.data = [];
		
		fileData = JSON.parse(fileData);
		fileData.forEach(function(actionFromFile){
			action = new Action(actionFromFile.command, actionFromFile.delay, actionFromFile.timedate, actionFromFile.repeatInterval);
			action.databaseId = actionFromFile.databaseId;
			
			thisDatabase.data.push(action);
		});
		
		console.log("[FS] File read");
	})
}

module.exports = Database;