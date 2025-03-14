import React, { useState } from "react";
import Task from "./Task";
import AddForm from "./AddForm";

const TodoList = ({
  list,
  updateList,
  uploadList,
  deleteList,
  peerAddresses,
  shareList,
  unshareList
}) => {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(list.title);
  const [showPeers, setShowPeers] = useState(false);
  const [address, setAddress] = useState("");

  const handleEditTitle = () => {
    const updatedList = { ...list, title }; // creates new object with the properties of the ...object
    updateList(updatedList); // Update the list in memory
    setEditing(false);
  };

  const addTask = (text) => {
    const newTask = { id: Date.now(), text, completed: false };
    const updatedList = { ...list, tasks: [...list.tasks, newTask] };
    updateList(updatedList); // Update the list in memory
  };

  const deleteTask = (taskId) => {
    const updatedTasks = list.tasks.filter((task) => task.id !== taskId);
    const updatedList = { ...list, tasks: updatedTasks };
    updateList(updatedList); // Update the list in memory
  };

  const editTask = (taskId, text) => {
    const updatedTasks = list.tasks.map((task) =>
      task.id === taskId ? { ...task, text } : task
    );
    // alert(`updatedTasks: ${JSON.stringify(updatedTasks)}`);
    const updatedList = { ...list, tasks: updatedTasks };
    // alert(`list: ${JSON.stringify(updatedList)}`);
    updateList(updatedList);
  };

  const toggleCompleted = (taskId) => {
    const updatedTasks = list.tasks.map((task) =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    const updatedList = { ...list, tasks: updatedTasks };
    updateList(updatedList);
  };

  // Aufklappliste mit useState-Bools für Edit-Mode mit mitgegebenen Peer-Adressen
  // Share- und Unshare-Buttons sowie Share-Input-Feld (für Peer-Adresse) einbauen
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
        <Task
          key={task.id}
          task={task}
          deleteTask={deleteTask}
          updateLists={updateList}
          editTask={editTask}
          toggleCompleted={toggleCompleted}
        />
      ))}
      <button onClick={() => uploadList(list)}>Upload to IPFS</button>
      <button onClick={() => deleteList(list)}>Delete list</button>
      <p></p>

      <div style={{ display: "flex", gap: "8px" }}>
        <input
          type="text"
          placeholder="Peer address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <button onClick={() => shareList(list.id, address)}>Share</button>
      </div>

      {showPeers && peerAddresses && peerAddresses.length > 0 ? (
        <div>
          {peerAddresses
            .filter((peerObj) => peerObj.id === list.id)
            .map((peerObj) => (
              <span key={peerObj.peer}>
                {peerObj.peer}
                <button onClick={() => unshareList(list.id, peerObj.peer)}>
                  Unshare
                </button>
              </span>
            ))}

          <button onClick={() => setShowPeers(false)}>"Hide peers"</button>
        </div>
      ) : (
        <button onClick={() => setShowPeers(true)}>"Show peers"</button>
      )}
    </div>
  );
};

export default TodoList;
