/* ============================================
   server.js — Code With Pritom LMS Backend
   ============================================ */
const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios'); // Enable server-to-server HTTP streaming
require('dotenv').config();
const crypto = require('crypto'); // Secure Cryptographic Utilities

// Import Database Pool Configuration
const db = require('./db');
const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');

// Instantiate highly-privileged Admin Client utilizing service_role key to bypass RLS restrictions
const supabaseAdmin = createClient(
    process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY // Standard fallback
);
const multer = require('multer');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// Configure Dynamic In-Memory Storage for Cloud Offloading
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Dynamic upload wrapper executing in-memory parsing + cloud Supabase Storage synchronization
const dynamicUpload = (req, res, next) => {
    const processSingleFile = upload.single('file');
    
    processSingleFile(req, res, async function (err) {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ success: false, message: 'Multer processing boundary violation.', error: err.message });
        } else if (err) {
            return res.status(500).json({ success: false, message: 'Binary processing system error.', error: err.message });
        }
        
        // Proceed seamlessly if no file attachment was provided (common in partial PUT edits)
        if (!req.file) {
            return next();
        }
        
        try {
            // 1. Extract processing category parameter
            const category = req.params.category || req.headers['x-upload-type'] || req.body.type || 'courses';
            
            // 2. Map logical category into designated Supabase Buckets
            let bucketName = 'course-images'; // Root fallback
            if (category === 'workshops') {
                bucketName = 'workshop-images';
            } else if (category === 'handnotes') {
                bucketName = 'handnotes';
            } else if (category === 'announcements') {
                bucketName = 'announcements'; // Designated bucket for announcement banners
            }
            
            // 3. Generate Non-Colliding Unique Identity Renaming Sequence
            const ext = path.extname(req.file.originalname);
            const sanitizedBase = path.basename(req.file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
            const uniqueFilename = `${Date.now()}_${sanitizedBase}${ext}`;
            
            // 4. Offload binary stream directly into Cloud Storage Bucket
            const { data: uploadData, error: uploadErr } = await supabaseAdmin.storage
                .from(bucketName)
                .upload(uniqueFilename, req.file.buffer, {
                    contentType: req.file.mimetype,
                    cacheControl: '3600',
                    upsert: false
                });
                
            if (uploadErr) throw uploadErr;
            
            // 5. Capture fully resolved public URI reference for DB commits
            const { data: publicUrlData } = supabaseAdmin.storage
                .from(bucketName)
                .getPublicUrl(uniqueFilename);
                
            if (!publicUrlData || !publicUrlData.publicUrl) {
                throw new Error('Could not extract public asset URI from destination bucket endpoints.');
            }
            
            // 6. Augment request context for downstream API routers
            req.file.publicUrl = publicUrlData.publicUrl;
            req.file.filename = uniqueFilename;
            req.file.bucket = bucketName;
            
            next();
        } catch (cloudErr) {
            console.error('[dynamicUpload] Supabase Storage cloud transfer aborted:', cloudErr.message);
            return res.status(500).json({ 
                success: false, 
                message: 'Failed to synchronize binary assets to Supabase Cloud Storage.', 
                error: cloudErr.message 
            });
        }
    });
};

// Configure Nodemailer SMTP Transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 465,
    secure: process.env.SMTP_SECURE === 'true' || true, // Default secure true for 465
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// Verify Transporter Configuration (Silent startup check)
transporter.verify((error, success) => {
    if (error) {
        console.warn('⚠️ [Nodemailer] SMTP credentials incomplete. Emails might not deliver.');
    } else {
        console.log('🟢 [Nodemailer] SMTP configured and ready to deliver mail!');
    }
});

// ========================================================
//          🛡️ AUTHENTICATION UTILITIES & OTP MODULE
// ========================================================

/**
 * Generates a cryptographically secure 6-digit numeric OTP string.
 */
const generateSecureOTP = () => {
    // Generates random number securely in physical scope [100000, 999999]
    return crypto.randomInt(100000, 1000000).toString();
};

/**
 * Dispatches highly professional branded verification emails via nodemailer.
 * @param {string} email - Destination inbox
 * @param {string} otp - The generated 6-digit numeric code
 * @param {string} type - Mode context ('register' | 'reset')
 */
