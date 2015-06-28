//Create a global variable time to track the time it takes to generate page
var time;

function doGenerate(){
	console.log("Updating..");
	time = Date.now();
  
	var ajax = $.ajax("/websiteContent")
	
	
	ajax.done(function(response) {
		console.log("Updated (" + (Date.now() - time) + " ms)");
		generateWebsite(response);
		console.log("Done (" + (Date.now() - time) + " ms)");
		pageLoadActions();
	})

	ajax.fail(function() {showStatus('FEL: Anslutningen kunde inte upprättas.');})
}

function generateWebsite(data) {
	var htmlString = "";
		
	data = JSON.parse(data);
	console.log("Parsed JSON (" + (Date.now() - time) + " ms)");

	data.forEach(function(section){
		//Page-wide settings
		if (section.pageSettings) {
			htmlString += "<div class='connectionError'>" + section.connectionErrorMessage + "</div>";
			document.title = section.title == undefined ? "Home Control." : section.title;
		}
		else {
			if (section.hidden) {htmlString += "<section class='hidden'>";}
			else {htmlString += "<section>";}
			
			htmlString += "<h1>" + section.header + "</h1>";
			
			section.content.forEach(function(element){
				htmlString += generateElement(element);
			});
		}
		htmlString += "</section>";
	});
	
	console.log("Generated HTML (" + (Date.now() - time) + " ms)");
	$(".generated").html(htmlString)
}

function generateElement(element){

	if(element.timeCommand) {var commandKey = "data-timeCommand";}
	else {var commandKey = "data-command";}

	htmlString = "";

	switch(element.type){
		case "inlineButton":
			htmlString = "<a class='inlineButton' " + commandKey + "='" + JSON.stringify(element.command) + "'>" + element.label + "</a>";
			break;
			
		case "doubleButton":
			htmlString = "<div class='buttonSet'>";
			htmlString += "<p class='label'>" + element.label + "</p>";
			htmlString += "<div class='doubleButton'>";
			htmlString += "<a href='#' " + commandKey + "='" + JSON.stringify(element.commandLeft) + "' class='buttonLeft' data-role='button'>" + element.labelLeft + "</a>";
			htmlString += "<a href='#' " + commandKey + "='" + JSON.stringify(element.commandRight) + "' class='buttonRight' data-role='button'>" + element.labelRight + "</a>";
			htmlString += "</div></div>";
			break;
			
		case "singleButton":
			htmlString = "<div class='buttonSet'>";
			htmlString += "<a href='#' " + commandKey + "='" + JSON.stringify(element.command) + "' class='singleButton' data-role='button'>" + element.label + "</a>";
			htmlString += "</div>";
			break;
			
		case "addPlanned":
			htmlString = "<label for='AP-device' class='select'>" + element.deviceLabel + "</label><select id='AP-device'>";
			element.deviceChoices.forEach(function(choice){htmlString += "<option value='" + choice.value + "'>" + choice.label + "</option>";});
			htmlString += "</select>";
			
			htmlString += "<label for='AP-command' class='select'>" + element.commandLabel + "</label><select id='AP-command'>";
			element.commandChoices.forEach(function(choice){htmlString += "<option value='" + choice.value + "'>" + choice.label + "</option>";});
			htmlString += "</select>";
			
			htmlString += "<label for='AP-repeatInterval' class='select'>" + element.repeatIntervalLabel + "</label><select id='AP-repeatInterval'>";
			element.repeatIntervalChoices.forEach(function(choice){htmlString += "<option value='" + choice.value + "'>" + choice.label + "</option>";});
			htmlString += "</select>";
			
			htmlString += "<label for='AP-date' class='select'>" + element.dateLabel + "</label><input type='text' id='AP-date' id='AP-date' placeholder='YYYY-MM-DD'></input>";
			htmlString += "<label for='AP-time' class='select'>" + element.timeLabel + "</label><input type='text' id='AP-time' id='AP-time' placeholder='HH:MM'></input>";
			
			htmlString += "<a href='#' class='inlineButton' id='addPlannedCommand'>" + element.submitLabel + "</a>";
			break;
			
		case "listOfPlanned":
			htmlString += "<ul id='plannedActionsList'>";
			htmlString += "</ul>";
			break;
		
		case "updateListOfPlanned":
			htmlString += "<a href='#' class='inlineButton' id='refreshPlannedCommands'>" + element.label + "</a>";
			break;
		
		case "dividerLine":
			htmlString = '<hr />';
			break;
		
		case "status":
			htmlString = "<p class='description status'>n/a</p>";
			break;
	}
	return htmlString;
}

doGenerate()
