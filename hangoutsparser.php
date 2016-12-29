<?php
$Hangouts = json_decode(file_get_contents("Hangouts.json"),true);
$output = fopen("hangoutsparsed.json","w");
$all_participants = array();

foreach($Hangouts["conversation_state"] as $key) {
  $conversation = $key['conversation_state']['conversation'];

  //Get all participants
  foreach($conversation['participant_data'] as $person_key) {
    $person = $person_key;
    $gaia_id = $person['id']['gaia_id'];
    if(!isset($person['fallback_name']) || !$person['fallback_name']==null) continue;
    if(!isset($all_participants[$gaia_id])) $all_participants[$gaia_id] = $person['fallback_name'];
  }
}
foreach($Hangouts['conversation_state'] as $key) {
  $conversation_state = $key;
  $id = $conversation_state['conversation_id']['id'];
  $conversation = $conversation_state['conversation_state']['conversation'];

  //Find participants
  $participants = array();
  $participants_obj = array();
  foreach($conversation['participant_data'] as $person_key) {
    $person = $person_key;
    $gaia_id = $person['id']['gaia_id'];
    $name = "Unknown";

    if(isset($person['fallback_name'])) {
      $name = $person['fallback_name'];
    } else {
      $name = $all_participants[$gaia_id];
    }
    $participants[] = $name;
    $participants_obj["$gaia_id"] = $name;
  }

  //Parse events
  $events = array();
  foreach($conversation_state['conversation_state']['event'] as $event_key) {
    $convo_event = $event_key;
    $message = "";
    if(isset($convo_event['chat_message'])) {
      //Get the message
      if(isset($convo_event['chat_message']['message_content']['segment'])) {
        foreach($convo_event['chat_message']['message_content']['segment'] as $msg_key) {
          $segment = $msg_key;
          if(!isset($segment['text'])) continue;
          $message .= $segment['text'];
        }
      }
      //Check for images on the event
      if(isset($convo_event['chat_message']['message_content']['attachment'])) {
        foreach($convo_event['chat_message']['message_content']['attachment'] as $attach_key) {
          $attachment = $attach_key;
          if($attachment['embed_item']['type'][0] == "PLUS_PHOTO"){
            $message .= "[!!!Image " . $attachment['embed_item']['embeds.PlusPhoto.plus_photo']['url'] . "]";
          }
        }
      }
      fwrite($output,json_encode(array("conversation_id" => $convo_event["conversation_id"]["id"], "sender_id" => $convo_event['sender_id']['gaia_id'], "sender_name" => $participants_obj[$convo_event['sender_id']['gaia_id']], "message" => $message, "timestamp" => ($convo_event['timestamp']/1000000)))."\n");
    }
  }
}
fclose($output);
?>
