//Button triggers
$('a[data-cmd]').click(function () {
	var actions = $(this).attr("data-cmd");
	var ajax = $.ajax("/cmd?cmd=" + actions)
	
	ajax.done(function(response) {$("#tellstickResult").html("Kommando skickat: " + response);})
	ajax.fail(function() {$("#tellstickResult").html('FEL: Anslutningen kunde inte upprättas.');})
	
	console.log("[CMD Sent]: " + actions);
 });
 
 $('#doAdvancedCommand').click(function () {
	var actions = '[{"command":"' + $("#command").val() + '","id":"' + $("#id").val() + '", "delay": "' + $("#delay").val() + '"}]';
	var ajax = $.ajax("/cmd?cmd=" + actions)
	
	ajax.done(function(response) {$("#tellstickResult").html("Kommando skickat: " + response);})
	ajax.fail(function() {$("#tellstickResult").html('FEL: Anslutningen kunde inte upprättas.');})
	
	console.log("[CMD Sent]: " + actions);
 });
