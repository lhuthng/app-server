import fs from 'fs';
import https from 'https';
import express from 'express';
import path from 'path';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
// Load SSL certificates
const sslOptions = {
  key: fs.readFileSync('/etc/letsencrypt/live/thangvps.duckdns.org/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/thangvps.duckdns.org/fullchain.pem')
};

// Initialize Express app
const app = express();

app.use(cors({
  origin: '*'
}));

app.get('/apps/:name/size', (req, res) => {
    const appName = req.params.name;
    const appPath = path.join(path.dirname(__filename), 'apps', appName, 'size.json');

    fs.readFile(appPath, 'utf8', (err, data) => {
        if (err) {
          console.error('Error reading size.json:', err);
          res.status(500).json({ error: 'Internal Server Error' });
          return;
        }
    
        try {
          const sizeData = JSON.parse(data);
          res.json(sizeData);
        } catch (parseError) {
          console.error('Error parsing size.json:', parseError);
          res.status(500).json({ error: 'Internal Server Error' });
        }
      });
});

// Get applications
app.use('/apps/:name', (req, res, next) => {
    const appName = req.params.name;
    const appPath = path.join(path.dirname(__filename), 'apps', appName);
    if (fs.existsSync(appPath)) { 
        express.static(appPath)(req, res, next);
    }
    else {
        res.status(404).send('App not found');
    }
});

// Default route
app.get('/', (req, res) => {
  res.send('Welcome to the HTML5 Appication Distribution Server!');
});

// Start HTTPS server
const server = https.createServer(sslOptions, app).listen(443, () => {
  console.log('HTTPS Server running on port 443');
});

const wss = new WebSocketServer({ server });

const hosts = new Map();
const tokens = {}; 

const pairs = new Map();

function generateToken() {
  let token;
  do {
      token = crypto.randomInt(100, 1000).toString();
  } while (tokens[token]);
  return token;
}

wss.on('connection', function connection(ws) {
  ws.on('error', console.error);
  ws.on('message', function message(data) {
    console.log("hello " + data.toString());
    const message = data.toString();
    if (message.startsWith("host:")) {
      const token = generateToken();
      tokens[token] = {
        socket: ws,
        config: message.substring(5)
      };
      hosts.set(ws, token);
      ws.send(`token:${token.toString()}`);
    }
    else if (message.startsWith("join:")) {
      const token = message.substring(5);
      if (token in tokens) {
        const ows = tokens[token].socket;
        ws.send(`paired:${tokens[token].config}`);
        pairs.set(ws, ows);
        pairs.set(ows, ws);
        ows.send("paired:");
      }
      else {
        console.log("3");
        ws.send("rejected:")
      }
    }
    else if (message.startsWith("command:")) {
      const [_, type, data] = message.split(":");
      if (pairs.has(ws)) {
        const ows = pairs.get(ws);
        ows.send(`${type}:${data}`);
      }
      else if (type == "set_turn" && hosts.has(ws) && tokens.has(hosts.has(ws))) {
          tokens.get(hosts.get(ws)).config = data;
      }
      else {
        ws.send('unpaired:');
      }
    }
    else if (message.startsWith("disconnect")) {

    }
  });
  ws.on('close', function close() {
    console.log('SOMEONE IS LEAVING');
    if (pairs.has(ws)) {
      console.log('HAS WS');
      if (pairs.has(pairs.get(ws))) {
        console.log('HAS PAIR');
        pairs.get(ws).send('unpaired:');
        pairs.delete(pairs.get(ws));
      }
      pairs.delete(ws);
    }
    if (ws in hosts) {
      
      if (hosts[ws] in tokens) {
        delete tokens[hosts[ws]];
      }
      delete hosts[ws];
    }
  });
}); 