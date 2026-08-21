// State Variables for the Search Tab
let searchBdoData = []; // BDO worksheet parsed records
let searchGpData = []; // GP worksheet parsed records
let searchFilteredBdo = []; // Filtered BDO records for rendering
let searchFilteredGp = []; // Filtered GP records for rendering
let searchPortalInitialized = false;

// Search configuration state
let selectedDivisionVal = 'all'; // Dropdown division value
let selectedDistrictVal = 'all'; // Dropdown district value
let searchType = 'GPLGDCode';    // 'BDOCode' or 'GPLGDCode' or 'Combine'
let selectedCodeVal = 'all';     // Dropdown code value
let searchInputText = '';        // Text input search value

// Table pagination and sorting states
let bdoPagination = { page: 1, pageSize: 20 };
let gpPagination = { page: 1, pageSize: 20 };
let bdoSort = { column: 'GP LGDCode', direction: 'asc' };
let gpSort = { column: 'GP LGDCode', direction: 'asc' };

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

// Helper to safely format float values even if they are string types, undefined, or null
function safeFormatFloat(val, decimals = 2) {
    if (val === undefined || val === null || val === '') return '-';
    const num = parseFloat(val);
    if (isNaN(num)) return val.toString();
    return num.toFixed(decimals);
}

// DOM Elements
const searchDivisionSelect = document.getElementById('search-division-select');
const searchDistrictSelect = document.getElementById('search-district-select');
const searchTypeSelect = document.getElementById('search-type-select');
const searchCodeSelect = document.getElementById('search-code-select');
const searchTextField = document.getElementById('search-text-input');
const searchSubmitBtn = document.getElementById('search-submit-btn');
const searchResetBtn = document.getElementById('search-reset-btn');
const searchExportBtn = document.getElementById('search-export-csv');

const searchSidebarControls = document.getElementById('search-sidebar-controls');
const searchDashboardBody = document.getElementById('search-dashboard-body');
const searchDetailsSection = document.getElementById('search-details-section');
const searchTablesSection = document.getElementById('search-tables-section');
const searchNoDataSection = document.getElementById('search-no-data');
const searchLoadingOverlay = document.getElementById('search-loading-overlay');

const searchDropZone = document.getElementById('search-drop-zone');
const searchFileInput = document.getElementById('search-file-input');
const searchCurrentFileName = document.getElementById('search-current-file-name');

// Metadata Sidebar Fields
const metaBdoRows = document.getElementById('meta-bdo-rows');
const metaGpRows = document.getElementById('meta-gp-rows');
const metaUniqueBdo = document.getElementById('meta-unique-bdo');
const metaUniqueGp = document.getElementById('meta-unique-gp');

// Initialize the search portal logic
function initSearchPortal() {
    if (searchPortalInitialized) return;
    
    // Configure event listeners for search interface
    initSearchEventListeners();
    
    // Check if running on file:// protocol, otherwise fetch default file
    if (window.location.protocol !== 'file:') {
        loadDefaultSearchFile();
    } else {
        showSearchLoading(false);
    }
    
    searchPortalInitialized = true;
}

// Fetch default BDO/GP spreadsheet
async function loadDefaultSearchFile() {
    showSearchLoading(true);
    try {
        const response = await fetch('./Report GP and BDO 09.06.2025.xlsx');
        if (!response.ok) {
            throw new Error(`Failed to load default file: ${response.statusText}`);
        }
        const data = await response.arrayBuffer();
        parseSearchWorkbook(data, 'Report GP and BDO 09.06.2025.xlsx');
    } catch (error) {
        console.error("Error loading default search spreadsheet:", error);
        alert("Could not load default Report GP and BDO 09.06.2025.xlsx spreadsheet automatically. Please upload manually.");
        showSearchLoading(false);
    }
}

// Listeners Setup
function initSearchEventListeners() {
    // Division Select listener
    if (searchDivisionSelect) {
        searchDivisionSelect.addEventListener('change', () => {
            selectedDivisionVal = searchDivisionSelect.value;
            selectedDistrictVal = 'all';
            selectedCodeVal = 'all';
            searchTextField.value = '';
            
            populateDistrictDropdown();
            populateCodeDropdown();
            executeSearch();
        });
    }

    // District Select listener
    if (searchDistrictSelect) {
        searchDistrictSelect.addEventListener('change', () => {
            selectedDistrictVal = searchDistrictSelect.value;
            selectedCodeVal = 'all';
            searchTextField.value = '';
            
            populateCodeDropdown();
            executeSearch();
        });
    }

    // Search Type Select listener
    searchTypeSelect.addEventListener('change', () => {
        searchType = searchTypeSelect.value;
        searchTextField.value = '';
        selectedCodeVal = 'all';
        populateCodeDropdown();
        executeSearch();
    });

    // Select Code listener
    searchCodeSelect.addEventListener('change', () => {
        selectedCodeVal = searchCodeSelect.value;
        executeSearch();
    });

    // Text Search Input listener
    searchTextField.addEventListener('input', () => {
        // Clear dropdown if typing manually to avoid conflict
        if (searchCodeSelect.value !== 'all') {
            searchCodeSelect.value = 'all';
            selectedCodeVal = 'all';
        }
        executeSearch();
    });

    // Buttons
    searchSubmitBtn.addEventListener('click', executeSearch);
    searchResetBtn.addEventListener('click', resetSearchFilters);
    searchExportBtn.addEventListener('click', exportSearchResults);

    // File Drag & Drop for Search tab
    searchDropZone.addEventListener('click', () => searchFileInput.click());
    searchFileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleSearchFile(e.target.files[0]);
        }
    });

    searchDropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        searchDropZone.classList.add('dragover');
    });

    searchDropZone.addEventListener('dragleave', () => {
        searchDropZone.classList.remove('dragover');
    });

    searchDropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        searchDropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            handleSearchFile(e.dataTransfer.files[0]);
        }
    });
}