const sendOtpEmail = async (email, otp, type = 'register') => {
    try {
        const adminEmail = 'arupbhowmikpritom@gmail.com';
        const systemEmail = process.env.SMTP_USER || process.env.FROM_EMAIL || adminEmail;
        
        const actionString = type === 'reset' ? 'Password Reset' : 'Account Verification';
        const actionInstruction = type === 'reset' 
            ? 'We received a request to reset your account password. Enter the secure verification code below to proceed.'
            : 'Welcome to the academy! Use the secure verification code below to finalize your account registration.';

        const mailOptions = {
            from: `"Code With Pritom Security" <${systemEmail}>`,
            to: email.trim(),
            replyTo: adminEmail,
            subject: 'Your Code With Pritom Verification Code',
            html: `
                <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 500px; margin: 20px auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background-color: #ffffff; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);">
                    <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 30px 20px; text-align: center;">
                        <h2 style="color: #ffffff; margin: 0; font-size: 18px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase;">🔒 Code With Pritom Security</h2>
                    </div>
                    <div style="padding: 35px 25px; line-height: 1.6; color: #334155; text-align: center;">
                        <h3 style="margin-top: 0; color: #0f172a; font-size: 20px; font-weight: 800; margin-bottom: 8px;">${actionString}</h3>
                        <p style="color: #64748b; font-size: 14px; margin-bottom: 25px; line-height: 1.5;">${actionInstruction}</p>
                        
                        <div style="display: inline-block; letter-spacing: 6px; background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 14px 20px 14px 26px; font-family: 'Courier New', Courier, monospace; font-size: 28px; font-weight: 900; color: #ea580c; margin-bottom: 20px; text-align: center; box-shadow: inset 0 1px 2px rgba(0,0,0,0.05);">
                            ${otp}
                        </div>
                        
                        <p style="font-size: 12px; color: #94a3b8; margin-top: 0; margin-bottom: 25px;">Valid for <strong>10 minutes</strong>. For maximum safety, do not share this code.</p>
                        
                        <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 25px 0;" />
                        
                        <p style="font-size: 12px; color: #64748b; text-align: left;">If you did not request this verification sequence, please ignore this message. Your existing credentials remain completely safe.</p>
                    </div>
                    <div style="background-color: #f8fafc; border-top: 1px solid #f1f5f9; padding: 16px 25px; text-align: center; font-size: 11px; color: #94a3b8;">
                        © ${new Date().getFullYear()} Code With Pritom Academy.<br/>
                        Automated security alert. Do not reply to this address.
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('❌ [OTP Nodemailer failure]:', error.message);
        return false;
    }
};

const app = express();
const PORT = process.env.PORT || 3000;

// ---- Middleware ----
app.use(cors()); // Allow all origins (per request)
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Support URL-encoded parser

// ---- Health / Baseline Test Route ----
app.get('/', (req, res) => {
    res.json({ status: 'Server Running', timestamp: new Date().toISOString() });
});

// ========================================================
//             AUTHORIZATION & ROLES MIDDLEWARE
// ========================================================

// Middleware: Restrict Access to Admins only
const isAdmin = async (req, res, next) => {
    // Robust multi-vector email extraction (header, body, or query) to bypass Vercel environment transformations!
    const email = (
        req.headers['x-user-email'] || 
        req.headers['x-email'] || 
        req.body?.user_email || 
        req.body?.email || 
        req.query?.user_email || 
        req.query?.email || 
        ''
    ).toString().trim();
    
    if (email) {
        try {
            const { data: users, error } = await db.from('users')
                .select('role')
                .eq('email', email);
                
            if (error) throw error;

            if (users && users.length > 0 && users[0].role && users[0].role.toLowerCase() === 'admin') {
                return next();
            }
        } catch (error) {
            console.error('[isAdmin] Real-time perimeter assessment crash:', error.message);
        }
    }

    // Force fallback to empty array 200 OK to prevent client-side SyntaxError crashes in static dashboards
    res.status(200).json([]);
};

// Middleware: Restrict Access to Logged-In Users (Standard Clearance)
const isLoggedIn = async (req, res, next) => {
    // Robust multi-vector email extraction to guarantee secure validation loops
    const email = (
        req.headers['x-user-email'] || 
        req.headers['x-email'] || 
        req.body?.user_email || 
        req.body?.email || 
        req.query?.user_email || 
        req.query?.email || 
        ''
    ).toString().trim();

    if (!email) {
        return res.status(401).json({ success: false, message: 'Access Denied: Identity verification failed (missing token).' });
    }
    try {
        const { data: users, error } = await db.from('users').select('id, status').eq('email', email);
        if (error) throw error;

        if (users && users.length > 0) {
            if (users[0].status === 'suspended') {
                return res.status(403).json({ success: false, message: 'Your student account is suspended.' });
            }
            return next();
        }
    } catch (e) {
        console.error('[isLoggedIn] Session validation drift:', e.message);
    }
    
    return res.status(401).json({ success: false, message: 'Access Denied: Valid session not found.' });
};

// ---- Basic Connection Verification Endpoint ----
app.get('/api/db-test', async (req, res) => {
    try {
        // Performs absolute base health read from users table to verify connectivity
        const { data, error } = await db.from('users').select('id').limit(1);
        if (error) throw error;

        res.json({ success: true, message: 'Successfully connected to Supabase PostgreSQL Engine!', data: { connection: 'established', count: data.length } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Supabase client link failed.', error: error.message });
    }
});

// Visual Check Route requested by the user to explicitly verify database origin
app.get('/api/check-db', async (req, res) => {
  try {
    const supabase = db; // Standardize variable name mapping for developer requested snippet
    const { data, error } = await supabase.from('users').select('id').limit(1);
    if (error) throw error;
    res.json({ source: 'Supabase Cloud', status: 'Connected', data });
  } catch (err) {
    res.json({ source: 'Local MySQL/Error', error: err.message });
  }
});

// Explicit User Connection Check Endpoint
app.get('/api/test-db', async (req, res) => {
  const supabase = db; // Standardize mapping variable context
  const { data, error } = await supabase.from('users').select('count');
  if (error) return res.status(500).json({ status: 'Error', message: error.message });
  res.json({ status: 'Connected to Supabase', data });
});

// ========================================================
//                 DATA FETCHING ROUTES
// ========================================================

// 1. Get All Courses
app.get('/api/get-all-courses', async (req, res) => {
    try {
        const supabase = db; 
        const { data: courses, error } = await supabase.from('courses').select('*');
        if (error) throw error;
        
        // Concurrency-efficient Lesson Dynamic Counter
        const { data: lessonsList, error: lErr } = await supabase.from('lessons').select('course_code');
        if (!lErr && lessonsList) {
            // Compile live frequencies instantly
            const lessonCountMap = {};
            lessonsList.forEach(l => {
                const key = String(l.course_code || '').trim();
                lessonCountMap[key] = (lessonCountMap[key] || 0) + 1;
            });

            // Inject real-time counting mapping
            (courses || []).forEach(c => {
                const codeKey = String(c.course_code || '').trim();
                c.total_lessons = lessonCountMap[codeKey] || 0; // Real-time physical payload
            });
        }
        
        res.json(courses || []);
    } catch (error) {
        console.log('Supabase Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 2. Get Specific Course Curriculum (Strictly Public Syllabus Queries Only)
app.post('/api/get-course-data', async (req, res) => {
    try {
        const courseId = req.body.course_id || req.query.course_id || req.body.course_code || req.query.course_code;

        if (!courseId) {
            return res.status(400).json({ success: false, message: 'Missing parameter: course_id / course_code is required.' });
        }

        // Strictly fetch public identifiers to prevent content scraping/piracy.
        // Sensitive resource locators like video_url are physically omitted from DB select.
        const { data: lessons, error } = await db.from('lessons')
            .select('lesson_number, title, duration')
            .eq('course_code', courseId.trim())
            .order('lesson_number', { ascending: true });
            
        if (error) throw error;

        res.json({ success: true, course_code: courseId.trim(), count: lessons.length, data: lessons });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch course curriculum.', error: error.message });
    }
});

// 3. Get Hand Notes Listing
app.get('/api/get-hand-notes', async (req, res) => {
    try {
        const { data: notes, error } = await db.from('hand_notes').select('*').order('id', { ascending: false });
        if (error) throw error;

        // High-reliability serialization mapping file_url to backward-compatible filename keys
        const serialized = (notes || []).map(n => ({
            ...n,
            filename: n.file_url || n.filename // Transparent field recovery
        }));

        res.json({ success: true, count: serialized.length, data: serialized });
    } catch (error) {
        console.log('Supabase Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch hand notes.', error: error.message });
    }
});

// 4. Get Dynamic Live Stats (Course counts per user)
app.get('/api/get-live-stats', async (req, res) => {
    try {
        const { data: users, error } = await db.from('users')
            .select('name, access')
            .not('access', 'is', null)
            .neq('access', '');
            
        if (error) throw error;

        // Ingest Access strings and parse count metrics in Node space for high-performance calculations
        const stats = users.map(u => ({
            name: u.name,
            total_courses: (u.access || '').split(',').map(s => s.trim()).filter(Boolean).length
        }));

        res.json({ success: true, data: stats });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to calculate live stats.', error: error.message });
    }
});

// 5. Get Workshop Visualization Analytics (Graph Data)
app.get('/api/get-graph-data', async (req, res) => {
    try {
        const supabase = db;
        // Fetch directly from the user-defined database view for high-speed statistics compilation
        const { data, error } = await supabase.from('workshop_stats').select('*');
        
        if (error) throw error;
        
        res.json(data || []);
    } catch (error) {
        console.error('[Failed to compile graph data]:', error.message);
        res.json([]);
    }
});

// 6. Get Platform Summary Statistics for Public Metrics counter
app.get('/api/public/platform-stats', async (req, res) => {
    try {
        // Fetch counts in parallel via relational pools for high speed renders
        const [usersRes, coursesRes, notesRes] = await Promise.all([
            db.from('users').select('id', { count: 'exact', head: true }),
            db.from('courses').select('id', { count: 'exact', head: true }).eq('status', 'active'),
            db.from('hand_notes').select('id', { count: 'exact', head: true })
        ]);

        res.json({
            success: true,
            data: {
                total_students: usersRes.count || 0,
                active_courses: coursesRes.count || 0,
                free_handnotes: notesRes.count || 0
            }
        });
    } catch (error) {
        console.error('[platform-stats] Counts retrieval drift:', error.message);
        // Hardened data integrity: no false mock defaults
        res.json({ success: true, data: { total_students: 0, active_courses: 0, free_handnotes: 0 } });
    }
});

// 6.5. Submit Contact Support Ticket (From Student Dashboard)
app.post('/api/support/submit', async (req, res) => {
    try {
        const { name, email, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({ success: false, message: 'Name, email, and message are required.' });
        }

        // a. Ingest support payload into Supabase data table for record archival
        const { data: insertRes, error: dbErr } = await db.from('support_queries').insert([
            {
                user_name: name.trim(),
                user_email: email.trim(),
                message: message.trim(),
                status: 'pending'
            }
        ]);

        if (dbErr) throw dbErr;

        // b. Build and fire professional administrative report directly to admin Inbox
        const adminEmail = 'arupbhowmikpritom@gmail.com';
        const systemEmail = process.env.SMTP_USER || process.env.FROM_EMAIL || adminEmail;

        const supportMailOptions = {
            from: `"LMS Support Core" <${systemEmail}>`,
            to: adminEmail,
            replyTo: email.trim(),
            subject: `New Support Query: [${name}]`,
            html: `
                <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #334155; max-width: 650px; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);">
                    <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 24px 30px; text-align: left;">
                        <h2 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.025em;">🚀 Code With Pritom LMS</h2>
                        <p style="color: #ea580c; margin: 4px 0 0 0; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">System Admin Alert</p>
                    </div>
                    <div style="padding: 30px; background-color: #ffffff;">
                        <h3 style="color: #1e293b; font-size: 16px; margin-top: 0; margin-bottom: 16px; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px;">Support Inquiry Logged</h3>
                        
                        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                            <tr>
                                <td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 600; width: 120px; vertical-align: top;">Student Name:</td>
                                <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 700;">${name}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 600; vertical-align: top;">Contact Email:</td>
                                <td style="padding: 8px 0; color: #1e293b; font-size: 14px;"><a href="mailto:${email}" style="color: #ea580c; text-decoration: none; font-weight: 600;">${email}</a></td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 600; vertical-align: top;">Status:</td>
                                <td style="padding: 8px 0;"><span style="background-color: #fff7ed; color: #c2410c; border: 1px solid #ffedd5; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase;">Pending Action</span></td>
                            </tr>
                        </table>

                        <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; border: 1px dashed #cbd5e1;">
                            <p style="margin-top: 0; color: #475569; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 10px;">Student Message Detail:</p>
                            <div style="color: #334155; font-size: 14px; white-space: pre-wrap; font-style: italic;">"${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}"</div>
                        </div>

                        <div style="margin-top: 30px; text-align: center;">
                            <a href="mailto:${email}?subject=Re:%20Support%20Query" style="background-color: #0f172a; color: #ffffff; font-weight: 700; font-size: 13px; text-decoration: none; padding: 12px 24px; border-radius: 8px; display: inline-block;">Quick Response Reply</a>
                        </div>
                    </div>
                    <div style="background-color: #f8fafc; border-top: 1px solid #f1f5f9; padding: 16px 30px; text-align: center; font-size: 11px; color: #94a3b8;">
                        Dispatched securely via Code With Pritom LMS Node Mailer core.<br/>
                        Generated: ${new Date().toLocaleString()}
                    </div>
                </div>
            `
        };

        // Async dispatch guarantees millisecond-fast response windows to the requesting client
        transporter.sendMail(supportMailOptions).catch(err => {
            console.error('❌ [SMTP Support Failure Alert]:', err.message);
        });

        res.status(200).json({
            success: true,
            message: 'Thank you! Our team will contact you shortly.'
        });
    } catch (error) {
        console.error('❌ [POST /api/support/submit failure]:', error.message);
        res.status(500).json({ success: false, message: 'Failed to record support incident.', error: error.message });
    }
});

// 7. Get Top 5-Star Public Reviews for dynamic testimonials section
app.get('/api/public/testimonials', async (req, res) => {
    try {
        // Fetch 5-star reviews, including related course titles to populate context banners
        const { data, error } = await db.from('course_reviews')
            .select(`
                rating,
                review_text,
                created_at,
                user_email,
                courses ( title )
            `)
            .eq('is_featured', true)
            .order('created_at', { ascending: false })
            .limit(9);

        if (error) throw error;

        // Mask emails and structure data gracefully for safe public publication
        const testimonials = (data || []).map(item => {
            const userNode = item.user_email ? item.user_email.split('@')[0] : 'Student';
            // Beautify masked user name: first capitalized + dots
            const maskedName = userNode.charAt(0).toUpperCase() + userNode.slice(1, 3) + '...';
            
            return {
                author: maskedName,
                text: item.review_text || 'Exceptional learning materials and pacing!',
                rating: item.rating,
                course: item.courses?.title || 'Academy Student'
            };
        });

        res.json({ success: true, data: testimonials });
    } catch (error) {
        console.error('[testimonials] Review aggregation failed:', error.message);
        res.json({ success: true, data: [] });
    }
});

// ========================================================
//               AUTHENTICATION & USER ACCESS
// ========================================================

// 1. Unified Auth Endpoint (Action Switched)
app.post('/api/auth', async (req, res) => {
    const { action, email, password, name, message, subject } = req.body;

    if (!action) {
        return res.status(400).json({ success: false, message: 'Missing required property: action.' });
    }

    try {
        switch (action.toLowerCase()) {
            case 'login': {
                if (!email || !password) {
                    return res.status(400).json({ success: false, message: 'Email and password are required.' });
                }

                const { data: user, error } = await db.from('users')
                    .select('id, name, email, password, access, role, status')
                    .eq('email', email.trim())
                    .maybeSingle();

                if (error) throw error;

                if (!user) {
                    return res.status(401).json({ success: false, message: 'Invalid email or password credentials.' });
                }

                // 1. Block unverified users and redirect to confirmation routines
                if (user.status === 'pending') {
                    // Auto-trigger a new OTP code dispatch (Convenient UX!)
                    const otp = generateSecureOTP();
                    const expiration = new Date(Date.now() + 10 * 60000);
                    
                    await db.from('otp_verifications').insert({
                        email: user.email,
                        otp: otp,
                        expires_at: expiration.toISOString(),
                        type: 'register'
                    });
                    
                    await sendOtpEmail(user.email, otp, 'register');

                    return res.status(403).json({
                        success: false,
                        requiresVerification: true,
                        email: user.email,
                        message: 'Your account is pending activation. A new verification code has been dispatched to your inbox!'
                    });
                }

                // 2. Standard cryptographic auditing
                const isMatch = await bcrypt.compare(password, user.password);
                if (!isMatch) {
                    return res.status(401).json({ success: false, message: 'Invalid email or password credentials.' });
                }

                return res.json({
                    success: true,
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        access: user.access,
                        role: user.role
                    }
                });
            }

            case 'sync': {
                if (!email) {
                    return res.status(400).json({ success: false, message: 'Email is required for session synchronization.' });
                }

                const { data: u, error } = await db.from('users')
                    .select('id, name, email, access, role')
                    .eq('email', email.trim())
                    .maybeSingle();

                if (error) throw error;

                if (!u) {
                    return res.status(404).json({ success: false, message: 'User record not found.' });
                }

                return res.json({
                    success: true,
                    message: 'Session sync successful.',
                    user: {
                        name: u.name,
                        email: u.email,
                        access: u.access,
                        role: u.role
                    }
                });
            }

            case 'register': {
                if (!name || !email || !password) {
                    return res.status(400).json({ success: false, message: 'Name, email, and password are required for registration.' });
                }

                // Check duplicate email existence
                const { data: existing, error: selectErr } = await db.from('users')
                    .select('id')
                    .eq('email', email.trim())
                    .maybeSingle();
                    
                if (selectErr) throw selectErr;

                if (existing) {
                    return res.status(409).json({ success: false, message: 'This email address is already registered!' });
                }

                // 1. Provision account with status 'pending'
                const hashedPassword = await bcrypt.hash(password, 10);
                const defaultAccess = '1';
                const { data: result, error: insertErr } = await db.from('users')
                    .insert({
                        name: name.trim(),
                        email: email.trim(),
                        password: hashedPassword,
                        access: defaultAccess,
                        status: 'pending'
                    })
                    .select('id')
                    .single();

                if (insertErr) throw insertErr;

                // 2. === GENERATE & ARCHIVE TEMPORARY OTP VERIFICATION CREDENTIAL ===
                const otp = generateSecureOTP();
                const expiration = new Date(Date.now() + 10 * 60000); // 10 Minutes TTL

                const { error: otpErr } = await db.from('otp_verifications')
                    .insert({
                        email: email.trim(),
                        otp: otp,
                        expires_at: expiration.toISOString(),
                        type: 'register'
                    });

                if (otpErr) {
                    console.error('❌ [OTP DB Insert Fail]:', otpErr.message);
                    // Swallowed so the account remains created, they can re-verify via login
                } else {
                    // 3. Dispatch secure code to student inbox immediately
                    const mailSent = await sendOtpEmail(email.trim(), otp, 'register');
                    if (!mailSent) {
                        console.warn(`⚠️ [SMTP OTP Deliverability drift] failed sending to: ${email.trim()}`);
                    }
                }

                return res.status(201).json({
                    success: true,
                    requiresVerification: true,
                    email: email.trim(),
                    message: 'Account provisioned! A 6-digit verification code has been sent to your inbox.'
                });
            }

            case 'contact': {
                if (!email || !message) {
                    return res.status(400).json({ success: false, message: 'Your email and message body are required.' });
                }

                const adminEmail = process.env.SMTP_USER || process.env.FROM_EMAIL;
                if (!adminEmail) {
                    return res.status(500).json({ success: false, message: 'Contact system currently unavailable (SMTP Unconfigured).' });
                }

                const userName = name || 'LMS Visitor';
                const userSubject = subject || 'New Inquiry from Code With Pritom LMS';

                // 1. Send inquiry report TO Admin
                const adminMailOptions = {
                    from: `"LMS Contact Form" <${adminEmail}>`,
                    to: adminEmail,
                    subject: `[INQUIRY] ${userSubject}`,
                    html: `
                        <div style="font-family: sans-serif;">
                            <h3>New Student Inquiry</h3>
                            <p><strong>From:</strong> ${userName} (&lt;${email}&gt;)</p>
                            <p><strong>Subject:</strong> ${userSubject}</p>
                            <blockquote style="background: #f9f9f9; border-left: 4px solid #ea580c; padding: 15px; margin: 20px 0;">
                                ${message.replace(/\n/g, '<br/>')}
                            </blockquote>
                        </div>
                    `
                };

                // 2. Send auto-reply acknowledgement TO Student
                const replyMailOptions = {
                    from: `"Code With Pritom" <${adminEmail}>`,
                    to: email.trim(),
                    subject: 'Message Received! — Code With Pritom',
                    html: `
                        <div style="font-family: sans-serif; color: #333;">
                            <p>Hello ${userName},</p>
                            <p>We have received your message and our support team has been notified. We will review it and respond shortly.</p>
                            <p>Thank you for reaching out!</p>
                            <br/>
                            <p style="font-size: 12px; color: #999;">(This is an automated auto-reply confirmation.)</p>
                        </div>
                    `
                };

                // Dispatch both concurrently
                Promise.all([
                    transporter.sendMail(adminMailOptions),
                    transporter.sendMail(replyMailOptions)
                ]).catch(err => console.error('❌ [SMTP Contact Error]:', err.message));

                return res.json({
                    success: true,
                    message: 'Your message has been securely transmitted to our administrator!'
                });
            }

            default:
                return res.status(400).json({ success: false, message: `Unknown action handler: ${action}` });
        }
    } catch (error) {
        console.error('[FATAL ERROR /api/auth]:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error', debug: error.message });
    }
});

// 1.5. POST /api/verify-otp — Atomic Verification & State Activation Handler
app.post('/api/verify-otp', async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ success: false, message: 'Email and 6-digit OTP code are required.' });
    }

    try {
        // 1. Fetch matching record sorted strictly to locate most recent creation event
        const { data: tokens, error: dbErr } = await db.from('otp_verifications')
            .select('*')
            .eq('email', email.trim())
            .eq('otp', otp.trim())
            .eq('type', 'register')
            .order('created_at', { ascending: false });

        if (dbErr) throw dbErr;

        if (!tokens || tokens.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid verification code. Please check and try again.' });
        }

        // Audit physical expiration boundaries
        const activeToken = tokens[0];
        const expiryMs = new Date(activeToken.expires_at).getTime();
        const currentMs = Date.now();

        if (currentMs > expiryMs) {
            return res.status(410).json({ success: false, message: 'This code has expired. Please re-register or request a new code.' });
        }

        // 2. Promote registration entity context atomically to 'active'
        const { data: activeUser, error: upErr } = await db.from('users')
            .update({ status: 'active' })
            .eq('email', email.trim())
            .select('id, name, email, access, role')
            .maybeSingle();

        if (upErr) throw upErr;

        if (!activeUser) {
            return res.status(404).json({ success: false, message: 'Target user profile no longer exists.' });
        }

        // 3. Housekeeping: Safely purge all cached codes linked to this verification channel
        await db.from('otp_verifications')
            .delete()
            .eq('email', email.trim())
            .eq('type', 'register');

        // 4. Dispatch premium welcome onboarding email asynchronously on first verification success
        const systemMail = process.env.SMTP_USER || process.env.FROM_EMAIL;
        if (systemMail) {
            const mailOptions = {
                from: `"Code With Pritom" <${systemMail}>`,
                to: activeUser.email.trim(),
                subject: 'Welcome to Code With Pritom LMS! 🚀',
                html: `
                    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 20px auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                        <div style="background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%); padding: 25px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800;">Activation Confirmed! 🎉</h1>
                        </div>
                        <div style="padding: 30px; background-color: #ffffff;">
                            <h2 style="color: #1f2937; margin-top: 0;">Hello ${activeUser.name}! 👋</h2>
                            <p>Your account is successfully activated. You now have full access to student portal tools!</p>
                            <hr style="border: none; border-top: 1px solid #f3f4f6; margin: 20px 0;"/>
                            <p><strong>Registered Profile:</strong></p>
                            <ul style="padding-left: 20px; color: #4b5563;">
                                <li><strong>Student Email:</strong> ${activeUser.email}</li>
                                <li><strong>Initial Unlocks:</strong> Course Fundamentals & Handnotes</li>
                            </ul>
                            <br/>
                            <div style="text-align: center; margin: 20px 0;">
                                <a href="https://codewithpritom.academy/dashboard.html" style="background-color: #ea580c; color: white !important; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Access Student Dashboard</a>
                            </div>
                            <p style="margin-top: 30px; font-size: 12px; color: #9ca3af; text-align: center;">Happy learning!<br/>— Team Code With Pritom</p>
                        </div>
                    </div>
                `
            };
            transporter.sendMail(mailOptions).catch(err => console.error('❌ [SMTP Welcome Post-OTP Error]:', err.message));
        }

        // Return standard active session payload matching normal successful login flows
        return res.status(200).json({
            success: true,
            message: 'Verification complete!',
            user: activeUser
        });

    } catch (error) {
        console.error('[POST /api/verify-otp failure]:', error.message);
        return res.status(500).json({ success: false, message: 'Atomic activation failed.', error: error.message });
    }
});

// 1.6. POST /api/forget-password — Recovery Initialization Handler
app.post('/api/forget-password', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, message: 'Please provide your account email address.' });
    }

    try {
        // 1. Check User Existence
        const { data: user, error: selectErr } = await db.from('users')
            .select('id')
            .eq('email', email.trim())
            .maybeSingle();

        if (selectErr) throw selectErr;

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // 2. Generate & Save OTP (10 minutes lifecycle)
        const otp = generateSecureOTP();
        const expiresAt = new Date(Date.now() + 10 * 60000).toISOString();

        const { error: insertErr } = await db.from('otp_verifications')
            .insert([{
                email: email.trim(),
                otp: otp,
                expires_at: expiresAt,
                type: 'reset'
            }]);

        if (insertErr) throw insertErr;

        // 3. Send Email within specific sandboxed try-catch boundary
        try {
            const mailSent = await sendOtpEmail(email.trim(), otp, 'reset');
            if (!mailSent) {
                throw new Error('SMTP returned failure response');
            }
        } catch (emailErr) {
            console.error('Mail dispatcher Exception:', emailErr.message);
            return res.status(500).json({ success: false, message: 'Email service failed' });
        }

        return res.status(200).json({
            success: true,
            message: 'Password recovery code has been dispatched to your registered email!'
        });

    } catch (error) {
        // 4. Error Logging
        console.error('Forget Password Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to initialize password recovery pipeline.', error: error.message });
    }
});

// 1.7. POST /api/reset-password — Secure Pass Overwrite Handler
app.post('/api/reset-password', async (req, res) => {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
        return res.status(400).json({ success: false, message: 'Email, code, and new password strings are mandatory.' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long.' });
    }

    try {
        // 1. Audit active recovery records matching the token
        const { data: records, error: dbErr } = await db.from('otp_verifications')
            .select('*')
            .eq('email', email.trim())
            .eq('otp', otp.trim())
            .eq('type', 'reset')
            .order('created_at', { ascending: false });

        if (dbErr) throw dbErr;

        if (!records || records.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid password recovery code.' });
        }

        const resetToken = records[0];
        const expiryLimit = new Date(resetToken.expires_at).getTime();

        if (Date.now() > expiryLimit) {
            return res.status(410).json({ success: false, message: 'Password recovery code has expired. Please request a new one.' });
        }

        // 2. Execute atomic credentials rotation
        const hashedSecret = await bcrypt.hash(newPassword, 10);
        const { error: updateErr } = await db.from('users')
            .update({ password: hashedSecret })
            .eq('email', email.trim());

        if (updateErr) throw updateErr;

        // 3. Flush consumed recovery tokens from physical records
        await db.from('otp_verifications')
            .delete()
            .eq('email', email.trim())
            .eq('type', 'reset');

        return res.status(200).json({
            success: true,
            message: 'Password secured successfully! Please log in with your new credentials.'
        });

    } catch (error) {
        console.error('[POST /api/reset-password failure]:', error.message);
        return res.status(500).json({ success: false, message: 'Critical password overwrite operation aborted.' });
    }
});

// 2. Single Access Validation Gate
app.get('/api/check-access', async (req, res) => {
    const { email, course_id } = req.query;

    if (!email) {
        return res.status(400).json({ success: false, message: 'Query parameter "email" is required.' });
    }

    try {
        const { data: user, error } = await db.from('users')
            .select('access, status')
            .eq('email', email.trim())
            .maybeSingle();

        if (error) throw error;

        if (!user) {
            return res.status(404).json({ success: false, message: 'User account not found.' });
        }

        const accessArray = (user.access || '').split(',').map(s => s.trim().toUpperCase());
        let hasAccess = true;
        if (course_id) {
            hasAccess = accessArray.includes(course_id.trim().toUpperCase());
        }

        res.json({
            success: true,
            email: email.trim(),
            access: user.access,
            hasAccess: hasAccess && user.status !== 'suspended',
            status: user.status
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Access query failed.', error: error.message });
    }
});

// ========================================================
//              BUSINESS LOGIC & PROGRESS ENGINE
// ========================================================

// 1. Verify Promo/Coupon Code
app.get('/api/verify-coupon', async (req, res) => {
    const { coupon_name, course_code } = req.query;

    if (!coupon_name) {
        return res.status(400).json({ success: false, message: 'Parameter coupon_name is required.' });
    }

    try {
        // Match coupon name and either matching course_code OR null-level global coupons
        const promo = coupon_name.trim().toUpperCase();
        const targetCode = course_code ? course_code.trim() : '';
        
        // Map legacy columns to standard cloud PostgreSQL schema properties
        const { data: rows, error } = await db.from('coupons')
            .select('discount_type, discount_value')
            .eq('code', promo)
            .eq('status', 'active')
            .or(`course_code.eq.${targetCode},course_code.is.null,course_code.eq.""`);

        if (error) throw error;

        if (!rows || rows.length === 0) {
            return res.json({ valid: false, message: 'Invalid or expired promo code.' });
        }

        const match = rows[0];
        const percentValue = (match.discount_type === 'percentage') ? parseFloat(match.discount_value || 0) : 0;

        res.json({
            valid: true,
            discount_percent: percentValue
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Coupon query error.', error: error.message });
    }
});

// 2. POST /api/checkout/submit — Debugging Rewrite Route (Developer Requested Segment)
app.post('/api/checkout/submit', async (req, res) => {
  const supabase = db; // Standardize client variable map to active instance
  try {
    const { user_email, course_code, transaction_id, total_paid, amount } = req.body;
    
    // 2. Debugging: Enforce presence constraint of physical identifiers
    if (!user_email || !transaction_id) {
        return res.status(400).json({ message: 'Missing fields' });
    }

    const resolvedTotalPaid = parseFloat(total_paid || amount || 0);

    // Use Supabase 'insert'
    const { data, error } = await supabase
      .from('pending_orders')
      .insert([
        { 
          user_email: user_email, 
          course_code: course_code, 
          transaction_id: transaction_id, 
          total_paid: resolvedTotalPaid,
          status: 'pending' 
        }
      ]);

    if (error) throw error;
    res.json({ success: true, message: 'Order submitted successfully!' });
  } catch (err) {
    console.error('Checkout Error:', err.message); // এই এররটি টার্মিনালে দেখব
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2.5. Legacy Record Checkout / Submit Payment Details
app.post('/api/submit-payment', async (req, res) => {
    const { email, user_email, course_code, transaction_id, promo_code, user_name, name, phone, user_phone, amount, total, method } = req.body;
    
    // Parse variables applying high compatibility schemas
    const customerEmail = (email || user_email || '').trim();
    const customerName = (name || user_name || 'Valued Customer').trim();
    const customerPhone = (phone || user_phone || '01700000000').trim();
    const itemCode = (course_code || '').trim();
    const txId = (transaction_id || '').trim();
    const code = promo_code ? promo_code.trim().toUpperCase() : null;
    const totalPaid = parseFloat(amount || total || 0);
    const payMethod = method || 'bKash';

    if (!customerEmail || !itemCode || !txId) {
        return res.status(400).json({ success: false, message: 'Missing required fields: email, course_code, and transaction_id are required.' });
    }

    try {
        // Store into relational pending_orders bucket
        const { error: insertErr } = await db.from('pending_orders')
            .insert({
                user_name: customerName,
                user_email: customerEmail,
                user_phone: customerPhone,
                course_code: itemCode,
                transaction_id: txId,
                promo_code: code,
                payment_method: payMethod,
                total_paid: totalPaid,
                status: 'PENDING'
            });

        if (insertErr) throw insertErr;

        // Atomically increment usage ledger if valid coupon code recorded
        if (code) {
            const { data: promo } = await db.from('coupons')
                .select('usage_count')
                .eq('code', code)
                .maybeSingle();

            if (promo) {
                const count = parseInt(promo.usage_count || 0) + 1;
                await db.from('coupons')
                    .update({ usage_count: count })
                    .eq('code', code);
            }
        }

        // Dispatch verified SMTP receipts to user & administrators
        const adminEmail = process.env.SMTP_USER || process.env.FROM_EMAIL;
        if (adminEmail) {
            // A. Receipt to student
            const userMail = {
                from: `"Code With Pritom Orders" <${adminEmail}>`,
                to: customerEmail,
                subject: 'Order Received! Verification Pending ⏳',
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; line-height:1.6; color:#444;">
                        <h2 style="color: #ea580c; border-bottom: 1px solid #eee; padding-bottom: 10px;">Order Received</h2>
                        <p>Hello ${customerName},</p>
                        <p>Thank you for choosing <strong>Code With Pritom</strong>. We have received your payment details and our verification desk is auditing your transaction.</p>
                        <div style="background: #f9f9f9; border-radius: 8px; padding: 15px; margin: 20px 0;">
                            <p style="margin: 5px 0;"><strong>Course Code:</strong> ${itemCode}</p>
                            <p style="margin: 5px 0;"><strong>Transaction ID (TrxID):</strong> <span style="font-family: monospace; font-weight: bold;">${txId}</span></p>
                            <p style="margin: 5px 0;"><strong>Paid Amount:</strong> ৳${totalPaid.toFixed(2)}</p>
                        </div>
                        <p>Upon verification (typically within <strong>2 hours</strong>), access to the class library will populate automatically on your student dashboard.</p>
                        <p style="font-size: 12px; color: #888; margin-top:30px;">This is an automated message.</p>
                    </div>
                `
            };

            // B. Ticketing notification to system admin
            const adminMail = {
                from: `"LMS Transaction Dispatch" <${adminEmail}>`,
                to: adminEmail,
                subject: `🔔 [PENDING ORDER] Verify Payment - TrxID: ${txId}`,
                html: `
                    <div style="font-family: sans-serif;">
                        <h3>New Incoming Payment Waiting Verification</h3>
                        <hr/>
                        <p><strong>Customer:</strong> ${customerName} (&lt;${customerEmail}&gt;)</p>
                        <p><strong>Phone:</strong> ${customerPhone}</p>
                        <p><strong>Course Request:</strong> Level ${itemCode}</p>
                        <p><strong>TrxID:</strong> <code style="background:#f5f5f5; padding: 2px 5px;">${txId}</code> (${payMethod})</p>
                        <p><strong>Coupon Used:</strong> ${code || 'None'}</p>
                        <p><strong>Calculated Price:</strong> ৳${totalPaid.toFixed(2)}</p>
                        <br/>
                        <p>Check your bKash panel, then update this order status in Supabase to approve access.</p>
                    </div>
                `
            };

            Promise.all([
                transporter.sendMail(userMail),
                transporter.sendMail(adminMail)
            ]).catch(err => console.error('❌ [SMTP Transaction Email Log Error]:', err.message));
        }

        res.status(201).json({
            success: true,
            message: 'Payment records transmitted successfully. Verification queue is active.'
        });

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, message: 'This Transaction ID has already been submitted!' });
        }
        res.status(500).json({ success: false, message: 'Checkout processing failure.', error: error.message });
    }
});

