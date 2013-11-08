//insert current time into add planned action
date = new Date();
$("#AP-time").val( date.getHours() + ":" + date.getMinutes());
$("#AP-date").val( date.getFullYear() + "-" + ("0" + (date.getMonth() + 1)).slice(-2) + "-" + ("0" + date.getDate()).slice(-2));

//Button triggers
$('a[data-cmd]').click(function () {
	var actions = $(this).attr("data-cmd");
	var ajax = $.ajax("/cmd?cmd=" + actions)
	
	ajax.done(function(response) {$("#tellstickResult").html("Kommando skickat: " + response);})
	ajax.fail(function() {$("#tellstickResult").html('FEL: Anslutningen kunde inte upprättas.');})
	
	console.log("[CMD Sent]: " + actions);
 });
 
$('#doAdvancedCommand').click(function () {
	var actions = '[{"command":"' + $("#AC-command").val() + '","id":"' + $("#AC-id").val() + '", "delay": "' + $("#AC-delay").val() + '"}]';
	var ajax = $.ajax("/cmd?cmd=" + actions)

	ajax.done(function(response) {$("#tellstickResult").html("Kommando skickat: " + response);})
	ajax.fail(function() {$("#tellstickResult").html('FEL: Anslutningen kunde inte upprättas.');})

	console.log("[CMD Sent]: " + actions);
});

$('#addPlannedCommand').click(function () {
	var timedate = new Date($("#AP-date").val() + " " + $("#AP-time").val())
	
	if (timedate == "Invalid Date") {alert("Invalid Date");}
	
	var actions = '[{"command":"' + $("#AP-command").val() + '","id":"' + $("#AP-id").val() + '", "timedate": "' + timedate.getTime() + '"}]';
	var ajax = $.ajax("/cmd?cmd=" + actions)

	ajax.done(function(response) {$("#tellstickResult").html("Kommando skickat: " + response);})
	ajax.fail(function() {$("#tellstickResult").html('FEL: Anslutningen kunde inte upprättas.');})

	console.log("[CMD Sent]: " + actions);
});
