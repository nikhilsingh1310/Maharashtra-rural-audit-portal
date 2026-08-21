// Bilingual i18n Translation Engine (English & Marathi)
const translations = {
    mr: {
        // Header
        'gov_seal_caption': 'महाराष्ट्र शासन',
        'gov_title': 'मुख्यमंत्री समृद्ध पंचायत राज अभियान',
        'gov_subtitle': 'ग्रामविकास आणि पंचायत राज विभाग, महाराष्ट्र',

        // Landing Page
        'landing_eyebrow': 'कामगिरी मूल्यमापन आणि लेखापरीक्षण प्रणाली',
        'landing_title': 'महाराष्ट्र ग्रामपंचायत पडताळणी पोर्टल',
        'landing_subtitle': 'मुख्यमंत्री समृद्ध पंचायत राज अभियान • कामगिरी रँकिंग आणि पडताळणी ऑडिट व्यासपीठ',
        'card_rankings_title': 'गट पडताळणी रँकिंग',
        'card_rankings_desc': 'पडताळणी केलेल्या कामगिरी मेट्रिक्सचे विश्लेषण करा, पात्रता निकष निश्चित करा, पुरस्कार मर्यादा समायोजित करा आणि जिल्हास्तरीय एकत्रीकरणाचे मूल्यांकन करा.',
        'card_rankings_btn': 'डॅशबोर्ड उघडा',
        'card_search_title': 'जीपी आणि बीडीओ शोध पोर्टल',
        'card_search_desc': 'एलजीडी/बीडीओ कोड निवडून किंवा शोधून ग्रामपंचायतींच्या स्वयं-नोंदणीकृत ऑडिटसह बीडीओ पडताळणी डेटासेटची तुलना करा.',
        'card_search_btn': 'शोध पोर्टल उघडा',
        'landing_footer': '© मुख्यमंत्री समृद्ध पंचायत राज अभियान, ग्रामविकास आणि पंचायत राज विभाग, महाराष्ट्र शासन',

        // Sidebar Navigation
        'nav_home': 'पोर्टल मुख्यपृष्ठ',
        'nav_rankings': 'गट रँकिंग',
        'nav_search': 'जीपी व बीडीओ शोध',
        'sidebar_brand': 'मूल्यमापन व ऑडिट',
        'sidebar_subtitle': 'कामगिरी रँकिंग इंजिन',

        // Sidebar Controls - Rankings
        'ctrl_data_source': 'डेटा स्रोत',
        'ctrl_drag_drop': 'एक्सेल फाइल ड्रॅग करा किंवा निवडा',
        'ctrl_eligibility': 'पात्रता आणि पुरस्कार',
        'ctrl_score_threshold': 'गुण मर्यादा (कट-ऑफ)',
        'ctrl_score_threshold_hint': 'या मूल्यापेक्षा कमी गुण असलेले ब्लॉक वगळा',
        'ctrl_max_awards': 'कमाल पुरस्कार / जिल्हा',
        'ctrl_max_awards_hint': 'प्रत्येक जिल्ह्यातील अव्वल N ब्लॉक्सपर्यंत मर्यादा',
        'ctrl_agg_strategy': 'एकत्रीकरण पद्धती',
        'ctrl_agg_strategy_hint': 'ब्लॉक-स्तरीय गुण मोजण्यासाठी वापरलेली पद्धत',
        'opt_agg_mean': 'सरासरी जीपी टक्केवारी (Mean)',
        'opt_agg_sum_ratio': 'एकूण भारित टक्केवारी (Sum Ratio)',
        'opt_agg_max': 'कमाल ग्रामपंचायत गुण (Max)',
        'opt_agg_min': 'किमान ग्रामपंचायत गुण (Min)',
        'ctrl_filters_search': 'फिल्टर आणि शोध',
        'ctrl_select_division': 'विभाग निवडा',
        'ctrl_select_district': 'जिल्हा निवडा',
        'ctrl_select_block': 'तालुका निवडा',
        'ctrl_search_input': 'नावानुसार शोधा...',
        'opt_all_districts': 'सर्व जिल्हे',
        'opt_all_blocks': 'सर्व तालुके',
        'opt_all_divisions': 'सर्व महसूल विभाग',

        // Sidebar Controls - Search
        'ctrl_search_data_source': 'शोध डेटा स्रोत',
        'ctrl_dataset_info': 'डेटासेट माहिती',
        'meta_bdo_rows_lbl': 'बीडीओ पडताळणी नोंदी:',
        'meta_gp_rows_lbl': 'जीपी स्वयं-नोंदणी नोंदी:',
        'meta_unique_bdo_lbl': 'एकूण बीडीओ कोड:',
        'meta_unique_gp_lbl': 'एकूण जीपी एलजीडी कोड:',

        // Dashboard Main
        'dash_title': 'कामगिरी रँकिंग डॅशबोर्ड',
        'dash_lead': 'जिल्ह्यांमधील पात्र ब्लॉक्सची माहिती, रँकिंग आणि यादी पहा.',
        'btn_export_csv': 'CSV एक्सपोर्ट करा',
        'btn_reset_filters': 'फिल्टर रीसेट करा',
        'stat_districts': 'प्रक्रिया केलेले जिल्हे',
        'stat_eligible_blocks': 'एकूण पात्र तालुके',
        'stat_awarded_blocks': 'पुरस्कृत तालुके',
        'stat_avg_score': 'सरासरी पुरस्कार गुण',
        'chart_awarded_districts': 'जिल्हानिहाय पुरस्कृत तालुके',
        'chart_awarded_sub': 'शॉर्टलिस्ट केलेल्या ब्लॉक्सच्या संख्येनुसार',
        'chart_top_blocks': 'अव्वल १० कामगिरी करणारे तालुके',
        'chart_top_sub': 'सर्व जिल्ह्यांमध्ये सर्वोच्च एकत्रित गुण',
        'leaders_title': 'जिल्हा नेते (अव्वल २ कामगिरी करणारे)',
        'leaders_sub': 'प्रत्येक जिल्ह्यातील अव्वल २ कामगिरी करणारे तालुके',
        'table_title': 'सर्वसमावेशक ब्लॉक पडताळणी टेबल',
        'col_district': 'जिल्हा',
        'col_block': 'तालुका / ब्लॉक',
        'col_evaluated_gps': 'मूल्यांकन केलेल्या जीपी',
        'col_block_score': 'ब्लॉक गुण (%)',
        'col_district_rank': 'जिल्हा रँक',
        'col_state_rank': 'राज्य रँक',
        'col_status': 'स्थिती',
        'col_actions': 'कृती',
        'badge_awarded': 'पुरस्कृत',
        'badge_eligible': 'पात्र',
        'badge_excluded': 'वगळलेले',
        'btn_details': 'तपशील',

        // Search Portal Main
        'search_portal_title': 'जीपी आणि बीडीओ कोड शोध पोर्टल',
        'search_portal_lead': 'विभाग, जिल्हा, बीडीओ कोड किंवा जीपी एलजीडी कोडद्वारे डेटा क्वेरी करा.',
        'btn_export_results': 'निकाल एक्सपोर्ट करा',
        'search_box_title': 'डेटाबेस शोधा',
        'lbl_division': 'विभाग निवडा',
        'lbl_district': 'जिल्हा निवडा',
        'lbl_search_type': 'शोध प्रकार',
        'lbl_select_code': 'कोड निवडा',
        'lbl_manual_search': 'मॅन्युअल कोड शोध',
        'opt_bdo_code': 'बीडीओ कोड (तालुका स्तर)',
        'opt_gp_code': 'जीपी एलजीडी कोड (ग्रामपंचायत स्तर)',
        'opt_combine_code': 'बीडीओ आणि जीपी एकत्र (तुलनात्मक)',
        'btn_search': 'शोधा',
        'btn_reset': 'रीसेट',
        'stat_total_matching': 'एकूण जुळणाऱ्या नोंदी',
        'stat_gp_matches': 'जीपी शीट नोंदी',
        'stat_search_type': 'सक्रिय शोध प्रकार',
        'tab_gp_records': 'जीपी स्वयं-नोंदणीकृत नोंदी',
        'tab_bdo_records': 'बीडीओ पडताळणी नोंदी',
        'col_taluka': 'तालुका',
        'col_grampanchayat': 'ग्रामपंचायत',
        'col_lgd_code': 'एलजीडी कोड',
        'col_bdo_code': 'बीडीओ कोड',
        'col_marks': 'गुण',
        'col_score': 'गुण (%)'
    },
    en: {
        // Header
        'gov_seal_caption': 'Government of Maharashtra',
        'gov_title': 'Chief Minister Samruddha Panchayat Raj Abhiyan',
        'gov_subtitle': 'Rural Development & Panchayat Raj Department, Maharashtra',

        // Landing Page
        'landing_eyebrow': 'Performance Evaluation & Audit System',
        'landing_title': 'Maharashtra Grampanchayat Verification Portal',
        'landing_subtitle': 'Chief Minister Samruddha Panchayat Raj Abhiyan • Performance Rankings & Verification Audit Platform',
        'card_rankings_title': 'Block Verification Rankings',
        'card_rankings_desc': 'Analyze verified performance metrics, configure eligibility parameters, adjust award thresholds, and evaluate district-level aggregations.',
        'card_rankings_btn': 'Open Dashboard',
        'card_search_title': 'GP & BDO Search Portal',
        'card_search_desc': 'Compare verified BDO datasets side-by-side with Grampanchayat self-reported audits by selecting or querying LGD/BDO codes.',
        'card_search_btn': 'Open Search Portal',
        'landing_footer': '© Chief Minister Samruddha Panchayat Raj Abhiyan, Rural Development & Panchayat Raj Department, Government of Maharashtra',

        // Sidebar Navigation
        'nav_home': 'Portal Home',
        'nav_rankings': 'Block Rankings',
        'nav_search': 'GP & BDO Search',
        'sidebar_brand': 'Evaluation & Audit',
        'sidebar_subtitle': 'Performance Ranking Engine',

        // Sidebar Controls - Rankings
        'ctrl_data_source': 'Data Source',
        'ctrl_drag_drop': 'Drag & drop excel or browse',
        'ctrl_eligibility': 'Eligibility & Awards',
        'ctrl_score_threshold': 'Score Threshold',
        'ctrl_score_threshold_hint': 'Exclude blocks scoring below this value',
        'ctrl_max_awards': 'Max Awards / District',
        'ctrl_max_awards_hint': 'Limit selection to top N blocks per district',
        'ctrl_agg_strategy': 'Aggregation Strategy',
        'ctrl_agg_strategy_hint': 'Method used to calculate block-level score',
        'opt_agg_mean': 'Average GP Percentage',
        'opt_agg_sum_ratio': 'Overall Weighted Percentage (Sum of Marks)',
        'opt_agg_max': 'Maximum Grampanchayat Score',
        'opt_agg_min': 'Minimum Grampanchayat Score',
        'ctrl_filters_search': 'Filters & Search',
        'ctrl_select_division': 'Select Division',
        'ctrl_select_district': 'Select District',
        'ctrl_select_block': 'Select Block',
        'ctrl_search_input': 'Search by name...',
        'opt_all_districts': 'All Districts',
        'opt_all_blocks': 'All Blocks',
        'opt_all_divisions': 'All Divisions',

        // Sidebar Controls - Search
        'ctrl_search_data_source': 'Search Data Source',
        'ctrl_dataset_info': 'Dataset Info',
        'meta_bdo_rows_lbl': 'BDO Verified Rows:',
        'meta_gp_rows_lbl': 'GP Self-Reported Rows:',
        'meta_unique_bdo_lbl': 'Unique BDO Codes:',
        'meta_unique_gp_lbl': 'Unique GP LGD Codes:',

        // Dashboard Main
        'dash_title': 'Performance Ranking Dashboard',
        'dash_lead': 'Shortlist, rank, and view eligible blocks across districts dynamically.',
        'btn_export_csv': 'Export CSV',
        'btn_reset_filters': 'Reset Filters',
        'stat_districts': 'Districts Processed',
        'stat_eligible_blocks': 'Total Eligible Blocks',
        'stat_awarded_blocks': 'Awarded Blocks',
        'stat_avg_score': 'Avg Awarded Score',
        'chart_awarded_districts': 'Awarded Blocks per District',
        'chart_awarded_sub': 'Top districts by number of shortlisted blocks',
        'chart_top_blocks': 'Top 10 Performing Blocks',
        'chart_top_sub': 'Highest aggregated scores across all districts',
        'leaders_title': 'District Leaders (Top 2 Performers)',
        'leaders_sub': 'Top 2 performing blocks in each of the 34 districts',
        'table_title': 'Comprehensive Block Verification Table',
        'col_district': 'District',
        'col_block': 'Block / Taluka',
        'col_evaluated_gps': 'Evaluated GPs',
        'col_block_score': 'Block Score (%)',
        'col_district_rank': 'District Rank',
        'col_state_rank': 'State Rank',
        'col_status': 'Status',
        'col_actions': 'Actions',
        'badge_awarded': 'Awarded',
        'badge_eligible': 'Eligible',
        'badge_excluded': 'Excluded',
        'btn_details': 'Details',

        // Search Portal Main
        'search_portal_title': 'GP & BDO Code Search Portal',
        'search_portal_lead': 'Query BDO-verified and GP self-reported datasets by Division, District, BDOCode, or GPLGDCode.',
        'btn_export_results': 'Export Results',
        'search_box_title': 'Search Database',
        'lbl_division': 'Select Division',
        'lbl_district': 'Select District',
        'lbl_search_type': 'Search Type',
        'lbl_select_code': 'Select Code',
        'lbl_manual_search': 'Manual Code Search',
        'opt_bdo_code': 'BDO Code (Block level)',
        'opt_gp_code': 'GP LGD Code (GP level)',
        'opt_combine_code': 'Combine BDO & GP (Comparative)',
        'btn_search': 'Search',
        'btn_reset': 'Reset',
        'stat_total_matching': 'Total Matching Records',
        'stat_gp_matches': 'GP Sheet Matches',
        'stat_search_type': 'Query Search Type',
        'tab_gp_records': 'GP Self-Reported Records',
        'tab_bdo_records': 'BDO Verified Records',
        'col_taluka': 'Taluka',
        'col_grampanchayat': 'Grampanchayat',
        'col_lgd_code': 'LGD Code',
        'col_bdo_code': 'BDO Code',
        'col_marks': 'Marks',
        'col_score': 'Score (%)'
    }
};

