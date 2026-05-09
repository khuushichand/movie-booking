// ============================================
// CINEBOOK - MOVIE TICKET BOOKING WEBSITE
// ============================================

// Movie Data
let movies = []; // Populated dynamically from backend API

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
    window.location.href = 'movies.html';
    return;
  }
  initNavbar();
  await fetchMovies();
  if (typeof renderAdminMovies === 'function') renderAdminMovies();
}

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

      const response = await fetch(`http://localhost:5000/api/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Authentication failed');

      state.isLoggedIn = true;
      state.user = { id: data._id, name: data.name, email: data.email, role: data.role, token: data.token };
      saveState();

      if (data.role === 'admin') {
        window.location.href = 'admin.html';
      } else {
        window.location.href = 'movies.html';
      }
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
async function initMoviesPage() {
  if (!state.isLoggedIn) return window.location.href = 'index.html';
  await fetchMovies();
  populateFilters();
  setupFilters();
  renderMovies(movies);
  initNavbar();
}

async function fetchMovies() {
  try {
    const response = await fetch('http://localhost:5000/api/movies');
    if (!response.ok) throw new Error('Failed to fetch movies');
    const data = await response.json();
    movies = data.map(movie => ({
      ...movie,
      id: movie._id, // Map MongoDB _id to frontend id
      price: movie.price || 150,    // Use database price or default
      poster: movie.poster.startsWith('/') ? `http://localhost:5000${movie.poster}` : movie.poster,
      genre: Array.isArray(movie.genre) ? movie.genre.join(', ') : movie.genre
    }));
  } catch (error) {
    console.error('Error fetching movies:', error);
    movies = []; // Fallback to empty array
  }
}
function renderMovies(moviesToRender = movies) {
  const grid = document.getElementById('moviesGrid');
  if (!grid) return;

  if (moviesToRender.length === 0) {
    grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-secondary); font-size: 1.1rem;"><p>No movies match your search criteria. Try adjusting your filters.</p></div>';
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
          <p class="movie-description">
            ${m.description || 'Experience the magic of cinema with this amazing movie. Get ready for an unforgettable journey on the big screen!'}
          </p>
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
  if (!isExpanded) {
    card.classList.add('expanded');
  }
};

window.selectMovie = movieId => {
  const movie = movies.find(m => String(m.id) === String(movieId));
  if (movie) {
    state.selectedMovie = movie;
    state.selectedSeats = [];
    saveState();
    window.location.href = 'seats.html';
  }
};

// ========== FILTERING LOGIC ==========
function populateFilters() {
  const genreFilter = document.getElementById('genreFilter');
  const langFilter = document.getElementById('langFilter');
  if (!genreFilter || !langFilter) return;

  const genres = new Set();
  const languages = new Set();

  movies.forEach(m => {
    if (m.genre) {
      m.genre.split(',').forEach(g => genres.add(g.trim()));
    }
    if (m.language) languages.add(m.language.trim());
  });

  genreFilter.innerHTML = '<option value="all">All Genres</option>';
  langFilter.innerHTML = '<option value="all">All Languages</option>';

  Array.from(genres).sort().forEach(g => {
    genreFilter.innerHTML += `<option value="${g}">${g}</option>`;
  });

  Array.from(languages).sort().forEach(l => {
    langFilter.innerHTML += `<option value="${l}">${l}</option>`;
  });
}

