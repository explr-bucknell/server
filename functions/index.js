const functions = require('firebase-functions');
const admin = require('firebase-admin');
const Expo = require('expo-server-sdk');

admin.initializeApp(functions.config().firebase);
//update for expo
exports.tripRequest = functions.https.onRequest((req, res) => {
  // Notification details.
  var handle_of_invitor = req.query.invitor.toString(); // handle
  var handle_of_invited = req.query.invited.toString();  //handle
  var trip_id = req.query.trip.toString(); //uid of trip
  console.log('processing trip request from ' + handle_of_invitor + ' to ' + handle_of_invited);
  // logic to get token, ids of invitor and invited
  //users / handles/ handle -> id

  admin.database().ref('/users/handles/').once('value').then(function(snapshot) {
          var invited_id = snapshot.child(handle_of_invited).val();

          admin.database().ref('/users/main/' + invited_id).once('value').then(function(snapshot) {
                  var key = snapshot.key;
                  console.log('device keys');
                  console.log(snapshot.child('instance_ids').val());
                  var tokens = snapshot.child('instance_ids').val();
                  for(var token_key in tokens){
                      var token = tokens[token_key];
                      // creating message to send
                      var body_msg = handle_of_invitor + " has invited you to join a trip!";
                      var payload = {
                          notification: {
                              title: "Trip Invitation",
                              body: body_msg
                          },
                          data: {
                              trip: trip_id,
                              invitor_id: handle_of_invitor,
                              invited_id: handle_of_invited
                          }
                      };
                      // update this return for http call maybe?
                      return admin.messaging().sendToDevice(token, payload).then((response) => {
                              if (response.successCount >=0 ) {
                                  res.status(200).end();
                              } else {
                                  // Everything is bad
                                  res.status(400).send('Issue with sending push notification');

                              }
                          });
                  }
              });
      });
    });
//to add a push token to a user account via user
exports.addPushToken = functions.https.onRequest((req, res) => {
  var user_id  = req.body.uid.toString(); //user id of user
  var token = req.body.token.toString(); //new token of user
  console.log('adding token ' + token + ' to user ' + user_id);

  //check to make sure token doesn't already exist
  admin.database().ref('/users/main/' + user_id).once('value').then(function(snapshot) {
          var key = snapshot.key;
          var exists = false;
          console.log('device keys');
          console.log(snapshot.child('instance_ids').val());
          var tokens = snapshot.child('instance_ids').val();
          console.log('logging contents of instance_id');
          for(var token_key in tokens){
            console.log('existing token: ' + tokens[token_key]);
            if (tokens[token_key] === token) {
              console.log('token already exists');
              exists = true;
              res.status(200).end();
              return;
            }
          }
          console.log('token being added');
          //go through process to add token
          var postsRef = admin.database().ref('/users/main/' + user_id + '/instance_ids/');
          var newPostRef = postsRef.push(token);
        });


  if (req === undefined) {
    // This is an error case, as "message" is required
    res.status(400).send('No message defined!');
  } else {
    // Everything is ok
    console.log(req.body.message);
    res.status(200).end();
  }
});
// expo notification sender
//NOTE: uses 3rd party calls, will cost $$.  could get expensive
exports.sendFollowNotification = functions.https.onRequest((req, res) => {
  var requester = req.body.requester.toString();
  var requestee = req.body.requestee.toString();
  let expo = new Expo();
  let messages = [];

  admin.database().ref('/users/main/' + requestee).once('value').then(function(snapshot) {
          var key = snapshot.key;
          var exists = false;
          console.log('device keys');
          console.log(snapshot.child('instance_ids').val());
          var tokens = snapshot.child('instance_ids').val();
          console.log('logging contents of instance_id');
          //SEND TO EACH
          for(var token_key in tokens){
            console.log('existing token: ' + tokens[token_key]);
            console.log('gearing up to send message');
            if(!Expo.isExpoPushToken(tokens[token_key])) {
              console.error('hit an unvalid push expo push token.  sad face');
              continue;
            }
            messages.push({
              to: tokens[token_key],
              sound: 'default',
              body: snapshot.child('handle').val() + ' has requested to follow you',
              data: {
                requester: requester,
                requestee: requestee
              },
            })
          console.log('messages being sent');
          //go through process to add token

        let chunks = expo.chunkPushNotifications(messages);

        //(async function () => {
          // Send the chunks to the Expo push notification service. There are
          // different strategies you could use. A simple one is to send one chunk at a
          // time, which nicely spreads the load out over time:
          for (let chunk of chunks) {
            try {
              expo.sendPushNotificationsAsync(chunk);
              //let receipts = expo.sendPushNotificationsAsync(chunk); //pretty sure this is gonna be a snapshot dealio
              //console.log(receipts);
            } catch (error) {
              console.error(error);
            }
          }
        //})();
      }
    });

  if (req === undefined) {
    // This is an error case, as "message" is required
    res.status(400).send('No message defined!');
  } else {
    // Everything is ok
    console.log(req.body.message);
    res.status(200).end();
  }
});
