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
// export
var util = {};

var fs = require('fs');
var https = require('https');
var querystring = require('querystring');

//Basic HTTP options for Internet of Things Foundation
var iot_foundation_api_options = {
  port: 443,
  rejectUnauthorized: false
};

util.orgId = null;

util.iot_httpCall = function( URI, api_key, auth_token, res, queryObj, sendCred){

  iot_foundation_api_options.hostname = util.orgId+'.internetofthings.ibmcloud.com';
  iot_foundation_api_options.auth = api_key + ':' + auth_token;
  iot_foundation_api_options.path=URI;
  if(queryObj){
    console.log("Query called with : "+querystring.stringify(queryObj)); 
    iot_foundation_api_options.path=URI+"?"+querystring.stringify(queryObj);
  }
  
  var http_req = https.get(iot_foundation_api_options, function(http_res) {
    var data = [];
    //check for http success
    if (http_res.statusCode==200)
    {
      http_res.on('data', function(chunk) {
        data.push(chunk);
        
      });

      http_res.on('end',function(){
        var result = JSON.parse(data.join(''));
        if(sendCred){
          result.api_key = api_key;
          result.auth_token = auth_token;
        }
        // send the response
        res.json(result);
      });
    }
    else
    {
      console.log('Request for ' + iot_foundation_api_options.path + ' did not succeed and returned HTTP Status code ' + http_res.statusCode);
      //pass the status code to the http response
      res.status(http_res.statusCode).send();
    }

  });
  http_req.end();
  http_req.on('error', function(e) {
    console.log('Request for ' + iot_foundation_api_options.path + ' failed with : \n'+ e);
    res.status(500).send(e);
  });


};

util.paging = function(api_key, auth_token, res, queryObj, devices) {
	
	if(queryObj) {
		util.getDevices(api_key, auth_token, res, queryObj, devices);
	} else {
		util.getDevices(api_key, auth_token, res, null, devices);
	}
	
}

util.getDevices = function( api_key, auth_token, res, queryObj, devices) {
  
  var bookmark;
  
  iot_foundation_api_options.hostname = util.orgId+'.internetofthings.ibmcloud.com';
  iot_foundation_api_options.auth = api_key + ':' + auth_token;
  iot_foundation_api_options.path='/api/v0002/bulk/devices';
  if(queryObj){
    console.log("Query called with : "+querystring.stringify(queryObj)); 
    iot_foundation_api_options.path='/api/v0002/bulk/devices'+"?"+querystring.stringify(queryObj);
  }

  var http_req = https.get(iot_foundation_api_options, function(http_res) {
    var data = [];
	
    //check for http success
    if (http_res.statusCode==200)
    {

      http_res.on('data', function(chunk) {
        data.push(chunk);
      });

      http_res.on('end',function(){
		  
		var result = JSON.parse(data.join(''));
		devices.push(result.results);
		
		if(result.bookmark) {
			queryObj = {_bookmark: result.bookmark};
			util.paging(api_key, auth_token, res, queryObj, devices);
		} else {
			queryObj = null;
			
			console.log("Total rows = "+result.meta.total_rows);

			// send the response
			res.json(devices);
		}  
      });
    }
    else
    {
      console.log('Request for ' + iot_foundation_api_options.path + ' did not succeed and returned HTTP Status code ' + http_res.statusCode);
      //pass the status code to the http response
      res.status(http_res.statusCode).send();
    }
  });
  
  http_req.end();
  http_req.on('error', function(e) {
    console.log('Request for ' + iot_foundation_api_options.path + ' failed with : \n'+ e);
    res.status(500).send(e);
  });


};


module.exports = util;