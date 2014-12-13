//------------------------
// BUTTONS EVENTS
//------------------------

//Button triggers
$('a[data-cmd]').click(function (event) {
	event.preventDefault();
	var actions = $(this).attr("data-cmd");
	var ajax = $.ajax("/cmd?cmd=" + actions)
	
	ajax.done(function(response) {$(".status").html("Kommando skickat: " + response.replace("<script>window.location = '/';</script>",""));})
	ajax.fail(function() {$(".status").html('FEL: Anslutningen kunde inte upprättas.');})
	
	console.log("[CMD]: " + actions);
 });
 
$('#doAdvancedCommand').click(function (event) {
	event.preventDefault();
	var actions = '[{"command":"' + $("#AC-command").val() + '","id":"' + $("#AC-id").val() + '", "delay": "' + $("#AC-delay").val() + '"}]';
	var ajax = $.ajax("/cmd?cmd=" + actions)

	ajax.done(function(response) {$(".status").html("Kommando skickat: " + response.replace("<script>window.location = '/';</script>",""));})
	ajax.fail(function() {$(".status").html('FEL: Anslutningen kunde inte upprättas.');})

	console.log("[CMD]: " + actions);
});

$('#addPlannedCommand').click(function (event) {
	event.preventDefault();
	var timedate = new Date($("#AP-date").val() + " " + $("#AP-time").val())
	
	if (timedate == "Invalid Date") {alert("Invalid Date"); return}
	
	var actions = '[{"command":"' + $("#AP-command").val() + '","id":"' + $("#AP-id").val() + '", "timedate": "' + timedate.getTime() + '"}]';
	var ajax = $.ajax("/cmd?cmd=" + actions)

	ajax.done(function(response) {$(".status").html("Kommando skickat: " + response.replace("<script>window.location = '/';</script>",""));})
	ajax.fail(function() {$(".status").html('FEL: Anslutningen kunde inte upprättas.');})

	updatePlannedList();
	console.log("[CMD]: " + actions);
});

$('#refreshPlannedCommands').click(function (event) {
	event.preventDefault();
	updatePlannedList();
});

//------------------------
// PAGE LOAD EVENTS
//------------------------

//Update list of planned actions
updatePlannedList();
date = new Date();
$("#AP-time").val( ("0" + date.getHours()).slice(-2) + ":" + ("0" + date.getMinutes()).slice(-2));
$("#AP-date").val( date.getFullYear() + "-" + ("0" + (date.getMonth() + 1)).slice(-2) + "-" + ("0" + date.getDate()).slice(-2));

function updatePlannedList() {
	var ajax = $.ajax("/plannedActions")
	console.log("[INFO]: Updating list");
	
	ajax.done(function(response) {
		var listHTML = "";
		
		JSON.parse(response).forEach(function(action) {
			var date = new Date(parseInt(action.timedate));
			var dateString = date.getFullYear() + "-" + ("0" + (date.getMonth() + 1)).slice(-2) + "-" +	("0" + date.getDate()).slice(-2) + " " + ("0" + date.getHours()).slice(-2) + ":" + ("0" + date.getMinutes()).slice(-2);
			
			listHTML += "<li>";
			listHTML += "<h1>" + dateString + "</h1>";
			listHTML += "<p>" + action.id + " " + action.command + "</p>";
			listHTML += "<div class='rmPlanned'><a href='#' data-role='none' data-databaseId=" + action.databaseId + " >&#215;</a></div></li>";
			listHTML += "</li>";
		});
				
		console.log("[INFO]: List updated");
		
		$("#plannedActionsList").html(listHTML);
		
		$('a[data-databaseId]').click(function (event) {
			event.preventDefault();
			var ajax = $.ajax("/removePlannedAction?id=" + $(this).attr("data-databaseId") + "&rev=" + $(this).attr("data-databaseRev"))
			
			ajax.done(function(response) {$(".status").html("Kommando borttaget: " + response);})
			ajax.fail(function() {$(".status").html('FEL: Anslutningen kunde inte upprättas.');})
			
			updatePlannedList();
		 });
	});
	
	ajax.fail(function() {$(".status").html('FEL: Anslutningen kunde inte upprättas.');})
}
