var https = require('https');
var http = require('http');
var events = require('events');
var util = require('util');
var eventEmitter = new events.EventEmitter();


exports.handler = (event, context) => { 

  try {

    if (event.session.new) {
      // New Session
      console.log("NEW SESSION");
    }

    switch (event.request.type) {

      case "LaunchRequest":
        // Launch Request
        console.log('LAUNCH REQUEST')
        context.succeed(
          generateResponse(
            buildSpeechletResponse("Welcome to UK Police. How may I help you?", false),
            {}
          )
        )
        break;

      case "IntentRequest":
        // Intent Request

        switch(event.request.intent.name) {

		  case "updateReq":
		  	console.log("UPDATE REQUEST")
		  	var get_options = {
   					host: "data.police.uk",
   					path: '/api/crime-last-updated',
   					method: 'GET',
   				headers: {}
			    };
                //GETTING INFO FROM DATABASE
            https.get(get_options, function(res){
				console.log("STATUS: " +res.statusCode);
					body = '';
					res.on('data', function(chunk) {
						body += chunk;
					});
					res.on('end', function() {
						try {
							//Use Info Here
							var info = JSON.parse(body);
							var date = info.date;
							console.log(date);
							context.succeed(
								generateResponse(
									buildSpeechletResponse('Police information was last updated on ' + date, true),
									{}
								)
							)
				
						} catch (e) {
							console.log("Got error: " + e.message);
							context.succeed(
								generateResponse(
									buildSpeechletResponse("I had an issue checking the last update", true),
									{}
								)
							)
						}	
					})
			});

		  break;


          case "contactReq":
		 	var self;
			 console.log('CONTACT REQUEST');
		  	var city = event.request.intent.slots.City.value;

			if(city === undefined || city === ""){
				context.succeed(
					generateResponse(
						buildSpeechletResponse("Sorry, I didn't hear a city to get contact info for", true),
						{}
					)
				)
			}
			  var formatCity = city.replace(/ /g,"+");
			  formatCity = formatCity.replace("Saint", 'st.');
			  console.log(formatCity);

        	Eventer = function(){
				 events.EventEmitter.call(this);

				 var cord_options = {
						host: "alpha.openaddressesuk.org",
						path: '/addresses.json?town=' + formatCity,
						method: 'GET',
						rejectUnauthorized: false,
					headers: {}
				};

				 this.getCords = function(){
					 self = this;
					https.get(cord_options, function(res){
						console.log("STATUS: " +res.statusCode);
							body = '';
							res.on('data', function(chunk) {
								body += chunk;
							});
							res.on('end', function() {
								try {
									//Use Info Here
									var info = JSON.parse(body);
									//console.log(info);

									var lat = info.addresses[0].postcode.geo.latitude;
									var long = info.addresses[0].postcode.geo.longitude;
									//console.log(lat + " + " + long);
									self.emit('locate', lat, long);
								
						
								} catch (e) {
									console.log("Got error: " + e.message);
									context.succeed(
										generateResponse(
											buildSpeechletResponse("I had an issue finding contact information for " + city, true),
											{}
										)
									)
								}	
							})
					});
				 }

				 this.locate = function(lat, long){
					 self = this;

					var locate_options = {
						host: "data.police.uk",
						path: '/api/locate-neighbourhood?q=' + lat + ',' + long,
						method: 'GET',
					headers: {}
					};
				
					 https.get(locate_options, function(res){
						console.log("STATUS: " +res.statusCode);
							body = '';
							res.on('data', function(chunk) {
								body += chunk;
							});
							res.on('end', function() {
								try {
									//Use Info Here
									var info = JSON.parse(body);

									var force = info.force;
									console.log(force);
									self.emit('contact', force);
								
						
								} catch (e) {
									console.log("Got error: " + e.message);
									context.succeed(
										generateResponse(
											buildSpeechletResponse("I had an issue finding contact information for " + city, true),
											{}
										)
									)
								}	
							})
					});
				 }

				this.contact = function(force){
					 self = this;

					var contact_options = {
						host: "data.police.uk",
						path: '/api/forces/' + force,
						method: 'GET',
					headers: {}
					};
				
					 https.get(contact_options, function(res){
						console.log("STATUS: " +res.statusCode);
							body = '';
							res.on('data', function(chunk) {
								body += chunk;
							});
							res.on('end', function() {
								try {
									//Use Info Here
									var info = JSON.parse(body);
									
									var name = info.name;
									var website = info.url;

									var contact_info = '';
									for(var i = 0; i < info.engagement_methods.length; i++){
										var title = info.engagement_methods[i].title;
										title = title.charAt(0).toUpperCase() + title.slice(1);

										var temp = title+ ": " + info.engagement_methods[i].url + "\n"
										contact_info += temp;
										contact_info += "\n--------------------\n"
									}
									console.log(contact_info);
									context.succeed(
										generateResponse(
											buildSpeechletResponseCard("I have sent the contact information for " + name + " to your Alexa App", name + " Contact Information", contact_info, true),
											{}
										)
									)
						
								} catch (e) {
									console.log("Got error: " + e.message);
									context.succeed(
										generateResponse(
											buildSpeechletResponse("I had an issue finding contact information for " + city, true),
											{}
										)
									)
								}	
							})
					});
				 }
			}
        	util.inherits(Eventer, events.EventEmitter);
        	
        	 Listener = function(){
        		this.locate = function(lat, long){
					eventer.locate(lat, long)
        		}
				this.contact = function(force){
					eventer.contact(force)
				}
        	}
        	var eventer = new Eventer();
        	var listener = new Listener(eventer);
        	eventer.on('locate', listener.locate);
			eventer.on('contact', listener.contact);

			if(city === "London" || city === "london"){
				eventer.contact("metropolitan");
			}	
			else{
				eventer.getCords();
			}
            break;

        case "eventReq":
			var self;
			console.log('EVENT REQUEST');
		  	var city = event.request.intent.slots.City.value;

			if(city === undefined || city === ""){
				context.succeed(
					generateResponse(
						buildSpeechletResponse("Sorry, I didn't hear a city to get upcoming events for", true),
						{}
					)
				)
			}

			  var formatCity = city.replace(/ /g,"+");
			  formatCity = formatCity.replace("Saint", 'st.');
			  console.log(formatCity);

        	Eventer = function(){
				 events.EventEmitter.call(this);

				 var cord_options = {
						host: "alpha.openaddressesuk.org",
						path: '/addresses.json?town=' + formatCity,
						method: 'GET',
						rejectUnauthorized: false,
					headers: {}
				};

				 this.getCords = function(){
					 self = this;
					https.get(cord_options, function(res){
						console.log("STATUS: " +res.statusCode);
							body = '';
							res.on('data', function(chunk) {
								body += chunk;
							});
							res.on('end', function() {
								try {
									//Use Info Here
									var info = JSON.parse(body);
									//console.log(info);

									var lat = info.addresses[0].postcode.geo.latitude;
									var long = info.addresses[0].postcode.geo.longitude;
									//console.log(lat + " + " + long);
									self.emit('locate', lat, long);
								
						
								} catch (e) {
									console.log("Got error: " + e.message);
									context.succeed(
										generateResponse(
											buildSpeechletResponse("I had an issue finding upcoming events for " + city, true),
											{}
										)
									)
								}	
							})
					});
				 }

				 this.locate = function(lat, long){
					 self = this;

					var locate_options = {
						host: "data.police.uk",
						path: '/api/locate-neighbourhood?q=' + lat + ',' + long,
						method: 'GET',
					headers: {}
					};
				
					 https.get(locate_options, function(res){
						console.log("STATUS: " +res.statusCode);
							body = '';
							res.on('data', function(chunk) {
								body += chunk;
							});
							res.on('end', function() {
								try {
									//Use Info Here
									var info = JSON.parse(body);

									var force = info.force;
									var neighborhood = info.neighbourhood;

									console.log(force + " " + neighborhood);
									self.emit('event', force, neighborhood);
								
						
								} catch (e) {
									console.log("Got error: " + e.message);
									context.succeed(
										generateResponse(
											buildSpeechletResponse("I had an issue finding upcoming events for " + city, true),
											{}
										)
									)
								}	
							})
					});
				 }

				this.event = function(force, neighborhood){
					 self = this;

					var contact_options = {
						host: "data.police.uk",
						path: '/api/' + force + "/" + neighborhood + "/events",
						method: 'GET',
					headers: {}
					};
				
					 https.get(contact_options, function(res){
						console.log("STATUS: " +res.statusCode);
							body = '';
							res.on('data', function(chunk) {
								body += chunk;
							});
							res.on('end', function() {
								try {
									//Use Info Here
									var info = JSON.parse(body);
									console.log(info);

									var event_info = "";
									for(var i = 0; i < info.length; i++){
										var when = info[i].start_date;

										var temp = "\n" + info[i].title + 
													"\nWhen: " + when.substring(0,10) + " at " + when.substring(11, 16) +
													"\nWhere: " + info[i].address +
													"\n--------------------";
													
										event_info += temp;
									}
									console.log(event_info);
									if(event_info !== ""){
										context.succeed(
											generateResponse(
												buildSpeechletResponseCard("I have sent upcoming events for " + city + " to your Alexa App", city + " Upcoming Events", event_info, true),
												{}
											)
										)
									}
									else{
										context.succeed(
											generateResponse(
												buildSpeechletResponse("Looks like there aren't any upcoming events for " + city, true),
												{}
											)
										)
									}
						
								} catch (e) {
									console.log("Got error: " + e.message);
									context.succeed(
										generateResponse(
											buildSpeechletResponse("I had an issue finding upcoming events for " + city, true),
											{}
										)
									)
								}	
							})
					});
				 }
			}
        	util.inherits(Eventer, events.EventEmitter);
        	
        	 Listener = function(){
        		this.locate = function(lat, long){
					eventer.locate(lat, long)
        		}
				this.event = function(force, neighborhood){
					eventer.event(force, neighborhood)
				}
        	}
        	var eventer = new Eventer();
        	var listener = new Listener(eventer);
        	eventer.on('locate', listener.locate);
			eventer.on('event', listener.event);
        	
			if(city === "London" || city === "london"){
				eventer.locate("51.508530", "-0.076132");
			}	
			else{
				eventer.getCords();
			}

        break;

        case "crimeReq":
			var self;
			console.log('CRIME REQUEST');
			var month = event.request.intent.slots.Month.value;
		  	var city = event.request.intent.slots.City.value;

			var today = new Date();
			var currentMonth = today.getMonth()+1; //Jan is 0
			var currentYear = today.getFullYear();

			if(city === undefined || city === ""){
				context.succeed(
					generateResponse(
						buildSpeechletResponse("Sorry, I didn't hear a city to report crimes for", true),
						{}
					)
				)
			}
			if(month === undefined || month === ""){
				month = currentYear + "-" + currentMonth;
			}

			var formatCity = city.replace(/ /g,"+");
			formatCity = formatCity.replace("Saint", 'st.');
			console.log(formatCity);

			if(parseInt(month.substring(5,7)) > currentMonth){
				month = month.substring(0, 5) + currentMonth;
			}
			if(parseInt(month.substring(0,4)) > currentYear){
				month = currentYear + "-" + month.substring(5,7);
			}
			console.log(month);

        	Eventer = function(){
				 events.EventEmitter.call(this);

				 var cord_options = {
						host: "alpha.openaddressesuk.org",
						path: '/addresses.json?town=' + formatCity,
						method: 'GET',
						rejectUnauthorized: false,
					headers: {}
				};

				 this.getCords = function(){
					 self = this;
					https.get(cord_options, function(res){
						console.log("STATUS: " +res.statusCode);
							body = '';
							res.on('data', function(chunk) {
								body += chunk;
							});
							res.on('end', function() {
								try {
									//Use Info Here
									var info = JSON.parse(body);
									//console.log(info);

									var lat = info.addresses[0].postcode.geo.latitude;
									var long = info.addresses[0].postcode.geo.longitude;
									//console.log(lat + " + " + long);
									self.emit('crime', lat, long);
								
						
								} catch (e) {
									console.log("Got error: " + e.message);
									context.succeed(
										generateResponse(
											buildSpeechletResponse("I had an issue finding crime reports in " + month +" for " + city + ". Try asking when the database was last updated", true),
											{}
										)
									)
								}	
							})
					});
				 }

				 this.crime = function(lat, long){
					 self = this;

					var crime_options = {
						host: "data.police.uk",
						path: '/api/crimes-at-location?date=' + month + "&lat=" + lat + '&lng=' + long,
						method: 'GET',
					headers: {}
					};
				
					 https.get(crime_options, function(res){
						console.log("STATUS: " +res.statusCode);
							body = '';
							res.on('data', function(chunk) {
								body += chunk;
							});
							res.on('end', function() {
								try {
									//Use Info Here
									var info = JSON.parse(body);
									console.log(info);

									var crime_info = "";
									for(var i = 0; i < info.length; i++){
										var temp = "\n" + "Category: " + info[i].category + 
													"\nWhen: " + info[i].month +
													"\nWhere: " + info[i].location.street.name +
													"\n--------------------";
													
										crime_info += temp;
									}
									console.log(crime_info);
									if(crime_info !== ""){
										context.succeed(
											generateResponse(
												buildSpeechletResponseCard("I have sent reported crimes for " + month + " near " + city + " to your Alexa App", city + "'s " + month +" Crime Reports", crime_info, true),
												{}
											)
										)
									}
									else{
										context.succeed(
											generateResponse(
												buildSpeechletResponse("Looks like there are no crime reports in " + city +" during " + month, true),
												{}
											)
										)
									}
								
								} catch (e) {
									console.log("Got error: " + e.message);
									context.succeed(
										generateResponse(
											buildSpeechletResponse("I had an issue finding crime reports in " + month +" for " + city+ ". Try asking when the database was last updated", true),
											{}
										)
									)
								}	
							})
					});
				 }
			}
        	util.inherits(Eventer, events.EventEmitter);
        	
        	 Listener = function(){
        		this.crime = function(lat, long){
					eventer.crime(lat, long)
        		}
        	}
        	var eventer = new Eventer();
        	var listener = new Listener(eventer);
        	eventer.on('crime', listener.crime);

			if(city === "London" || city === "london"){
				eventer.crime("51.508530", "-0.076132");
			}	
			else{
				eventer.getCords();
			}

    	break;
            
         case "AMAZON.HelpIntent":
      	    console.log('HELP REQUEST');
      	    context.succeed(
                generateResponse(
                    buildSpeechletResponse('You can ask me when my info was last updated, what crime has been reported in your town or city, what local events are happening nearby, and how to contact a specific police department.... How may I help you?', false),
                    {}
                )
            )
        break;
        
        case "AMAZON.CancelIntent":
      	    console.log('HELP REQUEST');
      	    context.succeed(
                generateResponse(
                    buildSpeechletResponse('Thanks for using UK Police.', true),
                    {}
                )
            )
        break;
        
        case "AMAZON.StopIntent":
      	    console.log('HELP REQUEST');
      	    context.succeed(
                generateResponse(
                    buildSpeechletResponse('Thanks for using UK Police', true),
                    {}
                )
            )
        break;

          default:
            throw "Invalid intent"
        }

        break;
     

      case "SessionEndedRequest":
        // Session Ended Request
        console.log('SESSION ENDED REQUEST')
        break;

      default:
        context.fail('INVALID REQUEST TYPE: ${event.request.type}')

    }

  } catch(error) { context.fail('Exception: '+error) }

}

// Helpers
buildSpeechletResponse = (outputText, shouldEndSession) => {

  return {
    outputSpeech: {
      type: "PlainText",
      text: outputText
    },
    shouldEndSession: shouldEndSession
  }

}
buildSpeechletResponseCard = (outputText, title, content, shouldEndSession) => {

  return {
    outputSpeech: {
      type: "PlainText",
      text: outputText
    },
    card: {
      type: "Simple",
      title: title,
      content: content
    },
    shouldEndSession: shouldEndSession
  }

}

generateResponse = (speechletResponse, sessionAttributes) => {

  return {
    version: "1.0",
    sessionAttributes: sessionAttributes,
    response: speechletResponse
  }


}


