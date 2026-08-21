// Constants and State
let rawWorkbookData = null; // Stored parsed excel sheets
let parsedBlocks = []; // Processed block-level records
let filteredBlocks = []; // Currently filtered records (for rendering)
let activeSort = { column: 'district', direction: 'asc' }; // Active sorting column and direction
let districtChart = null; // ApexCharts instances
let topBlocksChart = null;
let districtLeadersSearchText = '';

// Official Maharashtra 34 Districts to 6 Administrative Divisions Mapping
const DISTRICT_TO_DIVISION = {
    'Palghar': 'Konkan', 'Thane': 'Konkan', 'Raigad': 'Konkan', 'Ratnagiri': 'Konkan', 'Sindhudurg': 'Konkan',
    'Pune': 'Pune', 'Satara': 'Pune', 'Sangli': 'Pune', 'Solapur': 'Pune', 'Kolhapur': 'Pune',
    'Nashik': 'Nashik', 'Dhule': 'Nashik', 'Nandurbar': 'Nashik', 'Jalgaon': 'Nashik', 'Ahilyanagar': 'Nashik',
    'Chh.Sambhajinagar': 'Chhatrapati Sambhajinagar', 'Jalna': 'Chhatrapati Sambhajinagar', 'Parbhani': 'Chhatrapati Sambhajinagar',
    'Hingoli': 'Chhatrapati Sambhajinagar', 'Nanded': 'Chhatrapati Sambhajinagar', 'Beed': 'Chhatrapati Sambhajinagar',
    'Latur': 'Chhatrapati Sambhajinagar', 'Dharashiv': 'Chhatrapati Sambhajinagar',
    'Amravati': 'Amravati', 'Akola': 'Amravati', 'Buldhana': 'Amravati', 'Washim': 'Amravati', 'Yavatmal': 'Amravati',
    'Nagpur': 'Nagpur', 'Wardha': 'Nagpur', 'Bhandara': 'Nagpur', 'Gondia': 'Nagpur', 'Chandrapur': 'Nagpur', 'Gadchiroli': 'Nagpur'
};

// DOM Elements
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const currentFileName = document.getElementById('current-file-name');
const thresholdSlider = document.getElementById('threshold-slider');
const thresholdVal = document.getElementById('threshold-val');
const maxAwardsSlider = document.getElementById('max-awards-slider');
const maxAwardsVal = document.getElementById('max-awards-val');
const aggMethodSelect = document.getElementById('agg-method');
const divisionSelect = document.getElementById('division-select'); // Sidebar division dropdown
const tableDivisionSelect = document.getElementById('table-division-select'); // Table toolbar division dropdown
const districtSelect = document.getElementById('district-select');
const blockSelect = document.getElementById('block-select'); // Block dropdown
const districtPillsContainer = document.getElementById('district-pills-container'); // District quick-pills bar
const breadcrumbTrail = document.getElementById('breadcrumb-trail'); // Drilldown breadcrumbs
const breadcrumbBackBtn = document.getElementById('breadcrumb-back-btn'); // Drilldown back button
const currentLevelBadge = document.getElementById('current-level-badge'); // Current level indicator
const searchInput = document.getElementById('search-input');
const exportCsvBtn = document.getElementById('export-csv');
const resetParamsBtn = document.getElementById('reset-params');
const tableBody = document.getElementById('table-body');
const tableShowingCount = document.getElementById('table-showing-count');
const loadingOverlay = document.getElementById('loading-overlay');

// System Date Setup
document.getElementById('system-time').innerText = new Date().toISOString().split('T')[0];

// Initialization
window.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    initEventListeners();
    
    // Landing Page Elements
    const landingPageContainer = document.getElementById('landing-page-container');
    const appContainer = document.getElementById('app-container');
    const cardRankings = document.getElementById('card-rankings');
    const cardSearch = document.getElementById('card-search');
    
    // Tab switching routing logic
    const portalNavBtns = document.querySelectorAll('.portal-nav-btn');
    const rankingsSidebar = document.getElementById('rankings-sidebar-controls');
    const searchSidebar = document.getElementById('search-sidebar-controls');
    const rankingsMain = document.getElementById('rankings-main-wrapper');
    const searchMain = document.getElementById('search-main-wrapper');

    // Helper to open a dashboard tab and hide landing page
    const openDashboardTab = (tabName) => {
        landingPageContainer.classList.add('fade-out');
        appContainer.classList.remove('hidden');
        
        // Trigger tab selection programmatically
        portalNavBtns.forEach(btn => {
            const btnTab = btn.getAttribute('data-tab');
            if (btnTab === tabName) {
                // If it's search, we also trigger search tab init
                btn.click();
            }
        });
    };

    // Card click listeners
    if (cardRankings) {
        cardRankings.addEventListener('click', () => openDashboardTab('rankings'));
    }
    if (cardSearch) {
        cardSearch.addEventListener('click', () => openDashboardTab('search'));
    }

    portalNavBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const activeTab = btn.getAttribute('data-tab');
            
            // Handle home button click (return to landing page)
            if (activeTab === 'home') {
                appContainer.classList.add('hidden');
                landingPageContainer.classList.remove('fade-out');
                portalNavBtns.forEach(b => b.classList.remove('active'));
                return;
            }
            
            // Toggle active classes on buttons (excluding home button)
            portalNavBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Toggle sidebar and main panels visibility
            if (activeTab === 'rankings') {
                rankingsSidebar.classList.remove('hidden');
                searchSidebar.classList.add('hidden');
                rankingsMain.classList.remove('hidden');
                searchMain.classList.add('hidden');
            } else if (activeTab === 'search') {
                rankingsSidebar.classList.add('hidden');
                searchSidebar.classList.remove('hidden');
                rankingsMain.classList.add('hidden');
                searchMain.classList.remove('hidden');
                
                // Initialize search portal if not loaded
                if (typeof initSearchPortal === 'function') {
                    initSearchPortal();
                }
            }
        });
    });
    
    // Check if running on file:// protocol (which triggers CORS fetch block)
    if (window.location.protocol === 'file:') {
        const banner = document.getElementById('cors-warning-banner');
        if (banner) {
            banner.classList.remove('hidden');
        }
        showLoading(false);
    } else {
        loadDefaultFile();
    }
});