// Handle uploaded file specifically in Search tab
function handleSearchFile(file) {
    showSearchLoading(true);
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            parseSearchWorkbook(e.target.result, file.name);
        } catch (err) {
            console.error("Error parsing uploaded workbook:", err);
            alert("Error parsing Excel file. Please verify its format.");
            showSearchLoading(false);
        }
    };
    reader.readAsArrayBuffer(file);
}

// Helper to clean and normalize keys/values in the datasets (supporting variations like 'GP', 'GP LGDCode', etc.)
function normalizeDatasetKeys(data, type) {
    return data.map(row => {
        const normalized = {};
        Object.keys(row).forEach(key => {
            const trimmedKey = key.trim();
            const lowerKey = trimmedKey.toLowerCase();
            
            // Normalize GP LGD Code
            if (lowerKey === 'gp lgdcode' || 
                lowerKey === 'gp lgd code' || 
                lowerKey === 'gp' || 
                lowerKey === 'gplgdcode' || 
                lowerKey === 'gp_lgdcode' || 
                lowerKey === 'lgd code' || 
                lowerKey === 'lgdcode') {
                const val = parseInt(row[key]);
                normalized['GP LGDCode'] = val;
            } 
            // Normalize BDO Code
            else if (lowerKey === 'bdocode' || 
                     lowerKey === 'bdo code' || 
                     lowerKey === 'bdo_code') {
                normalized['BDOCode'] = parseInt(row[key]);
            }
            // Normalize Grampanchayat Name
            else if (lowerKey === 'grampanchayatname' || 
                     lowerKey === 'grampanchayat name' || 
                     lowerKey === 'gp name' || 
                     lowerKey === 'gpname' || 
                     lowerKey === 'gram panchayat name' || 
                     lowerKey === 'grampanchayat') {
                normalized['GrampanchayatName'] = row[key];
            }
            // Preserve other keys
            else {
                normalized[key] = row[key];
            }
        });
        
        // Fallback for LGD Code if still missing
        if (type === 'BDO' && normalized['GP LGDCode'] === undefined) {
            const lgdKey = Object.keys(row).find(k => k.toLowerCase().includes('lgd') || k.toLowerCase().trim() === 'gp');
            if (lgdKey) normalized['GP LGDCode'] = parseInt(row[lgdKey]);
        }
        if (type === 'GP' && normalized['GP LGDCode'] === undefined) {
            const lgdKey = Object.keys(row).find(k => k.toLowerCase().includes('lgd') || k.toLowerCase().trim() === 'gp');
            if (lgdKey) normalized['GP LGDCode'] = parseInt(row[lgdKey]);
        }

        // Determine District
        const rawDistrict = (normalized['DISTRICT VERIFIED'] || normalized['DISTRICT VIRIFIED'] || normalized['GPDistrict'] || '').toString().trim();
        normalized['District'] = rawDistrict;
        
        // Determine Division (derived from District mapping, falling back to raw Division Name if available)
        let div = DISTRICT_TO_DIVISION[rawDistrict];
        if (!div && row['Division Name'] && row['Division Name'] !== 'Akola') {
            const rawDiv = row['Division Name'].toString().trim();
            div = rawDiv.charAt(0).toUpperCase() + rawDiv.slice(1).toLowerCase();
        }
        normalized['Division'] = div || 'Other';
        
        return normalized;
    });
}

// Parse excel workbook and update state
function parseSearchWorkbook(arrayBuffer, filename) {
    const data = new Uint8Array(arrayBuffer);
    const workbook = XLSX.read(data, { type: 'array' });
    
    // Ensure BDO and GP sheets exist
    if (!workbook.SheetNames.includes('BDO') || !workbook.SheetNames.includes('GP')) {
        alert("The uploaded spreadsheet must contain both 'BDO' and 'GP' worksheets.");
        showSearchLoading(false);
        return;
    }
    
    // Parse sheets to JSON arrays
    const bdoSheet = workbook.Sheets['BDO'];
    const gpSheet = workbook.Sheets['GP'];
    
    // Parse and robustly normalize keys
    searchBdoData = normalizeDatasetKeys(XLSX.utils.sheet_to_json(bdoSheet), 'BDO');
    searchGpData = normalizeDatasetKeys(XLSX.utils.sheet_to_json(gpSheet), 'GP');
    
    // Update uploader badge name
    searchCurrentFileName.innerText = filename;
    searchCurrentFileName.setAttribute('title', filename);
    
    // Populate Metadata Card
    updateMetadataSidebar();
    
    // Reset filters and run initial load
    resetSearchFilters();
}

// Update the Dataset Info metadata card inside the sidebar
function updateMetadataSidebar() {
    metaBdoRows.innerText = searchBdoData.length.toLocaleString();
    metaGpRows.innerText = searchGpData.length.toLocaleString();
    
    const bdoCodes = new Set(searchBdoData.map(r => r.BDOCode).filter(Boolean));
    metaUniqueBdo.innerText = bdoCodes.size.toLocaleString();
    
    const gpCodes = new Set(searchGpData.map(r => r['GP LGDCode']).filter(Boolean));
    metaUniqueGp.innerText = gpCodes.size.toLocaleString();
}

