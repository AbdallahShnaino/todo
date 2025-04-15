document.addEventListener("DOMContentLoaded", function () {
  const todoForm = document.getElementById("todo-form");
  const todoInput = document.getElementById("todo-input");
  const todoList = document.getElementById("todo-list");
  const itemsCount = document.getElementById("items-count");
  const filterButtons = document.querySelectorAll(".filter-btn");
  const clearCompletedBtn = document.getElementById("clear-completed");
  const themeToggle = document.getElementById("theme-toggle");
  const themeIcon = document.getElementById("theme-icon");
  const body = document.body;

  let todos = JSON.parse(localStorage.getItem("todos")) || [];
  let currentFilter = "all";
  let draggedItem = null;

  renderTodos();
  updateItemsCount();
  initTheme();

  todoForm.addEventListener("submit", addTodo);
  clearCompletedBtn.addEventListener("click", clearCompletedTodos);
  themeToggle.addEventListener("click", toggleTheme);

  function initTheme() {
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    if (savedTheme) {
      body.setAttribute("data-theme", savedTheme);
    } else if (systemPrefersDark) {
      body.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
    } else {
      body.setAttribute("data-theme", "light");
      localStorage.setItem("theme", "light");
    }
    updateThemeIcon();
  }

  todoForm.addEventListener("submit", addTodo);
  clearCompletedBtn.addEventListener("click", clearCompletedTodos);
  themeToggle.addEventListener("click", toggleTheme);

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      filterButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");
      currentFilter = button.dataset.filter;
      renderTodos();
    });
  });

  todoList.addEventListener("dragstart", handleDragStart);
  todoList.addEventListener("dragover", handleDragOver);
  todoList.addEventListener("drop", handleDrop);
  todoList.addEventListener("dragend", handleDragEnd);

  function addTodo(e) {
    e.preventDefault();
    const text = todoInput.value.trim();

    if (text) {
      const newTodo = {
        id: Date.now(),
        text,
        completed: false,
      };

      todos.push(newTodo);
      saveTodos();
      renderTodos();
      updateItemsCount();
      todoInput.value = "";
    }
  }

  function renderTodos() {
    todoList.innerHTML = "";

    const filteredTodos = todos.filter((todo) => {
      if (currentFilter === "all") return true;
      if (currentFilter === "active") return !todo.completed;
      if (currentFilter === "completed") return todo.completed;
      return true;
    });

    if (filteredTodos.length === 0) {
      const emptyMessage = document.createElement("p");
      emptyMessage.className = "empty-list";
      emptyMessage.textContent = "No todos found";
      emptyMessage.classList.add("empty-message");
      todoList.appendChild(emptyMessage);
      return;
    }

    filteredTodos.forEach((todo) => {
      const todoItem = document.createElement("li");
      todoItem.className = "todo-item";
      todoItem.draggable = true;
      todoItem.dataset.id = todo.id;

      todoItem.innerHTML = `
                <label class="checkbox">
                    <input type="checkbox" ${todo.completed ? "checked" : ""}>
                    <span class="custom-checkbox"></span>
                </label>
                <span class="todo-text ${todo.completed ? "completed" : ""}">${
        todo.text
      }</span>
                <button class="delete-btn" aria-label="Delete todo">
                <img
                   src="./images/icon-cross.svg"
                 />             
     </button>
            `;

      const checkbox = todoItem.querySelector("input");
      const deleteBtn = todoItem.querySelector(".delete-btn");
      const todoText = todoItem.querySelector(".todo-text");

      checkbox.addEventListener("change", () => toggleComplete(todo.id));
      deleteBtn.addEventListener("click", () => deleteTodo(todo.id));
      todoText.addEventListener("dblclick", () => editTodo(todo.id, todoText));

      todoList.appendChild(todoItem);
    });
  }

  function toggleComplete(id) {
    todos = todos.map((todo) =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    saveTodos();
    renderTodos();
    updateItemsCount();
  }

  function deleteTodo(id) {
    todos = todos.filter((todo) => todo.id !== id);
    saveTodos();
    renderTodos();
    updateItemsCount();
  }

  function editTodo(id, element) {
    const currentText = element.textContent;
    const input = document.createElement("input");
    input.type = "text";
    input.value = currentText;
    input.classList.add("edit-input");

    element.replaceWith(input);
    input.focus();

    const saveEdit = () => {
      const newText = input.value.trim();
      if (newText) {
        todos = todos.map((todo) =>
          todo.id === id ? { ...todo, text: newText } : todo
        );
        saveTodos();
        renderTodos();
      }
    };

    input.addEventListener("blur", saveEdit);
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        saveEdit();
      }
    });
  }

  function clearCompletedTodos() {
    todos = todos.filter((todo) => !todo.completed);
    saveTodos();
    renderTodos();
    updateItemsCount();
  }

  function updateItemsCount() {
    const activeTodos = todos.filter((todo) => !todo.completed).length;
    itemsCount.textContent = activeTodos;
  }

  function saveTodos() {
    localStorage.setItem("todos", JSON.stringify(todos));
  }

  function toggleTheme() {
    const isDark = body.getAttribute("data-theme") === "dark";
    body.setAttribute("data-theme", isDark ? "light" : "dark");
    localStorage.setItem("theme", isDark ? "light" : "dark");
    updateThemeIcon();
  }

  function updateThemeIcon() {
    const isDark = body.getAttribute("data-theme") === "dark";
    const icon = themeIcon.setAttribute(
      "src",
      isDark ? "./images/icon-sun.svg" : "./images/icon-moon.svg"
    );
  }

  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) {
    body.setAttribute("data-theme", savedTheme);
    updateThemeIcon();
  }

  function handleDragStart(e) {
    draggedItem = e.target.closest(".todo-item");
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", draggedItem);
    setTimeout(() => {
      draggedItem.classList.add("dragging");
    }, 0);
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    const afterElement = getDragAfterElement(todoList, e.clientY);
    const currentItem = document.querySelector(".dragging");

    if (afterElement == null) {
      todoList.appendChild(currentItem);
    } else {
      todoList.insertBefore(currentItem, afterElement);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
  }

  function handleDragEnd() {
    const draggedId = parseInt(draggedItem.dataset.id);
    const newIndex = Array.from(todoList.children).indexOf(draggedItem);

    const todoIndex = todos.findIndex((todo) => todo.id === draggedId);
    const [removed] = todos.splice(todoIndex, 1);
    todos.splice(newIndex, 0, removed);

    saveTodos();
    draggedItem.classList.remove("dragging");
    draggedItem = null;
  }

  function getDragAfterElement(container, y) {
    const draggableElements = [
      ...container.querySelectorAll(".todo-item:not(.dragging)"),
    ];

    return draggableElements.reduce(
      (closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;

        if (offset < 0 && offset > closest.offset) {
          return { offset: offset, element: child };
        } else {
          return closest;
        }
      },
      { offset: Number.NEGATIVE_INFINITY }
    ).element;
  }
});