// Event Listeners Configuration
function initEventListeners() {
    // Sliders
    thresholdSlider.addEventListener('input', (e) => {
        thresholdVal.innerText = `${e.target.value}%`;
        processData();
    });
    
    maxAwardsSlider.addEventListener('input', (e) => {
        maxAwardsVal.innerText = e.target.value;
        processData();
    });

    // Dropdowns & Inputs
    aggMethodSelect.addEventListener('change', processData);
    
    // Dynamic Division dropdown listener (Sidebar)
    if (divisionSelect) {
        divisionSelect.addEventListener('change', () => {
            handleDivisionChange(divisionSelect.value);
        });
    }

    // Dynamic Division dropdown listener (Table Toolbar)
    if (tableDivisionSelect) {
        tableDivisionSelect.addEventListener('change', () => {
            handleDivisionChange(tableDivisionSelect.value);
        });
    }

    // Dynamic District dropdown listener
    districtSelect.addEventListener('change', () => {
        const selectedDistrict = districtSelect.value;
        const selectedDivision = divisionSelect ? divisionSelect.value : 'all';
        
        if (selectedDistrict === 'all') {
            blockSelect.innerHTML = '<option value="all" data-i18n="opt_all_blocks">All Blocks</option>';
            blockSelect.value = 'all';
            blockSelect.disabled = true;
        } else {
            blockSelect.disabled = false;
            blockSelect.innerHTML = '<option value="all" data-i18n="opt_all_blocks">All Blocks</option>';
            
            // Filter unique blocks in the selected district
            let blocksInSelected = parsedBlocks.filter(b => b.district === selectedDistrict);
            if (selectedDivision !== 'all') {
                blocksInSelected = blocksInSelected.filter(b => b.division === selectedDivision);
            }
            const uniqueBlocks = Array.from(new Set(blocksInSelected.map(b => b.block))).sort();
            
            uniqueBlocks.forEach(block => {
                const opt = document.createElement('option');
                opt.value = block;
                opt.textContent = block;
                blockSelect.appendChild(opt);
            });
            
            blockSelect.value = 'all';
        }
        renderDistrictPills();
        filterAndRender();
    });

    // Block dropdown listener
    blockSelect.addEventListener('change', filterAndRender);
    searchInput.addEventListener('input', filterAndRender);
    
    // District Leaders Search Input listener
    const dlSearch = document.getElementById('district-leaders-search');
    if (dlSearch) {
        dlSearch.addEventListener('input', (e) => {
            districtLeadersSearchText = e.target.value;
            renderDistrictLeaders();
        });
    }
    
    // Breadcrumb Back Button listener
    if (breadcrumbBackBtn) {
        breadcrumbBackBtn.addEventListener('click', () => {
            const selectedDistrict = districtSelect.value;
            const selectedBlock = blockSelect.value;
            
            if (selectedDistrict !== 'all' && selectedBlock !== 'all') {
                // Level 4 -> Level 3: Back to District Blocks
                blockSelect.value = 'all';
                blockSelect.dispatchEvent(new Event('change'));
            } else if (selectedDistrict !== 'all') {
                // Level 3 -> Level 2: Back to Division Districts
                districtSelect.value = 'all';
                districtSelect.dispatchEvent(new Event('change'));
            } else if (divisionSelect && divisionSelect.value !== 'all') {
                // Level 2 -> Level 1: Back to All Divisions
                handleDivisionChange('all');
            }
        });
    }

    // Buttons
    resetParamsBtn.addEventListener('click', resetParameters);
    exportCsvBtn.addEventListener('click', exportCSV);

    // Sorting Headers
    document.querySelectorAll('th.sortable').forEach(header => {
        header.addEventListener('click', () => {
            const column = header.getAttribute('data-sort');
            if (activeSort.column === column) {
                activeSort.direction = activeSort.direction === 'asc' ? 'desc' : 'asc';
            } else {
                activeSort.column = column;
                activeSort.direction = 'desc'; // Default to desc for performance numbers
            }
            
            // Update sort icon visual state
            document.querySelectorAll('th.sortable').forEach(h => {
                const icon = h.querySelector('.sort-icon');
                if (icon) icon.setAttribute('data-lucide', 'chevrons-up-down');
            });
            
            const activeIcon = header.querySelector('.sort-icon');
            if (activeIcon) {
                activeIcon.setAttribute('data-lucide', activeSort.direction === 'asc' ? 'chevron-up' : 'chevron-down');
            }
            lucide.createIcons();
            
            sortAndRender();
        });
    });

    // File Drag & Drop
    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);
    
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });
    
    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });
    
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
        }
    });
}

// Division change handler synced between sidebar and table toolbar (Global / Top-level Scope)
function handleDivisionChange(newDivision) {
    if (divisionSelect && divisionSelect.value !== newDivision) divisionSelect.value = newDivision;
    if (tableDivisionSelect && tableDivisionSelect.value !== newDivision) tableDivisionSelect.value = newDivision;
    
    // Re-populate District dropdown based on selected division
    districtSelect.innerHTML = '<option value="all" data-i18n="opt_all_districts">All Districts</option>';
    
    let filteredByDivision = parsedBlocks;
    if (newDivision !== 'all') {
        filteredByDivision = parsedBlocks.filter(b => b.division === newDivision);
    }
    
    const uniqueDistricts = Array.from(new Set(filteredByDivision.map(b => b.district))).sort();
    uniqueDistricts.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d;
        opt.textContent = d;
        districtSelect.appendChild(opt);
    });
    districtSelect.value = 'all';
    
    // Reset block dropdown
    blockSelect.innerHTML = '<option value="all" data-i18n="opt_all_blocks">All Blocks</option>';
    blockSelect.value = 'all';
    blockSelect.disabled = true;
    
    renderDistrictPills();
    filterAndRender();
}

// Reset UI configuration to default
function resetParameters() {
    thresholdSlider.value = 60;
    thresholdVal.innerText = '60%';
    maxAwardsSlider.value = 5;
    maxAwardsVal.innerText = '5';
    aggMethodSelect.value = 'mean';
    if (divisionSelect) divisionSelect.value = 'all';
    if (tableDivisionSelect) tableDivisionSelect.value = 'all';
    districtSelect.value = 'all';
    
    blockSelect.innerHTML = '<option value="all" data-i18n="opt_all_blocks">All Blocks</option>';
    blockSelect.value = 'all';
    blockSelect.disabled = true;
    
    searchInput.value = '';
    
    // Reset District Leaders search input and value
    const dlSearch = document.getElementById('district-leaders-search');
    if (dlSearch) {
        dlSearch.value = '';
    }
    districtLeadersSearchText = '';
    
    processData();
}

// Fetch and load default spreadsheet
async function loadDefaultFile() {
    showLoading(true);
    try {
        const response = await fetch('./29.05.2026_with_Division.xlsx');
        if (!response.ok) {
            throw new Error(`Failed to load default file: ${response.statusText}`);
        }
        const data = await response.arrayBuffer();
        const workbook = XLSX.read(new Uint8Array(data), { type: 'array' });
        rawWorkbookData = workbook;
        currentFileName.innerText = '29.05.2026_with_Division.xlsx';
        currentFileName.setAttribute('title', '29.05.2026_with_Division.xlsx');
        
        processData();
    } catch (error) {
        console.error("Error loading Excel file:", error);
        alert("Could not load default 29.05.2026_with_Division.xlsx file automatically. Please upload manually.");
        showLoading(false);
    }
}

// Handle User Upload file selection
function handleFileSelect(e) {
    if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
    }
}

// Parse uploaded file
function handleFile(file) {
    showLoading(true);
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            rawWorkbookData = workbook;
            currentFileName.innerText = file.name;
            currentFileName.setAttribute('title', file.name);
            
            // Reset filters on new file load
            if (divisionSelect) divisionSelect.value = 'all';
            if (tableDivisionSelect) tableDivisionSelect.value = 'all';
            districtSelect.value = 'all';
            blockSelect.innerHTML = '<option value="all" data-i18n="opt_all_blocks">All Blocks</option>';
            blockSelect.value = 'all';
            blockSelect.disabled = true;
            searchInput.value = '';
            
            processData();
        } catch (err) {
            console.error("Error parsing uploaded file:", err);
            alert("Error parsing Excel file. Please ensure it is a valid format.");
            showLoading(false);
        }
    };
    reader.readAsArrayBuffer(file);
}