// Populate the Division dropdown dynamically
function populateDivisionDropdown() {
    if (!searchDivisionSelect) return;
    searchDivisionSelect.innerHTML = '<option value="all">All Divisions</option>';
    
    const divisions = Array.from(new Set([
        ...searchBdoData.map(r => r.Division),
        ...searchGpData.map(r => r.Division)
    ].filter(Boolean))).sort();
    
    divisions.forEach(div => {
        const opt = document.createElement('option');
        opt.value = div;
        opt.textContent = div;
        searchDivisionSelect.appendChild(opt);
    });
    
    searchDivisionSelect.value = selectedDivisionVal;
}

// Populate the District dropdown dynamically based on selected Division
function populateDistrictDropdown() {
    if (!searchDistrictSelect) return;
    searchDistrictSelect.innerHTML = '<option value="all">All Districts</option>';
    
    let districtsSourceBdo = searchBdoData;
    let districtsSourceGp = searchGpData;
    
    if (selectedDivisionVal !== 'all') {
        districtsSourceBdo = searchBdoData.filter(r => r.Division === selectedDivisionVal);
        districtsSourceGp = searchGpData.filter(r => r.Division === selectedDivisionVal);
    }
    
    const districts = Array.from(new Set([
        ...districtsSourceBdo.map(r => r.District),
        ...districtsSourceGp.map(r => r.District)
    ].filter(Boolean))).sort();
    
    districts.forEach(dist => {
        const opt = document.createElement('option');
        opt.value = dist;
        opt.textContent = dist;
        searchDistrictSelect.appendChild(opt);
    });
    
    searchDistrictSelect.value = selectedDistrictVal;
}

// Populate the dynamic code picker list based on Search Type
function populateCodeDropdown() {
    searchCodeSelect.innerHTML = '<option value="all">All Codes</option>';
    
    let uniqueCodes = [];
    
    if (searchType === 'BDOCode') {
        uniqueCodes = Array.from(new Set(searchBdoData.map(r => r.BDOCode).filter(Boolean))).sort((a, b) => a - b);
    } else {
        uniqueCodes = Array.from(new Set([
            ...searchBdoData.map(r => r['GP LGDCode']),
            ...searchGpData.map(r => r['GP LGDCode'])
        ].filter(Boolean))).sort((a, b) => a - b);
    }
    
    uniqueCodes.forEach(code => {
        const opt = document.createElement('option');
        opt.value = code;
        opt.textContent = code;
        searchCodeSelect.appendChild(opt);
    });
    
    searchCodeSelect.value = selectedCodeVal;
}

// Reset filters to defaults
function resetSearchFilters() {
    searchTypeSelect.value = 'GPLGDCode';
    searchType = 'GPLGDCode';
    
    searchTextField.value = '';
    searchInputText = '';
    
    populateCodeDropdown();
    
    searchCodeSelect.value = 'all';
    selectedCodeVal = 'all';
    
    executeSearch();
}

// Execute search query based on inputs
function executeSearch() {
    showSearchLoading(true);
    setTimeout(() => {
        try {
            searchInputText = searchTextField.value.trim().toLowerCase();
            
            let queryType = searchTypeSelect.value;
            let finalBdoMatches = [];
            let finalGpMatches = [];
            
            let poolBdo = searchBdoData;
            let poolGp = searchGpData;
            
            // Check if we are searching "all" records
            const isAllQuery = selectedCodeVal === 'all' && searchInputText === '';
            
            if (isAllQuery) {
                finalBdoMatches = [...poolBdo];
                finalGpMatches = [...poolGp];
            } else {
                // Determine targeted code or search string
                const targetCode = selectedCodeVal !== 'all' ? selectedCodeVal : searchInputText;
                
                if (targetCode !== '') {
                    if (queryType === 'BDOCode') {
                        if (selectedCodeVal !== 'all') {
                            const numericCode = parseInt(selectedCodeVal);
                            finalBdoMatches = poolBdo.filter(r => r.BDOCode === numericCode || r['GP LGDCode'] === numericCode);
                        } else {
                            // If typed manually, check LGD or BDO Code match
                            finalBdoMatches = poolBdo.filter(r => 
                                (r.BDOCode !== undefined && r.BDOCode.toString().toLowerCase().includes(targetCode)) ||
                                (r['GP LGDCode'] !== undefined && r['GP LGDCode'].toString().toLowerCase().includes(targetCode))
                            );
                        }
                        
                        // Cross-reference GP LGD Codes from BDO matches to retrieve GP self-reported records
                        const matchedGpLgds = new Set(finalBdoMatches.map(r => r['GP LGDCode']).filter(Boolean));
                        finalGpMatches = poolGp.filter(r => r['GP LGDCode'] !== undefined && matchedGpLgds.has(r['GP LGDCode']));
                        
                    } else if (queryType === 'GPLGDCode') {
                        // Find matching records in GP tab by GPLGDCode
                        if (selectedCodeVal !== 'all') {
                            const numericCode = parseInt(selectedCodeVal);
                            finalGpMatches = poolGp.filter(r => r['GP LGDCode'] === numericCode);
                        } else {
                            finalGpMatches = poolGp.filter(r => r['GP LGDCode'] !== undefined && r['GP LGDCode'].toString().toLowerCase().includes(targetCode));
                        }
                        
                        // Cross-reference GP LGD Codes to retrieve matching records from BDO verified sheet
                        const matchedGpLgds = new Set(finalGpMatches.map(r => r['GP LGDCode']).filter(Boolean));
                        finalBdoMatches = poolBdo.filter(r => r['GP LGDCode'] !== undefined && matchedGpLgds.has(r['GP LGDCode']));
                        
                    } else if (queryType === 'Combine') {
                        // Comparative mode: Find matching records in both by GP LGDCode or Text
                        let numericCode = null;
                        if (selectedCodeVal !== 'all') {
                            numericCode = parseInt(selectedCodeVal);
                        } else {
                            const typedNum = parseInt(targetCode);
                            if (!isNaN(typedNum)) numericCode = typedNum;
                        }
                        
                        if (numericCode !== null) {
                            finalGpMatches = poolGp.filter(r => r['GP LGDCode'] === numericCode);
                            finalBdoMatches = poolBdo.filter(r => r['GP LGDCode'] === numericCode);
                        } else {
                            // Text query: support matching text in GP Name, Taluka, District
                            finalGpMatches = poolGp.filter(r => 
                                (r['GP LGDCode'] !== undefined && r['GP LGDCode'].toString().includes(targetCode)) ||
                                (r.GrampanchayatName && r.GrampanchayatName.toLowerCase().includes(targetCode)) ||
                                (r.GPTaluka && r.GPTaluka.toLowerCase().includes(targetCode)) ||
                                (r.GPDistrict && r.GPDistrict.toLowerCase().includes(targetCode))
                            );
                            
                            const matchedGpLgds = new Set(finalGpMatches.map(r => r['GP LGDCode']).filter(Boolean));
                            finalBdoMatches = poolBdo.filter(r => r['GP LGDCode'] !== undefined && matchedGpLgds.has(r['GP LGDCode']));
                        }
                    }
                }
            }
            
            searchFilteredBdo = finalBdoMatches;
            searchFilteredGp = finalGpMatches;
            
            // Reset pagination pages
            bdoPagination.page = 1;
            gpPagination.page = 1;
            
            renderSearchDashboard();
        } catch (error) {
            console.error("Error executing database search:", error);
            alert("An error occurred while running the search query. Verify dataset headers.");
            showSearchLoading(false);
        }
    }, 50);
}

