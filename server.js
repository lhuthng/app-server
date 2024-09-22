const fs = require('fs');
const https = require('https');
const express = require('express');
const path = require('path');
const cors = require('cors');
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

// Get applications
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

// Default route
app.get('/', (req, res) => {
  res.send('Welcome to the HTML5 Appication Distribution Server!');
});

// Start HTTPS server
https.createServer(sslOptions, app).listen(443, () => {
  console.log('HTTPS Server running on port 443');
});