let currentLanguage = localStorage.getItem('portal_lang') || 'mr';

function getTranslation(key) {
    if (translations[currentLanguage] && translations[currentLanguage][key]) {
        return translations[currentLanguage][key];
    }
    if (translations['en'] && translations['en'][key]) {
        return translations['en'][key];
    }
    return key;
}

function setLanguage(lang) {
    if (lang !== 'mr' && lang !== 'en') return;
    currentLanguage = lang;
    localStorage.setItem('portal_lang', lang);

    // Update active button state
    document.querySelectorAll('.lang-btn').forEach(btn => {
        if (btn.getAttribute('data-lang') === lang) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Update all text nodes with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const translation = getTranslation(key);
        if (translation) {
            if (el.tagName === 'INPUT' && el.getAttribute('type') === 'text') {
                el.placeholder = translation;
            } else {
                el.textContent = translation;
            }
        }
    });

    // Notify listeners (for chart rerendering, dropdown options, etc.)
    window.dispatchEvent(new CustomEvent('portalLanguageChanged', { detail: { lang } }));
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    // Attach click listeners to language buttons
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const selectedLang = e.currentTarget.getAttribute('data-lang');
            setLanguage(selectedLang);
        });
    });

    // Apply current language on initial load
    setLanguage(currentLanguage);
});

// Expose globally
window.i18n = {
    get: getTranslation,
    set: setLanguage,
    getCurrent: () => currentLanguage
};
