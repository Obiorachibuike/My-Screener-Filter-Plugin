<?php
/*
Plugin Name: My Screener Filter
Description: A custom plugin for dynamic data filtering using client-side JavaScript.
Version: 1.0
Author: Your Name
*/

// Exit if accessed directly to prevent direct file access
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Helper function to load data from a CSV file.
 * This function will now primarily be used for smaller CSVs like screener_list.csv,
 * or adapted for chunking if used for larger files in specific contexts.
 * For screener_data.csv, we'll use an AJAX approach for large datasets.
 *
 * @param string $file_path The full path to the CSV file.
 * @return array A 2D array containing the CSV data, or an empty array on failure.
 */
function load_csv_data_for_headers_or_small_files( $file_path ) {
    $data = [];
    if ( ! file_exists( $file_path ) ) {
        error_log( "CSV file not found: " . $file_path );
        return $data;
    }

    if ( ( $handle = fopen( $file_path, 'r' ) ) !== false ) {
        // This function is still designed to read the entire file.
        // For 'screener_data.csv', we'll read only headers here,
        // and full data via AJAX to avoid memory issues.
        while ( ( $row = fgetcsv( $handle ) ) !== false ) {
            $data[] = $row;
        }
        fclose( $handle );
    } else {
        error_log( "Failed to open CSV file: " . $file_path );
    }
    return $data;
}

/**
 * Enqueue plugin scripts and styles.
 * This function tells WordPress to load our CSS and JS files.
 */
function my_screener_filter_enqueue_assets() {
    // Enqueue Tailwind CSS from CDN
    wp_enqueue_script( 'tailwind-cdn', 'https://cdn.tailwindcss.com', array(), null, false );

    // Enqueue our custom stylesheet
    wp_enqueue_style( 'my-screener-filter-style', plugin_dir_url( __FILE__ ) . 'style.css', array(), '1.0.0', 'all' );

    // Enqueue our JavaScript file
    // 'jquery' is a dependency for most WordPress setups, ensuring it loads before our script.
    wp_enqueue_script( 'my-screener-filter-script', plugin_dir_url( __FILE__ ) . 'script.js', array( 'jquery' ), '1.0.0', true );

    // --- PHP Section: Prepare Data for JavaScript (without loading ALL dataRows) ---

    // Define paths to your CSV files.
    $screenerDataPath = plugin_dir_path( __FILE__ ) . 'data/screener_data.csv';
    $screenerListDataPath = plugin_dir_path( __FILE__ ) . 'data/screener_list.csv';

    // Load screener list headers from screener_list.csv (typically small)
    $screenerListHeaders = [];
    $screenerListFullData = load_csv_data_for_headers_or_small_files( $screenerListDataPath );
    if ( ! empty( $screenerListFullData ) ) {
        $screenerListHeaders = $screenerListFullData[0]; // Assuming headers are in the first row
    } else {
        error_log("screener_list.csv is empty or not found. Using fallback headers.");
        $screenerListHeaders = ['Product Name', 'Category', 'Price', 'Stock', 'Discount (%)'];
    }

    // Get table headers from screener_data.csv (read only the first row)
    $tableHeaders = [];
    if ( file_exists( $screenerDataPath ) && ( $handle = fopen( $screenerDataPath, 'r' ) ) !== false ) {
        $tableHeaders = fgetcsv( $handle ); // Read only the first row for headers
        fclose( $handle );
    } else {
        error_log("screener_data.csv not found for headers. Using fallback headers.");
        $tableHeaders = ['ID', 'Product Name', 'Category', 'Price', 'Stock', 'Discount (%)'];
    }

    // Pass the PHP data to JavaScript using wp_localize_script
    // IMPORTANT: 'dataRows' is NO LONGER passed directly here to prevent memory exhaustion.
    // Instead, JavaScript will fetch this data via AJAX.
    wp_localize_script( 'my-screener-filter-script', 'myScreenerData', array(
        'ajax_url'            => admin_url( 'admin-ajax.php' ), // WordPress AJAX URL for fetching data
        'tableHeaders'        => $tableHeaders,
        'screenerListHeaders' => $screenerListHeaders,
    ) );
}
add_action( 'wp_enqueue_scripts', 'my_screener_filter_enqueue_assets' );

/**
 * AJAX endpoint to fetch data from screener_data.csv.
 * This function will be called by JavaScript to get the full dataset.
 */
function my_screener_filter_fetch_data_ajax() {
    $screenerDataPath = plugin_dir_path( __FILE__ ) . 'data/screener_data.csv';
    $dataRows = [];

    if ( file_exists( $screenerDataPath ) && ( $handle = fopen( $screenerDataPath, 'r' ) ) !== false ) {
        fgetcsv( $handle ); // Skip the header row as it's already sent as 'tableHeaders'
        while ( ( $row = fgetcsv( $handle ) ) !== false ) {
            $dataRows[] = $row;
        }
        fclose( $handle );
    } else {
        // Provide a fallback or error message if the file is not found
        wp_send_json_error( 'Screener data file not found or could not be opened.' );
        return;
    }

    // Send the data as a JSON successful response
    wp_send_json_success( $dataRows );
}
// Register the AJAX actions for both logged-in and non-logged-in users
add_action( 'wp_ajax_my_screener_filter_fetch_data', 'my_screener_filter_fetch_data_ajax' );
add_action( 'wp_ajax_nopriv_my_screener_filter_fetch_data', 'my_screener_filter_fetch_data_ajax' );


/**
 * Register a shortcode to display the filter application.
 * You can insert [my_screener_filter] into any post or page.
 */
function my_screener_filter_shortcode() {
    // Start output buffering to capture the HTML
    ob_start();
    ?>
    <div class="container mx-auto p-4 md:p-8">
        <h1 class="text-3xl font-bold mb-6 text-center text-gray-800">Dynamic Data Filter</h1>

        <div class="bg-white shadow-lg rounded-lg p-6 mb-8 border border-gray-200">
            <h2 class="text-xl font-semibold mb-4 text-gray-700">Filter Controls</h2>
            <div id="filter-controls" class="space-y-4">
                <!-- Filter rows will be rendered here by JavaScript -->
            </div>
            <button id="add-filter-button" class="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md shadow-md transition duration-300 ease-in-out transform hover:scale-105">
                Add Filter
            </button>
        </div>

        <div class="bg-white shadow-lg rounded-lg p-6 border border-gray-200">
            <h2 class="text-xl font-semibold mb-4 text-gray-700">Filtered Data</h2>
            <div class="overflow-x-auto rounded-lg border border-gray-200">
                <table id="data-table" class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr id="table-headers">
                            <!-- Headers will be populated by JavaScript -->
                        </tr>
                    </thead>
                    <tbody id="table-body" class="bg-white divide-y divide-gray-200">
                        <!-- Data will be populated by JavaScript -->
                        <tr><td colspan="100%" class="text-center py-6 text-gray-500">Loading data...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
    <?php
    // Return the captured HTML output
    return ob_get_clean();
}
add_shortcode( 'my_screener_filter', 'my_screener_filter_shortcode' );

