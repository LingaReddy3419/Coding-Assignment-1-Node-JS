const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "todoApplication.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertTodoObject = (dbObj) => {
  return {
    id: dbObj.id,
    todo: dbObj.todo,
    priority: dbObj.priority,
    status: dbObj.status,
    category: dbObj.category,
    dueDate: dbObj.due_date,
  };
};

const queryHasPriorityAndStatus = (requestQuery) => {
  return (
    requestQuery.status !== undefined && requestQuery.priority !== undefined
  );
};

const queryHasCategoryAndStatus = (requestQuery) => {
  return (
    requestQuery.status !== undefined && requestQuery.category !== undefined
  );
};

const queryHasCategoryAndPriority = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.category !== undefined
  );
};

const queryHasStatus = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const queryHasPriority = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const queryHasCategory = (requestQuery) => {
  return requestQuery.category !== undefined;
};

//API 1
app.get("/todos/", async (request, response) => {
  let getTodosQuery = "";
  const { search_q = "", status, priority, category } = request.query;

  switch (true) {
    case queryHasPriorityAndStatus(request.query):
      getTodosQuery = `
            SELECT 
                *
            FROM 
                todo
            WHERE
                todo LIKE '%${search_q}%'
               AND status='${status}' 
               AND priority= '${priority}'
           ; `;
      break;
    case queryHasCategoryAndStatus(request.query):
      getTodosQuery = `
            SELECT 
                *
            FROM 
                todo
            WHERE
                todo LIKE '%${search_q}%'
               AND status='${status}' 
               AND category= '${category}'
        ; `;
      break;
    case queryHasCategoryAndPriority(request.query):
      getTodosQuery = `
            SELECT 
                *
            FROM 
                todo
            WHERE
                todo LIKE '%${search_q}%'
               AND priority='${priority}' 
               AND category= '${category}'
             ; `;
      break;
    case queryHasPriority(request.query):
      getTodosQuery = `
            SELECT 
                *
            FROM 
                todo
            WHERE
                todo LIKE '%${search_q}%'
                AND priority= '${priority}'
                 ; `;
      break;
    case queryHasStatus(request.query):
      getTodosQuery = `
            SELECT 
                *
            FROM 
                todo
            WHERE
                todo LIKE '%${search_q}%'
               AND status='${status}'
                 ; `;
      break;
    case queryHasCategory(request.query):
      getTodosQuery = `
            SELECT 
                *
            FROM 
                todo
            WHERE
                todo LIKE '%${search_q}%'
               AND category='${category}'
                ; `;
      break;
    default:
      getTodosQuery = `
            SELECT 
                *
            FROM 
                todo
            WHERE
                todo LIKE '%${search_q}%'
                ; `;
      break;
  }
  const data = await database.all(getTodosQuery);
  response.send(data.map((eachObj) => convertTodoObject(eachObj)));
});

//API 2
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const getTodoQuery = `
    SELECT 
      *
    FROM 
      todo 
    WHERE 
      id = ${todoId};`;
  const todo = await database.get(getTodoQuery);
  response.send(convertTodoObject(todo));
});

//API 3
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  const getTodoQueryWithDueDate = `
    SELECT * FROM 
    todo WHERE strftime("%Y-%m-%d",due_date)='${date}';`;
  const todoDb = await database.get(getTodoQueryWithDueDate);
  response.send(convertTodoObject(todoDb));
});

//API 4
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  const addTodoQuery = `
  INSERT INTO
    todo (  id,todo,priority,status,category ,due_date )
  VALUES
    (${id},'${todo}','${priority}','${status}','${category}','${dueDate}');`;
  await database.run(addTodoQuery);
  response.send("Todo Successfully Added");
});

//API 5
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
    case requestBody.category !== undefined:
      updateColumn = "Category";
      break;
    case requestBody.dueDate !== undefined:
      updateColumn = "Due Date";
      break;
  }
  const previousTodoQuery = `
    SELECT 
       *
    FROM 
      todo
    WHERE 
      id=  ${todoId};`;
  const previousTodo = await database.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    status = previousTodo.status,
    priority = previousTodo.priority,
    category = previousTodo.category,
    dueDate = previousTodo.due_date,
  } = request.body;

  const updateTodoQuery = `
  UPDATE 
    todo
  SET 
    todo='${todo}',
     status='${status}',
    priority='${priority}',
    category='${category}',
    due_date='${dueDate}'
   WHERE
     id = ${todoId};`;
  await database.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});

//API 6
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
  DELETE FROM
    todo
  WHERE
    id = ${todoId} 
  ;`;
  await database.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
