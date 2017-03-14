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
	var topicList2 = [];
	var allDevice;
	var allDeviceBool = false;
	var prevTopic;
	var newTopicBool = false;

	this.initialize = function(){

		client = new Messaging.Client(hostname, 8883,clientId);

		// Initialize the Realtime Graph
		var rtGraph = new RealtimeGraph();
		
		function updateChart(fakeTopic, fakePayload){
			var topic = fakeTopic;
			var payload = fakePayload;
			
			//First message, instantiate the graph  
		    if (firstMessage) {
				topicList2 = [];
		    	$('#chart').empty();
		    	firstMessage=false;
				topicList2.push(topic);
		    	rtGraph.displayChart(topic,payload,allDeviceBool);
		    } else if(allDeviceBool == true) {
				
				
				
				for(i = 0; i < topicList2.length; i++) {
					console.log("list: " + i + " " + topicList2[i]);
					if(topic == topicList2[i]) {
						newTopicBool = false;
						break;
					} else {
						newTopicBool = true;
					}
				}
				
				
				
				if(newTopicBool) {
					topicList2.push(topic);
					//rtGraph.displayChart(topic,payload);
					rtGraph.addToChart(topic,payload);
				} else {
					rtGraph.graphData(topic,payload,allDeviceBool);
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
		}
		
		client.onMessageArrived = function(msg) {
			
			payload = JSON.parse(msg.payloadString);
			console.log("onMessageArrived msg.payloadString: " + msg.payloadString)
			//hack weather group data
			fakeTopic = msg.destinationName;
			
			console.log("onMessageArrived payload.d.list: " + JSON.stringify( payload.d.list) );
			for(var cityIdx = 0; cityIdx < payload.d.list.length; cityIdx++) {
				var currentWeatherData = 
				currCity = payload.d.list[cityIdx];
				console.log("City: " + currCity.name);
				
				/*
				currCity.main.temp
				currCity.main.pressure
				currCity.main.humidity
				currCity.wind.speed
				*/
				
				
				tempWCStr = "\"" + currCity.name + "_temp\" : " + currCity.main.temp;
				console.log("tempWCStr: " + tempWCStr);
				pressureWCStr = "\"" + currCity.name + "_pressure\" : " + currCity.main.pressure;
				humidityWCStr = "\"" + currCity.name + "_humidity\" : " + currCity.main.humidity;
				windWCStr = "\"" + currCity.name + "_wind\" : " + currCity.wind.speed;
				
				allString = "{ \"d\" : { " + tempWCStr + ", " + pressureWCStr + ", " + humidityWCStr + ", " + windWCStr + " } }"; 
				console.log("allString: " + allString);
				
				updateChart(fakeTopic, JSON.parse(allString));
			}
			
			
			updateChart(fakeTopic, payload);
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

		
		if(allDeviceBool) {
			for(i=0;i<allDevice.length;i++) {
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
		$('#chart').hide(function(){ 
			$('#chart').empty(); 
			$('#chart').show();
			$('#chart').append(imageHTML);
		});
		
		$('#timeline').empty();
		$('#legend').empty();
		firstMessage = true;

		subscribeTopic = "iot-2/type/" + tokens[2] + "/id/" + tokens[3] + "/evt/+/fmt/json";
		client.subscribe(subscribeTopic,subscribeOptions);
	}
	

	// Subscribe to all devices.
	this.plotAllDeviceGraph = function(){
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
		
		var allDeviceString = $("#deviceslist").val();
		allDevice = allDeviceString.split(',');
		
		
		//unsubscribe
			if(subscribeTopic != "") {
				console.log("Unsubscribing to " + subscribeTopic);
				client.unsubscribe(subscribeTopic);
			}	
			
			//clear prev graphs
			$('#chart').hide(function(){ 
				$('#chart').empty(); 
				$('#chart').show();
				$('#chart').append(imageHTML);
			});
		
			$('#timeline').empty();
			$('#legend').empty();
			firstMessage = true;
		
		
		
		for(i=0;i<allDevice.length;i++) {
			//console.log("log: " + allDevice[i]);
		
		
			var tokens = allDevice[i].split(':');
			typeID = tokens[2];
			deviceID = tokens[3];

			subscribeTopic = "iot-2/type/" + tokens[2] + "/id/" + tokens[3] + "/evt/+/fmt/json";
			client.subscribe(subscribeTopic,subscribeOptions);
			topicList.push(subscribeTopic);
		}
		allDeviceBool = true;
	}
	
	this.initialize();

	var imageHTML = '<div class="iotdashboardtext">The selected device is not currently sending events to the Internet of Things Foundation</div><br><div class="iotdashboardtext">Select to view historical data or select a different device.</div> <img class="iotimagesMiddle" align="middle" alt="Chart" src="images/IOT_Icons_Thing02.svg">';
}
