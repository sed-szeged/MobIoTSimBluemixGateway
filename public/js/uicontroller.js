/*******************************************************************************
* Copyright (c) 2014 IBM Corporation and other Contributors.
*
* All rights reserved. This program and the accompanying materials
* are made available under the terms of the Eclipse Public License v1.0
* which accompanies this distribution, and is available at
* http://www.eclipse.org/legal/epl-v10.html
*
* Contributors:
* IBM - Initial Contribution
*******************************************************************************/



// Main UI 
var orgId = "";
var orgName = "";
//flag for historian
var isHistorian = false;
var api_key ="";
var auth_token = "";


var devices = [];
var deviceId;
var allDevice = {};
var deviceTypes = [];
var newTypeBool = false;
var bulkDevices = {};
var bulkDevicesList = {};
var bulkLimit = 5;
var bulkSize = 0;
var flag;




// Get the OrgId and OrgName
$.ajax
({
	type: "GET",
	url: "/api/v0002/organization",
	dataType: 'json',
	async: false,

	success: function (data, status, jq){

		orgId = data.id;
		orgName = data.name;
		api_key = data.api_key;
		auth_token = data.auth_token;
	},
	error: function (xhr, ajaxOptions, thrownError) {
		if(xhr.status === 401 || xhr.status === 403){
			console.log("Not authorized. Check your Api Key and Auth token");
			window.location.href="loginfail";
		}
		console.log("Not able to fetch the Organization details");
		console.log(xhr.status);
		console.log(thrownError);
	}
});

//get the devices list of the org
$.ajax
({
	type: "GET",
	url: "/api/v0002/organization/getdevices",
	dataType: 'json',
	async: true,

	success: function (data, status, jq){
	
		var sumDevices = 0;
		devices = data;
		
		
		//create devices
		for(i=0;i<devices.length;i++) {
			for(var d in devices[i]){
				sumDevices++;
				//console.log(devices[i][d].typeId);
				for(j=0;j<=deviceTypes.length;j++) {
					if(deviceTypes[j] == devices[i][d].typeId) {
						newTypeBool = false;
						break;
					} else {
						newTypeBool = true;
					}
				}
				
				if(newTypeBool) {
					deviceTypes.push(devices[i][d].typeId);
					bulkDevicesList[devices[i][d].typeId] = [];
					allDevice[devices[i][d].typeId] = [];
					allDevice[devices[i][d].typeId].push(devices[i][d].clientId);
				} else {
					allDevice[devices[i][d].typeId].push(devices[i][d].clientId);
				}
			}
		}
		
		
		//sort devices and add to the device list
		for(var i in allDevice) {
			//allDevice[i].sort();
			
			for(var d in allDevice[i]) {
				var tokens = allDevice[i][d].split(':');
				deviceId = tokens[3];
				
				$("#deviceslist").append("<option value="+allDevice[i][d]+">"+deviceId+"</option>");
			}
		}

		
		//create bulk devices
		for(var d in allDevice) {
			if(allDevice[d].length > 5) {
				if(allDevice[d].length == 400 || allDevice[d].length == 450) {
					bulkSize = 50;
					bulkLimit = allDevice[d].length / bulkSize;
				} else {
					bulkLimit = 5;
					bulkSize = Math.floor(allDevice[d].length / bulkLimit);
					//console.log("bulkSize: "+bulkSize);
					if(bulkSize < bulkLimit) {
						var temp = bulkLimit;
						bulkLimit = bulkSize;
						bulkSize = temp;
					}
				}
				var k = 0;
			
				for(i=0;i<bulkLimit;i++) {
					bulkDevices[i] = [];
					
					for(j=0;j<bulkSize;j++) {
						bulkDevices[i].push(allDevice[d][k]);
						//console.log(bulkDevices[i][j]);
						k++;
					}
					console.log(j);

					var tokens = bulkDevices[i][0].split(':');
					var bulkDevicesName = tokens[3];
					tokens = bulkDevices[i][bulkSize-1].split(':');
					tokens = tokens[3].split('_');
					bulkDevicesName += "-"+tokens[tokens.length-1];
					bulkDevices[i].push(bulkDevicesName);
					bulkDevicesList[d][bulkDevicesName] = bulkDevices[i];
					
					$("#bulklist").append("<option value="+bulkDevices[i]+">"+bulkDevicesName+"</option>");
				}
				
				
				//check for remainder
				if(k < allDevice[d].length) {
					bulkDevices[i] = [];
					j = 0;
					while(k < allDevice[d].length)  {
						bulkDevices[i].push(allDevice[d][k]);
						j++;
						k++;
					}

					var tokens = bulkDevices[i][0].split(':');
					var bulkDevicesName = tokens[3];
					tokens = bulkDevices[i][j-1].split(':');
					tokens = tokens[3].split('_');
					bulkDevicesName += "-"+tokens[tokens.length-1];
					bulkDevices[i].push(bulkDevicesName);
					bulkDevicesList[d][bulkDevicesName] = bulkDevices[i];
					
					$("#bulklist").append("<option value="+bulkDevices[i]+">"+bulkDevicesName+"</option>");
				}
				
			}
		}
		
		console.log("Number of devices: "+sumDevices);
		if(sumDevices < 25) {
			$("#deviceslist").append("<option value=''>"+"All device"+"</option>");
		}
		$("#bulklist").append("<option value=''>"+"All group"+"</option>");
		
		
	},
	error: function (xhr, ajaxOptions, thrownError) {
		console.log(xhr.status);
		console.log(thrownError);
	}
});

var realtime = new Realtime(orgId, api_key, auth_token);

var historian = new Historian();
$( "#deviceslist" ).change(function() {
	
	if($( "#deviceslist option:selected" ).text() == "All device") {
		flag = "all";
		realtime.plotBulkDeviceGraph(allDevice, flag);
	} else {
		if(isHistorian){
			historian.plotHistoricGraph();
		} else {
			realtime.plotRealtimeGraph();
		}
	}
});

$( "#bulklist" ).change(function() {

	if($( "#bulklist option:selected" ).text() == "All group") {
		flag = "group";
		realtime.plotBulkDeviceGraph(bulkDevicesList, flag);
	} else {
		realtime.plotBulkDeviceGraph(null,null);
	}
});

//Toggle historian options when user selects historic/live data radio buttons
$('#historic').change(function() {
	$('#historicData').show(500);
	historian.plotHistoricGraph();
	isHistorian = true;
});

$('#realtime').change(function() {
	$('#historicData').hide(500);
	realtime.plotRealtimeGraph();
	isHistorian = false;
});

//plot historic graph when user changes the spinner
$( "#historicTopRange").on( "spinchange", function( event, ui ) {
	historian.plotHistoricGraph();
});

$( "#historicEnds" ).datetimepicker({ onChangeDateTime:function(dp,$input){
    historian.plotHistoricGraph();
  }
});