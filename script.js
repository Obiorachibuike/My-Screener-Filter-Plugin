// script.js
// Ensure the DOM is fully loaded before executing the script.
document.addEventListener('DOMContentLoaded', () => {
    // --- IMPORTANT: Access data passed from PHP via myScreenerData object ---
    // myScreenerData is created by wp_localize_script in the PHP file.
    // Check if the object exists and contains the expected properties.
    if (typeof myScreenerData === 'undefined' || !myScreenerData.tableHeaders || !myScreenerData.dataRows || !myScreenerData.screenerListHeaders) {
        showMessageBox(
            "Error: Plugin data not properly loaded from PHP. Please ensure the plugin is active and your Local by Flywheel site is running correctly.",
            'error'
        );
        // Set empty arrays to prevent further JavaScript errors
        // Note: These const declarations will shadow the outer scope variables if not carefully handled.
        // For a critical error like this, exiting early is often best.
        // For now, these are effectively unused if the return statement is hit.
        const headers = [];
        const allData = [];
        const screenerListHeaders = [];
        return; // Stop script execution
    }

    // Retrieve data and headers passed from PHP
    const tableHeaders = myScreenerData.tableHeaders;
    const allData = myScreenerData.dataRows;
    const screenerListHeaders = myScreenerData.screenerListHeaders;

    // DOM Elements
    const filterControls = document.getElementById('filter-controls');
    const addFilterButton = document.getElementById('add-filter-button');
    const tableHeadersElement = document.getElementById('table-headers');
    const tableBody = document.getElementById('table-body');

    let filterIdCounter = 0; // To assign unique IDs to filter rows

    /**
     * Shows a temporary message box for user feedback (instead of alert).
     * @param {string} message The message to display.
     * @param {string} type The type of message (e.g., 'success', 'error', 'info').
     */
    function showMessageBox(message, type = 'info') {
        const messageBox = document.createElement('div');
        messageBox.classList.add('message-box', 'fixed', 'top-4', 'right-4', 'p-4', 'rounded-lg', 'shadow-lg', 'text-white', 'font-semibold', 'z-50', 'transition-opacity', 'duration-300');
        
        if (type === 'error') {
            messageBox.classList.add('bg-red-600');
        } else if (type === 'success') {
            messageBox.classList.add('bg-green-600');
        } else {
            messageBox.classList.add('bg-blue-600');
        }
        messageBox.textContent = message;
        document.body.appendChild(messageBox);

        // Fade out and remove after 3 seconds
        setTimeout(() => {
            messageBox.style.opacity = '0';
            setTimeout(() => {
                messageBox.remove();
            }, 300); // Wait for fade-out transition
        }, 3000);
    }


    /**
     * Populates the main data table header row.
     */
    function populateTableHeaders() {
        tableHeadersElement.innerHTML = ''; // Clear existing headers
        tableHeaders.forEach(headerText => {
            const th = document.createElement('th');
            th.textContent = headerText;
            th.classList.add('px-6', 'py-3', 'bg-gray-100', 'text-left', 'text-xs', 'font-medium', 'text-gray-600', 'uppercase', 'tracking-wider');
            tableHeadersElement.appendChild(th);
        });
    }

    /**
     * Renders the given data array into the HTML table body.
     * @param {Array<Array<any>>} dataToDisplay The filtered data rows to display.
     */
    function renderTable(dataToDisplay) {
        tableBody.innerHTML = ''; // Clear existing rows

        if (dataToDisplay.length === 0) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = tableHeaders.length; // Use tableHeaders for colspan
            cell.className = 'text-center text-gray-500 py-4';
            cell.textContent = 'No data matches your filters.';
            row.appendChild(cell);
            tableBody.appendChild(row);
            return;
        }

        dataToDisplay.forEach(rowData => {
            const row = document.createElement('tr');
            row.classList.add('hover:bg-gray-50', 'transition', 'duration-150', 'ease-in-out'); // Add hover effect
            rowData.forEach(cellValue => {
                const cell = document.createElement('td');
                cell.textContent = cellValue;
                cell.classList.add('px-6', 'py-3', 'border-b', 'border-gray-200', 'text-sm', 'text-gray-900', 'whitespace-nowrap');
                row.appendChild(cell);
            });
            tableBody.appendChild(row);
        });
    }

    /**
     * Determines the data type of a column based on its values from ALL_DATA_ROWS.
     * This is a heuristic and might need refinement for complex data.
     * @param {string} columnName The name of the column.
     * @returns {string} 'number', 'percentage', 'string', or 'unknown'.
     */
    function getColumnDataType(columnName) {
        const columnIndex = tableHeaders.indexOf(columnName); // Use tableHeaders for index
        if (columnIndex === -1) return 'unknown';

        let hasNonNumeric = false;
        let hasPercentageSymbol = false;
        let hasOnlyNumbersOrEmpty = true;

        for (const row of allData) {
            const value = row[columnIndex];
            // Skip empty cells for type detection, but note their presence
            if (value === null || value === undefined || String(value).trim() === '') {
                continue;
            }

            const stringValue = String(value).trim();

            // Check for percentage symbol
            if (stringValue.endsWith('%')) {
                hasPercentageSymbol = true;
                // Check if the part before '%' is a number
                if (isNaN(parseFloat(stringValue.slice(0, -1)))) {
                    hasNonNumeric = true; // Not a valid percentage if no number before %
                }
            } else {
                // Check for number if no percentage symbol
                if (isNaN(parseFloat(stringValue))) {
                    hasNonNumeric = true;
                }
            }

            if (hasNonNumeric) {
                hasOnlyNumbersOrEmpty = false; // Found a non-numeric string (excluding valid percentages)
            }
        }

        // Determine final type
        if (hasOnlyNumbersOrEmpty && hasPercentageSymbol) {
            return 'percentage';
        } else if (hasOnlyNumbersOrEmpty && !hasPercentageSymbol) {
            return 'number';
        } else if (hasNonNumeric) {
            return 'string';
        }
        return 'string'; // Default to string if ambiguity or no data
    }

    /**
     * Populates operator dropdown based on selected column's data type.
     * @param {HTMLSelectElement} operatorSelect The operator select element.
     * @param {string} dataType The detected data type ('number', 'string', 'percentage').
     */
    function populateOperators(operatorSelect, dataType) {
        operatorSelect.innerHTML = '<option value="">Select Operator</option>';
        let operators = [];

        switch (dataType) {
            case 'number':
            case 'percentage':
                operators = [
                    { value: 'equals', text: '=' },
                    { value: 'not_equals', text: '!=' },
                    { value: 'greater_than', text: '>' },
                    { value: 'less_than', text: '<' },
                    { value: 'greater_than_or_equal', text: '>=' },
                    { value: 'less_than_or_equal', text: '<=' },
                    { value: 'is_empty', text: 'Is Empty' },
                    { value: 'is_not_empty', text: 'Is Not Empty' }
                ];
                break;
            case 'string':
                operators = [
                    { value: 'equals', text: 'Equals' },
                    { value: 'not_equals', text: 'Not Equals' },
                    { value: 'contains', text: 'Contains' },
                    { value: 'not_contains', text: 'Does Not Contain' },
                    { value: 'starts_with', text: 'Starts With' },
                    { value: 'ends_with', text: 'Ends With' },
                    { value: 'is_empty', text: 'Is Empty' },
                    { value: 'is_not_empty', text: 'Is Not Empty' }
                ];
                break;
            default: // unknown or other types, default to common string operators
                operators = [
                    { value: 'equals', text: 'Equals' },
                    { value: 'contains', text: 'Contains' },
                    { value: 'is_empty', text: 'Is Empty' },
                    { value: 'is_not_empty', text: 'Is Not Empty' }
                ];
        }

        operators.forEach(op => {
            const option = document.createElement('option');
            option.value = op.value;
            option.textContent = op.text;
            operatorSelect.appendChild(option);
        });
    }

    /**
     * Creates and adds a new filter row to the filter controls area.
     */
    function addFilterRow() {
        filterIdCounter++;
        const filterRowId = `filter-row-${filterIdCounter}`;

        const filterRowDiv = document.createElement('div');
        filterRowDiv.id = filterRowId;
        filterRowDiv.classList.add('filter-row', 'flex', 'flex-col', 'sm:flex-row', 'space-y-2', 'sm:space-y-0', 'sm:space-x-2', 'items-center', 'p-3', 'border', 'border-gray-200', 'rounded-lg', 'shadow-sm', 'bg-gray-50');

        // Column Select - Populated from screenerListHeaders
        const columnSelect = document.createElement('select');
        columnSelect.classList.add('filter-column', 'px-4', 'py-2', 'border', 'border-gray-300', 'rounded-md', 'shadow-sm', 'focus:outline-none', 'focus:ring-2', 'focus:ring-blue-500', 'flex-grow', 'sm:flex-grow-0', 'sm:w-1/4', 'md:w-auto');
        columnSelect.innerHTML = '<option value="">Select Column</option>';
        screenerListHeaders.forEach(header => {
            const option = document.createElement('option');
            option.value = header;
            option.textContent = header;
            columnSelect.appendChild(option);
        });
        filterRowDiv.appendChild(columnSelect);

        // Operator Select
        const operatorSelect = document.createElement('select');
        operatorSelect.classList.add('filter-operator', 'px-4', 'py-2', 'border', 'border-gray-300', 'rounded-md', 'shadow-sm', 'focus:outline-none', 'focus:ring-2', 'focus:ring-blue-500', 'flex-grow', 'sm:flex-grow-0', 'sm:w-1/4', 'md:w-auto');
        operatorSelect.innerHTML = '<option value="">Select Operator</option>'; // Initial empty
        filterRowDiv.appendChild(operatorSelect);

        // Value Input
        const valueInput = document.createElement('input');
        valueInput.type = 'text'; // Default to text, will change based on type
        valueInput.classList.add('filter-value', 'flex-grow', 'px-4', 'py-2', 'border', 'border-gray-300', 'rounded-md', 'shadow-sm', 'focus:outline-none', 'focus:ring-2', 'focus:ring-blue-500');
        valueInput.placeholder = 'Enter value';
        filterRowDiv.appendChild(valueInput);

        // Remove Button
        const removeButton = document.createElement('button');
        removeButton.classList.add('remove-filter-button', 'bg-red-500', 'hover:bg-red-600', 'text-white', 'font-semibold', 'py-2', 'px-4', 'rounded-md', 'shadow', 'transition', 'duration-300', 'ease-in-out', 'flex-shrink-0');
        removeButton.textContent = 'Remove';
        removeButton.dataset.filterId = filterRowId; // Store ID for removal
        filterRowDiv.appendChild(removeButton);

        filterControls.appendChild(filterRowDiv);

        // Add event listeners for the new row
        columnSelect.addEventListener('change', () => {
            const selectedColumn = columnSelect.value;
            const dataType = getColumnDataType(selectedColumn);
            populateOperators(operatorSelect, dataType);

            // Adjust input type based on data type
            if (dataType === 'number' || dataType === 'percentage') {
                valueInput.type = 'number';
            } else {
                valueInput.type = 'text';
            }
            applyFilters(); // Re-apply filters on column change
        });
        operatorSelect.addEventListener('change', applyFilters);
        valueInput.addEventListener('input', applyFilters); // Use 'input' for real-time filtering
        removeButton.addEventListener('click', () => {
            filterRowDiv.remove();
            applyFilters(); // Re-apply filters after removal
        });

        applyFilters(); // Re-apply filters after adding a new row
    }

    /**
     * Applies all active filters to the data and re-renders the table.
     */
    function applyFilters() {
        let filteredData = [...allData]; // Start with a copy of all data

        const filterRows = document.querySelectorAll('.filter-row');

        filterRows.forEach(row => {
            const columnSelect = row.querySelector('.filter-column');
            const operatorSelect = row.querySelector('.filter-operator');
            const valueInput = row.querySelector('.filter-value');

            const selectedColumn = columnSelect.value;
            const selectedOperator = operatorSelect.value;
            let filterValue = valueInput.value.trim();

            if (!selectedColumn || !selectedOperator) {
                // If column or operator is not selected, this filter row is incomplete, skip it.
                return;
            }

            const columnIndex = tableHeaders.indexOf(selectedColumn); // Use tableHeaders for index
            if (columnIndex === -1) {
                console.warn(`Column '${selectedColumn}' not found in main data headers.`);
                return; // Column not found in main data, skip this filter
            }

            const columnDataType = getColumnDataType(selectedColumn);

            // Pre-process filterValue based on data type for consistent comparison
            let comparableFilterValue;
            if (columnDataType === 'number' || columnDataType === 'percentage') {
                comparableFilterValue = parseFloat(filterValue);
                if (columnDataType === 'percentage') {
                    // Convert filter percentage string "10%" to number 0.10 for comparison
                    if (filterValue.endsWith('%')) {
                         comparableFilterValue = parseFloat(filterValue.slice(0, -1)) / 100;
                    } else {
                        // If it's a number but not ending in %, assume it's already a decimal (e.g. 0.1)
                        comparableFilterValue = parseFloat(filterValue);
                    }
                }
                
                // Check if the parsed number is valid for numerical comparisons, unless it's an empty/not empty check
                if (isNaN(comparableFilterValue) && !['is_empty', 'is_not_empty'].includes(selectedOperator)) {
                    return; // If operator requires a number but input is not valid, skip this filter row.
                }
            } else {
                comparableFilterValue = filterValue.toLowerCase(); // For string comparisons
            }

            filteredData = filteredData.filter(dataRow => {
                const cellValue = dataRow[columnIndex];

                // Handle empty/not empty checks first
                if (selectedOperator === 'is_empty') {
                    return (cellValue === null || cellValue === undefined || String(cellValue).trim() === '');
                }
                if (selectedOperator === 'is_not_empty') {
                    return !(cellValue === null || cellValue === undefined || String(cellValue).trim() === '');
                }

                // If filter value is empty and operator is not is_empty/is_not_empty, keep the row.
                // This allows other filters to apply, or if no other filters, shows all data.
                if (filterValue === '') {
                    return true;
                }

                // Prepare cell value for comparison based on data type
                let comparableCellValue;
                if (cellValue === null || typeof cellValue === 'undefined') {
                    // If cell value is null/undefined, it won't match non-empty filters
                    return false;
                }

                if (columnDataType === 'number' || columnDataType === 'percentage') {
                    comparableCellValue = parseFloat(cellValue);
                    if (columnDataType === 'percentage' && typeof cellValue === 'string' && cellValue.endsWith('%')) {
                        comparableCellValue = parseFloat(cellValue.slice(0, -1)) / 100;
                    }
                    if (isNaN(comparableCellValue)) {
                        return false; // Cannot compare if cell value is not a valid number
                    }
                } else {
                    comparableCellValue = String(cellValue).toLowerCase();
                }

                // Apply specific operator logic
                switch (selectedOperator) {
                    case 'equals':
                        return comparableCellValue === comparableFilterValue;
                    case 'not_equals':
                        return comparableCellValue !== comparableFilterValue;
                    case 'contains':
                        return comparableCellValue.includes(comparableFilterValue);
                    case 'not_contains':
                        return !comparableCellValue.includes(comparableFilterValue);
                    case 'starts_with':
                        return comparableCellValue.startsWith(comparableFilterValue);
                    case 'ends_with':
                        return comparableCellValue.endsWith(comparableFilterValue);
                    case 'greater_than':
                        return comparableCellValue > comparableFilterValue;
                    case 'less_than':
                        return comparableCellValue < comparableFilterValue;
                    case 'greater_than_or_equal':
                        return comparableCellValue >= comparableFilterValue;
                    case 'less_than_or_equal':
                        return comparableCellValue <= comparableFilterValue;
                    default:
                        return true; // If no valid operator, assume true (don't filter)
                }
            });
        });

        renderTable(filteredData); // Display the filtered data
    }

    // Event Listener for "Add Filter" button
    addFilterButton.addEventListener('click', addFilterRow);

    // Initial setup: Populate headers and render all data
    populateTableHeaders();
    addFilterRow(); // Add an initial filter row for convenience

    // Add some basic styling for the main container and content areas using Tailwind.
    // These are general styles that apply to existing elements and don't need to be in the CSS file.
    document.querySelector('.container').classList.add('max-w-6xl', 'mx-auto', 'p-4', 'sm:p-6', 'lg:p-8', 'font-sans');
    document.querySelector('.btn-primary').classList.add('inline-flex', 'items-center', 'px-6', 'py-3', 'border', 'border-transparent', 'text-base', 'font-medium', 'rounded-md', 'shadow-sm', 'text-white', 'bg-blue-600', 'hover:bg-blue-700', 'focus:outline-none', 'focus:ring-2', 'focus:ring-offset-2', 'focus:ring-blue-500', 'transition', 'duration-300', 'ease-in-out');
    document.getElementById('data-table').classList.add('min-w-full', 'divide-y', 'divide-gray-200', 'rounded-lg', 'overflow-hidden', 'shadow-md');
    // Note: Table headers are styled dynamically in populateTableHeaders
    // Note: Table rows/cells are styled dynamically in renderTable
});
