/* ============================================
   Main.js — Landing Page Controller
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

    /* ---- Login Form Handler ---- */
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const email = document.getElementById('l_email').value.trim();
            const password = document.getElementById('l_password').value;

            // Validate
            if (!Auth.validateEmail(email)) {
                UI.showToast('Please enter a valid email address.', 'error');
                return;
            }
            if (!Auth.validatePassword(password)) {
                UI.showToast('Password must be at least 6 characters.', 'error');
                return;
            }

            Auth.authenticate({
                action: 'login',
                email,
                password
            }, 'l_btn');
        });
    }

    /* ---- Register Form Handler ---- */
    const regForm = document.getElementById('regForm');
    if (regForm) {
        regForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const name = document.getElementById('r_name').value.trim();
            const email = document.getElementById('r_email').value.trim();
            const password = document.getElementById('r_password').value;

            // Validate
            if (!Auth.validateName(name)) {
                UI.showToast('Please enter your full name (at least 2 characters).', 'error');
                return;
            }
            if (!Auth.validateEmail(email)) {
                UI.showToast('Please enter a valid email address.', 'error');
                return;
            }
            if (!Auth.validatePassword(password)) {
                UI.showToast('Password must be at least 6 characters.', 'error');
                return;
            }

            Auth.authenticate({
                action: 'register',
                name,
                email,
                password,
                access: '1' // Default Free Course
            }, 'r_btn');
        });
    }

    /* ---- Keyboard: Close modal on Escape ---- */
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            UI.closeModal();
            UI.closeMobileNav();
            closeCourseModal();
        }
    });

    /* ---- Initial Reveal ---- */
    reveal();
});

/* ---- Scroll Animation (Reveal on Scroll) ---- */
function reveal() {
    var reveals = document.querySelectorAll('.reveal');
    for (var i = 0; i < reveals.length; i++) {
        var windowHeight = window.innerHeight;
        var elementTop = reveals[i].getBoundingClientRect().top;
        var elementVisible = 150;
        if (elementTop < windowHeight - elementVisible) {
            reveals[i].classList.add('active');
        }
    }
}
window.addEventListener('scroll', reveal);

/* ============================================
   ROADMAP MODAL LOGIC
   ============================================ */

// Roadmap Data
const courseRoadmaps = {
    "1": {
        title: "n8n Fundamentals",
        desc: "Master nodes, triggers, and JSON flow basics.",
        steps: [
            { title: "Introduction to Automation", desc: "Understanding Nodes, Connections, and Workflow Canvas" },
            { title: "Triggers & Webhooks", desc: "How to start workflows automatically with data" },
            { title: "Data Manipulation", desc: "Working with JSON, IF nodes, and Switch Logic" },
            { title: "First Project", desc: "Building a simple Email Auto-Responder" }
        ]
    },
    "2": {
        title: "Advanced Webhooks & APIs",
        desc: "Deep dive into HTTP requests and Auth.",
        steps: [
            { title: "HTTP Protocol Deep Dive", desc: "GET, POST, PUT, DELETE headers and body" },
            { title: "Authentication Patterns", desc: "Bearer Token, Basic Auth, and OAuth2" },
            { title: "Error Handling", desc: "Retry strategies and error triggers" },
            { title: "Capstone", desc: "Building a Stripe Payment Integration" }
        ]
    },
    "3": {
        title: "SaaS Automation Masterclass",
        desc: "Build a backend without code.",
        steps: [
            { title: "Architecture Design", desc: "Planning your Database and API endpoints" },
            { title: "User Management System", desc: "Registration, Login, and Session handling" },
            { title: "Subscription Logic", desc: "Handling recurring payments and access control" },
            { title: "Scaling Up", desc: "Optimizing execution time and managing limits" }
        ]
    },
    "4": {
        title: "Linux Fundamentals",
        desc: "Master the command line and server admin.",
        steps: [
            { title: "Shell Basics", desc: "Navigation, file manipulation, and permissions (chmod/chown)" },
            { title: "Package Management", desc: "Installing and updating software (apt/yum)" },
            { title: "Process Management", desc: "Monitoring system resources (top, ps, kill)" },
            { title: "Scripting Intro", desc: "Writing your first Bash script" }
        ]
    },
    "5": {
        title: "C Programming Language",
        desc: "Low-level programming mastery.",
        steps: [
            { title: "Syntax & Types", desc: "Variables, loops, and control structures" },
            { title: "Memory Management", desc: "Pointers, malloc, and free" },
            { title: "Data Structures", desc: "Implementing Linked Lists and Arrays manually" },
            { title: "File I/O", desc: "Reading and writing system files" }
        ]
    },
    "6": {
        title: "Discrete Mathematics",
        desc: "The math behind Computer Science.",
        steps: [
            { title: "Logic & Proofs", desc: "Propositional logic and truth tables" },
            { title: "Set Theory", desc: "Union, intersection, and Venn diagrams" },
            { title: "Graph Theory", desc: "Nodes, edges, paths, and cycles" },
            { title: "Algorithms", desc: "Big O notation and complexity analysis" }
        ]
    },
    "7": {
        title: "Java Programming",
        desc: "Building robust enterprise applications.",
        steps: [
            { title: "Java Basics", desc: "JVM, JRE, and Main method structure" },
            { title: "OOP Core", desc: "Classes, Objects, and Inheritance" },
            { title: "Exception Handling", desc: "Try-catch blocks and custom exceptions" },
            { title: "Collections Framework", desc: "Lists, Sets, and Maps" }
        ]
    },
    "8": {
        title: "Java OOP Mastery",
        desc: "Design patterns and advanced architecture.",
        steps: [
            { title: "Polymorphism", desc: "Overloading and Overriding deep dive" },
            { title: "Design Patterns", desc: "Singleton, Factory, and Observer patterns" },
            { title: "SOLID Principles", desc: "Writing clean, maintainable code" },
            { title: "Project", desc: "Building a Bank Management System" }
        ]
    },
    "9": {
        title: "Scripting & Automation",
        desc: "Python and Shell for DevOps.",
        steps: [
            { title: "Python Basics", desc: "Variables, functions, and libraries" },
            { title: "File Automation", desc: "Renaming and organizing files programmatically" },
            { title: "Web Scraping", desc: "Extracting data from websites with BeautifulSoup" },
            { title: "Cron Jobs", desc: "Scheduling scripts to run automatically" }
        ]
    },
    "NEW_19": {
        title: "Generated YouTube Course",
        desc: "Master AI Agents with this comprehensive generated course in Hindi.",
        steps: [
            { title: "Introduction to AI Agents", desc: "Understanding the basics and potential of AI Agents." },
            { title: "Tools & Frameworks", desc: "Exploring the best tools like n8n and LangChain." },
            { title: "Building Workflows", desc: "Creating complex agent workflows from scratch." },
            { title: "Advanced Integration", desc: "Connecting agents to real-world APIs and databases." },
            { title: "RAG & MCP", desc: "Retrieval Augmented Generation and Model Context Protocol." }
        ]
    }
};

