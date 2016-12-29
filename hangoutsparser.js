var Hangouts = {}; // Main object for raw hangouts data
var Conversations = {};
var all_participants = {};

const fs = require('fs');

Hangouts = JSON.parse(fs.readFileSync("Hangouts.json"));
processData();

function processData() {
	// First we want to get all participants, so we loop fully once
	for(key in Hangouts['conversation_state']) {
		var conversation = Hangouts['conversation_state'][key]['conversation_state']['conversation'];
		// Get all participants
		for(person_key in conversation['participant_data']){
			var person  = conversation['participant_data'][person_key];
			var gaia_id = person['id']['gaia_id'];
			if(!person['fallback_name'] || person['fallback_name'] == null) continue;
			if(!all_participants[gaia_id]) all_participants[gaia_id] = person['fallback_name'];
		}
	}

	for(key in Hangouts['conversation_state']) {

		var conversation_state = Hangouts['conversation_state'][key];
		var id = conversation_state['conversation_id']['id'];
		var conversation = conversation_state['conversation_state']['conversation'];

		// Find participants
		var participants = [], participants_obj = {};

		for(person_key in conversation['participant_data']){
			var person  = conversation['participant_data'][person_key];
			var gaia_id = person['id']['gaia_id'];
			var name = "Unknown";

			if(person['fallback_name']){
				name = person['fallback_name'];
			}else{
				name = all_participants[gaia_id];
			}
			participants.push(name);
			participants_obj[gaia_id] = name;
		}

		// Parse events
		var events = [];
		for(event_key in conversation_state['conversation_state']['event']){
			var convo_event = conversation_state['conversation_state']['event'][event_key];
			var message = "";
			if(convo_event['chat_message']){
				// Get message
				for(msg_key in convo_event['chat_message']['message_content']['segment']){
					var segment = convo_event['chat_message']['message_content']['segment'][msg_key];
					if(!segment['text']) continue;
					message += segment['text'];
				}
				// Check for images on event
				if(convo_event['chat_message']['message_content']['attachment']){
					for(var attach_key in convo_event['chat_message']['message_content']['attachment']){
						var attachment = convo_event['chat_message']['message_content']['attachment'][attach_key];
						//console.log(attachment);
						if(attachment['embed_item']['type'][0] == "PLUS_PHOTO"){
							message += "[!!!Image " + attachment['embed_item']['embeds.PlusPhoto.plus_photo']['url'] + "]";
						}
					}
				}
				fs.appendFileSync("hangoutsparsed.json",JSON.stringify({conversation_id: convo_event["conversation_id"]["id"], sender_id: convo_event['sender_id']['gaia_id'], sender_name: participants_obj[convo_event['sender_id']['gaia_id']], message: message, timestamp: (convo_event['timestamp']/1000000)})+"\n");
			}
		}
	}
}
