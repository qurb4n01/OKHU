// OKHU University Recommendation Platform JavaScript

// Configuration
const CONFIG = {
    GROQ_API_URL: 'https://api.groq.com/openai/v1/chat/completions',
    GROQ_API_KEY: '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' // Replace with your actual Groq API key
};

// State management
let currentTab = 'recommender';
let currentSubTab = 'details';
let currentResultsTab = 'recommender';
let uploadedFiles = {
    cv: null,
    transcript: null,
    languageCertificate: null,
    additionalDocuments: null
};
let linkedInConnected = false;
let currentUserProfile = null;

// DOM Elements
const elements = {
    navLinks: document.querySelectorAll('.nav-link'),
    tabContents: document.querySelectorAll('.tab-content'),
    subTabs: document.querySelectorAll('.sub-tab'),
    subTabContents: document.querySelectorAll('.sub-tab-content'),
    recommenderForm: document.getElementById('recommender-form'),
    searchInput: document.getElementById('university-search'),
    searchBtn: document.getElementById('search-btn'),
    loadingOverlay: document.getElementById('loading-overlay'),
    recommendationsResults: document.getElementById('recommendations-results'),
    recommendationsList: document.getElementById('recommendations-list'),
    searchResults: document.getElementById('search-results'),
    // Results tabs
    resultsTabs: document.querySelectorAll('.results-tab'),
    resultsTabContents: document.querySelectorAll('.results-tab-content'),
    // LinkedIn elements
    linkedinConnectBtn: document.getElementById('linkedin-connect-btn'),
    linkedinDisconnectBtn: document.getElementById('linkedin-disconnect-btn'),
    linkedinAuthSection: document.getElementById('linkedin-auth-section'),
    linkedinConnectedSection: document.getElementById('linkedin-connected-section'),
    mutualityList: document.getElementById('mutuality-list'),
    mutualityProfiles: document.getElementById('mutuality-profiles')
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    initializeFileUploads();
    validateAPIKey();
    console.log('OKHU University Platform initialized');
});

// Validate API Key
async function validateAPIKey() {
    if (!CONFIG.GROQ_API_KEY || CONFIG.GROQ_API_KEY === 'YOUR_GROQ_API_KEY_HERE') {
        console.error('API Key not configured');
        showError('API Key not configured. Please add your Groq API key to script.js');
        return false;
    }
    
    try {
        console.log('Validating API key...');
        const response = await fetch(CONFIG.GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${CONFIG.GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instant',
                messages: [{ role: 'user', content: 'Hello' }],
                max_tokens: 10
            })
        });
        
        if (response.ok) {
            console.log('API Key is valid');
            return true;
        } else {
            const errorText = await response.text();
            console.error('API Key validation failed:', response.status, errorText);
            showError(`API Key validation failed: ${response.status} - ${errorText}`);
            return false;
        }
    } catch (error) {
        console.error('API Key validation error:', error);
        showError(`API Key validation error: ${error.message}`);
        return false;
    }
}

// Test API Connection
async function testAPIConnection() {
    const testBtn = document.getElementById('test-api-btn');
    const originalText = testBtn.innerHTML;
    
    testBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testing...';
    testBtn.disabled = true;
    
    try {
        console.log('Testing API connection...');
        
        const response = await fetch(CONFIG.GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${CONFIG.GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instant',
                messages: [{ 
                    role: 'user', 
                    content: 'Say "API test successful" if you can read this message.' 
                }],
                max_tokens: 20
            })
        });
        
        console.log('Test response status:', response.status);
        console.log('Test response headers:', Object.fromEntries(response.headers.entries()));
        
        if (response.ok) {
            const data = await response.json();
            console.log('Test API Response:', data);
            
            if (data.choices && data.choices[0] && data.choices[0].message) {
                const content = data.choices[0].message.content;
                console.log('Test AI Response:', content);
                showSuccess(`✅ API Connection Successful! Response: "${content}"`);
            } else {
                showError('❌ API responded but with invalid structure');
            }
        } else {
            const errorText = await response.text();
            console.error('Test API Error:', errorText);
            showError(`❌ API Error ${response.status}: ${errorText}`);
        }
    } catch (error) {
        console.error('Test API Connection Error:', error);
        showError(`❌ Connection Error: ${error.message}`);
    } finally {
        testBtn.innerHTML = originalText;
        testBtn.disabled = false;
    }
}

// Test University Search
async function testUniversitySearch() {
    const testBtn = document.getElementById('test-search-btn');
    const originalText = testBtn.innerHTML;
    
    testBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testing...';
    testBtn.disabled = true;
    
    try {
        console.log('Testing university search...');
        
        // Test with a well-known university
        const testQuery = 'MIT';
        const universityData = await searchUniversity(testQuery);
        
        console.log('Test search successful:', universityData);
        showSuccess(`✅ Search Test Successful! Found: ${universityData.name}`);
        
        // Display the test result
        displayUniversityDetails(universityData);
        
    } catch (error) {
        console.error('Test Search Error:', error);
        showError(`❌ Search Test Failed: ${error.message}`);
    } finally {
        testBtn.innerHTML = originalText;
        testBtn.disabled = false;
    }
}