window.openCourseModal = async (courseCode) => {
    const modalOverlay = document.getElementById('course-modal-overlay');
    const content = document.getElementById('course-modal-content');
    if (!modalOverlay || !content) return;

    // Retrieve cached course info for header rendering
    const c = (window.homeCoursesCache || []).find(item => item.course_code === courseCode);
    if (!c) return;

    const bannerUrl = c.thumbnail_url || 'images/brand.png';

    // Step 1: Load standard Modal Frame immediately (shimmer state)
    content.innerHTML = `
        <!-- Close Button (Absolute Floating Overlay) -->
        <button onclick="closeCourseModal()" class="absolute top-4 right-4 z-50 text-white bg-black/30 hover:bg-black/60 backdrop-blur-md w-8 h-8 flex items-center justify-center rounded-full transition shadow-md border border-white/10">
            <i class="fa-solid fa-xmark text-base"></i>
        </button>

        <!-- 16:9 Hero Header Banner (Strict aspect-video enforced) -->
        <div class="relative w-full aspect-video overflow-hidden bg-slate-100 shrink-0 border-b border-slate-100">
            <img src="${bannerUrl}" alt="${c.title}" class="w-full h-full object-cover" onerror="this.src='images/brand.png'">
            <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent"></div>
            <div class="absolute bottom-6 left-6 right-6 z-10 text-white">
                <span class="badge badge-free bg-white/20 text-white border-none mb-2 inline-block backdrop-blur-sm">Course Curriculum</span>
                <h2 class="text-2xl md:text-3xl font-black leading-tight tracking-tight drop-shadow-md">${c.title}</h2>
            </div>
        </div>

        <!-- Syllabus Content Panel -->
        <div class="p-6 md:p-8 overflow-y-auto flex-1 dark-scroll flex flex-col gap-4 bg-white">
            <p class="text-slate-500 text-sm font-medium leading-relaxed pb-4 border-b border-slate-100">${c.description || 'Unlock comprehensive step-by-step training to master structural system workflows.'}</p>
            
            <div>
                <h4 class="font-black text-slate-800 text-xs uppercase tracking-wider mb-4 flex items-center gap-2">
                    <i class="fa-solid fa-list-ol text-orange-600 text-sm"></i> Lesson Syllabus Modules
                </h4>
                
                <div id="syllabus-lessons-placeholder" class="flex flex-col gap-3 animate-pulse py-4">
                    <div class="h-10 bg-slate-50 rounded-xl w-full border border-slate-100"></div>
                    <div class="h-10 bg-slate-50 rounded-xl w-full border border-slate-100"></div>
                    <div class="h-10 bg-slate-50 rounded-xl w-full border border-slate-100"></div>
                </div>
                
                <div id="syllabus-lessons-list" class="hidden flex flex-col gap-3">
                    <!-- Lessons injected dynamic -->
                </div>
            </div>
        </div>

        <!-- Action Bottom Footer -->
        <div class="p-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/80 backdrop-blur-md shrink-0">
            <button onclick="closeCourseModal()" class="px-5 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition text-sm">Dismiss</button>
            <button onclick="closeCourseModal(); UI.openModal('register')" class="btn btn-primary shadow-lg px-6 py-2.5 font-black text-sm">Enroll Today <i class="fa-solid fa-arrow-right ml-1"></i></button>
        </div>
    `;

    // Reveal modal frame immediately
    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Step 2: Fetch Dynamic Curriculum from Database (No auth headers required)
    try {
        const res = await fetch('/api/get-course-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ course_code: courseCode })
        });
        const json = await res.json();
        
        const placeholder = document.getElementById('syllabus-lessons-placeholder');
        const listContainer = document.getElementById('syllabus-lessons-list');
        if (!placeholder || !listContainer) return;

        placeholder.classList.add('hidden');
        listContainer.classList.remove('hidden');

        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            // Render clean numbered sequence of actual database lessons
            listContainer.innerHTML = json.data.map((l, idx) => `
                <div class="flex items-start gap-4 p-3.5 rounded-xl border border-slate-100 hover:bg-slate-50 transition duration-200 group bg-white">
                    <div class="w-7 h-7 bg-slate-900 group-hover:bg-orange-600 text-white font-black text-xs rounded-lg flex items-center justify-center shrink-0 shadow-sm transition-colors">
                        ${l.lesson_number || (idx + 1)}
                    </div>
                    <div class="flex-1">
                        <h5 class="text-sm font-bold text-slate-800 group-hover:text-orange-600 transition-colors leading-snug">${l.title}</h5>
                        ${l.duration ? `<span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mt-0.5"><i class="fa-regular fa-clock text-[9px]"></i> ${l.duration}</span>` : ''}
                    </div>
                </div>
            `).join('');
        } else {
            // User Requested Fallback: Detailed syllabus coming soon
            listContainer.innerHTML = `
                <div class="text-center py-10 px-4 border border-dashed border-slate-200 rounded-2xl bg-slate-50 flex flex-col items-center gap-2">
                    <div class="text-2xl text-slate-300"><i class="fa-solid fa-laptop-code animate-pulse"></i></div>
                    <p class="text-slate-600 text-sm font-black uppercase tracking-wider leading-snug">Detailed syllabus coming soon!</p>
                </div>
            `;
        }
    } catch (err) {
        console.error('[openCourseModal] Curriculum fetch failed:', err);
        const listContainer = document.getElementById('syllabus-lessons-list');
        if (listContainer) {
            listContainer.classList.remove('hidden');
            listContainer.innerHTML = `
                <div class="text-center py-10 px-4 border border-dashed border-slate-200 rounded-2xl bg-slate-50 flex flex-col items-center gap-2">
                    <div class="text-2xl text-slate-300"><i class="fa-solid fa-triangle-exclamation"></i></div>
                    <p class="text-slate-600 text-sm font-black uppercase tracking-wider leading-snug">Detailed syllabus coming soon!</p>
                </div>
            `;
        }
    }
};

window.closeCourseModal = (e) => {
    if (e && e.target !== e.currentTarget) return; // Click inside modal shouldn't close
    const modalOverlay = document.getElementById('course-modal-overlay');
    modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
};

/* ============================================
   WORKSHOP LOGIC (Dynamic)
   ============================================ */

// Render Workshops on Index Page
// Global Active State for Current Modal Interaction
let activeWorkshopId = null;

// Render Active Workshops from MySQL API
window.renderWorkshops = async () => {
    const featuredContainer = document.getElementById('featured-workshop-container');
    if (!featuredContainer) return; 

    try {
        const response = await fetch('/api/workshops');
        const json = await response.json();
        const list = json.success ? json.data : [];

        // Find the single most recent/upcoming active workshop
        const active = list.length > 0 ? list[0] : null;

        if (active) {
            const date = new Date(active.workshop_date);
            const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

            featuredContainer.innerHTML = `
                <div class="flex flex-col lg:flex-row items-center gap-12 animate-fade-in-up w-full">
                    <div class="lg:w-1/2 space-y-6 text-left">
                        <span class="inline-block px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-bold tracking-wider uppercase animate-pulse">
                            <i class="fa-solid fa-circle text-[8px] mr-2"></i> Featured Workshop
                        </span>
                        <h2 class="text-4xl md:text-5xl font-black tracking-tight leading-tight text-white">
                            ${active.title}
                        </h2>
                        <p class="text-slate-400 text-lg leading-relaxed font-medium">
                            ${active.description || 'Master essential future-proof automation workflows and accelerate your career path.'}
                        </p>
                        <div class="flex flex-col sm:flex-row gap-4 pt-4">
                            <a href="workshops.html" class="btn btn-primary btn-lg shadow-xl shadow-orange-500/10 group font-black tracking-wide">
                                Register / Join <i class="fa-solid fa-chevron-right ml-2 group-hover:translate-x-1 transition"></i>
                            </a>
                        </div>
                        <div class="flex items-center gap-6 text-sm text-slate-500 pt-4 border-t border-slate-800 font-semibold">
                            <div class="flex items-center gap-2">
                                 <i class="fa-regular fa-calendar text-orange-500"></i> ${dateStr}
                            </div>
                            <div class="flex items-center gap-2">
                                 <i class="fa-regular fa-clock text-orange-500"></i> ${timeStr}
                            </div>
                        </div>
                    </div>
                    <div class="lg:w-1/2 relative w-full">
                        <div class="relative rounded-3xl overflow-hidden shadow-2xl shadow-black/50 border border-slate-800 group aspect-video bg-slate-950">
                            ${active.image_url ? `<img src="${active.image_url}" alt="Workshop" class="w-full h-full object-cover transform group-hover:scale-105 transition duration-700 opacity-85">` : `<div class="w-full h-full flex items-center justify-center text-slate-700 bg-slate-900 font-black text-lg">NO BANNER</div>`}
                            <div class="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent flex items-center justify-center">
                                <a href="workshops.html" class="w-16 h-16 rounded-full bg-orange-600 text-white flex items-center justify-center shadow-2xl shadow-orange-500/30 hover:scale-110 transition animate-bounce-slow flex">
                                    <i class="fa-solid fa-play text-xl ml-1"></i>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } else {
            featuredContainer.innerHTML = `
                <div class="text-center py-16">
                    <div class="inline-flex w-16 h-16 rounded-full bg-slate-800 items-center justify-center text-slate-600 text-2xl mb-4 shadow-inner"><i class="fa-solid fa-calendar-minus"></i></div>
                    <h3 class="text-xl font-bold text-slate-300">No Scheduled Sessions</h3>
                    <p class="text-slate-500 mt-2 text-sm font-medium">Our webinar calendar is clear. Sign up for notifications!</p>
                </div>
            `;
        }
    } catch (e) {
        featuredContainer.innerHTML = `<div class="text-slate-500 text-sm font-semibold"><i class="fa-solid fa-exclamation-circle mr-1"></i> Offline</div>`;
    }
};

