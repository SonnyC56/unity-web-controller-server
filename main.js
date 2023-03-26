// Importing the required modules
const WebSocketServer = require('ws');
 
// Creating a new websocket server
const wss = new WebSocketServer.Server({ port: 8080 })

let connectedUserID = null;
let numberOfClients = 0;
 
// Creating connection using websocket
wss.on("connection", ws => {
    numberOfClients++;
    console.log("number of clients connected since server start", numberOfClients);
 
    // sending message to client
    ws.send('Welcome, you are connected!');
 
    //on message from client
    ws.on("message", data => {
      //  console.log(`Client has sent us: ${data}`)
        data = JSON.parse(data)
   //     console.log('data.uuid: ', data.uuid)

        if(connectedUserID == null && data.uuid){
            connectedUserID = data.uuid
        }
        if (data.uuid == connectedUserID && connectedUserID){
            console.log('data.uuid == connectedUserID', connectedUserID)
       //   console.log(`Client has sent us: ${data}`)
        }
    });
 
    // handling what to do when clients disconnects from server
    ws.on("close", () => {
        console.log("the client has disconnected");
    });
    // handling client connection error
    ws.onerror = function () {
        console.log("Some Error occurred")
    }
});
console.log("The WebSocket server is running on port 8080");