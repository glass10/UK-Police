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
        console.log('INTENT REQUEST');

        switch(event.request.intent.name) {

		  case "updateReq":

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
									buildSpeechletResponse("Error checking last update", true),
									{}
								)
							)
						}	
					})
			});

		  break;


          case "contactReq":
		 	var self;

		  	var city = event.request.intent.slots.City.value
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
											buildSpeechletResponse("Error finding contact information for " + city, true),
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
											buildSpeechletResponse("Error finding contact information for " + city, true),
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
											buildSpeechletResponse("Error finding contact information for " + city, true),
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
        	eventer.getCords();

            break;

        case "eventReq":
			var self;

		  	var city = event.request.intent.slots.City.value
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
											buildSpeechletResponse("Error finding upcoming events for " + city, true),
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
											buildSpeechletResponse("Error finding upcoming events for " + city, true),
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
									context.succeed(
										generateResponse(
											buildSpeechletResponseCard("I have sent upcoming events for " + city + " to your Alexa App", city + " Upcoming Events", event_info, true),
											{}
										)
									)
						
								} catch (e) {
									console.log("Got error: " + e.message);
									context.succeed(
										generateResponse(
											buildSpeechletResponse("Error finding upcoming events for " + city, true),
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
        	eventer.getCords();

        break;

        case "eventReq":
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
String.prototype.replaceAt  = function(index, character, string)
{
	return this.substr(0, index-1) + character + this.substr(index, string.length);
}