/* ============================================
   INTEGRATED REGISTRATION GATEKEEPER
   ============================================ */
window.openWorkshopModal = (workshopId, title) => {
    activeWorkshopId = workshopId;
    
    document.getElementById('w-modal-title').textContent = title;
    document.getElementById('w-modal-desc').innerHTML = "Type your email below. We'll instantly detect if you possess a registered seat or enroll a new one!";
    document.getElementById('w-modal-desc').className = "text-xs text-slate-500 font-medium leading-relaxed";
    
    const inputBlock = document.getElementById('w-input-block');
    inputBlock.style.display = 'block';
    
    // Reset Buttons to Initial State
    const actionContainer = document.getElementById('w-action-container');
    actionContainer.innerHTML = `
        <button onclick="verifyWorkshopAccess()" id="w-btn-verify" class="w-full bg-orange-600 hover:bg-orange-700 text-white font-extrabold py-3.5 rounded-xl shadow-lg hover:shadow-orange-500/20 transition flex items-center justify-center gap-2 text-sm">
            Validate Identity / Join
        </button>
    `;

    // Pre-fill if user is already logged in! (Excellent UX)
    const emailInput = document.getElementById('w-user-email');
    const loggedUser = Auth.getUser();
    if (loggedUser && loggedUser.email) {
        emailInput.value = loggedUser.email;
    } else {
        emailInput.value = '';
    }
    
    const modal = document.getElementById('modal-workshop');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.style.overflow = 'hidden';
};

