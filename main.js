
const WebSocketServer = require('ws');
const wss = new WebSocketServer.Server({ port: 8080 });

let connectedClients = [];
let controlQueue = [];
let unityClient = null;

wss.on("connection", ws => {
    console.log('client connected to server')
    connectedClients.push(ws);

    ws.on("message", data => {
        data = JSON.parse(data);
  
   //     console.log('recieving data from client: ', data)
        if (data.type === "unity") {
            // This is the Unity client
            unityClient = ws;
            console.log('UNITY CONNECTED :', unityClient)
        } else if (data.type === "done") {
            // The current client is done controlling the camera
            controlQueue.shift();

            // Allow the next client in line to take control
            if (controlQueue.length > 0) {
                controlQueue[0].send(JSON.stringify({ type: "control" }));
            }
        }   
      if (unityClient) {
         unityClient.send(JSON.stringify(data));
         console.log('sending data to unity: ', data)
      } 
        
    });

    ws.on("close", () => {
        // Remove the disconnected client from the connected clients list and control queue
        connectedClients = connectedClients.filter(client => client !== ws);
        controlQueue = controlQueue.filter(client => client !== ws);

        // If this was the Unity client, set it to null
        if (ws === unityClient) {
            unityClient = null;
            console.log('UNITY DISCONNECTED')
        }
    });

    // Add the new client to the end of the control queue
    controlQueue.push(ws);

    // If this is the only client in the queue, allow them to take control immediately
    if (controlQueue.length === 1) {
        ws.send(JSON.stringify({ type: "control" }));
    }
});