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

window.openCourseModal = (courseId) => {
    const data = courseRoadmaps[courseId];
    if (!data) return;

    const modalOverlay = document.getElementById('course-modal-overlay');
    const content = document.getElementById('course-modal-content');

    // Generate Timeline HTML
    const stepsHTML = data.steps.map(step => `
        <div class="timeline-item">
            <h4 class="font-bold text-lg text-slate-800">${step.title}</h4>
            <p class="text-slate-500 text-sm">${step.desc}</p>
        </div>
    `).join('');

    content.innerHTML = `
        <div class="modal-header-bg">
            <button onclick="closeCourseModal()" class="absolute top-6 right-6 text-white/70 hover:text-white transition rounded-full hover:bg-white/10 w-8 h-8 flex items-center justify-center">
                <i class="fa-solid fa-xmark text-xl"></i>
            </button>
            <span class="badge badge-free bg-white/20 text-white border-none mb-3 inline-block backdrop-blur-sm">Course Roadmap</span>
            <h2 class="text-3xl font-bold mb-2">${data.title}</h2>
            <p class="text-slate-200 opacity-90">${data.desc}</p>
        </div>
        <div class="p-8 overflow-y-auto flex-1 dark-scroll">
            <div class="timeline-container">
                ${stepsHTML}
            </div>
        </div>
        <div class="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
            <button onclick="closeCourseModal()" class="btn btn-outline">Close</button>
            <button onclick="closeCourseModal();UI.openModal('register')" class="btn btn-primary shadow-lg">Enroll Now</button>
        </div>
    `;

    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
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
window.renderWorkshops = async () => {
    // 0. Fetch Data
    await WorkshopManager.fetchData();

    const featuredContainer = document.getElementById('featured-workshop-container');
    const archiveContainer = document.getElementById('archived-workshops-container');
    const archiveSection = document.getElementById('archive-section');

    if (!featuredContainer) return; // Only on index page

    // 1. Featured (Live or Upcoming)
    const featured = WorkshopManager.getFeaturedWorkshop();

    if (featured) {
        const date = new Date(featured.startTime);
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const isLive = featured.displayStatus === 'live';

        featuredContainer.innerHTML = `
            <div class="flex flex-col lg:flex-row items-center gap-12 animate-fade-in-up">
                <div class="lg:w-1/2 space-y-6">
                    <span class="inline-block px-3 py-1 rounded-full ${isLive ? 'bg-red-500/20 text-red-500 border-red-500/30' : 'bg-orange-500/20 text-orange-400 border-orange-500/30'} text-xs font-bold tracking-wider uppercase border animate-pulse">
                        <i class="fa-solid fa-circle text-[8px] mr-2"></i> ${isLive ? 'LIVE NOW' : 'Upcoming Live Event'}
                    </span>
                    <h2 class="text-4xl md:text-5xl font-black tracking-tight leading-tight">
                        ${featured.title}
                    </h2>
                    <p class="text-slate-400 text-lg leading-relaxed">
                        ${featured.desc}
                    </p>
                    <div class="flex flex-col sm:flex-row gap-4 pt-4">
                        <button onclick="registerForWorkshop('${featured.id}')" class="btn btn-primary btn-lg shadow-xl hover:shadow-orange-500/20 group">
                            ${isLive ? 'Join Live Now' : 'Register Now'} <i class="fa-solid fa-arrow-right ml-2 group-hover:translate-x-1 transition"></i>
                        </button>
                    </div>
                    <div class="flex items-center gap-6 text-sm text-slate-500 pt-4 border-t border-slate-800">
                        <div class="flex items-center gap-2">
                             <i class="fa-regular fa-calendar text-orange-500"></i> ${dateStr}
                        </div>
                        <div class="flex items-center gap-2">
                             <i class="fa-regular fa-clock text-orange-500"></i> ${timeStr}
                        </div>
                    </div>
                </div>
                <div class="lg:w-1/2 relative">
                    <div class="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-700 group aspect-video">
                        <img src="${featured.thumbnail}" alt="Workshop" class="w-full h-full object-cover transform group-hover:scale-105 transition duration-700">
                        <div class="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition duration-500 flex items-center justify-center">
                            <button onclick="registerForWorkshop('${featured.id}')" class="w-16 h-16 rounded-full bg-orange-600 text-white flex items-center justify-center shadow-lg hover:scale-110 transition animate-bounce">
                                <i class="fa-solid fa-play text-xl ml-1"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } else {
        featuredContainer.innerHTML = `
            <div class="text-center py-12">
                <div class="inline-flex w-16 h-16 rounded-full bg-slate-800 items-center justify-center text-slate-600 text-2xl mb-4"><i class="fa-solid fa-calendar-xmark"></i></div>
                <h3 class="text-xl font-bold text-slate-300">No Upcoming Workshops</h3>
                <p class="text-slate-500 mt-2">Check back later for new schedules.</p>
            </div>
        `;
    }

    // 2. Archived
    const archived = WorkshopManager.getArchivedWorkshops();
    if (archived.length > 0 && archiveContainer) {
        archiveSection.classList.remove('hidden');
        archiveContainer.innerHTML = archived.map(w => `
            <div class="group relative bg-slate-800 rounded-xl overflow-hidden border border-slate-700 hover:border-orange-500/50 transition cursor-pointer" onclick="window.location.href='workshop.html?id=${w.id}'">
                <div class="aspect-video relative overflow-hidden">
                    <img src="${w.thumbnail}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500">
                    <div class="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                        <i class="fa-solid fa-play-circle text-4xl text-white"></i>
                    </div>
                    <div class="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] px-2 py-0.5 rounded font-bold">Recorded</div>
                </div>
                <div class="p-4">
                    <h4 class="font-bold text-white mb-1 group-hover:text-orange-400 transition">${w.title}</h4>
                    <p class="text-xs text-slate-400 line-clamp-2">${w.desc}</p>
                </div>
            </div>
        `).join('');
    }
};

// Register for Workshop
window.registerForWorkshop = async (workshopId) => {
    // 1. Check Auth (If not logged in, open login modal)
    if (!Auth.isLoggedIn()) {
        UI.openModal('login');
        return;
    }

    // 2. Prepare Request
    const WORKSHOP_WEBHOOK = 'https://arup-vivobook-asuslaptop-x509dj-d509dj.taila8249c.ts.net/webhook/join-workshop'; // USER PLACEHOLDER
    const user = Auth.getUser();
    const btn = event.currentTarget || document.activeElement;
    const originalContent = btn.innerHTML;

    // 3. Set Loading State
    if (btn) {
        btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Processing...';
        btn.disabled = true;
    }

    try {
        // 4. Send Webhook Request
        await fetch(WORKSHOP_WEBHOOK, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: user.email,
                workshop_id: workshopId || "WORKSHOP_01"
            })
        });

        // 5. Success -> Redirect
        window.location.href = `workshop.html?id=${workshopId}`;

    } catch (error) {
        console.error('Workshop Error:', error);
        UI.showToast('Connection failed. Please try again.', 'error');
        if (btn) {
            btn.innerHTML = originalContent;
            btn.disabled = false;
        }
    }
};

/* ============================================
   USER ANALYTICS CHART
   ============================================ */
const renderUserChart = async () => {
    const ctx = document.getElementById('userAnalyticsChart');
    if (!ctx) return;

    try {
        const response = await fetch('https://arup-vivobook-asuslaptop-x509dj-d509dj.taila8249c.ts.net/webhook-test/get-live-stats');
        const data = await response.json();

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

// Init Logic
document.addEventListener('DOMContentLoaded', () => {
    renderWorkshops();
    renderUserChart();

    // Check Redirect from Workshop Page
    const params = new URLSearchParams(window.location.search);
    if (params.get('redirect') === 'workshop') {
        UI.openModal('login');
    }
});
