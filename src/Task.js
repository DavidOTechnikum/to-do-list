import React, { useState } from "react";
import { saveToLocalStorage } from "./storage";

// Template for processing the task info created in TodoList:
const Task = ({
  task,
  listId,
  updateLists,
  deleteTask,
  editTask,
  toggleCompleted
}) => {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(task.text);

  const handleEdit = () => {
    editTask(task.id, text);
    setEditing(false);
  };
  /*
  const handleEdit = () => {
    updateLists((prev) => {
      const updatedLists = prev.map((list) => {
        if (list.id === listId) {
          const updatedTasks = list.tasks.map((t) =>
            t.id === task.id ? { ...t, text } : t
          );
          return { ...list, tasks: updatedTasks };
        }
        return list;
      });
      saveToLocalStorage("todoLists", updatedLists);
      return updatedLists;
    });
    setEditing(false);
  };
  */

  /*
  const deleteTask = () => {
    updateLists((prev) => {
      const updatedLists = prev.map((list) => {
        if (list.id === listId) {
          const updatedTasks = list.tasks.filter((t) => t.id !== task.id);
          return { ...list, tasks: updatedTasks };
        }
        return list;
      });
      saveToLocalStorage("todoLists", updatedLists);
      return updatedLists;
    });
  };
*/

  /*
  const toggleCompleted = () => {
    updateLists((prev) => {
      const updatedLists = prev.map((list) => {
        if (list.id === listId) {
          const updatedTasks = list.tasks.map((t) =>
            t.id === task.id ? { ...t, completed: !t.completed } : t
          );
          return { ...list, tasks: updatedTasks };
        }
        return list;
      });
      saveToLocalStorage("todoLists", updatedLists);
      return updatedLists;
    });
  };
*/

  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
      <input
        type="checkbox"
        checked={task.completed}
        onChange={() => toggleCompleted(task.id)}
        style={{ marginRight: "8px" }}
      />
      {editing ? (
        <div>
          <input value={text} onChange={(e) => setText(e.target.value)} />
          <button onClick={handleEdit}>Accept</button>
          <button onClick={() => deleteTask(task.id)}>Delete</button>
        </div>
      ) : (
        <span
          title="edit"
          onClick={() => setEditing(true)}
          style={{
            textDecoration: task.completed ? "line-through" : "none",
            cursor: "pointer"
          }}
        >
          {task.text}
        </span>
      )}
    </div>
  );
};

export default Task;