// 3. Save Continuous Lesson Progress
app.post('/api/save-progress', async (req, res) => {
    const { user_email, email, course_code, lesson_number } = req.body;
    const customerEmail = (email || user_email || '').trim();
    const lessonNo = parseInt(lesson_number);

    if (!customerEmail || !course_code || isNaN(lessonNo)) {
        return res.status(400).json({ success: false, message: 'Missing parameters: email, course_code, and lesson_number are required.' });
    }

    try {
        // Enforce upsert guaranteeing unique pairs do not collision-abort execution
        const { error } = await db.from('user_progress')
            .upsert({
                user_email: customerEmail,
                course_code: course_code.trim(),
                lesson_number: lessonNo
            }, { onConflict: 'user_email,course_code,lesson_number' });

        if (error) throw error;
        res.json({ success: true, message: 'Continuous learning log updated.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to record student progression.', error: error.message });
    }
});

// 3b. Remove Continuous Lesson Progress (Unmark Completion)
app.post('/api/delete-progress', async (req, res) => {
    const { user_email, email, course_code, lesson_number } = req.body;
    const customerEmail = (email || user_email || '').trim();
    const lessonNo = parseInt(lesson_number);

    if (!customerEmail || !course_code || isNaN(lessonNo)) {
        return res.status(400).json({ success: false, message: 'Missing parameters: email, course_code, and lesson_number are required.' });
    }

    try {
        const { error } = await db.from('user_progress')
            .delete()
            .eq('user_email', customerEmail)
            .eq('course_code', course_code.trim())
            .eq('lesson_number', lessonNo);

        if (error) throw error;
        res.json({ success: true, message: 'Learning log entry successfully expunged.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to purge student progression.', error: error.message });
    }
});

// 4. Fetch Student Lesson Progress Historiography
app.post('/api/get-user-progress', async (req, res) => {
    const { user_email, email, course_code } = req.body;
    const customerEmail = (email || user_email || '').trim();

    if (!customerEmail || !course_code) {
        return res.status(400).json({ success: false, message: 'Missing parameters: email and course_code are required.' });
    }

    try {
        const { data: history, error } = await db.from('user_progress')
            .select('lesson_number')
            .eq('user_email', customerEmail)
            .eq('course_code', course_code.trim());

        if (error) throw error;

        // Flatten result array containing raw indexes
        const watchedIndexes = (history || []).map(row => parseInt(row.lesson_number));
        res.json({ success: true, email: customerEmail, course_code, data: watchedIndexes });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to recover user progression history.', error: error.message });
    }
});

