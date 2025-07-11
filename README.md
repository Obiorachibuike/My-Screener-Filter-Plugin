# My Screener Filter Plugin

**Description:** A custom WordPress plugin designed for dynamic client-side data filtering. It leverages CSV files for data storage and uses AJAX to fetch data efficiently, preventing memory exhaustion issues often encountered with large datasets.

**Version:** 1.0  
**Author:** Your Name

---

## 📚 Table of Contents
- 🚀 [Overview](#overview)
- ✨ [Features](#features)
- 📦 [Installation](#installation)
- ⚙️ [Usage](#usage)
- 📁 [File Structure](#file-structure)
- 🐛 [Troubleshooting](#troubleshooting)
- 📝 [Customization](#customization)
- 🤝 [Contributing](#contributing)
- 📄 [License](#license)

---

## 🚀 Overview
The My Screener Filter plugin provides a flexible way to display and filter tabular data directly within your WordPress posts or pages. Instead of loading an entire large CSV file into PHP memory on every page load, this plugin uses AJAX to fetch the data from `screener_data.csv` asynchronously, ensuring efficient memory usage and faster page loads, especially for large datasets.

It offers a user-friendly interface with dynamic filter controls, allowing users to apply multiple criteria to narrow down the displayed information in real-time.

## ✨ Features
- **Dynamic Client-Side Filtering:** Filter data instantly in the browser without page reloads.
- **AJAX Data Loading:** Efficiently loads large datasets from CSV files via asynchronous requests, avoiding PHP memory limits.
- **Configurable Filters:** Define filterable columns and operators (contains, equals, greater than, less than).
- **Multiple Filter Support:** Add and remove multiple filter criteria to refine results.
- **CSV-Driven Data:** Easy to update data by modifying `screener_data.csv` and filter headers from `screener_list.csv`.
- **Responsive Design:** Utilizes Tailwind CSS for a clean and adaptive user interface.
- **WordPress Shortcode Integration:** Easily embed the filterable table anywhere on your site using `[my_screener_filter]`.

## 📦 Installation
### Upload the Plugin:
1. Download the plugin as a ZIP file.
2. In your WordPress admin, go to **Plugins > Add New > Upload Plugin**.
3. Choose the plugin ZIP file and click **Install Now**.

### Activate the Plugin:
1. After installation, click **Activate Plugin**.

### Prepare CSV Data:
1. Navigate to the plugin directory on your server: `wp-content/plugins/my-screener-filter/`.
2. Inside this directory, create a folder named `data` if it doesn't already exist.

### Place your CSV files:
- **screener_data.csv:** This file should contain the main data you want to display and filter. The first row should be your table headers.
- **screener_list.csv:** This file should contain a single row of headers that you want to be available in the filter dropdowns. This allows you to control which columns are filterable.

**Example `screener_data.csv`:**
```
ID,Product Name,Category,Price,Stock,Discount (%)
1,Laptop Pro,Electronics,1200.00,50,10
2,Mechanical Keyboard,Accessories,150.50,200,5
3,Wireless Mouse,Accessories,35.75,300,0
4,4K Monitor,Electronics,450.00,80,15
```

**Example `screener_list.csv` (for filter options):**
```
Product Name,Category,Price,Stock,Discount (%)
```

### Increase PHP Memory Limit (Recommended):
While the plugin uses AJAX to optimize memory, it's good practice to ensure your WordPress installation has sufficient memory.

1. Open your `wp-config.php` file (located in the root of your WordPress installation).
2. Add or modify the following line above `/* That's all, stop editing! Happy publishing. */`:
   ```php
   define( 'WP_MEMORY_LIMIT', '512M' );
   ```
3. Save the file and restart your web server (e.g., Apache, Nginx, or your local development server like Local by Kinsta) for changes to take effect.

## ⚙️ Usage
To display the dynamic data filter, simply insert the following shortcode into any WordPress post, page, or widget:

```
[my_screener_filter]
```

The plugin will automatically render the filter controls and the data table based on your CSV files.

## 📁 File Structure
```
my-screener-filter/
├── my-screener-filter.php    // Main plugin file (PHP logic, shortcode, AJAX handler)
├── style.css                 // Custom CSS for plugin styling
├── script.js                 // JavaScript for client-side filtering and AJAX calls
└── data/                     // Directory for CSV data files
    ├── screener_data.csv     // Main dataset for the table
    └── screener_list.csv     // Headers to be used in filter dropdowns
```

## 🐛 Troubleshooting
### "Allowed memory size exhausted" error:
This error most likely occurred before the AJAX implementation. If it persists, ensure you have correctly implemented the latest `my-screener-filter.php` and `script.js` files, as they are designed to fetch data via AJAX, which significantly reduces PHP memory usage on page load.

- **Verify PHP Memory Limit:** Double-check the `WP_MEMORY_LIMIT` setting in `wp-config.php` (as described in Installation).
- **Large `screener_list.csv`:** If `screener_list.csv` is unexpectedly large, it could still cause issues. This file should ideally only contain a single row of headers.

### Table not loading / "Loading data..." message persists:
- **Check Console Errors:** Open your browser's developer console (F12 or Ctrl+Shift+I) and look for JavaScript errors in the "Console" tab and network request issues in the "Network" tab.
- **Verify AJAX Request:** In the "Network" tab, check for a POST request to `admin-ajax.php` when the page loads. Ensure it returns a successful response (HTTP 200) with your data.
- **CSV File Paths:** Confirm that `screener_data.csv` and `screener_list.csv` are correctly placed in the `data` folder within the plugin directory. Check for typos in filenames.
- **Plugin Activation:** Ensure the "My Screener Filter" plugin is activated in your WordPress admin.

### Filters not working:
- **Check JavaScript Console:** Look for errors in the browser's console.
- **CSV Data Format:** Ensure your CSV data is consistent and that numeric columns contain valid numbers if you're using "Greater Than" or "Less Than" filters.

## 📝 Customization
- **Styling:** Modify `style.css` to change the appearance of the filter controls and table. Tailwind CSS classes are extensively used for styling directly in the PHP shortcode output, offering flexibility.
- **Filter Operators:** To add more filter operators (e.g., "does not contain", "starts with"), you would need to:
  - Add new `<option>` tags to the `filter-operator-select` dropdown in the `addFilterRow` function within `script.js`.
  - Add corresponding logic to the switch statement in the `applyFilters` function in `script.js` to handle the new operators.
- **CSV Data Handling:** For extremely large CSV files (hundreds of thousands/millions of rows), consider implementing server-side pagination or a more robust database solution instead of loading all data into client-side memory. This plugin provides a good foundation for moderately large files.

## 🤝 Contributing
Feel free to fork this repository, open issues, or submit pull requests. Your contributions are welcome!

## 📄 License
This plugin is open-source software licensed under the GPLv2 or later.