// Process spreadsheet contents & generate aggregates
function processData() {
    if (!rawWorkbookData) return;
    
    showLoading(true);
    setTimeout(() => {
        try {
            const firstSheetName = rawWorkbookData.SheetNames[0];
            const worksheet = rawWorkbookData.Sheets[firstSheetName];
            const rawRows = XLSX.utils.sheet_to_json(worksheet);

            // Group by District -> Block -> Grampanchayats
            const districtMap = {};
            
            rawRows.forEach(row => {
                const district = (row['DISTRICT VIRIFIED'] || row['DISTRICT VERIFIED'] || row['District'] || '').toString().trim();
                const block = (row['BLOCK VERIFIED'] || row['Block'] || '').toString().trim();
                const division = (row['Division'] || row['DIVISION'] || DISTRICT_TO_DIVISION[district] || '').toString().trim();
                const gp = (row['GrampanchayatName'] || row['GP'] || '').toString().trim();
                const totalMarks = parseFloat(row['TotalMarks']) || 0;
                const totalOutOf = parseFloat(row['TotalOutOfMarks']) || 0;
                const pct = parseFloat(row['Percentage']) || 0;
                
                if (!district || !block) return;
                
                if (!districtMap[district]) {
                    districtMap[district] = {};
                }
                if (!districtMap[district][block]) {
                    districtMap[district][block] = {
                        division: division,
                        district: district,
                        block: block,
                        gpList: []
                    };
                }
                
                districtMap[district][block].gpList.push({
                    name: gp,
                    totalMarks: totalMarks,
                    totalOutOf: totalOutOf,
                    percentage: pct
                });
            });

            // Read parameter values
            const threshold = parseFloat(thresholdSlider.value);
            const maxAwards = parseInt(maxAwardsSlider.value);
            const aggStrategy = aggMethodSelect.value;
            
            const allProcessedBlocks = [];
            const districtsList = new Set();

            // Calculate aggregate scores
            for (const district in districtMap) {
                districtsList.add(district);
                const blocksInDistrict = [];
                
                for (const block in districtMap[district]) {
                    const blockObj = districtMap[district][block];
                    const gpList = blockObj.gpList;
                    
                    let score = 0;
                    if (aggStrategy === 'mean') {
                        const sumPct = gpList.reduce((acc, gp) => acc + gp.percentage, 0);
                        score = gpList.length > 0 ? (sumPct / gpList.length) : 0;
                    } else if (aggStrategy === 'sum_ratio') {
                        const sumMarks = gpList.reduce((acc, gp) => acc + gp.totalMarks, 0);
                        const sumOutOf = gpList.reduce((acc, gp) => acc + gp.totalOutOf, 0);
                        score = sumOutOf > 0 ? ((sumMarks / sumOutOf) * 100) : 0;
                    } else if (aggStrategy === 'max') {
                        score = gpList.length > 0 ? Math.max(...gpList.map(gp => gp.percentage)) : 0;
                    } else if (aggStrategy === 'min') {
                        score = gpList.length > 0 ? Math.min(...gpList.map(gp => gp.percentage)) : 0;
                    }
                    
                    score = Math.round(score * 100) / 100;
                    
                    blocksInDistrict.push({
                        division: blockObj.division,
                        district: blockObj.district,
                        block: blockObj.block,
                        score: score,
                        gpCount: gpList.length,
                        gpList: gpList,
                        eligible: score >= threshold,
                        rank: null,
                        status: 'Excluded'
                    });
                }

                // Rank the eligible blocks in descending order within the district
                const eligibleBlocks = blocksInDistrict.filter(b => b.eligible);
                eligibleBlocks.sort((a, b) => b.score - a.score);
                
                eligibleBlocks.forEach((block, index) => {
                    block.rank = index + 1;
                    if (block.rank <= maxAwards) {
                        block.status = 'Awarded';
                    } else {
                        block.status = 'Eligible';
                    }
                });

                allProcessedBlocks.push(...blocksInDistrict);
            }

            parsedBlocks = allProcessedBlocks;

            // 1. Populate Division Dropdowns (both sidebar and table toolbar)
            const currentSelectedDivision = divisionSelect ? divisionSelect.value : 'all';
            const uniqueDivisions = Array.from(new Set(allProcessedBlocks.map(b => b.division).filter(Boolean))).sort();
            
            [divisionSelect, tableDivisionSelect].forEach(sel => {
                if (!sel) return;
                sel.innerHTML = '<option value="all" data-i18n="opt_all_divisions">All Divisions</option>';
                uniqueDivisions.forEach(div => {
                    const opt = document.createElement('option');
                    opt.value = div;
                    opt.textContent = div;
                    sel.appendChild(opt);
                });
                if (uniqueDivisions.includes(currentSelectedDivision)) {
                    sel.value = currentSelectedDivision;
                } else {
                    sel.value = 'all';
                }
            });

            // 2. Populate District Dropdown based on active division selection
            const activeDivision = divisionSelect ? divisionSelect.value : 'all';
            const currentSelectedDistrict = districtSelect.value;
            districtSelect.innerHTML = '<option value="all" data-i18n="opt_all_districts">All Districts</option>';
            
            let eligibleBlocksForDistricts = allProcessedBlocks;
            if (activeDivision !== 'all') {
                eligibleBlocksForDistricts = allProcessedBlocks.filter(b => b.division === activeDivision);
            }
            
            const sortedDistricts = Array.from(new Set(eligibleBlocksForDistricts.map(b => b.district))).sort();
            sortedDistricts.forEach(d => {
                const opt = document.createElement('option');
                opt.value = d;
                opt.textContent = d;
                districtSelect.appendChild(opt);
            });
            
            if (sortedDistricts.includes(currentSelectedDistrict)) {
                districtSelect.value = currentSelectedDistrict;
                blockSelect.disabled = false;
                const prevBlockVal = blockSelect.value;
                blockSelect.innerHTML = '<option value="all" data-i18n="opt_all_blocks">All Blocks</option>';
                
                let blocksInSelectedDistrict = parsedBlocks.filter(b => b.district === currentSelectedDistrict);
                if (activeDivision !== 'all') {
                    blocksInSelectedDistrict = blocksInSelectedDistrict.filter(b => b.division === activeDivision);
                }
                const uniqueBlocks = Array.from(new Set(blocksInSelectedDistrict.map(b => b.block))).sort();
                uniqueBlocks.forEach(block => {
                    const opt = document.createElement('option');
                    opt.value = block;
                    opt.textContent = block;
                    blockSelect.appendChild(opt);
                });
                
                if (uniqueBlocks.includes(prevBlockVal)) {
                    blockSelect.value = prevBlockVal;
                } else {
                    blockSelect.value = 'all';
                }
            } else {
                districtSelect.value = 'all';
                blockSelect.innerHTML = '<option value="all" data-i18n="opt_all_blocks">All Blocks</option>';
                blockSelect.value = 'all';
                blockSelect.disabled = true;
            }

            renderDistrictPills();
            filterAndRender();
        } catch (error) {
            console.error("Error processing Excel workbook:", error);
            alert("Error parsing spreadsheet data. Check structure.");
            showLoading(false);
        }
    }, 50);
}

// Breadcrumb updater for multi-level navigation
function updateBreadcrumbs() {
    if (!breadcrumbTrail) return;
    
    breadcrumbTrail.innerHTML = '';
    const isMr = window.i18n && window.i18n.getCurrent() === 'mr';
    const selectedDivision = divisionSelect ? divisionSelect.value : 'all';
    const selectedDistrict = districtSelect.value;
    const selectedBlock = blockSelect.value;
    const searchVal = searchInput.value.trim();

    // 1. Root / State Crumb
    const stateCrumb = document.createElement('span');
    stateCrumb.className = `breadcrumb-item ${selectedDivision === 'all' && !searchVal ? 'active' : ''}`;
    stateCrumb.innerHTML = `<i data-lucide="home" style="width: 13px; height: 13px;"></i> ${isMr ? 'महाराष्ट्र राज्य' : 'Maharashtra State'}`;
    stateCrumb.addEventListener('click', () => {
        if (selectedDivision !== 'all' || selectedDistrict !== 'all' || selectedBlock !== 'all') {
            searchInput.value = '';
            handleDivisionChange('all');
        }
    });
    breadcrumbTrail.appendChild(stateCrumb);

    // If search is active
    if (searchVal) {
        const sep = document.createElement('span');
        sep.className = 'breadcrumb-separator';
        sep.innerHTML = '<i data-lucide="chevron-right" style="width: 14px; height: 14px;"></i>';
        breadcrumbTrail.appendChild(sep);

        const searchCrumb = document.createElement('span');
        searchCrumb.className = 'breadcrumb-item active';
        searchCrumb.innerHTML = `<i data-lucide="search" style="width: 13px; height: 13px;"></i> "${searchVal}"`;
        breadcrumbTrail.appendChild(searchCrumb);

        if (breadcrumbBackBtn) breadcrumbBackBtn.style.display = 'inline-flex';
        if (currentLevelBadge) currentLevelBadge.innerText = isMr ? 'शोध निकाल' : 'SEARCH';
        lucide.createIcons();
        return;
    }

    // 2. Division Crumb (if selected)
    if (selectedDivision !== 'all') {
        const sep1 = document.createElement('span');
        sep1.className = 'breadcrumb-separator';
        sep1.innerHTML = '<i data-lucide="chevron-right" style="width: 14px; height: 14px;"></i>';
        breadcrumbTrail.appendChild(sep1);

        const divCrumb = document.createElement('span');
        divCrumb.className = `breadcrumb-item ${selectedDistrict === 'all' ? 'active' : ''}`;
        divCrumb.innerHTML = `<i data-lucide="map-pin" style="width: 13px; height: 13px;"></i> ${selectedDivision} ${isMr ? 'विभाग' : 'Division'}`;
        divCrumb.addEventListener('click', () => {
            if (selectedDistrict !== 'all' || selectedBlock !== 'all') {
                districtSelect.value = 'all';
                districtSelect.dispatchEvent(new Event('change'));
            }
        });
        breadcrumbTrail.appendChild(divCrumb);
    }

    // 3. District Crumb (if selected)
    if (selectedDistrict !== 'all') {
        const sep2 = document.createElement('span');
        sep2.className = 'breadcrumb-separator';
        sep2.innerHTML = '<i data-lucide="chevron-right" style="width: 14px; height: 14px;"></i>';
        breadcrumbTrail.appendChild(sep2);

        const distCrumb = document.createElement('span');
        distCrumb.className = `breadcrumb-item ${selectedBlock === 'all' ? 'active' : ''}`;
        distCrumb.innerHTML = `<i data-lucide="landmark" style="width: 13px; height: 13px;"></i> ${selectedDistrict} ${isMr ? 'जिल्हा' : 'District'}`;
        distCrumb.addEventListener('click', () => {
            if (selectedBlock !== 'all') {
                blockSelect.value = 'all';
                blockSelect.dispatchEvent(new Event('change'));
            }
        });
        breadcrumbTrail.appendChild(distCrumb);
    }

    // 4. Block Crumb (if selected)
    if (selectedDistrict !== 'all' && selectedBlock !== 'all') {
        const sep3 = document.createElement('span');
        sep3.className = 'breadcrumb-separator';
        sep3.innerHTML = '<i data-lucide="chevron-right" style="width: 14px; height: 14px;"></i>';
        breadcrumbTrail.appendChild(sep3);

        const blkCrumb = document.createElement('span');
        blkCrumb.className = 'breadcrumb-item active';
        blkCrumb.innerHTML = `<i data-lucide="layers" style="width: 13px; height: 13px;"></i> ${selectedBlock} ${isMr ? 'तालुका' : 'Block'}`;
        breadcrumbTrail.appendChild(blkCrumb);
    }

    // Update Back Button & Level Badge
    if (selectedDistrict !== 'all' && selectedBlock !== 'all') {
        if (breadcrumbBackBtn) breadcrumbBackBtn.style.display = 'inline-flex';
        if (currentLevelBadge) currentLevelBadge.innerText = isMr ? 'ग्रामपंचायती' : 'GRAMPANCHAYATS';
    } else if (selectedDistrict !== 'all') {
        if (breadcrumbBackBtn) breadcrumbBackBtn.style.display = 'inline-flex';
        if (currentLevelBadge) currentLevelBadge.innerText = isMr ? 'तालुके / ब्लॉक्स' : 'BLOCKS';
    } else if (selectedDivision !== 'all') {
        if (breadcrumbBackBtn) breadcrumbBackBtn.style.display = 'inline-flex';
        if (currentLevelBadge) currentLevelBadge.innerText = isMr ? 'जिल्हे' : 'DISTRICTS';
    } else {
        if (breadcrumbBackBtn) breadcrumbBackBtn.style.display = 'none';
        if (currentLevelBadge) currentLevelBadge.innerText = isMr ? 'महसूल विभाग' : 'DIVISIONS';
    }

    lucide.createIcons();
}

