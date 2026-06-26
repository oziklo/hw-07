"use strict"

// ЛР7: REST API, fetch, проміси, пагінація, DOM та менеджер завдань

const API_BASE_URL = "https://jsonplaceholder.typicode.com"

document.addEventListener("DOMContentLoaded", () => {
  initUsersApi()
  initTaskManager()
})

function initUsersApi() {
  const form = document.querySelector("[data-user-form]")
  const limitInput = document.querySelector("[data-user-limit]")
  const button = document.querySelector("[data-user-button]")
  const list = document.querySelector("[data-user-list]")
  const status = document.querySelector("[data-user-status]")

  if (
    !(form instanceof HTMLFormElement) ||
    !(limitInput instanceof HTMLInputElement) ||
    !(button instanceof HTMLButtonElement) ||
    !(list instanceof HTMLUListElement) ||
    !(status instanceof HTMLElement)
  ) {
    console.error("Помилка: елементи блоку REST API не знайдено")
    return
  }

  let page = 1
  let limit = 0
  let totalPages = null
  let isLoading = false

  form.addEventListener("submit", async (event) => {
    event.preventDefault()

    if (isLoading) {
      return
    }

    const parsedLimit = Number(limitInput.value)

    if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 10) {
      showStatus(status, "Введіть число від 1 до 10", "error")
      return
    }

    if (limit !== parsedLimit) {
      limit = parsedLimit
      page = 1
      totalPages = null
      list.innerHTML = ""
      button.textContent = "Завантажити користувачів"
    }

    if (totalPages !== null && page > totalPages) {
      showStatus(status, "Дані для завантаження відсутні", "warning")
      return
    }

    try {
      isLoading = true
      button.disabled = true
      button.textContent = page === 1 ? "Завантаження..." : "Завантаження ще..."

      const result = await fetchUsers(page, limit)
      const users = result.items

      if (totalPages === null) {
        totalPages = Math.ceil(result.totalCount / limit)
      }

      if (users.length === 0) {
        showStatus(status, "Дані для завантаження відсутні", "warning")
        button.textContent = "Дані закінчилися"
        return
      }

      renderUsers(users, list)
      showStatus(
        status,
        `Завантажено сторінку ${page} з ${totalPages}`,
        "success"
      )

      page += 1

      if (totalPages !== null && page > totalPages) {
        button.textContent = "Дані закінчилися"
      } else {
        button.textContent = "Завантажити ще користувачів"
      }
    } catch (error) {
      const message = getErrorMessage(error)
      showStatus(status, message, "error")
      button.textContent = page === 1
        ? "Завантажити користувачів"
        : "Завантажити ще користувачів"
    } finally {
      isLoading = false

      if (totalPages === null || page <= totalPages) {
        button.disabled = false
      }
    }
  })
}

async function fetchUsers(page, limit) {
  const params = new URLSearchParams({
    _page: String(page),
    _limit: String(limit)
  })

  const response = await fetch(`${API_BASE_URL}/users?${params.toString()}`)

  if (!response.ok) {
    throw new Error(`Помилка HTTP ${response.status}`)
  }

  const totalCountHeader = response.headers.get("X-Total-Count")
  const totalCount = totalCountHeader ? Number(totalCountHeader) : 0
  const items = await response.json()

  if (!Array.isArray(items)) {
    throw new Error("Сервер повернув некоректний формат даних")
  }

  return {
    items,
    totalCount
  }
}

function renderUsers(users, list) {
  const markup = users
    .map((user) => {
      const name = escapeHtml(user.name)
      const email = escapeHtml(user.email)
      const phone = escapeHtml(user.phone)
      const website = escapeHtml(user.website)
      const companyName = escapeHtml(user.company?.name ?? "Немає даних")
      const city = escapeHtml(user.address?.city ?? "Немає даних")

      return `
        <li class="user-card">
          <h3>${name}</h3>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Телефон:</strong> ${phone}</p>
          <p><strong>Сайт:</strong> ${website}</p>
          <p><strong>Компанія:</strong> ${companyName}</p>
          <p><strong>Місто:</strong> ${city}</p>
        </li>
      `
    })
    .join("")

  list.insertAdjacentHTML("beforeend", markup)
}

