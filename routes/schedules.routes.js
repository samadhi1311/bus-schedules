const express = require("express");
const session = require("express-session");
const router = express.Router();
const { MongoClient } = require("mongodb");

const uri = "mongodb://127.0.0.1:27017/";
const dbName = "bus";


// # user handling section

// check if the user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.authenticated) {
    next();
  } else {
    res.redirect("/login");
  }
};

//login page
router.get("/login", async (req, res) => {
  res.render("login");
});

// handling user login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    const usersCollection = db.collection("users");

    // find the user with the given username and password
    const user = await usersCollection.findOne({ username, password });

    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // set a session variable
    req.session.authenticated = true;
    req.session.userId = user._id;
    req.session.username = user.username;
    res.redirect("/contribute");
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  } finally {
    client.close();
  }
});

// handling user logout
router.get("/logout", isAuthenticated, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error logging out:", err);
      return res.status(500).json({ message: "Internal Server Error" });
    }
    res.redirect("/");
  });
});

//Home page

// home
router.get("/", async (req, res) => {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);

    const routes = await db.collection("routes").find().toArray();
    const busDetails = [];
    res.render("index", { routes, busDetails });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error occurred while fetching data.");
  }
});

// button click and fetch relevant bus details
router.get("/busDetails", async (req, res) => {
  const startValue = req.query.start;
  const endValue = req.query.end;

  console.log("Received startValue:", startValue);
  console.log("Received endValue:", endValue);

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);

    // Find the relevant route_no based on start and end values from the "routes" collection
    const route = await db
      .collection("routes")
      .findOne({ start: startValue, end: endValue });

    if (!route) {
      // If no matching route is found, send an empty response or an error message
      return res.json({
        message: "No matches found.",
      });
    }

    // Get bus details from the "bus" collection that match the retrieved route_no
    const busDetails = await db
      .collection("bus")
      .find({ route_no: route.route_no })
      .toArray(); // Convert the cursor to an array

    if (!busDetails || busDetails.length === 0) {
      return res.json({
        message: "No matches found.",
      });
    }

    // Send the bus schedule details as a JSON response
    res.json(busDetails);

    // Logging schedule times for each object in the array
    busDetails.forEach((schedule) => {
      console.log("Schedule Times:", schedule.route_times);
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error occurred while fetching bus details.");
  } finally {
    client.close();
  }
});

// About page

router.get("/about", (req, res) => {
  res.render("about");
});

// Contribute page

// form for contributing bus schedules
router.get("/contribute", async (req, res) => {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);

    const routes = await db.collection("routes").find().toArray();
    const routeNumbers = routes.map((route) => route.route_no);

    res.render("contribute", {
      routes: routeNumbers,
      authenticated: req.session.authenticated,
      username: req.session.username,
    });
    
  } catch (err) {
    console.error(err);
    res.status(500).send("Error occurred while fetching data.");
  }
});

router.post("/newRoute", isAuthenticated, async (req, res) => {
  if (session.authenticated) {
    // Parse the form data for adding a new route
    const { newRouteNo, newRouteStart, newRouteEnd, newStartTime, newEndTime } =
      req.body;

    // Convert time strings to Date objects
    const startTimeObj = new Date(`1970-01-01T${newStartTime}`);
    const endTimeObj = new Date(`1970-01-01T${newEndTime}`);

    const client = new MongoClient(uri);

    try {
      await client.connect();
      const db = client.db(dbName);

      // If the route number is unique, add the new route to the "routes" collection
      await db.collection("routes").insertOne({
        route_no: newRouteNo,
        start: newRouteStart,
        end: newRouteEnd,
        startTime: startTimeObj,
        endTime: endTimeObj,
      });

      // Send a success response
      res.json({ success: true, message: "Route added successfully." });
    } catch (err) {
      console.error(err);
      res.status(500).send("Error occurred while adding the new route.");
    } finally {
      client.close();
    }
  } else
      res.send(`
      <dialog id="pls-login">
        <p>Please log in to continue.</p>
      </dialog>`);
});

// Route to handle form submission and upload new bus schedule
router.post("/contributeSchedule", isAuthenticated, async (req, res) => {
  const {
    route_no,
    start,
    end,
    startTime,
    endTime,
    licenseNo,
    contactNo,
    routeReversed,
  } = req.body;

  // Convert time strings to Date objects
  const startTimeObj = new Date(`1970-01-01T${startTime}`);
  const endTimeObj = new Date(`1970-01-01T${endTime}`);

  const client = new MongoClient(uri);
  client.connect(async (err) => {
    if (err) {
      console.error("Error connecting to MongoDB:", err);
      return res
        .status(500)
        .send("Error occurred while connecting to the database.");
    }

    const db = client.db(dbName);
    try {
      // Update the existing route details with start and end time
      await db
        .collection("routes")
        .updateOne(
          { route_no },
          { $set: { start, end, startTime: startTimeObj, endTime: endTimeObj } }
        );

      // Add the new bus schedule to the "bus" collection with user-provided data
      await db.collection("bus").insertOne({
        route_no,
        license_no: licenseNo,
        contact_no: contactNo,
        route_reversed: routeReversed === "on", // Convert checkbox value to boolean
      });

      res.send("Bus schedule uploaded successfully.");
    } catch (err) {
      console.error(err);
      res
        .status(500)
        .send("Error occurred while inserting data into the database.");
    } finally {
      client.close();
    }
  });
});
// Route to handle request for fetching route details based on route_no
router.get("/routeDetails", async (req, res) => {
  const routeNo = req.query.route_no;

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);

    // Find the route details based on the selected route number
    const route = await db.collection("routes").findOne({ route_no: routeNo });

    if (!route) {
      // If no matching route is found, send an empty response or an error message
      return res.json({
        message: "No route found with the selected route number.",
      });
    }

    res.json({ start: route.start, end: route.end });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error occurred while fetching route details.");
  } finally {
    client.close();
  }
});

router.use((req, res, next) => {
  res.status(404).render("404");
});

module.exports = router;
