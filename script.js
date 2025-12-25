const taskGrid = document.getElementById("taskGrid");
const taskTemplate = document.getElementById("taskCardTemplate").content;
const addBtn = document.querySelector(".add-btn");
const sidebarDots = document.querySelectorAll(".sidebar-dot");
const searchBar = document.querySelector(".search-bar");
const categoryFolders = document.querySelectorAll(".category");
const API_URL = "http://localhost:3000/todos";

// ===== Show/hide sidebar dots when + clicked =====
addBtn.addEventListener("click", () => {
  sidebarDots.forEach(dot => {
    dot.style.display = dot.style.display === "block" ? "none" : "block";
  });
});

// ===== Create new task card when sidebar dot clicked =====
sidebarDots.forEach(dot => {
  dot.addEventListener("click", () => {
    const color = dot.style.background;
    const clone = taskTemplate.cloneNode(true);
    const card = clone.querySelector(".task-card");
    card.style.background = color;

    // Only show add-mode elements
    const saveBtn = clone.querySelector(".save-btn");
    const titleInput = clone.querySelector(".task-title-input");
    const descInput = clone.querySelector(".task-desc-input");
    const dueInput = clone.querySelector(".due-date-input");

    // Hide display-mode elements
    clone.querySelector(".edit-btn")?.remove();
    clone.querySelector(".delete-btn")?.remove();
    clone.querySelector(".circle-checkbox")?.remove();
    clone.querySelector(".status-label")?.remove();

    // ===== Save task =====
    saveBtn.addEventListener("click", async () => {
      const title = titleInput.value.trim();
      const desc = descInput.value.trim();
      const dueDate = dueInput.value;
      const category = dot.getAttribute("data-category");

      if (!title || !dueDate) return alert("Title & due date required!");

      const newTask = { category: category, title, description: desc, dueDate, color, completed: false };

      // POST to server
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTask)
      });
      const savedTask = await res.json();

      // Remove add-mode inputs
      titleInput.remove();
      descInput.remove();
      dueInput.remove();
      saveBtn.remove();

      // Add display-mode elements
      const cardHeader = card.querySelector(".card-header");

      const titleSpan = document.createElement("span");
      titleSpan.className = "task-title";
      titleSpan.innerText = savedTask.title;
      cardHeader.appendChild(titleSpan);

      const editBtn = document.createElement("button");
      editBtn.className = "edit-btn";
      editBtn.innerText = "✎";
      cardHeader.appendChild(editBtn);

      const descP = document.createElement("p");
      descP.className = "task-desc";
      descP.innerText = savedTask.description;
      card.insertBefore(descP, card.querySelector(".card-footer"));

      const footerRight = card.querySelector(".footer-right");
      const dueSpan = document.createElement("span");
      dueSpan.className = "due-date";
      dueSpan.innerText = savedTask.dueDate;
      footerRight.insertBefore(dueSpan, footerRight.firstChild);

      const checkbox = document.createElement("div");
      checkbox.className = "circle-checkbox";
      const statusLabel = document.createElement("span");
      statusLabel.className = "status-label";
      statusLabel.innerText = "Pending";

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "delete-btn";
      deleteBtn.innerHTML = `<img src="https://img.icons8.com/ios-filled/50/000000/trash.png" alt="Delete" />`;
      footerRight.appendChild(deleteBtn);

      const cardFooter = card.querySelector(".card-footer");
      cardFooter.insertBefore(checkbox, cardFooter.firstChild);
      cardFooter.insertBefore(statusLabel, checkbox.nextSibling);

      // ===== Edit functionality =====
      editBtn.addEventListener("click", () => {
        // Replace title and desc with inputs
        const newTitleInput = document.createElement("input");
        newTitleInput.type = "text";
        newTitleInput.value = titleSpan.innerText;
        newTitleInput.className = "task-title-input";
        cardHeader.replaceChild(newTitleInput, titleSpan);

        const newDescInput = document.createElement("textarea");
        newDescInput.className = "task-desc-input";
        newDescInput.value = descP.innerText;
        card.replaceChild(newDescInput, descP);

        const newDueInput = document.createElement("input");
        newDueInput.type = "date";
        newDueInput.value = dueSpan.innerText;
        newDueInput.className = "due-date-input";
        footerRight.replaceChild(newDueInput, dueSpan);

        // Change edit button to save
        editBtn.style.display = "none";
        const saveEditBtn = document.createElement("button");
        saveEditBtn.className = "save-btn";
        saveEditBtn.innerText = "Save";
        cardHeader.appendChild(saveEditBtn);

        saveEditBtn.addEventListener("click", async () => {
          const updatedTitle = newTitleInput.value.trim();
          const updatedDesc = newDescInput.value.trim();
          const updatedDue = newDueInput.value;
          if (!updatedTitle || !updatedDue) return alert("Title & due date cannot be empty!");

          // PATCH request to update task
          await fetch(`${API_URL}/${savedTask.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: updatedTitle, description: updatedDesc, dueDate: updatedDue })
          });

          titleSpan.innerText = updatedTitle;
          descP.innerText = updatedDesc;
          dueSpan.innerText = updatedDue;

          cardHeader.replaceChild(titleSpan, newTitleInput);
          card.replaceChild(descP, newDescInput);
          footerRight.replaceChild(dueSpan, newDueInput);

          saveEditBtn.remove();
          editBtn.style.display = "inline-block";
        });
      });

      // Delete
      deleteBtn.addEventListener("click", async () => {
        await fetch(`${API_URL}/${savedTask.id}`, { method: "DELETE" });
        card.remove();
      });

      // Toggle completed
      checkbox.addEventListener("click", async () => {
        const completed = !savedTask.completed;
        await fetch(`${API_URL}/${savedTask.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ completed })
        });
        savedTask.completed = completed;
        statusLabel.innerText = completed ? "Completed" : "Pending";
        checkbox.style.background = completed ? "green" : "transparent";
      });

      // Hide sidebar dots again
      sidebarDots.forEach(d => d.style.display = "none");
    });

    taskGrid.prepend(clone);
  });
});

