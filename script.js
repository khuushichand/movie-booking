/*
This file contains the frontend JavaScript code for the PixieSpark movie booking website.
It handles user authentication, movie browsing, seat selection, booking, and admin functions.
The code manages application state, API calls, and UI updates.
*/

// ============================================
// PIXIESPARK - MOVIE TICKET BOOKING WEBSITE
// ============================================

const API_BASE = 'http://localhost:5000/api';

// Movie Data
let movies = [];
let currentShowId = null; // track which show is selected
let seatRefreshInterval = null; // for polling

const rows = 6, seatsPerRow = 8, rowLabels = ['A', 'B', 'C', 'D', 'E', 'F'];
let state = {
  isLoggedIn: false, isSignup: false, user: null, selectedMovie: null,
  selectedShow: null, // NEW: store the full show object
  selectedSeats: [], bookedSeats: [], bookings: [], theme: 'light'
};

// Utility: Save/load state
const saveState = () => localStorage.setItem('pixiesparkState', JSON.stringify(state));
const loadState = () => {
  const s = localStorage.getItem('pixiesparkState');
  if (s) state = JSON.parse(s);
};

// Utility: Auth header
const authHeader = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${state.user?.token || ''}`
});

// Utility: Set theme
const setTheme = theme => {
  document.documentElement.setAttribute('data-theme', theme);
  state.theme = theme;
  localStorage.setItem('pixiespark-theme', theme);
  saveState();
  updateThemeIcons(theme);
};

const updateThemeIcons = theme => {
  document.querySelectorAll('.sun-icon').forEach(i => i.style.display = theme === 'dark' ? 'block' : 'none');
  document.querySelectorAll('.moon-icon').forEach(i => i.style.display = theme === 'dark' ? 'none' : 'block');
};

// Only one background video available (bg.mp4.mp4), no source change needed on theme toggle
const updateThemeVideo = (theme) => {
  const video = document.getElementById('themeVideo');
  if (video) {
    const source = theme === 'dark' ? 'images/dark2.mp4' : 'images/light.mp4';
    if (!video.src.includes(source)) {
      video.src = source;
      video.load();
    }
  }
};

const toggleTheme = () => {
  const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  setTheme(newTheme);
  updateThemeVideo(newTheme);
  const btn = document.getElementById('themeToggle');
  if (btn) { btn.style.transform = 'rotate(360deg)'; setTimeout(() => { btn.style.transform = ''; }, 400); }
};

const initTheme = () => {
  document.body.classList.add('no-transition');
  const theme = localStorage.getItem('pixiespark-theme') || state.theme || 'light';
  setTheme(theme);
  updateThemeVideo(theme);
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
    'dashboard.html': initDashboardPage,
    'admin.html': initAdminPage
  };
  if (routes[page]) routes[page]();
};

async function initAdminPage() {
  if (!state.isLoggedIn || !state.user || state.user.role !== 'admin') {
    window.location.href = 'movies.html'; return;
  }
  initNavbar();
  await fetchMovies();
  if (typeof renderAdminMovies === 'function') renderAdminMovies();
}

// ========== AUTH PAGE ==========
// Function to initialize the authentication page (login/signup)
// Checks if user is already logged in, sets up form event listeners
function initAuthPage() {
  const $ = id => document.getElementById(id);
  const authForm = $("authForm"), toggleAuth = $("toggleAuth"), authTitle = $("authTitle"),
    authSubtitle = $("authSubtitle"), authBtn = $("authBtn"), toggleText = $("toggleText"),
    nameGroup = $("nameGroup"), rememberForgot = $("rememberForgot");
  if (state.isLoggedIn) return window.location.href = 'movies.html';
  toggleAuth.addEventListener('click', e => { e.preventDefault(); state.isSignup = !state.isSignup; updateAuthUI(); });
  authForm.addEventListener('submit', e => { e.preventDefault(); handleAuth(); });

  // Function to update the UI based on login/signup mode
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

  // Function to handle form submission for login or registration
  // Validates inputs, makes API call, handles response
  async function handleAuth() {
    const email = $("email").value, password = $("password").value, name = $("name").value;
    const role = $("role") ? $("role").value : 'user';
    if (!email || !password) return alert('Please fill in all required fields');
    if (state.isSignup && !name) return alert('Please enter your name');
    try {
      authBtn.textContent = 'Please wait...';
      authBtn.disabled = true;
      const endpoint = state.isSignup ? 'register' : 'login';
      const payload = state.isSignup ? { name, email, password, role } : { email, password };
      const response = await fetch(`${API_BASE}/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Authentication failed');
      state.isLoggedIn = true;
      state.user = { id: data._id, name: data.name, email: data.email, role: data.role, token: data.token };
      state.bookedSeats = []; // reset local booked seats on login
      state.bookings = [];
      saveState();
      window.location.href = data.role === 'admin' ? 'admin.html' : 'movies.html';
    } catch (error) {
      alert(error.message);
    } finally {
      authBtn.textContent = state.isSignup ? 'Sign Up' : 'Sign In';
      authBtn.disabled = false;
    }
  }
  updateAuthUI();
}

