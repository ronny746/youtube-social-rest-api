const express = require("express");
const app = express();
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const helmet = require("helmet");
const morgan = require("morgan");
const userRoute = require("./routes/users");
const authRoute = require("./routes/auth");
const postRoute = require("./routes/posts");


dotenv.config();

// mongoose.connect(
//   "mongodb+srv://rohit:rohit@cluster0.btddseq.mongodb.net/social?retryWrites=true&w=majority",
//   {useUnifiedTopology: true},
//   () => {
//     console.log("Connected to MongoDB");
//   }
// );
mongoose.connect('mongodb+srv://rohit:rana@cluster0.btddseq.mongodb.net/social?retryWrites=true&w=majority',
{useUnifiedTopology: true,useNewUrlParser: true},
).then(() => app.listen(8800)
).then(() => console.log("connected to Database and running on port 8800")
);

//middleware
app.use(express.json());
app.use(helmet());
app.use(morgan("common"));

app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);
app.use("/api/posts", postRoute);
app.use("/uploads", express.static("uploads"));