// Render search results panels (KPIs, Details comparative grid, paginated tables)
function renderSearchDashboard() {
    const totalMatches = searchFilteredBdo.length + searchFilteredGp.length;
    
    // Update exporter availability
    searchExportBtn.disabled = totalMatches === 0;
    
    if (totalMatches === 0) {
        searchDashboardBody.classList.add('hidden');
        searchNoDataSection.classList.remove('hidden');
        showSearchLoading(false);
        return;
    }
    
    searchNoDataSection.classList.add('hidden');
    searchDashboardBody.classList.remove('hidden');
    
    // 1. Update KPI numbers
    document.getElementById('search-kpi-bdo').innerText = searchFilteredBdo.length.toLocaleString();
    document.getElementById('search-kpi-gp').innerText = searchFilteredGp.length.toLocaleString();
    
    const searchTypeText = searchType === 'BDOCode' ? 'BDO Block Code' : (searchType === 'GPLGDCode' ? 'GP LGD Code' : 'Combine BDO & GP');
    document.getElementById('search-kpi-type').innerText = searchTypeText;
    
    // 2. Handle layout based on single-GP comparative match vs multiple-GP listing table
    // A single comparative card matches if there is exactly 1 GP LGD Code matched
    const uniqueGpLgds = new Set([
        ...searchFilteredBdo.map(r => r['GP LGDCode']),
        ...searchFilteredGp.map(r => r['GP LGDCode'])
    ].filter(Boolean));
    
    if (uniqueGpLgds.size === 1) {
        // Show details and hide listing tables
        searchDetailsSection.classList.remove('hidden');
        searchTablesSection.classList.add('hidden');
        
        const bdoCard = document.getElementById('detail-bdo-card');
        const gpCard = document.getElementById('detail-gp-card');
        const comparisonGrid = document.querySelector('.comparison-grid');
        
        if (searchType === 'BDOCode') {
            bdoCard.classList.remove('hidden');
            gpCard.classList.add('hidden');
            if (comparisonGrid) comparisonGrid.style.gridTemplateColumns = '1fr';
            
            document.getElementById('search-kpi-bdo-card').classList.remove('hidden');
            document.getElementById('search-kpi-gp-card').classList.add('hidden');
            document.getElementById('search-kpi-total').innerText = searchFilteredBdo.length.toLocaleString();
        } else if (searchType === 'GPLGDCode') {
            bdoCard.classList.add('hidden');
            gpCard.classList.remove('hidden');
            if (comparisonGrid) comparisonGrid.style.gridTemplateColumns = '1fr';
            
            document.getElementById('search-kpi-bdo-card').classList.add('hidden');
            document.getElementById('search-kpi-gp-card').classList.remove('hidden');
            document.getElementById('search-kpi-total').innerText = searchFilteredGp.length.toLocaleString();
        } else {
            // Combine: Show both side-by-side
            bdoCard.classList.remove('hidden');
            gpCard.classList.remove('hidden');
            if (comparisonGrid) comparisonGrid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(450px, 1fr))';
            
            document.getElementById('search-kpi-bdo-card').classList.remove('hidden');
            document.getElementById('search-kpi-gp-card').classList.remove('hidden');
            document.getElementById('search-kpi-total').innerText = totalMatches.toLocaleString();
        }
        
        const singleLgdCode = Array.from(uniqueGpLgds)[0];
        renderSingleGpDetails(singleLgdCode);
    } else {
        // Show listing tables and hide comparative details
        searchDetailsSection.classList.add('hidden');
        searchTablesSection.classList.remove('hidden');
        
        // Show only the relevant tab columns and KPIs to reduce effort/clutter
        if (searchType === 'BDOCode') {
            // Hide GP elements
            document.getElementById('search-gp-table-wrapper').classList.add('hidden');
            document.getElementById('search-bdo-table-wrapper').classList.remove('hidden');
            document.getElementById('search-kpi-gp-card').classList.add('hidden');
            document.getElementById('search-kpi-bdo-card').classList.remove('hidden');
            
            // Total matches reflects only BDO
            document.getElementById('search-kpi-total').innerText = searchFilteredBdo.length.toLocaleString();
        } else if (searchType === 'GPLGDCode') {
            // Hide BDO elements
            document.getElementById('search-bdo-table-wrapper').classList.add('hidden');
            document.getElementById('search-gp-table-wrapper').classList.remove('hidden');
            document.getElementById('search-kpi-bdo-card').classList.add('hidden');
            document.getElementById('search-kpi-gp-card').classList.remove('hidden');
            
            // Total matches reflects only GP
            document.getElementById('search-kpi-total').innerText = searchFilteredGp.length.toLocaleString();
        } else {
            // Combine BDO and GP: Show both tables and both KPI cards
            document.getElementById('search-bdo-table-wrapper').classList.remove('hidden');
            document.getElementById('search-gp-table-wrapper').classList.remove('hidden');
            document.getElementById('search-kpi-bdo-card').classList.remove('hidden');
            document.getElementById('search-kpi-gp-card').classList.remove('hidden');
            
            // Total matches reflects both BDO + GP
            document.getElementById('search-kpi-total').innerText = totalMatches.toLocaleString();
        }
        
        // Render BDO verified and GP self-reported tables
        sortAndRenderBdoTable();
        sortAndRenderGpTable();
    }
    
    showSearchLoading(false);
}

