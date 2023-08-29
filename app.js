const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const scheduleRouter = require('./routes/schedules.routes');

const app = express();
app.use(express.json());

//Configuration for EJS
const path = require('path');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'your-secret-key', // Replace with your secret key
  resave: false,
  saveUninitialized: true,
}));

app.use(bodyParser.urlencoded({ extended: true }));

//MongoDB connection
const { MongoClient } = require('mongodb');
const uri = "mongodb://127.0.0.1:27017/";
/*"mongodb+srv://busSchedulesAdmin:BusSchedules1234%40MongoDB@busschedules.g9prwtm.mongodb.net/?retryWrites=true&w=majority";*/
let client;

async function connectToMongoDB() {
  try {
    // Connect the client to the MongoDB instance
    client = await MongoClient.connect(uri);
    console.log("Connected to MongoDB successfully!");
  } catch (err) {
    console.error("Error connecting to MongoDB:", err);
  }
}

//Establish the connection
connectToMongoDB();

app.use('/', scheduleRouter);

app.listen(1913, () => {
  console.log("Server is now active on port 1913");
});
