import React, { useState, useEffect } from "react";
import TodoList from "./TodoList";
import AddForm from "./AddForm";
import { uploadToPinata, fetchFromPinata } from "./pinata";
import { saveToLocalStorage, loadFromLocalStorage } from "./storage";
import "./App.css";
import {
  deserializeKeys,
  newPublishToIpns,
  republishToIpns,
  resolveFromIpns
} from "./ipns";
import { ipns } from "@helia/ipns";

const App = () => {
  const [lists, setLists] = useState([]); // memory for rendering right now
  const [deserKeys, setDeserKeys] = useState([]);
  const [ipnsKeys, setIpnsKeys] = useState(
    () => JSON.parse(localStorage.getItem("ipnsKeys")) || []
  );
  useEffect(() => {
    localStorage.setItem("ipnsKeys", JSON.stringify(ipnsKeys));
  }, [ipnsKeys]);

  const [hashes, setHashes] = useState(
    () => JSON.parse(localStorage.getItem("todoHashes")) || []
  );

  useEffect(() => {
    localStorage.setItem("todoHashes", JSON.stringify(hashes));
  }, [hashes]);

  const addList = async (title) => {
    const newList = { id: Date.now(), title, tasks: [] };
    setLists((prev) => [...prev, newList]);
    const cid = await uploadToPinata(newList);
    const serializedKeyPair = await newPublishToIpns(cid);
    setIpnsKeys((prev) => [
      ...prev,
      { id: newList.id, key: serializedKeyPair }
    ]);
  };

  /*
  const uploadList = async (list) => {
    try {
      const cid = await uploadToPinata(list);
      setHashes((prev) => [...prev, { id: list.id, cid }]);
      alert(`List uploaded to IPFS! CID: ${cid}`);
    } catch (error) {
      alert("Failed to upload list to IPFS.");
    }
    return cid;
  };
*/

  const uploadList = async (list) => {
    const cid = await uploadToPinata(list);
    ipnsKeys.map((l) => {
      if (l.id === list.id) {
        republishToIpns(l.key, cid);
      }
    });
    // republishToIpns(keyPairString, cid);
  };

  /*
  const fetchList = async (hash) => {
    try {
      const list = await fetchFromPinata(hash);
      setLists((prev) => [...prev, list]);
    } catch (error) {
      alert("Failed to fetch list from IPFS.");
    }
  };
  */

  const fetchLists = async () => {
    const resetList = [];
    const resetDeserList = [];
    setLists(resetList);
    setDeserKeys(resetDeserList);

    // try:
    ipnsKeys.map(async (l) => {
      const keyPair = await deserializeKeys(l.key);
      setDeserKeys((prev) => [...prev, keyPair.publicKey]);
    });

    deserKeys.map(async (deserKey) => {
      alert(`deserKey: ${deserKey}`);
      // const result = await resolveFromIpns(deserKey);
    });

    deserKeys.map(async (l) => {
      const result = await resolveFromIpns(l);
      const list = await fetchFromPinata(result.cid);
      setLists((prev) => [...prev, list]);
    });

    /*
    ipnsKeys.map(async (l) => {
      const keyPair = await deserializeKeys(l.key);
      alert(`fetchlist keydeser: ${keyPair.publicKey}`);
      const result = await resolveFromIpns(keyPair.publicKey);
      const list = await fetchFromPinata(result.cid);
      setLists((prev) => [...prev, list]);
    });
*/
  };

  const updateList = (updatedList) => {
    const updatedLists = lists.map((list) =>
      list.id === updatedList.id ? updatedList : list
    );
    setLists(updatedLists);
    // uploadList(updatedList); // Re-upload the updated list to Pinata
  };

  return (
    <div>
      <AddForm placeholder="Add new list" onSubmit={addList} />
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "16px",
          marginTop: "16px"
        }}
      >
        {lists.map((list) => (
          <TodoList
            key={list.id}
            list={list}
            updateList={updateList}
            uploadList={uploadList}
          />
        ))}
      </div>
      <div>
        <button onClick={fetchLists}>Fetch all Lists</button>
      </div>
    </div>
  );
};

export default App;

/*
const App = () => {
  const [lists, setLists] = useState([]);
  const [hashes, setHashes] = useState(
    () => JSON.parse(localStorage.getItem("todoHashes")) || []
  );

  useEffect(() => {
    localStorage.setItem("todoHashes", JSON.stringify(hashes));
  }, [hashes]);

  
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
  

  const addList = (title) => {
    const newList = { id: Date.now(), title, tasks: [] };
    setLists((prev) => [...prev, newList]);
  };

  
  const updateList = (id, newTitle) => {
    const updatedLists = lists.map((list) =>
      list.id === id ? { ...list, title: newTitle } : list
    );
    setLists(updatedLists);
    saveToLocalStorage("todoLists", updatedLists);
  };
  

  const uploadList = async (list) => {
    try {
      const hash = await uploadToPinata(list);
      setHashes((prev) => [...prev, { id: list.id, hash }]);
      alert(`List uploaded to IPFS! CID: ${hash}`);
    } catch (error) {
      alert("Failed to upload list to IPFS.");
    }
  };

  const fetchList = async (hash) => {
    try {
      const list = await fetchFromPinata(hash);
      setLists((prev) => [...prev, list]);
    } catch (error) {
      alert("Failed to fetch list from IPFS.");
    }
  };

  /*
  const deleteList = (id) => {
    const updatedLists = lists.filter((list) => list.id !== id);
    setLists(updatedLists);
    saveToLocalStorage("todoLists", updatedLists);
  };
  */
/*
  const importJSON = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedList = JSON.parse(e.target.result);
          // Validate imported data
          if (
            importedList &&
            importedList.id &&
            importedList.title &&
            Array.isArray(importedList.tasks)
          ) {
            const updatedLists = [...lists, importedList];
            setLists(updatedLists);
            saveToLocalStorage("todoLists", updatedLists);
            alert("List imported successfully!");
          } else {
            alert("Invalid JSON format.");
          }
        } catch (error) {
          alert("Error parsing JSON file.");
        }
      };
      reader.readAsText(file);
    }
  };


  return (
    <div>
      <AddForm placeholder="Add new list" onSubmit={addList} />
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "16px",
          marginTop: "16px",
        }}
      >
        {lists.map((list) => (
          <TodoList key={list.id} list={list} uploadList={uploadList} />
        ))}
      </div>
      <div>
        <h3>Fetch Lists from IPFS</h3>
        {hashes.map(({ id, hash }) => (
          <div key={id}>
            <span>{hash}</span>
            <button onClick={() => fetchList(hash)}>Fetch List</button>
          </div>
        ))}
      </div>
    </div>
  );
};

/*
  return (
    <div>
      <h1>TO-DO LISTS</h1>
      <AddForm placeholder="Add new list" onSubmit={addList} />
      <input
        type="file"
        accept="application/json"
        onChange={importJSON}
        style={{ marginTop: "16px", marginBottom: "16px" }}
      />
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
