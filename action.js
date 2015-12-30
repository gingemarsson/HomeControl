//------------------------
// ACTION CLASS
//------------------------

/*
	This class manages the actions. it contains methods for 
	creating and executing actions.
*/

//Require methods to execute commands
var exec = require('child_process').exec;

var allowSystemActions = false;

//Constructor
function Action (command, delay, timedate, repeatInterval, dimLevel) {

	//Variables
    this.delay = String(delay).replace(/[^0-9]/g,"");
	this.timedate = String(timedate).replace(/[^0-9]/g,"");
	this.repeatInterval = String(repeatInterval).replace(/[^0-9|a-z|A-Z]/g,"");
    this.dimLevel = String(dimLevel).replace(/[^0-9]/g,"");
	this.command = command;
	
	
	switch(this.command.type) {
		case "tellstick":
			this.command.task = String(this.command.task).replace(/[^onfdim]/g,"");
			this.command.id = String(this.command.id).replace(/[^0-9|a-z|A-Z]/g,"");
			break;
		case "system":
			this.command.task = String(this.command.task).replace(/[^0-9|a-z|A-Z]/g,"");
			break;
	}
	
	
	//Delay defaults to 0
	if (delay == undefined) {this.delay = 0;}
}

//Functions
Action.prototype.execute = function() { //Check if the action should be executed and, if it should, call _doAction
	if (this.timedate == "" || this.timedate < Date.now()) {
		if (this.delay == 0) {
			this._doAction();
		}
		else {
			var thisAction = this; //Fix for incorrect this in the setTimeout
			setTimeout(function(){
				thisAction._doAction();
			}, (this.delay * 1000)); //Times 1000 to make ms
		}
		return true;
	}
	return false;

}

Action.prototype._doAction = function(){ //This method contains the action-specific code that executes specific commands.
	switch(this.command.type){
		case "tellstick":
            if (this.command.task == "dim") {
                console.log("[CMD] tdtool --dimlevel" + this.command.dimlevel + " --dim " + this.command.id); //Log command
                exec("[CMD] tdtool --dimlevel" + this.command.dimlevel + " --dim " + this.command.id); //Execute command
            }
            else {
                console.log("[CMD] tdtool --" + this.command.task + " " + this.command.id); //Log command
                exec("tdtool --" + this.command.task + " " + this.command.id); //Execute command
            }
            break;
		case "system":
			if (allowSystemActions) {
				if(this.command.task == "checkDatabase"){
					database.update();
				}
				if(this.command.task == "exit"){
					console.log("[CMD] Exiting script");
					process.exit();
				}
				if(this.command.task == "reboot"){
					console.log("[CMD] System going down for reboot");
					exec("sudo reboot")
				}
				if(this.command.task == "shutdown"){
					console.log("[CMD] System halt!");
					exec("sudo halt")
				}
			}
			break;
	}
}

Action.allowSystemActions = function(){ //This method is used to enable system-actions
	console.log("[INFO] System actions now enabled");
	allowSystemActions = true;
}

module.exports = Action;