// ========== MOVIES PAGE ==========
// Function to initialize the movies page
// Checks login status, fetches movies, sets up filters, renders movies, initializes navbar
async function initMoviesPage() {
  if (!state.isLoggedIn) return window.location.href = 'index.html';
  await fetchMovies();
  populateFilters();
  setupFilters();
  renderMovies(movies);
  initNavbar();
}

// Function to fetch movies from the backend API
// Updates the global movies array with formatted data
async function fetchMovies() {
  try {
    const response = await fetch(`${API_BASE}/movies`);
    if (!response.ok) throw new Error('Failed to fetch movies');
    const data = await response.json();
    movies = data.map(movie => ({
      ...movie,
      id: movie._id, // Use _id as id for frontend
      price: movie.price || 150, // Default price if not set
      poster: movie.poster.startsWith('/') ? `http://localhost:5000${movie.poster}` : movie.poster, // Handle relative URLs
      genre: Array.isArray(movie.genre) ? movie.genre.join(', ') : movie.genre // Convert array to string
    }));
  } catch (error) {
    console.error('Error fetching movies:', error);
    movies = [];
  }
}

function renderMovies(moviesToRender = movies) {
  const grid = document.getElementById('moviesGrid');
  if (!grid) return;
  if (moviesToRender.length === 0) {
    grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-secondary); font-size: 1.1rem;"><p>No movies match your search criteria.</p></div>';
    return;
  }
  grid.innerHTML = moviesToRender.map((m, i) => `
    <div class="movie-card fade-in" style="animation-delay: ${i * 0.1}s" onclick="toggleMovieCard(this)" onmousemove="handleCardMove(event, this)" onmouseleave="handleCardLeave(this)">
      <div class="movie-poster">
        <img src="${m.poster}" alt="${m.title}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.onerror=null; this.src='https://via.placeholder.com/500x750/111/fff?text=No+Poster';">
        <div class="movie-rating">
          <svg viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
          <span>${m.rating}</span>
        </div>
      </div>
      <div class="movie-info">
        <h3 class="movie-title">${m.title}</h3>
        <p class="movie-language" style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.5px;">${m.language || 'English'}</p>
        <div class="movie-meta">
          <span class="movie-genre">${m.genre}</span>
          <span class="movie-price">Rs. ${m.price}</span>
        </div>
        <div class="movie-expand-content">
          <p class="movie-description">${m.description || 'Experience the magic of cinema!'}</p>
          <div style="display: flex; justify-content: flex-end; margin-top: 1rem;">
            <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); selectMovie('${m.id}')">Book Tickets</button>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

window.toggleMovieCard = card => {
  const isExpanded = card.classList.contains('expanded');
  document.querySelectorAll('.movie-card').forEach(c => c.classList.remove('expanded'));
  if (!isExpanded) card.classList.add('expanded');
};

// Function to handle movie selection
// Parameters: movieId (string) - the ID of the selected movie
// Fetches available shows for the movie, selects the first one, and navigates to seat selection
window.selectMovie = async (movieId) => {
  const movie = movies.find(m => String(m.id) === String(movieId));
  if (!movie) return;

  // Fetch shows for this movie from backend
  try {
    const response = await fetch(`${API_BASE}/shows?movieId=${movieId}`);
    const shows = await response.json();

    if (!shows || shows.length === 0) {
      alert('No shows available for this movie right now.');
      return;
    }

    // Use the first available show
    const show = shows[0];
    state.selectedMovie = movie;
    state.selectedShow = show;
    state.selectedSeats = [];
    // Load booked seats from backend, not localStorage
    state.bookedSeats = show.bookedSeats || [];
    saveState();
    window.location.href = 'seats.html';
  } catch (error) {
    console.error('Error fetching shows:', error);
    alert('Could not load show information. Please try again.');
  }
};

// ========== FILTERING LOGIC ==========
// Function to populate genre and language filter dropdowns with available options
function populateFilters() {
  const genreFilter = document.getElementById('genreFilter');
  const langFilter = document.getElementById('langFilter');
  if (!genreFilter || !langFilter) return;
  const genres = new Set(), languages = new Set();
  movies.forEach(m => {
    if (m.genre) m.genre.split(',').forEach(g => genres.add(g.trim()));
    if (m.language) languages.add(m.language.trim());
  });
  genreFilter.innerHTML = '<option value="all">All Genres</option>';
  langFilter.innerHTML = '<option value="all">All Languages</option>';
  Array.from(genres).sort().forEach(g => { genreFilter.innerHTML += `<option value="${g}">${g}</option>`; });
  Array.from(languages).sort().forEach(l => { langFilter.innerHTML += `<option value="${l}">${l}</option>`; });
}

// Function to set up event listeners for search and filter inputs
function setupFilters() {
  const searchInput = document.getElementById('searchInput');
  const genreFilter = document.getElementById('genreFilter');
  const langFilter = document.getElementById('langFilter');
  if (!searchInput || !genreFilter || !langFilter) return;
  const filterMovies = () => {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const genre = genreFilter.value, lang = langFilter.value;
    const filtered = movies.filter(m => {
      const matchSearch = m.title.toLowerCase().includes(searchTerm) || (m.description && m.description.toLowerCase().includes(searchTerm));
      const matchGenre = genre === 'all' || (m.genre && m.genre.includes(genre));
      const matchLang = lang === 'all' || (m.language && m.language.trim() === lang);
      return matchSearch && matchGenre && matchLang;
    });
    renderMovies(filtered);
  };
  searchInput.addEventListener('input', filterMovies);
  genreFilter.addEventListener('change', filterMovies);
  langFilter.addEventListener('change', filterMovies);
}

// Function to render movies list for admin page
function renderAdminMovies() {
  const container = document.getElementById('adminMoviesList');
  if (!container) return;
  if (movies.length === 0) {
    container.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">No movies uploaded yet.</p>';
    return;
  }
  container.innerHTML = movies.map(m => `
    <div class="movie-admin-card" style="display: flex; align-items: center; justify-content: space-between; background: var(--bg-primary); padding: 1rem; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.05); transition: transform 0.15s ease-out, box-shadow 0.3s ease; transform-style: preserve-3d; will-change: transform;" onmousemove="handleCardMove(event, this)" onmouseleave="handleCardLeave(this)">
      <div style="display: flex; align-items: center; gap: 1rem;">
        <img src="${m.poster}" alt="${m.title}" style="width: 50px; height: 75px; object-fit: cover; border-radius: 4px;" onerror="this.onerror=null; this.src='https://via.placeholder.com/50x75/111/fff?text=No+Img';">
        <div>
          <h4 style="margin: 0 0 0.3rem 0; color: var(--text-primary); font-size: 1.1rem;">${m.title}</h4>
          <p style="margin: 0; font-size: 0.85rem; color: var(--text-secondary);">${m.language || 'English'} • Rs.${m.price}</p>
        </div>
      </div>
      <button onclick="deleteMovie('${m.id}')" class="btn" style="background: rgba(255, 71, 87, 0.1); color: #ff4757; border: 1px solid rgba(255, 71, 87, 0.3); padding: 0.5rem 1rem; font-size: 0.9rem; cursor: pointer;">Delete</button>
    </div>
  `).join('');
}

// Function to delete a movie (admin only)
// Parameters: movieId (string) - the ID of the movie to delete
window.deleteMovie = async (movieId) => {
  if (!confirm('Are you sure you want to delete this movie?')) return;
  try {
    const response = await fetch(`${API_BASE}/movies/${movieId}`, {
      method: 'DELETE',
      headers: authHeader()
    });
    if (response.ok) { movies = movies.filter(m => m.id !== movieId); renderAdminMovies(); }
    else { const data = await response.json(); throw new Error(data.message || 'Failed to delete movie'); }
  } catch (error) { alert('❌ ' + error.message); }
};

// ========== SEATS PAGE ==========
// Function to initialize the seats selection page
// Checks login and movie selection, renders seats, sets up real-time refresh
async function initSeatsPage() {
  if (!state.isLoggedIn || !state.selectedMovie) return window.location.href = 'movies.html';

  // If no show was selected (e.g. user refreshed page), redirect back
  if (!state.selectedShow) return window.location.href = 'movies.html';

  initNavbar();

  // Fetch fresh booked seats from backend immediately
  await refreshBookedSeats();

  // Then keep refreshing every 5 seconds so User B sees User A's booking
  seatRefreshInterval = setInterval(refreshBookedSeats, 5000);

  // Clear interval when user leaves the page
  window.addEventListener('beforeunload', () => {
    if (seatRefreshInterval) clearInterval(seatRefreshInterval);
  });
}

// Fetch latest booked seats from backend and re-render
// This is the key function that prevents double booking by always checking the DB
async function refreshBookedSeats() {
  try {
    const showId = state.selectedShow._id || state.selectedShow.id;
    const response = await fetch(`${API_BASE}/shows/${showId}`);
    if (!response.ok) return;
    const show = await response.json();

    // Update booked seats from backend (source of truth)
    state.bookedSeats = show.bookedSeats || [];

    // If any of user's selected seats got booked by someone else, remove them
    const conflicting = state.selectedSeats.filter(seat => state.bookedSeats.includes(seat));
    if (conflicting.length > 0) {
      state.selectedSeats = state.selectedSeats.filter(seat => !state.bookedSeats.includes(seat));
      alert(`⚠️ Seat(s) ${conflicting.join(', ')} were just booked by someone else and have been deselected.`);
    }

    saveState();
    renderSeats();
    updateSeatsSummary();
  } catch (error) {
    console.error('Error refreshing seats:', error);
  }
}

// Function to render the seat selection grid
function renderSeats() {
  const seatGrid = document.getElementById('seatGrid');
  if (!seatGrid) return;
  const movieInfo = document.getElementById('movieInfo');
  const summaryMovie = document.getElementById('summaryMovie');
  if (movieInfo) movieInfo.textContent = `${state.selectedMovie.title} - Select your seats`;
  if (summaryMovie) summaryMovie.textContent = state.selectedMovie.title;

  // Show last refreshed time so user knows data is live
  const refreshLabel = document.getElementById('lastRefreshed');
  if (refreshLabel) refreshLabel.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;

  let html = '';
  html += `<div style="grid-column: 1 / -1; text-align: center; color: var(--accent-primary); font-size: 0.75rem; letter-spacing: 2px; margin: 0 0 1rem; font-weight: 700; transform: translateZ(40px);">PREMIUM SEATS (Rs. 250)</div>`;

  for (let row = 0; row < rows; row++) {
    if (row === 2) {
      html += `<div style="grid-column: 1 / -1; height: 1rem;"></div>`;
      html += `<div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); font-size: 0.75rem; letter-spacing: 2px; margin: 0.5rem 0 1rem; font-weight: 700; transform: translateZ(40px);">STANDARD SEATS (Rs. 150)</div>`;
    }
    html += `<div class="seat-row-label">${rowLabels[row]}</div>`;
    for (let seat = 1; seat <= seatsPerRow; seat++) {
      const seatId = `${rowLabels[row]}${seat}`;
      const isBooked = state.bookedSeats.includes(seatId);
      const isSelected = state.selectedSeats.includes(seatId);
      let seatClass = 'seat available';
      if (isBooked) seatClass = 'seat booked';
      else if (isSelected) seatClass = 'seat selected';
      let extraStyle = '';
      if (seat === 2 || seat === 6) extraStyle = 'margin-right: 1.5rem;';
      html += `
        <button 
          class="${seatClass}" 
          style="${extraStyle}"
          data-seat="${seatId}"
          ${isBooked ? 'disabled' : ''}
          onclick="toggleSeat('${seatId}')"
        >${seat}</button>
      `;
    }
  }
  seatGrid.innerHTML = html;
}

