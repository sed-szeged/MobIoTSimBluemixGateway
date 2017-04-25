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

var subscribeTopic = "";

var Realtime = function(orgId, api_key, auth_token) {

	var firstMessage = true;

	var clientId="a:"+orgId+":" +Date.now();

	console.log("clientId: " + clientId);
	var hostname = orgId+".messaging.internetofthings.ibmcloud.com";
	var client;

	var typeID;
	var deviceID;
	
	var topicList = [];
	var topicList2 = {};
	var groupTopicList = {};
	var groupDeviceBool = false;
	var allDevice;
	var allDeviceBool = false;
	var bulkDevice;
	var bulkDeviceBool = false;
	var bulkDeviceName;
	var bulkDevicesList;
	var bulkData = {};
	var prevTopic;
	var newTopicBool = false;
	var deviceType;
	var deviceTokens;

	
	
	this.initialize = function(){

		client = new Messaging.Client(hostname, 8883,clientId);

		// Initialize the Realtime Graph
		var rtGraph = new RealtimeGraph();
		var parameterName;
		
		client.onMessageArrived = function(msg) {
			
			var topic = msg.destinationName;
			
			var tokens;
			var exitLoop = false;
			console.log(deviceType);
			if(deviceType == "group") {
				tokens = msg.destinationName.split('/')
				topic = tokens[4];
			}
			
		
			
			var payload = JSON.parse(msg.payloadString);
			//console.log("payload:"+msg.payloadString);
			
			//First message, instantiate the graph  
		    if (firstMessage) {
				topicList2 = [];
		    	$('#chart').empty();
		    	firstMessage=false;
				if(deviceType == "group") {
					
					var i = tokens[2];
					
					for(var j in bulkDevicesList[i]) {
						for(var k in bulkDevicesList[i][j]) {
							deviceTokens = bulkDevicesList[i][j][k].split(':');
							if(deviceTokens[3] == topic) {
								topicList2[j] = bulkDevicesList[i][j];
								bulkData[j] = [];
								bulkDeviceName = j;
								break;
							}
						}
					}
					
				} else {
					topicList2.push(topic);
				}
				
				if(deviceType == "group" || deviceType == "bulk") {
					topic = bulkDeviceName;
				}
				
		    	rtGraph.displayChart(topic,payload,deviceType);
		    } else if(groupDeviceBool) {
				
				var i, j;
				for(i in topicList2) {
					for(j in topicList2[i]) {
						deviceTokens = topicList2[i][j].split(':');
						
						if(topic == deviceTokens[3]) {
							//console.log("régi topic");
							newTopicBool = false;
							exitLoop = true;
							break;
						} else {
							newTopicBool = true;
						}
						
						
					}
					if(exitLoop) {
						break;
					}
				}
				
				if(newTopicBool) {
					//console.log("newpTopic: "+topic+" - (i) "+i);
					for(var k in groupTopicList) {
						for(var l in groupTopicList[k]) {
							deviceTokens = groupTopicList[k][l].split(':');
							if(deviceTokens[3] == topic) {
								topicList2[k] = groupTopicList[k];
								bulkData[k] = [];
							
								rtGraph.addToChart(k,payload,deviceType);
								break;
							}
						}
					}
					
				} else {
					//console.log(topic+" - (i) "+i);
					var p;
					for(p in payload.d) {
						console.log(Object.keys(bulkData[i]).length);
						if(Object.keys(bulkData[i]).length < Object.keys(payload.d).length) {
							bulkData[i][p] = [];
							parameterName = p;
						}
					
						bulkData[i][p].push(payload.d[p]);
						//console.log(bulkData[i][p]);
					}
				
					if(bulkData[i][p].length == groupTopicList[i].length-1) {
						rtGraph.bulkGraphData(i,bulkData[i],deviceType);
						bulkData[i] = {};
						parameterName = null;
					}		
							
							
				}
			
			} else if(allDeviceBool == true) {
				
				for(i = 0; i < topicList2.length; i++) {
					if(topic == topicList2[i]) {
						newTopicBool = false;
						break;
					} else {
						newTopicBool = true;
					}
				}
				
				
				
				if(newTopicBool) {
					topicList2.push(topic);
					rtGraph.addToChart(topic,payload);
				} else {
					rtGraph.graphData(topic,payload,allDeviceBool);
				}
				
				
			} else if(bulkDeviceBool == true) {
				
				for(var j in payload.d) {
					if(Object.keys(bulkData).length < Object.keys(payload.d).length && bulkData.constructor === Object) {
						bulkData[j] = [];
						parameterName = j;
					}
			
					bulkData[j].push(payload.d[j]);
					//console.log(bulkData[j]);
				}
				
				if(bulkData[parameterName].length == topicList.length) {
					rtGraph.bulkGraphData(bulkDeviceName,bulkData,deviceType);
					bulkData = {};
					parameterName = null;
				}
			} else {
				
				rtGraph.graphData(topic,payload,allDeviceBool);
			}

			
			for (var j in payload.d) {
				if (typeof payload.d[j] !== 'string') {
					console.log("payload.d[j]: " + payload.d[j]);
					/*
					if(payload.d[j] > 20){
						var warningMsg = new Messaging.Message("{ \"cmd\" : \"warning (" + payload.d[j] + ")\" }");
						var commandTopic = "iot-2/type/" + typeID + "/id/" + deviceID + "/cmd/" + "cid" + "/fmt/json";
						warningMsg.destinationName = commandTopic;
						console.log("warningMsg.destinationName: " + commandTopic);
						client.send(warningMsg);
					}
					*/
				}
			}
			
		};

		client.onConnectionLost = function(e){
			console.log("Connection Lost at " + Date.now() + " : " + e.errorCode + " : " + e.errorMessage);
			this.connect(connectOptions);
		}

		var connectOptions = new Object();
		connectOptions.keepAliveInterval = 3600;
		connectOptions.useSSL=true;
		connectOptions.userName=api_key;
		connectOptions.password=auth_token;

		connectOptions.onSuccess = function() {
			console.log("MQTT connected to host: "+client.host+" port : "+client.port+" at " + Date.now());
		}

		connectOptions.onFailure = function(e) {
			console.log("MQTT connection failed at " + Date.now() + "\nerror: " + e.errorCode + " : " + e.errorMessage);
		}

		console.log("about to connect to " + client.host);
		client.connect(connectOptions);
	}
	

	// Subscribe to the device when the device ID is selected.
	this.plotRealtimeGraph = function(){
		var subscribeOptions = {
			qos : 0,
			onSuccess : function() {
				console.log("subscribed to " + subscribeTopic);
			},
			onFailure : function(){
				console.log("Failed to subscribe to " + subscribeTopic);
				console.log("As messages are not available, visualization is not possible");
			}
		};
		
		var item = $("#deviceslist").val();
		var tokens = item.split(':');
		typeID = tokens[2];
		deviceID = tokens[3];
		

		
		if(allDeviceBool || bulkDeviceBool) {
			for(i=0;i<topicList.length;i++) {
				console.log("Unsubscribing to " + topicList[i]);
				client.unsubscribe(topicList[i]);
				console.log("unsubscribed " + i);
			}
			allDeviceBool = false;
			bulkDeviceBool = false;
		}
		
		if(subscribeTopic != "") {
			console.log("Unsubscribing to " + subscribeTopic);
			client.unsubscribe(subscribeTopic);
		}

		
		//clear prev graphs
		$('#chart').empty(); 
		$('#chart').show();
		$('#chart').append(imageHTML);
		
		
		$('#timeline').empty();
		$('#legend').empty();
		firstMessage = true;
		deviceType = "normal";

		subscribeTopic = "iot-2/type/" + tokens[2] + "/id/" + tokens[3] + "/evt/+/fmt/json";
		client.subscribe(subscribeTopic,subscribeOptions);
	}
	

	
	// Subscribe to all/bulk/group devices.
	this.plotBulkDeviceGraph = function(devicesObject,flag) {
		var subscribeOptions = {
			qos : 0,
			onSuccess : function() {
				console.log("subscribed to " + subscribeTopic);
			},
			onFailure : function(){
				console.log("Failed to subscribe to " + subscribeTopic);
				console.log("As messages are not available, visualization is not possible");
			}
		};
		
			//unsubscribe
			if(groupDeviceBool) {
				for(i=0;i<topicList.length;i++) {
					console.log("Unsubscribing to " + topicList[i]);
					client.unsubscribe(topicList[i]);
					console.log("unsubscribed " + i);
				}
				groupDeviceBool = false;
				bulkData = {};
				
				
			} else if(allDeviceBool || bulkDeviceBool) {
				for(i=0;i<topicList.length;i++) {
					console.log("Unsubscribing to " + topicList[i]);
					client.unsubscribe(topicList[i]);
					console.log("unsubscribed " + i);
				}
				allDeviceBool = false;
			}
		
			if(subscribeTopic != "") {
				console.log("Unsubscribing to " + subscribeTopic);
				client.unsubscribe(subscribeTopic);
			}	
			
			//clear prev graphs
			$('#chart').empty(); 
			$('#chart').show();
			$('#chart').append(imageHTML);
		
			$('#timeline').empty();
			$('#legend').empty();
			firstMessage = true;
			topicList = [];
			bulkData = {};
		
		if(flag == "all") {
			allDevice = devicesObject;
			deviceType = "all";
			
			for(var i in allDevice) {
				for(var j in allDevice[i]) {
					var tokens = allDevice[i][j].split(':');
					typeID = tokens[2];
					deviceID = tokens[3];

					subscribeTopic = "iot-2/type/" + tokens[2] + "/id/" + tokens[3] + "/evt/+/fmt/json";
					client.subscribe(subscribeTopic,subscribeOptions);
					topicList.push(subscribeTopic);
				}
			}
			allDeviceBool = true;
			
		} else if(flag == "group") {
			bulkDevicesList = devicesObject;
			deviceType = "group";
			
			for(var i in bulkDevicesList) {
				for(var j in bulkDevicesList[i]) {
					for(var k in bulkDevicesList[i][j]) {
						
						var tokens = bulkDevicesList[i][j][k].split(':');
						
						if(tokens.length == 1) {
							bulkDeviceName = tokens[0];
							break;
						}
						
						typeID = tokens[2];
						deviceID = tokens[3];

						subscribeTopic = "iot-2/type/" + tokens[2] + "/id/" + tokens[3] + "/evt/+/fmt/json";
						client.subscribe(subscribeTopic,subscribeOptions);
						topicList.push(subscribeTopic);
					}
					
				groupTopicList[j] = (bulkDevicesList[i][j]);	
				}
			}
			groupDeviceBool = true;
		
		} else {
			
			deviceType = "bulk";
			selectValue = $("#bulklist").val();
			bulkDevice = selectValue.split(',');
			
			for(var i in bulkDevice) {
				var tokens = bulkDevice[i].split(':');
				if(tokens.length == 1) {
					bulkDeviceName = tokens[0];
					break;
				}
					typeID = tokens[2];
					deviceID = tokens[3];

					subscribeTopic = "iot-2/type/" + tokens[2] + "/id/" + tokens[3] + "/evt/+/fmt/json";
					client.subscribe(subscribeTopic,subscribeOptions);
					topicList.push(subscribeTopic);
			}
			bulkDeviceBool = true;
		}
	}
	
	this.initialize();

	var imageHTML = '<div class="iotdashboardtext">The selected device is not currently sending events to the Internet of Things Foundation</div><br><div class="iotdashboardtext">Select to view historical data or select a different device.</div> <img class="iotimagesMiddle" align="middle" alt="Chart" src="images/IOT_Icons_Thing02.svg">';
}