// Event Listeners
function initializeEventListeners() {
    // Tab navigation
    elements.navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const tabName = this.dataset.tab;
            switchTab(tabName);
        });
    });

    // Sub-tab navigation
    elements.subTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const subTabName = this.dataset.subtab;
            switchSubTab(subTabName);
        });
    });

    // Results tab navigation
    elements.resultsTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const resultsTabName = this.dataset.resultsTab;
            switchResultsTab(resultsTabName);
        });
    });

    // Form submission
    elements.recommenderForm.addEventListener('submit', handleRecommendationForm);
    
    // Search functionality
    elements.searchBtn.addEventListener('click', handleUniversitySearch);
    elements.searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleUniversitySearch();
        }
    });

    // LinkedIn functionality
    elements.linkedinConnectBtn.addEventListener('click', connectLinkedIn);
    elements.linkedinDisconnectBtn.addEventListener('click', disconnectLinkedIn);

    // Test API button
    document.getElementById('test-api-btn').addEventListener('click', testAPIConnection);
    
    // Test Search button
    document.getElementById('test-search-btn').addEventListener('click', testUniversitySearch);
}

// File Upload Handling
function initializeFileUploads() {
    const fileInputs = [
        { id: 'cv-upload', key: 'cv' },
        { id: 'transcript-upload', key: 'transcript' },
        { id: 'language-certificate', key: 'languageCertificate' },
        { id: 'additional-documents', key: 'additionalDocuments' }
    ];

    fileInputs.forEach(input => {
        const fileInput = document.getElementById(input.id);
        const display = fileInput.nextElementSibling;
        
        fileInput.addEventListener('change', function(e) {
            const files = e.target.files;
            if (files && files.length > 0) {
                if (input.key === 'additionalDocuments') {
                    uploadedFiles[input.key] = Array.from(files);
                    display.innerHTML = `
                        <i class="fas fa-check-circle" style="color: #28a745;"></i>
                        <span style="color: #28a745;">${files.length} file(s) uploaded</span>
                    `;
                } else {
                    uploadedFiles[input.key] = files[0];
                    display.innerHTML = `
                        <i class="fas fa-check-circle" style="color: #28a745;"></i>
                        <span style="color: #28a745;">${files[0].name}</span>
                    `;
                }
            }
        });
    });
}

// Tab Switching
function switchTab(tabName) {
    // Update navigation
    elements.navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.dataset.tab === tabName) {
            link.classList.add('active');
        }
    });

    // Update content
    elements.tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === `${tabName}-tab`) {
            content.classList.add('active');
        }
    });

    currentTab = tabName;
}

// Sub-tab Switching
function switchSubTab(subTabName) {
    // Update sub-tab navigation
    elements.subTabs.forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.subtab === subTabName) {
            tab.classList.add('active');
        }
    });

    // Update sub-tab content
    elements.subTabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === `${subTabName}-subtab`) {
            content.classList.add('active');
        }
    });

    currentSubTab = subTabName;
}

// Results Tab Switching
function switchResultsTab(resultsTabName) {
    // Update results tab navigation
    elements.resultsTabs.forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.resultsTab === resultsTabName) {
            tab.classList.add('active');
        }
    });

    // Update results tab content
    elements.resultsTabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === `${resultsTabName}-results`) {
            content.classList.add('active');
        }
    });

    currentResultsTab = resultsTabName;

    // If switching to mutuality tab and LinkedIn is connected, load mutuality data
    if (resultsTabName === 'mutuality' && linkedInConnected && currentUserProfile) {
        loadMutualityData();
    }
}

// Form Handling
async function handleRecommendationForm(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const userProfile = {
        // Basic Information
        country: document.getElementById('country').value,
        educationLanguage: document.getElementById('education-language').value,
        gpa: parseFloat(document.getElementById('gpa').value),
        speciality: document.getElementById('speciality').value,
        
        // Academic Information
        academicLevel: document.getElementById('academic-level').value,
        startDate: document.getElementById('start-date').value,
        budget: document.getElementById('budget').value,
        workExperience: document.getElementById('work-experience').value,
        
        // Test Scores
        satScore: document.getElementById('sat-score').value || null,
        actScore: document.getElementById('act-score').value || null,
        greScore: document.getElementById('gre-score').value || null,
        gmatScore: document.getElementById('gmat-score').value || null,
        toeflScore: document.getElementById('toefl-score').value || null,
        ieltsScore: document.getElementById('ielts-score').value || null,
        duolingoScore: document.getElementById('duolingo-score').value || null,
        
        // Research Experience
        researchExperience: getCheckedValues('research-experience'),
        
        // Extracurricular Activities
        extracurriculars: getCheckedValues('extracurriculars'),
        
        // Text Fields
        awards: document.getElementById('awards').value,
        personalStatement: document.getElementById('personal-statement').value,
        
        // File Uploads
        cv: uploadedFiles.cv,
        transcript: uploadedFiles.transcript,
        languageCertificate: uploadedFiles.languageCertificate,
        additionalDocuments: uploadedFiles.additionalDocuments
    };

    // Validate form
    if (!validateRecommendationForm(userProfile)) {
        return;
    }

    showLoadingOverlay();
    
    try {
        const recommendations = await getUniversityRecommendations(userProfile);
        displayRecommendations(recommendations);
        
        // Store user profile for mutuality feature
        currentUserProfile = userProfile;
    } catch (error) {
        console.error('Error getting recommendations:', error);
        showError('Failed to get recommendations. Please try again.');
    } finally {
        hideLoadingOverlay();
    }
}

