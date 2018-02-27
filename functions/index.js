const functions = require('firebase-functions');

const admin = require('firebase-admin');
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
  var user_id  = req.query.uid.toString(); //user id of user
  var token = req.query.token.toString(); //new token of user
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
