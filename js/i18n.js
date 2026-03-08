/**
 * Internationalization (i18n) Module
 *
 * Central file for ALL user-facing strings. Each key maps to an object whose
 * properties are language codes ('en', 'es', etc.) with the translated string.
 *
 * To add a new language:
 *   1. Add a new entry to LANGUAGES with the language code as the key.
 *   2. Copy all keys from 'en' and translate the values.
 *   3. Add the option to LANGUAGE_OPTIONS below.
 *
 * Template parameters are written as {paramName} and are substituted by
 * I18N.t(key, { paramName: value }).
 *
 * To hand this file to a translator: share only the inner objects under each
 * language code. The keys stay the same across all languages.
 */

/** All supported languages and their display names (shown in native script). */
const LANGUAGE_OPTIONS = [
    { value: 'en', label: 'English' },
];

/** All translated strings, keyed by language code then string key. */
const LANGUAGES = {
    en: {
        // ── Language ──────────────────────────────────────────────────────
        language_aria: 'Select language',

        // ── Page ──────────────────────────────────────────────────────────
        page_title: 'Pen the Pet - A Logic Puzzle Game',
        subtitle: 'A Logic Puzzle Game About Fencing',

        // ── Map Info ──────────────────────────────────────────────────────
        label_day: 'Day:',
        label_map: 'Map:',
        label_date: 'Date:',

        // ── Controls Bar ──────────────────────────────────────────────────
        btn_reset: 'Reset',
        btn_menu_open: 'Open menu',
        label_walls_placed: 'Walls Placed:',
        label_area_size: 'Area Size:',

        // ── Timer ─────────────────────────────────────────────────────────
        timer_pause_title: 'Pause timer',
        timer_pause_aria: 'Pause timer',
        timer_resume_title: 'Click Resume to continue',
        timer_locked_title: 'Timer locked after submission',
        timer_pause_icon: '⏸',
        timer_play_icon: '▶',
        timer_locked_icon: '⏱',

        // ── Pause Overlay ─────────────────────────────────────────────────
        pause_title: 'Pause',
        ready_title: 'Ready?',
        btn_resume: '▶ Resume',
        btn_begin: '▶ Begin',

        // ── Hint Button ───────────────────────────────────────────────────
        hint_check_label: 'Check if Optimal',
        hint_check_aria: 'Check if optimal',
        hint_check_title_disabled: 'Pen the pet first to check your solution',
        hint_check_title_penned: 'Check if your solution is optimal',
        hint_check_title_not_penned: 'Pen the pet first to check your solution',
        hint_reveal_target: 'Reveal Target',
        hint_reveal_title_penned: 'Reveal the target score',
        hint_reveal_title_not_penned: 'Pen the pet first',
        hint_target_revealed_title: 'Target already revealed',
        hint_target_disabled_title: 'Target reveal is disabled in options',
        hint_optimal: 'Optimal',
        hint_not_optimal: 'Not Optimal',
        hint_optimal_label: 'Optimal is {score}',
        hint_used_display: 'Hint used: {hints}',
        hint_optimal_notification: 'Your solution is optimal! 🎉',

        // ── Penned Status Button ───────────────────────────────────────────
        status_unsolved: 'Unsolved',
        status_submit: 'Submit',
        status_view_result: 'View Result',
        status_view_submitted: 'View your submitted score ({count} tiles)',
        status_view_submitted_simple: 'View your submitted score',
        status_penned_submit: 'Pet is penned! Click to submit your score ({count} tiles)',
        status_cant_escape: 'Pet can still escape - keep building walls!',

        // ── Area Size Display ─────────────────────────────────────────────
        area_size_with_goal: '{areaSize} / {goalAreaSize}',
        area_size_below_goal: '{areaSize} <',
        area_size_at_goal: '{areaSize} ✅',
        area_size_infinity: '∞',

        // ── Best State Banner ─────────────────────────────────────────────
        best_so_far_none: 'Best So Far: None',
        best_so_far: 'Best So Far: {score}',
        best_so_far_title_none: 'Pen the pet to record your best score',
        best_so_far_title: 'Click to restore your best wall placement',

        // ── Walls Counter ─────────────────────────────────────────────────
        walls_counter: '{wallCount} / {maxWalls}',

        // ── Home Legend ───────────────────────────────────────────────────
        home_label: 'Home {emoji}',

        // ── Solution Toggle Bar ───────────────────────────────────────────
        solution_viewing_yours: 'Viewing: Your Solution',
        solution_viewing_optimal: 'Viewing: Optimal Result',
        solution_is_optimal_star: '⭐ Your solution is optimal!',
        solution_toggle_view_optimal: 'View Optimal Result',
        solution_toggle_view_yours: 'View Your Solution',
        solution_toggle_aria: 'Toggle between your solution and optimal result',

        // ── Roam Viewer Sidebar ───────────────────────────────────────────
        viewer_header: 'Pet Containment Summary',
        metric_label_yours: 'Your Solution Score',
        metric_label_optimal: 'Optimal Result Score',
        metric_label_roaming: 'Roaming Area Score',
        metric_helper: 'yellow tiles counted',
        btn_copy_score: '📋 Copy Score',
        btn_back_to_game: 'Back to Game',
        copied_success: '✓ Copied!',
        copied_failed: '✗ Failed',

        // ── Score / Metrics ───────────────────────────────────────────────
        pct_of_goal: '{pct}% of goal ({userScore}/{goalScore})',
        perfect_score: '<strong>PERFECT!</strong><br>You achieved the optimal score of {goalScore}!<br>Time: {time}',
        your_score_info: 'Your score<br>Optimal: {goalScore} tiles<br>Time: {time}',

        // ── Share Text ────────────────────────────────────────────────────
        share_title: 'Pen The Pet {emoji}',
        share_day_map_date: 'Day {day} - {mapName} - {date}',
        share_day_date: 'Day {day} - {date}',
        share_score_line: 'Score: {pct}% - Time: {time}',
        share_hints_line: 'Hints used: {hints}',
        share_hint_checked: 'checked for optimal',
        share_hint_target: 'revealed target',

        // ── Menu Modal ────────────────────────────────────────────────────
        menu_title: 'Menu',
        menu_close_aria: 'Close menu',
        btn_level_selector: '📅 Level Selector',
        btn_instructions: '📖 Instructions',
        btn_about: 'ℹ️ About',
        btn_options: '⚙️ Options',

        // ── Level Selector Modal ──────────────────────────────────────────
        level_selector_title: 'Level Selector',
        level_selector_description: "Choose a previous day's puzzle to play",
        level_selector_close_aria: 'Close level selector',
        level_selector_loading: 'Loading...',
        level_selector_sync_unknown: '???',
        calendar_go_to_today: 'Go To Today',
        calendar_prev: '‹',
        calendar_next: '›',
        calendar_prev_aria: 'Previous month',
        calendar_next_aria: 'Next month',

        // ── Instructions Modal ────────────────────────────────────────────
        instructions_title: 'How to Play',
        instructions_close_aria: 'Close instructions',
        instructions_objective_heading: 'Objective',
        instructions_objective_text: 'Build walls to pen in your pet! The goal is to create the largest enclosed area possible.',
        instructions_gameplay_heading: 'Gameplay',
        instructions_scoring_heading: 'Scoring',
        instructions_scoring_1: 'The game checks if your pet can escape (reach the edge)',
        instructions_scoring_2: 'When penned (✓), your area size shows the enclosed space',
        instructions_scoring_3: 'Try to match or exceed the goal area size',
        instructions_scoring_4: 'Larger penned areas score better!',
        instructions_scoring_5: 'You can only submit once per puzzle - plan carefully!',
        instructions_scoring_6: 'After submission, you can view the optimal solution to compare',
        instructions_hints_heading: 'Hint System',
        instructions_hints_1: 'When a pet is penned, you can press the <strong>Check if Optimal</strong> button to tell you whether your current score is the optimal solution.',
        instructions_hints_2: 'The score display will be yellow 🟡 if below `<` the optimal score. It will turn green 🟢 when the correct answer is found `✅`.',
        instructions_hints_3: 'If enabled, after checking the first hint, you can get further help by pressing <strong>Reveal Target</strong> to see the optimal solution alongside your current score.',
        instructions_hints_4: 'You can disable hints entirely from the <strong>Options</strong> menu.',
        instructions_options_heading: 'Options',
        instructions_options_text: 'You can customize your pet type and hint preferences in the Options menu. Your preferences are saved automatically.',

        // ── About Modal ───────────────────────────────────────────────────
        about_title: 'About Pen the Pet',
        about_close_aria: 'Close about',
        about_description_1: '<strong>Pen the Pet</strong> is a logic puzzle game where you fence in your pet by strategically placing walls to create the largest enclosed area.',
        about_description_2: 'Each day features a new hand-crafted puzzle with a unique layout and challenge.',
        about_features_heading: 'Features',
        about_features_1: 'Daily puzzles with unique maps',
        about_features_2: 'Multiple pet types to choose from',
        about_features_3: 'Configurable hint system',
        about_features_4: 'Accessible keyboard navigation',
        about_features_5: 'Mobile-friendly design',
        about_feedback_heading: 'Feedback',
        about_feedback_text: 'Found a bug or have a feature idea? <a id="githubIssuesLink" href="{repoUrl}/issues" target="_blank" rel="noopener noreferrer">Open an issue on GitHub</a> — all feedback is welcome!',
        about_credits_heading: 'Credits',
        about_credits_1: 'Made by <a href="https://www.AvinZarlez.com" target="_blank" rel="noopener noreferrer">Avin Zarlez</a>',
        about_view_github: 'View this project on GitHub',
        about_copyright: '© 2026 Pen the Pet',

        // ── Options Modal ─────────────────────────────────────────────────
        options_title: 'Options',
        options_close_aria: 'Close options',
        options_pet_type_label: 'Pet Type:',
        options_hints_disabled_label: 'Disable hints',
        options_never_show_target_label: 'Never show target',
        options_timezone_label: 'Time Zone:',
        options_timezone_help: "Used to determine which puzzle is today's",
        options_debug_mode_label: 'Enable Debug Mode',
        options_debug_mode_help: 'Shows debug tools at the bottom of the page',
        options_account_heading: '☁️ Account',
        options_sign_in_to_sync: 'Sign In to Sync',
        options_signed_in_as: 'Signed in as:',
        options_edit_profile: '✏️ Edit Username / Email',
        options_sign_out: 'Sign Out',

        // ── Cloud Sync Bar ────────────────────────────────────────────────
        cloud_sync_sign_in_btn: '☁️ Sign In to Sync',
        cloud_sync_sign_out_btn: 'Sign Out',
        cloud_sync_syncing: '🔄 Syncing…',
        cloud_sync_synced: '☁️ Synced',
        cloud_sync_error: '⚠️ Sync error',

        // ── Edit Profile Modal ────────────────────────────────────────────
        edit_profile_title: '✏️ Edit Profile',
        edit_profile_close_aria: 'Close edit profile',
        edit_profile_description: 'Update your username or email address',
        edit_profile_username_label: 'Username',
        edit_profile_username_placeholder: 'Your display name',
        edit_profile_email_label: 'Email',
        edit_profile_email_placeholder: 'you@example.com',
        edit_profile_connected_heading: 'Connected accounts',
        edit_profile_google: 'Google',
        edit_profile_connect: 'Connect',
        edit_profile_save: 'Save Changes',
        edit_profile_cancel: 'Cancel',

        // ── Cloud Sync Auth Modal ─────────────────────────────────────────
        cloud_sync_modal_title: '☁️ Cloud Sync',
        cloud_sync_modal_close_aria: 'Close sign in',
        cloud_sync_modal_description: 'Sign in to sync your puzzle progress across devices',
        cloud_sync_sign_in_google: 'Sign in with Google',
        cloud_sync_or_email: 'or use email link',
        cloud_sync_email_label: 'Email',
        cloud_sync_email_placeholder: 'you@example.com',
        cloud_sync_send_link: 'Send Sign-In Link',

        // ── Sync Error Modal ──────────────────────────────────────────────
        sync_error_title: '⚠️ Sync Error',
        sync_error_close_aria: 'Close sync error',
        sync_error_text: 'There was an error syncing your data with the cloud:',
        sync_error_link_text: 'submit an issue on GitHub',

        // ── Debug Section ─────────────────────────────────────────────────
        debug_heading: '🛠️ Debug Tools',
        debug_show_all_levels: 'Show All Levels',
        debug_show_all_levels_help: 'Shows future levels in the level selector',
        debug_reset_level: 'Reset Level',
        debug_reset_all: 'Reset All Data',

        // ── Footer ────────────────────────────────────────────────────────
        footer_view_github: 'View on GitHub',

        // ── Tile Descriptions (referenced by descriptionKey in tileData.js) ─
        tile_grass_description: 'Click on grass tiles to place walls. Each grass tile in your penned area scores 1 point.',
        tile_grass_aria: 'Grass tile at row {row}, column {col}. Click to build a wall.',
        tile_water_description: 'Water tiles block movement and cannot be clicked. Walls cannot be placed on water.',
        tile_water_aria: 'Water tile at row {row}, column {col}. Cannot be clicked.',
        tile_wall_description: 'Walls block pet movement. Click on a wall to remove it. You have a limited number of walls to place.',
        tile_wall_aria: 'Wall at row {row}, column {col}. Click to remove.',
        tile_home_description: 'Your pet starts at the home tile. The penned area is measured from here.',
        tile_home_aria: 'Home tile at row {row}, column {col}. Pet starting location.',
        tile_star_description: 'Star tiles act like grass but score 3 points instead of 1 when inside your penned area. Walls cannot be placed on stars.',
        tile_star_aria: 'Star tile at row {row}, column {col}. Worth 3 points. Cannot place a wall here.',
        tile_bee_description: 'Bee tiles act like grass but subtract 3 points when inside your penned area. Try to keep bees outside! Walls cannot be placed on bees.',
        tile_bee_aria: 'Bee tile at row {row}, column {col}. Costs 3 points. Cannot place a wall here.',
        tile_hole_description: 'Holes block movement like water, but you can fill them by placing a wall. A filled hole acts as grass and scores 1 point.',
        tile_hole_aria: 'Hole at row {row}, column {col}. Click to fill with a wall.',
        tile_filledHole_description: 'A filled hole acts as grass, scoring 1 point when inside your penned area. Click to remove the fill.',
        tile_filledHole_aria: 'Filled hole at row {row}, column {col}. Acts as grass. Click to remove fill.',
    },
};