// Filter data by search terms, divisions, districts, and block selections
function filterAndRender() {
    const selectedDivision = divisionSelect ? divisionSelect.value : 'all';
    const selectedDistrict = districtSelect.value;
    const selectedBlock = blockSelect.value;
    const searchVal = searchInput.value.toLowerCase().trim();
    const threshold = parseFloat(thresholdSlider.value);
    
    // Check if we are in Block drill-down (both a specific district AND block are selected)
    if (selectedDistrict !== 'all' && selectedBlock !== 'all') {
        const matchingBlock = parsedBlocks.find(b => 
            (selectedDivision === 'all' || b.division === selectedDivision) &&
            b.district === selectedDistrict && 
            b.block === selectedBlock
        );
        
        if (matchingBlock) {
            let gpRows = matchingBlock.gpList.map(gp => ({
                isGpRow: true,
                division: matchingBlock.division,
                district: matchingBlock.district,
                block: matchingBlock.block,
                name: gp.name,
                score: gp.percentage,
                totalMarks: gp.totalMarks,
                totalOutOf: gp.totalOutOf,
                gpCount: 1,
                eligible: gp.percentage >= threshold,
                rank: null,
                status: 'Excluded'
            }));

            if (searchVal) {
                gpRows = gpRows.filter(gp => gp.name.toLowerCase().includes(searchVal));
            }

            const maxAwards = parseInt(maxAwardsSlider.value) || 5;
            const eligibleGPs = gpRows.filter(gp => gp.eligible);
            eligibleGPs.sort((a, b) => b.score - a.score);
            eligibleGPs.forEach((gp, idx) => {
                gp.rank = idx + 1;
                if (gp.rank <= maxAwards) {
                    gp.status = 'Awarded';
                } else {
                    gp.status = 'Eligible';
                }
            });
            
            const excludedGPs = gpRows.filter(gp => !gp.eligible);
            filteredBlocks = [...eligibleGPs, ...excludedGPs];
        } else {
            filteredBlocks = [];
        }
    } else {
        // Filter the blocks for active division / district / search query
        filteredBlocks = parsedBlocks.filter(block => {
            const divisionMatch = selectedDivision === 'all' || block.division === selectedDivision;
            const districtMatch = selectedDistrict === 'all' || block.district === selectedDistrict;
            
            let searchMatch = true;
            if (searchVal) {
                const blockNameMatch = block.block.toLowerCase().includes(searchVal);
                const districtNameMatch = block.district.toLowerCase().includes(searchVal);
                const divisionNameMatch = block.division && block.division.toLowerCase().includes(searchVal);
                const gpMatch = block.gpList.some(gp => gp.name.toLowerCase().includes(searchVal));
                searchMatch = blockNameMatch || districtNameMatch || divisionNameMatch || gpMatch;
            }
            
            return divisionMatch && districtMatch && searchMatch;
        });
    }

    sortAndRender();
    updateKPICards();
    renderCharts();
    renderDistrictLeaders();
}

// Sort active filtered blocks and render the table rows
function sortAndRender() {
    const col = activeSort.column;
    const dir = activeSort.direction === 'asc' ? 1 : -1;

    filteredBlocks.sort((a, b) => {
        if (col === 'rank') {
            const rA = a.rank === null ? 999999 : a.rank;
            const rB = b.rank === null ? 999999 : b.rank;
            return (rA - rB) * dir;
        } else if (col === 'district') {
            const distCompare = a.district.localeCompare(b.district);
            if (distCompare !== 0) return distCompare * dir;
            const rA = a.rank === null ? 999999 : a.rank;
            const rB = b.rank === null ? 999999 : b.rank;
            return rA - rB;
        } else if (col === 'block') {
            const valA = a.isGpRow ? a.name : a.block;
            const valB = b.isGpRow ? b.name : b.block;
            return valA.localeCompare(valB) * dir;
        } else if (col === 'score') {
            return (a.score - b.score) * dir;
        } else if (col === 'gps') {
            const valA = a.isGpRow ? a.totalMarks : a.gpCount;
            const valB = b.isGpRow ? b.totalMarks : b.gpCount;
            return (valA - valB) * dir;
        }
        return 0;
    });

    renderTable();
}

