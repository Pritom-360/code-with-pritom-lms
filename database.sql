-- ========================================================
-- Code With Pritom LMS — Database Schema & Seed Scripts
-- ========================================================

CREATE DATABASE IF NOT EXISTS cwp_lms;
USE cwp_lms;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,
    `access` VARCHAR(255) NOT NULL DEFAULT '1',
    `role` VARCHAR(50) NOT NULL DEFAULT 'student',
    `status` VARCHAR(50) NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Courses Table
CREATE TABLE IF NOT EXISTS `courses` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `course_code` VARCHAR(50) NOT NULL UNIQUE,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT,
    `thumbnail_url` VARCHAR(255),
    `icon` VARCHAR(50) DEFAULT 'fa-graduation-cap',
    `color` VARCHAR(50) DEFAULT 'bg-blue-100 text-blue-600',
    `price` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `total_lessons` INT DEFAULT 0,
    `duration` VARCHAR(50),
    `handnote_url` VARCHAR(255),
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Lessons Table
CREATE TABLE IF NOT EXISTS `lessons` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `course_code` VARCHAR(50) NOT NULL,
    `lesson_number` INT NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `video_url` VARCHAR(255) NOT NULL,
    `duration` VARCHAR(50),
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `uq_course_lesson` (`course_code`, `lesson_number`),
    FOREIGN KEY (`course_code`) REFERENCES `courses`(`course_code`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Hand Notes Table
CREATE TABLE IF NOT EXISTS `hand_notes` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `course_code` VARCHAR(50),
    `title` VARCHAR(255) NOT NULL,
    `filename` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`course_code`) REFERENCES `courses`(`course_code`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Workshop Registrations Table
CREATE TABLE IF NOT EXISTS `workshop_registrations` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `email` VARCHAR(255) NOT NULL,
    `workshop_id` VARCHAR(50) NOT NULL,
    `status` VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `uq_email_workshop` (`email`, `workshop_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. User Progress Table
CREATE TABLE IF NOT EXISTS `user_progress` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_email` VARCHAR(255) NOT NULL,
    `course_code` VARCHAR(50) NOT NULL,
    `lesson_number` INT NOT NULL,
    `completed_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `uq_user_course_lesson` (`user_email`, `course_code`, `lesson_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Coupons Table
CREATE TABLE IF NOT EXISTS `coupons` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `coupon_name` VARCHAR(50) NOT NULL UNIQUE,
    `course_code` VARCHAR(50),
    `discount_percent` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Pending Orders Table
CREATE TABLE IF NOT EXISTS `pending_orders` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_name` VARCHAR(255) NOT NULL,
    `user_email` VARCHAR(255) NOT NULL,
    `user_phone` VARCHAR(50) NOT NULL,
    `course_code` VARCHAR(50) NOT NULL,
    `transaction_id` VARCHAR(255) NOT NULL UNIQUE,
    `promo_code` VARCHAR(50),
    `payment_method` VARCHAR(50) DEFAULT 'bKash',
    `total_paid` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`course_code`) REFERENCES `courses`(`course_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================================
--                 SEED DATA INSERTION
-- ========================================================

-- Insert Demo Users
INSERT IGNORE INTO `users` (`name`, `email`, `password`, `access`) VALUES
('Admin User', 'admin@codewithpritom.com', 'admin123', '1,2,3,4,5,6,7,8,9,NEW_19'),
('Demo Student', 'student@example.com', 'password123', '1');

-- Insert Initial Coupons
INSERT IGNORE INTO `coupons` (`coupon_name`, `discount_percent`) VALUES
('EWUPCC2026', 100.00),
('DISCOUNT10', 10.00);


-- Insert Courses
INSERT IGNORE INTO `courses` (`course_code`, `title`, `description`, `thumbnail_url`, `icon`, `color`, `price`, `total_lessons`, `duration`) VALUES
('1', 'n8n Fundamentals', 'Comprehensive masterclass on n8n Fundamentals', 'images/brand.png', 'fa-bolt', 'bg-blue-100 text-blue-600', 0, 8, 'Self-paced'),
('2', 'Advanced Webhooks & APIs', 'Comprehensive masterclass on Advanced Webhooks & APIs', 'images/brand.png', 'fa-code-branch', 'bg-purple-100 text-purple-600', 39, 6, 'Self-paced'),
('3', 'SaaS Automation Masterclass', 'Comprehensive masterclass on SaaS Automation Masterclass', 'images/brand.png', 'fa-rocket', 'bg-orange-100 text-orange-600', 59, 6, 'Self-paced'),
('4', 'Linux Fundamentals', 'Comprehensive masterclass on Linux Fundamentals', 'images/brand.png', 'fa-linux', 'bg-slate-800 text-white', 49, 3, 'Self-paced'),
('5', 'C Programming Language', 'Comprehensive masterclass on C Programming Language', 'images/brand.png', 'fa-code', 'bg-blue-600 text-white', 59, 3, 'Self-paced'),
('6', 'Discrete Mathematics', 'Comprehensive masterclass on Discrete Mathematics', 'images/brand.png', 'fa-calculator', 'bg-purple-600 text-white', 49, 3, 'Self-paced'),
('7', 'Java Programming', 'Comprehensive masterclass on Java Programming', 'images/brand.png', 'fa-java', 'bg-red-600 text-white', 69, 3, 'Self-paced'),
('8', 'Java OOP Mastery', 'Comprehensive masterclass on Java OOP Mastery', 'images/brand.png', 'fa-cubes', 'bg-orange-600 text-white', 59, 3, 'Self-paced'),
('9', 'Scripting & Automation', 'Comprehensive masterclass on Scripting & Automation', 'images/brand.png', 'fa-scroll', 'bg-teal-600 text-white', 49, 3, 'Self-paced'),
('NEW_19', 'Generated YouTube Course', 'Comprehensive masterclass on Generated YouTube Course', 'images/brand.png', 'fa-robot', 'bg-cyan-600 text-white', 49, 21, 'Self-paced');

-- Insert Hand Notes
INSERT IGNORE INTO `hand_notes` (`course_code`, `title`, `filename`) VALUES
('1', 'n8n Fundamentals Study Notes', 'n8n-fundamentals.pdf'),
('2', 'Advanced Webhooks & APIs Study Notes', 'api-guide.pdf'),
('3', 'SaaS Automation Masterclass Study Notes', 'saas-notes.pdf'),
('4', 'Linux Fundamentals Study Notes', 'linux-fundamentals.pdf'),
('5', 'C Programming Language Study Notes', 'c-programming.pdf'),
('6', 'Discrete Mathematics Study Notes', 'discrete-math.pdf'),
('7', 'Java Programming Study Notes', 'java-basics.pdf'),
('8', 'Java OOP Mastery Study Notes', 'java-oop.pdf'),
('9', 'Scripting & Automation Study Notes', 'scripting-automation.pdf');

-- Insert Lessons
INSERT IGNORE INTO `lessons` (`course_code`, `lesson_number`, `title`, `video_url`, `duration`) VALUES
('1', 1, 'Welcome & Setup', 'dQw4w9WgXcQ', '8:24'),
('1', 2, 'Understanding Nodes', 'dQw4w9WgXcQ', '12:10'),
('1', 3, 'Triggers & Webhooks', 'dQw4w9WgXcQ', '15:32'),
('1', 4, 'JSON & Data Flow', 'dQw4w9WgXcQ', '18:05'),
('1', 5, 'Conditional Logic (IF/Switch)', 'dQw4w9WgXcQ', '14:48'),
('1', 6, 'Loops & Iterations', 'dQw4w9WgXcQ', '11:22'),
('1', 7, 'Error Handling', 'dQw4w9WgXcQ', '9:55'),
('1', 8, 'Your First Workflow Project', 'dQw4w9WgXcQ', '20:30'),
('2', 1, 'HTTP Request Basics', 'M7lc1UVf-VE', '10:15'),
('2', 2, 'REST vs GraphQL', 'M7lc1UVf-VE', '14:30'),
('2', 3, 'Authentication Methods', 'M7lc1UVf-VE', '18:45'),
('2', 4, 'Webhook Security', 'M7lc1UVf-VE', '12:20'),
('2', 5, 'Building a Payment Gateway', 'M7lc1UVf-VE', '22:10'),
('2', 6, 'API Rate Limiting', 'M7lc1UVf-VE', '11:55'),
('3', 1, 'SaaS Architecture Overview', 'jNQXAC9IVRw', '15:00'),
('3', 2, 'User Registration Flow', 'jNQXAC9IVRw', '20:30'),
('3', 3, 'Payment Processing', 'jNQXAC9IVRw', '25:15'),
('3', 4, 'Email Automation', 'jNQXAC9IVRw', '18:40'),
('3', 5, 'Dashboard & Analytics', 'jNQXAC9IVRw', '22:10'),
('3', 6, 'Deployment & Launch', 'jNQXAC9IVRw', '16:50'),
('4', 1, 'Linux History & Distros', 'dQw4w9WgXcQ', '10:00'),
('4', 2, 'File Operations (ls, cp, mv)', 'dQw4w9WgXcQ', '15:00'),
('4', 3, 'Permissions (chmod, chown)', 'dQw4w9WgXcQ', '20:00'),
('5', 1, 'Hello World in C', 'dQw4w9WgXcQ', '5:00'),
('5', 2, 'Variables & Data Types', 'dQw4w9WgXcQ', '12:00'),
('5', 3, 'Pointers Explained', 'dQw4w9WgXcQ', '25:00'),
('6', 1, 'Propositional Logic', 'dQw4w9WgXcQ', '18:00'),
('6', 2, 'Set Theory', 'dQw4w9WgXcQ', '22:00'),
('6', 3, 'Graph Theory Intro', 'dQw4w9WgXcQ', '30:00'),
('7', 1, 'Setting up JDK', 'dQw4w9WgXcQ', '8:00'),
('7', 2, 'Java Syntax Basics', 'dQw4w9WgXcQ', '15:00'),
('7', 3, 'Classes & Objects', 'dQw4w9WgXcQ', '20:00'),
('8', 1, 'Inheritance', 'dQw4w9WgXcQ', '18:00'),
('8', 2, 'Polymorphism', 'dQw4w9WgXcQ', '16:00'),
('8', 3, 'Encapsulation', 'dQw4w9WgXcQ', '14:00'),
('9', 1, 'Python Basics', 'dQw4w9WgXcQ', '10:00'),
('9', 2, 'Shell Scripting Intro', 'dQw4w9WgXcQ', '12:00'),
('9', 3, 'Automating Tasks', 'dQw4w9WgXcQ', '25:00'),
('NEW_19', 1, 'Day 1 of Learning AI Agents in Hindi AI AGENTS Are Changing The Game !', 'dhhVxJ_qUPc', '10:00'),
('NEW_19', 2, 'Day 2 Ai Agents Masterclass - What tools to use ?', 'R2HsJuNr-ac', '10:00'),
('NEW_19', 3, 'Day 3 Ai Agents Masterclass - What if you Mastered Ai Agents in 2025 (Hindi)', 'iQSZIOoe8P4', '10:00'),
('NEW_19', 4, 'Day 4 AI Agents Masterclass - 5 Types of nodes in N8n You need to KNOW', 'a1eY8x8P09Y', '10:00'),
('NEW_19', 5, 'Day 5 - Building AI Agents Masterclass - Get Ready to build expert AI Agents - Hindi N8n Tutorial', 'EHbAA8aERYc', '10:00'),
('NEW_19', 6, 'Day 6 - AI Agents Masterclass - Going more in-depth with nodes in Hindi', '9nckPa2EvRw', '10:00'),
('NEW_19', 7, 'Day 7 - Building A Agents Masterclass - WATCH THIS Even before you start building your first agent!', 'fILw8-MYrvA', '10:00'),
('NEW_19', 8, 'Day 8 - AI Agents Masterclass - Lets Build a bit Complex Agent in Hindi', 'ec5SwU5qj_k', '10:00'),
('NEW_19', 9, 'Day 8 Update Video on Day 8''s Complex Workflow', 'cyqleaWKWkA', '10:00'),
('NEW_19', 10, 'Day 9 Ai Agents Masterclass - n8n and Lovable - Power of webhooks', 'umpPee57unw', '10:00'),
('NEW_19', 11, 'Day 10 Ai Agents Masterclass - n8n Email Reply Agent', 'kg6YGlLF0Nk', '10:00'),
('NEW_19', 12, 'Day 11 Ai Agents Masterclass - MOST IMPORTANT VIDEO', 'JOmWSuKP-Tg', '10:00'),
('NEW_19', 13, 'Day 12 Part 1 AI Agents Masterclass - CREATING WORKFLOW WITHOUT JSON', 'VhxYxKOPMr4', '10:00'),
('NEW_19', 14, 'Day 12 Part 2 AI Agents Masterclass - SUPERPOWER FOR YOUR AI AGENTS', 'p1eW2_XZleo', '10:00'),
('NEW_19', 15, 'Day 12 Part 3 AI Agents Masterclass - Spent 30 Days using JSON''s and it chnaged my life', 'D6rtkyArbYA', '10:00'),
('NEW_19', 16, 'Day 13 AI Agents Masterclass - Data Processing in N8n in Hindi', 'aNHHr1IjsEk', '10:00'),
('NEW_19', 17, 'Day 14 AI Agents Masterclass - What is RAG and why it Matters', 'ERg2my7c8SA', '10:00'),
('NEW_19', 18, 'Day 15 Part 1 AI Agents Masterclass - What is RAG, Embedding and Vectors', 'Rohm5agdQn8', '10:00'),
('NEW_19', 19, 'Day 15 - Build your First RAG Agent in Hindi', 'NTwM3V-mdzc', '10:00'),
('NEW_19', 20, 'How MCP Makes your AI Agents Super Smart — Explained in Detail — In Hindi', 'P7hcFHVu-xs', '10:00'),
('NEW_19', 21, 'DAY 16 - Building Your First Voice AI Agent - Simplest Way HINDI', 'MOj0mtInC84', '10:00');

-- ========================================================
-- 9. Course Reviews Table
-- ========================================================
CREATE TABLE IF NOT EXISTS `course_reviews` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_email` VARCHAR(255) NOT NULL,
    `course_code` VARCHAR(50) NOT NULL,
    `rating` INT NOT NULL,
    `review_text` TEXT,
    `improvement_text` TEXT,
    `is_featured` BOOLEAN NOT NULL DEFAULT FALSE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `uq_user_course_review` (`user_email`, `course_code`),
    FOREIGN KEY (`course_code`) REFERENCES `courses`(`course_code`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