window.closeWorkshopModal = () => {
    const modal = document.getElementById('modal-workshop');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.body.style.overflow = '';
};

// 🚀 Dynamic Identity Router
window.verifyWorkshopAccess = async () => {
    const email = document.getElementById('w-user-email').value.trim();
    if (!email || !validateEmail(email)) {
        UI.showToast('Provide a syntactically valid email address.', 'error');
        return;
    }

    const btn = document.getElementById('w-btn-verify');
    const originalTxt = btn ? btn.innerHTML : '';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin mr-1"></i> Syncing records...';
    }

    try {
        const res = await fetch('/api/workshops/check-access', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ workshop_id: activeWorkshopId, email })
        });

        const data = await res.json();
        const container = document.getElementById('w-action-container');
        const desc = document.getElementById('w-modal-desc');
        const inputBlock = document.getElementById('w-input-block');

        if (res.ok && data.success) {
            // CASE 1: ALREADY REGISTERED -> SHOW BIG DIRECT JOIN LINK!
            inputBlock.style.display = 'none'; // Clean aesthetic
            desc.innerHTML = `🎉 <strong>Seat Verified!</strong> Your access list indices matched perfectly. Join the webinar immediately below:`;
            desc.className = "text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 p-3 rounded-xl font-semibold leading-relaxed";
            
            container.innerHTML = `
                <a href="${data.meeting_link}" target="_blank" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 rounded-xl shadow-xl hover:shadow-emerald-500/20 transition flex items-center justify-center gap-2 text-center tracking-wide text-sm">
                    <i class="fa-solid fa-circle-play text-lg"></i> Join Live Webinar Now
                </a>
                <p class="text-[10px] text-slate-400 text-center font-medium mt-1">Safe connection via secure gateway tunnel.</p>
            `;
        } else {
            // CASE 2: NOT REGISTERED YET -> OFFER ONE-CLICK INSTANT SEAT ENROLLMENT!
            desc.innerHTML = `⚠️ <strong>No Existing Seat Detected.</strong> Your email isn't indexed for this session yet. Enroll immediately below to secure your free entry token!`;
            desc.className = "text-xs text-amber-700 bg-amber-50 border border-amber-100 p-3 rounded-xl font-semibold leading-relaxed";
            
            container.innerHTML = `
                <button onclick="registerNewUserSeat('${email}')" id="w-btn-enroll" class="w-full bg-orange-600 hover:bg-orange-700 text-white font-black py-3.5 rounded-xl shadow-xl transition flex items-center justify-center gap-2 text-sm">
                    <i class="fa-solid fa-ticket"></i> Secure Free Seat Entry
                </button>
            `;
        }
    } catch (err) {
        UI.showToast('Access check drift.', 'error');
        if (btn) { btn.disabled = false; btn.innerHTML = originalTxt; }
    }
};

// 🎫 Create Instant Registration & Bounce to Webinar Link!
window.registerNewUserSeat = async (email) => {
    const btn = document.getElementById('w-btn-enroll');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin mr-1"></i> Cataloging seat...';
    }

    try {
        const res = await fetch('/api/workshops/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ workshop_id: activeWorkshopId, email })
        });

        if (res.ok) {
            UI.showToast('🎉 Seat confirmed successfully!', 'success');
            // Atomically re-run validation loop to output direct JOIN button instantly!
            await verifyWorkshopAccess();
        } else {
            UI.showToast('Seat allocation error.', 'error');
            if (btn) { btn.disabled = false; btn.textContent = 'Secure Free Seat Entry'; }
        }
    } catch (err) {
        UI.showToast('Network registry error.', 'error');
    }
};

