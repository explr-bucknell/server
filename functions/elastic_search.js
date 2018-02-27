const https = require('https')
const BONSAI_URL = 'https://explrelasticsearch.herokuapp.com'

/*
var data = []
data.push({
	update: {
    _index: 'explr',
    _type: 'places',
    _id: 'ChIJz0_rX9WGhYARrtB9AwkQsno'
  }
})
data.push({
	doc: {
    name: 'Palace of Fine Arts',
    id: 'ChIJz0_rX9WGhYARrtB9AwkQsno'
  },
  upsert: {
    name: 'Palace of Fine Arts',
    id: 'ChIJz0_rX9WGhYARrtB9AwkQsno'
  }
})
console.log(`${BONSAI_URL}/update_places?data=${JSON.stringify(data)}`)
*/

https.get(`${BONSAI_URL}/search_places?q=vista`, (resp) => {
  let data = ''
 
  // A chunk of data has been recieved.
  resp.on('data', (chunk) => {
    data += chunk
  })
 
  // The whole response has been received. Print out the result.
  resp.on('end', () => {
    console.log(JSON.parse(data))
  })
 
}).on("error", (err) => {
  console.log("Error: " + err.message)
})
