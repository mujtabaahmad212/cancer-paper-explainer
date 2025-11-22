// ============================================
// AI Cancer Research Paper Explainer - Script
// ============================================

// API Configuration
const API_URL = 'http://localhost:8000/summarize';

// DOM Elements
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const uploadZone = document.getElementById('uploadZone');
const pdfInput = document.getElementById('pdfInput');
const filePreview = document.getElementById('filePreview');
const fileName = document.getElementById('fileName');
const removeFileBtn = document.getElementById('removeFile');
const textInput = document.getElementById('textInput');
const submitBtn = document.getElementById('submitBtn');
const loadingContainer = document.getElementById('loadingContainer');
const resultsSection = document.getElementById('resultsSection');
const summaryContent = document.getElementById('summaryContent');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const copyBtn = document.getElementById('copyBtn');

// State
let selectedFile = null;
let currentTab = 'pdf';

// ============================================
// Tab Switching
// ============================================
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const targetTab = btn.dataset.tab;

        // Update active states
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));

        btn.classList.add('active');
        document.getElementById(`${targetTab}-tab`).classList.add('active');

        currentTab = targetTab;
        hideError();
    });
});

// ============================================
// PDF Upload Handling
// ============================================

// Click to upload
uploadZone.addEventListener('click', () => {
    pdfInput.click();
});

// File input change
pdfInput.addEventListener('change', (e) => {
    handleFileSelect(e.target.files[0]);
});

// Drag and drop
uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('drag-over');
});

uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('drag-over');
});

uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('drag-over');

    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
});

// Handle file selection
function handleFileSelect(file) {
    if (!file) return;

    // Validate file type
    if (file.type !== 'application/pdf') {
        showError('Please select a PDF file');
        return;
    }

    // Validate file size (50MB max)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
        showError('File size must be less than 50MB');
        return;
    }

    selectedFile = file;
    fileName.textContent = file.name;
    uploadZone.style.display = 'none';
    filePreview.style.display = 'block';
    hideError();
}

// Remove file
removeFileBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    selectedFile = null;
    pdfInput.value = '';
    uploadZone.style.display = 'block';
    filePreview.style.display = 'none';
});

// ============================================
// Form Submission
// ============================================
submitBtn.addEventListener('click', async () => {
    hideError();

    // Validate input
    if (currentTab === 'pdf' && !selectedFile) {
        showError('Please upload a PDF file or switch to text input');
        return;
    }

    if (currentTab === 'text' && !textInput.value.trim()) {
        showError('Please enter some text to analyze');
        return;
    }

    // Prepare form data
    const formData = new FormData();

    if (currentTab === 'pdf') {
        formData.append('pdf', selectedFile);
    } else {
        formData.append('topic', textInput.value.trim());
    }

    // Show loading state
    setLoadingState(true);

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }

        // Display results
        displayResults(data.summary);

    } catch (error) {
        console.error('Error:', error);
        showError(`Failed to process: ${error.message}`);
    } finally {
        setLoadingState(false);
    }
});

// ============================================
// UI State Management
// ============================================
function setLoadingState(isLoading) {
    if (isLoading) {
        submitBtn.disabled = true;
        loadingContainer.style.display = 'block';
        resultsSection.style.display = 'none';

        // Scroll to loading
        loadingContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
        submitBtn.disabled = false;
        loadingContainer.style.display = 'none';
    }
}

function displayResults(summary) {
    // Convert markdown-style headers to HTML
    let formattedSummary = summary
        .replace(/### (.*)/g, '<h3>$1</h3>')
        .replace(/## (.*)/g, '<h3>$1</h3>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/- (.*)/g, '<li>$1</li>');

    // Wrap lists
    formattedSummary = formattedSummary.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');

    // Wrap paragraphs
    if (!formattedSummary.startsWith('<h3>')) {
        formattedSummary = '<p>' + formattedSummary + '</p>';
    }

    summaryContent.innerHTML = formattedSummary;
    resultsSection.style.display = 'block';

    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function showError(message) {
    errorText.textContent = message;
    errorMessage.style.display = 'flex';

    // Auto-hide after 5 seconds
    setTimeout(() => {
        hideError();
    }, 5000);
}

function hideError() {
    errorMessage.style.display = 'none';
}

// ============================================
// Copy to Clipboard
// ============================================
copyBtn.addEventListener('click', async () => {
    const text = summaryContent.innerText;

    try {
        await navigator.clipboard.writeText(text);

        // Visual feedback
        const originalText = copyBtn.textContent;
        copyBtn.textContent = '✓ Copied!';
        copyBtn.style.background = 'var(--success-color)';
        copyBtn.style.color = 'white';

        setTimeout(() => {
            copyBtn.textContent = originalText;
            copyBtn.style.background = '';
            copyBtn.style.color = '';
        }, 2000);
    } catch (error) {
        showError('Failed to copy to clipboard');
    }
});

// ============================================
// Keyboard Shortcuts
// ============================================
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter to submit
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (!submitBtn.disabled) {
            submitBtn.click();
        }
    }
});

// ============================================
// Accessibility - Focus Management
// ============================================
uploadZone.setAttribute('tabindex', '0');
uploadZone.setAttribute('role', 'button');
uploadZone.setAttribute('aria-label', 'Upload PDF file');

uploadZone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        pdfInput.click();
    }
});

// ============================================
// Initialize
// ============================================
console.log('🎗️ AI Cancer Research Paper Explainer initialized');
console.log('📡 API endpoint:', API_URL);