/**
 * I18N — Internationalization helper.
 *
 * Usage:
 *   I18N.t('some_key')                   // plain string lookup
 *   I18N.t('walls_counter', { wallCount: 3, maxWalls: 9 })  // with params
 *   I18N.setLanguage('en')               // switch language + update DOM
 *   I18N.getLanguage()                   // returns current language code
 */
const I18N = {
    /** @type {string} Currently active language code. */
    _lang: 'en',

    /**
     * Return the translated string for key in the current language.
     * Falls back to 'en' if the key is missing in the active language.
     * Template parameters written as {name} are replaced by params.name.
     *
     * @param {string} key
     * @param {Object} [params]
     * @returns {string}
     */
    t(key, params) {
        const lang = LANGUAGES[this._lang] || LANGUAGES.en;
        let str = Object.prototype.hasOwnProperty.call(lang, key)
            ? lang[key]
            : (LANGUAGES.en[key] !== undefined ? LANGUAGES.en[key] : key);

        if (params) {
            for (const [k, v] of Object.entries(params)) {
                str = str.split(`{${k}}`).join(String(v));
            }
        }
        return str;
    },

    /**
     * Return the current language code.
     * @returns {string}
     */
    getLanguage() {
        return this._lang;
    },

    /**
     * Switch to a new language, persist to cookie, and update all
     * data-i18n-* elements in the DOM.
     * @param {string} lang - Language code (e.g. 'en')
     */
    setLanguage(lang) {
        if (!LANGUAGES[lang]) return;
        this._lang = lang;
        if (typeof CookieUtils !== 'undefined') {
            CookieUtils.setCookie('lang', lang, 3650); // ~10 years
        }
        if (typeof document !== 'undefined') {
            this._applyToDOM();
        }
    },

    /**
     * Load the saved language preference from cookie (called once on startup).
     */
    loadFromCookie() {
        if (typeof CookieUtils !== 'undefined') {
            const saved = CookieUtils.getCookie('lang');
            if (saved && LANGUAGES[saved]) {
                this._lang = saved;
            }
        }
    },

    /**
     * Update every DOM element that carries a data-i18n-* attribute.
     * Called automatically by setLanguage(); call manually after DOM load.
     */
    _applyToDOM() {
        if (typeof document === 'undefined') return;

        // textContent
        document.querySelectorAll('[data-i18n]').forEach(el => {
            el.textContent = this.t(el.getAttribute('data-i18n'));
        });

        // innerHTML (for strings that contain markup)
        document.querySelectorAll('[data-i18n-html]').forEach(el => {
            el.innerHTML = this.t(el.getAttribute('data-i18n-html'), { repoUrl: (typeof CONSTANTS !== 'undefined' ? CONSTANTS.REPO_URL : '') });
        });

        // title attribute
        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            el.title = this.t(el.getAttribute('data-i18n-title'));
        });

        // aria-label attribute
        document.querySelectorAll('[data-i18n-aria]').forEach(el => {
            el.setAttribute('aria-label', this.t(el.getAttribute('data-i18n-aria')));
        });

        // placeholder attribute
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            el.placeholder = this.t(el.getAttribute('data-i18n-placeholder'));
        });

        // page title
        document.title = this.t('page_title');

        // sync language selector value
        const langSelector = document.getElementById('languageSelector');
        if (langSelector) langSelector.value = this._lang;
    },
};

// Export for use in other modules (Node.js / Jest)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { I18N, LANGUAGES, LANGUAGE_OPTIONS };
}
