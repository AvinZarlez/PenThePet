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
    { value: 'es', label: 'Español' },
];

/** All translated strings, keyed by language code then string key. */
const LANGUAGES = {
    en: {
        // ── Language ──────────────────────────────────────────────────────
        language_aria: 'Select language',

        // ── Page ──────────────────────────────────────────────────────────
        page_title: 'Pen the Pet - A Logic Puzzle Game',
        subtitle: 'A Logic Puzzle Game About Fencing In Your Pet',

        // ── Map Info ──────────────────────────────────────────────────────
        label_day: 'Day:',
        label_map: 'Map:',
        label_date: 'Date:',
        btn_share_level_aria: 'Share level',

        // ── Controls Bar ──────────────────────────────────────────────────
        btn_reset: 'Reset',
        btn_menu_open: 'Open menu',
        label_walls_placed: 'Walls Placed:',
        label_score: 'Score:',

        // ── Timer ─────────────────────────────────────────────────────────
        timer_pause_title: 'Pause timer',
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
        hint_check_label: 'Check if optimal',
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
        hint_used_heading: 'Hints used:',
        hint_optimal_notification: 'Your solution is optimal! 🎉',

        // ── Penned Status Button ───────────────────────────────────────────
        status_unsolved: 'Unsolved',
        status_submit: 'Submit',
        status_view_result: 'View Result',
        status_view_submitted: 'View your submitted score ({count} tiles)',
        status_view_submitted_simple: 'View your submitted score',
        status_penned_submit: 'Pet is penned! Click to submit your score ({count} tiles)',
        status_cant_escape: 'Pet can still escape - keep building walls!',

        // ── Score Display ─────────────────────────────────────────────────
        score_with_goal: '{score} / {goalScore}',
        score_below_goal: '{score} <',
        score_at_goal: '{score} ✅',
        score_infinity: '∞',

        // ── Best State Banner ─────────────────────────────────────────────
        best_so_far_none: 'Pet Not Penned',
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
        viewer_header: "Your Solution's Score:",
        metric_helper: 'yellow tiles counted',
        btn_copy_score: '📋 Copy Score',
        btn_back_to_game: 'Back to Game',
        copied_success: '✓ Copied!',
        copied_failed: '✗ Failed',

        // ── Share / Tell Friends ──────────────────────────────────────────
        btn_tell_friends: '📣 Tell Your Friends!',

        // ── Score / Metrics ───────────────────────────────────────────────
        pct_of_goal: '{pct}% of goal ({userScore}/{goalScore})',
        perfect_score: '<strong>PERFECT!</strong><br>You achieved the optimal score of {goalScore}!<br>Time: {time}',
        your_score_info: 'The optimal score was {goalScore} tiles.<br>Time: {time}',

        // ── Share Text ────────────────────────────────────────────────────
        share_title: 'Pen The Pet {emoji}',
        share_day_map_date: 'Day {day} - {mapName} - {date}',
        share_day_date: 'Day {day} - {date}',
        share_score_line: 'Score: {pct}% - Time: {time}',
        share_hints_line: 'Hints used: {hints}',
        share_hint_checked: 'checked for optimal',
        share_hint_target: 'revealed target',
        share_url_line: 'Play: {url}',

        // ── URL Parameter Errors ──────────────────────────────────────────
        url_param_future_date: '"{value}" is in the future — loading the latest available level instead.',
        url_param_not_found: '"{value}" does not exist — loading the latest available level instead.',
        url_param_invalid: '"{value}" is not a valid {param} — loading the latest available level instead.',
        url_param_error: 'Something went wrong loading {param} — loading the latest available level instead.',
        url_param_map_invalid: 'The "map" URL parameter is not valid — loading the latest available level instead.',

        // ── Hint Notifications ────────────────────────────────────────────
        hint_not_optimal_notification: 'A more optimal solution exists.',
        hint_reveal_notification: 'The optimal solution is {score}.',

        // ── Cloud Notification ────────────────────────────────────────────
        cloud_data_loaded: '☁️ Updated level data loaded from cloud',

        // ── No Map Error ──────────────────────────────────────────────────
        no_map_title: 'No Map Available',
        no_map_text: 'Sorry, there is no puzzle available for today ({date}).',
        no_map_check_back: 'Please check back tomorrow for a new puzzle!',

        // ── Calendar Level ────────────────────────────────────────────────
        calendar_day_label: 'Day {dayNumber}',

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
        instructions_scoring_2: 'When penned, your score is based on the size of the enclosed space',
        instructions_scoring_3: 'Try to match the largest possible score',
        instructions_scoring_4: 'Some tiles modify your score if included in the penned area',
        instructions_scoring_5: 'You can only submit once per puzzle - plan carefully!',
        instructions_scoring_6: 'After submission, you can view the optimal solution',
        instructions_hints_heading: 'Hint System',
        instructions_hints_1_prefix: 'When a pet is penned, you can press the ',
        instructions_hints_1_suffix: ' button to tell you whether your current score is the optimal solution.',
        instructions_hints_2: 'The score display will be yellow 🟡 if below `<` the optimal score. It will turn green 🟢 when the maximum score is found `✅`.',
        instructions_hints_3_prefix: 'If enabled, after checking the first hint, you can get further help by pressing ',
        instructions_hints_3_suffix: ' to see the optimal score to compare to your current score.',
        instructions_hints_4_prefix: 'You can disable hints entirely from the ',
        instructions_hints_4_suffix: ' menu.',
        instructions_options_heading: 'Options',
        instructions_options_text: 'You can customize your pet type and hint preferences in the Options menu. Your preferences are saved automatically.',

        // ── About Modal ───────────────────────────────────────────────────
        about_title: 'About Pen the Pet',
        about_close_aria: 'Close about',
        about_description_1_strong: 'Pen the Pet',
        about_description_1_body: ' is a logic puzzle game where you fence in your pet by strategically placing walls to create the largest enclosed area.',
        about_description_2: 'Each day features a new hand-crafted puzzle with a unique layout and challenge.',
        about_features_heading: 'Features',
        about_features_1: 'Daily puzzles with unique maps',
        about_features_2: 'Multiple pet types to choose from',
        about_features_3: 'Configurable hint system',
        about_features_4: 'Accessible keyboard navigation',
        about_features_5: 'Mobile-friendly design',
        about_feedback_heading: 'Feedback',
        about_feedback_prefix: 'Found a bug or have a feature idea? ',
        about_feedback_link: 'Open an issue on GitHub',
        about_feedback_suffix: ' — all feedback is welcome!',
        about_credits_heading: 'Credits',
        about_credits_1_prefix: 'Made by ',
        about_credits_1_link: 'Avin Zarlez',
        about_view_github: 'View this project on GitHub',
        about_copyright: '© 2026 Pen the Pet',
        about_privacy_policy: 'Privacy Policy',

        // ── Options Modal ─────────────────────────────────────────────────
        options_title: 'Options',
        options_close_aria: 'Close options',
        options_visuals_label: 'Visuals',
        options_hints_label: 'Hints',
        options_localization_label: 'Localization',
        options_pet_type_label: 'Pet Type:',
        options_hints_disabled_label: 'Disable hints',
        options_never_show_target_label: 'Never show target',
        options_timezone_label: 'Time Zone:',
        options_timezone_help: "Used to determine which puzzle is today's",
        options_language_label: 'Language:',
        options_debug_mode_label: 'Enable Debug Mode',
        options_debug_mode_help: 'Shows debug tools at the bottom of the page',
        btn_instructions_shortcut_aria: 'Open instructions',
        options_account_heading: '☁️ Account',
        options_sign_in_to_sync: 'Sign In to Sync',
        options_signed_in_as: 'Signed in as:',
        options_edit_profile: '✏️ Edit Username / Email',
        options_sign_out: 'Sign Out',
        options_delete_cloud_data: '🗑️ Delete Account & Cloud Data',
        options_delete_cloud_data_confirm: 'Delete your account and all cloud data? This cannot be undone',
        options_delete_requires_reauth: 'For security, please sign in again and then immediately press "Delete Account & Cloud Data".',
        options_download_my_data: '📥 Download My Data',

        // ── Cloud Sync Bar ────────────────────────────────────────────────
        cloud_sync_sign_in_btn: '☁️ Sign In to Sync',
        cloud_sync_syncing: '🔄 Syncing…',
        cloud_sync_syncing_date: '🔄 Syncing level…',
        cloud_sync_syncing_month: '🔄 Syncing month…',
        cloud_sync_syncing_all: '🔄 Syncing all data…',
        cloud_sync_synced: '☁️ Synced',
        cloud_sync_error: '⚠️ Sync error',

        // ── Shared Form Fields ────────────────────────────────────────────
        label_email: 'Email',
        placeholder_email: 'you@example.com',

        // ── Edit Profile Modal ────────────────────────────────────────────
        edit_profile_title: '✏️ Edit Profile',
        edit_profile_close_aria: 'Close edit profile',
        edit_profile_description: 'Update your username or email address',
        edit_profile_username_label: 'Username',
        edit_profile_username_placeholder: 'Your display name',
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
        cloud_sync_send_link: 'Send Sign-In Link',

        // ── Sync Error Modal ──────────────────────────────────────────────
        sync_error_title: '⚠️ Sync Error',
        sync_error_close_aria: 'Close sync error',
        sync_error_text: 'There was an error syncing your data with the cloud:',
        sync_error_contact_prefix: 'Please ',
        sync_error_contact_link: 'submit an issue on GitHub',
        sync_error_contact_suffix: ' with the error details above to help us fix it.',

        // ── Debug Section ─────────────────────────────────────────────────
        debug_heading: '🛠️ Debug Tools',
        debug_show_all_levels: 'Show All Levels',
        debug_show_all_levels_help: 'Shows future levels in the level selector',
        debug_reset_level: 'Reset Level',
        debug_reset_all: 'Reset All Data',
        debug_share_map_url: 'Share Map URL',

        // ── Footer ────────────────────────────────────────────────────────
        footer_view_github: 'View on GitHub',

        // ── Tile Descriptions (referenced by descriptionKey in tileData.js) ─
        tile_grass_description: 'Click to place a wall. Scores 1 point when penned.',
        tile_grass_aria: 'Grass tile at row {row}, column {col}. Click to build a wall.',
        tile_water_description: 'Your pet cannot travel through water.',
        tile_water_aria: 'Water tile at row {row}, column {col}. Cannot be clicked.',
        tile_wall_description: "Click to remove. Blocks your pet's escape.",
        tile_wall_aria: 'Wall at row {row}, column {col}. Click to remove.',
        tile_home_description: 'Home of your pet, which is trying to escape!',
        tile_home_aria: 'Home tile at row {row}, column {col}. Pet starting location.',
        tile_star_description: 'Adds 3 to your score when penned.',
        tile_star_aria: 'Star tile at row {row}, column {col}. Worth 3 points. Cannot place a wall here.',
        tile_bee_description: 'Removes 3 from your score when penned.',
        tile_bee_aria: 'Bee tile at row {row}, column {col}. Costs 3 points. Cannot place a wall here.',
        tile_hole_description: 'Blocks movement. Click to fill (costs 1 wall).',
        tile_hole_aria: 'Hole at row {row}, column {col}. Click to fill with a wall.',
        tile_filledHole_description: 'Scores 1 point when penned. Click to unfill (returns 1 wall).',
        tile_filledHole_aria: 'Filled hole at row {row}, column {col}. Acts as grass. Click to remove fill.',
    },

    es: {
        // ── Language ──────────────────────────────────────────────────────
        language_aria: 'Seleccionar idioma',

        // ── Page ──────────────────────────────────────────────────────────
        page_title: 'Encierra a la Mascota - Un Juego de Lógica',
        subtitle: 'Un juego de puzles lógico sobre esgrima con tu mascota',

        // ── Map Info ──────────────────────────────────────────────────────
        label_day: 'Día:',
        label_map: 'Mapa:',
        label_date: 'Fecha:',
        btn_share_level_aria: 'Compartir nivel',

        // ── Controls Bar ──────────────────────────────────────────────────
        btn_reset: 'Reiniciar',
        btn_menu_open: 'Abrir menú',
        label_walls_placed: 'Muros colocados:',
        label_score: 'Puntuación:',

        // ── Timer ─────────────────────────────────────────────────────────
        timer_pause_title: 'Pausar temporizador',
        timer_resume_title: 'Haz clic en Reanudar para continuar',
        timer_locked_title: 'Temporizador bloqueado tras el envío',
        timer_pause_icon: '⏸',
        timer_play_icon: '▶',
        timer_locked_icon: '⏱',

        // ── Pause Overlay ─────────────────────────────────────────────────
        pause_title: 'Pausa',
        ready_title: '¿Listo?',
        btn_resume: '▶ Reanudar',
        btn_begin: '▶ Comenzar',

        // ── Hint Button ───────────────────────────────────────────────────
        hint_check_label: 'Verificar si es óptimo',
        hint_check_title_penned: 'Verificar si tu solución es óptima',
        hint_check_title_not_penned: 'Primero encierra a la mascota para verificar tu solución',
        hint_reveal_target: 'Revelar objetivo',
        hint_reveal_title_penned: 'Revelar la puntuación objetivo',
        hint_reveal_title_not_penned: 'Primero encierra a la mascota',
        hint_target_revealed_title: 'Objetivo ya revelado',
        hint_target_disabled_title: 'La revelación del objetivo está desactivada en las opciones',
        hint_optimal: 'Óptimo',
        hint_not_optimal: 'No óptimo',
        hint_optimal_label: 'Óptimo es {score}',
        hint_used_display: 'Pista usada: {hints}',
        hint_used_heading: 'Pistas usadas:',
        hint_optimal_notification: '¡Tu solución es óptima! 🎉',

        // ── Penned Status Button ───────────────────────────────────────────
        status_unsolved: 'Sin resolver',
        status_submit: 'Enviar',
        status_view_result: 'Ver resultado',
        status_view_submitted: 'Ver tu puntuación enviada ({count} casillas)',
        status_view_submitted_simple: 'Ver tu puntuación enviada',
        status_penned_submit: '¡Mascota encerrada! Haz clic para enviar tu puntuación ({count} casillas)',
        status_cant_escape: 'La mascota aún puede escapar - ¡sigue construyendo muros!',

        // ── Score Display ─────────────────────────────────────────────────
        score_with_goal: '{score} / {goalScore}',
        score_below_goal: '{score} <',
        score_at_goal: '{score} ✅',
        score_infinity: '∞',

        // ── Best State Banner ─────────────────────────────────────────────
        best_so_far_none: 'Mascota no encerrada',
        best_so_far: 'Mejor hasta ahora: {score}',
        best_so_far_title_none: 'Encierra a la mascota para registrar tu mejor puntuación',
        best_so_far_title: 'Haz clic para restaurar tu mejor colocación de muros',

        // ── Walls Counter ─────────────────────────────────────────────────
        walls_counter: '{wallCount} / {maxWalls}',

        // ── Home Legend ───────────────────────────────────────────────────
        home_label: 'Inicio {emoji}',

        // ── Solution Toggle Bar ───────────────────────────────────────────
        solution_viewing_yours: 'Viendo: Tu solución',
        solution_viewing_optimal: 'Viendo: Resultado óptimo',
        solution_is_optimal_star: '⭐ ¡Tu solución es óptima!',
        solution_toggle_view_optimal: 'Ver resultado óptimo',
        solution_toggle_view_yours: 'Ver tu solución',
        solution_toggle_aria: 'Alternar entre tu solución y el resultado óptimo',

        // ── Roam Viewer Sidebar ───────────────────────────────────────────
        viewer_header: 'Puntuación de tu solución:',
        metric_helper: 'casillas amarillas contadas',
        btn_copy_score: '📋 Copiar puntuación',
        btn_back_to_game: 'Volver al juego',
        copied_success: '✓ ¡Copiado!',
        copied_failed: '✗ Falló',

        // ── Share / Tell Friends ──────────────────────────────────────────
        btn_tell_friends: '📣 ¡Cuéntales a tus amigos!',

        // ── Score / Metrics ───────────────────────────────────────────────
        pct_of_goal: '{pct}% del objetivo ({userScore}/{goalScore})',
        perfect_score: '<strong>¡PERFECTO!</strong><br>¡Lograste la puntuación óptima de {goalScore}!<br>Tiempo: {time}',
        your_score_info: 'La puntuación óptima fue {goalScore} casillas.<br>Tiempo: {time}',

        // ── Share Text ────────────────────────────────────────────────────
        share_title: 'Encierra a la Mascota {emoji}',
        share_day_map_date: 'Día {day} - {mapName} - {date}',
        share_day_date: 'Día {day} - {date}',
        share_score_line: 'Puntuación: {pct}% - Tiempo: {time}',
        share_hints_line: 'Pistas usadas: {hints}',
        share_hint_checked: 'verificado como óptimo',
        share_hint_target: 'objetivo revelado',
        share_url_line: 'Jugar: {url}',

        // ── URL Parameter Errors ──────────────────────────────────────────
        url_param_future_date: '"{value}" está en el futuro — cargando el último nivel disponible.',
        url_param_not_found: '"{value}" no existe — cargando el último nivel disponible.',
        url_param_invalid: '"{value}" no es un {param} válido — cargando el último nivel disponible.',
        url_param_error: 'Algo salió mal al cargar {param} — cargando el último nivel disponible.',
        url_param_map_invalid: 'El parámetro URL "map" no es válido — cargando el último nivel disponible.',

        // ── Hint Notifications ────────────────────────────────────────────
        hint_not_optimal_notification: 'Existe una solución más óptima.',
        hint_reveal_notification: 'La solución óptima es {score}.',

        // ── Cloud Notification ────────────────────────────────────────────
        cloud_data_loaded: '☁️ Datos del nivel actualizados cargados desde la nube',

        // ── No Map Error ──────────────────────────────────────────────────
        no_map_title: 'Mapa no disponible',
        no_map_text: 'Lo sentimos, no hay ningún rompecabezas disponible para hoy ({date}).',
        no_map_check_back: '¡Vuelve mañana para un nuevo rompecabezas!',

        // ── Calendar Level ────────────────────────────────────────────────
        calendar_day_label: 'Día {dayNumber}',

        // ── Menu Modal ────────────────────────────────────────────────────
        menu_title: 'Menú',
        menu_close_aria: 'Cerrar menú',
        btn_level_selector: '📅 Selector de niveles',
        btn_instructions: '📖 Instrucciones',
        btn_about: 'ℹ️ Acerca de',
        btn_options: '⚙️ Opciones',

        // ── Level Selector Modal ──────────────────────────────────────────
        level_selector_title: 'Selector de niveles',
        level_selector_description: 'Elige el rompecabezas de un día anterior para jugar',
        level_selector_close_aria: 'Cerrar selector de niveles',
        level_selector_loading: 'Cargando…',
        level_selector_sync_unknown: '???',
        calendar_go_to_today: 'Ir a hoy',
        calendar_prev: '‹',
        calendar_next: '›',
        calendar_prev_aria: 'Mes anterior',
        calendar_next_aria: 'Mes siguiente',

        // ── Instructions Modal ────────────────────────────────────────────
        instructions_title: 'Cómo jugar',
        instructions_close_aria: 'Cerrar instrucciones',
        instructions_objective_heading: 'Objetivo',
        instructions_objective_text: '¡Construye muros para encerrar a tu mascota! El objetivo es crear el área cercada más grande posible.',
        instructions_gameplay_heading: 'Jugabilidad',
        instructions_scoring_heading: 'Puntuación',
        instructions_scoring_1: 'El juego comprueba si tu mascota puede escapar (llegar al borde)',
        instructions_scoring_2: 'Cuando está encerrada, tu puntuación se basa en el tamaño del espacio cercado',
        instructions_scoring_3: 'Intenta alcanzar la puntuación más alta posible',
        instructions_scoring_4: 'Algunas casillas modifican tu puntuación si están incluidas en el área cercada',
        instructions_scoring_5: 'Solo puedes enviar una vez por rompecabezas — ¡planea con cuidado!',
        instructions_scoring_6: 'Tras el envío, puedes ver la solución óptima',
        instructions_hints_heading: 'Sistema de pistas',
        instructions_hints_1_prefix: 'Cuando la mascota está encerrada, puedes pulsar el botón ',
        instructions_hints_1_suffix: ' para saber si tu puntuación actual es la solución óptima.',
        instructions_hints_2: 'La puntuación se mostrará en amarillo 🟡 si está por debajo `<` de la puntuación óptima. Se volverá verde 🟢 cuando se encuentre la puntuación máxima `✅`.',
        instructions_hints_3_prefix: 'Si está habilitado, tras comprobar la primera pista, puedes obtener más ayuda pulsando ',
        instructions_hints_3_suffix: ' para ver la solución óptima junto a tu puntuación actual.',
        instructions_hints_4_prefix: 'Puedes desactivar las pistas completamente desde el menú de ',
        instructions_hints_4_suffix: '.',
        instructions_options_heading: 'Opciones',
        instructions_options_text: 'Puedes personalizar el tipo de mascota y las preferencias de pistas en el menú de Opciones. Tus preferencias se guardan automáticamente.',

        // ── About Modal ───────────────────────────────────────────────────
        about_title: 'Acerca de Encierra a la Mascota',
        about_close_aria: 'Cerrar acerca de',
        about_description_1_strong: 'Encierra a la Mascota',
        about_description_1_body: ' es un juego de lógica en el que cercas a tu mascota colocando muros estratégicamente para crear el área cercada más grande.',
        about_description_2: 'Cada día presenta un nuevo rompecabezas con un diseño y desafío únicos.',
        about_features_heading: 'Características',
        about_features_1: 'Rompecabezas diarios con mapas únicos',
        about_features_2: 'Múltiples tipos de mascota para elegir',
        about_features_3: 'Sistema de pistas configurable',
        about_features_4: 'Navegación accesible por teclado',
        about_features_5: 'Diseño adaptado a móviles',
        about_feedback_heading: 'Comentarios',
        about_feedback_prefix: '¿Encontraste un error o tienes una idea? ',
        about_feedback_link: 'Abre un problema en GitHub',
        about_feedback_suffix: ' — ¡todos los comentarios son bienvenidos!',
        about_credits_heading: 'Créditos',
        about_credits_1_prefix: 'Creado por ',
        about_credits_1_link: 'Avin Zarlez',
        about_view_github: 'Ver este proyecto en GitHub',
        about_copyright: '© 2026 Encierra a la Mascota',
        about_privacy_policy: 'Política de privacidad',

        // ── Options Modal ─────────────────────────────────────────────────
        options_title: 'Opciones',
        options_close_aria: 'Cerrar opciones',
        options_visuals_label: 'Visuales',
        options_hints_label: 'Pistas',
        options_localization_label: 'Localización',
        options_pet_type_label: 'Tipo de mascota:',
        options_hints_disabled_label: 'Desactivar pistas',
        options_never_show_target_label: 'Nunca mostrar objetivo',
        options_timezone_label: 'Zona horaria:',
        options_timezone_help: 'Se usa para determinar cuál es el rompecabezas de hoy',
        options_language_label: 'Idioma:',
        options_debug_mode_label: 'Activar modo de depuración',
        options_debug_mode_help: 'Muestra herramientas de depuración al final de la página',
        btn_instructions_shortcut_aria: 'Abrir instrucciones',
        options_account_heading: '☁️ Cuenta',
        options_sign_in_to_sync: 'Iniciar sesión para sincronizar',
        options_signed_in_as: 'Sesión iniciada como:',
        options_edit_profile: '✏️ Editar nombre / correo',
        options_sign_out: 'Cerrar sesión',
        options_delete_cloud_data: '🗑️ Eliminar cuenta y datos en la nube',
        options_delete_cloud_data_confirm: '¿Eliminar tu cuenta y todos los datos en la nube? Esto no se puede deshacer',
        options_delete_requires_reauth: 'Por seguridad, vuelve a iniciar sesión y luego pulsa "Eliminar cuenta y datos en la nube" de inmediato.',
        options_download_my_data: '📥 Descargar mis datos',

        // ── Cloud Sync Bar ────────────────────────────────────────────────
        cloud_sync_sign_in_btn: '☁️ Iniciar sesión para sincronizar',
        cloud_sync_syncing: '🔄 Sincronizando…',
        cloud_sync_syncing_date: '🔄 Sincronizando nivel…',
        cloud_sync_syncing_month: '🔄 Sincronizando mes…',
        cloud_sync_syncing_all: '🔄 Sincronizando todo…',
        cloud_sync_synced: '☁️ Sincronizado',
        cloud_sync_error: '⚠️ Error de sincronización',

        // ── Shared Form Fields ────────────────────────────────────────────
        label_email: 'Correo electrónico',
        placeholder_email: 'tu@ejemplo.com',

        // ── Edit Profile Modal ────────────────────────────────────────────
        edit_profile_title: '✏️ Editar perfil',
        edit_profile_close_aria: 'Cerrar editar perfil',
        edit_profile_description: 'Actualiza tu nombre de usuario o dirección de correo',
        edit_profile_username_label: 'Nombre de usuario',
        edit_profile_username_placeholder: 'Tu nombre para mostrar',
        edit_profile_connected_heading: 'Cuentas conectadas',
        edit_profile_google: 'Google',
        edit_profile_connect: 'Conectar',
        edit_profile_save: 'Guardar cambios',
        edit_profile_cancel: 'Cancelar',

        // ── Cloud Sync Auth Modal ─────────────────────────────────────────
        cloud_sync_modal_title: '☁️ Sincronización en la nube',
        cloud_sync_modal_close_aria: 'Cerrar inicio de sesión',
        cloud_sync_modal_description: 'Inicia sesión para sincronizar tu progreso entre dispositivos',
        cloud_sync_sign_in_google: 'Iniciar sesión con Google',
        cloud_sync_or_email: 'o usa un enlace por correo',
        cloud_sync_send_link: 'Enviar enlace de inicio de sesión',

        // ── Sync Error Modal ──────────────────────────────────────────────
        sync_error_title: '⚠️ Error de sincronización',
        sync_error_close_aria: 'Cerrar error de sincronización',
        sync_error_text: 'Se produjo un error al sincronizar tus datos con la nube:',
        sync_error_contact_prefix: 'Por favor, ',
        sync_error_contact_link: 'abre un problema en GitHub',
        sync_error_contact_suffix: ' con los detalles del error para ayudarnos a solucionarlo.',

        // ── Debug Section ─────────────────────────────────────────────────
        debug_heading: '🛠️ Herramientas de depuración',
        debug_show_all_levels: 'Mostrar todos los niveles',
        debug_show_all_levels_help: 'Muestra niveles futuros en el selector de niveles',
        debug_reset_level: 'Reiniciar nivel',
        debug_reset_all: 'Restablecer todos los datos',
        debug_share_map_url: 'Compartir URL del mapa',

        // ── Footer ────────────────────────────────────────────────────────
        footer_view_github: 'Ver en GitHub',

        // ── Tile Descriptions (referenced by descriptionKey in tileData.js) ─
        tile_grass_description: 'Haz clic para colocar un muro. Suma 1 punto cuando está cercado.',
        tile_grass_aria: 'Casilla de hierba en fila {row}, columna {col}. Haz clic para construir un muro.',
        tile_water_description: 'Tu mascota no puede viajar por el agua.',
        tile_water_aria: 'Casilla de agua en fila {row}, columna {col}. No se puede hacer clic.',
        tile_wall_description: 'Haz clic para eliminar. Bloquea el escape de tu mascota.',
        tile_wall_aria: 'Muro en fila {row}, columna {col}. Haz clic para eliminar.',
        tile_home_description: '¡Hogar de tu mascota, que intenta escapar!',
        tile_home_aria: 'Casilla de inicio en fila {row}, columna {col}. Ubicación de inicio de la mascota.',
        tile_star_description: 'Suma 3 a tu puntuación cuando está cercada.',
        tile_star_aria: 'Casilla de estrella en fila {row}, columna {col}. Vale 3 puntos. No se puede colocar un muro aquí.',
        tile_bee_description: 'Resta 3 de tu puntuación cuando está cercada.',
        tile_bee_aria: 'Casilla de abeja en fila {row}, columna {col}. Cuesta 3 puntos. No se puede colocar un muro aquí.',
        tile_hole_description: 'Bloquea el movimiento. Haz clic para rellenar (cuesta 1 muro).',
        tile_hole_aria: 'Agujero en fila {row}, columna {col}. Haz clic para rellenar con un muro.',
        tile_filledHole_description: 'Suma 1 punto cuando está cercado. Haz clic para quitar el relleno (devuelve 1 muro).',
        tile_filledHole_aria: 'Agujero relleno en fila {row}, columna {col}. Actúa como hierba. Haz clic para eliminar el relleno.',
    },
};