// 5. Submit Course Feedback and Review Rating
app.post('/api/reviews/submit', async (req, res) => {
  const supabase = db; // Standardize mapping variable context
  try {
    const { user_email, course_code, rating, comment, suggestions } = req.body;
    
    // 1. Input validation
    if (!user_email || !course_code) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // 2. Duplicate review interceptor: Enforce one review per student/course
    const { data: existingReview } = await supabase
      .from('course_reviews')
      .select('id')
      .eq('user_email', user_email.trim())
      .eq('course_code', course_code.trim())
      .maybeSingle();

    if (existingReview) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this course.' });
    }

    const { data, error } = await supabase
      .from('course_reviews')
      .insert([{ 
        user_email: user_email, 
        course_code: course_code, 
        rating: parseInt(rating), 
        comment: comment, 
        suggestions: suggestions 
      }]);

    if (error) {
      console.error('Supabase Error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
    
    res.json({ success: true, message: 'Review saved!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.toString() });
  }
});

// 6. GET /api/reviews/check — Check User Review Status for Current Course
app.get('/api/reviews/check', async (req, res) => {
    const { user_email, course_code } = req.query;
    
    if (!user_email || !course_code) {
        return res.status(200).json({ hasReviewed: false });
    }

    try {
        const { data, error } = await db.from('course_reviews')
            .select('id')
            .eq('user_email', user_email.trim())
            .eq('course_code', course_code.trim())
            .maybeSingle();

        if (error) throw error;

        res.status(200).json({ hasReviewed: !!data });
    } catch (error) {
        console.error('[reviews/check] Check failure:', error.message);
        res.status(200).json({ hasReviewed: false });
    }
});

// ========================================================
//               📊 DYNAMIC MEMBER DASHBOARD SYSTEM
// ========================================================

// 0. PUT /api/user/update-profile — Dynamic Account Customization Controller
app.put('/api/user/update-profile', async (req, res) => {
    const { email, newName } = req.body;
    
    if (!email || !newName) {
        return res.status(400).json({ success: false, message: 'Email and target display name are required.' });
    }

    try {
        // Strictly execute sanitized update mapping directly onto users scope
        const { data, error } = await db.from('users')
            .update({ name: newName.trim() })
            .eq('email', email.trim())
            .select('id, name, email, access, role')
            .maybeSingle();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({ success: false, message: 'Target user account not discovered.' });
        }

        return res.json({ 
            success: true, 
            message: 'Account identity successfully updated.', 
            user: data 
        });
    } catch (error) {
        console.error('[update-profile] Relational rewrite operation failure:', error.message);
        return res.status(500).json({ success: false, message: 'Database identity sync aborted.', error: error.message });
    }
});

// 0.5. PUT /api/user/update-password — Secure Cryptographic Credentials Rotation
app.put('/api/user/update-password', async (req, res) => {
    const { email, oldPassword, newPassword } = req.body;
    
    if (!email || !oldPassword || !newPassword) {
        return res.status(400).json({ success: false, message: 'Email, current password, and new password are required.' });
    }

    try {
        // a. Fetch targeted user profile complete with private hash
        const { data: user, error: dbErr } = await db.from('users')
            .select('id, password')
            .eq('email', email.trim())
            .maybeSingle();

        if (dbErr) throw dbErr;

        if (!user) {
            return res.status(404).json({ success: false, message: 'User matching credentials not found.' });
        }

        // b. Perform strict cryptographic equivalence audit on existing salt
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Incorrect current password.' });
        }

        // c. Generate authoritative new salted crypt-hash
        const newHashedPassword = await bcrypt.hash(newPassword, 10);

        // d. Atomic database persistence update
        const { error: upErr } = await db.from('users')
            .update({ password: newHashedPassword })
            .eq('id', user.id);

        if (upErr) throw upErr;

        res.status(200).json({
            success: true,
            message: 'Password updated successfully!'
        });

    } catch (error) {
        console.error('[update-password] Exception encountered during crypt rotation:', error.message);
        res.status(500).json({ success: false, message: 'Cryptographic execution failure.', error: error.message });
    }
});

// 1. GET /api/user/profile/:email — Fetch latest verified profile metadata
app.get('/api/user/profile/:email', async (req, res) => {
    try {
        const { email } = req.params;
        if (!email) return res.json([]);

        const { data, error } = await db.from('users')
            .select('name, email, access, role, status')
            .eq('email', email.trim())
            .maybeSingle();

        if (error) throw error;
        
        // Returns [] if user is missing to preserve safe-iterations on client side
        res.json(data || []);
    } catch (error) {
        console.error('[GET /api/user/profile] Failure:', error.message);
        res.json([]);
    }
});

// 2. GET /api/user/enrolled-courses/:email — Map and deliver enrolled course objects
app.get('/api/user/enrolled-courses/:email', async (req, res) => {
    try {
        const { email } = req.params;
        if (!email) return res.json([]);

        // Fetch specific user entitlement registry
        const { data: user, error: uErr } = await db.from('users')
            .select('access')
            .eq('email', email.trim())
            .maybeSingle();

        if (uErr) throw uErr;
        if (!user || !user.access) return res.json([]);

        // Tokenize and clean CSV tags (e.g. 'C_PROG, LINUX_01' -> ['C_PROG', 'LINUX_01'])
        const codes = user.access.split(',').map(s => s.trim()).filter(Boolean);
        if (codes.length === 0) return res.json([]);

        // Query actual asset contents matching the verified access registry
        const { data: enrolled, error: cErr } = await db.from('courses')
            .select('*')
            .in('course_code', codes);

        if (cErr) throw cErr;

        // Dynamize total_lessons dynamically to guarantee sync with latest Admin panel pushes
        const { data: lessonsList, error: lErr } = await db.from('lessons')
            .select('course_code')
            .in('course_code', codes);

        if (!lErr && lessonsList) {
            const countMap = {};
            lessonsList.forEach(les => {
                const key = String(les.course_code || '').trim();
                countMap[key] = (countMap[key] || 0) + 1;
            });

            (enrolled || []).forEach(c => {
                const codeKey = String(c.course_code || '').trim();
                c.total_lessons = countMap[codeKey] || 0; // Safe real-time total
            });
        }

        res.json(enrolled || []);
    } catch (error) {
        console.error('[GET /api/user/enrolled-courses] Failure:', error.message);
        res.json([]);
    }
});

// 3. GET /api/user/progress/:email — Calculate total counts from user_progress
app.get('/api/user/progress/:email', async (req, res) => {
    try {
        const { email } = req.params;
        if (!email) return res.json([]);

        const { data: progressList, error } = await db.from('user_progress')
            .select('course_code, lesson_number')
            .eq('user_email', email.trim());

        if (error) throw error;
        if (!progressList || progressList.length === 0) return res.json([]);

        // Compile occurrence maps aggregating lesson frequencies
        const progressMap = {};
        progressList.forEach(row => {
            const code = row.course_code;
            if (!progressMap[code]) {
                progressMap[code] = { course_code: code, completed_lessons: 0 };
            }
            progressMap[code].completed_lessons++;
        });

        res.json(Object.values(progressMap));
    } catch (error) {
        console.error('[GET /api/user/progress] Failure:', error.message);
        res.json([]);
    }
});

// 4. GET /api/dashboard/stats/:email — Compile statistical aggregate summaries
app.get('/api/dashboard/stats/:email', async (req, res) => {
    try {
        const { email } = req.params;
        if (!email) return res.json([]);

        // Concurrency optimization: Query all factors including real-time lessons counts simultaneously
        const [userRes, coursesRes, lessonsRes, progressRes] = await Promise.all([
            db.from('users').select('access').eq('email', email.trim()).maybeSingle(),
            db.from('courses').select('course_code').eq('status', 'active'),
            db.from('lessons').select('course_code'),
            db.from('user_progress').select('course_code').eq('user_email', email.trim())
        ]);

        if (userRes.error) throw userRes.error;
        if (coursesRes.error) throw coursesRes.error;
        if (lessonsRes.error) throw lessonsRes.error;
        if (progressRes.error) throw progressRes.error;

        const user = userRes.data;
        const allCourses = coursesRes.data || [];
        const lessonsList = lessonsRes.data || [];
        const progressList = progressRes.data || [];

        const accessStr = user ? (user.access || '') : '';
        const enrolledCodes = accessStr.split(',').map(s => s.trim()).filter(Boolean);
        const totalEnrolled = enrolledCodes.length;

        // Build lesson limit definitions directly from lessons table counts
        const lessonTargetMap = {};
        lessonsList.forEach(l => {
            const key = String(l.course_code || '').trim();
            lessonTargetMap[key] = (lessonTargetMap[key] || 0) + 1;
        });

        // Build local frequency index for completed lessons
        const userProgressMap = {};
        progressList.forEach(p => {
            const key = String(p.course_code || '').trim();
            userProgressMap[key] = (userProgressMap[key] || 0) + 1;
        });

        // Calculate complete flags using fully dynamic boundaries
        let totalCompleted = 0;
        enrolledCodes.forEach(code => {
            const key = String(code).trim();
            const completed = userProgressMap[key] || 0;
            const target = lessonTargetMap[key] || 0;
            // Mark completed if user progress reaches the dynamically measured size of the curriculum
            if (target > 0 && completed >= target) {
                totalCompleted++;
            }
        });

        // Compute inverse active course delta
        const availableCount = Math.max(0, allCourses.length - totalEnrolled);

        res.json({
            success: true,
            total_enrolled: totalEnrolled,
            total_completed: totalCompleted,
            available_courses: availableCount
        });
    } catch (error) {
        console.error('[GET /api/dashboard/stats] Failure:', error.message);
        res.json([]);
    }
});

// 4b. GET /api/user/commitment-stats/:email — Compile physical course progression matrix
app.get('/api/user/commitment-stats/:email', async (req, res) => {
    try {
        const { email } = req.params;
        if (!email) return res.json([]);

        // A. Fetch User Access Record to restrict graph only to unlocked courses
        const { data: user, error: uErr } = await db.from('users')
            .select('access')
            .eq('email', email.trim())
            .maybeSingle();

        if (uErr) throw uErr;
        if (!user || !user.access) return res.json([]);

        const enrolledCodes = user.access.split(',').map(s => s.trim()).filter(Boolean);
        if (enrolledCodes.length === 0) return res.json([]);

        // B. Gather parallel details: Master course titles, lessons counts, and completions
        const [coursesRes, lessonsRes, progressRes] = await Promise.all([
            db.from('courses').select('course_code, title').in('course_code', enrolledCodes),
            db.from('lessons').select('course_code').in('course_code', enrolledCodes),
            db.from('user_progress').select('course_code').eq('user_email', email.trim()).in('course_code', enrolledCodes)
        ]);

        if (coursesRes.error) throw coursesRes.error;
        if (lessonsRes.error) throw lessonsRes.error;
        if (progressRes.error) throw progressRes.error;

        const enrolledCourses = coursesRes.data || [];
        const lessonsList = lessonsRes.data || [];
        const progressList = progressRes.data || [];

        // C. Map Course Code to physical titles for the label keys
        const courseTitleMap = {};
        enrolledCourses.forEach(c => {
            courseTitleMap[String(c.course_code).trim().toUpperCase()] = c.title;
        });

        // D. Map course code to lessons target count
        const totalLessonsMap = {};
        lessonsList.forEach(l => {
            const key = String(l.course_code).trim().toUpperCase();
            totalLessonsMap[key] = (totalLessonsMap[key] || 0) + 1;
        });

        // E. Map course code to total completed count
        const completedLessonsMap = {};
        progressList.forEach(p => {
            const key = String(p.course_code).trim().toUpperCase();
            completedLessonsMap[key] = (completedLessonsMap[key] || 0) + 1;
        });

        // F. Build clean aggregation payload
        const commitmentStats = enrolledCourses.map(c => {
            const key = String(c.course_code).trim().toUpperCase();
            return {
                course: c.title || c.course_code,
                completed: completedLessonsMap[key] || 0,
                total: totalLessonsMap[key] || 0
            };
        });

        res.json(commitmentStats);
    } catch (error) {
        console.error('[GET /api/user/commitment-stats] Failure:', error.message);
        res.json([]);
    }
});

// 5. Workshop Native Check-in / Registration
app.post('/api/join-workshop', async (req, res) => {
    const { email, user_email, workshop_id } = req.body;
    const customerEmail = (email || user_email || '').trim();
    const workshop = (workshop_id || '').trim();

    if (!customerEmail || !workshop) {
        return res.status(400).json({ success: false, message: 'Parameters email and workshop_id are required.' });
    }

    try {
        // Atomically upsert student slot in PostgreSQL to handle safe concurrency
        const { error } = await db.from('workshop_registrations')
            .upsert({
                email: customerEmail,
                workshop_id: workshop,
                status: 'REGISTERED'
            }, { onConflict: 'email,workshop_id' });

        if (error) throw error;
        res.json({ success: true, message: 'Workshop slot secured successfully.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to process workshop registration.', error: error.message });
    }
});

// ========================================================
//                    ADMIN MANAGEMENT APIs
// ========================================================

// --- A. USER MANAGEMENT ---
// 1. GET /api/admin/users — Fetch All Students (Returns Flat Array)
app.get('/api/admin/users', isAdmin, async (req, res) => {
    try {
        const { data: users, error } = await db.from('users')
            .select('id, name, email, role, access')
            .order('id', { ascending: false });

        if (error) throw error;
        res.status(200).json(users || []);
    } catch (error) {
        res.status(200).json([]);
    }
});

// 1b. GET /api/admin/reviews — Fetch All Submitted Course Feedback & Suggestions
app.get('/api/admin/reviews', async (req, res) => {
  const supabase = db; // Align dynamic execution mapping
  try {
    const { data, error } = await supabase.from('course_reviews').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    // Ensure we return ONLY the data array
    res.json(data || []);
  } catch (err) {
    console.error('Review Fetch Error:', err.message);
    res.status(500).json([]); // Return empty array on error to prevent crash
  }
});

// 1c. PATCH /api/admin/reviews/:id/toggle-featured — Toggle Testimonial Staging Flag
app.patch('/api/admin/reviews/:id/toggle-featured', isAdmin, async (req, res) => {
    const { is_featured } = req.body;
    
    try {
        const { error } = await db.from('course_reviews')
            .update({ is_featured: !!is_featured })
            .eq('id', req.params.id);

        if (error) throw error;
        res.json({ success: true, message: 'Featured status updated.' });
    } catch (error) {
        console.error('[admin/reviews/toggle] Flag rewrite error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to update testimonial state.' });
    }
});

// 2. PUT /api/admin/users/:id — Update Student Configurations
app.put('/api/admin/users/:id', isAdmin, async (req, res) => {
    const { access, role } = req.body;
    try {
        const updates = {};
        if (access !== undefined) updates.access = access.trim();
        if (role) updates.role = role.trim();

        const { error } = await db.from('users')
            .update(updates)
            .eq('id', req.params.id);

        if (error) throw error;
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(200).json([]);
    }
});

