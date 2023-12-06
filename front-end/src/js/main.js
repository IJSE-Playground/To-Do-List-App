// Importing Firebase authentication functions and the 'auth' object from './src/firebase.js'
import { signInWithPopup, signOut, onAuthStateChanged, GoogleAuthProvider } from 'firebase/auth';
import { auth } from './firebase.js';

// Creating a GoogleAuthProvider instance
const googleProvider = new GoogleAuthProvider();

// DOM elements
const txtElm = document.querySelector("#txt");                       // Input field for task description
const btnAddElm = document.querySelector("#btn-add");                // Button to add a new task
const btnSignInElm = document.querySelector("#btn-sign-in");        // Sign-in button
const btnSignOutElm = document.querySelector("#btn-sign-out");      // Sign-out button
const taskContainerElm = document.querySelector("#task-container");  // Container for displaying tasks
const loginOverlayElm = document.querySelector("#login-overlay");    // Overlay for login
const loaderElm = document.querySelector("#loader");                // Loader element
const { API_URL } = process.env; // Destructuring assignment to extract the API_URL from the process environment variables

let loggedUser = null;

// Listening for changes in authentication state
onAuthStateChanged(auth, user => {
    loaderElm.classList.add('d-none');
    loggedUser = user;
    console.log(loggedUser);
    if (user) {
        loginOverlayElm.classList.add('d-none');
        loadAllTasks();
    } else {
        loginOverlayElm.classList.remove('d-none');
    }
});

// Event listener for sign-out button
btnSignOutElm.addEventListener('click', () => {
    signOut(auth);
});

// Event listener for sign-in button
btnSignInElm.addEventListener('click', () => {
    signInWithPopup(auth, googleProvider);
});

// Function to load all tasks for the logged-in user
function loadAllTasks() {
    // Fetch tasks from the server
    fetch(`${API_URL}/tasks?email=${loggedUser.email}`).then(res => {
        if (res.ok) {
            res.json().then(taskList => {
                // Remove existing task elements
                taskContainerElm.querySelectorAll("li").forEach(li => li.remove());
                // Create new task elements
                taskList.forEach(task => createTask(task));
            });
        } else {
            // If the response is not successful, show an alert
            alert("Failed to load task list");
        }
    }).catch(err => {
        // If an error occurs during the fetch, show an alert
        alert("Something went wrong, try again later");
    });
}

// Function to create a task element and append it to the task container
function createTask(task) {
    const liElm = document.createElement('li');
    taskContainerElm.append(liElm);
    liElm.id = "task-" + task.id;
    liElm.className = 'd-flex justify-content-between p-1 px-3 align-items-center';

    liElm.innerHTML = `
    <div class="flex-grow-1 d-flex gap-2 align-items-center">
        <input class="form-check-input m-0" id="chk-task-${task.id}" type="checkbox" ${task.status ? "checked" : ""}>
        <label class="flex-grow-1" for="chk-task-${task.id}">${task.description}</label>
    </div>
    <i class="delete bi bi-trash fs-4"></i>    
    `;
}

// Event listener for click events on the task container
taskContainerElm.addEventListener('click', (e) => {
    if (e.target?.classList.contains('delete')) {
        // If the delete button is clicked, delete the task
        const taskId = e.target.closest('li').id.substring(5);

        fetch(`${API_URL}/tasks/${taskId}`, { method: 'DELETE' })
            .then(res => {
                if (res.ok) {
                    e.target.closest("li").remove();
                } else {
                    alert("Failed to delete the task");
                }
            }).catch(err => {
                alert("Something went wrong, try again later");
            });
    } else if (e.target?.tagName === "INPUT") {
        // If a checkbox is clicked, update the task status
        const taskId = e.target.closest('li').id.substring(5);
        const task = {
            description: e.target.nextElementSibling.innerText,
            status: e.target.checked
        };

        fetch(`${API_URL}/tasks/${taskId}`, {
            method: 'PATCH',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(task)
        }).then(res => {
            if (!res.ok) {
                e.target.checked = false;
                alert("Failed to update the task status");
            }
        }).catch(err => {
            e.target.checked = false;
            alert("Something went wrong, try again");
        });
    }
});

// Event listener for the "Add" button
btnAddElm.addEventListener('click', () => {
    const taskDescription = txtElm.value;

    if (!taskDescription.trim()) {
        // If the task description is empty, focus on the input field
        txtElm.focus();
        txtElm.select();
        return;
    }

    // Add a new task to the server
    fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ description: txtElm.value, email: loggedUser.email })
    }).then(res => {
        if (res.ok) {
            // If the response is successful, create the task and clear the input field
            res.json().then(task => {
                createTask(task);
                txtElm.value = "";
                txtElm.focus();
            });
        } else {
            // If the response is not successful, show an alert
            alert("Failed to add the task");
        }
    }).catch(err => {
        // If an error occurs during the fetch, show an alert
        alert("Something went wrong, try again later");
    });
});
