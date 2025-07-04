require('./db')
const express = require('express');
const cors = require('cors');
const bodyParser = express.json(); 

const routes = require('./routes'); 

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser); 


app.get("/", (req, res) => {
    res.send("GTS_TZ API is working ✅");
  });
  
app.use('/api/v1', routes); 

module.exports = app;
