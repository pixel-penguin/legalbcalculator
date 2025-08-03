document.addEventListener('DOMContentLoaded', function () {
    
    var buttonStyling = "cursor:pointer; background:#3182ce; color:#fff; padding:12px 24px; border:none; border-radius:6px; font-size:16px; font-weight:500; width:100%; margin-top:8px;";
    var inputGroupStyling = "margin-bottom:16px;";
    var selectStyling = "width:100%; padding:10px 12px; border:1px solid #d1d5db; border-radius:6px; font-size:14px; background:#ffffff; box-sizing:border-box;";
    var inputStyling = "width:100%; padding:10px 12px; border:1px solid #d1d5db; border-radius:6px; font-size:14px; background:#ffffff; box-sizing:border-box;";
    var labelStyling = "display:block; margin-bottom:6px; font-weight:500; color:#4a5568; font-size:14px;";
    var containerStyling = "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; max-width:500px; margin:0 auto; padding:20px; border:1px solid #e1e5e9; border-radius:8px; background:#ffffff; box-shadow:0 2px 4px rgba(0,0,0,0.1);";

    function getFormTemplateById(id) {
        if (id === 'calculator-widget-transfer-cost-calculator') {
            return `
                <div style="${containerStyling}">
                    <div style="text-align:center; margin-bottom:25px;">
                        <h3 style="margin:0 0 8px 0; color:#2d3748; font-size:24px; font-weight:600;">Transfer Cost Calculator</h3>
                        <p style="margin:0; color:#718096; font-size:14px;">Calculate property transfer costs in Namibia</p>
                    </div>
                    <form onsubmit="calculateCosts(event);" name="calculator" id="calculatorTransferCost" class="calculatorForm">
                        <input name="type" type="hidden" value="calc_transfer_costs">
                        <div style="${inputGroupStyling}">
                            <label style="${labelStyling}">Purchase Price (N$)</label>
                            <input name="amount" id="amount" type="text" placeholder="Purchase Price (N$)" class="placeholder" style="${inputStyling}">
                        </div>
                        <div style="${inputGroupStyling}">
                            <label style="${labelStyling}">Duty Type</label>
                            <select name="dutytype" style="${selectStyling}">
                                <option value="N">Natural Person</option>
                                <option value="A">Affirmative Action</option>
                                <option value="C">Other</option>
                            </select>
                        </div>
                        <div style="${inputGroupStyling}">
                            <label style="${labelStyling}">Property Type</label>
                            <select name="sub_type" style="${selectStyling}">
                                <option value="S">Sectional Title</option>
                                <option value="F">Free Standing Erven</option>
                            </select>
                        </div>
                        <div style="${inputGroupStyling}">
                            <label style="${labelStyling}">Transfer Date</label>
                            <select name="date" style="${selectStyling}">
                                <option value="after" selected>As of 1 OCT 2024</option>
                                <option value="before">Prior to 1 OCT 2024</option>
                            </select>
                        </div>
                        <div>
                            <button type="submit" id="form-submit" class="btn btn-primary" style="${buttonStyling}">Calculate</button>
                        </div>
                    </form>
                    <div id="resultsTransferCost" class="calculatorResults" style="margin-top:24px;"></div>
                </div>`;
        }
        return '';
    }

    // Initialize the widget
    const widgetContainer = document.getElementById('calculator-widget-transfer-cost-calculator');
    if (widgetContainer) {
        widgetContainer.innerHTML = getFormTemplateById('calculator-widget-transfer-cost-calculator');
    }

    var initialAmount = 0;

    window.calculateCosts = function (event) {
        event.preventDefault();

        const submitButton = event.target.querySelector('button[type="submit"]');
        toggleLoading(submitButton, true);

        const form = event.target;
        const type = form.querySelector('input[name="type"]').value;

        initialAmount = parseFloat(form.querySelector('input[name="amount"]').value);

        const amountTransfer = form.querySelector('input[name="amount"]').value;
        const dutyType = form.querySelector('select[name="dutytype"]').value;
        const subTypeTransfer = form.querySelector('select[name="sub_type"]').value;
        const dateValue = form.querySelector('select[name="date"]').value;

        const jsonData = {
            type: type,
            amount: amountTransfer,
            dutytype: dutyType,
            sub_type: subTypeTransfer,
            date: dateValue
        };

        // Use the production API endpoint
        fetch('https://2vllnjjl8h.execute-api.us-east-1.amazonaws.com/prod/calculator', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(jsonData)
        })
        .then(response => response.json())
        .then(data => displayResults(data, type))
        .catch(error => {
            console.error('Error:', error);
            const resultsDiv = document.getElementById('resultsTransferCost');
            resultsDiv.innerHTML = '<p style="color:#e53e3e; padding:12px; background:#fed7d7; border:1px solid #fc8181; border-radius:6px; text-align:center;">Error calculating costs. Please try again.</p>';
            toggleLoading(submitButton, false);
        });
    }

    function displayResults(data, type) {
        const resultsDiv = document.getElementById('resultsTransferCost');
        const correspondingForm = resultsDiv.previousElementSibling;
        const submitButton = correspondingForm.querySelector('button[type="submit"]');
        toggleLoading(submitButton, false);

        let resultsHtml = '<div style="padding:16px; background:#f7fafc; border-radius:6px; border:1px solid #e2e8f0;">';
        resultsHtml += '<h4 style="margin:0 0 16px 0; color:#2d3748; font-size:18px; font-weight:600;">Transfer Cost Breakdown</h4>';
        
        resultsHtml += '<div style="margin-bottom:15px;">';
        if (data.transferFees) resultsHtml += `<div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #e2e8f0;"><span style="color:#4a5568;">Transfer Fees:</span><span style="font-weight:500; color:#2d3748;">N$ ${formatNumber(data.transferFees)}</span></div>`;
        if (data.vatOnFees) resultsHtml += `<div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #e2e8f0;"><span style="color:#4a5568;">15% VAT on Fees:</span><span style="font-weight:500; color:#2d3748;">N$ ${formatNumber(data.vatOnFees)}</span></div>`;
        if (data.transferDuty !== undefined) resultsHtml += `<div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #e2e8f0;"><span style="color:#4a5568;">Transfer Duty:</span><span style="font-weight:500; color:#2d3748;">N$ ${formatNumber(data.transferDuty)}</span></div>`;
        if (data.stampDuty !== undefined) resultsHtml += `<div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #e2e8f0;"><span style="color:#4a5568;">Stamp Duty:</span><span style="font-weight:500; color:#2d3748;">N$ ${formatNumber(data.stampDuty)}</span></div>`;
        if (data.deedsOfficeFee) resultsHtml += `<div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #e2e8f0;"><span style="color:#4a5568;">Deeds Office Fee:</span><span style="font-weight:500; color:#2d3748;">N$ ${formatNumber(data.deedsOfficeFee)}</span></div>`;
        if (data.sundriesPostagesVAT) resultsHtml += `<div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #e2e8f0;"><span style="color:#4a5568;">Sundries & Postages + 15% VAT:</span><span style="font-weight:500; color:#2d3748;">N$ ${formatNumber(data.sundriesPostagesVAT)}</span></div>`;
        if (data.total) resultsHtml += `<div style="display:flex; justify-content:space-between; padding:16px 0 8px 0; margin-top:8px; border-top:2px solid #3182ce; font-weight:600; font-size:16px;"><span style="color:#2d3748;">Total:</span><span style="color:#2d3748;">N$ ${formatNumber(data.total)}</span></div>`;
        resultsHtml += '</div>';
        
        // Add PDF download button
        resultsHtml += '<button onclick="generatePdf(' + JSON.stringify(data).replace(/"/g, '&quot;') + ', \'calc_transfer_costs\')" style="' + buttonStyling + ' background:#38a169; margin-top:16px;">Download as PDF</button>';
        
        resultsHtml += '</div>';

        resultsDiv.innerHTML = resultsHtml;
    }

    function formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    }

    function toggleLoading(button, isLoading) {
        if (isLoading) {
            button.innerText = 'Calculating...';
            button.disabled = true;
            button.style.background = '#a0aec0';
        } else {
            button.innerText = 'Calculate';
            button.disabled = false;
            button.style.background = '#3182ce';
        }
    }

    // PDF Generation function
    window.generatePdf = function(data, type) {
        if (typeof window.jspdf === 'undefined') {
            alert('PDF generation library not loaded. Please include jsPDF library.');
            return;
        }

        const doc = new window.jspdf.jsPDF();
        
        // Add title without logo
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Transfer Cost Calculator', 10, 30);
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Transfer Cost Calculation Results', 10, 50);

        // Get form values
        const form = document.getElementById('calculatorTransferCost');
        const dutyTypeSelect = form.querySelector('select[name="dutytype"]');
        const subTypeSelect = form.querySelector('select[name="sub_type"]');
        const dutyType = dutyTypeSelect.options[dutyTypeSelect.selectedIndex].text;
        const subType = subTypeSelect.options[subTypeSelect.selectedIndex].text;

        doc.setFontSize(12);
        doc.text('Duty Type: ' + dutyType, 10, 65);
        doc.text('Sub Type: ' + subType, 10, 80);

        // Add results table
        addTableToPdf(doc, createResultsTable(data), 100);

        // Add disclaimer without company contact info
        const disclaimerText = `Disclaimer\nAll estimated calculations are provided for general information purposes only and do not constitute professional or financial advice. We make no claims, promises or guarantees regarding the accuracy, completeness or adequacy of the information contained in this calculator. Laws are constantly changing and legal advice must be tailored to the specific circumstances of each case. Fees and charges are per individual transfer, bond registration or bond cancellation. If a transaction involves more than one property or bond cancellation, fees and charges must be adapted accordingly.`;
        doc.setFontSize(10);
        doc.text(disclaimerText, 10, doc.internal.pageSize.getHeight() - 40, { maxWidth: 180 });

        doc.save('transfer-cost-calculation.pdf');
    }

    function addTableToPdf(doc, resultsTable, startY) {
        let startX = 10;
        let rowHeight = 16;

        Array.from(resultsTable.rows).forEach((row, rowIndex) => {
            Array.from(row.cells).forEach((cell, cellIndex) => {
                let cellWidth = 95;
                let positionX = startX + (cellWidth * cellIndex);

                doc.setFontSize(14);
                if (cellIndex === 0) {
                    doc.setFont('helvetica', 'bold');
                } else {
                    doc.setFont('helvetica', 'normal');
                }

                doc.text(cell.textContent.trim(), positionX, startY + (rowIndex * rowHeight));
            });
        });
    }

    function createResultsTable(data) {
        const table = document.createElement('table');
        
        const addRow = (desc, amount) => {
            const row = table.insertRow(-1);
            let cell = row.insertCell(-1);
            cell.innerHTML = desc;
            cell = row.insertCell(-1);
            cell.innerHTML = amount;
        };

        addRow('Initial Amount', formatNumber(initialAmount));
        if (data.transferFees) addRow('Transfer Fees', formatNumber(data.transferFees));
        if (data.vatOnFees) addRow('15% VAT on Fees', formatNumber(data.vatOnFees));
        if (data.transferDuty) addRow('Transfer Duty', formatNumber(data.transferDuty));
        if (data.stampDuty) addRow('Stamp Duty', formatNumber(data.stampDuty));
        if (data.deedsOfficeFee) addRow('Deeds Office Fee', formatNumber(data.deedsOfficeFee));
        if (data.sundriesPostagesVAT) addRow('Sundries & Postages + 15% VAT', formatNumber(data.sundriesPostagesVAT));
        if (data.total) addRow('Total', formatNumber(data.total));

        return table;
    }
}); 