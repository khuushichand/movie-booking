// ============================================
// CINEBOOK - MOVIE TICKET BOOKING WEBSITE
// ============================================

// Movie Data
const movies = [
  { id: 1, title: "Dune: Part Two", genre: "Sci-Fi", rating: 8.8, price: 180, poster: "images/dune.jpg" },
  { id: 2, title: "The Batman", genre: "Action", rating: 7.8, price: 150, poster: "images/batman.webp" },
  { id: 3, title: "Oppenheimer", genre: "Drama", rating: 8.4, price: 120, poster: "images/oppenheimer.jpg" },
  { id: 4, title: "Barbie", genre: "Comedy", rating: 7.0, price: 130, poster: "images/barbie.webp" },
  { id: 5, title: "Spider-Man: Across the Spider-Verse", genre: "Animation", rating: 8.6, price: 145, poster: "images/spiderman.webp" },
  { id: 6, title: "Guardians of the Galaxy Vol. 3", genre: "Action", rating: 7.9, price: 189, poster: "images/gog.webp" },
  { id: 7, title: "The Super Mario Bros. Movie", genre: "Animation", rating: 7.0, price: 200, poster: "images/mario.webp" },
  { id: 8, title: "Mission: Impossible - Dead Reckoning", genre: "Action", rating: 7.7, price: 200, poster: "images/mission.webp" }
];

const rows = 6, seatsPerRow = 8, rowLabels = ['A', 'B', 'C', 'D', 'E', 'F'];
let state = {
  isLoggedIn: false, isSignup: false, user: null, selectedMovie: null, selectedSeats: [], bookedSeats: [], bookings: [], theme: 'light'
};

// Utility: Save/load state
const saveState = () => localStorage.setItem('cinebookState', JSON.stringify(state));
const loadState = () => {
  const s = localStorage.getItem('cinebookState');
  if (s) state = JSON.parse(s);
};

// Utility: Set theme
const setTheme = theme => {
  document.documentElement.setAttribute('data-theme', theme);
  state.theme = theme;
  localStorage.setItem('cinebook-theme', theme);
  saveState();
  updateThemeIcons(theme);
};

// Theme icons
const updateThemeIcons = theme => {
  document.querySelectorAll('.sun-icon').forEach(i => i.style.display = theme === 'dark' ? 'block' : 'none');
  document.querySelectorAll('.moon-icon').forEach(i => i.style.display = theme === 'dark' ? 'none' : 'block');
};

// Theme toggle
const toggleTheme = () => {
  const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  setTheme(newTheme);
  const btn = document.getElementById('themeToggle');
  if (btn) {
    btn.style.transform = 'rotate(360deg)';
    setTimeout(() => { btn.style.transform = ''; }, 400);
  }
};

// Initialization
const initTheme = () => {
  document.body.classList.add('no-transition');
  const theme = localStorage.getItem('cinebook-theme') || state.theme || 'light';
  setTheme(theme);
  requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.remove('no-transition')));
};

document.addEventListener('DOMContentLoaded', () => {
  loadState();
  initTheme();
  initPage();
});

// Page router
const initPage = () => {
  const page = window.location.pathname.split('/').pop();
  const routes = {
    'index.html': initAuthPage, '': initAuthPage,
    'movies.html': initMoviesPage,
    'seats.html': initSeatsPage,
    'summary.html': initSummaryPage,
    'ticket.html': initTicketPage,
    'dashboard.html': initDashboardPage
  };
  if (routes[page]) routes[page]();
};

