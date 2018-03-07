const https = require('https');
const functions = require('firebase-functions');

const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

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
                  console.log(snapshot.child('instance_id').val());
                  var tokens = snapshot.child('instance_id').val();
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

const BONSAI_URL = 'https://explrelasticsearch.herokuapp.com'

exports.updateElasticSearch = functions.database.ref('/pois/{place_id}/').onWrite((event) => {
  // Grab the current value of what was written to the Realtime Database.
  const snapshot = event.data
  var data = []
  data.push({
    update: {
      _index: 'explr',
      _type: 'places',
      _id: snapshot.val().id
    }
  })
  data.push({
    doc: {
      name: snapshot.val().name,
      id: snapshot.val().id
    },
    upsert: {
      name: snapshot.val().name,
      id: snapshot.val().id
    }
  })
  console.log('data', data)

  https.get(`${BONSAI_URL}/update_places?data=${JSON.stringify(data)}`, (resp) => {
    let data = ''
   
    // A chunk of data has been recieved.
    resp.on('data', (chunk) => {
      data += chunk
    })
   
    // The whole response has been received. Print out the result.
    resp.on('end', () => {
      console.log(JSON.parse(data).explanation)
    })
   
  }).on("error", (err) => {
    console.log("Error: " + err.message)
  })
  return data
})

const Storage = require('@google-cloud/storage')
const projectId = 'senior-design-explr'
var stream = require('stream')
const storage = new Storage({
  projectId: projectId,
  keyFilename: 'keyfile.json'
})
const baseUrl = 'profilePic/'

exports.profileImageUpload = functions.https.onRequest((req, res) => {
  var uid = req.body.uid.toString()
  var base64 = req.body.base64.toString()

  var bufferStream = new stream.PassThrough()
  bufferStream.end(new Buffer(base64, 'base64'))

  //Define bucket.
  var myBucket = storage.bucket('senior-design-explr.appspot.com')
  //Define file & file name.
  var file = myBucket.file('/profilePic/' + uid + '.jpg')
  //Pipe the 'bufferStream' into a 'file.createWriteStream' method.
  bufferStream.pipe(file.createWriteStream({
    metadata: {
      contentType: 'image/jpeg',
      metadata: {
        custom: 'metadata'
      }
    },
    public: true,
    validation: "md5"
  }))
  .on('error', function(err) {
    console.log('error', err)
    return false
  })
  .on('finish', function() {
    // The file upload is complete.
    console.log('uploaded')
    return admin.database().ref('/users/main/' + uid).update({
      imageUrl: baseUrl + uid + '.jpg'
    })
  })
})
