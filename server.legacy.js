/* ============================================
   server.js — Code With Pritom Express Server
   ============================================ */
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ---- Core Middleware ----
app.use(cors());
app.use(bodyParser.json());

// ---- Request Logger ----
app.use((req, res, next) => {
    if (req.method !== 'GET' || req.url.startsWith('/api')) {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} ${req.body?.action ? '— action: ' + req.body.action : ''}`);
    }
    next();
});

// ============================================
//  API ROUTES (using Express Router)
// ============================================
const api = express.Router();

// Health Check
api.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        uptime: Math.round(process.uptime()),
        timestamp: new Date().toISOString(),
        n8n_url: process.env.N8N_WEBHOOK_URL ? 'configured' : 'missing'
    });
});

// ===== PROTECTED PDF HANDNOTES ROUTE =====
api.get('/handnotes/:filename', (req, res) => {
    const filename = req.params.filename;

    // Security: only allow PDF files, no path traversal
    if (!filename.endsWith('.pdf') || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        return res.status(400).json({ success: false, message: 'Invalid file request.' });
    }

    const filePath = path.join(__dirname, 'handnotes', filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ success: false, message: 'Hand note not found.' });
    }

    // Anti-download headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline'); // Force inline display, never download
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow'); // Prevent search indexing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    console.log(`[Handnotes] Serving: ${filename}`);
    res.sendFile(filePath);
});

// Auth Proxy → n8n Webhook
api.post('/auth', async (req, res) => {
    handleN8nRequest(req, res, 'auth');
});

// Checkout Proxy → n8n Webhook
api.post('/checkout', async (req, res) => {
    // Add checkout-specific metadata
    req.body.action = 'checkout';
    req.body.timestamp = new Date().toISOString();
    handleN8nRequest(req, res, 'checkout');
});

// Payment Verification Proxy (Admin)
api.post('/verify-payment', async (req, res) => {
    req.body.action = 'verify-payment';
    handleN8nRequest(req, res, 'verification');
});

// Live Stats Proxy
api.get('/live-stats', async (req, res) => {
    try {
        const url = process.env.N8N_LIVE_STATS_URL;
        if (!url) throw new Error('N8N_LIVE_STATS_URL not configured');
        const response = await axios.get(url);
        res.json(response.data);
    } catch (error) {
        console.error('[Live Stats] Proxy failed:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch live stats' });
    }
});

// Join Workshop Proxy
api.post('/join-workshop', async (req, res) => {
    try {
        const url = process.env.N8N_WORKSHOP_URL;
        if (!url) throw new Error('N8N_WORKSHOP_URL not configured');
        const response = await axios.post(url, req.body, {
            headers: { 'Content-Type': 'application/json' }
        });
        res.json(response.data);
    } catch (error) {
        console.error('[Join Workshop] Proxy failed:', error.message);
        res.status(500).json({ success: false, message: 'Failed to join workshop' });
    }
});

// Secure Classroom Payload Endpoint
api.post('/classroom/:courseId', async (req, res) => {
    const { courseId } = req.params;
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, message: 'Identification email required.' });
    }

    try {
        const dataPath = path.join(__dirname, 'private-course-data.json');
        if (!fs.existsSync(dataPath)) throw new Error('Database store missing.');

        const courseDB = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        const course = courseDB[courseId];

        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found.' });
        }

        // Verify live clearance state directly via central automations webhook
        const authUrl = process.env.N8N_AUTH_WEBHOOK_URL || process.env.N8N_WEBHOOK_URL;
        if (!authUrl) throw new Error('Authorization hooks unconfigured.');

        const authResponse = await axios.post(authUrl, { action: 'sync', email: email }, { timeout: 10000 });
        const latestAccess = authResponse.data?.user?.access || '';
        const cleanAccessList = latestAccess.toString().split(',').map(t => t.trim());

        // Determine enrollment status
        const hasAccess = cleanAccessList.includes(courseId.toString());

        if (hasAccess) {
            // Decrypt payloads & distribute protected lesson keys
            return res.json({
                success: true,
                course: course
            });
        }

        // Explicitly Denied State
        return res.status(403).json({
            success: false,
            message: 'Forbidden: Enrolment required.'
        });

    } catch (err) {
        console.error('[Secure Classroom] Internal Failure:', err.message);
        return res.status(500).json({ success: false, message: 'Authorization pipeline failure.' });
    }
});

// Helper function for n8n requests
async function handleN8nRequest(req, res, context) {
    try {
        console.log(`[n8n Proxy] Forwarding ${context}:`, req.body.action || 'unknown');

        // Use specific webhook URL if available, otherwise fall back to main
        const webhookUrl = process.env[`N8N_${context.toUpperCase()}_WEBHOOK_URL`] || process.env.N8N_WEBHOOK_URL;

        if (!webhookUrl) {
            throw new Error('No n8n Webhook URL configured');
        }

        const response = await axios.post(webhookUrl, req.body, {
            timeout: 20000, // Longer timeout for checkout processing
            headers: { 'Content-Type': 'application/json' }
        });

        res.json(response.data);

    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.error('[n8n Proxy] Connection refused. Is n8n running?');
            return res.status(503).json({
                success: false,
                message: 'Automation server is unreachable. Please try again later.'
            });
        }

        if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
            console.error('[n8n Proxy] Request timed out.');
            return res.status(504).json({
                success: false,
                message: 'Request timed out. The automation server took too long.'
            });
        }

        if (error.response?.data) {
            console.error('[n8n Proxy] n8n returned error:', error.response.status);
            return res.status(error.response.status || 500).json(error.response.data);
        }

        console.error('[n8n Proxy] Unexpected error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error. Please check your internet or try again later.'
        });
    }
}

// ===== PROMO CODES ENDPOINT =====
const PROMO_CODES = [
    { code: 'EWUPCC2026', discount: 100, type: 'flat', valid_until: '2026-12-31', status: 'ACTIVE' }
];

api.get('/promo-codes', (req, res) => {
    const { code } = req.query;
    if (code) {
        const promo = PROMO_CODES.find(p => p.code === code.toUpperCase() && p.status !== 'INACTIVE');
        if (promo) {
            return res.json({ success: true, promo });
        }
        return res.status(404).json({ success: false, message: 'Invalid or expired promo code.' });
    }
    // Return all active public codes
    res.json({
        success: true,
        promos: PROMO_CODES.filter(p => p.status === 'ACTIVE')
    });
});

// Mount API router at /api
app.use('/api', api);

// ============================================
//  STATIC FILES & SPA FALLBACK (after API)
// ============================================

// Serve static files from /public
app.use(express.static(path.join(__dirname, 'public')));

// SPA Fallback — only for non-API routes
app.use((req, res) => {
    if (req.url.startsWith('/api')) {
        return res.status(404).json({ success: false, message: 'API endpoint not found.' });
    }
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ---- Start Server ----
app.listen(PORT, () => {
    console.log('');
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║  🚀  Code With Pritom — LMS Server           ║');
    console.log(`║  →  http://localhost:${PORT}                     ║`);
    console.log(`║  →  n8n: ${process.env.N8N_WEBHOOK_URL ? '✓ Connected' : '✗ Missing .env'}                      ║`);
    console.log('╚══════════════════════════════════════════════╝');
    console.log('');
});