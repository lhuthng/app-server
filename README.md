# My Full-Stack Portfolio & L-Game Platform

This repository houses three key components:

1. **Portfolio**: My personal portfolio, showcasing my skills and projects. (Link to [my-portfolio](https://github.com/lhuthng/my-portfolio)) 

2. **Game API**: An API built to fetch details about my games ("/apps/{game-names}").

3. **Multiplayer Server**: A WebSocket server powering the multiplayer functionality (currently there is only one game [L-Game](https://github.com/lhuthng/L-Game))


## Technologies Used

* Node.js
* Express.js (for the API)
* Websocket (for the WebSocket server)

## Reminders (for myself)
* Install dependencies
```bash
npm install
```
* Build the portfolio (as a sibling directory)

* Generate certificates
```bash
sudo apt update
sudo apt install certbot
sudo certbot certonly --standalone -d huuthang.site
```
* Put games in the games folder.
* Create a size.json for fetching the size.
* Run the server in the background
```bash
nohup nodejs server.js &
```