// Helper function to get checked checkbox values
function getCheckedValues(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return [];
    
    const checkboxes = container.querySelectorAll('input[type="checkbox"]:checked');
    return Array.from(checkboxes).map(cb => cb.value);
}

// Form Validation
function validateRecommendationForm(profile) {
    const requiredFields = ['country', 'educationLanguage', 'gpa', 'speciality', 'academicLevel', 'startDate', 'budget'];
    
    for (const field of requiredFields) {
        if (!profile[field]) {
            showError(`Please fill in the ${field.replace(/([A-Z])/g, ' $1').toLowerCase()} field.`);
            return false;
        }
    }

    if (profile.gpa < 0 || profile.gpa > 4) {
        showError('GPA must be between 0.0 and 4.0');
        return false;
    }

    // Validate test scores if provided
    const testScores = ['satScore', 'actScore', 'greScore', 'gmatScore', 'toeflScore', 'ieltsScore', 'duolingoScore'];
    for (const score of testScores) {
        if (profile[score] && isNaN(parseFloat(profile[score]))) {
            showError(`Please enter a valid ${score.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
            return false;
        }
    }

    return true;
}

// University Recommendations using Groq AI
async function getUniversityRecommendations(userProfile) {
    console.log('Getting recommendations for profile:', userProfile);
    
    const prompt = `You are an expert university counselor. Based on the following comprehensive student profile, recommend 5 universities that would be the best fit for this student:

STUDENT PROFILE:
=== BASIC INFORMATION ===
- Country Preference: ${userProfile.country}
- Education Language: ${userProfile.educationLanguage}
- GPA: ${userProfile.gpa}/4.0
- Field of Study: ${userProfile.speciality}
- Current Academic Level: ${userProfile.academicLevel}
- Preferred Start Date: ${userProfile.startDate}
- Annual Budget Range: ${userProfile.budget}
- Work Experience: ${userProfile.workExperience} years

=== STANDARDIZED TEST SCORES ===
- SAT Score: ${userProfile.satScore || 'Not provided'}
- ACT Score: ${userProfile.actScore || 'Not provided'}
- GRE Score: ${userProfile.greScore || 'Not provided'}
- GMAT Score: ${userProfile.gmatScore || 'Not provided'}

=== LANGUAGE PROFICIENCY ===
- TOEFL Score: ${userProfile.toeflScore || 'Not provided'}
- IELTS Score: ${userProfile.ieltsScore || 'Not provided'}
- Duolingo Score: ${userProfile.duolingoScore || 'Not provided'}

=== RESEARCH EXPERIENCE ===
${userProfile.researchExperience.length > 0 ? userProfile.researchExperience.join(', ') : 'No research experience indicated'}

=== EXTRACURRICULAR ACTIVITIES ===
${userProfile.extracurriculars.length > 0 ? userProfile.extracurriculars.join(', ') : 'No extracurricular activities indicated'}

=== ACHIEVEMENTS & GOALS ===
- Awards & Honors: ${userProfile.awards || 'Not provided'}
- Personal Statement/Career Goals: ${userProfile.personalStatement || 'Not provided'}

=== DOCUMENTS AVAILABLE ===
- CV: ${userProfile.cv ? 'Yes' : 'No'}
- Transcript: ${userProfile.transcript ? 'Yes' : 'No'}
- Language Certificate: ${userProfile.languageCertificate ? 'Yes' : 'No'}
- Additional Documents: ${userProfile.additionalDocuments ? `${userProfile.additionalDocuments.length} file(s)` : 'No'}

Please research and provide detailed university recommendations that match this comprehensive profile. Consider:
1. Academic compatibility with GPA, test scores, and field of study
2. Language requirements and proficiency levels
3. Country preferences and visa requirements
4. Realistic admission chances based on all qualifications
5. Program quality and reputation in their field of interest
6. Tuition costs and financial fit with budget range
7. Work experience relevance for graduate programs
8. Research opportunities matching their experience level
9. Extracurricular alignment with university culture
10. Timeline compatibility with preferred start date

ALSO research and provide relevant scholarships including:
1. University-specific scholarships for the recommended universities
2. Country-level scholarships (government scholarships, national programs)
3. Regional scholarships (EU scholarships, ASEAN scholarships, etc.)
4. International scholarships (Fulbright, Chevening, etc.)
5. Field-specific scholarships for their area of study
6. Merit-based and need-based scholarships
7. Test score-based scholarships (SAT, GRE, etc.)
8. Research-based scholarships for students with research experience
9. Leadership scholarships for students with extracurricular involvement
10. Budget-appropriate scholarship opportunities

For each scholarship, provide accurate information about requirements, deadlines, amounts, and application processes.

Return ONLY a valid JSON response in this exact format:
{
  "recommendations": [
    {
      "name": "Full University Name",
      "location": "City, Country",
      "matchScore": 95,
      "reason": "Detailed explanation of why this university is a good match for the student",
      "requirements": {
        "gpa": 3.7,
        "languageTest": "TOEFL 90+ or IELTS 7.0+",
        "additional": "SAT/ACT scores recommended"
      },
      "specialities": ["Computer Science", "Engineering", "Mathematics"],
      "tuition": "$50,000/year",
      "deadline": "January 1st",
      "scholarships": [
        {
          "name": "University Merit Scholarship",
          "amount": "$5,000/year",
          "description": "Merit-based scholarship for outstanding students",
          "requirements": "GPA 3.5+, no additional application required",
          "deadline": "Automatic consideration with admission"
        }
      ]
    }
  ],
  "generalScholarships": [
    {
      "name": "Scholarship Name",
      "type": "Country/Regional/International",
      "amount": "$10,000/year or 50% tuition",
      "description": "Brief description of the scholarship",
      "requirements": {
        "gpa": 3.5,
        "languageTest": "IELTS 6.5+ or TOEFL 80+",
        "additional": "Specific requirements like nationality, field of study, etc."
      },
      "deadline": "March 15th",
      "eligibility": "Open to international students in Computer Science",
      "applicationProcess": "Online application + essay + recommendation letters"
    }
  ]
}

Provide realistic, well-researched recommendations with accurate information about each university.`;

    try {
        console.log('Making API request to Groq...');
        
        const requestBody = {
            model: 'llama-3.1-8b-instant',
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 2500
        };

        console.log('Request body:', JSON.stringify(requestBody, null, 2));

        const response = await fetch(CONFIG.GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${CONFIG.GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error Response:', errorText);
            throw new Error(`API request failed: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('API Response:', data);
        
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            console.error('Invalid API response structure:', data);
            throw new Error('Invalid API response structure');
        }

        const content = data.choices[0].message.content;
        console.log('AI Content:', content);
        
        // Parse JSON response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const result = JSON.parse(jsonMatch[0]);
            console.log('Parsed result:', result);
            
            // Validate that we have recommendations
            if (!result.recommendations || !Array.isArray(result.recommendations)) {
                throw new Error('Invalid response format: no recommendations found');
            }
            return result;
        } else {
            console.error('No JSON found in response:', content);
            throw new Error('Invalid JSON response format from AI');
        }
    } catch (error) {
        console.error('Groq API error details:', error);
        
        // Provide more specific error messages
        if (error.message.includes('401')) {
            throw new Error('Invalid API key. Please check your Groq API key.');
        } else if (error.message.includes('429')) {
            throw new Error('API rate limit exceeded. Please try again later.');
        } else if (error.message.includes('500')) {
            throw new Error('Groq API server error. Please try again later.');
        } else if (error.message.includes('Failed to fetch')) {
            throw new Error('Network error. Please check your internet connection.');
        } else {
            throw new Error(`Failed to get recommendations: ${error.message}`);
        }
    }
}


