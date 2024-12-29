import React, { useState } from "react";
import Task from "./Task";
import AddForm from "./AddForm";
import { saveToLocalStorage } from "./storage";

// This is the template for processing the lists' information.
// We passed the list array itself and three functions from App.js.
const TodoList = ({ list, updateList, deleteList, updateLists }) => {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(list.title);

  const handleEdit = () => {
    updateList(list.id, title);
    setEditing(false);
  };

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
  };

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
    </div>
  );
};

export default TodoList;
