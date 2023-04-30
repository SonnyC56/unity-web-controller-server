const WebSocketServer = require('ws');
const wss = new WebSocketServer.Server({ port: 8090 });

let connectedClients = [];
let controlQueue = [];
let unityClient = null;
let websocketInControl = null;

wss.on("connection", ws => {
    connectedClients.push(ws);  
    console.log('client connected to server. Connected Clients: ', connectedClients.length)

  ws.on("message", data => {
    data = JSON.parse(data);

    if (data.type === "unity") {
      // This is the Unity client
      unityClient = ws;
      console.log('UNITY CONNECTED :', unityClient)
    }

     if (data.type === "done") {
      // The current client is done controlling the camera
      controlQueue.shift();
      // Allow the next client in line to take control
      websocketInControl = controlQueue[0];
      if(websocketInControl){
      websocketInControl.send(JSON.stringify({ type: "control" }));
      }

    } 

    if (data.type === "join") {
      // Add the new client to the end of the control queue
      controlQueue.push(ws);
      console.log("adding to control que")
      websocketInControl = controlQueue[0];
      controlQueue[0].send(JSON.stringify({ type: "control" }));
      // Notify all clients of their new position in the control queue
      connectedClients.forEach(client => {
        if (client !== unityClient) {
          const position = controlQueue.indexOf(client);
          const totalClients = connectedClients.length
          client.send(JSON.stringify({  type: "queue", position: position, totalClients: totalClients }));
        }
      });
    }
    
    if (unityClient) {
      unityClient.send(JSON.stringify(data));
      console.log('sending data to unity: ', data)
    }
  });

  ws.on("close", () => {
    console.log('client disconnected')
  
    // Remove the disconnected client from the connected clients list and control queue\
    const connectedClientsIndex = connectedClients.indexOf(ws);
    const controlQueueIndex = controlQueue.indexOf(ws);
    if (connectedClientsIndex > -1) { // only splice array when item is found
        connectedClients.splice(connectedClientsIndex, 1); // 2nd parameter means remove one item only
      }
      if (controlQueueIndex > -1) { // only splice array when item is found
        controlQueue.splice(controlQueueIndex, 1); // 2nd parameter means remove one item only
      }

    
    // If the disconnected client was in control, assign control to the next user in the queue
    if (ws === websocketInControl) {
      controlQueue.shift();
      if (controlQueue.length > 0) {
        websocketInControl = controlQueue[0];
        websocketInControl.send(JSON.stringify({ type: "control" }));
      } else {
        websocketInControl = null;
      }
    }
    
    // If this was the Unity client, set it to null
    if (ws === unityClient) {
      unityClient = null;
      console.log('UNITY DISCONNECTED')
    }
  
    // Notify all clients of their new position in the control queue
    connectedClients.forEach(client => {
      if (client !== unityClient) {
        const position = controlQueue.indexOf(client);
        const totalClients = connectedClients.length
        client.send(JSON.stringify({  type: "queue", position: position, totalClients: totalClients }));
      }
    });
  });
  
});