// UTILS: General Helpers
function validateEmail(email) {
    return String(email).toLowerCase().match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

/* ============================================
   USER ANALYTICS CHART
   ============================================ */
const renderUserChart = async () => {
    const ctx = document.getElementById('userAnalyticsChart');
    if (!ctx) return;

    try {
        const response = await fetch('/api/get-live-stats');
        const result = await response.json();
        const data = result.success ? result.data : [];

        // Data processing for Chart.js
        const labels = data.map(d => d.name);
        const values = data.map(d => d.total_courses);

        if (window.userChartInstance) {
            window.userChartInstance.destroy();
        }

        window.userChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Courses Completed',
                    data: values,
                    backgroundColor: 'rgba(234, 88, 12, 0.85)',
                    hoverBackgroundColor: '#ea580c',
                    borderWidth: 0,
                    borderRadius: 6,
                    barPercentage: 0.7,
                    maxBarThickness: 50
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#1e293b',
                        padding: 12,
                        cornerRadius: 8,
                        titleFont: { family: 'Inter', size: 13 },
                        bodyFont: { family: 'Inter', size: 14, weight: 'bold' },
                        displayColors: false,
                        callbacks: {
                            label: (context) => `Completed ${context.raw} Courses`
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: '#f1f5f9', borderDash: [5, 5] },
                        ticks: { font: { family: 'Inter', size: 11 }, stepSize: 1, color: '#64748b' },
                        border: { display: false }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { font: { family: 'Inter', size: 11, weight: 600 }, color: '#475569', autoSkip: false, maxRotation: 45, minRotation: 0 },
                        border: { display: false }
                    }
                },
                layout: { padding: 10 },
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                }
            }
        });
    } catch (error) {
        console.error('Failed to load chart data:', error);
        ctx.parentElement.innerHTML = '<div class="flex flex-col items-center justify-center h-full text-slate-400 gap-2"><i class="fa-solid fa-chart-simple text-3xl opacity-20"></i><span>Waiting for live data...</span></div>';
    }
};

/* ============================================
   FRONTPAGE NOTIFICATIONS ENGINE
   ============================================ */
window.updateFrontNavbar = () => {
    const group = document.getElementById('nav-auth-group');
    if (!group) return;
    
    if (Auth.isLoggedIn()) {
        group.innerHTML = `
            <!-- Bell Notification Engine -->
            <div class="relative">
                <button onclick="toggleFrontNotifications(event)" class="relative text-slate-600 hover:text-orange-600 p-2 rounded-full bg-slate-50 hover:bg-orange-50 transition flex items-center focus:outline-none">
                    <i class="fa-solid fa-bell text-base"></i>
                    <span id="front-notif-dot" class="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full animate-pulse hidden"></span>
                </button>
                
                <!-- Dropdown Hub -->
                <div id="front-notif-dropdown" class="absolute right-0 mt-3 w-72 bg-white border border-slate-100 rounded-2xl shadow-2xl shadow-black/10 text-slate-800 overflow-hidden hidden z-50 transform origin-top-right animate-scale-in" onclick="event.stopPropagation()">
                    <div class="bg-slate-900 px-4 py-3 text-white flex justify-between items-center">
                        <span class="text-[10px] font-black tracking-widest uppercase opacity-80">Live Updates</span>
                        <button onclick="markAllFrontRead()" class="text-[9px] bg-orange-600 hover:bg-orange-700 text-white px-2 py-0.5 rounded font-bold transition shadow">Mark All Read</button>
                    </div>
                    <div id="front-notif-list" class="max-h-64 overflow-y-auto divide-y divide-slate-50 dark-scroll">
                        <div class="p-6 text-center text-xs text-slate-400 font-medium">Scanning pipeline...</div>
                    </div>
                </div>
            </div>
            
            <a href="dashboard.html" class="btn btn-primary btn-pill btn-sm shadow-lg hover:shadow-orange-500/20 flex items-center gap-1 font-black text-[11px]">
                Go to Dashboard <i class="fa-solid fa-chevron-right text-[9px] ml-0.5"></i>
            </a>
        `;
        
        // Immediately query indices
        loadFrontpageNotifications();
        // Interval background sync
        setInterval(loadFrontpageNotifications, 30000);
    }
};

window.toggleFrontNotifications = (e) => {
    if (e) e.stopPropagation();
    const dropdown = document.getElementById('front-notif-dropdown');
    if (!dropdown) return;
    dropdown.classList.toggle('hidden');
};

window.loadFrontpageNotifications = async () => {
    const dot = document.getElementById('front-notif-dot');
    const list = document.getElementById('front-notif-list');
    if (!Auth.isLoggedIn()) return;

    const user = Auth.getUser();
    try {
        const res = await fetch(`/api/notifications?email=${encodeURIComponent(user.email)}`);
        const json = await res.json();
        const unread = json.success ? json.data : [];

        if (unread.length > 0) {
            if (dot) dot.classList.remove('hidden');
            if (list) {
                list.innerHTML = unread.map(n => `
                    <div onclick="handleFrontNotifClick(${n.id}, '${n.link || ''}')" class="p-4 hover:bg-orange-50/50 transition cursor-pointer flex gap-3 group">
                        <div class="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-xs mt-0.5 shadow-sm shrink-0 group-hover:scale-110 transition"><i class="fa-solid fa-bullhorn"></i></div>
                        <div class="flex-1 space-y-0.5 text-left">
                            <p class="text-xs text-slate-700 font-bold leading-tight line-clamp-2">${n.message}</p>
                            <p class="text-[9px] text-slate-400 font-semibold">${new Date(n.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${new Date(n.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                    </div>
                `).join('');
            }
        } else {
            if (dot) dot.classList.add('hidden');
            if (list) {
                list.innerHTML = `
                    <div class="p-8 text-center flex flex-col items-center gap-2">
                        <i class="fa-regular fa-bell-slash text-slate-300 text-2xl"></i>
                        <p class="text-xs text-slate-400 font-semibold">Inbox fully synchronized.</p>
                    </div>
                `;
            }
        }
    } catch (err) {
        console.error('Notif fetch drift.');
    }
};

