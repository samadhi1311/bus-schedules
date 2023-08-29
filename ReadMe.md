# Bus Shedules Web App.

# Frontend technologies:
    HTML/CSS/JS

# Backend technologies:
    Body-parser
    EJS
    Express
    Express-Session
    Mongodb

# Project file structure
    |- public
    |    |- images
    |    |    |- bus_icon.png
    |    |
    |    |- stylesheets
    |         |- 404.cs
    |         |- about.cs
    |         |- contribute.cs
    |         |- index.cs
    |         |- login.cs
    |         |- master.cs
    |    
    |- routes
    |    |- shedules.routes.js
    |
    |- views
    |    |- 404.ejs
    |    |- about.js
    |    |- contribute.ejs
    |    |- index.ejs
    |    |- login.ejs
    |
    |- app.js


# The api inserts and retrieves data to a mongoDB cluster on cloud.

How does this work.\
    1. Users can search for shedules by selecting route 'starting point' and 'ending point'.\
    2. Then the api will search for routes that contains selected points 'in order'. But, we have to consider about the 'route_reversed' value.\
    3. If matches are available, it will show the output.\

Schema of the database.

    Buses_collection
    {
        license_no: {
            type: String,
            required: true
        },
        route_no: String,
        route_start_times: String[],
        route_finish_times String[],
        contact_no: String,
        route_reversed: Boolean,
    }

    Routes_collection
    {
        route_no: String,
        routes: String[],
    }