// Display Recommendations
function displayRecommendations(data) {
    const recommendations = data.recommendations || [];
    const generalScholarships = data.generalScholarships || [];
    
    if (recommendations.length === 0 && generalScholarships.length === 0) {
        elements.recommendationsList.innerHTML = '<p>No recommendations found. Please try adjusting your preferences.</p>';
        elements.recommendationsResults.style.display = 'block';
        return;
    }

    let contentHTML = '';

    // Display University Recommendations with their scholarships
    if (recommendations.length > 0) {
        contentHTML += `
            <div class="section-header">
                <h3><i class="fas fa-graduation-cap"></i> Recommended Universities</h3>
            </div>
            <div class="recommendations-grid">
                ${recommendations.map(uni => `
                    <div class="recommendation-item">
                        <div class="match-score">${uni.matchScore}% Match</div>
                        <h4 class="university-name">${uni.name}</h4>
                        <div class="university-location">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${uni.location}</span>
                        </div>
                        <p class="university-description">${uni.reason}</p>
                        <div class="university-details">
                            <p><strong>Requirements:</strong> GPA ${uni.requirements.gpa}+, ${uni.requirements.languageTest}</p>
                            <p><strong>Specialities:</strong> ${uni.specialities.join(', ')}</p>
                            <p><strong>Tuition:</strong> ${uni.tuition}</p>
                            <p><strong>Application Deadline:</strong> ${uni.deadline}</p>
                        </div>
                        
                        ${uni.scholarships && uni.scholarships.length > 0 ? `
                            <div class="university-scholarships">
                                <h5 class="scholarships-title">
                                    <i class="fas fa-trophy"></i>
                                    Available Scholarships
                                </h5>
                                <div class="university-scholarships-list">
                                    ${uni.scholarships.map(scholarship => `
                                        <div class="university-scholarship-item">
                                            <div class="scholarship-name-amount">
                                                <span class="scholarship-name">${scholarship.name}</span>
                                                <span class="scholarship-amount">${scholarship.amount}</span>
                                            </div>
                                            <p class="scholarship-description">${scholarship.description}</p>
                                            <div class="scholarship-requirements">
                                                <strong>Requirements:</strong> ${scholarship.requirements}
                                            </div>
                                            <div class="scholarship-deadline">
                                                <strong>Deadline:</strong> ${scholarship.deadline}
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Display General Scholarships (Country/Regional/International)
    if (generalScholarships.length > 0) {
        contentHTML += `
            <div class="section-header">
                <h3><i class="fas fa-globe"></i> Additional Scholarship Opportunities</h3>
            </div>
            <div class="scholarships-grid">
                ${generalScholarships.map(scholarship => `
                    <div class="scholarship-item">
                        <div class="scholarship-header">
                            <h4 class="scholarship-name">${scholarship.name}</h4>
                            <span class="scholarship-type">${scholarship.type}</span>
                        </div>
                        <div class="scholarship-amount">
                            <i class="fas fa-dollar-sign"></i>
                            <span>${scholarship.amount}</span>
                        </div>
                        <p class="scholarship-description">${scholarship.description}</p>
                        <div class="scholarship-details">
                            <div class="detail-row">
                                <strong>Requirements:</strong> GPA ${scholarship.requirements.gpa}+, ${scholarship.requirements.languageTest}
                            </div>
                            <div class="detail-row">
                                <strong>Eligibility:</strong> ${scholarship.eligibility}
                            </div>
                            <div class="detail-row">
                                <strong>Application Process:</strong> ${scholarship.applicationProcess}
                            </div>
                            <div class="detail-row">
                                <strong>Deadline:</strong> ${scholarship.deadline}
                            </div>
                            ${scholarship.requirements.additional ? `<div class="detail-row"><strong>Additional:</strong> ${scholarship.requirements.additional}</div>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    elements.recommendationsList.innerHTML = contentHTML;
    elements.recommendationsResults.style.display = 'block';
    elements.recommendationsResults.scrollIntoView({ behavior: 'smooth' });
}

// University Search
async function handleUniversitySearch() {
    const query = elements.searchInput.value.trim();
    
    if (!query) {
        showError('Please enter a university name');
        return;
    }

    showLoadingOverlay();
    
    try {
        console.log('Starting university search for:', query);
        const universityData = await searchUniversity(query);
        console.log('University data received:', universityData);
        displayUniversityDetails(universityData);
    } catch (error) {
        console.error('Error searching university:', error);
        
        // Provide more specific error messages based on the error type
        let errorMessage = 'University search failed. ';
        
        if (error.message.includes('API key')) {
            errorMessage = 'API configuration error. Please check the API key.';
        } else if (error.message.includes('rate limit')) {
            errorMessage = 'Too many requests. Please wait a moment and try again.';
        } else if (error.message.includes('Network error')) {
            errorMessage = 'Network connection error. Please check your internet connection.';
        } else if (error.message.includes('Unable to process')) {
            errorMessage = 'Unable to process the search. Please try a different university name.';
        } else if (error.message.includes('Search failed')) {
            errorMessage = `Search failed: ${error.message}`;
        } else {
            errorMessage = 'University not found. Please try a different search term or check the spelling.';
        }
        
        showError(errorMessage);
    } finally {
        hideLoadingOverlay();
    }
}

// Search University
async function searchUniversity(query) {
    console.log('Searching for university:', query);
    
    const prompt = `You are a university information expert. Find detailed information about the university: "${query}". 

IMPORTANT: Only search for real, existing universities. If the university name is unclear or doesn't exist, provide information about the most likely match or suggest similar universities.

Provide comprehensive and accurate information about this university including admission requirements, programs, location, and other relevant details.

Return the information in this exact JSON format:
{
    "name": "Full University Name",
    "location": "City, Country",
    "country": "Country Name",
    "overview": "Detailed overview of the university including history, reputation, and notable achievements",
    "requirements": {
        "gpa": 3.7,
        "toefl": 90,
        "ielts": 7.0,
        "sat": 1500,
        "gre": 325
    },
    "specialities": ["Field1", "Field2", "Field3"],
    "language": "Primary language of instruction",
    "applicationDeadline": "Application deadline date",
    "tuition": "Tuition cost per year"
}

If you cannot find the exact university, provide information about the closest match or most likely university the user meant. Always return valid JSON with university information.`;

    try {
        console.log('Making search API request to Groq...');
        
        const requestBody = {
            model: 'llama-3.1-8b-instant',
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.3,
            max_tokens: 1500
        };

        console.log('Search request body:', JSON.stringify(requestBody, null, 2));

        const response = await fetch(CONFIG.GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${CONFIG.GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        console.log('Search response status:', response.status);
        console.log('Search response headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Search API Error Response:', errorText);
            throw new Error(`API request failed: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('Search API Response:', data);
        
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            console.error('Invalid search API response structure:', data);
            throw new Error('Invalid API response structure');
        }

        const content = data.choices[0].message.content;
        console.log('Search AI Content:', content);
        
        // Parse JSON response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                const result = JSON.parse(jsonMatch[0]);
                console.log('Search parsed result:', result);
                
                // Validate that we have the required fields
                if (!result.name || !result.location) {
                    console.error('Missing required fields in response:', result);
                    throw new Error('Incomplete university information received');
                }
                
                return result;
            } catch (parseError) {
                console.error('JSON parse error:', parseError);
                console.error('Raw content:', content);
                throw new Error('Failed to parse university information');
            }
        } else {
            console.error('No JSON found in search response:', content);
            throw new Error('Invalid response format from AI');
        }
    } catch (error) {
        console.error('Search error details:', error);
        
        // Provide more specific error messages
        if (error.message.includes('401')) {
            throw new Error('Invalid API key. Please check your Groq API key.');
        } else if (error.message.includes('429')) {
            throw new Error('API rate limit exceeded. Please try again later.');
        } else if (error.message.includes('500')) {
            throw new Error('Groq API server error. Please try again later.');
        } else if (error.message.includes('Failed to fetch')) {
            throw new Error('Network error. Please check your internet connection.');
        } else if (error.message.includes('Invalid response format') || error.message.includes('Failed to parse')) {
            throw new Error('Unable to process university information. Please try a different search term.');
        } else {
            throw new Error(`Search failed: ${error.message}`);
        }
    }
}