// Render the detailed comparison cards for a single GP (BDO vs. GP values)
function renderSingleGpDetails(lgdCode) {
    const bdoRecord = searchBdoData.find(r => r['GP LGDCode'] === lgdCode) || {};
    const gpRecord = searchGpData.find(r => r['GP LGDCode'] === lgdCode) || {};
    
    // Render BDO Details Card
    const bdoScore = bdoRecord.Percentage !== undefined ? `${safeFormatFloat(bdoRecord.Percentage, 2)}%` : '-';
    document.getElementById('detail-bdo-percentage').innerText = bdoScore;
    
    const bdoFields = [
        { label: 'District', val: bdoRecord['DISTRICT VERIFIED'] || bdoRecord['DISTRICT VIRIFIED'] || '-' },
        { label: 'Block / Taluka', val: bdoRecord['BLOCK VERIFIED'] || bdoRecord['BLOCK VERIFIED.1'] || '-' },
        { label: 'Grampanchayat', val: bdoRecord['GrampanchayatName'] || '-' },
        { label: 'LGD Code', val: bdoRecord['GP LGDCode'] || lgdCode },
        { label: 'BDO Code', val: bdoRecord['BDOCode'] || '-' },
        { label: 'Population Category', val: bdoRecord['Population Category'] || '-' },
        { label: 'Marks Obtained', val: safeFormatFloat(bdoRecord['TotalMarks'], 2) },
        { label: 'Total Marks', val: safeFormatFloat(bdoRecord['TotalOutOfMarks'], 1) }
    ];
    
    let bdoFieldsHtml = '';
    bdoFields.forEach(f => {
        bdoFieldsHtml += `
            <div>
                <div class="details-content-label">${f.label}</div>
                <div class="details-content-value">${f.val}</div>
            </div>
        `;
    });
    document.getElementById('detail-bdo-fields').innerHTML = bdoFieldsHtml;
    
    // Render BDO verified framework scores F1-F8
    let bdoIndicatorsHtml = '';
    for (let i = 1; i <= 8; i++) {
        const marks = bdoRecord[`F${i}_Marks`];
        const outOf = bdoRecord[`F${i}_OutOfMarks`];
        let pct = 0;
        if (marks !== undefined && outOf) {
            pct = (marks / outOf) * 100;
        }
        
        bdoIndicatorsHtml += `
            <div class="indicator-item">
                <div class="indicator-meta">
                    <span style="font-weight: 600; color: var(--text-primary);">Framework ${i}</span>
                    <span style="color: var(--text-secondary); font-weight: 700;">
                        ${safeFormatFloat(marks, 2)} / ${safeFormatFloat(outOf, 1)} (${safeFormatFloat(pct, 1)}%)
                    </span>
                </div>
                <div class="indicator-bar-bg">
                    <div class="indicator-bar-fill gold" style="width: ${Math.min(100, Math.max(0, pct))}%"></div>
                </div>
            </div>
        `;
    }
    document.getElementById('detail-bdo-indicators').innerHTML = bdoIndicatorsHtml;
    
    // Render GP Details Card
    const gpScore = gpRecord.Percentage !== undefined ? `${safeFormatFloat(gpRecord.Percentage, 2)}%` : '-';
    document.getElementById('detail-gp-percentage').innerText = gpScore;
    
    const gpFields = [
        { label: 'District', val: gpRecord['GPDistrict'] || '-' },
        { label: 'Taluka', val: gpRecord['GPTaluka'] || '-' },
        { label: 'Grampanchayat', val: gpRecord['GrampanchayatName'] || '-' },
        { label: 'LGD Code', val: gpRecord['GP LGDCode'] || lgdCode },
        { label: 'BDO Code', val: bdoRecord['BDOCode'] || '-' }, // Fetch from cross-referenced BDO tab
        { label: 'Population Category', val: gpRecord['Population Category'] || '-' },
        { label: 'Marks Obtained', val: safeFormatFloat(gpRecord['TotalMarks'], 2) },
        { label: 'Total Marks', val: safeFormatFloat(gpRecord['TotalOutOfMarks'], 1) }
    ];
    
    let gpFieldsHtml = '';
    gpFields.forEach(f => {
        gpFieldsHtml += `
            <div>
                <div class="details-content-label">${f.label}</div>
                <div class="details-content-value">${f.val}</div>
            </div>
        `;
    });
    document.getElementById('detail-gp-fields').innerHTML = gpFieldsHtml;
    
    // Render GP self-reported framework scores F1-F8
    let gpIndicatorsHtml = '';
    for (let i = 1; i <= 8; i++) {
        const marks = gpRecord[`F${i}_Marks`];
        const outOf = gpRecord[`F${i}_OutOfMarks`];
        let pct = 0;
        if (marks !== undefined && outOf) {
            pct = (marks / outOf) * 100;
        }
        
        gpIndicatorsHtml += `
            <div class="indicator-item">
                <div class="indicator-meta">
                    <span style="font-weight: 600; color: var(--text-primary);">Framework ${i}</span>
                    <span style="color: var(--text-secondary); font-weight: 700;">
                        ${safeFormatFloat(marks, 2)} / ${safeFormatFloat(outOf, 1)} (${safeFormatFloat(pct, 1)}%)
                    </span>
                </div>
                <div class="indicator-bar-bg">
                    <div class="indicator-bar-fill emerald" style="width: ${Math.min(100, Math.max(0, pct))}%"></div>
                </div>
            </div>
        `;
    }
    document.getElementById('detail-gp-indicators').innerHTML = gpIndicatorsHtml;
}