// Render HTML Table Rows (Hierarchical 4-Level Engine)
function renderTable() {
    const isMr = window.i18n && window.i18n.getCurrent() === 'mr';
    const selectedDivision = divisionSelect ? divisionSelect.value : 'all';
    const selectedDistrict = districtSelect.value;
    const selectedBlock = blockSelect.value;
    const searchVal = searchInput.value.toLowerCase().trim();
    const threshold = parseFloat(thresholdSlider.value);
    
    const tableHeader = document.querySelector('#rankings-table thead');
    tableBody.innerHTML = '';
    
    updateBreadcrumbs();
    
    if (!parsedBlocks || parsedBlocks.length === 0) {
        tableHeader.innerHTML = `<tr><th style="width: 60px;">#</th><th>Data</th></tr>`;
        tableBody.innerHTML = `<tr><td colspan="8" class="text-center py-5 text-muted">No data loaded</td></tr>`;
        showLoading(false);
        return;
    }

    // LEVEL 4 / SEARCH: If search is typed OR a specific block is selected
    if (searchVal || (selectedDistrict !== 'all' && selectedBlock !== 'all')) {
        const isGpView = filteredBlocks.length > 0 && filteredBlocks[0].isGpRow;
        tableShowingCount.innerText = filteredBlocks.length;
        
        if (isGpView) {
            tableHeader.innerHTML = `
                <tr>
                    <th style="width: 60px;">Rank</th>
                    <th>${isMr ? 'तालुका' : 'Block Name'}</th>
                    <th class="sortable" data-sort="block">${isMr ? 'ग्रामपंचायत नाव' : 'Grampanchayat Name'} <i data-lucide="chevrons-up-down" class="sort-icon"></i></th>
                    <th class="sortable text-center" data-sort="score">${isMr ? 'गुण (%)' : 'Score (%)'} <i data-lucide="chevrons-up-down" class="sort-icon"></i></th>
                    <th class="sortable text-center" data-sort="gps">${isMr ? 'गुण (प्राप्त / एकूण)' : 'Marks (Obtained / Out of)'} <i data-lucide="chevrons-up-down" class="sort-icon"></i></th>
                    <th class="text-center">${isMr ? 'स्थिती' : 'Status'}</th>
                </tr>
            `;
        } else {
            tableHeader.innerHTML = `
                <tr>
                    <th style="width: 60px;">Rank</th>
                    <th class="sortable" data-sort="district">${isMr ? 'जिल्हा' : 'District'} <i data-lucide="chevrons-up-down" class="sort-icon"></i></th>
                    <th class="sortable" data-sort="block">${isMr ? 'तालुका नाव' : 'Block Name'} <i data-lucide="chevrons-up-down" class="sort-icon"></i></th>
                    <th class="sortable text-center" data-sort="score">${isMr ? 'गुण (%)' : 'Score (%)'} <i data-lucide="chevrons-up-down" class="sort-icon"></i></th>
                    <th class="sortable text-center" data-sort="gps">${isMr ? 'ग्रामपंचायती' : 'Grampanchayats'} <i data-lucide="chevrons-up-down" class="sort-icon"></i></th>
                    <th class="text-center">${isMr ? 'स्थिती' : 'Status'}</th>
                    <th style="width: 50px;"></th>
                </tr>
            `;
        }
        
        if (filteredBlocks.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-5 text-muted">
                        <i data-lucide="info" style="width: 24px; height: 24px; margin-bottom: 8px;"></i>
                        <p>${isMr ? 'सक्रिय फिल्टरशी जुळणाऱ्या कोणत्याही नोंदी आढळल्या नाहीत.' : 'No records found matching the active filters.'}</p>
                    </td>
                </tr>
            `;
            lucide.createIcons();
            showLoading(false);
            return;
        }

        renderBlockOrGpRows(filteredBlocks, isGpView);
        return;
    }

    // LEVEL 3: District Selected -> Show Ranked Blocks of that District
    if (selectedDistrict !== 'all') {
        const districtBlocks = parsedBlocks.filter(b => 
            (selectedDivision === 'all' || b.division === selectedDivision) && 
            b.district === selectedDistrict
        );
        tableShowingCount.innerText = districtBlocks.length;

        tableHeader.innerHTML = `
            <tr>
                <th style="width: 60px;">Rank</th>
                <th class="sortable" data-sort="district">${isMr ? 'जिल्हा' : 'District'} <i data-lucide="chevrons-up-down" class="sort-icon"></i></th>
                <th class="sortable" data-sort="block">${isMr ? 'तालुका नाव' : 'Block Name'} <i data-lucide="chevrons-up-down" class="sort-icon"></i></th>
                <th class="sortable text-center" data-sort="score">${isMr ? 'गुण (%)' : 'Score (%)'} <i data-lucide="chevrons-up-down" class="sort-icon"></i></th>
                <th class="sortable text-center" data-sort="gps">${isMr ? 'ग्रामपंचायती' : 'Grampanchayats'} <i data-lucide="chevrons-up-down" class="sort-icon"></i></th>
                <th class="text-center">${isMr ? 'स्थिती' : 'Status'}</th>
                <th style="width: 60px; text-align: center;"></th>
            </tr>
        `;

        renderBlockOrGpRows(districtBlocks, false);
        return;
    }

    // LEVEL 2: Division Selected -> Show Districts of that Division
    if (selectedDivision !== 'all') {
        const divisionBlocks = parsedBlocks.filter(b => b.division === selectedDivision);
        
        const districtMap = {};
        divisionBlocks.forEach(b => {
            if (!districtMap[b.district]) districtMap[b.district] = [];
            districtMap[b.district].push(b);
        });

        const districtSummaries = Object.keys(districtMap).map(distName => {
            const blks = districtMap[distName];
            const totalCount = blks.length;
            const eligibleCount = blks.filter(b => b.eligible).length;
            const awardedCount = blks.filter(b => b.status === 'Awarded').length;
            const avgScore = blks.reduce((acc, b) => acc + b.score, 0) / totalCount;
            
            blks.sort((a, b) => b.score - a.score);
            const topBlock = blks[0];

            return {
                division: selectedDivision,
                district: distName,
                totalBlocks: totalCount,
                eligibleBlocks: eligibleCount,
                awardedBlocks: awardedCount,
                avgScore: Math.round(avgScore * 100) / 100,
                topBlockName: topBlock ? topBlock.block : '-',
                topBlockScore: topBlock ? topBlock.score : 0
            };
        });

        districtSummaries.sort((a, b) => b.topBlockScore - a.topBlockScore);
        tableShowingCount.innerText = districtSummaries.length;

        tableHeader.innerHTML = `
            <tr>
                <th style="width: 60px;">Rank</th>
                <th>${isMr ? 'विभाग' : 'Division'}</th>
                <th>${isMr ? 'जिल्हा नाव' : 'District Name'}</th>
                <th class="text-center">${isMr ? 'एकूण तालुके' : 'Total Blocks'}</th>
                <th class="text-center">${isMr ? 'पात्र तालुके' : 'Eligible'}</th>
                <th class="text-center">${isMr ? 'पुरस्कृत तालुके' : 'Awarded'}</th>
                <th class="text-center">${isMr ? 'अव्वल तालुका (गुण)' : 'Top Block (Score)'}</th>
                <th style="width: 140px; text-align: center;">${isMr ? 'कृती' : 'Action'}</th>
            </tr>
        `;

        districtSummaries.forEach((dist, idx) => {
            const tr = document.createElement('tr');
            tr.className = 'table-row clickable';
            tr.style.cursor = 'pointer';
            
            const rankBadge = `<span class="rank-badge ${idx < 3 ? 'top-rank' : 'other-rank'}">${idx + 1}</span>`;
            
            tr.innerHTML = `
                <td>${rankBadge}</td>
                <td style="font-weight: 500; color: var(--text-secondary);"><i data-lucide="map-pin" style="width: 13px; height: 13px; color: var(--primary); display: inline-block; vertical-align: middle; margin-right: 4px;"></i>${dist.division}</td>
                <td style="font-weight: 700; color: var(--text-primary); font-size: 14px;">${dist.district}</td>
                <td class="text-center" style="font-weight: 600;">${dist.totalBlocks}</td>
                <td class="text-center"><span class="badge badge-success">${dist.eligibleBlocks}</span></td>
                <td class="text-center"><span class="badge badge-gold"><i data-lucide="award"></i> ${dist.awardedBlocks}</span></td>
                <td class="text-center" style="font-weight: 600; color: var(--primary);">${dist.topBlockName} (${dist.topBlockScore.toFixed(2)}%)</td>
                <td class="text-center">
                    <button class="drilldown-btn" type="button" title="View Blocks">
                        <span>${isMr ? 'तालुके पहा' : 'View Blocks'}</span> <i data-lucide="arrow-right" style="width: 13px; height: 13px;"></i>
                    </button>
                </td>
            `;

            const goToDistrict = (e) => {
                if (e) e.stopPropagation();
                districtSelect.value = dist.district;
                districtSelect.dispatchEvent(new Event('change'));
            };

            tr.addEventListener('click', goToDistrict);
            const btn = tr.querySelector('.drilldown-btn');
            if (btn) btn.addEventListener('click', goToDistrict);

            tableBody.appendChild(tr);
        });

        lucide.createIcons();
        showLoading(false);
        return;
    }

    // LEVEL 1: All Divisions -> Show 6 Divisions of Maharashtra
    const divisionMap = {};
    parsedBlocks.forEach(b => {
        const divName = b.division || 'Other';
        if (!divisionMap[divName]) divisionMap[divName] = [];
        divisionMap[divName].push(b);
    });

    const divisionSummaries = Object.keys(divisionMap).map(divName => {
        const blks = divisionMap[divName];
        const distCount = new Set(blks.map(b => b.district)).size;
        const totalCount = blks.length;
        const eligibleCount = blks.filter(b => b.eligible).length;
        const awardedCount = blks.filter(b => b.status === 'Awarded').length;
        const avgScore = blks.reduce((acc, b) => acc + b.score, 0) / totalCount;

        return {
            division: divName,
            districtsCount: distCount,
            totalBlocks: totalCount,
            eligibleBlocks: eligibleCount,
            awardedBlocks: awardedCount,
            avgScore: Math.round(avgScore * 100) / 100
        };
    });

    divisionSummaries.sort((a, b) => b.avgScore - a.avgScore);
    tableShowingCount.innerText = divisionSummaries.length;

    tableHeader.innerHTML = `
        <tr>
            <th style="width: 60px;">Rank</th>
            <th>${isMr ? 'महसूल विभाग' : 'Revenue Division'}</th>
            <th class="text-center">${isMr ? 'एकूण जिल्हे' : 'Districts'}</th>
            <th class="text-center">${isMr ? 'एकूण तालुके' : 'Total Blocks'}</th>
            <th class="text-center">${isMr ? 'पात्र तालुके' : 'Eligible'}</th>
            <th class="text-center">${isMr ? 'पुरस्कृत तालुके' : 'Awarded'}</th>
            <th class="text-center">${isMr ? 'सरासरी गुण (%)' : 'Avg Score (%)'}</th>
            <th style="width: 150px; text-align: center;">${isMr ? 'कृती' : 'Action'}</th>
        </tr>
    `;

    divisionSummaries.forEach((div, idx) => {
        const tr = document.createElement('tr');
        tr.className = 'table-row clickable';
        tr.style.cursor = 'pointer';
        
        const rankBadge = `<span class="rank-badge ${idx < 3 ? 'top-rank' : 'other-rank'}">${idx + 1}</span>`;
        
        tr.innerHTML = `
            <td>${rankBadge}</td>
            <td style="font-weight: 700; color: var(--text-primary); font-size: 14px;">
                <i data-lucide="map" style="width: 15px; height: 15px; color: var(--primary); display: inline-block; vertical-align: middle; margin-right: 6px;"></i>
                ${div.division} ${isMr ? 'विभाग' : 'Division'}
            </td>
            <td class="text-center" style="font-weight: 600;"><span class="badge badge-muted">${div.districtsCount} Districts</span></td>
            <td class="text-center" style="font-weight: 600;">${div.totalBlocks}</td>
            <td class="text-center"><span class="badge badge-success">${div.eligibleBlocks}</span></td>
            <td class="text-center"><span class="badge badge-gold"><i data-lucide="award"></i> ${div.awardedBlocks}</span></td>
            <td class="text-center font-semibold" style="color: ${div.avgScore >= threshold ? 'var(--success)' : 'var(--danger)'}; font-weight:700;">
                ${div.avgScore.toFixed(2)}%
            </td>
            <td class="text-center">
                <button class="drilldown-btn" type="button" title="View Districts">
                    <span>${isMr ? 'जिल्हे पहा' : 'View Districts'}</span> <i data-lucide="arrow-right" style="width: 13px; height: 13px;"></i>
                </button>
            </td>
        `;

        const goToDivision = (e) => {
            if (e) e.stopPropagation();
            handleDivisionChange(div.division);
        };

        tr.addEventListener('click', goToDivision);
        const btn = tr.querySelector('.drilldown-btn');
        if (btn) btn.addEventListener('click', goToDivision);

        tableBody.appendChild(tr);
    });

    lucide.createIcons();
    showLoading(false);
}

// Render Block or GP Rows with accordion
function renderBlockOrGpRows(blocksList, isGpView) {
    const isMr = window.i18n && window.i18n.getCurrent() === 'mr';
    const threshold = parseFloat(thresholdSlider.value);
    const maxAwards = parseInt(maxAwardsSlider.value) || 5;

    blocksList.forEach((item, index) => {
        if (isGpView || item.isGpRow) {
            // Render GP Row
            const trRow = document.createElement('tr');
            trRow.className = `table-row ${item.status === 'Awarded' ? 'awarded' : ''}`;
            trRow.id = `row-${index}`;

            const rankDisplay = item.rank 
                ? `<span class="rank-badge ${item.rank <= maxAwards ? 'top-rank' : 'other-rank'}">${item.rank}</span>` 
                : '<span class="text-muted">-</span>';

            let statusBadge = '';
            if (item.status === 'Awarded') {
                statusBadge = `<span class="badge badge-gold"><i data-lucide="award"></i> ${isMr ? 'पुरस्कृत' : 'Awarded'}</span>`;
            } else if (item.status === 'Eligible') {
                statusBadge = `<span class="badge badge-success"><i data-lucide="check-circle-2"></i> ${isMr ? 'पात्र' : 'Eligible'}</span>`;
            } else {
                statusBadge = `<span class="badge badge-muted"><i data-lucide="x-circle"></i> ${isMr ? 'वगळलेले' : 'Excluded'}</span>`;
            }

            trRow.innerHTML = `
                <td>${rankDisplay}</td>
                <td style="font-weight: 500;">${item.block}</td>
                <td style="font-weight: 600; color: var(--text-primary);">${item.name}</td>
                <td class="text-center font-semibold" style="color: ${item.score >= threshold ? 'var(--success)' : 'var(--danger)'}; font-weight:700;">
                    ${item.score.toFixed(2)}%
                </td>
                <td class="text-center text-secondary">${item.totalMarks.toFixed(2)} / ${item.totalOutOf.toFixed(1)}</td>
                <td class="text-center">${statusBadge}</td>
            `;
            tableBody.appendChild(trRow);
        } else {
            // Render Block Row
            const trRow = document.createElement('tr');
            trRow.className = `table-row ${item.status === 'Awarded' ? 'awarded' : ''}`;
            trRow.id = `row-${index}`;

            const rankDisplay = item.rank 
                ? `<span class="rank-badge ${item.rank <= maxAwards ? 'top-rank' : 'other-rank'}">${item.rank}</span>` 
                : '<span class="text-muted">-</span>';

            let statusBadge = '';
            if (item.status === 'Awarded') {
                statusBadge = `<span class="badge badge-gold"><i data-lucide="award"></i> ${isMr ? 'पुरस्कृत' : 'Awarded'}</span>`;
            } else if (item.status === 'Eligible') {
                statusBadge = `<span class="badge badge-success"><i data-lucide="check-circle-2"></i> ${isMr ? 'पात्र' : 'Eligible'}</span>`;
            } else {
                statusBadge = `<span class="badge badge-muted"><i data-lucide="x-circle"></i> ${isMr ? 'वगळलेले' : 'Excluded'}</span>`;
            }

            trRow.innerHTML = `
                <td>${rankDisplay}</td>
                <td style="font-weight: 500;">${item.district}</td>
                <td style="font-weight: 600; color: var(--text-primary);">${item.block}</td>
                <td class="text-center font-semibold" style="color: ${item.score >= threshold ? 'var(--success)' : 'var(--danger)'}; font-weight:700;">
                    ${item.score.toFixed(2)}%
                </td>
                <td class="text-center text-secondary">${item.gpCount}</td>
                <td class="text-center">${statusBadge}</td>
                <td class="text-center">
                    <button class="expand-btn" title="Toggle Grampanchayats list">
                        <i data-lucide="chevron-down"></i>
                    </button>
                </td>
            `;

            // Create Details Accordion Row
            const trDetails = document.createElement('tr');
            trDetails.className = 'details-row';
            trDetails.id = `details-${index}`;
            
            let gpRowsHtml = '';
            item.gpList.sort((a, b) => b.percentage - a.percentage).forEach(gp => {
                const gpEligible = gp.percentage >= threshold;
                gpRowsHtml += `
                    <div class="gp-row">
                        <div style="font-weight: 600; color: var(--text-primary);">${gp.name}</div>
                        <div>${gp.totalMarks.toFixed(2)}</div>
                        <div>${gp.totalOutOf.toFixed(1)}</div>
                        <div class="gp-score-bar">
                            <span style="font-weight:700; min-width: 45px; display:inline-block; color: ${gpEligible ? 'var(--success)' : 'var(--text-secondary)'};">
                                ${gp.percentage.toFixed(2)}%
                            </span>
                            <div class="score-bar-bg">
                                <div class="score-bar-fill ${gpEligible ? 'success' : 'warning'}" style="width: ${Math.min(100, Math.max(0, gp.percentage))}%"></div>
                            </div>
                        </div>
                    </div>
                `;
            });

            trDetails.innerHTML = `
                <td colspan="7">
                    <div class="details-accordion" id="accordion-${index}">
                        <div class="details-content">
                            <div class="gp-grid-header">
                                <div>${isMr ? 'ग्रामपंचायत नाव' : 'Grampanchayat Name'}</div>
                                <div>${isMr ? 'प्राप्त गुण' : 'Total Marks'}</div>
                                <div>${isMr ? 'एकूण गुण' : 'Out Of Marks'}</div>
                                <div>${isMr ? 'गुण (टक्केवारी)' : 'Score (Percentage)'}</div>
                            </div>
                            ${gpRowsHtml}
                        </div>
                    </div>
                </td>
            `;

            const toggleAccordion = () => {
                const accordion = trDetails.querySelector(`.details-accordion`);
                const isOpen = trRow.classList.contains('open');
                
                document.querySelectorAll('tr.table-row.open').forEach(openRow => {
                    if (openRow !== trRow) {
                        openRow.classList.remove('open');
                        const idx = openRow.id.split('-')[1];
                        const acc = document.getElementById(`accordion-${idx}`);
                        if (acc) acc.classList.remove('expanded');
                    }
                });

                if (isOpen) {
                    trRow.classList.remove('open');
                    accordion.classList.remove('expanded');
                } else {
                    trRow.classList.add('open');
                    accordion.classList.add('expanded');
                }
            };

            trRow.addEventListener('click', (e) => {
                if (e.target.closest('button') || e.target.closest('a')) return;
                toggleAccordion();
            });

            const expandBtn = trRow.querySelector('.expand-btn');
            if (expandBtn) expandBtn.addEventListener('click', toggleAccordion);

            tableBody.appendChild(trRow);
            tableBody.appendChild(trDetails);
        }
    });

    lucide.createIcons();
    showLoading(false);
}

// Update KPI Stats Cards based on parsed data and slider selections
function updateKPICards() {
    const selectedDivision = divisionSelect ? divisionSelect.value : 'all';
    let scopeBlocks = parsedBlocks;
    if (selectedDivision !== 'all') {
        scopeBlocks = parsedBlocks.filter(b => b.division === selectedDivision);
    }

    const districtsProcessed = new Set(scopeBlocks.map(b => b.district)).size;
    const eligibleBlocks = new Set(scopeBlocks.filter(b => b.eligible).map(b => b.block)).size;
    const awardedBlocks = scopeBlocks.filter(b => b.status === 'Awarded').length;
    
    const awardedList = scopeBlocks.filter(b => b.status === 'Awarded');
    const avgScore = awardedList.length > 0 
        ? (awardedList.reduce((acc, b) => acc + b.score, 0) / awardedList.length).toFixed(2)
        : '0.00';

    document.getElementById('kpi-districts').innerText = districtsProcessed;
    document.getElementById('kpi-eligible').innerText = eligibleBlocks;
    document.getElementById('kpi-awarded').innerText = awardedBlocks;
    document.getElementById('kpi-avg-score').innerText = `${avgScore}%`;
}

// Generate Dashboard Visualizations using ApexCharts
function renderCharts() {
    // 1. Scrolling Ticker for all 34 Districts (Alphabetical Order, Infinite Loop)
    const districtCounts = {};
    parsedBlocks.forEach(b => {
        if (b.status === 'Awarded') {
            districtCounts[b.district] = (districtCounts[b.district] || 0) + 1;
        }
    });

    // Get unique list of districts and sort alphabetically
    const sortedDistricts = Array.from(new Set(parsedBlocks.map(b => b.district))).sort();
    
    let tickerHtml = '';
    sortedDistricts.forEach(d => {
        const count = districtCounts[d] || 0;
        const countClass = count > 0 ? 'success' : '';
        tickerHtml += `
            <div class="ticker-item">
                <span class="ticker-district-name">${d}</span>
                <span class="ticker-count-badge ${countClass}">${count} Awarded</span>
            </div>
        `;
    });
    
    const tickerContainer = document.getElementById('district-ticker');
    if (tickerContainer) {
        tickerContainer.innerHTML = tickerHtml + tickerHtml; // Duplicated for seamless infinite loop
    }

    // 2. Top 10 Blocks Overall
    const topBlocksData = [...parsedBlocks]
        .filter(b => b.eligible)
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);

    const chart2Categories = topBlocksData.map(b => `${b.block} (${b.district})`);
    const chart2Series = topBlocksData.map(b => b.score);

    const optionsTopBlocksChart = {
        series: [{
            name: 'Performance Score',
            data: chart2Series
        }],
        chart: {
            type: 'bar',
            height: 280,
            background: 'transparent',
            toolbar: { show: false }
        },
        plotOptions: {
            bar: {
                borderRadius: 4,
                horizontal: true,
                barHeight: '60%',
            }
        },
        dataLabels: {
            enabled: true,
            formatter: (val) => `${val.toFixed(1)}%`,
            style: { fontSize: '10px', colors: ['#fff'] }
        },
        theme: { mode: 'light' },
        colors: ['#f59e0b'],
        xaxis: {
            categories: chart2Categories,
            labels: {
                style: { fontSize: '10px', colors: '#475569' },
                formatter: (val) => `${val}%`
            },
            max: 100
        },
        yaxis: {
            labels: { style: { colors: '#475569', fontSize: '10px' } }
        },
        fill: {
            type: 'gradient',
            gradient: {
                shade: 'light',
                type: 'horizontal',
                gradientToColors: ['#4f46e5'],
                stops: [0, 100]
            }
        },
        grid: {
            borderColor: '#e2e8f0',
        },
        tooltip: {
            theme: 'light',
            y: { formatter: (val) => `${val.toFixed(2)}% Score` }
        }
    };

    if (topBlocksChart) {
        topBlocksChart.updateOptions(optionsTopBlocksChart);
    } else {
        topBlocksChart = new ApexCharts(document.querySelector("#top-blocks-chart"), optionsTopBlocksChart);
        topBlocksChart.render();
    }
}

// Export the filtered rankings to CSV file format
function exportCSV() {
    if (filteredBlocks.length === 0) {
        alert("No data available to export.");
        return;
    }

    const isGpView = filteredBlocks[0] && filteredBlocks[0].isGpRow;
    let headers = [];
    let csvRows = [];

    if (isGpView) {
        headers = ['Rank', 'Division', 'District', 'Block', 'Grampanchayat Name', 'Performance Score (%)', 'Total Marks', 'Total Out of', 'Status'];
        csvRows.push(headers.join(','));
        filteredBlocks.forEach(gp => {
            const row = [
                gp.rank || '-',
                `"${(gp.division || '').replace(/"/g, '""')}"`,
                `"${(gp.district || '').replace(/"/g, '""')}"`,
                `"${gp.block.replace(/"/g, '""')}"`,
                `"${gp.name.replace(/"/g, '""')}"`,
                gp.score.toFixed(2),
                gp.totalMarks.toFixed(2),
                gp.totalOutOf.toFixed(1),
                gp.status
            ];
            csvRows.push(row.join(','));
        });
    } else {
        headers = ['Rank', 'Division', 'District', 'Block Name', 'Performance Score (%)', 'Grampanchayats Count', 'Status'];
        csvRows.push(headers.join(','));
        filteredBlocks.forEach(b => {
            const row = [
                b.rank || '-',
                `"${(b.division || '').replace(/"/g, '""')}"`,
                `"${b.district.replace(/"/g, '""')}"`,
                `"${b.block.replace(/"/g, '""')}"`,
                b.score.toFixed(2),
                b.gpCount,
                b.status
            ];
            csvRows.push(row.join(','));
        });
    }

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    
    const formattedDate = new Date().toISOString().split('T')[0];
    const filePrefix = isGpView ? 'Block_GPs_Rankings' : 'Block_Verified_Rankings';
    link.setAttribute("download", `${filePrefix}_${formattedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Toggle loading overlay status
function showLoading(active) {
    if (active) {
        loadingOverlay.classList.add('active');
    } else {
        loadingOverlay.classList.remove('active');
    }
}

// Render the top 2 blocks for all districts in a grid view
function renderDistrictLeaders() {
    const gridContainer = document.getElementById('district-leaders-grid');
    if (!gridContainer) return;

    // Clear grid container
    gridContainer.innerHTML = '';

    if (parsedBlocks.length === 0) {
        gridContainer.innerHTML = `
            <div style="grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px; color: var(--text-muted); text-align: center;">
                <p style="font-size: 13px; margin: 0;">No data loaded</p>
            </div>
        `;
        return;
    }

    // Get active aggregation strategy name
    const aggMethodSelect = document.getElementById('agg-method');
    const selectedAggText = aggMethodSelect ? aggMethodSelect.options[aggMethodSelect.selectedIndex].text : 'Average GP Percentage';

    // Update the Section Subtitle and Strategy Badge dynamically
    const subtitle = document.getElementById('district-leaders-subtitle');
    if (subtitle) {
        subtitle.innerText = 'Top 2 performing blocks in each of the 34 districts';
    }
    const strategyBadge = document.getElementById('district-leaders-strategy-badge');
    if (strategyBadge) {
        strategyBadge.innerText = selectedAggText;
    }

    // Group parsedBlocks by district
    const districtGroups = {};
    parsedBlocks.forEach(block => {
        if (!districtGroups[block.district]) {
            districtGroups[block.district] = [];
        }
        districtGroups[block.district].push(block);
    });

    // Get sorted district names
    const sortedDistricts = Object.keys(districtGroups).sort();

    // Check filters
    const selectedDivision = divisionSelect ? divisionSelect.value : 'all';
    const selectedDistrict = districtSelect.value;
    const searchVal = districtLeadersSearchText.toLowerCase().trim();

    let renderedCardsCount = 0;

    sortedDistricts.forEach(districtName => {
        const blocks = districtGroups[districtName];
        if (!blocks || blocks.length === 0) return;

        // Filter by division
        if (selectedDivision !== 'all') {
            const districtDivision = blocks[0].division;
            if (districtDivision && districtDivision !== selectedDivision) {
                return;
            }
        }

        // Filter by district dropdown
        if (selectedDistrict !== 'all' && districtName !== selectedDistrict) {
            return;
        }

        // Filter by search text
        if (searchVal && !districtName.toLowerCase().includes(searchVal)) {
            return;
        }
        
        // Sort blocks by score desc, then by block name asc
        blocks.sort((a, b) => {
            if (b.score !== a.score) {
                return b.score - a.score;
            }
            return a.block.localeCompare(b.block);
        });

        const top2 = blocks.slice(0, 2);
        const eligibleCount = blocks.filter(b => b.eligible).length;
        const totalCount = blocks.length;

        // Build HTML for the top 2 performing blocks
        let performersHtml = '';
        top2.forEach((block, index) => {
            const rankClass = index === 0 ? 'rank-1' : 'rank-2';
            const rankLabel = index === 0 ? '🥇 1st' : '🥈 2nd';
            
            let statusClass = 'status-excluded';
            let statusText = 'Excluded';
            if (block.status === 'Awarded') {
                statusClass = 'status-awarded';
                statusText = 'Awarded';
            } else if (block.status === 'Eligible') {
                statusClass = 'status-eligible';
                statusText = 'Eligible';
            }

            performersHtml += `
                <div class="leader-item" style="margin-bottom: ${index === 0 ? '8px' : '0'};">
                    <div class="leader-rank ${rankClass}">${rankLabel}</div>
                    <div class="leader-info">
                        <div class="leader-name" title="${block.block}">${block.block}</div>
                        <div class="leader-details">${block.gpCount} GPs • <span class="${statusClass}">${statusText}</span></div>
                    </div>
                    <div class="leader-score ${statusClass}">${block.score.toFixed(2)}%</div>
                </div>
            `;
        });

        if (top2.length === 0) {
            performersHtml = `<div class="text-muted text-center" style="font-size: 12px; padding: 10px 0;">No blocks available</div>`;
        }

        const card = document.createElement('div');
        card.className = 'district-leader-card glass';
        card.innerHTML = `
            <div class="district-leader-card-header">
                <h3>${districtName}</h3>
                <span class="district-leader-badge">${eligibleCount} / ${totalCount} Eligible</span>
            </div>
            <div class="district-leader-performers" style="gap: 8px; display: flex; flex-direction: column;">
                ${performersHtml}
            </div>
        `;
        gridContainer.appendChild(card);
        renderedCardsCount++;
    });

    if (renderedCardsCount === 0) {
        gridContainer.innerHTML = `
            <div style="grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px; color: var(--text-muted); text-align: center;">
                <i data-lucide="info" style="width: 32px; height: 32px; margin-bottom: 8px; color: var(--text-muted);"></i>
                <p style="font-size: 14px; font-weight: 500; margin: 0;">No districts found matching "${districtLeadersSearchText}"</p>
            </div>
        `;
    }

    // Refresh Lucide icons inside the grid
    lucide.createIcons();
}

// Render Interactive District Quick-Filter Pills above Table
function renderDistrictPills() {
    if (!districtPillsContainer) return;
    
    districtPillsContainer.innerHTML = '';
    
    if (!parsedBlocks || parsedBlocks.length === 0) {
        districtPillsContainer.style.display = 'none';
        return;
    }
    
    districtPillsContainer.style.display = 'flex';
    
    const isMr = window.i18n && window.i18n.getCurrent() === 'mr';
    const selectedDivision = divisionSelect ? divisionSelect.value : 'all';
    const currentSelectedDistrict = districtSelect ? districtSelect.value : 'all';
    
    // Filter blocks by active division
    let divisionScopedBlocks = parsedBlocks;
    if (selectedDivision !== 'all') {
        divisionScopedBlocks = parsedBlocks.filter(b => b.division === selectedDivision);
    }
    
    // Calculate total blocks in this division scope
    const totalBlocksCount = divisionScopedBlocks.length;
    
    // Group block count by district
    const districtCounts = {};
    divisionScopedBlocks.forEach(b => {
        districtCounts[b.district] = (districtCounts[b.district] || 0) + 1;
    });
    
    const sortedDistricts = Object.keys(districtCounts).sort();
    
    // 1. Add Label / Tag
    const labelSpan = document.createElement('span');
    labelSpan.className = 'district-pill-label';
    const labelText = isMr ? 'विभागातील जिल्हे:' : 'Districts:';
    labelSpan.innerHTML = `<i data-lucide="map-pin" style="width: 14px; height: 14px;"></i> ${labelText}`;
    districtPillsContainer.appendChild(labelSpan);
    
    // 2. "All Districts" Pill
    const allPill = document.createElement('button');
    allPill.type = 'button';
    allPill.className = `district-pill ${currentSelectedDistrict === 'all' ? 'active' : ''}`;
    const allLabel = isMr ? 'सर्व जिल्हे' : 'All Districts';
    allPill.innerHTML = `<span>${allLabel}</span> <span class="district-pill-count">${totalBlocksCount}</span>`;
    
    allPill.addEventListener('click', () => {
        if (districtSelect.value !== 'all') {
            districtSelect.value = 'all';
            districtSelect.dispatchEvent(new Event('change'));
        }
    });
    districtPillsContainer.appendChild(allPill);
    
    // 3. Individual District Pills for the active Division
    sortedDistricts.forEach(distName => {
        const count = districtCounts[distName];
        const pill = document.createElement('button');
        pill.type = 'button';
        pill.className = `district-pill ${currentSelectedDistrict === distName ? 'active' : ''}`;
        pill.innerHTML = `<span>${distName}</span> <span class="district-pill-count">${count}</span>`;
        
        pill.addEventListener('click', () => {
            if (districtSelect.value === distName) {
                districtSelect.value = 'all';
            } else {
                districtSelect.value = distName;
            }
            districtSelect.dispatchEvent(new Event('change'));
        });
        
        districtPillsContainer.appendChild(pill);
    });
    
    lucide.createIcons();
}

// Re-render components when language is toggled
window.addEventListener('portalLanguageChanged', () => {
    renderDistrictPills();
    if (filteredBlocks && filteredBlocks.length > 0) {
        renderTable();
        renderDistrictLeaders();
    }
});