window.handleFrontNotifClick = async (id, targetLink) => {
    try {
        await fetch('/api/notifications/read', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notification_id: id })
        });
    } catch(e){}
    
    if (targetLink) {
        window.location.href = targetLink;
    } else {
        loadFrontpageNotifications();
    }
};

window.markAllFrontRead = async () => {
    if (!Auth.isLoggedIn()) return;
    const user = Auth.getUser();
    try {
        await fetch('/api/notifications/clear', {
            method: 'DELETE',
            headers: { 
                'Content-Type': 'application/json',
                'x-user-email': user.email
            }
        });
        loadFrontpageNotifications();
    } catch(e){}
};

// Close on Document Tap
document.addEventListener('click', () => {
    const dropdown = document.getElementById('front-notif-dropdown');
    if (dropdown && !dropdown.classList.contains('hidden')) {
        dropdown.classList.add('hidden');
    }
});

// Init Logic
document.addEventListener('DOMContentLoaded', () => {
    updateFrontNavbar();
    renderWorkshops();
    renderUserChart();
    fetchHomeCourses(); // Dynamic Supabase Courses Pipeline
    
    // 🚀 Supercharged Performance Hydrations
    loadHeroWorkshopBanner();
    loadPublicStats();
    // Manual Featured Testimonials Rendered Statically in HTML

    // Check Redirect from Workshop Page
    const params = new URLSearchParams(window.location.search);
    if (params.get('redirect') === 'workshop') {
        UI.openModal('login');
    }
});

async function fetchHomeCourses() {
    const grid = document.getElementById('landing-courses-grid');
    if (!grid) return;
    try {
        const res = await fetch('/api/get-all-courses');
        const courses = await res.json();
        if (Array.isArray(courses)) {
            // Filter data to show ONLY 'active' courses
            const activeCourses = courses.filter(c => c.status === 'active');
            
            // Map to static roadmap IDs for existing timelines popup
            const roadmapMapping = {
                'n8n Fundamentals': '1',
                'Linux Fundamentals': '4',
                'SaaS Automation': '3',
                'Java Programming': '7',
                'Scripting & Automation': '9',
                'Discrete Mathematics': '6',
                'C Programming Language': '5'
            };

            // Fallback: If no courses are returned, show a friendly message
            if (activeCourses.length === 0) {
                grid.innerHTML = `
                <div class="col-span-full text-center py-16 bg-slate-50 rounded-3xl border border-dashed border-slate-200" data-aos="fade-up">
                    <div class="text-slate-400 text-3xl mb-3">
                        <i class="fa-solid fa-graduation-cap"></i>
                    </div>
                    <p class="text-slate-600 font-semibold">New automation courses are being prepared. Stay tuned!</p>
                </div>`;
                return;
            }

            // Cache home courses globally for instant metadata indexing in modals
            window.homeCoursesCache = activeCourses;

            // Dynamically create Tailwind-styled cards with Thumbnail, Icon, Title, Short Description, and 'View Syllabus' Button
            grid.innerHTML = activeCourses.map((c, idx) => {
                const badge = parseFloat(c.price) === 0 
                    ? '<span class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-black text-[9px] uppercase tracking-wider shadow-sm border border-emerald-200/30">FREE</span>' 
                    : '<span class="px-2 py-0.5 rounded bg-orange-100 text-orange-700 font-black text-[9px] uppercase tracking-wider shadow-sm border border-orange-200/30">PREMIUM</span>';
                const aosDelay = (idx % 3) * 100; // Staggered delay: 0, 100, 200
                
                return `
                <div class="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full group relative" data-aos="fade-up" data-aos-delay="${aosDelay}">
                    <!-- Thumbnail with 16:9 aspect-video -->
                    <div class="relative aspect-video w-full overflow-hidden bg-gray-100 border-b border-gray-100">
                        <img src="${c.thumbnail_url || 'images/brand.png'}" alt="${c.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onerror="this.src='images/brand.png'">
                        <div class="absolute top-4 right-4 z-10">
                            ${badge}
                        </div>
                        <!-- Icon Layer -->
                        <div class="absolute -bottom-6 left-6 w-12 h-12 rounded-xl ${c.color || 'bg-orange-500 text-white'} shadow-md flex items-center justify-center text-lg z-20 group-hover:scale-110 transition-transform duration-300 border-2 border-white">
                            <i class="fa-solid ${c.icon || 'fa-graduation-cap'}"></i>
                        </div>
                    </div>
                    
                    <!-- Card Content -->
                    <div class="p-6 pt-9 flex-1 flex flex-col">
                        <h3 class="text-lg font-bold text-slate-800 mb-2 group-hover:text-orange-600 transition-colors line-clamp-1">${c.title}</h3>
                        <p class="text-slate-500 text-sm leading-relaxed mb-6 flex-1 line-clamp-2">${c.description || 'Explore advanced low-code and software engineering modules.'}</p>
                        
                        <div class="flex items-center justify-between gap-4 pt-4 border-t border-slate-50 mt-auto">
                            <div class="flex items-center gap-2 text-xs text-slate-400 font-bold">
                                <span class="flex items-center gap-1"><i class="fa-solid fa-list-ul text-[10px]"></i> ${parseInt(c.total_lessons) || 0} Lessons</span>
                            </div>
                            <!-- 'View Syllabus' Button -->
                            <button onclick="openCourseModal('${c.course_code}')" class="btn btn-sm bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl flex items-center gap-1 transition-all text-[11px] shadow-sm shadow-slate-900/10">
                                View Syllabus <i class="fa-solid fa-chevron-right text-[9px]"></i>
                            </button>
                        </div>
                    </div>
                </div>
                `;
            }).join('');
            
            // Fire AOS refresh to parse newly loaded DOM vectors
            if (typeof AOS !== 'undefined') {
                setTimeout(() => { AOS.refresh(); }, 100);
            }
        }
    } catch (e) {
        console.error('[fetchHomeCourses] Initialization error:', e);
        grid.innerHTML = `<div class="col-span-full text-center py-10 text-rose-500">Failed to load active catalog. Connect attempt timeout.</div>`;
    }
}