// BDO Table sorting and rendering
function sortAndRenderBdoTable() {
    const col = bdoSort.column;
    const dir = bdoSort.direction === 'asc' ? 1 : -1;
    
    searchFilteredBdo.sort((a, b) => {
        const valA = a[col];
        const valB = b[col];
        
        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;
        
        if (typeof valA === 'string') {
            return valA.localeCompare(valB) * dir;
        }
        return (valA - valB) * dir;
    });
    
    renderBdoTableRows();
}

// GP Table sorting and rendering
function sortAndRenderGpTable() {
    const col = gpSort.column;
    const dir = gpSort.direction === 'asc' ? 1 : -1;
    
    searchFilteredGp.sort((a, b) => {
        const valA = a[col];
        const valB = b[col];
        
        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;
        
        if (typeof valA === 'string') {
            return valA.localeCompare(valB) * dir;
        }
        return (valA - valB) * dir;
    });
    
    renderGpTableRows();
}

// Draw headers and rows inside the BDO matched listing table
function renderBdoTableRows() {
    document.getElementById('bdo-table-count').innerText = searchFilteredBdo.length.toLocaleString();
    
    const tableHeader = document.getElementById('search-bdo-table-header');
    const tableBody = document.getElementById('search-bdo-table-body');
    
    // Main display columns to keep it clean and premium
    const displayCols = [
        { label: 'BDO Code', key: 'BDOCode' },
        { label: 'District', key: 'DISTRICT VERIFIED' },
        { label: 'Block', key: 'BLOCK VERIFIED' },
        { label: 'Grampanchayat', key: 'GrampanchayatName' },
        { label: 'LGD Code', key: 'GP LGDCode' },
        { label: 'Marks', key: 'TotalMarks' },
        { label: 'Score (%)', key: 'Percentage' }
    ];
    
    // Build Headers
    let headerHtml = '';
    displayCols.forEach(col => {
        const isSorted = bdoSort.column === col.key;
        let iconName = 'chevrons-up-down';
        if (isSorted) {
            iconName = bdoSort.direction === 'asc' ? 'chevron-up' : 'chevron-down';
        }
        headerHtml += `
            <th class="sortable" onclick="handleBdoTableSort('${col.key}')" style="cursor: pointer; padding: 12px 14px; background: #f8fafc; font-weight:600;">
                ${col.label} <i data-lucide="${iconName}" class="sort-icon" style="width:12px; height:12px;"></i>
            </th>
        `;
    });
    tableHeader.innerHTML = headerHtml;
    
    // Build Rows with client pagination
    tableBody.innerHTML = '';
    const startIndex = (bdoPagination.page - 1) * bdoPagination.pageSize;
    const endIndex = Math.min(startIndex + bdoPagination.pageSize, searchFilteredBdo.length);
    const paginatedItems = searchFilteredBdo.slice(startIndex, endIndex);
    
    if (paginatedItems.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center py-4">No matching records found.</td></tr>';
        return;
    }
    
    paginatedItems.forEach(item => {
        const row = document.createElement('tr');
        row.className = 'table-row';
        
        const bdoCode = item['BDOCode'] || '-';
        const district = item['DISTRICT VERIFIED'] || item['DISTRICT VIRIFIED'] || '-';
        const block = item['BLOCK VERIFIED'] || item['BLOCK VERIFIED.1'] || '-';
        const gpName = item['GrampanchayatName'] || '-';
        const lgdCode = item['GP LGDCode'] || '-';
        const marks = item['TotalMarks'] !== undefined ? `${safeFormatFloat(item['TotalMarks'], 2)}/${safeFormatFloat(item['TotalOutOfMarks'], 1)}` : '-';
        const score = item['Percentage'] !== undefined ? `${safeFormatFloat(item['Percentage'], 2)}%` : '-';
        
        row.innerHTML = `
            <td style="font-weight:700; color: var(--primary);">${bdoCode}</td>
            <td>${district}</td>
            <td>${block}</td>
            <td style="font-weight:600;">${gpName}</td>
            <td>${lgdCode}</td>
            <td>${marks}</td>
            <td style="font-weight:700; color: var(--warning);">${score}</td>
        `;
        
        // Add click listener to drill down into single GP details
        row.addEventListener('click', () => {
            // Select GP LGD code and render comparative details
            if (lgdCode !== '-') {
                // Switch search type to Combine
                searchTypeSelect.value = 'Combine';
                searchType = 'Combine';
                populateCodeDropdown();
                
                searchCodeSelect.value = 'all';
                selectedCodeVal = 'all';
                searchTextField.value = lgdCode;
                executeSearch();
            }
        });
        
        tableBody.appendChild(row);
    });
    
    renderBdoPaginationControls();
    lucide.createIcons();
}