// Function to toggle seat selection
// Parameters: seatId (string) - the seat identifier like "A1"
window.toggleSeat = seatId => {
  if (state.bookedSeats.includes(seatId)) return;
  const idx = state.selectedSeats.indexOf(seatId);
  if (idx > -1) state.selectedSeats.splice(idx, 1);
  else state.selectedSeats.push(seatId);
  saveState();
  renderSeats();
  updateSeatsSummary();
};

// Function to update the seats summary display
function updateSeatsSummary() {
  const selectedSeatsEl = document.getElementById('selectedSeats');
  const totalPriceEl = document.getElementById('totalPrice');
  const proceedBtn = document.getElementById('proceedBtn');
  const count = state.selectedSeats.length;
  let total = 0;
  state.selectedSeats.forEach(seat => {
    total += (seat.startsWith('A') || seat.startsWith('B')) ? 250 : 150;
  });
  const chipsHtml = state.selectedSeats.map(seat => {
    const isPremium = seat.startsWith('A') || seat.startsWith('B');
    return `<span style="display: inline-flex; align-items: center; justify-content: center; background: var(--accent-primary); color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.8rem; margin: 2px; box-shadow: 0 2px 5px rgba(229,9,20,0.3); font-weight: 600;">${seat} ${isPremium ? '<span style="font-size:0.6rem;margin-left:4px;">★</span>' : ''}</span>`;
  }).join('');
  if (selectedSeatsEl) selectedSeatsEl.innerHTML = count === 0 ? '<span style="color: var(--text-muted); font-size: 0.9rem;">No seats selected</span>' : chipsHtml;
  if (totalPriceEl) {
    totalPriceEl.style.transition = 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), color 0.2s';
    totalPriceEl.style.transform = 'scale(1.1)';
    totalPriceEl.style.color = 'white';
    setTimeout(() => { totalPriceEl.style.transform = 'scale(1)'; totalPriceEl.style.color = 'var(--accent-primary)'; }, 200);
    totalPriceEl.textContent = `Rs. ${total.toFixed(2)}`;
  }
  if (proceedBtn) {
    proceedBtn.style.opacity = count > 0 ? '1' : '0.5';
    proceedBtn.style.pointerEvents = count > 0 ? 'auto' : 'none';
  }
}