// ===== Load tasks from server =====
async function loadTasks(filterCategory = null) {
  let url = API_URL;
  
  // If we passed a category name, we tell the API to only give us those
  if (filterCategory) {
    url = `${API_URL}?category=${filterCategory}`;
  }
  const res = await fetch(url);
  const tasks = await res.json();
  taskGrid.innerHTML = "";

  tasks.forEach(task => {
    const clone = taskTemplate.cloneNode(true);
    const card = clone.querySelector(".task-card");
    card.style.background = task.color;

    // Remove add-mode elements
    clone.querySelector(".task-title-input")?.remove();
    clone.querySelector(".task-desc-input")?.remove();
    clone.querySelector(".due-date-input")?.remove();
    clone.querySelector(".save-btn")?.remove();

    const cardHeader = card.querySelector(".card-header");

    // Add display-mode elements
    const titleSpan = document.createElement("span");
    titleSpan.className = "task-title";
    titleSpan.innerText = task.title;
    cardHeader.appendChild(titleSpan);

    const editBtn = document.createElement("button");
    editBtn.className = "edit-btn";
    editBtn.innerText = "✎";
    cardHeader.appendChild(editBtn);

    const descP = document.createElement("p");
    descP.className = "task-desc";
    descP.innerText = task.description;
    card.insertBefore(descP, card.querySelector(".card-footer"));

    const footerRight = card.querySelector(".footer-right");
    const dueSpan = document.createElement("span");
    dueSpan.className = "due-date";
    dueSpan.innerText = task.dueDate;
    footerRight.insertBefore(dueSpan, footerRight.firstChild);

    const checkbox = clone.querySelector(".circle-checkbox");
    const statusLabel = clone.querySelector(".status-label");
    checkbox.style.background = task.completed ? "green" : "transparent";
    statusLabel.innerText = task.completed ? "Completed" : "Pending";

    const deleteBtn = clone.querySelector(".delete-btn");
    deleteBtn.addEventListener("click", async () => {
      await fetch(`${API_URL}/${task.id}`, { method: "DELETE" });
      clone.remove();
    });

    // ===== Edit functionality =====
    editBtn.addEventListener("click", () => {
      const newTitleInput = document.createElement("input");
      newTitleInput.type = "text";
      newTitleInput.value = titleSpan.innerText;
      newTitleInput.className = "task-title-input";
      cardHeader.replaceChild(newTitleInput, titleSpan);

      const newDescInput = document.createElement("textarea");
      newDescInput.className = "task-desc-input";
      newDescInput.value = descP.innerText;
      card.replaceChild(newDescInput, descP);

      const newDueInput = document.createElement("input");
      newDueInput.type = "date";
      newDueInput.value = dueSpan.innerText;
      newDueInput.className = "due-date-input";
      footerRight.replaceChild(newDueInput, dueSpan);

      editBtn.style.display = "none";
      const saveEditBtn = document.createElement("button");
      saveEditBtn.className = "save-btn";
      saveEditBtn.innerText = "Save";
      card.appendChild(saveEditBtn);
      

      saveEditBtn.addEventListener("click", async () => {
        const updatedTitle = newTitleInput.value.trim();
        const updatedDesc = newDescInput.value.trim();
        const updatedDue = newDueInput.value;
        if (!updatedTitle || !updatedDue) return alert("Title & due date cannot be empty!");

        await fetch(`${API_URL}/${task.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: updatedTitle, description: updatedDesc, dueDate: updatedDue })
        });

        titleSpan.innerText = updatedTitle;
        descP.innerText = updatedDesc;
        dueSpan.innerText = updatedDue;

        cardHeader.replaceChild(titleSpan, newTitleInput);
        card.replaceChild(descP, newDescInput);
        footerRight.replaceChild(dueSpan, newDueInput);

        saveEditBtn.remove();
        editBtn.style.display = "inline-block";
      });
    });

    checkbox.addEventListener("click", async () => {
      const completed = !task.completed;
      await fetch(`${API_URL}/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed })
      });
      task.completed = completed;
      statusLabel.innerText = completed ? "Completed" : "Pending";
      checkbox.style.background = completed ? "green" : "transparent";
    });

    taskGrid.appendChild(clone);
  });
}

        // Search Bar

// Add this at the VERY BOTTOM of your script.js
searchBar.addEventListener("input", (e) => {
  const term = e.target.value.toLowerCase();
  const cards = document.querySelectorAll(".task-card");

  cards.forEach(card => {
      // This looks at the title and description text you created in loadTasks
      const title = card.querySelector(".task-title")?.innerText.toLowerCase() || "";
      const desc = card.querySelector(".task-desc")?.innerText.toLowerCase() || "";
      
      if (title.includes(term) || desc.includes(term)) {
          card.style.display = "flex";
      } else {
          card.style.display = "none";
      }
  });
});

// ===== ADVANCED FEATURE: Category Filtering =====
categoryFolders.forEach(folder => {
  folder.addEventListener("click", () => {
      const selectedCategory = folder.getAttribute("data-category");
      
      // Remove active class from all, add to this one
      categoryFolders.forEach(f => f.classList.remove("active-folder"));
      folder.classList.add("active-folder");

      // Load only tasks that match this category
      loadTasks(selectedCategory);
  });
});

// Initial load
loadTasks();