// Display University Details
function displayUniversityDetails(university) {
    // Update university header
    document.getElementById('university-name').textContent = university.name;
    document.getElementById('university-location').textContent = university.location;
    
    // Update details tab
    document.getElementById('university-overview').textContent = university.overview;
    
    const countryInfo = `Located in ${university.country}, this university offers excellent educational opportunities in a diverse and vibrant academic environment.`;
    document.getElementById('country-info').textContent = countryInfo;
    
    // Update application requirements
    const requirementsHTML = `
        <ul>
            <li><strong>Minimum GPA:</strong> ${university.requirements.gpa}</li>
            <li><strong>TOEFL Score:</strong> ${university.requirements.toefl || 'Not specified'}</li>
            <li><strong>IELTS Score:</strong> ${university.requirements.ielts || 'Not specified'}</li>
            <li><strong>SAT Score:</strong> ${university.requirements.sat || 'Not specified'}</li>
            <li><strong>GRE Score:</strong> ${university.requirements.gre || 'Not specified'}</li>
            <li><strong>Application Deadline:</strong> ${university.applicationDeadline}</li>
            <li><strong>Tuition:</strong> ${university.tuition}</li>
            <li><strong>Language of Instruction:</strong> ${university.language}</li>
        </ul>
    `;
    document.getElementById('application-requirements').innerHTML = requirementsHTML;
    
    // Update community tab with mock data
    updateCommunityTab(university);
    
    // Show results
    elements.searchResults.style.display = 'block';
    elements.searchResults.scrollIntoView({ behavior: 'smooth' });
}

