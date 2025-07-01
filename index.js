const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { initializeDatabase } = require("./db/db.connect");
const Project = require("./models/project.model");
const Task = require("./models/task.model");
const Team = require("./models/team.model");
const User = require("./models/user.model");
const Tag = require("./models/tag.model");
const JWT_SECRET = process.env.SECRET_KEY;

const app = express();
app.use(express.json());

initializeDatabase();

const corsOptions = {
  origin: [
    "http://localhost:3000",
    "https://planora-frontend.vercel.app",
    "https://planora-backend-lime.vercel.app",
  ],
  credentials: true,
  optionSuccessStatus: 200,
};

app.use(cors(corsOptions));

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

app.get("/", (req, res) => {
  res.send("Hello, Express!");
});

app.post("/projects", async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !description) {
      return res.status(400).json({ message: "Invalid input." });
    } else {
      const projectData = new Project({ name, description });
      await projectData.save();
      res.status(201).json(projectData);
    }
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal Server Error.", message: error.message });
  }
});

app.get("/projects", async (req, res) => {
  try {
    const allProject = await Project.find();
    if (allProject.length === 0) {
      return res.status(404).json({ message: "No project found." });
    }
    res.status(200).json(allProject);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal Server Error.", message: error.message });
  }
});

app.delete("/projects/:id", async (req, res) => {
  try {
    const projectId = req.params.id;
    if (!isValidObjectId(projectId)) {
      return res.status(400).json({ message: "Invalid Project Id" });
    }
    const deletedProject = await Project.findByIdAndDelete(projectId);
    if (deletedProject) {
      res
        .status(200)
        .json({ message: "Project deleted sucessfully.", deletedProject });
    } else {
      res
        .status(404)
        .json({ message: `Project Not found with ID ${projectId}.` });
    }
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal Server Error.", message: error.message });
  }
});

app.post("/teams", async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !description) {
      return res.status(400).json({ message: "Input field Missing" });
    } else {
      const teamData = new Team({ name, description });
      await teamData.save();
      res.status(201).json(teamData);
    }
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal Server Error.", message: error.message });
  }
});

app.get("/teams", async (req, res) => {
  try {
    const allTeams = await Team.find();
    if (allTeams.length === 0) {
      return res.status(404).json({ message: "No teams found" });
    }
    res.status(200).json(allTeams);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal Server Error.", message: error.message });
  }
});

app.delete("/teams/:id", async (req, res) => {
  try {
    const teamId = req.params.id;
    if (!isValidObjectId(teamId)) {
      return res.status(400).json({ message: `Invalid Team Id ${teamId}` });
    }
    const deletedTeam = await Team.findByIdAndDelete(teamId);
    if (deletedTeam) {
      res
        .status(200)
        .json({ message: "Team deleted Succcessfully", deletedTeam });
    } else {
      res.status(404).json({ message: `Team not found with ID ${teamId}` });
    }
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal Server Error.", message: error.message });
  }
});

app.post("/user/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Missing Input Fields." });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }
    const userData = new User({ name, email, password });
    await userData.save();
    res.status(201).json({ message: "User Registered Successfully", userData });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal Server Error.", message: error.message });
  }
});

app.post("/user/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Missing email or password" });
    }
    const user = await User.findOne({ email, password });
    if (user) {
      const token = jwt.sign(
        { name: user.name, email: user.email },
        JWT_SECRET,
        { expiresIn: "24h" }
      );
      res.status(200).json({ message: "Login Successful", token });
    } else {
      return res.status(401).json({ message: "User not found" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal Server Error.", message: error.message });
  }
});

const verifyJWT = (req, res, next) => {
  const token = req.headers["authorization"];

  if (!token) {
    return res.status(401).json({ mesasge: "No token provided" });
  }
  try {
    const decodedToken = jwt.verify(token, JWT_SECRET);
    req.user = decodedToken;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid Token" });
  }
};
app.get("/user/me", verifyJWT, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    if (user) {
      const { password, ...userDetail } = user._doc;
      res.status(200).json(userDetail);
    } else {
      res.status(404).json({ message: "Invalid User" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: "Unable to fetch user details", error: error.message });
  }
});

