import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import https from 'https';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import crypto from 'crypto';

const sslOptions = {
  key: fs.readFileSync('/etc/letsencrypt/live/thangvps.duckdns.org/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/thangvps.duckdns.org/fullchain.pem')
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors({
    origin: '*'
}));
  
app.use(express.static(path.join(__dirname, '../my-portfolio/build'))); 
app.use(express.static(path.join(__dirname, './apps/'))); 

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../my-portfolio/build', 'index.html'));
});

const server = https.createServer(sslOptions, app).listen(443, () => {
console.log('HTTPS Server running on port 443');
});












// WEB SERVER
app.get('/apps/:name/size', (req, res) => {
    const appName = req.params.name;
    const appPath = path.join(__dirname, 'apps', appName, 'size.json');
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

app.use('/apps/:name', (req, res, next) => {
    const appName = req.params.name;
    const appPath = path.join(__dirname, 'apps', appName);
    if (fs.existsSync(appPath)) { 
        express.static(appPath)(req, res, next);
    }
    else {
        res.status(404).send('App not found');
    }
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
    if (pairs.has(ws)) {
      if (pairs.has(pairs.get(ws))) {
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