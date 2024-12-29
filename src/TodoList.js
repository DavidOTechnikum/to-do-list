import React, { useState } from "react";
import Task from "./Task";
import AddForm from "./AddForm";
import { saveToLocalStorage } from "./storage";

const TodoList = ({ list, updateList, deleteList, updateLists }) => {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(list.title);

  const handleEdit = () => {
    updateList(list.id, title);
    setEditing(false);
  };

  const addTask = (text) => {
    const newTask = { id: Date.now(), text, completed: false };
    const updatedTasks = [...list.tasks, newTask];
    const updatedList = { ...list, tasks: updatedTasks };
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
        <h2 onClick={() => setEditing(true)}>{list.title}</h2>
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
