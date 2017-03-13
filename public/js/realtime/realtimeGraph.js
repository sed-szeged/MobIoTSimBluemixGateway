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

var parametersPerDevice = [];
var globalKey = 0;
var seriesData = [];


var RealtimeGraph = function(){

	var palette = new Rickshaw.Color.Palette( { scheme: [
		"#7f1c7d",
	 	"#00b2ef",
		"#00649d",
		"#00a6a0",
		"#ee3e96"
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

	this.graphData = function(topic, data, allDeviceBool)
	{
		
		var key;
		
	
		var timestamp = Date.now()/1000;
		var maxPoints = 25; 
		
		//var savedGraph;
		
		if(allDeviceBool) {
			for(i=0;i<parametersPerDevice.length;i++) {
				if(parametersPerDevice[i].topic == topic) {
					key = parametersPerDevice[i].key;
					console.log("megvan a kulcs: " + key);
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
		
	
		for (var j in data.d)
		{
			if (typeof data.d[j] !== 'string') {
						
				this.graph.series[key].data.push({x:timestamp,y:data.d[j]});
				if (this.graph.series[key].data.length > maxPoints) {
					this.graph.series[key].data.splice(0,1);//only display up to maxPoints
				}
				key++;
			}
		}
		
		this.graph.render();
	}
	

	this.displayChart = function(topic,data,allDeviceBool){

		var timestamp = Date.now()/1000;
		
		globalKey = 0;
		
		if(allDeviceBool) {
			device = {};
			device.topic = topic;
			device.key = globalKey;
			parametersPerDevice.push(device);
			console.log("device.topic: " + device.topic);
			console.log("device.key: " + device.key);
			
			for(i=0;i<parametersPerDevice.length;i++) {
				console.log("parametersPerDevice: " + i + " " + parametersPerDevice[i].topic);
			}
			
		} else {
			//globalKey = 0;
			seriesData = [];
		}
		
		var tokens = topic.split('/');
		
		for (var j in data.d)
		{

			if (typeof data.d[j] !== 'string') {
			
			seriesData[globalKey]={};
			//seriesData[globalKey].name=j;
			seriesData[globalKey].name=tokens[4] + " - " + j;

			
			seriesData[globalKey].color = palette.color();
			
			
			seriesData[globalKey].data=[];
		
			seriesData[globalKey].data[0]={};
			seriesData[globalKey].data[0].x = timestamp;
			seriesData[globalKey].data[0].y = data.d[j];
			
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
		console.log("globalKey: ", globalKey);
		this.drawGraph(seriesData);
	}
	
	this.addToChart = function(topic, data) {
		
		var key = 0;
		//var seriesData = [];
		
		var timestamp = Date.now()/1000;
		
		device = {};
		device.topic = topic;
		device.key = globalKey;
		parametersPerDevice.push(device);
		console.log("device.topic: " + device.topic);
		console.log("device.key: " + device.key);
		
		var tokens = topic.split('/');
		
		for (var j in data.d)
		{

			if (typeof data.d[j] !== 'string') {
			
			seriesData[globalKey]={};
			seriesData[globalKey].name=tokens[4] + " - " + j;
			
			seriesData[globalKey].color = palette.color();
			
			
			seriesData[globalKey].data=[];
		
			seriesData[globalKey].data[0]={};
			seriesData[globalKey].data[0].x = timestamp;
			seriesData[globalKey].data[0].y = data.d[j];
			console.log("data: " + seriesData[globalKey].data[0].y);
			console.log("chart sorszáma: " + globalKey);
			
			
			globalKey++;
			}
		}
		console.log("globalKey: ", globalKey);
		
		$('#legend').empty();
		this.legend = new Rickshaw.Graph.Legend( {
			graph: this.graph,
			element: document.getElementById('legend')

		} );
	}
};