// 3. DELETE /api/admin/users/:id — Purge User
app.delete('/api/admin/users/:id', isAdmin, async (req, res) => {
    try {
        const { error } = await db.from('users')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(200).json([]);
    }
});

// --- B. COURSE MANAGEMENT ---
// 1. POST /api/admin/courses — Catalog Fresh Course Node
app.post('/api/admin/courses', isAdmin, async (req, res) => {
    const { course_code, title, description, thumbnail_url, icon, color, price, total_lessons, duration_text, duration_days } = req.body;
    try {
        const { error } = await db.from('courses')
            .insert({
                course_code: (course_code || '').trim(),
                title: (title || '').trim(),
                description: description || '',
                thumbnail_url: thumbnail_url || 'images/brand.png',
                icon: icon || 'fa-graduation-cap',
                color: color || 'bg-slate-100 text-slate-700',
                price: parseFloat(price) || 0,
                total_lessons: parseInt(total_lessons) || 0,
                duration_days: parseInt(duration_days) || 365,
                duration_text: duration_text || 'Self-paced'
            });

        if (error) throw error;
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(200).json([]);
    }
});

// 2. DELETE /api/admin/courses/:id — Sever Course Node from Catalog
app.delete('/api/admin/courses/:id', isAdmin, async (req, res) => {
    try {
        const { error } = await db.from('courses')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(200).json([]);
    }
});

// --- C. PAYMENT APPROVAL WORKFLOWS ---
// 1. GET /api/admin/pending-orders — View All Receivables (Returns Flat Array)
app.get('/api/admin/pending-orders', isAdmin, async (req, res) => {
    try {
        // Query relational data filtering strictly for pending enrollment requests
        const { data: orders, error } = await db.from('pending_orders')
            .select('*')
            .ilike('status', 'PENDING')
            .order('id', { ascending: false });

        if (error) throw error;
        res.status(200).json(orders || []);
    } catch (error) {
        console.error('[GET pending-orders failure]:', error.message);
        res.status(200).json([]);
    }
});

// 2. POST /api/admin/approve-payment — Atomic Enrollment Unlock Pipeline
app.post('/api/admin/approve-payment', isAdmin, async (req, res) => {
    const { order_id } = req.body;
    if (!order_id) return res.status(200).json([]);

    try {
        // Supabase executes safe serial isolation using standard Promise flows utilizing highly privileged client to bypass RLS
        // A. Fetch Order Properties
        const { data: orders, error: orderErr } = await supabaseAdmin.from('pending_orders')
            .select('user_email, course_code')
            .eq('id', order_id);

        if (orderErr) throw orderErr;

        if (orders && orders.length > 0) {
            const email = orders[0].user_email;
            const courseCode = orders[0].course_code;

            // B. Merge into Access Clearances
            const { data: users, error: userErr } = await supabaseAdmin.from('users')
                .select('access')
                .eq('email', email);

            if (userErr) throw userErr;

            if (users && users.length > 0) {
                const current = users[0].access || '';
                const currentSet = current.split(',').map(s => s.trim()).filter(Boolean);
                const orderSet = courseCode.split(',').map(s => s.trim()).filter(Boolean);
                const combined = Array.from(new Set([...currentSet, ...orderSet])).join(',');
                
                await supabaseAdmin.from('users')
                    .update({ access: combined })
                    .eq('email', email);
            }
            
            // C. Expunge Order Queue Row
            await supabaseAdmin.from('pending_orders')
                .delete()
                .eq('id', order_id);

            // D. Automated Course Access Unlock Notification (Asynchronous dispatch)
            const unlockMail = {
                from: `"Code With Pritom" <${process.env.SMTP_USER}>`,
                to: email.trim(),
                subject: '🎉 Congratulations! Course Access Successfully Unlocked',
                html: `
                    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px;">
                        <h2 style="color: #ea580c;">Seat Reservation Confirmed! 👋</h2>
                        <p>Hello there,</p>
                        <p>We are happy to let you know that your payment enrollment for Course Code: <strong>${courseCode}</strong> has been successfully verified and approved by our system administrator.</p>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;"/>
                        <p><strong>Your access is now fully unlocked!</strong> You can navigate to the classroom immediately to begin your studies.</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="https://codewithpritom.com/dashboard.html" style="display: inline-block; background-color: #ea580c; color: white; padding: 12px 28px; text-decoration: none; border-radius: 10px; font-weight: 900; font-size: 15px; box-shadow: 0 4px 10px rgba(234, 88, 12, 0.2);">Go to My Dashboard</a>
                        </div>
                        <p style="font-size: 12px; color: #888;">This is an automated service notification. Please do not reply directly to this email.</p>
                    </div>
                `
            };

            transporter.sendMail(unlockMail).catch(err => {
                console.error('[approve-payment] Automatic Welcome Transmission Blocked:', err.message);
            });
        }

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('[approve-payment] Pipeline execution failure:', error.message);
        res.status(200).json([]);
    }
});

// 3. DELETE /api/admin/delete-order/:id — Purge Fraudulent or Rejected Order Records
app.delete('/api/admin/delete-order/:id', isAdmin, async (req, res) => {
    const orderId = req.params.id;
    if (!orderId) {
        return res.status(400).json({ success: false, message: 'Physical Order identification token is required for deletions.' });
    }

    try {
        const { error } = await supabaseAdmin.from('pending_orders')
            .delete()
            .eq('id', orderId);

        if (error) throw error;

        res.status(200).json({ success: true, message: 'Record expunged successfully from execution queue.' });
    } catch (error) {
        console.error('[DELETE delete-order pipeline failure]:', error.message);
        res.status(500).json({ success: false, message: 'Failed to expunge order record.' });
    }
});

// --- D. CORE EXECUTIVE ANALYTICS ---
// GET /api/admin/stats — Executive Business Telemetry counts
app.get('/api/admin/stats', isAdmin, async (req, res) => {
    try {
        // Utilize Supabase native exact counters for sub-millisecond dashboard loading
        const [
            { count: userCount, error: errU },
            { count: courseCount, error: errC },
            { data: orders, error: errO }
        ] = await Promise.all([
            supabaseAdmin.from('users').select('id', { count: 'exact', head: true }),
            supabaseAdmin.from('courses').select('id', { count: 'exact', head: true }),
            supabaseAdmin.from('pending_orders').select('total_paid')
        ]);

        if (errU || errC || errO) throw (errU || errC || errO);

        const revenue = (orders || []).reduce((acc, item) => acc + parseFloat(item.total_paid || 0), 0);
        
        res.status(200).json({
            total_students: userCount || 0,
            total_courses: courseCount || 0,
            total_pending_orders: (orders || []).length,
            total_revenue: revenue
        });
    } catch (error) {
        console.error('[admin-stats] Execution failed:', error.message);
        res.status(200).json({ total_students: 0, total_courses: 0, total_pending_orders: 0, total_revenue: 0 });
    }
});

// ========================================================
//       COMPREHENSIVE ADMIN INTERACTION & CRUD APIs
// ========================================================

// --- A. DETAILED COURSE MANAGEMENT ---
// 1. PUT /api/admin/courses/:id — Modify Course Data
app.put('/api/admin/courses/:id', isAdmin, async (req, res) => {
    const { title, price, status, duration_text, duration_days, description, thumbnail_url, icon, color, total_lessons } = req.body;
    try {
        const updates = {};
        
        if (title !== undefined) updates.title = title.trim();
        if (price !== undefined) updates.price = parseFloat(price) || 0;
        if (status !== undefined) updates.status = status.trim();
        if (duration_text !== undefined) updates.duration_text = duration_text.trim();
        if (duration_days !== undefined) updates.duration_days = parseInt(duration_days) || 365;
        
        if (description !== undefined) updates.description = description.trim();
        if (thumbnail_url !== undefined) updates.thumbnail_url = thumbnail_url.trim();
        if (icon !== undefined) updates.icon = icon.trim();
        if (color !== undefined) updates.color = color.trim();
        if (total_lessons !== undefined) updates.total_lessons = parseInt(total_lessons) || 0;
        
        if (Object.keys(updates).length === 0) return res.status(400).json({ success: false, message: 'No update data provided.' });
        
        const { error } = await db.from('courses')
            .update(updates)
            .eq('id', req.params.id);

        if (error) throw error;
        res.json({ success: true, message: 'Course updated successfully.' });
    } catch (error) {
        res.status(200).json({ success: false, message: 'Error updating course.', error: error.message });
    }
});

// --- B. LESSON MANAGEMENT CRUD ---
// 1. GET /api/admin/courses/:courseCode/lessons — Get all lessons
app.get('/api/admin/courses/:courseCode/lessons', isAdmin, async (req, res) => {
    try {
        const { data: lessons, error } = await db.from('lessons')
            .select('*')
            .eq('course_code', req.params.courseCode)
            .order('lesson_number', { ascending: true });

        if (error) throw error;
        res.json(lessons || []);
    } catch (error) {
        res.status(200).json([]);
    }
});

// 2. POST /api/admin/lessons — Create Lesson
app.post('/api/admin/lessons', isAdmin, async (req, res) => {
    const { course_code, lesson_number, title, video_url, duration } = req.body;
    try {
        const { error } = await db.from('lessons')
            .insert({
                course_code: course_code.trim(),
                lesson_number: parseInt(lesson_number) || 1,
                title: title.trim(),
                video_url: video_url.trim(),
                duration: duration || ''
            });

        if (error) throw error;
        res.json({ success: true, message: 'Lesson added successfully.' });
    } catch (error) {
        res.status(200).json({ success: false, error: error.message });
    }
});

// 3. PUT /api/admin/lessons/:id — Edit Lesson
app.put('/api/admin/lessons/:id', isAdmin, async (req, res) => {
    const { lesson_number, title, video_url, duration } = req.body;
    try {
        const updates = {};
        if (lesson_number !== undefined) updates.lesson_number = parseInt(lesson_number);
        if (title) updates.title = title.trim();
        if (video_url) updates.video_url = video_url.trim();
        if (duration) updates.duration = duration.trim();
        
        const { error } = await db.from('lessons')
            .update(updates)
            .eq('id', req.params.id);

        if (error) throw error;
        res.json({ success: true, message: 'Lesson updated successfully.' });
    } catch (error) {
        res.status(200).json({ success: false, error: error.message });
    }
});

// 4. DELETE /api/admin/lessons/:id — Remove Lesson
app.delete('/api/admin/lessons/:id', isAdmin, async (req, res) => {
    try {
        const { error } = await db.from('lessons')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;
        res.json({ success: true, message: 'Lesson removed.' });
    } catch (error) {
        res.status(200).json({ success: false });
    }
});

// --- C. ADVANCED USER CONTROL ---
// 1. PUT /api/admin/users/:id/status — Suspend/Activate account
app.put('/api/admin/users/:id/status', isAdmin, async (req, res) => {
    const { status } = req.body; // expected 'active' or 'suspended'
    try {
        const { error } = await db.from('users')
            .update({ status: status.trim() })
            .eq('id', req.params.id);

        if (error) throw error;
        res.json({ success: true, message: `Account status changed to ${status}.` });
    } catch (error) {
        res.status(200).json({ success: false, error: error.message });
    }
});

// 2. PUT /api/admin/users/:id/access — Update course clearance CSV + Enrollments Table
app.put('/api/admin/users/:id/access', isAdmin, async (req, res) => {
    const { access } = req.body; // CSV list e.g. "1,2"
    try {
        // Update main user CSV list
        const { error: updateErr } = await db.from('users')
            .update({ access: access.trim() })
            .eq('id', req.params.id);

        if (updateErr) throw updateErr;
        
        // Extract Email
        const { data: userRow, error: selErr } = await db.from('users')
            .select('email')
            .eq('id', req.params.id)
            .maybeSingle();

        if (selErr) throw selErr;

        if (userRow) {
            const email = userRow.email;
            const ids = access.split(',').map(s => s.trim()).filter(Boolean);
            
            // Re-sync relational enrollments
            await db.from('enrollments')
                .delete()
                .eq('user_email', email);

            for (const cid of ids) {
                // PostgreSQL upsert logic allows batch or individual inserts safely
                await db.from('enrollments')
                    .upsert({ user_email: email, course_code: cid }, { onConflict: 'user_email,course_code' });
            }
        }
        res.json({ success: true, message: 'Clearance list updated and relational indexes synchronized.' });
    } catch (error) {
        res.status(200).json({ success: false, error: error.message });
    }
});

// --- D. HANDNOTES MANAGEMENT CRUD ---
// 1. POST /api/admin/handnotes — Add Hand Note
app.post('/api/admin/handnotes', isAdmin, async (req, res) => {
    const { course_code, title, filename } = req.body;
    try {
        const { error } = await db.from('hand_notes')
            .insert({
                course_code: course_code || null,
                title: title.trim(),
                file_url: filename.trim()
            });

        if (error) throw error;
        res.json({ success: true, message: 'Handnote cataloged.' });
    } catch (error) {
        res.status(200).json({ success: false, error: error.message });
    }
});

// 2. PUT /api/admin/handnotes/:id — Edit Hand Note
app.put('/api/admin/handnotes/:id', isAdmin, async (req, res) => {
    const { course_code, title, filename } = req.body;
    try {
        const updates = {};
        if (course_code !== undefined) updates.course_code = course_code;
        if (title) updates.title = title.trim();
        if (filename) updates.file_url = filename.trim();
        
        const { error } = await db.from('hand_notes')
            .update(updates)
            .eq('id', req.params.id);

        if (error) throw error;
        res.json({ success: true, message: 'Handnote modified.' });
    } catch (error) {
        res.status(200).json({ success: false, error: error.message });
    }
});

// 3. DELETE /api/admin/handnotes/:id — Remove Hand Note
app.delete('/api/admin/handnotes/:id', isAdmin, async (req, res) => {
    try {
        const { error } = await db.from('hand_notes')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;
        res.json({ success: true, message: 'Handnote expunged.' });
    } catch (error) {
        res.status(200).json({ success: false });
    }
});