// ========== SUMMARY PAGE ==========
// Function to initialize the booking summary page
function initSummaryPage() {
  if (!state.isLoggedIn || !state.selectedMovie || state.selectedSeats.length === 0) return window.location.href = 'movies.html';
  renderSummary();
  initNavbar();
}

// Function to render the booking summary
function renderSummary() {
  const movie = state.selectedMovie;
  const seats = state.selectedSeats;
  const show = state.selectedShow;

  // Calculate price based on seat type
  let total = 0;
  seats.forEach(seat => { total += (seat.startsWith('A') || seat.startsWith('B')) ? 250 : 150; });

  // Use real show date/time from backend if available, else fallback
  const showDate = show?.date ? new Date(show.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : '-';
  const showTime = show?.time || '-';
  const theater = show?.theatreId?.name || 'Main Theatre';

  state.bookingInfo = { date: showDate, time: showTime, theater, total };
  saveState();

  const $ = id => document.getElementById(id);
  if ($('summaryPoster')) $('summaryPoster').src = movie.poster;
  if ($('summaryMovieTitle')) $('summaryMovieTitle').textContent = movie.title;
  if ($('summaryDate')) $('summaryDate').textContent = `Date: ${showDate}`;
  if ($('summaryTime')) $('summaryTime').textContent = `Time: ${showTime}`;
  if ($('summaryTheater')) $('summaryTheater').textContent = `Theater: ${theater}`;
  if ($('summarySeats')) $('summarySeats').textContent = seats.join(', ');
  if ($('summaryTicketCount')) $('summaryTicketCount').textContent = seats.length;
  if ($('summaryTotal')) $('summaryTotal').textContent = `Rs.${total.toFixed(2)}`;
}

// ========== TICKET PAGE ==========
// Function to initialize the ticket confirmation page
function initTicketPage() {
  if (!state.isLoggedIn || !state.selectedMovie || state.selectedSeats.length === 0) return window.location.href = 'movies.html';
  generateTicket();
  initNavbar();
  setTimeout(() => fireConfetti(), 300);
}

// Function to generate and display the ticket after successful booking
// Makes a POST request to backend to save the booking atomically
async function generateTicket() {
  const movie = state.selectedMovie;
  const seats = state.selectedSeats;
  const show = state.selectedShow;
  const info = state.bookingInfo || {};

  let total = 0;
  seats.forEach(seat => { total += (seat.startsWith('A') || seat.startsWith('B')) ? 250 : 150; });

  // POST booking to backend
  try {
    const response = await fetch(`${API_BASE}/bookings`, {
      method: 'POST',
      headers: authHeader(),
      body: JSON.stringify({
        movieId: movie.id || movie._id,
        theatreId: show?.theatreId?._id || show?.theatreId,
        showId: show?._id || show?.id,
        seats: seats,
        totalPrice: total
      })
    });

    const data = await response.json();

    if (!response.ok) {
      // If seats were taken (race condition), send user back to seats page
      alert('❌ ' + (data.message || 'Booking failed. Please try again.'));
      window.location.href = 'seats.html';
      return;
    }

    const bookingId = data._id || ('CB' + Date.now().toString(36).toUpperCase());

    // Save to local bookings history for dashboard display
    const booking = {
      id: bookingId, movie, seats,
      date: info.date || '-', time: info.time || '-',
      theater: info.theater || '-', total,
      timestamp: new Date().toISOString()
    };
    state.bookings.push(booking);

    // Clear selected seats (booking is done)
    state.selectedSeats = [];
    state.selectedMovie = null;
    state.selectedShow = null;
    saveState();

    // Render ticket
    const $ = id => document.getElementById(id);
    if ($('ticketMovie')) $('ticketMovie').textContent = movie.title;
    if ($('ticketDate')) $('ticketDate').textContent = info.date || '-';
    if ($('ticketTime')) $('ticketTime').textContent = info.time || '-';
    if ($('ticketTheater')) $('ticketTheater').textContent = info.theater || '-';
    if ($('ticketSeats')) $('ticketSeats').textContent = seats.join(', ');
    if ($('ticketId')) $('ticketId').textContent = bookingId;
    if ($('ticketTotal')) $('ticketTotal').textContent = `Rs. ${total.toFixed(2)}`;

  } catch (error) {
    console.error('Booking error:', error);
    alert('❌ Booking failed. Please try again.');
    window.location.href = 'seats.html';
  }
}

// Function to create a confetti animation for successful booking
function fireConfetti() {
  const canvas = document.getElementById('confettiCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const particles = [];
  const colors = ['#e50914', '#ffffff', '#2ed573', '#ff4757', '#fbbf24'];
  for (let i = 0; i < 150; i++) {
    particles.push({
      x: canvas.width / 2, y: canvas.height / 2 + 100,
      r: Math.random() * 6 + 2,
      dx: Math.random() * 12 - 6, dy: Math.random() * -15 - 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.floor(Math.random() * 10) - 10,
      tiltAngleInc: (Math.random() * 0.07) + 0.05, tiltAngle: 0
    });
  }
  let animationId;
  function animate() {
    animationId = requestAnimationFrame(animate);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let allDead = true;
    particles.forEach(p => {
      p.tiltAngle += p.tiltAngleInc;
      p.y += (Math.cos(p.tiltAngle) + 1 + p.r / 2) / 2;
      p.x += Math.sin(p.tiltAngle) * 2;
      p.dy += 0.15; p.x += p.dx; p.y += p.dy;
      if (p.y < canvas.height + 20) allDead = false;
      ctx.beginPath(); ctx.lineWidth = p.r; ctx.strokeStyle = p.color;
      ctx.moveTo(p.x + p.tilt + p.r, p.y);
      ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r);
      ctx.stroke();
    });
    if (allDead) { cancelAnimationFrame(animationId); ctx.clearRect(0, 0, canvas.width, canvas.height); }
  }
  animate();
}

// ========== DASHBOARD PAGE ==========
// Function to initialize the user dashboard page
async function initDashboardPage() {
  if (!state.isLoggedIn) return window.location.href = 'index.html';
  initNavbar();

  // Fetch real bookings from backend
  try {
    const response = await fetch(`${API_BASE}/bookings`, { headers: authHeader() });
    if (response.ok) {
      const backendBookings = await response.json();
      // Map backend booking data to frontend format for display
      state.bookings = backendBookings.map(b => ({
        id: b._id,
        movie: { title: b.movieId?.title || 'Unknown', poster: b.movieId?.poster || '' },
        seats: b.seats,
        date: b.showId?.date ? new Date(b.showId.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : '-',
        time: b.showId?.time || '-',
        theater: b.theatreId?.name || '-',
        total: b.totalPrice,
        timestamp: b.createdAt
      }));
      saveState();
    }
  } catch (error) {
    console.error('Error fetching bookings:', error);
  }

  renderDashboard();
}

// Function to render the dashboard with user info and booking history
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
      <div class="booking-item" style="transition: transform 0.15s ease-out, box-shadow 0.3s ease; transform-style: preserve-3d; will-change: transform;" onmousemove="handleCardMove(event, this)" onmouseleave="handleCardLeave(this)">
        <div class="booking-poster">
          <img src="${booking.movie.poster}" alt="${booking.movie.title}" onerror="this.src='images/placeholder.svg'">
        </div>
        <div class="booking-info">
          <h4 class="booking-title">${booking.movie.title}</h4>
          <p class="booking-meta">${booking.date} • ${booking.time} • ${Array.isArray(booking.seats) ? booking.seats.join(', ') : booking.seats}</p>
          <span class="booking-status">Confirmed</span>
        </div>
      </div>
    `).join('');
  }
}

// ========== 3D CARD INTERACTIVITY ==========
// Function to handle mouse movement over cards for 3D tilt effect
window.handleCardMove = (e, element) => {
  const threshold = 12;
  const { left, top, width, height } = element.getBoundingClientRect();
  const x = (e.clientX - left) / width - 0.5;
  const y = (e.clientY - top) / height - 0.5;
  element.style.transform = `perspective(1000px) rotateX(${y * -threshold}deg) rotateY(${x * threshold}deg) scale3d(1.02, 1.02, 1.02)`;
};

// Function to reset card transform when mouse leaves
window.handleCardLeave = (element) => {
  element.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
};

// Function to handle holographic effect on mouse move
window.handleHoloMove = (e, element) => {
  const rect = element.getBoundingClientRect();
  const x = e.clientX - rect.left, y = e.clientY - rect.top;
  element.style.setProperty('--mouse-x', `${x}px`);
  element.style.setProperty('--mouse-y', `${y}px`);
  const rotateX = (y - rect.height / 2) / 60;
  const rotateY = -(x - rect.width / 2) / 60;
  element.style.transform = `perspective(1500px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
};

// Function to reset holographic effect when mouse leaves
window.handleHoloLeave = (element) => {
  element.style.transform = `perspective(1500px) rotateX(0deg) rotateY(0deg)`;
};

// ========== NAVBAR ==========
// Function to initialize navbar functionality including theme toggle, mobile menu, and profile dropdown
function initNavbar() {
  const navbar = document.querySelector('.navbar');
  const themeToggle = document.getElementById('themeToggle');
  const profileBtn = document.getElementById('profileBtn') || document.getElementById('profileDropdown')?.previousElementSibling;
  const profileDropdown = document.getElementById('profileDropdown');
  const logoutBtn = document.getElementById('logoutBtn');
  const navbarNav = document.querySelector('.navbar-nav');

  if (navbarNav && state.user) {
    const existingAdmin = document.getElementById('navAdminLink');
    if (existingAdmin) existingAdmin.remove();
    if (state.user.role === 'admin') {
      const adminLink = document.createElement('a');
      adminLink.href = 'admin.html';
      adminLink.className = window.location.pathname.includes('admin') ? 'nav-link active' : 'nav-link';
      adminLink.id = 'navAdminLink';
      adminLink.textContent = 'Admin Panel';
      navbarNav.appendChild(adminLink);
    }
  }

  if (navbar && !navbar.dataset.scrollInit) {
    window.addEventListener('scroll', () => { navbar.classList.toggle('scrolled', window.scrollY > 80); });
    navbar.dataset.scrollInit = 'true';
  }

  if (navbar && navbarNav && !navbar.dataset.mobileInit) {
    const hamburger = document.createElement('button');
    hamburger.className = 'mobile-toggle';
    hamburger.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>`;
    navbar.insertBefore(hamburger, navbarNav);
    hamburger.addEventListener('click', (e) => {
      e.stopPropagation();
      navbarNav.classList.toggle('mobile-open');
      hamburger.innerHTML = navbarNav.classList.contains('mobile-open')
        ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`
        : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>`;
    });
    document.addEventListener('click', (e) => {
      if (navbarNav.classList.contains('mobile-open') && !navbarNav.contains(e.target) && !hamburger.contains(e.target)) {
        navbarNav.classList.remove('mobile-open');
        hamburger.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>`;
      }
    });
    navbar.dataset.mobileInit = 'true';
  }

  if (!window.navbarEventsBound) {
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
    window.navbarEventsBound = true;
  }
}

// Function to handle user logout by clearing state and redirecting to home
const logout = () => {
  state.isLoggedIn = false;
  state.user = null;
  state.selectedMovie = null;
  state.selectedShow = null;
  state.selectedSeats = [];
  state.bookedSeats = [];
  saveState();
  window.location.href = 'index.html';
};