function setupFilters() {
  const searchInput = document.getElementById('searchInput');
  const genreFilter = document.getElementById('genreFilter');
  const langFilter = document.getElementById('langFilter');

  if (!searchInput || !genreFilter || !langFilter) return;

  const filterMovies = () => {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const genre = genreFilter.value;
    const lang = langFilter.value;

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

window.deleteMovie = async (movieId) => {
  if (!confirm('Are you sure you want to delete this movie? This action cannot be undone.')) return;

  let token = '';
  if (state.user && state.user.token) token = state.user.token;

  try {
    const response = await fetch(`http://localhost:5000/api/movies/${movieId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': 'Bearer ' + token
      }
    });

    if (response.ok) {
      movies = movies.filter(m => m.id !== movieId);
      renderAdminMovies();
    } else {
      const data = await response.json();
      throw new Error(data.message || 'Failed to delete movie');
    }
  } catch (error) {
    console.error('Delete error:', error);
    alert('❌ ' + error.message);
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

  html += `<div style="grid-column: 1 / -1; text-align: center; color: var(--accent-primary); font-size: 0.75rem; letter-spacing: 2px; margin: 0 0 1rem; font-weight: 700; transform: translateZ(40px);">PREMIUM SEATS (Rs. 250)</div>`;

  for (let row = 0; row < rows; row++) {
    if (row === 2) {
      html += `<div style="grid-column: 1 / -1; height: 1rem;"></div>`; // gap
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

  let total = 0;
  state.selectedSeats.forEach(seat => {
    // If seat starts with A or B it's premium (250) else standard (150)
    if (seat.startsWith('A') || seat.startsWith('B')) {
      total += 250;
    } else {
      total += 150;
    }
  });

  // Make selected seat chips
  const chipsHtml = state.selectedSeats.map(seat => {
    const isPremium = seat.startsWith('A') || seat.startsWith('B');
    return `<span style="display: inline-flex; align-items: center; justify-content: center; background: var(--accent-primary); color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.8rem; margin: 2px; box-shadow: 0 2px 5px rgba(229,9,20,0.3); font-weight: 600; animation: popIn 0.3s ease;">${seat} ${isPremium ? '<span style="font-size:0.6rem;margin-left:4px;">★</span>' : ''}</span>`;
  }).join('');

  if (selectedSeatsEl) selectedSeatsEl.innerHTML = count === 0 ? '<span style="color: var(--text-muted); font-size: 0.9rem;">No seats selected</span>' : chipsHtml;

  if (totalPriceEl) {
    totalPriceEl.style.transition = 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), color 0.2s';
    totalPriceEl.style.transform = 'scale(1.1)';
    totalPriceEl.style.color = 'white';

    setTimeout(() => {
      totalPriceEl.style.transform = 'scale(1)';
      totalPriceEl.style.color = 'var(--accent-primary)';
    }, 200);

    totalPriceEl.textContent = `Rs. ${total.toFixed(2)}`;
  }

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
  setTimeout(() => fireConfetti(), 300); // Small delay to let UI load
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
  if ($('ticketTotal')) $('ticketTotal').textContent = `Rs. ${total.toFixed(2)}`;

  state.selectedMovie = null;
  state.selectedSeats = [];
  saveState();
}

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
      x: canvas.width / 2,
      y: canvas.height / 2 + 100, // burst from center-bottom of ticket
      r: Math.random() * 6 + 2,
      dx: Math.random() * 12 - 6,
      dy: Math.random() * -15 - 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.floor(Math.random() * 10) - 10,
      tiltAngleInc: (Math.random() * 0.07) + 0.05,
      tiltAngle: 0
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
      p.dy += 0.15; // gravity
      p.x += p.dx;
      p.y += p.dy;

      if (p.y < canvas.height + 20) allDead = false;

      ctx.beginPath();
      ctx.lineWidth = p.r;
      ctx.strokeStyle = p.color;
      ctx.moveTo(p.x + p.tilt + p.r, p.y);
      ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r);
      ctx.stroke();
    });

    if (allDead) {
      cancelAnimationFrame(animationId);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  animate();
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
      <div class="booking-item" style="transition: transform 0.15s ease-out, box-shadow 0.3s ease; transform-style: preserve-3d; will-change: transform;" onmousemove="handleCardMove(event, this)" onmouseleave="handleCardLeave(this)">
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

// ========== 3D CARD INTERACTIVITY ==========
window.handleCardMove = (e, element) => {
  const threshold = 12; // Matching the requested threshold
  const { left, top, width, height } = element.getBoundingClientRect();
  const x = (e.clientX - left) / width - 0.5;
  const y = (e.clientY - top) / height - 0.5;
  const rotateX = y * -threshold;
  const rotateY = x * threshold;

  element.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
};

window.handleCardLeave = (element) => {
  element.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
};

// ========== HOLOGRAPHIC INTERFACE ==========
window.handleHoloMove = (e, element) => {
  const rect = element.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // Set spotlight coordinates
  element.style.setProperty('--mouse-x', `${x}px`);
  element.style.setProperty('--mouse-y', `${y}px`);

  // 3D Tilt Effect
  const width = rect.width;
  const height = rect.height;
  const rotateX = (y - height / 2) / 60; // Higher divisor for less intense tilt on large container
  const rotateY = -(x - width / 2) / 60;

  element.style.transform = `perspective(1500px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
};

window.handleHoloLeave = (element) => {
  element.style.transform = `perspective(1500px) rotateX(0deg) rotateY(0deg)`;
};

// ========== NAVBAR ==========
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
    window.addEventListener('scroll', () => {
      if (window.scrollY > 80) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    });
    navbar.dataset.scrollInit = 'true';
  }

  // Inject Mobile Toggle
  if (navbar && navbarNav && !navbar.dataset.mobileInit) {
    const hamburger = document.createElement('button');
    hamburger.className = 'mobile-toggle';
    hamburger.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>`;

    navbar.insertBefore(hamburger, navbarNav);

    hamburger.addEventListener('click', (e) => {
      e.stopPropagation();
      navbarNav.classList.toggle('mobile-open');
      if (navbarNav.classList.contains('mobile-open')) {
        hamburger.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
      } else {
        hamburger.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>`;
      }
    });

    document.addEventListener('click', (e) => {
      if (navbarNav.classList.contains('mobile-open') && !navbarNav.contains(e.target) && !hamburger.contains(e.target)) {
        navbarNav.classList.remove('mobile-open');
        hamburger.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>`;
      }
    });

    navbar.dataset.mobileInit = 'true';
  }

  // Bind Events
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
const logout = () => {
  state.isLoggedIn = false;
  state.user = null;
  state.selectedMovie = null;
  state.selectedSeats = [];
  saveState();
  window.location.href = 'index.html';
};