app.delete("/user/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    if (!isValidObjectId(userId)) {
      return res.status(400).json({ message: `Invalid user ID ${userId}` });
    }
    const deletedUser = await User.findByIdAndDelete(userId);
    if (deletedUser) {
      res.status(200).json({ message: "User Deleted Successfully" });
    } else {
      res.status(404).json({ message: `User not found with ID ${userId}` });
    }
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal Server Error.", message: error.message });
  }
});

app.get("/users", async (req, res) => {
  try {
    const allUsers = await User.find().populate("team");
    if (allUsers.length > 0) {
      res.status(200).json(allUsers);
    } else {
      res.status(404).json({ message: "Users Not Found" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal Server Error.", message: error.message });
  }
});

app.post("/users/:id", async (req, res) => {
  try {
    const userIdToUpdate = req.params.id;
    const userDataToUpdate = req.body;
    if (!isValidObjectId(userIdToUpdate)) {
      return res.status(400).json({
        message: `Invalid user ID: ${userIdToUpdate}`,
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userIdToUpdate,
      userDataToUpdate,
      { new: true }
    );

    if (updatedUser) {
      res.status(200).json(updatedUser);
    } else {
      res
        .status(404)
        .json({ message: `User not found with ID ${userIdToUpdate}` });
    }
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal Server Error.", message: error.message });
  }
});

app.post("/tasks", async (req, res) => {
  try {
    const { name, project, team, owners, tags, timeToComplete, status } =
      req.body;
    if (
      !name ||
      !project ||
      !team ||
      !owners ||
      !tags ||
      !timeToComplete ||
      !status
    ) {
      return res.status(404).json({ message: "Missing Input Fields" });
    }
    if (
      !isValidObjectId(project) ||
      !isValidObjectId(team) ||
      !Array.isArray(owners) ||
      owners.some((id) => !isValidObjectId(id))
    ) {
      return res.status(400).json({ message: "Invalid Object ID" });
    }
    const task = new Task({
      name,
      project,
      team,
      owners,
      tags,
      timeToComplete,
      status,
    });

    const savedTask = await task.save();
    res.status(201).json(savedTask);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal Server Error.", message: error.message });
  }
});

app.post("/tasks/:id", async (req, res) => {
  try {
    const taskId = req.params.id;
    const dataToUpdate = req.body;

    const updatedTask = await Task.findByIdAndUpdate(taskId, dataToUpdate, {
      new: true,
    })
      .populate("project")
      .populate("team")
      .populate("owners", "name email");
    if (updatedTask) {
      res.status(200).json(updatedTask);
    } else {
      res.status(404).json({ message: `Task not found with ID ${taskId}` });
    }
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal Server Error.", message: error.message });
  }
});

app.get("/tasks", async (req, res) => {
  try {
    const { project, team, owners, tags, status } = req.query;
    const filters = {};

    if (project && isValidObjectId(project)) {
      filters.project = project;
    }
    if (team && isValidObjectId(team)) {
      filters.team = team;
    }
    if (owners) {
      const ownerIds = owners.split(",").filter((id) => isValidObjectId(id));
      if (ownerIds.length > 0) filters.owners = { $all: ownerIds };
    }
    if (tags) {
      const tagArray = tags.split(",");
      if (tagArray.length > 0) filters.tags = { $in: tagArray };
    }
    const allowedStatus = ["To Do", "In Progress", "Completed", "Blocked"];
    if (status) {
      if (!allowedStatus.includes(status)) {
        return res.status(400).json({
          error: `Invalid input: 'status' must be one of ${allowedStatus}`,
        });
      } else {
        filters.status = status;
      }
    }

    const filteredTask = await Task.find(filters)
      .populate("project")
      .populate("team")
      .populate("owners", "name email")
      .lean();

    if (filteredTask.length > 0) {
      res.status(200).json(filteredTask);
    } else {
      res.status(404).json({ message: "No Task Found with the Filters." });
    }
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal Server Error.", message: error.message });
  }
});

app.delete("/tasks/:id", async (req, res) => {
  try {
    const taskId = req.params.id;
    const deletedTask = await Task.findByIdAndDelete(taskId);
    if (deletedTask) {
      res.status(200).json(deletedTask);
    } else {
      res.status(404).json({ message: `Task not found with ID ${taskId}` });
    }
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal Server Error.", message: error.message });
  }
});

app.listen(3001, () => {
  console.log("The server is started on port 3001");
});