// Update Community Tab
async function updateCommunityTab(university) {
    // Show loading state
    document.getElementById('reddit-posts').innerHTML = '<p>Loading community discussions...</p>';
    document.getElementById('social-mentions').innerHTML = '<p>Loading social media mentions...</p>';
    document.getElementById('student-reviews').innerHTML = '<p>Loading student reviews...</p>';

    try {
        const communityData = await getCommunityData(university.name);
        
        // Update Reddit posts
        document.getElementById('reddit-posts').innerHTML = communityData.reddit.map(post => `
            <div class="social-post">
                <div class="social-post-header">
                    <span class="social-platform">${post.platform}</span>
                    <span class="social-date">${post.date}</span>
                </div>
                <div class="social-content">${post.content}</div>
            </div>
        `).join('');

        // Update social mentions
        document.getElementById('social-mentions').innerHTML = communityData.social.map(post => `
            <div class="social-post">
                <div class="social-post-header">
                    <span class="social-platform">${post.platform}</span>
                    <span class="social-date">${post.date}</span>
                </div>
                <div class="social-content">${post.content}</div>
            </div>
        `).join('');

        // Update student reviews
        document.getElementById('student-reviews').innerHTML = communityData.reviews.map(post => `
            <div class="social-post">
                <div class="social-post-header">
                    <span class="social-platform">${post.platform}</span>
                    <span class="social-date">${post.date}</span>
                </div>
                <div class="social-content">${post.content}</div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading community data:', error);
        // Fallback to basic content
        document.getElementById('reddit-posts').innerHTML = '<p>Unable to load community discussions at this time.</p>';
        document.getElementById('social-mentions').innerHTML = '<p>Unable to load social media mentions at this time.</p>';
        document.getElementById('student-reviews').innerHTML = '<p>Unable to load student reviews at this time.</p>';
    }
}

// Get Community Data using Groq AI
async function getCommunityData(universityName) {
    const prompt = `Generate realistic social media content and community discussions about ${universityName}. 

Create content that would typically appear on social platforms discussing this university. Include:
1. Reddit-style discussions about student experiences
2. Twitter/Instagram posts about campus life and admissions
3. Student reviews and testimonials

Return the data in this JSON format:
{
  "reddit": [
    {
      "platform": "Reddit",
      "date": "2 days ago",
      "content": "Realistic Reddit post content about student experience"
    }
  ],
  "social": [
    {
      "platform": "Twitter",
      "date": "3 days ago", 
      "content": "Realistic social media post about the university"
    }
  ],
  "reviews": [
    {
      "platform": "Student Review",
      "date": "1 month ago",
      "content": "Realistic student review about academics and campus life"
    }
  ]
}

Generate 2-3 posts for each category. Make them realistic and diverse in tone (positive, mixed, constructive criticism).`;

    try {
        const response = await fetch(CONFIG.GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${CONFIG.GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instant',
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.8,
                max_tokens: 1500
            })
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;
        
        // Parse JSON response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        } else {
            throw new Error('Invalid response format');
        }
    } catch (error) {
        console.error('Community data error:', error);
        // Return fallback data
        return {
            reddit: [
                {
                    platform: 'Reddit',
                    date: 'Recent',
                    content: `Discussion about ${universityName} - community insights unavailable at this time.`
                }
            ],
            social: [
                {
                    platform: 'Social Media',
                    date: 'Recent',
                    content: `Social media mentions about ${universityName} - data unavailable at this time.`
                }
            ],
            reviews: [
                {
                    platform: 'Student Review',
                    date: 'Recent',
                    content: `Student reviews about ${universityName} - data unavailable at this time.`
                }
            ]
        };
    }
}

// Utility Functions
function showLoadingOverlay() {
    elements.loadingOverlay.style.display = 'flex';
}

function hideLoadingOverlay() {
    elements.loadingOverlay.style.display = 'none';
}

function showError(message) {
    // Create a simple error notification
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-notification';
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #dc3545;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;
    errorDiv.textContent = message;
    
    document.body.appendChild(errorDiv);
    
    // Remove after 5 seconds
    setTimeout(() => {
        errorDiv.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            document.body.removeChild(errorDiv);
        }, 300);
    }, 5000);
}

function showSuccess(message) {
    // Create a simple success notification
    const successDiv = document.createElement('div');
    successDiv.className = 'success-notification';
    successDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;
    successDiv.textContent = message;
    
    document.body.appendChild(successDiv);
    
    // Remove after 5 seconds
    setTimeout(() => {
        successDiv.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            document.body.removeChild(successDiv);
        }, 300);
    }, 5000);
}

// Add CSS animations for error notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// LinkedIn Integration
async function connectLinkedIn() {
    try {
        // In a real implementation, this would use LinkedIn's OAuth API
        // For demo purposes, we'll simulate a successful connection
        console.log('Connecting to LinkedIn...');
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Update UI to show connected state
        linkedInConnected = true;
        elements.linkedinAuthSection.style.display = 'none';
        elements.linkedinConnectedSection.style.display = 'block';
        
        showSuccess('LinkedIn connected successfully!');
        
        // If we have a user profile, load mutuality data
        if (currentUserProfile) {
            loadMutualityData();
        }
        
    } catch (error) {
        console.error('LinkedIn connection error:', error);
        showError('Failed to connect to LinkedIn. Please try again.');
    }
}

function disconnectLinkedIn() {
    linkedInConnected = false;
    elements.linkedinAuthSection.style.display = 'block';
    elements.linkedinConnectedSection.style.display = 'none';
    elements.mutualityList.style.display = 'none';
    
    showSuccess('LinkedIn disconnected successfully!');
}

// Load Mutuality Data
async function loadMutualityData() {
    if (!linkedInConnected || !currentUserProfile) {
        showError('Please connect your LinkedIn account first.');
        return;
    }

    showLoadingOverlay();
    
    try {
        console.log('Loading mutuality data for profile:', currentUserProfile);
        
        // Generate mutuality profiles using AI
        const mutualityProfiles = await generateMutualityProfiles(currentUserProfile);
        displayMutualityProfiles(mutualityProfiles);
        
        // Show mutuality list
        elements.mutualityList.style.display = 'block';
        
    } catch (error) {
        console.error('Error loading mutuality data:', error);
        showError('Failed to load mutuality data. Please try again.');
    } finally {
        hideLoadingOverlay();
    }
}

// Generate Mutuality Profiles using AI
async function generateMutualityProfiles(userProfile) {
    const prompt = `You are a LinkedIn networking expert. Based on the following student profile, generate 5 realistic LinkedIn profiles of people who have similar academic backgrounds and pursued master's degrees in related fields.

STUDENT PROFILE:
- Field of Study: ${userProfile.speciality}
- GPA: ${userProfile.gpa}/4.0
- Country Preference: ${userProfile.country}
- Education Language: ${userProfile.educationLanguage}
- Academic Level: ${userProfile.academicLevel}
- Work Experience: ${userProfile.workExperience} years
- Research Experience: ${userProfile.researchExperience.join(', ') || 'None'}
- Extracurricular Activities: ${userProfile.extracurriculars.join(', ') || 'None'}

Generate realistic LinkedIn profiles of people who:
1. Have similar academic backgrounds (GPA range, field of study, research experience)
2. Successfully pursued master's degrees in related fields
3. Are now working in relevant industries
4. Have LinkedIn profiles with realistic information

Return ONLY a valid JSON response in this exact format:
{
  "profiles": [
    {
      "name": "John Smith",
      "title": "Software Engineer at Google",
      "location": "San Francisco, CA",
      "similarityScore": 92,
      "linkedinUrl": "https://linkedin.com/in/johnsmith",
      "currentRole": "Senior Software Engineer",
      "company": "Google",
      "education": [
        {
          "degree": "Master of Science in Computer Science",
          "university": "Stanford University",
          "year": "2020",
          "gpa": "3.8"
        },
        {
          "degree": "Bachelor of Science in Computer Science",
          "university": "UC Berkeley",
          "year": "2018",
          "gpa": "3.7"
        }
      ],
      "experience": [
        {
          "title": "Senior Software Engineer",
          "company": "Google",
          "duration": "2020 - Present"
        },
        {
          "title": "Software Engineer Intern",
          "company": "Microsoft",
          "duration": "Summer 2019"
        }
      ],
      "skills": ["Python", "Machine Learning", "Data Structures", "Algorithms"],
      "achievements": "Published 3 research papers in AI/ML conferences",
      "backgroundMatch": "Similar GPA (3.7 vs 3.8), same field (Computer Science), similar research experience in AI/ML"
    }
  ]
}

Make the profiles realistic and diverse. Include people from different universities, companies, and career paths but all related to the student's field of study.`;

    try {
        const response = await fetch(CONFIG.GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${CONFIG.GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instant',
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.8,
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;
        
        // Parse JSON response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const result = JSON.parse(jsonMatch[0]);
            return result.profiles || [];
        } else {
            throw new Error('Invalid response format');
        }
    } catch (error) {
        console.error('Mutuality profiles generation error:', error);
        // Return fallback data
        return generateFallbackMutualityProfiles(userProfile);
    }
}

// Generate Fallback Mutuality Profiles
function generateFallbackMutualityProfiles(userProfile) {
    const field = userProfile.speciality;
    const gpa = userProfile.gpa;
    
    return [
        {
            name: "Sarah Johnson",
            title: "Senior Data Scientist at Amazon",
            location: "Seattle, WA",
            similarityScore: 88,
            linkedinUrl: "https://linkedin.com/in/sarahjohnson",
            currentRole: "Senior Data Scientist",
            company: "Amazon",
            education: [
                {
                    degree: `Master of Science in ${field}`,
                    university: "University of Washington",
                    year: "2021",
                    gpa: (gpa + 0.1).toFixed(1)
                }
            ],
            experience: [
                {
                    title: "Senior Data Scientist",
                    company: "Amazon",
                    duration: "2021 - Present"
                }
            ],
            skills: ["Python", "Machine Learning", "Statistics"],
            achievements: "Led multiple ML projects with significant business impact",
            backgroundMatch: `Similar GPA (${gpa.toFixed(1)} vs ${(gpa + 0.1).toFixed(1)}), same field (${field})`
        },
        {
            name: "Michael Chen",
            title: "Software Engineer at Microsoft",
            location: "Redmond, WA",
            similarityScore: 85,
            linkedinUrl: "https://linkedin.com/in/michaelchen",
            currentRole: "Software Engineer",
            company: "Microsoft",
            education: [
                {
                    degree: `Master of Science in ${field}`,
                    university: "Carnegie Mellon University",
                    year: "2020",
                    gpa: gpa.toFixed(1)
                }
            ],
            experience: [
                {
                    title: "Software Engineer",
                    company: "Microsoft",
                    duration: "2020 - Present"
                }
            ],
            skills: ["C++", "System Design", "Algorithms"],
            achievements: "Contributed to open-source projects with 1000+ stars",
            backgroundMatch: `Exact GPA match (${gpa.toFixed(1)}), same field (${field})`
        }
    ];
}

// Display Mutuality Profiles
function displayMutualityProfiles(profiles) {
    if (profiles.length === 0) {
        elements.mutualityProfiles.innerHTML = '<p>No similar profiles found. Try adjusting your search criteria.</p>';
        return;
    }

    const profilesHTML = profiles.map(profile => `
        <div class="mutuality-profile">
            <div class="profile-header">
                <div class="profile-avatar">
                    ${profile.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div class="profile-info">
                    <h4>${profile.name}</h4>
                    <p class="profile-title">${profile.title}</p>
                    <span class="similarity-score">${profile.similarityScore}% Match</span>
                </div>
            </div>
            
            <div class="profile-details">
                <div class="detail-item">
                    <span class="detail-label">Location:</span>
                    <span class="detail-value">${profile.location}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Current Role:</span>
                    <span class="detail-value">${profile.currentRole} at ${profile.company}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Background Match:</span>
                    <span class="detail-value">${profile.backgroundMatch}</span>
                </div>
            </div>
            
            <div class="education-path">
                <h5>Education Path</h5>
                ${profile.education.map(edu => `
                    <div class="education-item">
                        <i class="fas fa-graduation-cap"></i>
                        <span>${edu.degree} - ${edu.university} (${edu.year}) - GPA: ${edu.gpa}</span>
                    </div>
                `).join('')}
            </div>
            
            <div class="profile-actions">
                <button class="connect-btn" onclick="openLinkedInProfile('${profile.linkedinUrl}')">
                    <i class="fab fa-linkedin"></i>
                    Connect on LinkedIn
                </button>
                <button class="view-profile-btn" onclick="openLinkedInProfile('${profile.linkedinUrl}')">
                    <i class="fas fa-external-link-alt"></i>
                    View Profile
                </button>
            </div>
        </div>
    `).join('');

    elements.mutualityProfiles.innerHTML = profilesHTML;
}

// Open LinkedIn Profile
function openLinkedInProfile(url) {
    window.open(url, '_blank');
}

// Export functions for testing (if needed)
window.OKHU = {
    switchTab,
    switchSubTab,
    switchResultsTab,
    getUniversityRecommendations,
    searchUniversity,
    validateRecommendationForm,
    connectLinkedIn,
    disconnectLinkedIn,
    loadMutualityData
};
