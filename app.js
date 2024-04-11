const express = require("express");
const app = express();
const morgan = require("morgan");
const mongoose = require("mongoose");
const cors = require("cors");
const authJwt = require('./helpers/jwt');
const cloudinary = require("cloudinary");
const errorHandler = require('./helpers/error-handler');
require("dotenv/config");
require('events').EventEmitter.defaultMaxListeners = 20;

app.use(cors());
app.options("*", cors());


app.use(express.json());
app.use(morgan('tiny'));
app.use(authJwt());
app.use(errorHandler);
app.use("/public/uploads", express.static(__dirname + "/public/uploads"));



//Routes
const clearancesRoutes = require("./routes/clearances")
const usersRoutes = require("./routes/users");
const documentsRoutes = require("./routes/documents");
const requestsRoutes = require("./routes/requests");
const schedulesRoutes = require("./routes/schedules");
const violationsRoutes = require("./routes/violations");
const balancesRoutes = require("./routes/balances")
const productsRoutes = require("./routes/products");
const categoriesRoutes = require("./routes/categories");
const ordersRoutes = require("./routes/orders");




const api = process.env.API_URL;

app.use (`${api}/clearances`, clearancesRoutes);
app.use(`${api}/documents`, documentsRoutes);
app.use(`${api}/users`, usersRoutes);
app.use(`${api}/requests`, requestsRoutes);
app.use(`${api}/schedules`, schedulesRoutes);
app.use(`${api}/violations`, violationsRoutes);
app.use(`${api}/balances`, balancesRoutes);
app.use(`${api}/products`, productsRoutes);
app.use(`${api}/categories`, categoriesRoutes);
app.use(`${api}/orders`, ordersRoutes);




//Cloudinary API
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

mongoose
.connect(process.env.CONNECTION_STRING, {
    useNewUrlParser: true,
    useUnifiedTopology: true,

})
.then(()=> {
    console.log("Database Connection is ready...");
   
})
.catch((err) => {
    console.log(err);
});

app.listen(4000, () => {
    console.log("server is running http://localhost:4000");
});