// ========================================================
//   E. SECURE CLASSROOM PIPELINE & ACCESS EXPIRATION CHECK
// ========================================================
// POST /api/classroom/:courseId — Dynamic authorization checks + auto-expire logic
app.post('/api/classroom/:courseId', async (req, res) => {
    const { courseId } = req.params;
    const { email } = req.body;
    
    if (!email) {
        return res.status(401).json({ success: false, message: 'Authentication email payload required for secure classrooms.' });
    }
    
    try {
        // 1. Check suspension status
        const { data: user, error: userErr } = await db.from('users')
            .select('access, status')
            .eq('email', email.trim())
            .maybeSingle();

        if (userErr) throw userErr;

        if (!user) {
            return res.status(403).json({ success: false, message: 'User registration records not found.' });
        }
        if (user.status === 'suspended') {
            return res.status(403).json({ success: false, message: 'Your student account has been suspended. Contact Support.' });
        }
        
        // 2. RELIABLE AUTHORIZATION: Validate user access from CSV string in Supabase users table
        const accessArray = (user.access || '').split(',').map(s => s.trim().toUpperCase());
        if (!accessArray.includes(courseId.trim().toUpperCase())) {
            return res.status(403).json({ success: false, message: 'Curriculum locked. Access record not found.' });
        }

        // 3. Optionally retrieve relational enrollment if exists to compute expiration
        let enrollment = null;
        try {
            const { data: enrData, error: enrErr } = await db.from('enrollments')
                .select('enrolled_at')
                .eq('user_email', email.trim())
                .eq('course_code', courseId.trim())
                .maybeSingle();
            if (!enrErr) {
                enrollment = enrData;
            } else {
                console.warn(`[Classroom Warning] Access granted via access string, but relational enrollment check bypassed: ${enrErr.message}`);
            }
        } catch (err) {
            console.warn(`[Classroom Warning] Enrollment table missing or inaccessible: ${err.message}`);
        }
        
        // 4. Fetch Course Expire Threshold
        const { data: courseMeta, error: metaErr } = await db.from('courses')
            .select('duration_days, title, icon, description')
            .eq('course_code', courseId.trim())
            .maybeSingle();

        if (metaErr) throw metaErr;
        
        if (courseMeta && enrollment) {
            const daysAllowed = courseMeta.duration_days || 365;
            const enrolledAt = new Date(enrollment.enrolled_at);
            const now = new Date();
            
            // Calculate elapsed calendar time
            const diffMs = now - enrolledAt;
            const elapsedDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            
            if (elapsedDays > daysAllowed) {
                // CRITICAL LOCKOUT TRIGGERED: User exceeded days allowed!
                // A. Remove relational record
                await db.from('enrollments')
                    .delete()
                    .eq('user_email', email.trim())
                    .eq('course_code', courseId.trim());
                
                // B. Remove from users.access CSV
                const currentAccess = user.access || '';
                const updatedCsv = currentAccess.split(',')
                    .map(s => s.trim())
                    .filter(s => s && s !== courseId.trim())
                    .join(',');

                await db.from('users')
                    .update({ access: updatedCsv })
                    .eq('email', email.trim());
                
                return res.status(403).json({ 
                    success: false, 
                    message: `Your enrollment in this course has expired (Limit: ${daysAllowed} days). Access revoked.` 
                });
            }
        }
        
        // 4. Authorized! Assemble lessons payload
        const { data: lessons, error: lesErr } = await db.from('lessons')
            .select('title, duration, video_url')
            .eq('course_code', courseId.trim())
            .order('lesson_number', { ascending: true });

        if (lesErr) throw lesErr;
        
        // Recover handnote if associated
        const { data: handnote, error: noteErr } = await db.from('hand_notes')
            .select('file_url')
            .eq('course_code', courseId.trim())
            .limit(1)
            .maybeSingle();

        // Support direct cloud URLs as well as backward-compatible legacy local refs
        let noteLink = null;
        const recoveredFilename = handnote?.file_url || handnote?.filename;
        if (recoveredFilename) {
            noteLink = recoveredFilename.includes('http') ? recoveredFilename : `/api/handnotes/${recoveredFilename}`;
        }
        
        // Responds formatting lessons payload for dynamic injection
        const mappedLessons = (lessons || []).map(l => ({
            title: l.title,
            duration: l.duration,
            video: l.video_url
        }));

        res.json({
            success: true,
            course: {
                title: courseMeta ? courseMeta.title : 'Secure Curriculum',
                lessons: mappedLessons,
                handnote: noteLink
            }
        });
        
    } catch (error) {
        res.status(500).json({ success: false, message: 'Security gate runtime failure.', error: error.message });
    }
});

// ========================================================
//          F. DYNAMIC BINARY ASSET UPLOAD SYSTEM
// ========================================================

// POST /api/admin/upload/handnotes — Special Combined Endpoint for Handnote Storage & Database Sync
app.post('/api/admin/upload/handnotes', isAdmin, upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No PDF file selected for upload.' });
    }
    
    const { course_code, title } = req.body;
    
    try {
        const supabase = supabaseAdmin; // Standardize variable mapping to administrative client
        
        // 1. Clean & Generate Unique Filename
        const ext = path.extname(req.file.originalname);
        const sanitizedBase = path.basename(req.file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
        const uniqueFilename = `${Date.now()}_${sanitizedBase}${ext}`;
        
        // 2. Upload raw Buffer to 'handnotes' bucket
        const { data: uploadData, error: uploadErr } = await supabase.storage
            .from('handnotes') // EXACT user-requested bucket name
            .upload(uniqueFilename, req.file.buffer, {
                contentType: req.file.mimetype || 'application/pdf',
                cacheControl: '3600',
                upsert: false
            });
            
        if (uploadErr) {
            console.log('Upload Error Details:', uploadErr); // Explicit user requested logger
            throw uploadErr;
        }
        
        // 3. Retrieve Public URL
        const { data: publicUrlData } = supabase.storage
            .from('handnotes')
            .getPublicUrl(uniqueFilename);
            
        const finalPublicUrl = publicUrlData?.publicUrl;
        if (!finalPublicUrl) {
            throw new Error('Failed to extract absolute Public URL from Cloud Storage.');
        }
        
        // 4. Directly insert into the 'hand_notes' database table
        const { error: dbErr } = await supabase.from('hand_notes')
            .insert({
                course_code: course_code || null,
                title: (title || sanitizedBase).trim(),
                file_url: finalPublicUrl // Store full Cloud URL in 'file_url'
            });
            
        if (dbErr) {
            console.log('Upload Error Details:', dbErr);
            throw dbErr;
        }
        
        res.json({
            success: true,
            message: 'PDF asset successfully written to Supabase and cataloged in database.',
            data: {
                url: finalPublicUrl,
                filename: uniqueFilename
            }
        });
        
    } catch (error) {
        console.log('Upload Error Details:', error); // EXACT requested logger
        res.status(500).json({
            success: false,
            message: 'Failed to synchronize binary assets to Supabase Cloud Storage.',
            error: error.message
        });
    }
});

// POST /api/admin/upload/:category — Secure gateway writing to subfolders (courses, workshops, handnotes)
app.post('/api/admin/upload/:category', isAdmin, dynamicUpload, (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file selected for upload.' });
    }
    
    const fileUri = req.file.publicUrl || req.file.filename;
    
    res.json({
        success: true,
        message: 'Static binary synchronized directly to Cloud Supabase Storage.',
        data: {
            filename: req.file.filename,
            originalName: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            url: fileUri
        }
    });
});

// ========================================================
//     G. WORKSHOPS & INTEGRATED NOTIFICATION ENGINES
// ========================================================

// --- 1. ADMIN WORKSHOP MANAGEMENT ---
// A. POST /api/admin/workshops — Provision Workshop (Ingests Multipart OR Standard JSON)
app.post('/api/admin/workshops', isAdmin, dynamicUpload, async (req, res) => {
    let imageUrl = req.body.image_url || null;
    if (req.file && req.file.publicUrl) {
        imageUrl = req.file.publicUrl;
    }
    
    const { title, description, workshop_date, meeting_link, status } = req.body;
    
    if (!title) {
        return res.status(400).json({ success: false, message: 'Core mandatory parameter missing: title is required.' });
    }
    
    try {
        const { data: result, error } = await db.from('workshops')
            .insert({
                title: title.trim(),
                description: description || '',
                image_url: imageUrl,
                workshop_date: workshop_date || null,
                meeting_link: meeting_link || '',
                status: status || 'active'
            })
            .select('id')
            .single();

        if (error) throw error;

        res.status(201).json({
            success: true,
            message: 'Workshop registered and active.',
            id: result.id
        });
    } catch (error) {
        res.status(200).json({ success: false, message: 'PostgreSQL serialization fail.', error: error.message });
    }
});

// B. PUT /api/admin/workshops/:id — Patch Workshop Elements
app.put('/api/admin/workshops/:id', isAdmin, dynamicUpload, async (req, res) => {
    const { id } = req.params;
    const { title, description, workshop_date, meeting_link, status, recording_url } = req.body;
    
    let imageUrl = req.body.image_url;
    if (req.file && req.file.publicUrl) {
        imageUrl = req.file.publicUrl;
    }
    
    try {
        const updates = {};
        
        if (title) updates.title = title.trim();
        if (description !== undefined) updates.description = description;
        if (workshop_date !== undefined) updates.workshop_date = workshop_date || null;
        if (meeting_link !== undefined) updates.meeting_link = meeting_link;
        if (status) updates.status = status.trim();
        if (imageUrl) updates.image_url = imageUrl;
        if (recording_url !== undefined) updates.recording_url = recording_url;
        
        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ success: false, message: 'No modifiable data payload received.' });
        }
        
        const { error } = await db.from('workshops')
            .update(updates)
            .eq('id', id);

        if (error) throw error;
        res.json({ success: true, message: 'Workshop configuration rewritten successfully.' });
    } catch (error) {
        res.status(200).json({ success: false, error: error.message });
    }
});

// C. DELETE /api/admin/workshops/:id — Expunge Workshop & Registry
app.delete('/api/admin/workshops/:id', isAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        await db.from('workshop_registrations')
            .delete()
            .eq('workshop_id', id);

        const { error } = await db.from('workshops')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.json({ success: true, message: 'Workshop records and associated indices expunged.' });
    } catch (error) {
        res.status(200).json({ success: false, error: error.message });
    }
});

// --- 2. PUBLIC WORKSHOP PORTALS ---
// GET /api/workshops — Expose active workshops
app.get('/api/workshops', async (req, res) => {
    try {
        const { data: list, error } = await db.from('workshops')
            .select('id, title, description, image_url, workshop_date, status')
            .eq('status', 'active')
            .order('workshop_date', { ascending: true });

        if (error) throw error;
        res.json({ success: true, data: list || [] });
    } catch (error) {
        res.status(200).json({ success: false, data: [] });
    }
});

// GET /api/workshops/archives — Expose historical archived webinars with recording links
app.get('/api/workshops/archives', async (req, res) => {
    try {
        const { data: list, error } = await db.from('workshops')
            .select('id, title, description, image_url, workshop_date, recording_url, status')
            .eq('status', 'archived')
            .order('workshop_date', { ascending: false });

        if (error) throw error;
        res.json({ success: true, data: list || [] });
    } catch (error) {
        res.status(200).json({ success: false, data: [] });
    }
});

