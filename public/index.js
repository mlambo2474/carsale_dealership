// index.js

document.addEventListener("DOMContentLoaded", () => {
  // --- DOM Elements ---
  const loginPage = document.getElementById("auth-page");
  const loginForm = document.getElementById("login-form");
  const loginError = document.getElementById("login-error");

  const clientPage = document.getElementById("client-page");
  const searchForm = document.getElementById("searchForm");
  const showAllBtn = document.getElementById("showAllBtn");
  const browseBtn = document.querySelector('.hero-btn');

  const results = document.getElementById("results");

  const adminPage = document.getElementById("admin-page");
  const addCarForm = document.getElementById("addCarForm");
  const adminCarList = document.getElementById("admin-car-list");

  const clientUserEmailEl = document.getElementById("client-user-email");
  const adminUserEmailEl = document.getElementById("admin-user-email");

  const carModal = document.getElementById("car-modal");
  const editCarModal = document.getElementById("editCarModal");
  const editCarForm = document.getElementById("editCarForm");

 
 // --- SIGNUP FLOW ---
const signupBtn = document.getElementById("signup-button");

signupBtn.addEventListener("click", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const response = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      loginError.textContent = data.message || "Signup failed";
      return;
    }

    // Store token + role + email
    localStorage.setItem("token", data.token);
    const signupRole = (data && data.userRole && data.userRole.role) || "client";
    localStorage.setItem("role", signupRole);
    localStorage.setItem("email", email);

    // Redirect user to correct page
    loginPage.style.display = "none";
    if (signupRole === "admin") {
      adminPage.style.display = "block";
      setHeaderEmail(email, "admin");
      loadAdminCars();
    } else {
      clientPage.style.display = "block";
      setHeaderEmail(email, "client");
      loadAllCarsClient();
    }
  } catch (err) {
    loginError.textContent = "Server error during signup.";
    console.error(err);
  }
});


  // --- LOGIN FLOW ---
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        loginError.textContent = data.message || "Login failed";
        return;
      }

      // Store token, role and email
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.user.role);
      localStorage.setItem("email", email);

      // Navigate to correct page
      loginPage.style.display = "none";
      if (data.user.role === "admin") {
        adminPage.style.display = "block";
        setHeaderEmail(email, "admin");
        loadAdminCars();
      } else {
        clientPage.style.display = "block";
        setHeaderEmail(email, "client");
        loadAllCarsClient();
      }
    } catch (err) {
      loginError.textContent = "Server error, try again.";
      console.error(err);
    }
  });

  // --- LOGOUT FUNCTION ---
  window.logout = function () {
    localStorage.clear();
    location.reload();
  };

  // --- HEADER EMAIL HELPER ---
  function setHeaderEmail(email, page) {
    const safeEmail = email || localStorage.getItem("email") || "";
    if (page === "client" && clientUserEmailEl) {
      clientUserEmailEl.textContent = safeEmail ? `Signed in: ${safeEmail}` : "";
    }
    if (page === "admin" && adminUserEmailEl) {
      adminUserEmailEl.textContent = safeEmail ? `Signed in: ${safeEmail}` : "";
    }
  }

  // --- CLIENT PAGE FUNCTIONS ---
  async function loadAllCarsClient() {
    try {
      const res = await fetch("/api/cars");
      const cars = await res.json();
      setHeaderEmail(undefined, "client");
      displayCarsClient(cars);
    } catch (err) {
      console.error(err);
      results.innerHTML = "<p>Error loading cars</p>";
    }
  }

  searchForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(searchForm);
    const params = new URLSearchParams();
    for (const [key, value] of formData.entries()) {
      if (value.trim() !== "") params.append(key, value);
    }

    try {
      const res = await fetch(`/api/search?${params.toString()}`);
      const data = await res.json();
      displayCarsClient(data);
    } catch (err) {
      results.innerHTML = "<p>No cars matching criteria</p>";
    }
  });

  showAllBtn.addEventListener("click", () => {
    loadAllCarsClient();
    searchForm.reset();
  });

  document.addEventListener("scroll", function () {
  const form = document.querySelector(".search-form");

  if (window.scrollY > 500) {
    form.classList.add("scrolled");
  } else {
    form.classList.remove("scrolled");
  }
});

  function displayCarsClient(cars) {
    if (!cars.length) {
      results.innerHTML = "<p>No cars found</p>";
      return;
    }
    results.innerHTML = cars
      .map(
        (car) => `
      <div class="car-card">
        <img src="${car.url}" alt="${car.make} ${car.model}" />
        <h3>${car.make} ${car.model}</h3>
        <button onclick="openModalClient(${car.id})">View Details</button>
      </div>
    `
      )
      .join("");
  }