// Draw headers and rows inside the GP matched listing table
function renderGpTableRows() {
    document.getElementById('gp-table-count').innerText = searchFilteredGp.length.toLocaleString();
    
    const tableHeader = document.getElementById('search-gp-table-header');
    const tableBody = document.getElementById('search-gp-table-body');
    
    const displayCols = [
        { label: 'District', key: 'GPDistrict' },
        { label: 'Taluka', key: 'GPTaluka' },
        { label: 'Grampanchayat', key: 'GrampanchayatName' },
        { label: 'LGD Code', key: 'GP LGDCode' },
        { label: 'Marks', key: 'TotalMarks' },
        { label: 'Score (%)', key: 'Percentage' }
    ];
    
    // Build Headers
    let headerHtml = '';
    displayCols.forEach(col => {
        const isSorted = gpSort.column === col.key;
        let iconName = 'chevrons-up-down';
        if (isSorted) {
            iconName = gpSort.direction === 'asc' ? 'chevron-up' : 'chevron-down';
        }
        headerHtml += `
            <th class="sortable" onclick="handleGpTableSort('${col.key}')" style="cursor: pointer; padding: 12px 14px; background: #f8fafc; font-weight:600;">
                ${col.label} <i data-lucide="${iconName}" class="sort-icon" style="width:12px; height:12px;"></i>
            </th>
        `;
    });
    tableHeader.innerHTML = headerHtml;
    
    // Build Rows with client pagination
    tableBody.innerHTML = '';
    const startIndex = (gpPagination.page - 1) * gpPagination.pageSize;
    const endIndex = Math.min(startIndex + gpPagination.pageSize, searchFilteredGp.length);
    const paginatedItems = searchFilteredGp.slice(startIndex, endIndex);
    
    if (paginatedItems.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center py-4">No matching records found.</td></tr>';
        return;
    }
    
    paginatedItems.forEach(item => {
        const row = document.createElement('tr');
        row.className = 'table-row';
        
        const district = item['GPDistrict'] || '-';
        const taluka = item['GPTaluka'] || '-';
        const gpName = item['GrampanchayatName'] || '-';
        const lgdCode = item['GP LGDCode'] || '-';
        const marks = item['TotalMarks'] !== undefined ? `${safeFormatFloat(item['TotalMarks'], 2)}/${safeFormatFloat(item['TotalOutOfMarks'], 1)}` : '-';
        const score = item['Percentage'] !== undefined ? `${safeFormatFloat(item['Percentage'], 2)}%` : '-';
        
        row.innerHTML = `
            <td>${district}</td>
            <td>${taluka}</td>
            <td style="font-weight:600;">${gpName}</td>
            <td style="font-weight:700; color: var(--primary);">${lgdCode}</td>
            <td>${marks}</td>
            <td style="font-weight:700; color: var(--success);">${score}</td>
        `;
        
        row.addEventListener('click', () => {
            if (lgdCode !== '-') {
                // Switch search type to Combine
                searchTypeSelect.value = 'Combine';
                searchType = 'Combine';
                populateCodeDropdown();
                
                searchCodeSelect.value = 'all';
                selectedCodeVal = 'all';
                searchTextField.value = lgdCode;
                executeSearch();
            }
        });
        
        tableBody.appendChild(row);
    });
    
    renderGpPaginationControls();
    lucide.createIcons();
}

// BDO Table Header Sorting Event Link
function handleBdoTableSort(column) {
    if (bdoSort.column === column) {
        bdoSort.direction = bdoSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        bdoSort.column = column;
        bdoSort.direction = 'desc'; // default descending
    }
    sortAndRenderBdoTable();
}

// GP Table Header Sorting Event Link
function handleGpTableSort(column) {
    if (gpSort.column === column) {
        gpSort.direction = gpSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        gpSort.column = column;
        gpSort.direction = 'desc'; // default descending
    }
    sortAndRenderGpTable();
}