/* ============================================
   DYNAMIC HERO WORKSHOP BANNER & COUNTDOWN
   ============================================ */
async function loadHeroWorkshopBanner() {
    const container = document.getElementById('hero-workshop-banner');
    if (!container) return;

    try {
        const res = await fetch('/api/workshops');
        const json = await res.json();
        const list = json.success ? json.data : [];

        // Select single most upcoming/active workshop
        const active = list.length > 0 ? list[0] : null;

        if (!active) return; // Do not show ribbon if none scheduled

        const targetDate = new Date(active.workshop_date);
        const now = new Date();

        // If date is past more than 2 hours, suppress countdown ribbon
        if (targetDate.getTime() + (2 * 60 * 60 * 1000) < now.getTime()) return;

        // Escape single quotes for embedded callback safely
        const titleAttr = active.title.replace(/'/g, "\\'");

        container.innerHTML = `
            <div class="bg-slate-900 text-white rounded-3xl border border-slate-800 shadow-2xl overflow-hidden relative group">
                <!-- Glass Ambient Aura -->
                <div class="absolute -top-16 -right-16 w-40 h-40 bg-orange-500/20 blur-3xl rounded-full transition duration-700 group-hover:scale-125 pointer-events-none"></div>
                <div class="absolute -bottom-16 -left-16 w-40 h-40 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none"></div>
                
                <div class="flex flex-col lg:flex-row items-center justify-between gap-6 px-6 py-6 md:px-8 md:py-7 relative z-10">
                    <!-- Branding / Promo -->
                    <div class="flex items-center gap-4 text-center lg:text-left flex-1">
                        <div class="w-12 h-12 rounded-2xl bg-orange-600/10 border border-orange-500/30 text-orange-500 flex items-center justify-center text-xl shrink-0 animate-bounce-slow">
                            <i class="fa-solid fa-tower-broadcast"></i>
                        </div>
                        <div class="space-y-1">
                            <span class="inline-block px-2 py-0.5 bg-rose-500 border border-rose-400 text-white text-[9px] font-black uppercase tracking-widest rounded shadow-inner animate-pulse">Next Live Masterclass</span>
                            <h3 class="text-base md:text-lg font-extrabold text-slate-100 tracking-tight">${active.title}</h3>
                        </div>
                    </div>

                    <!-- Core Ticking Countdown Clock -->
                    <div id="hero-countdown-clock" class="flex gap-2 md:gap-3">
                        <div class="flex flex-col items-center bg-slate-950/60 border border-slate-800/50 rounded-xl px-3 py-2 min-w-[55px]">
                            <span id="clock-days" class="text-lg md:text-xl font-black text-orange-500">00</span>
                            <span class="text-[8px] font-bold text-slate-500 uppercase tracking-wider">Days</span>
                        </div>
                        <div class="flex flex-col items-center bg-slate-950/60 border border-slate-800/50 rounded-xl px-3 py-2 min-w-[55px]">
                            <span id="clock-hours" class="text-lg md:text-xl font-black text-white">00</span>
                            <span class="text-[8px] font-bold text-slate-500 uppercase tracking-wider">Hours</span>
                        </div>
                        <div class="flex flex-col items-center bg-slate-950/60 border border-slate-800/50 rounded-xl px-3 py-2 min-w-[55px]">
                            <span id="clock-mins" class="text-lg md:text-xl font-black text-white">00</span>
                            <span class="text-[8px] font-bold text-slate-500 uppercase tracking-wider">Mins</span>
                        </div>
                        <div class="flex flex-col items-center bg-slate-950/60 border border-slate-800/50 rounded-xl px-3 py-2 min-w-[55px]">
                            <span id="clock-secs" class="text-lg md:text-xl font-black text-slate-400">00</span>
                            <span class="text-[8px] font-bold text-slate-500 uppercase tracking-wider">Secs</span>
                        </div>
                    </div>

                    <!-- Direct Modal Dispatch -->
                    <div class="w-full lg:w-auto shrink-0">
                        <button onclick="openWorkshopModal(${active.id}, '${titleAttr}')" class="w-full lg:w-auto px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-black text-xs tracking-wider rounded-xl shadow-xl hover:shadow-orange-500/20 uppercase transition-all duration-300 flex items-center justify-center gap-2 group/btn">
                            Secure Free Seat <i class="fa-solid fa-arrow-right text-[10px] group-hover/btn:translate-x-1 transition"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;

        container.classList.remove('hidden');

        // Ticker Mechanism
        function runCountdown() {
            const diff = targetDate.getTime() - Date.now();

            const daysEl = document.getElementById('clock-days');
            const hoursEl = document.getElementById('clock-hours');
            const minsEl = document.getElementById('clock-mins');
            const secsEl = document.getElementById('clock-secs');

            if (!daysEl) return; // Terminate if element evicted

            if (diff <= 0) {
                daysEl.textContent = '00';
                hoursEl.textContent = '00';
                minsEl.textContent = '00';
                secsEl.textContent = '00';
                
                // Alter branding context to session live
                const badge = container.querySelector('.animate-pulse');
                if (badge) {
                    badge.className = "inline-block px-2 py-0.5 bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest rounded";
                    badge.textContent = "Session is LIVE";
                }
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const mins = Math.floor((diff / (1000 * 60)) % 60);
            const secs = Math.floor((diff / 1000) % 60);

            daysEl.textContent = String(days).padStart(2, '0');
            hoursEl.textContent = String(hours).padStart(2, '0');
            minsEl.textContent = String(mins).padStart(2, '0');
            secsEl.textContent = String(secs).padStart(2, '0');
        }

        runCountdown();
        setInterval(runCountdown, 1000);

    } catch (err) {
        console.warn('[loadHeroWorkshopBanner] Countdown ribbon bypass.', err);
    }
}

/* ============================================
   LIVE METRICS AGGREGATION COUNTER LOOPS
   ============================================ */
async function loadPublicStats() {
    const activeEl = document.getElementById('stat-active-courses');
    const studentsEl = document.getElementById('stat-total-students');
    const notesEl = document.getElementById('stat-free-handnotes');

    if (!activeEl) return;

    try {
        const res = await fetch('/api/public/platform-stats');
        const json = await res.json();
        
        if (json.success && json.data) {
            const { active_courses, total_students, free_handnotes } = json.data;

            // Helper to animate text counts sequentially
            function animateCounter(el, target, suffix = '+') {
                let start = 0;
                const duration = 1200;
                const steps = 40;
                const stepTime = duration / steps;
                const increment = target / steps;

                const timer = setInterval(() => {
                    start += increment;
                    if (start >= target) {
                        clearInterval(timer);
                        el.textContent = `${target}${suffix}`;
                    } else {
                        el.textContent = `${Math.floor(start)}${suffix}`;
                    }
                }, stepTime);
            }

            animateCounter(activeEl, active_courses);
            animateCounter(studentsEl, total_students);
            animateCounter(notesEl, free_handnotes);
        }
    } catch (err) {
        console.error('[loadPublicStats] Stat counts retrieval drift:', err);
    }
}

/* ============================================
   DYNAMIC 5-STAR PUBLIC TESTIMONIAL GRID
   ============================================ */
async function loadDynamicTestimonials() {
    const grid = document.getElementById('testimonials-grid');
    if (!grid) return;

    try {
        const res = await fetch('/api/public/testimonials');
        const json = await res.json();
        const reviews = (json.success && json.data) ? json.data : [];

        if (reviews.length === 0) {
            grid.innerHTML = `
                <div class="col-span-full text-center py-10 text-slate-400 font-medium">
                    <i class="fa-regular fa-comments text-xl opacity-30 mb-2 block"></i>
                    Awaiting stellar learning feed reviews.
                </div>`;
            return;
        }

        grid.innerHTML = reviews.map((r, idx) => {
            const initials = (r.author || 'ST').slice(0, 2).toUpperCase();
            const animDelay = (idx % 3) * 150; // offset delay staggered per row

            return `
                <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition duration-300 flex flex-col h-full" 
                     data-aos="fade-up" 
                     data-aos-delay="${animDelay}">
                    
                    <!-- Glowing Star Cluster -->
                    <div class="flex gap-1 text-yellow-400 text-[10px] mb-4">
                        <i class="fa-solid fa-star"></i>
                        <i class="fa-solid fa-star"></i>
                        <i class="fa-solid fa-star"></i>
                        <i class="fa-solid fa-star"></i>
                        <i class="fa-solid fa-star"></i>
                    </div>

                    <p class="text-slate-600 text-[13px] leading-relaxed flex-1 font-medium italic mb-4">
                        "${r.text}"
                    </p>

                    <!-- Author Context Vector -->
                    <div class="mt-auto flex items-center gap-3 pt-4 border-t border-slate-50">
                        <div class="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-red-500 text-white flex items-center justify-center font-black text-[10px] shrink-0 shadow-sm shadow-orange-500/10">
                            ${initials}
                        </div>
                        <div class="min-w-0">
                            <h5 class="text-xs font-extrabold text-slate-800 truncate">${r.author}</h5>
                            <p class="text-[9px] font-extrabold text-slate-400 truncate flex items-center gap-1 uppercase tracking-wider">
                                <i class="fa-solid fa-book-open text-orange-500 text-[8px]"></i> ${r.course}
                            </p>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Intercept layout recalculation in AOS
        if (typeof AOS !== 'undefined') {
            setTimeout(() => { AOS.refresh(); }, 200);
        }

    } catch (err) {
        console.error('[loadDynamicTestimonials] Render drift:', err);
        grid.innerHTML = `<div class="col-span-full text-center text-slate-400 text-xs font-bold uppercase">Failed to sync reviews index.</div>`;
    }
}
