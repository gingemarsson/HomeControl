//------------------------
// TIMEMANAGER CLASS
//------------------------

/*
	This class has methods to generate times from descriptions.
*/

//Require suncalc for sun calculations
var sunCalc = require('suncalc');

var availableTimes = ["sunrise", "sunriseEnd", "goldenHourEnd", "solarNoon", "goldenHour", "sunsetStart", "sunset", "dusk", "nauticalDusk", "night", "nadir", "nightEnd", "nauticalDawn", "dawn"];
var latitude;
var longitude;

var timeManager = {};

timeManager.setLocation = function (newLatitude, newLongitude){
	latitude = newLatitude;
	longitude = newLongitude;
}

timeManager.getTime = function (description){
	if (availableTimes.indexOf(description) == -1) {return -1};

	//If time of event today is after current time, use it
	if (sunCalc.getTimes(new Date(), latitude, longitude).sunrise.getTime() >= new Date().getTime()){ 
		return sunCalc.getTimes(new Date(), latitude, longitude)[description].getTime();
	}
	
	//Else, use tomorrows event instead
	else { 
		return sunCalc.getTimes(new Date(new Date().getTime() + 86400000), latitude, longitude)[description].getTime();
	}
}

module.exports = timeManager;