function initTaskManager() {
  const loadButton = document.querySelector("[data-load-tasks]")
  const form = document.querySelector("[data-task-form]")
  const input = document.querySelector("[data-task-input]")
  const list = document.querySelector("[data-task-list]")
  const status = document.querySelector("[data-task-status]")
  const activeCountElement = document.querySelector("[data-active-count]")
  const completedCountElement = document.querySelector("[data-completed-count]")
  const filterButtons = document.querySelectorAll("[data-filter]")

  if (
    !(loadButton instanceof HTMLButtonElement) ||
    !(form instanceof HTMLFormElement) ||
    !(input instanceof HTMLInputElement) ||
    !(list instanceof HTMLUListElement) ||
    !(status instanceof HTMLElement) ||
    !(activeCountElement instanceof HTMLElement) ||
    !(completedCountElement instanceof HTMLElement) ||
    filterButtons.length === 0
  ) {
    console.error("Помилка: елементи менеджера завдань не знайдено")
    return
  }

  let tasks = []
  let currentFilter = "all"
  let isLoading = false

  loadButton.addEventListener("click", async () => {
    if (isLoading) {
      return
    }

    try {
      isLoading = true
      loadButton.disabled = true
      loadButton.textContent = "Завантаження..."

      tasks = await fetchTasks()
      renderTaskState()

      showStatus(status, "Задачі успішно завантажено", "success")
      loadButton.textContent = "Оновити задачі"
    } catch (error) {
      showStatus(status, getErrorMessage(error), "error")
      loadButton.textContent = "Завантажити задачі"
    } finally {
      isLoading = false
      loadButton.disabled = false
    }
  })

  form.addEventListener("submit", async (event) => {
    event.preventDefault()

    const title = input.value.trim()

    if (!title) {
      showStatus(status, "Введіть текст завдання", "error")
      return
    }

    try {
      const createdTask = await addTask(title)

      tasks = [
        {
          ...createdTask,
          id: createLocalTaskId(tasks),
          title,
          completed: false,
          userId: 4
        },
        ...tasks
      ]

      input.value = ""
      renderTaskState()
      showStatus(status, "Задачу додано на сторінку", "success")
    } catch (error) {
      showStatus(status, getErrorMessage(error), "error")
    }
  })

  list.addEventListener("change", (event) => {
    const target = event.target

    if (!(target instanceof HTMLInputElement) || target.type !== "checkbox") {
      return
    }

    const taskId = Number(target.dataset.taskId)

    if (!Number.isInteger(taskId)) {
      showStatus(status, "Не вдалося визначити задачу", "error")
      return
    }

    tasks = tasks.map((task) => {
      if (task.id !== taskId) {
        return task
      }

      return {
        ...task,
        completed: target.checked
      }
    })

    renderTaskState()
    showStatus(status, "Статус задачі оновлено локально", "success")
  })

  list.addEventListener("click", async (event) => {
    const target = event.target

    if (!(target instanceof HTMLButtonElement)) {
      return
    }

    const taskId = Number(target.dataset.deleteTaskId)

    if (!Number.isInteger(taskId)) {
      return
    }

    try {
      target.disabled = true
      await deleteTask(taskId)

      tasks = tasks.filter((task) => task.id !== taskId)
      renderTaskState()
      showStatus(status, "Задачу видалено зі сторінки", "success")
    } catch (error) {
      target.disabled = false
      showStatus(status, getErrorMessage(error), "error")
    }
  })

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (!(button instanceof HTMLButtonElement)) {
        return
      }

      const filter = button.dataset.filter

      if (!filter || !["all", "active", "completed"].includes(filter)) {
        showStatus(status, "Невідомий фільтр задач", "error")
        return
      }

      currentFilter = filter

      filterButtons.forEach((item) => {
        item.classList.remove("is-active")
      })

      button.classList.add("is-active")
      renderTaskState()
    })
  })

  function renderTaskState() {
    renderTasks(filterTasks(tasks, currentFilter), list)
    updateTaskCounters(tasks, activeCountElement, completedCountElement)
  }
}

async function fetchTasks() {
  const params = new URLSearchParams({
    _limit: "10",
    _page: "1"
  })

  const response = await fetch(`${API_BASE_URL}/todos?${params.toString()}`)

  if (!response.ok) {
    throw new Error(`Помилка HTTP ${response.status}`)
  }

  const data = await response.json()

  if (!Array.isArray(data)) {
    throw new Error("Сервер повернув некоректний формат задач")
  }

  return data
}

async function addTask(title) {
  const response = await fetch(`${API_BASE_URL}/todos`, {
    method: "POST",
    body: JSON.stringify({
      title,
      completed: false,
      userId: 4
    }),
    headers: {
      "Content-Type": "application/json; charset=UTF-8"
    }
  })

  if (!response.ok) {
    throw new Error(`Помилка HTTP ${response.status}`)
  }

  return response.json()
}

async function deleteTask(taskId) {
  const response = await fetch(`${API_BASE_URL}/todos/${taskId}`, {
    method: "DELETE"
  })

  if (!response.ok) {
    throw new Error(`Помилка HTTP ${response.status}`)
  }

  return true
}

function filterTasks(tasks, filter) {
  switch (filter) {
    case "active":
      return tasks.filter((task) => !task.completed)
    case "completed":
      return tasks.filter((task) => task.completed)
    case "all":
      return tasks
    default:
      return tasks
  }
}

function renderTasks(tasks, list) {
  if (tasks.length === 0) {
    list.innerHTML = `
      <li class="task-item">
        <p class="task-title">Немає задач для відображення</p>
      </li>
    `
    return
  }

  const markup = tasks
    .map((task) => {
      const title = escapeHtml(task.title)
      const completedClass = task.completed ? " is-completed" : ""
      const checked = task.completed ? "checked" : ""

      return `
        <li class="task-item">
          <input
            class="task-checkbox"
            type="checkbox"
            data-task-id="${task.id}"
            aria-label="Змінити статус задачі"
            ${checked}
          >
          <p class="task-title${completedClass}">${title}</p>
          <button
            class="delete-button"
            type="button"
            data-delete-task-id="${task.id}"
            aria-label="Видалити задачу"
          >
            ×
          </button>
        </li>
      `
    })
    .join("")

  list.innerHTML = markup
}

function updateTaskCounters(tasks, activeCountElement, completedCountElement) {
  const completedCount = tasks.filter((task) => task.completed).length
  const activeCount = tasks.length - completedCount

  activeCountElement.textContent = String(activeCount)
  completedCountElement.textContent = String(completedCount)
}

function createLocalTaskId(tasks) {
  const maxId = tasks.reduce((maxValue, task) => {
    return task.id > maxValue ? task.id : maxValue
  }, 0)

  return maxId + 1
}

function showStatus(element, message, type) {
  element.textContent = message
  element.classList.remove("is-success", "is-error", "is-warning")

  if (type === "success") {
    element.classList.add("is-success")
    return
  }

  if (type === "error") {
    element.classList.add("is-error")
    return
  }

  if (type === "warning") {
    element.classList.add("is-warning")
  }
}

function getErrorMessage(error) {
  if (error instanceof Error) {
    return error.message
  }

  return "Сталася невідома помилка"
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}