import React, { useState, useEffect } from "react";
import TodoList from "./TodoList";
import AddForm from "./AddForm";
import { saveToLocalStorage, loadFromLocalStorage } from "./storage";
import "./App.css";

const App = () => {
  const [lists, setLists] = useState([]);

  useEffect(() => {
    const savedLists = loadFromLocalStorage("todoLists");
    if (savedLists) {
      setLists(savedLists);
    }
  }, []);

  const addList = (title) => {
    const newList = { id: Date.now(), title, tasks: [] };
    const updatedLists = [...lists, newList];
    setLists(updatedLists);
    saveToLocalStorage("todoLists", updatedLists);
  };

  const updateList = (id, newTitle) => {
    const updatedLists = lists.map((list) =>
      list.id === id ? { ...list, title: newTitle } : list
    );
    setLists(updatedLists);
    saveToLocalStorage("todoLists", updatedLists);
  };

  const deleteList = (id) => {
    const updatedLists = lists.filter((list) => list.id !== id);
    setLists(updatedLists);
    saveToLocalStorage("todoLists", updatedLists);
  };

  return (
    <div>
      <h1>TO-DO LISTS</h1>
      <AddForm placeholder="Add new list" onSubmit={addList} />
      <div className="list-container">
        {lists.map((list) => (
          <div key={list.id} className="list-item">
            <TodoList
              key={list.id}
              list={list}
              updateList={updateList}
              deleteList={deleteList}
              updateLists={setLists}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;

/*
import React, { useState } from "react";
import TodoList from "./TodoList";
import AddForm from "./AddForm";
import { saveToLocalStorage, loadFromLocalStorage } from "./storage";

const App = () => {
  const [lists, setLists] = useState(loadFromLocalStorage("todoLists") || []);

  const addList = (title) => {
    const newList = { id: Date.now(), title, tasks: [] };
    const updatedLists = [...lists, newList];
    setLists(updatedLists);
    saveToLocalStorage("todoLists", updatedLists);
  };

  const updateList = (id, updatedTitle) => {
    const updatedLists = lists.map((list) =>
      list.id === id ? { ...list, title: updatedTitle } : list
    );
    setLists(updatedLists);
    saveToLocalStorage("todoLists", updatedLists);
  };

  const deleteList = (id) => {
    const updatedLists = lists.filter((list) => list.id !== id);
    setLists(updatedLists);
    saveToLocalStorage("todoLists", updatedLists);
  };

  return (
    <div>
      <h1>To-Do List App</h1>
      <AddForm placeholder="Add new list" onSubmit={addList} />
      {lists.map((list) => (
        <TodoList
          key={list.id}
          list={list}
          updateList={updateList}
          deleteList={deleteList}
          updateLists={setLists}
        />
      ))}
    </div>
  );
};

export default App;
*/

/*
import logo from "./logo.svg";
import "./App.css";
import React, { useState } from "react";

const App = () => {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");

  const addTask = () => {
    if (newTask.trim()) {
      setTasks([...tasks, { id: Date.now(), text: newTask, completed: false }]);
      setNewTask("");
    }
  };

  const toggleTask = (id) => {
    const updatedTasks = tasks.map((task) =>
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    setTasks(updatedTasks);
  };

  const deleteTask = (id) => {
    const updatedTasks = tasks.filter((task) => task.id !== id);
    setTasks(updatedTasks);
  };

  return (
    <div>
      <h1>LISTE</h1>
      <div>
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="New task"
        />
        <button onClick={addTask}>Add task</button>
      </div>


      <ul>
        {tasks.map((task) => (
          <li key={task.id}>
            <input
              type="checkbox"
              checked={task.completed}
              onChange={() => toggleTask(task.id)}
            />
            <span
              style={{
                textDecoration: task.completed ? "line-through" : "none",
              }}
            >
              {task.text}
            </span>
            <button onClick={() => deleteTask(task.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default App;

*/
