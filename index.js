var express = require("express");
var bodyParser = require("body-parser");
var multer = require("multer");
var path = require("path");
var app = express();
const PORT = process.env.PORT || 5050;
var startPage = "index.html";
var unUsedVariable = 0;
// asdf

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

const { viewTasks } = require("./utils/ViewTasksUtil");
app.get("/view-tasks", viewTasks);

const { createTask } = require("./utils/XavierLeeUtil");
app.post("/create-task", upload.single("image"), createTask);

const { updateTask } = require("./utils/IsaacTanUtil");
app.put("/update-task/:id", updateTask);

const { deleteTask } = require("./utils/AaronSim");
app.delete("/delete-task/:id", deleteTask);

app.use(express.static("./public"));
app.use("/uploads", express.static("./uploads"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/" + startPage);
});

const server = app.listen(PORT, function () {
  console.log(`Project at: http://localhost:${PORT}`);
});
module.exports = { app, server };