if (browseBtn && results) {
  browseBtn.addEventListener('click', function (e) {
    e.preventDefault();
    const offset = 170; // Change this value to your desired margin in pixels
    const rect = results.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const top = rect.top + scrollTop - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  });
}

  window.openModalClient = async function (id) {
    try {
      const cars = await fetch("/api/cars").then((r) => r.json());
      const car = cars.find((car) => car.id == id);
      if (!car) return;
      document.getElementById("modal-make-model").textContent =
        car.make + " " + car.model;
      document.getElementById("modal-year").textContent = `Year: ${car.year}`;
      document.getElementById(
        "modal-transmission"
      ).textContent = `Transmission: ${car.transmission}`;
      document.getElementById("modal-price").textContent = `Price: $${car.price}`;
      document.getElementById("modal-image").src = car.url;
      carModal.style.display = "flex";
    } catch (err) {
      console.error(err);
    }
  };

  window.closeModal = function () {
    carModal.style.display = "none";
  };

  // --- ADMIN PAGE FUNCTIONS ---
  async function loadAdminCars() {
    const token = localStorage.getItem("token"); //getting token to verify admi
    try {
      const res = await fetch("/api/cars", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const cars = await res.json();
      setHeaderEmail(undefined, "admin");
      displayAdminCars(cars);
    } catch (err) {
      console.error(err);
    }
  }

  function displayAdminCars(cars) {
    adminCarList.innerHTML = cars
      .map(
        (car) => `
      <div class="admin-car-card" data-id="${car.id}">
      <img src="${car.url}" alt="${car.make} ${car.model}" />
        <h3>${car.make} ${car.model}</h3>
        <p>Year: ${car.year}</p>
        <p>Transmission: ${car.transmission}</p>
        <p>Price: $${car.price}</p>
        <div class="button-actions">
        <button class="edit-btn" data-id="${car.id}">Edit</button>
        <button class="delete-btn" data-id="${car.id}">Delete</button>
        </div>
      </div>
    `
      )
      .join("");

    // Attach events
    document.querySelectorAll(".edit-btn").forEach((btn) => {
      btn.addEventListener("click", () => openEditModal(btn.dataset.id));
    });

    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", () => deleteCar(btn.dataset.id));
    });
  }

  addCarForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    const data = Object.fromEntries(new FormData(addCarForm).entries());

    try {
      const res = await fetch("/api/cars", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        addCarForm.reset();
        loadAdminCars();
      }
    } catch (err) {
      console.error(err);
    }
  });

  // --- EDIT CAR MODAL ---
  window.openEditModal = async function (id) {
    const token = localStorage.getItem("token");
    try {
      const cars = await fetch("/api/cars", {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json());
      const car = cars.find((c) => c.id == id);
      if (!car) return;

      document.getElementById("edit-id").value = car.id;
      document.getElementById("edit-make").value = car.make;
      document.getElementById("edit-model").value = car.model;
      document.getElementById("edit-year").value = car.year;
      document.getElementById("edit-price").value = car.price;
      document.getElementById("edit-transmission").value = car.transmission;
      document.getElementById("edit-url").value = car.url;

      editCarModal.style.display = "flex";
    } catch (err) {
      console.error(err);
    }
  };

  window.closeEditModal = function () {
    editCarModal.style.display = "none";
  };

  editCarForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const id = document.getElementById("edit-id").value;

    const data = Object.fromEntries(new FormData(editCarForm).entries());

    try {
      const res = await fetch(`/api/cars/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        closeEditModal();
        loadAdminCars();
      }
    } catch (err) {
      console.error(err);
    }
  });

  async function deleteCar(id) {
    const token = localStorage.getItem("token");
    if (!confirm("Are you sure you want to delete this car?")) return;
    try {
      const res = await fetch(`/api/cars/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) loadAdminCars();
    } catch (err) {
      console.error(err);
    }
  }

  // --- CLOSE MODALS ON CLICK OUTSIDE ---
  window.addEventListener("click", (e) => {
    if (e.target === carModal) closeModal();
    if (e.target === editCarModal) closeEditModal();
  });
});
