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

var messageOrder = [];
var globalKey = 0;
var seriesData = [];


var RealtimeGraph = function(){

	var palette = new Rickshaw.Color.Palette( { scheme: [
		"#7f1c7d",
	 	"#00b2ef",
		"#00649d",
		"#00a6a0",
		"#ee3e96",
		"#990000",
		"#99cc00",
		"#9900ff",
		"#5e8000",
		"#b3b300",
		"#804000",
		"#8a8a5c"
    ] } );

	// function to invoke Rickshaw and plot the graph
	this.drawGraph = function(seriesData)
	{
		// instantiate our graph!
		this.palette = palette;

		this.graph = new Rickshaw.Graph( {
			element: document.getElementById("chart"),
			width: 900,
			height: 500,
			renderer: 'line',
			stroke: true,
			preserve: true,
			series: seriesData	
		} );

		this.graph.render();

		
		
		this.hoverDetail = new Rickshaw.Graph.HoverDetail( {
			graph: this.graph,
			xFormatter: function(x) {
				return new Date(x * 1000).toString();
			}
		} );

		this.annotator = new Rickshaw.Graph.Annotate( {
			graph: this.graph,
			element: document.getElementById('timeline')
			//element: "pizza"
		} );

		this.legend = new Rickshaw.Graph.Legend( {
			graph: this.graph,
			element: document.getElementById('legend')

		} );

		this.shelving = new Rickshaw.Graph.Behavior.Series.Toggle( {
			graph: this.graph,
			legend: this.legend
		} );

		this.order = new Rickshaw.Graph.Behavior.Series.Order( {
			graph: this.graph,
			legend: this.legend
		} );

		this.highlighter = new Rickshaw.Graph.Behavior.Series.Highlight( {
			graph: this.graph,
			legend: this.legend
		} );

		this.smoother = new Rickshaw.Graph.Smoother( {
			graph: this.graph,
			element: document.querySelector('#smoother')
		} );

		this.ticksTreatment = 'glow';

		this.xAxis = new Rickshaw.Graph.Axis.Time( {
			graph: this.graph,
			ticksTreatment: this.ticksTreatment,
			timeFixture: new Rickshaw.Fixtures.Time.Local()
		} );

		this.xAxis.render();

		this.yAxis = new Rickshaw.Graph.Axis.Y( {
			graph: this.graph,
			tickFormat: Rickshaw.Fixtures.Number.formatKMBT,
			ticksTreatment: this.ticksTreatment
		} );

		this.yAxis.render();


		this.controls = new RenderControls( {
			element: document.querySelector('form'),
			graph: this.graph
		} );

	}

	this.graphData = function(topic, data, allDeviceBool, weatherData)
	{
		
		
		var timestamp = Date.now()/1000;
		var maxPoints = 15;
		var dataObject;		
		
		//var savedGraph;
		
		if(allDeviceBool) {
			for(i=0;i<messageOrder.length;i++) {
				if(messageOrder[i].topic == topic) {
					key = messageOrder[i].key;
					//console.log("megvan a kulcs: " + key);
					break;
				}
			}
		} else {
			key = 0;
		}
		
		/*
		for(i=0;i<globalKey;i++) {
			savedGraph = this.graph.series[i];
			console.log("mentett gráfok: " + i + "  " + savedGraph);
		}
		*/
		
		//check if weatherData
		if(weatherData) {
			dataObject = {
				temp: data.d.main.temp,
				humidity: data.d.main.humidity,
				wind_speed: data.d.wind.speed
			};
		} else {
			dataObject = data.d;
		}
	
		for (var j in dataObject)
		{
			if (typeof dataObject[j] !== 'string') {
						
				this.graph.series[key].data.push({x:timestamp,y:dataObject[j]});
				if (this.graph.series[key].data.length > maxPoints) {
					this.graph.series[key].data.splice(0,1);//only display up to maxPoints
				}
				key++;
			}
		}
		
		this.graph.render();
	}
	
	
	this.bulkGraphData = function(topic, bulkData, deviceType,weatherData)
	{
		
		
		var timestamp = Date.now()/1000;
		var maxPoints = 15; 
		var dataObject;
		var sumData;
		var avgData;
		
		console.log("graphDeviceType: "+deviceType);
		if(deviceType == "group") {
			
			for(i=0;i<messageOrder.length;i++) {
				if(messageOrder[i].topic == topic) {
					key = messageOrder[i].key;
					//console.log("megvan a kulcs: " + key);
					break;
				}
			}
		} else {
			key = 0;
		}
		
		/*
		//check if weatherData and build the Weather object
		if(weatherData) {
			dataObject = {
				temp: data.d.main.temp,
				humidity: data.d.main.humidity,
				wind_speed: data.d.wind.speed
			};
		} else {
			dataObject = data.d;
		}
		*/
		for(var i in bulkData) {
			console.log("bulkLength: "+bulkData[i].length)
			sumData = 0;
			for(var j in bulkData[i]) {
				//console.log("bulkData: " +bulkData[i][j]);
				sumData += bulkData[i][j];
			}
			avgData = sumData / bulkData[i].length;
			console.log("avgData"+i+": "+avgData);
			
			this.graph.series[key].data.push({x:timestamp,y:avgData});
		
			if (this.graph.series[key].data.length > maxPoints) {
				this.graph.series[key].data.splice(0,1);//only display up to maxPoints
			}
			key++;
		}
		
		this.graph.render();
	}
	

	
	
	this.displayChart = function(topic, data, deviceType, weatherData){

		var timestamp = Date.now()/1000;
		var tokens;
		var dataObject;
		
		globalKey = 0;
		
		if(deviceType == "all" || deviceType == "group") {
			
			device = {};
			device.topic = topic;
			device.key = globalKey;
			messageOrder.push(device);
		
		} else {
			seriesData = [];
		}
		
		if(deviceType != "bulk" || deviceType != "group") {
			tokens = topic.split('/');
		}
		
		//check if weatherData and build the Weather object
		if(weatherData) {
			dataObject = {
				temp: data.d.main.temp,
				humidity: data.d.main.humidity,
				wind_speed: data.d.wind.speed
			};
		} else {
			dataObject = data.d;
		}
		
		for (var j in dataObject)
		{
			//console.log(data.d);
			if (typeof dataObject[j] !== 'string') {
				
				seriesData[globalKey]={};
				if(deviceType == "bulk" || deviceType == "group") {
					seriesData[globalKey].name=topic + " - " + j;
				} else if(weatherData && deviceType == "normal") {
					seriesData[globalKey].name=data.d.name + " - " + j;
				} else {
					seriesData[globalKey].name=tokens[4] + " - " + j;
				}

				
				seriesData[globalKey].color = palette.color();
				
				
				seriesData[globalKey].data=[];
			
				seriesData[globalKey].data[0]={};
				seriesData[globalKey].data[0].x = timestamp;
				seriesData[globalKey].data[0].y = dataObject[j];
				
					/*
					if(data.d[j]>10){
						seriesData[key].data[0].color = 'red';
					}else{
						seriesData[key].data[0].color = 'green';
					}
					*/
				
				globalKey++;
			}
		}
		
		
		//console.log("globalKey: ", globalKey);
		this.drawGraph(seriesData);
	}
	
	this.addToChart = function(topic, data, deviceType, weatherData) {
		
		var key = 0;
		var tokens;
		var dataObject;
		
		var timestamp = Date.now()/1000;
		
		device = {};
		device.topic = topic;
		device.key = globalKey;
		messageOrder.push(device);
		
		if(deviceType != "group") {
			tokens = topic.split('/');
		}
		
		//check if weatherData and build the Weather object
		if(weatherData) {
			dataObject = {
				temp: data.d.main.temp,
				humidity: data.d.main.humidity,
				wind_speed: data.d.wind.speed
			};
		} else {
			dataObject = data.d;
		}
		
		for (var j in dataObject)
		{

			if (typeof dataObject[j] !== 'string') {
			
				seriesData[globalKey]={};
				if(deviceType == "group") {
					seriesData[globalKey].name=topic + " - " + j;
				} else if(weatherData && deviceType == "all") {
					seriesData[globalKey].name=data.d.name + " - " + j;
				} else {
					seriesData[globalKey].name=tokens[4] + " - " + j;
				}
				
				seriesData[globalKey].color = palette.color();
				
				
				seriesData[globalKey].data=[];
			
				seriesData[globalKey].data[0]={};
				seriesData[globalKey].data[0].x = timestamp;
				seriesData[globalKey].data[0].y = dataObject[j];	
				
				globalKey++;
			}
		}
		
		$('#legend').empty();
		this.legend = new Rickshaw.Graph.Legend( {
			graph: this.graph,
			element: document.getElementById('legend')

		} );
	}
};
