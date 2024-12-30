import React, { useState } from "react";
import Task from "./Task";
import AddForm from "./AddForm";

const TodoList = ({ list, updateList, uploadList }) => {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(list.title);

  const handleEditTitle = () => {
    const updatedList = { ...list, title };
    updateList(updatedList); // Upload the updated list to Pinata
    setEditing(false);
  };

  const addTask = (text) => {
    const newTask = { id: Date.now(), text, completed: false };
    const updatedList = { ...list, tasks: [...list.tasks, newTask] };
    updateList(updatedList); // Upload the updated list to Pinata
  };

  const deleteTask = (taskId) => {
    const updatedTasks = list.tasks.filter((task) => task.id !== taskId);
    const updatedList = { ...list, tasks: updatedTasks };
    updateList(updatedList); // Upload the updated list to Pinata
  };

  return (
    <div>
      {editing ? (
        <div>
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
          <button onClick={handleEditTitle}>Accept</button>
        </div>
      ) : (
        <h3 onClick={() => setEditing(true)}>{list.title}</h3>
      )}
      <AddForm placeholder="Add new task" onSubmit={addTask} />
      {list.tasks.map((task) => (
        <Task key={task.id} task={task} deleteTask={deleteTask} />
      ))}
      <button onClick={() => uploadList(list)}>Upload to IPFS</button>
    </div>
  );
};

export default TodoList;

/*
import React, { useState } from "react";
import Task from "./Task";
import AddForm from "./AddForm";
// import { saveToLocalStorage } from "./storage";

// This is the template for processing the lists' information.
// We passed the list array itself and three functions from App.js.
const TodoList = ({ list, updateList, deleteList, updateLists }) => {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(list.title);

  const handleEdit = () => {
    updateList(list.id, title);
    setEditing(false);
  };

  const addTask = (text) => {
    const newTask = { id: Date.now(), text, completed: false };
    updateLists((prev) => {
      const updatedLists = prev.map((l) =>
        l.id === list.id ? { ...l, tasks: [...l.tasks, newTask] } : l
      );
      return updatedLists;
    });
  };

  const exportToJSON = () => {
    const dataStr = JSON.stringify(list, null, 2); // Convert to JSON string with formatting
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${list.title || "todo-list"}.json`;
    link.click();

    // Clean up URL object
    URL.revokeObjectURL(url);
  };

  /*
  // New tasks (i.e. their information) are created here and appended to the list's task array.
  const addTask = (text) => {
    const newTask = { id: Date.now(), text, completed: false };

    // Append the new task to the list's existing task array via an auxiliary array:
    const updatedTasks = [...list.tasks, newTask];

    // Overwrite the list's task array with the auxiliary array:
    const updatedList = { ...list, tasks: updatedTasks };

    // Overwrite our list (identified via the id attribute) with the newly updated list:
    updateLists((prev) => {
      const updated = prev.map((l) => (l.id === list.id ? updatedList : l));
      saveToLocalStorage("todoLists", updated);
      return updated;
    });


  return (
    <div>
      {editing ? (
        <div>
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
          <button onClick={handleEdit}>Accept</button>
          <button onClick={() => deleteList(list.id)}>Delete List</button>
        </div>
      ) : (
        <h2 title="edit" onClick={() => setEditing(true)}>
          {list.title}
        </h2>
      )}

      {list.tasks.map((task) => (
        <>
          <Task
            key={task.id}
            task={task}
            listId={list.id}
            updateLists={updateLists}
          />
        </>
      ))}
      <AddForm placeholder="Add new task" onSubmit={addTask} />
      <button onClick={() => uploadList(list)}>Upload to IPFS</button>
    </div>
  );
};

export default TodoList;
*/
