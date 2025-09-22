const express = require("express");
const app = express();
const { MongoClient } = require("mongodb");
require("dotenv").config();
uri = process.env.MONGO_CONNECTION;
const client = new MongoClient(uri);
const methodOverride = require("method-override");

async function main() {
  try {
    await client.connect();
    const db = client.db("todo");
    const collection = db.collection("todolist");
    console.log("Connected to mongodb");
    app.set("view engine", "ejs");
    app.use(methodOverride("_method"));
    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());
    app.listen(3000, () => {
      message: "Server running on port 3000";
    });

    app.get("/", async (req, res) => {
      let { deleted = "" } = req.query;
      if (deleted !== "") {
        deleted += " deleted";
      }
      let allItems = await collection.find({}).toArray();
      const sortedItems = allItems.sort(
        (a, b) => new Date(a.dueDate) - new Date(b.dueDate)
      );
      if (allItems.length > 0) {
        let result = "<table>";
        for (const { title, description, dueDate, priority } of sortedItems) {
          if (priority === "high") {
            result += `<tr style="background-color: red"><td><br><a href = "/item/${title}">Name: ${title}</a></br></td><td>Priority: ${priority}</td><td>Description: ${description}</td><td>Date due: ${dueDate}</td></tr>`;
          } else if (priority === "medium") {
            result += `<tr style="background-color: orange"><td><br><a href = /item/${title}>Name: ${title}</a></br></td><td>Priority: ${priority}</td><td>Description: ${description}</td><td>Date due: ${dueDate}</td></tr>`;
          } else {
            result += `<tr style="background-color: green"><td><br><a href = /item/${title}>Name: ${title}</a></br></td><td>Priority: ${priority}</td><td>Description: ${description}</td><td>Date due: ${dueDate}</td></tr>`;
          }
        }
        result += "</table>";
        res.status(200).render("index", {
          todo: true,
          todolist: result,
          delMsg: `${deleted}`,
        });
      } else {
        res.status(200).render("index", {
          todo: false,
          todolist: null,
          delMsg: `${deleted}`,
        });
      }
    });

    app.get("/addThings", (req, res) => {
      res.status(200).render("addThings", { added: false, confirmMsg: null });
    });

    app.get("/item/:title", async (req, res) => {
      let item = await collection.findOne({
        title: { $regex: req.params.title, $options: "i" },
      });
      const { title, description, dueDate, priority } = item;
      res.status(200).render("item", {
        title: title,
        description: description,
        dueDate: dueDate,
        priority: priority,
      });
    });

    app.delete("/item/:title", async (req, res) => {
      let title = req.params.title;
      await collection.deleteOne({ title: { $regex: title, $options: "i" } });
      res.status(200).redirect(`/?deleted=${title}`);
    });

    app.post("/add", async (req, res) => {
      const title = req.body.title;
      const description = req.body.description;
      const dueDate = req.body.datetime;
      const priority = req.body.priority;
      await collection.insertOne({
        title: title,
        description: description,
        dueDate: dueDate,
        priority: priority,
      });
      res.status(200).render("addThings", {
        added: true,
        confirmMsg: `<p>Successfully added ${title}</p>`,
      });
    });
  } catch (error) {
    console.log(error);
  }
}

main();