// ========== AUTH PAGE ==========
function initAuthPage() {
  const $ = id => document.getElementById(id);
  const authForm = $("authForm"), toggleAuth = $("toggleAuth"), authTitle = $("authTitle"), authSubtitle = $("authSubtitle"), authBtn = $("authBtn"), toggleText = $("toggleText"), nameGroup = $("nameGroup"), rememberForgot = $("rememberForgot");
  if (state.isLoggedIn) return window.location.href = 'movies.html';
  toggleAuth.addEventListener('click', e => { e.preventDefault(); state.isSignup = !state.isSignup; updateAuthUI(); });
  authForm.addEventListener('submit', e => { e.preventDefault(); handleAuth(); });
  function updateAuthUI() {
    if (state.isSignup) {
      authTitle.textContent = 'Create Account';
      authSubtitle.textContent = 'Sign up to book your favorite movies';
      authBtn.textContent = 'Sign Up';
      toggleText.textContent = 'Already have an account?';
      toggleAuth.textContent = 'Sign In';
      nameGroup.style.display = 'block';
      rememberForgot.style.display = 'none';
    } else {
      authTitle.textContent = 'Welcome Back';
      authSubtitle.textContent = 'Sign in to book your favorite movies';
      authBtn.textContent = 'Sign In';
      toggleText.textContent = "Don't have an account?";
      toggleAuth.textContent = 'Sign Up';
      nameGroup.style.display = 'none';
      rememberForgot.style.display = 'flex';
    }
  }
  function handleAuth() {
    const email = $("email").value, password = $("password").value, name = $("name").value;
    if (!email || !password) return alert('Please fill in all required fields');
    if (state.isSignup && !name) return alert('Please enter your name');
    state.isLoggedIn = true;
    state.user = { name: state.isSignup ? name : email.split('@')[0], email };
    saveState();
    window.location.href = 'movies.html';
  }
  updateAuthUI();
}

// ========== MOVIES PAGE ==========
function initMoviesPage() {
  if (!state.isLoggedIn) return window.location.href = 'index.html';
  renderMovies();
  initNavbar();
}
function renderMovies() {
  const grid = document.getElementById('moviesGrid');
  if (!grid) return;
  grid.innerHTML = movies.map((m, i) => `
    <div class="movie-card fade-in" style="animation-delay: ${i * 0.1}s" onclick="selectMovie(${m.id})">
      <div class="movie-poster">
        <img src="${m.poster}" alt="${m.title}" onerror="this.src='images/placeholder.svg'">
        <div class="movie-rating">
          <svg viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
          <span>${m.rating}</span>
        </div>
      </div>
      <div class="movie-info">
        <h3 class="movie-title">${m.title}</h3>
        <div class="movie-meta">
          <span class="movie-genre">${m.genre}</span>
          <span class="movie-price">Rs.${m.price}</span>
        </div>
        <button class="btn btn-primary btn-sm">Book Now</button>
      </div>
    </div>
  `).join('');
}
window.selectMovie = movieId => {
  const movie = movies.find(m => m.id === movieId);
  if (movie) {
    state.selectedMovie = movie;
    state.selectedSeats = [];
    saveState();
    window.location.href = 'seats.html';
  }
};

