//Insert current time into add planned action
date = new Date();
$("#AP-time").val( date.getHours() + ":" + date.getMinutes());
$("#AP-date").val( date.getFullYear() + "-" + ("0" + (date.getMonth() + 1)).slice(-2) + "-" + ("0" + date.getDate()).slice(-2));


//Button triggers
$('a[data-cmd]').click(function () {
	var actions = $(this).attr("data-cmd");
	var ajax = $.ajax("/cmd?cmd=" + actions)
	
	ajax.done(function(response) {$(".status").html("Kommando skickat: " + response);})
	ajax.fail(function() {$(".status").html('FEL: Anslutningen kunde inte upprättas.');})
	
	console.log("[CMD Sent]: " + actions);
 });
 
$('#doAdvancedCommand').click(function () {
	var actions = '[{"command":"' + $("#AC-command").val() + '","id":"' + $("#AC-id").val() + '", "delay": "' + $("#AC-delay").val() + '"}]';
	var ajax = $.ajax("/cmd?cmd=" + actions)

	ajax.done(function(response) {$(".status").html("Kommando skickat: " + response);})
	ajax.fail(function() {$(".status").html('FEL: Anslutningen kunde inte upprättas.');})

	console.log("[CMD Sent]: " + actions);
});

$('#addPlannedCommand').click(function () {
	var timedate = new Date($("#AP-date").val() + " " + $("#AP-time").val())
	
	if (timedate == "Invalid Date") {alert("Invalid Date");}
	
	var actions = '[{"command":"' + $("#AP-command").val() + '","id":"' + $("#AP-id").val() + '", "timedate": "' + timedate.getTime() + '"}]';
	var ajax = $.ajax("/cmd?cmd=" + actions)

	ajax.done(function(response) {$(".status").html("Kommando skickat: " + response);})
	ajax.fail(function() {$(".status").html('FEL: Anslutningen kunde inte upprättas.');})

	console.log("[CMD Sent]: " + actions);
});

$('#refreshPlannedCommands').click(function () {
	updatePlannedList();
});

 
//Update list of planned actions
$('#plannedActions').live('pageload', updatePlannedList());

function updatePlannedList() {
	var ajax = $.ajax("/plannedActions")
	
	ajax.done(function(response) {
		var listHTML = "";
		
		JSON.parse(response).forEach(function(action) {
			var date = new Date(parseInt(action.value.timedate));
			var dateString = date.getFullYear() + "-" + ("0" + (date.getMonth() + 1)).slice(-2) + "-" +	("0" + date.getDate()).slice(-2) + " " + ("0" + date.getHours()).slice(-2) + ":" + ("0" + date.getMinutes()).slice(-2);
			
			listHTML += "<li>";
			listHTML += "<h1>" + dateString + "</h1>";
			listHTML += "<p>" + action.value.id + " " + action.value.command + "</p>";
			listHTML += "<div class='rmPlanned'><a href='#' data-role='none' data-databaseId=" + action.id + " data-databaseRev=" + action.value.rev + ">&#215;</a></div></li>";
			listHTML += "</li>";
		});
		
		$("#plannedActionsList").html(listHTML);
		$('#plannedActionsList').listview('refresh');
		
		$('a[data-databaseId]').click(function () {
			var ajax = $.ajax("/removePlannedAction?id=" + $(this).attr("data-databaseId") + "&rev=" + $(this).attr("data-databaseRev"))
			
			ajax.done(function(response) {$(".status").html("Kommando borttaget: " + response);})
			ajax.fail(function() {$(".status").html('FEL: Anslutningen kunde inte upprättas.');})
			
			
		 });
	});
	
	ajax.fail(function() {alert("ERROR")})
}