// GET /api/workshops/all — Public route to fetch all workshops (Active & Archived)
app.get('/api/workshops/all', async (req, res) => {
  try {
    const supabase = db; // Standardize client variable context
    const { data, error } = await supabase
      .from('workshops')
      .select('*')
      .order('id', { ascending: false });
    
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error('Error fetching workshops:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/cron/workshop-reminders — Secure automated transactional cron for upcoming sessions
app.get('/api/cron/workshop-reminders', async (req, res) => {
    // 1. Perimeter Security Check
    if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
        console.warn('⚠️ [Cron Unauthorized Attempt]: Invalid authorization header token.');
        return res.status(401).end();
    }

    try {
        const supabase = db;
        const now = new Date();
        const windowStart = new Date(now.getTime() + 30 * 60 * 1000); // +30 Minutes
        const windowEnd = new Date(now.getTime() + 35 * 60 * 1000);   // +35 Minutes

        // 2. Query workshops scheduled in the next 30 to 35 minutes
        const { data: approachingWorkshops, error: wsErr } = await supabase
            .from('workshops')
            .select('*')
            .gte('workshop_date', windowStart.toISOString())
            .lte('workshop_date', windowEnd.toISOString());

        if (wsErr) throw wsErr;

        if (!approachingWorkshops || approachingWorkshops.length === 0) {
            return res.json({ success: true, message: 'No active sessions detected in the 30-35 minute cron window.', sentCount: 0 });
        }

        const adminEmail = 'arupbhowmikpritom@gmail.com';
        const systemEmail = process.env.SMTP_USER || process.env.FROM_EMAIL || adminEmail;
        let dispatchedCount = 0;

        // 3. Dispatch transactional clusters sequentially
        for (const ws of approachingWorkshops) {
            // Locate all users with unfulfilled notifications
            const { data: registrations, error: regErr } = await supabase
                .from('workshop_registrations')
                .select('*')
                .eq('workshop_id', ws.id)
                .eq('reminder_sent', false);

            if (regErr) {
                console.error(`❌ [Cron DB Trace] Error reading attendees for workshop ${ws.id}:`, regErr.message);
                continue;
            }

            if (!registrations || registrations.length === 0) continue;

            // Parse time for email injection
            const eventTime = new Date(ws.workshop_date).toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                timeZoneName: 'short'
            });

            for (const record of registrations) {
                try {
                    const mailOptions = {
                        from: `"Code With Pritom Academy" <${systemEmail}>`,
                        to: record.email.trim(),
                        replyTo: adminEmail,
                        subject: `⏰ Starting in 30 Mins: ${ws.title}`,
                        html: `
                            <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; color: #1e293b;">
                                <div style="text-align: center; margin-bottom: 20px;">
                                    <span style="font-size: 36px;">⏰</span>
                                </div>
                                <h2 style="text-align: center; color: #ea580c; font-size: 22px; font-weight: 800; margin-bottom: 10px;">Session Starting Shortly!</h2>
                                <p style="text-align: center; font-size: 15px; color: #64748b; margin-bottom: 30px;">Your secured masterclass is commencing in approximately 30 minutes.</p>
                                
                                <div style="background-color: #f8fafc; border: 1px solid #f1f5f9; padding: 24px; border-radius: 12px; margin-bottom: 30px;">
                                    <h3 style="margin: 0 0 12px 0; color: #0f172a; font-size: 18px; font-weight: 700; line-height: 1.4;">${ws.title}</h3>
                                    <p style="margin: 0 0 8px 0; font-size: 14px; color: #334155;"><strong>📅 Start Time:</strong> ${eventTime}</p>
                                    <p style="margin: 0 0 16px 0; font-size: 14px; color: #334155;"><strong>🔗 Secure Gate:</strong> Join directly via the official meeting gateway below.</p>
                                    
                                    <div style="margin-top: 20px; text-align: center;">
                                        <a href="${ws.meeting_link || '#'}" target="_blank" style="display: inline-block; background-color: #ea580c; color: #ffffff; font-weight: 700; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; box-shadow: 0 4px 6px -1px rgba(234, 88, 12, 0.2);">
                                            🚀 Enter Webinar Gateway
                                        </a>
                                    </div>
                                </div>
                                
                                <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 25px 0;" />
                                <p style="text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.5;">
                                    © ${new Date().getFullYear()} Code With Pritom Academy. This is a transactional notification.<br/>
                                    You received this because you secured a seat for this session.
                                </p>
                            </div>
                        `
                    };

                    // Deliver Payload
                    await transporter.sendMail(mailOptions);

                    // Update Index Vector in DB to prevent re-sending
                    const { error: upErr } = await supabase
                        .from('workshop_registrations')
                        .update({ reminder_sent: true })
                        .eq('id', record.id);

                    if (upErr) console.error(`⚠️ [Cron DB Error] Failed to update flag for registration ID ${record.id}:`, upErr.message);

                    dispatchedCount++;
                } catch (emailErr) {
                    console.error(`❌ [Cron Dispatch failure] Unable to deliver mail to ${record.email}:`, emailErr.message);
                }
            }
        }

        res.json({ success: true, message: 'Reminder notifications workflow completed successfully.', sentCount: dispatchedCount });

    } catch (err) {
        console.error('❌ [CRITICAL CRON FAILURE /api/cron/workshop-reminders]:', err);
        res.status(500).json({ success: false, message: 'Internal System Engine Drift', error: err.message });
    }
});

// POST /api/workshops/access-resource — Secure resource distributor for logged in attendees
// POST /api/workshops/access-resource — Secure resource distributor for logged in attendees
app.post('/api/workshops/access-resource', async (req, res) => {
    const { workshopId, workshop_id, email } = req.body;
    const finalWorkshopId = workshopId || workshop_id;

    if (!finalWorkshopId || !email) {
        return res.status(400).json({ success: false, message: 'Required payload parameters missing: email and workshopId.' });
    }

    try {
        // 1. Identity Level Assessment (Admin ByPass Authorization check)
        const { data: userRec, error: userErr } = await db.from('users')
            .select('role')
            .eq('email', email.trim())
            .maybeSingle();

        const isAdminByPass = (userRec && userRec.role === 'admin');

        if (!isAdminByPass) {
            // 2. Standard User Workflow: Validate and Auto-Register if absent
            const { data: registration, error: regErr } = await db.from('workshop_registrations')
                .select('id')
                .eq('workshop_id', String(finalWorkshopId))
                .eq('email', email.trim())
                .maybeSingle();

            if (regErr) throw regErr;

            if (!registration) {
                // On-The-Fly Auto-Seat Provisioning for frictionless entry
                const { error: inErr } = await db.from('workshop_registrations')
                    .insert({
                        workshop_id: String(finalWorkshopId),
                        email: email.trim()
                    });
                if (inErr) throw inErr;
            }
        }

        // 3. Fetch linked resource assets
        const { data: workshop, error: wsErr } = await db.from('workshops')
            .select('meeting_link, recording_url, status')
            .eq('id', parseInt(finalWorkshopId))
            .maybeSingle();

        if (wsErr) throw wsErr;

        if (!workshop) {
            return res.status(404).json({ success: false, message: 'Workshop asset expired or missing.' });
        }

        // 4. Deliver specific assets based on event lifecycle status
        res.json({
            success: true,
            registered: true,
            status: workshop.status,
            meeting_link: workshop.status === 'active' ? workshop.meeting_link : null,
            recording_url: workshop.status === 'archived' ? workshop.recording_url : null
        });
    } catch (error) {
        console.error('[POST /api/workshops/access-resource] Retrieval failed:', error.message);
        res.status(500).json({ success: false, message: 'Resource distribution fail.', error: error.message });
    }
});


// ========================================================
//                COUPON PROMOTIONAL ENGINE
// ========================================================

// 1. ADMIN CRUD GATEWAYS (Protected by Super Admin Credentials)
// POST /api/admin/coupons — Instantiate promotional promo code
app.post('/api/admin/coupons', isAdmin, async (req, res) => {
    const { coupon_name, course_code, discount_type, discount_value, expires_at, min_purchase, usage_limit } = req.body;
    if (!coupon_name || discount_value === undefined) {
        return res.status(400).json({ success: false, message: 'Coupon Name and Discount Value are mandatory fields.' });
    }
    try {
        const { error } = await db.from('coupons')
            .insert({
                code: coupon_name.trim().toUpperCase(), 
                course_code: course_code || null, 
                discount_type: discount_type || 'percentage',
                discount_value: parseFloat(discount_value) || 0,
                expiry_date: expires_at || null, 
                min_cart_value: parseFloat(min_purchase) || 0,
                usage_limit: usage_limit ? parseInt(usage_limit) : null,
                status: 'active'
            });

        if (error) throw error;
        res.status(201).json({ success: true, message: 'New promotional coupon indexed successfully.' });
    } catch (error) {
        console.error('[POST coupon] DB Collision:', error.message);
        res.status(200).json({ success: false, message: 'Database indexing conflict.', error: error.message });
    }
});

// GET /api/admin/coupons — Extract comprehensive master promo catalog
app.get('/api/admin/coupons', isAdmin, async (req, res) => {
    try {
        const { data: list, error } = await db.from('coupons')
            .select('*')
            .order('id', { ascending: false }); // Safely order by primary key to prevent column missing crash

        if (error) throw error;

        // Seamlessly serialize dataset back into legacy formats to prevent breaking frontend UI
        const serializedData = (list || []).map(row => ({
            id: row.id,
            coupon_name: row.code,
            course_code: row.course_code,
            discount_type: row.discount_type,
            discount_value: row.discount_value,
            discount_percent: row.discount_type === 'percentage' ? row.discount_value : 0,
            min_purchase: row.min_cart_value,
            usage_limit: row.usage_limit,
            usage_count: row.usage_count || 0,
            expires_at: row.expiry_date,
            is_active: row.status === 'active',
            created_at: row.created_at || new Date().toISOString() // Safe date fallback
        }));

        res.json({ success: true, data: serializedData });
    } catch (error) {
        console.error('[GET coupons] Fetch fail:', error.message);
        res.status(200).json({ success: false, data: [] });
    }
});

// PUT /api/admin/coupons/:id — Revise configurations or Suspend/Activate Coupon
app.put('/api/admin/coupons/:id', isAdmin, async (req, res) => {
    const { id } = req.params;
    const { coupon_name, course_code, discount_type, discount_value, is_active, expires_at, min_purchase, usage_limit } = req.body;
    try {
        const updates = {};

        if (coupon_name !== undefined) updates.code = coupon_name.trim().toUpperCase();
        if (course_code !== undefined) updates.course_code = course_code || null;
        if (discount_type !== undefined) updates.discount_type = discount_type;
        if (discount_value !== undefined) updates.discount_value = parseFloat(discount_value) || 0;
        if (is_active !== undefined) updates.status = is_active ? 'active' : 'inactive';
        if (expires_at !== undefined) updates.expiry_date = expires_at || null;
        if (min_purchase !== undefined) updates.min_cart_value = parseFloat(min_purchase) || 0;
        if (usage_limit !== undefined) updates.usage_limit = usage_limit ? parseInt(usage_limit) : null;

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ success: false, message: 'No payload edits received.' });
        }

        const { error } = await db.from('coupons')
            .update(updates)
            .eq('id', id);

        if (error) throw error;
        res.json({ success: true, message: 'Coupon configurations rewritten successfully.' });
    } catch (error) {
        console.error('[PUT coupon] Revision crash:', error.message);
        res.status(200).json({ success: false, message: 'Revision aborted.', error: error.message });
    }
});

// DELETE /api/admin/coupons/:id — Permanently expunge promo coupon
app.delete('/api/admin/coupons/:id', isAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const { error } = await db.from('coupons')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.json({ success: true, message: 'Promo code permanently expunged from system registries.' });
    } catch (error) {
        res.status(200).json({ success: false, error: error.message });
    }
});

// 2. PUBLIC CART UTILITIES (Open Validators)
// POST /api/coupons/validate — Validate and apply deductions
app.post('/api/coupons/validate', async (req, res) => {
    const { code, cartTotal, courseCode } = req.body;
    if (!code || cartTotal === undefined) {
        return res.status(400).json({ success: false, valid: false, message: 'Required parameters missing: code and cartTotal.' });
    }

    try {
        const { data: rows, error } = await db.from('coupons')
            .select('*')
            .eq('code', code.trim().toUpperCase());

        if (error) throw error;

        if (!rows || rows.length === 0) {
            return res.json({ valid: false, message: 'This promotional code is invalid.' });
        }

        const coupon = rows[0];

        // 1. Check Activation State (status must be 'active')
        if (coupon.status !== 'active') {
            return res.json({ valid: false, message: 'This coupon code has been suspended.' });
        }

        // 2. Check Usage Limit Clamp
        if (coupon.usage_limit !== null && coupon.usage_limit !== undefined) {
            const limit = parseInt(coupon.usage_limit);
            const count = parseInt(coupon.usage_count || 0);
            if (limit > 0 && count >= limit) {
                return res.json({ valid: false, message: 'This coupon has reached its maximum global usage limit.' });
            }
        }

        // 3. Check Expiry Date Limits (expiry_date)
        if (coupon.expiry_date) {
            const expiry = new Date(coupon.expiry_date);
            if (expiry < new Date()) {
                return res.json({ valid: false, message: 'This promotional code has expired.' });
            }
        }

        // 4. Check Minimum Cart Value (min_cart_value)
        const minReq = parseFloat(coupon.min_cart_value || 0);
        const total = parseFloat(cartTotal);
        if (total < minReq) {
            return res.json({ valid: false, message: `Total cart value must be at least $${minReq.toFixed(2)} to trigger this offer.` });
        }

        // 5. Check Course Isolation Limits (if restricted)
        if (coupon.course_code && courseCode && coupon.course_code !== courseCode) {
            return res.json({ valid: false, message: 'This code is not applicable to the selected items.' });
        }

        // 6. Apply Dynamic Deductions
        const discType = coupon.discount_type || 'percentage';
        const rawVal = parseFloat(coupon.discount_value || 0);
        
        let discountAmount = 0;
        if (discType === 'fixed') {
            discountAmount = parseFloat(rawVal.toFixed(2));
        } else {
            // Percentage
            discountAmount = parseFloat(((total * rawVal) / 100).toFixed(2));
        }

        // Prevent Negative Totals
        if (discountAmount > total) discountAmount = total;

        const finalTotal = parseFloat((total - discountAmount).toFixed(2));

        res.json({
            valid: true,
            discountType: discType,
            discountValue: rawVal,
            discountAmount: discountAmount,
            finalTotal: finalTotal,
            message: `Applied! Enjoy ${discType === 'percentage' ? rawVal + '%' : '৳' + rawVal} markdown off your final total.`
        });
    } catch (error) {
        res.status(200).json({ valid: false, message: 'Internal calculation fault.', error: error.message });
    }
});