// ========== SEATS PAGE ==========
function initSeatsPage() {
  if (!state.isLoggedIn || !state.selectedMovie) return window.location.href = 'movies.html';
  renderSeats();
  updateSeatsSummary();
  initNavbar();
}
function renderSeats() {
  const seatGrid = document.getElementById('seatGrid');
  if (!seatGrid) return;
  const movieInfo = document.getElementById('movieInfo');
  const summaryMovie = document.getElementById('summaryMovie');
  if (movieInfo) movieInfo.textContent = `${state.selectedMovie.title} - Select your seats`;
  if (summaryMovie) summaryMovie.textContent = state.selectedMovie.title;
  let html = '';
  for (let row = 0; row < rows; row++) {
    html += `<div class="seat-row-label">${rowLabels[row]}</div>`;
    for (let seat = 1; seat <= seatsPerRow; seat++) {
      const seatId = `${rowLabels[row]}${seat}`;
      const isBooked = state.bookedSeats.includes(seatId);
      const isSelected = state.selectedSeats.includes(seatId);
      let seatClass = 'seat available';
      if (isBooked) seatClass = 'seat booked';
      else if (isSelected) seatClass = 'seat selected';
      html += `
        <button 
          class="${seatClass}" 
          data-seat="${seatId}"
          ${isBooked ? 'disabled' : ''}
          onclick="toggleSeat('${seatId}')"
        >
          ${seat}
        </button>
      `;
    }
  }
  seatGrid.innerHTML = html;
}
window.toggleSeat = seatId => {
  if (state.bookedSeats.includes(seatId)) return;
  const idx = state.selectedSeats.indexOf(seatId);
  if (idx > -1) state.selectedSeats.splice(idx, 1);
  else state.selectedSeats.push(seatId);
  saveState();
  renderSeats();
  updateSeatsSummary();
};
function updateSeatsSummary() {
  const selectedSeatsEl = document.getElementById('selectedSeats');
  const totalPriceEl = document.getElementById('totalPrice');
  const proceedBtn = document.getElementById('proceedBtn');
  const count = state.selectedSeats.length;
  const price = state.selectedMovie ? state.selectedMovie.price : 12;
  const total = count * price;
  if (selectedSeatsEl) selectedSeatsEl.textContent = count === 0 ? 'No seats selected' : `${count} seat${count > 1 ? 's' : ''} (${state.selectedSeats.join(', ')})`;
  if (totalPriceEl) totalPriceEl.textContent = `Rs.${total.toFixed(2)}`;
  if (proceedBtn) {
    proceedBtn.style.opacity = count > 0 ? '1' : '0.5';
    proceedBtn.style.pointerEvents = count > 0 ? 'auto' : 'none';
  }
}

// ========== SUMMARY PAGE ==========
function initSummaryPage() {
  if (!state.isLoggedIn || !state.selectedMovie || state.selectedSeats.length === 0) return window.location.href = 'movies.html';
  renderSummary();
  initNavbar();
}
function renderSummary() {
  const movie = state.selectedMovie, seats = state.selectedSeats, price = movie.price, total = seats.length * price;
  // Generate random date/time
  const today = new Date();
  const date = new Date(today.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000);
  const showDate = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const showTime = `${Math.floor(Math.random() * 4) + 14}:${Math.random() > 0.5 ? '00' : '30'}`;
  const theater = `Theater ${Math.floor(Math.random() * 5) + 1}`;
  state.bookingInfo = { date: showDate, time: showTime, theater };
  saveState();
  const $ = id => document.getElementById(id);
  if ($('summaryPoster')) $('summaryPoster').src = movie.poster;
  if ($('summaryMovieTitle')) $('summaryMovieTitle').textContent = movie.title;
  if ($('summaryDate')) $('summaryDate').textContent = `Date: ${showDate}`;
  if ($('summaryTime')) $('summaryTime').textContent = `Time: ${showTime}`;
  if ($('summaryTheater')) $('summaryTheater').textContent = `Theater: ${theater}`;
  if ($('summarySeats')) $('summarySeats').textContent = seats.join(', ');
  if ($('summaryTicketCount')) $('summaryTicketCount').textContent = seats.length;
  if ($('summaryPricePerTicket')) $('summaryPricePerTicket').textContent = `Rs.${price.toFixed(2)}`;
  if ($('summaryTotal')) $('summaryTotal').textContent = `Rs.${total.toFixed(2)}`;
}

