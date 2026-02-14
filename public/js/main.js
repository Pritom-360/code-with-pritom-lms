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