// A. POST /api/workshops/register — Guest Registration Entry
app.post('/api/workshops/register', async (req, res) => {
    const { workshop_id, email } = req.body;
    if (!workshop_id || !email) {
        return res.status(400).json({ success: false, message: 'Missing required identifiers: workshop_id and email.' });
    }
    
    try {
        // Retrieve detailed workshop context to dynamically populate confirmation mail
        const { data: workshop, error: wsErr } = await db.from('workshops')
            .select('title, workshop_date')
            .eq('id', workshop_id)
            .maybeSingle();

        if (wsErr) throw wsErr;

        if (!workshop) {
            return res.status(404).json({ success: false, message: 'Selected workshop event does not exist.' });
        }
        
        const { data: existing, error: exErr } = await db.from('workshop_registrations')
            .select('id')
            .eq('workshop_id', workshop_id)
            .eq('email', email.trim())
            .maybeSingle();

        if (exErr) throw exErr;

        if (existing) {
            return res.json({ success: true, message: 'Account registration already verified.', alreadyRegistered: true });
        }
        
        const { error: inErr } = await db.from('workshop_registrations')
            .insert({
                workshop_id: workshop_id,
                email: email.trim()
            });

        if (inErr) throw inErr;

        // === AUTOMATED WORKSHOP CONFIRMATION EMAIL SYSTEM ===
        let emailDispatched = false;
        try {
            const adminEmail = 'arupbhowmikpritom@gmail.com';
            const systemEmail = process.env.SMTP_USER || process.env.FROM_EMAIL || adminEmail;
            const workshopTitle = workshop.title || 'LMS Workshop Event';
            const workshopDate = workshop.workshop_date || 'Check Calendar';

            const mailOptions = {
                from: `"Code With Pritom Academy" <${systemEmail}>`,
                to: email.trim(),
                bcc: adminEmail, // Discreetly alert admin matrix of new enrollment
                replyTo: adminEmail,
                subject: `✅ Registration Confirmed: [${workshopTitle}]`,
                html: `
                    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);">
                        <div style="background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%); color: white; padding: 35px 25px; text-align: center;">
                            <div style="font-size: 45px; margin-bottom: 15px; display: inline-block;">🎟️</div>
                            <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.01em; text-transform: uppercase;">Registration Confirmed!</h1>
                            <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 14px;">Your seat has been successfully locked for the session.</p>
                        </div>
                        <div style="padding: 32px 28px; line-height: 1.6; color: #334155;">
                            <h3 style="margin-top: 0; color: #0f172a; font-size: 15px; font-weight: 800; text-transform: uppercase; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px; letter-spacing: 0.025em;">Event Particulars</h3>
                            
                            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                                <tr>
                                    <td style="padding: 10px 0; color: #64748b; font-size: 13px; font-weight: 600; width: 110px; vertical-align: top;">Workshop:</td>
                                    <td style="padding: 10px 0; color: #0f172a; font-size: 15px; font-weight: 700;">${workshopTitle}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px 0; color: #64748b; font-size: 13px; font-weight: 600; vertical-align: top;">Date / Time:</td>
                                    <td style="padding: 10px 0; color: #0f172a; font-size: 15px; font-weight: 600;">${workshopDate}</td>
                                </tr>
                            </table>

                            <div style="background-color: #fdf8f6; border: 1px dashed #f5d0c5; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px;">
                                <p style="margin-top: 0; color: #c2410c; font-weight: 700; font-size: 13px; text-transform: uppercase; margin-bottom: 8px;">Join Routine</p>
                                <p style="font-size: 14px; color: #431407; margin-bottom: 16px;">Access resources, download exercise files, and join the live broadcast via your direct workshops dashboard.</p>
                                <a href="https://codewithpritom.academy/workshops.html" style="display: inline-block; background-color: #ea580c; color: white !important; padding: 12px 25px; border-radius: 6px; text-decoration: none; font-weight: 700; font-size: 13px;">Open Live Workshops Panel</a>
                            </div>

                            <p style="color: #475569; font-size: 14px; margin-bottom: 20px;">We look forward to seeing you at the session!</p>
                            <p style="margin-bottom: 0; color: #0f172a; font-size: 14px; font-weight: 700;">Best regards,<br/><span style="color: #ea580c;">Code With Pritom Academy</span></p>
                        </div>
                        <div style="background-color: #f8fafc; border-top: 1px solid #f1f5f9; padding: 18px 25px; text-align: center; font-size: 11px; color: #94a3b8;">
                            Automated transactional notification from Code With Pritom LMS.<br/>
                            © ${new Date().getFullYear()} Code With Pritom. All rights reserved.
                        </div>
                    </div>
                `
            };

            await transporter.sendMail(mailOptions);
            emailDispatched = true;
        } catch (mailErr) {
            console.error('❌ [Nodemailer Workshop Registry Error]:', mailErr.message);
            // Swallowed deliberately: registration persists even if SMTP is congested
        }

        if (emailDispatched) {
            res.status(201).json({ success: true, message: 'Registration committed. Confirmation email dispatched!' });
        } else {
            res.status(201).json({ success: true, message: 'Registered successfully, but confirmation email failed to send.' });
        }

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// B. POST /api/workshops/check-access — Dynamic link gatekeeper
app.post('/api/workshops/check-access', async (req, res) => {
    const { workshop_id, email } = req.body;
    if (!workshop_id || !email) {
        return res.status(400).json({ success: false, message: 'Auth payload incomplete.' });
    }
    
    try {
        const { data: record, error: recErr } = await db.from('workshop_registrations')
            .select('id')
            .eq('workshop_id', workshop_id)
            .eq('email', email.trim())
            .maybeSingle();

        if (recErr) throw recErr;
        
        if (!record) {
            return res.status(403).json({ success: false, message: 'Access Denied. Email not registered for this event.' });
        }
        
        const { data: workshop, error: wsErr } = await db.from('workshops')
            .select('meeting_link, title')
            .eq('id', workshop_id)
            .maybeSingle();

        if (wsErr) throw wsErr;

        if (!workshop) {
            return res.status(404).json({ success: false, message: 'Event expired or dropped.' });
        }
        
        res.json({
            success: true,
            message: 'Identity verified.',
            meeting_link: workshop.meeting_link
        });
    } catch (error) {
        console.error('[FATAL ERROR /api/workshops/check-access]:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error', debug: error.message });
    }
});

// --- 3. SYSTEM NOTIFICATIONS CENTRAL ---
// A. POST /api/admin/notifications — Send Announcement
app.post('/api/admin/notifications', isAdmin, async (req, res) => {
    const { user_email, message, link } = req.body;
    if (!message) {
        return res.status(400).json({ success: false, message: 'Notification message text body required.' });
    }
    
    try {
        const { error } = await db.from('notifications')
            .insert({
                user_email: user_email || 'all',
                message: message.trim(),
                link: link || null,
                is_read: 0
            });

        if (error) throw error;
        res.status(201).json({ success: true, message: 'Notification broadcast queued.' });
    } catch (error) {
        res.status(200).json({ success: false, error: error.message });
    }
});

// B. GET /api/notifications — Fetch Active Feed for User
app.get('/api/notifications', async (req, res) => {
    const email = req.headers['x-user-email'] || req.query.email;
    
    try {
        let query = db.from('notifications')
            .select('id, user_email, message, link, is_read, created_at')
            .eq('is_read', 0)
            .order('id', { ascending: false });

        if (email) {
            query = query.or(`user_email.eq.${email.trim()},user_email.eq.all`);
        } else {
            query = query.eq('user_email', 'all');
        }

        const { data: list, error } = await query;

        if (error) throw error;
        res.json(list || []);
    } catch (error) {
        res.status(200).json([]);
    }
});

// C. PUT /api/notifications/read — Mark single or batch read
app.put('/api/notifications/read', async (req, res) => {
    const { notification_id, email } = req.body;
    try {
        if (notification_id) {
            const { error } = await db.from('notifications')
                .update({ is_read: 1 })
                .eq('id', notification_id);
            if (error) throw error;
        } else if (email) {
            const { error } = await db.from('notifications')
                .update({ is_read: 1 })
                .eq('user_email', email.trim());
            if (error) throw error;
        } else {
            return res.status(400).json({ success: false, message: 'Specify notification_id or user email block.' });
        }
        res.json({ success: true, message: 'Read status state patched successfully.' });
    } catch (error) {
        res.status(200).json({ success: false, error: error.message });
    }
});

// D. DELETE /api/notifications/clear — User Clears Personal Notification History
app.delete('/api/notifications/clear', isLoggedIn, async (req, res) => {
    const email = req.headers['x-user-email'] || req.query.email;
    if (!email) {
        return res.status(400).json({ success: false, message: 'Email header identifier required to target clearance.' });
    }

    try {
        const { error } = await db.from('notifications')
            .delete()
            .eq('user_email', email.trim());

        if (error) throw error;
        res.json({ success: true, message: 'Notification logs successfully expunged.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Purge operations failed.', error: error.message });
    }
});

// ========================================================
//               📣 SUPER BROADCAST SYSTEM
// ========================================================

// 1. GET /api/announcements/active — Public fetch of active broadcast
app.get('/api/announcements/active', async (req, res) => {
    try {
        const supabase = db;
        // Exact query as requested by the user
        const { data: list, error } = await supabase.from('announcements').select('*').eq('status', 'active').lte('start_date', new Date().toISOString()).gte('end_date', new Date().toISOString()).order('created_at', { ascending: false }).limit(1);
        
        if (error) throw error;
        
        if (!list || list.length === 0) {
            return res.json({});
        }
        
        res.json(list[0] || {});
    } catch (error) {
        console.error('[active announcement failure]:', error.message);
        res.json({});
    }
});

// 2. GET /api/admin/announcements — Fetch Admin listing
app.get('/api/admin/announcements', isAdmin, async (req, res) => {
    try {
        const { data: rows, error } = await db.from('announcements')
            .select('*')
            .order('id', { ascending: false });

        if (error) throw error;
        res.json({ success: true, count: (rows || []).length, data: rows || [] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch history logs.', error: error.message });
    }
});

// 3. POST /api/admin/announcements — Instantiate Fresh Broadcast Campaign
app.post('/api/admin/announcements', isAdmin, dynamicUpload, async (req, res) => {
    const { title, message, content, action_url, start_date, end_date, status } = req.body;
    
    // Accept content as fallback for message
    const bodyText = (message || content || '').trim();

    if (!title || !bodyText || !start_date || !end_date) {
        return res.status(400).json({ success: false, message: 'Required parameters missing: title, message, start_date, end_date.' });
    }

    let imageUrl = null;
    if (req.file && req.file.publicUrl) {
        imageUrl = req.file.publicUrl;
    }

    try {
        // A. Store announcement physically in cloud registry
        const { data: result, error: inErr } = await supabaseAdmin.from('announcements')
            .insert({
                title: title.trim(),
                message: bodyText,
                image_url: imageUrl,
                action_url: action_url || null,
                start_date: start_date,
                end_date: end_date,
                status: status || 'active'
            })
            .select('id')
            .single();

        if (inErr) throw inErr;

        // B. Sync to Notifications: Retrieve student cohort and push high-speed batch notifications!
        const notificationMsg = bodyText.length > 100 ? bodyText.substring(0, 97) + '...' : bodyText;
        const notificationLink = action_url || imageUrl || null;
        
        const { data: users, error: usersErr } = await supabaseAdmin.from('users')
            .select('email');

        if (!usersErr && users && users.length > 0) {
            const batch = users.map(u => ({
                user_email: u.email,
                message: `📢 ${title.trim()}: ${notificationMsg.trim()}`,
                link: notificationLink,
                is_read: 0
            }));
            
            // Perform parallel fast insertion for optimal speed
            await supabaseAdmin.from('notifications')
                .insert(batch);
        }

        res.status(201).json({
            success: true,
            message: 'Super Broadcast instantiated successfully & synced to notification bell.',
            insertId: result.id
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Broadcast submission fault.', error: error.message });
    }
});

// 4. PUT /api/admin/announcements/:id — Overwrite existing announcement
app.put('/api/admin/announcements/:id', isAdmin, dynamicUpload, async (req, res) => {
    const announcementId = req.params.id;
    const { title, message, content, action_url, start_date, end_date, status } = req.body;
    const bodyText = message || content || '';

    try {
        const { data: existing, error: selErr } = await supabaseAdmin.from('announcements')
            .select('image_url')
            .eq('id', announcementId)
            .maybeSingle();

        if (selErr) throw selErr;

        if (!existing) {
            return res.status(404).json({ success: false, message: 'Announcement block not found.' });
        }

        let finalImageUrl = existing.image_url;
        
        if (req.file && req.file.publicUrl) {
            finalImageUrl = req.file.publicUrl;
        }

        const { error: upErr } = await supabaseAdmin.from('announcements')
            .update({
                title: title || '', 
                message: bodyText, 
                image_url: finalImageUrl, 
                action_url: action_url || null,
                start_date: start_date, 
                end_date: end_date, 
                status: status || 'active'
            })
            .eq('id', announcementId);

        if (upErr) throw upErr;

        res.json({ success: true, message: 'Broadcast configuration successfully updated.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Mutation operations aborted.', error: error.message });
    }
});

// 5. DELETE /api/admin/announcements/:id — Purge physical campaign
app.delete('/api/admin/announcements/:id', isAdmin, async (req, res) => {
    const announcementId = req.params.id;

    try {
        const { data: existing, error: selErr } = await supabaseAdmin.from('announcements')
            .select('image_url')
            .eq('id', announcementId)
            .maybeSingle();

        if (selErr) throw selErr;

        if (!existing) {
            return res.status(404).json({ success: false, message: 'Target node expired or missing.' });
        }

        const { error: delErr } = await supabaseAdmin.from('announcements')
            .delete()
            .eq('id', announcementId);

        if (delErr) throw delErr;

        res.json({ success: true, message: 'Super Broadcast physically expunged from archives.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Archival destruction fault.', error: error.message });
    }
});

// C. GET /api/proxy-pdf — CORS-Bypassing High-Performance Cloud File Proxy
app.get('/api/proxy-pdf', async (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) {
        return res.status(400).send('Missing secure physical file URL parameter.');
    }

    try {
        // Stream document from Cloud to RAM to Client in a single fluid execution cycle
        const response = await axios({
            method: 'get',
            url: targetUrl,
            responseType: 'stream',
            timeout: 15000 // Resilient limit
        });

        // Match canonical content type and deflate standard browser cache to secure payload
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline'); // Force direct inline viewport stream (no-download)
        res.setHeader('X-Content-Type-Options', 'nosniff'); // Strictest MIME verification gate
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');

        // Securely pipe readStream directly to writeStream response
        response.data.pipe(res);
    } catch (error) {
        console.error('[proxy-pdf] Execution aborted:', error.message);
        res.status(500).send('Secure DRM Stream Interrupted: ' + error.message);
    }
});

// D. GET /api/view-note/:filename — High-Security Direct Document Sending Proxy
app.get('/api/view-note/:filename', async (req, res) => {
    // 1. Enforce Domain-Referer isolation to prevent direct link hotlinking
    const referer = req.get('Referer') || '';
    const host = req.get('host') || '';
    
    if (!referer || (!referer.includes('localhost') && !referer.includes(host))) {
        return res.status(403).json({ success: false, message: 'Access Denied: Cross-domain resource scraping strictly blocked.' });
    }

    try {
        const safeName = path.basename(req.params.filename);
        
        // 1. Attempt to Fetch Document Binary from Cloud Supabase Bucket
        const { data: cloudBlob, error: fetchErr } = await db.storage
            .from('handnotes')
            .download(safeName);
            
        if (fetchErr) {
            // BACKWARD COMPATIBILITY: Attempt local fallback search for historical documents
            const physicalFilePath = path.join(__dirname, 'public', 'uploads', 'handnotes', safeName);
            
            if (fs.existsSync(physicalFilePath)) {
                res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
                res.setHeader('Pragma', 'no-cache');
                res.setHeader('Expires', '0');
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', 'inline; filename="' + safeName + '"');
                return res.sendFile(physicalFilePath);
            }
            
            return res.status(404).json({ 
                success: false, 
                message: 'Target document binary not found in Cloud Storage.', 
                error: fetchErr.message 
            });
        }
        
        // 2. Bulletproof Cache Deflation Headers
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        
        // 3. Force application/pdf headers with absolute Inline Directive
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename="' + safeName + '"');
        
        // 4. Convert Blob stream into standardized binary Buffer and Dispatch!
        const nodeBuffer = Buffer.from(await cloudBlob.arrayBuffer());
        res.send(nodeBuffer);
        
    } catch (error) {
        res.status(500).json({ success: false, message: 'Secure transfer interrupted.', error: error.message });
    }
});

// ========================================================
//           FRONTEND STATIC ASSETS & ROUTING
// ========================================================

// Explicitly mount frontend assets so dashboard/classroom etc still load instantly
app.use(express.static(path.join(__dirname, 'public')));

// SPA Fallback — Ensures refresh / direct URLs resolve safely back to user frontends
app.use('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));
app.use('/classroom', (req, res) => res.sendFile(path.join(__dirname, 'public', 'classroom.html')));
app.use('/cart', (req, res) => res.sendFile(path.join(__dirname, 'public', 'cart.html')));

// ========================================================
//                     SERVER START
// ========================================================
if (require.main === module) {
    app.listen(PORT, () => {
        console.log('');
        console.log('╔═══════════════════════════════════════════════════╗');
        console.log('║  🚀  Code With Pritom — MySQL Migration Service   ║');
        console.log(`║  →  HTTP Engine:  http://localhost:${PORT}             ║`);
        console.log(`║  →  CORS Policy:  Allowed [*]                      ║`);
        console.log('╚═══════════════════════════════════════════════════╝');
        console.log('');
    });
}

// Enable Serverless/Static Module Exports for Vercel Router Interfacing
module.exports = app;