// ========== TICKET PAGE ==========
function initTicketPage() {
  if (!state.isLoggedIn || !state.selectedMovie || state.selectedSeats.length === 0) return window.location.href = 'movies.html';
  generateTicket();
  initNavbar();
}
function generateTicket() {
  const movie = state.selectedMovie, seats = state.selectedSeats, info = state.bookingInfo || {}, price = movie.price, total = seats.length * price;
  const bookingId = 'CB' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 4).toUpperCase();
  state.bookedSeats.push(...seats);
  const booking = {
    id: bookingId, movie, seats, date: info.date || '-', time: info.time || '-', theater: info.theater || '-', total, timestamp: new Date().toISOString()
  };
  state.bookings.push(booking);
  saveState();
  const $ = id => document.getElementById(id);
  if ($('ticketMovie')) $('ticketMovie').textContent = movie.title;
  if ($('ticketDate')) $('ticketDate').textContent = info.date || '-';
  if ($('ticketTime')) $('ticketTime').textContent = info.time || '-';
  if ($('ticketTheater')) $('ticketTheater').textContent = info.theater || '-';
  if ($('ticketSeats')) $('ticketSeats').textContent = seats.join(', ');
  if ($('ticketId')) $('ticketId').textContent = bookingId;
  state.selectedMovie = null;
  state.selectedSeats = [];
  saveState();
}

// ========== DASHBOARD PAGE ==========
function initDashboardPage() {
  if (!state.isLoggedIn) return window.location.href = 'index.html';
  renderDashboard();
  initNavbar();
}
function renderDashboard() {
  const $ = id => document.getElementById(id);
  if (state.user) {
    if ($('userName')) $('userName').textContent = state.user.name;
    if ($('userEmail')) $('userEmail').textContent = state.user.email;
    if ($('userWelcome')) $('userWelcome').textContent = `Welcome back, ${state.user.name}!`;
  }
  if ($('totalBookings')) $('totalBookings').textContent = state.bookings.length;
  const spent = state.bookings.reduce((sum, b) => sum + (b.total || 0), 0);
  if ($('totalSpent')) $('totalSpent').textContent = `Rs.${spent.toFixed(2)}`;
  const bookingsList = $('bookingsList');
  if (bookingsList) {
    bookingsList.innerHTML = state.bookings.length === 0 ? `
      <div class="no-bookings">
        <p>No bookings yet. Start booking movies!</p>
        <a href="movies.html" class="btn btn-primary" style="margin-top: 1rem;">Browse Movies</a>
      </div>
    ` : state.bookings.map(booking => `
      <div class="booking-item">
        <div class="booking-poster">
          <img src="${booking.movie.poster}" alt="${booking.movie.title}" onerror="this.src='images/placeholder.svg'">
        </div>
        <div class="booking-info">
          <h4 class="booking-title">${booking.movie.title}</h4>
          <p class="booking-meta">${booking.date} • ${booking.time} • ${booking.seats.join(', ')}</p>
          <span class="booking-status">Confirmed</span>
        </div>
      </div>
    `).join('');
  }
}

// ========== NAVBAR ==========
function initNavbar() {
  const themeToggle = document.getElementById('themeToggle');
  const profileBtn = document.getElementById('profileDropdown')?.previousElementSibling;
  const profileDropdown = document.getElementById('profileDropdown');
  const logoutBtn = document.getElementById('logoutBtn');
  if (themeToggle) themeToggle.addEventListener('click', toggleTheme);
  if (profileBtn && profileDropdown) {
    profileBtn.addEventListener('click', e => {
      e.stopPropagation();
      const isShown = profileDropdown.classList.contains('show');
      document.querySelectorAll('.profile-dropdown.show').forEach(d => d.classList.remove('show'));
      if (!isShown) profileDropdown.classList.add('show');
    });
    document.addEventListener('click', e => {
      if (!profileDropdown.contains(e.target) && !profileBtn.contains(e.target)) profileDropdown.classList.remove('show');
    });
    profileDropdown.addEventListener('click', e => e.stopPropagation());
  }
  if (logoutBtn) logoutBtn.addEventListener('click', e => { e.preventDefault(); logout(); });
}
const logout = () => {
  state.isLoggedIn = false;
  state.user = null;
  state.selectedMovie = null;
  state.selectedSeats = [];
  saveState();
  window.location.href = 'index.html';
};