/**
 * I18N — Internationalization helper.
 *
 * Usage:
 *   I18N.t('some_key')                   // plain string lookup
 *   I18N.t('walls_counter', { wallCount: 3, maxWalls: 9 })  // with params
 *   I18N.setLanguage('en')               // switch language (triggers page reload)
 *   I18N.getLanguage()                   // returns current language code
 */
const I18N = {
    /** @type {string} Currently active language code. */
    _lang: 'en',

    /**
     * Sanitize a translation key coming from external sources (e.g. DOM attributes)
     * to ensure it only contains safe identifier characters.
     * This prevents untrusted data from influencing the lookup beyond selecting
     * among the fixed set of known translation keys.
     * @param {string|null} rawKey
     * @returns {string}
     */
    sanitizeKey(rawKey) {
        if (typeof rawKey !== 'string') return '';
        // Allow only ASCII letters, digits and underscore. Strip everything else.
        return rawKey.replace(/[^A-Za-z0-9_]/g, '');
    },

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
     * Switch to a new language and persist to cookie.
     * Callers are responsible for triggering a page reload so that all text
     * (tile descriptions, overlays, etc.) re-renders in the new language.
     * @param {string} lang - Language code (e.g. 'en')
     */
    setLanguage(lang) {
        if (!LANGUAGES[lang]) return;
        this._lang = lang;
        if (typeof CookieUtils !== 'undefined') {
            CookieUtils.setCookie('lang', lang, 3650); // ~10 years
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
     * Update every DOM element that carries a data-i18n-* attribute with its
     * translated plain-text string. Called once on page load from main.js.
     */
    applyTranslations() {
        if (typeof document === 'undefined') return;

        // textContent
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = this.sanitizeKey(el.getAttribute('data-i18n'));
            el.textContent = this.t(key);
        });

        // title attribute
        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            const key = this.sanitizeKey(el.getAttribute('data-i18n-title'));
            el.title = this.t(key);
        });

        // aria-label attribute
        document.querySelectorAll('[data-i18n-aria]').forEach(el => {
            const key = this.sanitizeKey(el.getAttribute('data-i18n-aria'));
            el.setAttribute('aria-label', this.t(key));
        });

        // placeholder attribute
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = this.sanitizeKey(el.getAttribute('data-i18n-placeholder'));
            el.placeholder = this.t(key);
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
