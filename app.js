require('dotenv').config();
const SECRET = process.env.JWT_SECRET;

const express = require("express");
const carList = require("./cars");
const users = require("./users");
const cors = require("cors");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");


const PORT = 3000;
const app = express();

//middlewares
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));


//Middleware to verify authToken
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.sendStatus(403);

  jwt.verify(token, SECRET, (err, user) => {
    if (err) return res.sendStatus(401);
    req.user = user;
    next();
  });
}
//middleware to authorizeAdmin
function authorizeAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "admins only" });
  }
  next();
}
//--USER ROUTES---//
//api route to add a new user
app.post("/api/register", authenticateToken, authorizeAdmin, (req, res) => {
  const { email, password, role } = req.body;
  //aerror boundary for an existing user
  if (users.find((u) => u.email === email)) {
    return res.status(400).json({ message: "Email already registered" });
  }
  const newUser = {
    id: users.length + 1,
    email,
    password,
    role: role || "client",
  };
  users.push(newUser);
  //generating a jwt token for a new user
  const token = jwt.sign({ email: newUser.email, role: newUser.role },
     SECRET, 
     {
    expiresIn: "1h"
  }
);

  res
    .status(201)
    .json({ message: "user added successfully", userRole: newUser, token });
});

//api route to login an existisng user
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  const user = users.find((u) => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ message: "invalid credentials" });

  const token = jwt.sign({ email: user.email, role: user.role }, SECRET, {
    expiresIn: "1h",
  });
  res.json({ message: "user logged in successfully", user: user, token });
});

//CAR ROUTES

//app entry point.. ,_dirname gives the absolute path of he current directory
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

// Add a route to get all cars for the initial display
app.get("/api/cars", (req, res) => {
  res.json(carList);
});

app.get("/api/search", (req, res) => {
  const { make, model, year, transmission, maxPrice, minPrice } =
    req.query;

  const filteredCars = carList.filter((car) => {
    const matchMake = make
      ? car.make.toLowerCase().includes(make.toLowerCase())
      : true;
    const matchModel = model
      ? car.model.toLowerCase().includes(model.toLowerCase())
      : true;
    const matchTransmission = transmission
      ? car.transmission.toLowerCase().includes(transmission.toLowerCase())
      : true;
    const matchYear = year ? car.year === parseInt(year) : true;
    const matchMaxPrice = maxPrice ? car.price <= parseInt(maxPrice) : true;
    const matchMinPrice = minPrice ? car.price >= parseInt(minPrice) : true;

    return (
      matchMake &&
      matchModel &&
      matchTransmission &&
      matchYear &&
      matchMaxPrice &&
      matchMinPrice
    );
  });

  if (filteredCars.length > 0) {
    res.json(filteredCars);
  } else {
    res.status(404).send("No matching cars found");
  }
});

//adding a new car to the database
app.post("/api/cars", authenticateToken, authorizeAdmin, (req, res) => {
  const { make, model, year, transmission, price, url } = req.body;
  const newCar = {
    id: carList.length + 1,
    make,
    model,
    year,
    transmission,
    price,
    url,
  };
  carList.push(newCar);

  res
    .status(201)
    .json({ message: "a new car has been added successfully", car: newCar });
});

//Updating a the details of a particular car
app.put("/api/cars/:id", authenticateToken, authorizeAdmin, (req, res) => {
  const car = carList.find((car) => car.id === parseInt(req.params.id));
  if (!car) return res.status(404).json({ message: "car not found" });

  const { make, model, year, transmission, price, url } = req.body;
  car.make = make || car.make;
  car.model = model || car.model;
  car.year = year || car.year;
  car.transmission = transmission || car.transmission;
  car.price = price || car.price;
  car.url = url || car.url;

  res.json({message: 'car added successfully', car});
});

//deleting  a car
app.delete("/api/cars/:id", authenticateToken, authorizeAdmin, (req, res) => {
  const index = carList.findIndex(
    (c) => c.id === parseInt(req.params.id)
  );
  if (index === -1) return res.status(404).json({ message: "car not found" });

  carList.splice(index, 1);
  res.json({ message: "car deleted successfully" });

  //   carList = carList.filter((c) => c.id !== parseInt(req.params.id))
  //   res.json({message: 'car deleted'})
});

app.listen(PORT, () => {
  console.log(`App running on localHost, port: ${PORT}`);
});