// Generate BDO Table Pagination Controls
function renderBdoPaginationControls() {
    const container = document.getElementById('bdo-pagination');
    const totalPages = Math.ceil(searchFilteredBdo.length / bdoPagination.pageSize) || 1;
    const currPage = bdoPagination.page;
    
    const startIndex = (currPage - 1) * bdoPagination.pageSize + 1;
    const endIndex = Math.min(currPage * bdoPagination.pageSize, searchFilteredBdo.length);
    
    let pagesHtml = '';
    for (let i = Math.max(1, currPage - 2); i <= Math.min(totalPages, currPage + 2); i++) {
        pagesHtml += `
            <button class="pagination-btn ${i === currPage ? 'active' : ''}" onclick="changeBdoPage(${i})">${i}</button>
        `;
    }
    
    container.innerHTML = `
        <div class="pagination-info">
            Showing <strong>${searchFilteredBdo.length > 0 ? startIndex : 0}</strong> to <strong>${endIndex}</strong> of <strong>${searchFilteredBdo.length}</strong> records
        </div>
        <div class="pagination-pages">
            <button class="pagination-btn" onclick="changeBdoPage(1)" ${currPage === 1 ? 'disabled' : ''}>&laquo;</button>
            <button class="pagination-btn" onclick="changeBdoPage(${currPage - 1})" ${currPage === 1 ? 'disabled' : ''}>&lsaquo;</button>
            ${pagesHtml}
            <button class="pagination-btn" onclick="changeBdoPage(${currPage + 1})" ${currPage === totalPages ? 'disabled' : ''}>&rsaquo;</button>
            <button class="pagination-btn" onclick="changeBdoPage(${totalPages})" ${currPage === totalPages ? 'disabled' : ''}>&raquo;</button>
        </div>
    `;
}

// Generate GP Table Pagination Controls
function renderGpPaginationControls() {
    const container = document.getElementById('gp-pagination');
    const totalPages = Math.ceil(searchFilteredGp.length / gpPagination.pageSize) || 1;
    const currPage = gpPagination.page;
    
    const startIndex = (currPage - 1) * gpPagination.pageSize + 1;
    const endIndex = Math.min(currPage * gpPagination.pageSize, searchFilteredGp.length);
    
    let pagesHtml = '';
    for (let i = Math.max(1, currPage - 2); i <= Math.min(totalPages, currPage + 2); i++) {
        pagesHtml += `
            <button class="pagination-btn ${i === currPage ? 'active' : ''}" onclick="changeGpPage(${i})">${i}</button>
        `;
    }
    
    container.innerHTML = `
        <div class="pagination-info">
            Showing <strong>${searchFilteredGp.length > 0 ? startIndex : 0}</strong> to <strong>${endIndex}</strong> of <strong>${searchFilteredGp.length}</strong> records
        </div>
        <div class="pagination-pages">
            <button class="pagination-btn" onclick="changeGpPage(1)" ${currPage === 1 ? 'disabled' : ''}>&laquo;</button>
            <button class="pagination-btn" onclick="changeGpPage(${currPage - 1})" ${currPage === 1 ? 'disabled' : ''}>&lsaquo;</button>
            ${pagesHtml}
            <button class="pagination-btn" onclick="changeGpPage(${currPage + 1})" ${currPage === totalPages ? 'disabled' : ''}>&rsaquo;</button>
            <button class="pagination-btn" onclick="changeGpPage(${totalPages})" ${currPage === totalPages ? 'disabled' : ''}>&raquo;</button>
        </div>
    `;
}

// Pagination page changing triggers
window.changeBdoPage = function(pageNumber) {
    bdoPagination.page = pageNumber;
    renderBdoTableRows();
};

window.changeGpPage = function(pageNumber) {
    gpPagination.page = pageNumber;
    renderGpTableRows();
};

window.handleBdoTableSort = function(column) {
    handleBdoTableSort(column);
};

window.handleGpTableSort = function(column) {
    handleGpTableSort(column);
};

// Export filtered active matches to Excel/CSV
function exportSearchResults() {
    if (searchFilteredBdo.length === 0 && searchFilteredGp.length === 0) return;
    
    // We export a unified CSV of BDO scores and GP scores combined for ease of comparison
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Build BDO segment
    csvContent += "--- BDO VERIFIED SCORES ---\n";
    if (searchFilteredBdo.length > 0) {
        const bdoHeaders = Object.keys(searchFilteredBdo[0]);
        csvContent += bdoHeaders.join(",") + "\n";
        searchFilteredBdo.forEach(row => {
            const values = bdoHeaders.map(header => {
                let cell = row[header] !== undefined ? row[header] : '';
                // Quote string cell if it has comma to prevent column splitting
                if (typeof cell === 'string' && cell.includes(',')) {
                    cell = `"${cell}"`;
                }
                return cell;
            });
            csvContent += values.join(",") + "\n";
        });
    } else {
        csvContent += "No BDO records matched.\n";
    }
    
    csvContent += "\n--- GP SELF-REPORTED SCORES ---\n";
    if (searchFilteredGp.length > 0) {
        const gpHeaders = Object.keys(searchFilteredGp[0]);
        csvContent += gpHeaders.join(",") + "\n";
        searchFilteredGp.forEach(row => {
            const values = gpHeaders.map(header => {
                let cell = row[header] !== undefined ? row[header] : '';
                if (typeof cell === 'string' && cell.includes(',')) {
                    cell = `"${cell}"`;
                }
                return cell;
            });
            csvContent += values.join(",") + "\n";
        });
    } else {
        csvContent += "No GP records matched.\n";
    }
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    
    // Filename incorporates type and search term for clarity
    const searchString = selectedCodeVal !== 'all' ? selectedCodeVal : (searchInputText || 'all');
    link.setAttribute("download", `Search_Results_${searchType}_${searchString}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Show/Hide search loader spinner
function showSearchLoading(active) {
    if (active) {
        searchLoadingOverlay.classList.add('active');
    } else {
        searchLoadingOverlay.classList.remove('active');
    }
}

// Re-render search tables when language changes
window.addEventListener('portalLanguageChanged', () => {
    if (searchFilteredGp && searchFilteredGp.length > 0) {
        renderGpTable();
    }
    if (searchFilteredBdo && searchFilteredBdo.length > 0) {
        renderBdoTable();
    }
});

