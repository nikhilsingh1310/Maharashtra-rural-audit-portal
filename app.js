// Constants and State
let rawWorkbookData = null; // Stored parsed excel sheets
let parsedBlocks = []; // Processed block-level records
let filteredBlocks = []; // Currently filtered records (for rendering)
let activeSort = { column: 'district', direction: 'asc' }; // Active sorting column and direction
let districtChart = null; // ApexCharts instances
let topBlocksChart = null;
let districtLeadersSearchText = '';

// DOM Elements
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const currentFileName = document.getElementById('current-file-name');
const thresholdSlider = document.getElementById('threshold-slider');
const thresholdVal = document.getElementById('threshold-val');
const maxAwardsSlider = document.getElementById('max-awards-slider');
const maxAwardsVal = document.getElementById('max-awards-val');
const aggMethodSelect = document.getElementById('agg-method');
const districtSelect = document.getElementById('district-select');
const blockSelect = document.getElementById('block-select'); // New block dropdown
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

    // Header Navbar Button Event Listeners
    const navHomeBtn = document.getElementById('nav-home-btn');
    const navPillarsBtn = document.getElementById('nav-pillars-btn');
    const navAwardsBtn = document.getElementById('nav-awards-btn');
    const navRankingsBtn = document.getElementById('nav-rankings-btn');
    const navSearchBtn = document.getElementById('nav-search-btn');

    if (navHomeBtn) {
        navHomeBtn.addEventListener('click', () => {
            appContainer.classList.add('hidden');
            landingPageContainer.classList.remove('fade-out');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    if (navPillarsBtn) {
        navPillarsBtn.addEventListener('click', () => {
            appContainer.classList.add('hidden');
            landingPageContainer.classList.remove('fade-out');
            document.getElementById('pillars-section')?.scrollIntoView({ behavior: 'smooth' });
        });
    }

    if (navAwardsBtn) {
        navAwardsBtn.addEventListener('click', () => {
            appContainer.classList.add('hidden');
            landingPageContainer.classList.remove('fade-out');
            document.getElementById('awards-section')?.scrollIntoView({ behavior: 'smooth' });
        });
    }

    if (navRankingsBtn) {
        navRankingsBtn.addEventListener('click', () => openDashboardTab('rankings'));
    }

    if (navSearchBtn) {
        navSearchBtn.addEventListener('click', () => openDashboardTab('search'));
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
    
    // Dynamic District dropdown listener
    districtSelect.addEventListener('change', () => {
        const selectedDistrict = districtSelect.value;
        
        if (selectedDistrict === 'all') {
            blockSelect.innerHTML = '<option value="all">All Blocks</option>';
            blockSelect.value = 'all';
            blockSelect.disabled = true;
        } else {
            blockSelect.disabled = false;
            blockSelect.innerHTML = '<option value="all">All Blocks</option>';
            
            // Filter unique blocks in the selected district
            const blocksInSelectedDistrict = parsedBlocks.filter(b => b.district === selectedDistrict);
            const uniqueBlocks = Array.from(new Set(blocksInSelectedDistrict.map(b => b.block))).sort();
            
            uniqueBlocks.forEach(block => {
                const opt = document.createElement('option');
                opt.value = block;
                opt.textContent = block;
                blockSelect.appendChild(opt);
            });
            
            blockSelect.value = 'all';
        }
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

// Reset UI configuration to default
function resetParameters() {
    thresholdSlider.value = 60;
    thresholdVal.innerText = '60%';
    maxAwardsSlider.value = 5;
    maxAwardsVal.innerText = '5';
    aggMethodSelect.value = 'mean';
    districtSelect.value = 'all';
    
    blockSelect.innerHTML = '<option value="all">All Blocks</option>';
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
        const response = await fetch('./29.05.2026.xlsx');
        if (!response.ok) {
            throw new Error(`Failed to load default file: ${response.statusText}`);
        }
        const data = await response.arrayBuffer();
        const workbook = XLSX.read(new Uint8Array(data), { type: 'array' });
        rawWorkbookData = workbook;
        currentFileName.innerText = '29.05.2026.xlsx';
        currentFileName.setAttribute('title', '29.05.2026.xlsx');
        
        processData();
    } catch (error) {
        console.error("Error loading Excel file:", error);
        alert("Could not load default 29.05.2026.xlsx file automatically. Please upload manually.");
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
            districtSelect.value = 'all';
            blockSelect.innerHTML = '<option value="all">All Blocks</option>';
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
                const district = (row['DISTRICT VIRIFIED'] || row['DISTRICT VERIFIED'] || '').toString().trim();
                const block = (row['BLOCK VERIFIED'] || '').toString().trim();
                const gp = (row['GrampanchayatName'] || '').toString().trim();
                const totalMarks = parseFloat(row['TotalMarks']) || 0;
                const totalOutOf = parseFloat(row['TotalOutOfMarks']) || 0;
                const pct = parseFloat(row['Percentage']) || 0;
                
                if (!district || !block) return;
                
                if (!districtMap[district]) {
                    districtMap[district] = {};
                }
                if (!districtMap[district][block]) {
                    districtMap[district][block] = {
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

            // Populate District Dropdown (preserving selections if still valid)
            const currentSelectedDistrict = districtSelect.value;
            districtSelect.innerHTML = '<option value="all">All Districts</option>';
            
            const sortedDistricts = Array.from(districtsList).sort();
            sortedDistricts.forEach(d => {
                const opt = document.createElement('option');
                opt.value = d;
                opt.textContent = d;
                districtSelect.appendChild(opt);
            });
            
            if (sortedDistricts.includes(currentSelectedDistrict)) {
                districtSelect.value = currentSelectedDistrict;
                // If a district was selected, populate blocks
                blockSelect.disabled = false;
                const prevBlockVal = blockSelect.value;
                blockSelect.innerHTML = '<option value="all">All Blocks</option>';
                
                const blocksInSelectedDistrict = parsedBlocks.filter(b => b.district === currentSelectedDistrict);
                const uniqueBlocks = Array.from(new Set(blocksInSelectedDistrict.map(b => b.block))).sort();
                uniqueBlocks.forEach(block => {
                    const opt = document.createElement('option');
                    opt.value = block;
                    opt.textContent = block;
                    blockSelect.appendChild(opt);
                });
                
                // Preserve block selection if it is still valid
                if (uniqueBlocks.includes(prevBlockVal)) {
                    blockSelect.value = prevBlockVal;
                } else {
                    blockSelect.value = 'all';
                }
            } else {
                blockSelect.innerHTML = '<option value="all">All Blocks</option>';
                blockSelect.value = 'all';
                blockSelect.disabled = true;
            }

            filterAndRender();
        } catch (error) {
            console.error("Error processing Excel workbook:", error);
            alert("Error parsing spreadsheet data. Check structure.");
            showLoading(false);
        }
    }, 50);
}

// Filter data by search terms, districts, and block selections
function filterAndRender() {
    const selectedDistrict = districtSelect.value;
    const selectedBlock = blockSelect.value;
    const searchVal = searchInput.value.toLowerCase().trim();
    const threshold = parseFloat(thresholdSlider.value);
    
    // Check if we are in Block drill-down (both a specific district AND block are selected)
    if (selectedDistrict !== 'all' && selectedBlock !== 'all') {
        const matchingBlock = parsedBlocks.find(b => b.district === selectedDistrict && b.block === selectedBlock);
        
        if (matchingBlock) {
            // Drill down: Map Grampanchayats of this block to row items
            let gpRows = matchingBlock.gpList.map(gp => ({
                isGpRow: true,
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

            // Search filter within GPs list
            if (searchVal) {
                gpRows = gpRows.filter(gp => gp.name.toLowerCase().includes(searchVal));
            }

            // Rank Grampanchayats of this specific block based on maxAwards parameter
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
        // Default Block View: Filter the blocks
        filteredBlocks = parsedBlocks.filter(block => {
            const districtMatch = selectedDistrict === 'all' || block.district === selectedDistrict;
            
            let searchMatch = true;
            if (searchVal) {
                const blockNameMatch = block.block.toLowerCase().includes(searchVal);
                const districtNameMatch = block.district.toLowerCase().includes(searchVal);
                const gpMatch = block.gpList.some(gp => gp.name.toLowerCase().includes(searchVal));
                searchMatch = blockNameMatch || districtNameMatch || gpMatch;
            }
            
            return districtMatch && searchMatch;
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
            // Sort by district (or block name if in GP view)
            const distCompare = a.district.localeCompare(b.district);
            if (distCompare !== 0) return distCompare * dir;
            
            // Secondary sort: Rank ascending (Rank 1 first) within same district
            const rA = a.rank === null ? 999999 : a.rank;
            const rB = b.rank === null ? 999999 : b.rank;
            return rA - rB;
        } else if (col === 'block') {
            // Sort by block name (or GP name if in GP view)
            const valA = a.isGpRow ? a.name : a.block;
            const valB = b.isGpRow ? b.name : b.block;
            return valA.localeCompare(valB) * dir;
        } else if (col === 'score') {
            return (a.score - b.score) * dir;
        } else if (col === 'gps') {
            // Sort by GPs count (or TotalMarks if in GP view)
            const valA = a.isGpRow ? a.totalMarks : a.gpCount;
            const valB = b.isGpRow ? b.totalMarks : b.gpCount;
            return (valA - valB) * dir;
        }
        return 0;
    });

    renderTable();
}

// Draw HTML Table Rows
function renderTable() {
    const uniqueCount = new Set(filteredBlocks.map(b => b.isGpRow ? b.name : b.block)).size;
    tableShowingCount.innerText = uniqueCount;
    
    const maxAwards = parseInt(maxAwardsSlider.value) || 5;
    
    // Dynamically update the header
    const tableHeader = document.querySelector('#rankings-table thead');
    const selectedDistrict = districtSelect.value;
    const selectedBlock = blockSelect.value;
    const isGpView = selectedDistrict !== 'all' && selectedBlock !== 'all';
    const threshold = parseFloat(thresholdSlider.value);
    
    if (isGpView) {
        tableHeader.innerHTML = `
            <tr>
                <th style="width: 60px;">Rank</th>
                <th>Block Name</th>
                <th class="sortable" data-sort="block">Grampanchayat Name <i data-lucide="chevrons-up-down" class="sort-icon"></i></th>
                <th class="sortable text-center" data-sort="score">Score (%) <i data-lucide="chevrons-up-down" class="sort-icon"></i></th>
                <th class="sortable text-center" data-sort="gps">Marks (Obtained / Out of) <i data-lucide="chevrons-up-down" class="sort-icon"></i></th>
                <th class="text-center">Status</th>
                <th style="width: 50px;"></th>
            </tr>
        `;
    } else {
        tableHeader.innerHTML = `
            <tr>
                <th style="width: 60px;">Rank</th>
                <th class="sortable" data-sort="district">District <i data-lucide="chevrons-up-down" class="sort-icon"></i></th>
                <th class="sortable" data-sort="block">Block Name <i data-lucide="chevrons-up-down" class="sort-icon"></i></th>
                <th class="sortable text-center" data-sort="score">Score (%) <i data-lucide="chevrons-up-down" class="sort-icon"></i></th>
                <th class="sortable text-center" data-sort="gps">Grampanchayats <i data-lucide="chevrons-up-down" class="sort-icon"></i></th>
                <th class="text-center">Status</th>
                <th style="width: 50px;"></th>
            </tr>
        `;
    }

    tableBody.innerHTML = '';

    if (filteredBlocks.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-5 text-muted">
                    <i data-lucide="info" style="width: 24px; height: 24px; margin-bottom: 8px;"></i>
                    <p>No records found matching the active filters.</p>
                </td>
            </tr>
        `;
        lucide.createIcons();
        showLoading(false);
        return;
    }

    filteredBlocks.forEach((item, index) => {
        if (item.isGpRow) {
            // Render Grampanchayat Row (leaves)
            const trRow = document.createElement('tr');
            trRow.className = `table-row ${item.status === 'Awarded' ? 'awarded' : ''}`;
            trRow.id = `row-${index}`;

            const rankDisplay = item.rank 
                ? `<span class="rank-badge ${item.rank <= maxAwards ? 'top-rank' : 'other-rank'}">${item.rank}</span>` 
                : '<span class="text-muted">-</span>';

            let statusBadge = '';
            if (item.status === 'Awarded') {
                statusBadge = `<span class="badge badge-gold"><i data-lucide="award"></i> Top ${maxAwards}</span>`;
            } else if (item.status === 'Eligible') {
                statusBadge = `<span class="badge badge-success"><i data-lucide="check-circle-2"></i> Eligible</span>`;
            } else {
                statusBadge = `<span class="badge badge-muted"><i data-lucide="x-circle"></i> Excluded</span>`;
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
                <td class="text-center"></td>
            `;
            tableBody.appendChild(trRow);
        } else {
            // Render standard Block Row
            const trRow = document.createElement('tr');
            trRow.className = `table-row ${item.status === 'Awarded' ? 'awarded' : ''}`;
            trRow.id = `row-${index}`;

            const rankDisplay = item.rank 
                ? `<span class="rank-badge ${item.rank <= maxAwards ? 'top-rank' : 'other-rank'}">${item.rank}</span>` 
                : '<span class="text-muted">-</span>';

            let statusBadge = '';
            if (item.status === 'Awarded') {
                statusBadge = `<span class="badge badge-gold"><i data-lucide="award"></i> Awarded</span>`;
            } else if (item.status === 'Eligible') {
                statusBadge = `<span class="badge badge-success"><i data-lucide="check-circle-2"></i> Eligible</span>`;
            } else {
                statusBadge = `<span class="badge badge-muted"><i data-lucide="x-circle"></i> Excluded</span>`;
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
                                <div>Grampanchayat Name</div>
                                <div>Total Marks</div>
                                <div>Out Of Marks</div>
                                <div>Score (Percentage)</div>
                            </div>
                            ${gpRowsHtml}
                        </div>
                    </div>
                </td>
            `;

            // Toggle Accordion Click Event
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
    const districtsProcessed = new Set(parsedBlocks.map(b => b.district)).size;
    const eligibleBlocks = new Set(parsedBlocks.filter(b => b.eligible).map(b => b.block)).size;
    const awardedBlocks = parsedBlocks.filter(b => b.status === 'Awarded').length;
    
    const awardedList = parsedBlocks.filter(b => b.status === 'Awarded');
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
        headers = ['Rank', 'Block', 'Grampanchayat Name', 'Performance Score (%)', 'Total Marks', 'Total Out of', 'Status'];
        csvRows.push(headers.join(','));
        filteredBlocks.forEach(gp => {
            const row = [
                gp.rank || '-',
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
        headers = ['Rank', 'District', 'Block Name', 'Performance Score (%)', 'Grampanchayats Count', 'Status'];
        csvRows.push(headers.join(','));
        filteredBlocks.forEach(b => {
            const row = [
                b.rank || '-',
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
    const selectedDistrict = districtSelect.value;
    const searchVal = districtLeadersSearchText.toLowerCase().trim();

    let renderedCardsCount = 0;

    sortedDistricts.forEach(districtName => {
        // Filter by district dropdown
        if (selectedDistrict !== 'all' && districtName !== selectedDistrict) {
            return;
        }

        // Filter by search text
        if (searchVal && !districtName.toLowerCase().includes(searchVal)) {
            return;
        }

        const blocks = districtGroups[districtName];
        
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
