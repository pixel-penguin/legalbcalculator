(function() {
    'use strict';

    // Default configuration
    const DEFAULT_CONFIG = {
        apiUrl: 'https://your-api-gateway-url.execute-api.region.amazonaws.com/sandbox/calculate',
        theme: 'light',
        currency: 'N$',
        loadingText: 'Calculating...',
        errorText: 'Error calculating costs. Please try again.',
        containerClass: 'legal-calc-widget'
    };

    // Widget Class
    class LegalCalculatorWidget {
        constructor(containerId, config = {}) {
            this.container = document.getElementById(containerId);
            if (!this.container) {
                console.error('LegalCalculatorWidget: Container not found');
                return;
            }
            
            this.config = { ...DEFAULT_CONFIG, ...config };
            this.render();
            this.attachEventListeners();
        }

        render() {
            this.container.innerHTML = `
                <div class="${this.config.containerClass}" data-theme="${this.config.theme}">
                    <div class="calc-header">
                        <h3>Transfer Cost Calculator</h3>
                        <p>Calculate property transfer costs in Namibia</p>
                    </div>
                    
                    <form class="calc-form" id="transferCostForm">
                        <div class="form-group">
                            <label for="amount">Property Value (${this.config.currency})</label>
                            <input type="number" id="amount" name="amount" required min="1" 
                                   placeholder="Enter property value" />
                        </div>
                        
                        <div class="form-group">
                            <label for="sub_type">Property Type</label>
                            <select id="sub_type" name="sub_type" required>
                                <option value="">Select property type</option>
                                <option value="S">Sectional Title</option>
                                <option value="F">Freehold</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="dutytype">Duty Type</label>
                            <select id="dutytype" name="dutytype" required>
                                <option value="">Select duty type</option>
                                <option value="N">Normal/Residential</option>
                                <option value="A">Agricultural</option>
                                <option value="C">Commercial</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="date">Transfer Date</label>
                            <select id="date" name="date" required>
                                <option value="">Select transfer date</option>
                                <option value="before">Before 1 October 2024</option>
                                <option value="after">From 1 October 2024 onwards</option>
                            </select>
                        </div>
                        
                        <button type="submit" class="calc-button">Calculate Transfer Costs</button>
                    </form>
                    
                    <div class="calc-results" id="results" style="display: none;">
                        <h4>Transfer Cost Breakdown</h4>
                        <div class="results-table">
                            <div class="result-row">
                                <span class="label">Transfer Fees:</span>
                                <span class="value" id="transferFees"></span>
                            </div>
                            <div class="result-row">
                                <span class="label">VAT on Fees:</span>
                                <span class="value" id="vatOnFees"></span>
                            </div>
                            <div class="result-row">
                                <span class="label">Transfer Duty:</span>
                                <span class="value" id="transferDuty"></span>
                            </div>
                            <div class="result-row">
                                <span class="label">Stamp Duty:</span>
                                <span class="value" id="stampDuty"></span>
                            </div>
                            <div class="result-row">
                                <span class="label">Deeds Office Fee:</span>
                                <span class="value" id="deedsOfficeFee"></span>
                            </div>
                            <div class="result-row">
                                <span class="label">Sundries/Postages/VAT:</span>
                                <span class="value" id="sundriesPostagesVAT"></span>
                            </div>
                            <div class="result-row total">
                                <span class="label">Total Cost:</span>
                                <span class="value" id="total"></span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="calc-loading" id="loading" style="display: none;">
                        <div class="spinner"></div>
                        <span>${this.config.loadingText}</span>
                    </div>
                    
                    <div class="calc-error" id="error" style="display: none;">
                        <span id="errorMessage">${this.config.errorText}</span>
                    </div>
                </div>
            `;
            
            // Inject CSS if not already present
            if (!document.querySelector('#legal-calc-widget-styles')) {
                this.injectStyles();
            }
        }

        injectStyles() {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'legal-calc-widget-styles';
            styleSheet.textContent = `
                .legal-calc-widget {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    max-width: 500px;
                    margin: 0 auto;
                    padding: 20px;
                    border: 1px solid #e1e5e9;
                    border-radius: 8px;
                    background: #ffffff;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }

                .legal-calc-widget[data-theme="dark"] {
                    background: #2d3748;
                    border-color: #4a5568;
                    color: #f7fafc;
                }

                .calc-header {
                    text-align: center;
                    margin-bottom: 25px;
                }

                .calc-header h3 {
                    margin: 0 0 8px 0;
                    color: #2d3748;
                    font-size: 24px;
                    font-weight: 600;
                }

                .legal-calc-widget[data-theme="dark"] .calc-header h3 {
                    color: #f7fafc;
                }

                .calc-header p {
                    margin: 0;
                    color: #718096;
                    font-size: 14px;
                }

                .legal-calc-widget[data-theme="dark"] .calc-header p {
                    color: #a0aec0;
                }

                .form-group {
                    margin-bottom: 16px;
                }

                .form-group label {
                    display: block;
                    margin-bottom: 6px;
                    font-weight: 500;
                    color: #4a5568;
                    font-size: 14px;
                }

                .legal-calc-widget[data-theme="dark"] .form-group label {
                    color: #e2e8f0;
                }

                .form-group input,
                .form-group select {
                    width: 100%;
                    padding: 10px 12px;
                    border: 1px solid #d1d5db;
                    border-radius: 6px;
                    font-size: 14px;
                    background: #ffffff;
                    box-sizing: border-box;
                    transition: border-color 0.2s ease;
                }

                .legal-calc-widget[data-theme="dark"] .form-group input,
                .legal-calc-widget[data-theme="dark"] .form-group select {
                    background: #4a5568;
                    border-color: #718096;
                    color: #f7fafc;
                }

                .form-group input:focus,
                .form-group select:focus {
                    outline: none;
                    border-color: #3182ce;
                    box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
                }

                .calc-button {
                    width: 100%;
                    padding: 12px 24px;
                    background: #3182ce;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    font-size: 16px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: background-color 0.2s ease;
                    margin-top: 8px;
                }

                .calc-button:hover {
                    background: #2c5aa0;
                }

                .calc-button:disabled {
                    background: #a0aec0;
                    cursor: not-allowed;
                }

                .calc-results {
                    margin-top: 24px;
                    padding: 16px;
                    background: #f7fafc;
                    border-radius: 6px;
                    border: 1px solid #e2e8f0;
                }

                .legal-calc-widget[data-theme="dark"] .calc-results {
                    background: #1a202c;
                    border-color: #4a5568;
                }

                .calc-results h4 {
                    margin: 0 0 16px 0;
                    color: #2d3748;
                    font-size: 18px;
                    font-weight: 600;
                }

                .legal-calc-widget[data-theme="dark"] .calc-results h4 {
                    color: #f7fafc;
                }

                .result-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 8px 0;
                    border-bottom: 1px solid #e2e8f0;
                }

                .legal-calc-widget[data-theme="dark"] .result-row {
                    border-bottom-color: #4a5568;
                }

                .result-row:last-child {
                    border-bottom: none;
                }

                .result-row.total {
                    font-weight: 600;
                    font-size: 16px;
                    margin-top: 8px;
                    padding-top: 16px;
                    border-top: 2px solid #3182ce;
                    border-bottom: none;
                }

                .result-row .label {
                    color: #4a5568;
                }

                .legal-calc-widget[data-theme="dark"] .result-row .label {
                    color: #a0aec0;
                }

                .result-row .value {
                    font-weight: 500;
                    color: #2d3748;
                }

                .legal-calc-widget[data-theme="dark"] .result-row .value {
                    color: #f7fafc;
                }

                .calc-loading {
                    text-align: center;
                    padding: 24px;
                    color: #718096;
                }

                .legal-calc-widget[data-theme="dark"] .calc-loading {
                    color: #a0aec0;
                }

                .spinner {
                    display: inline-block;
                    width: 20px;
                    height: 20px;
                    border: 2px solid #e2e8f0;
                    border-radius: 50%;
                    border-top-color: #3182ce;
                    animation: spin 1s ease-in-out infinite;
                    margin-right: 8px;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                .calc-error {
                    margin-top: 16px;
                    padding: 12px;
                    background: #fed7d7;
                    border: 1px solid #fc8181;
                    border-radius: 6px;
                    color: #c53030;
                    text-align: center;
                }

                .legal-calc-widget[data-theme="dark"] .calc-error {
                    background: #742a2a;
                    border-color: #c53030;
                    color: #feb2b2;
                }
            `;
            document.head.appendChild(styleSheet);
        }

        attachEventListeners() {
            const form = this.container.querySelector('#transferCostForm');
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.calculateCosts();
            });
        }

        async calculateCosts() {
            const form = this.container.querySelector('#transferCostForm');
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            this.showLoading();
            this.hideResults();
            this.hideError();

            try {
                const response = await fetch(this.config.apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data)
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();
                
                if (result.error) {
                    throw new Error(result.error);
                }

                this.displayResults(result);
            } catch (error) {
                console.error('Error calculating costs:', error);
                this.showError(error.message || this.config.errorText);
            } finally {
                this.hideLoading();
            }
        }

        displayResults(data) {
            const currency = this.config.currency;
            
            this.container.querySelector('#transferFees').textContent = 
                `${currency} ${this.formatNumber(data.transferFees)}`;
            this.container.querySelector('#vatOnFees').textContent = 
                `${currency} ${this.formatNumber(data.vatOnFees)}`;
            this.container.querySelector('#transferDuty').textContent = 
                `${currency} ${this.formatNumber(data.transferDuty)}`;
            this.container.querySelector('#stampDuty').textContent = 
                `${currency} ${this.formatNumber(data.stampDuty)}`;
            this.container.querySelector('#deedsOfficeFee').textContent = 
                `${currency} ${this.formatNumber(data.deedsOfficeFee)}`;
            this.container.querySelector('#sundriesPostagesVAT').textContent = 
                `${currency} ${this.formatNumber(data.sundriesPostagesVAT)}`;
            this.container.querySelector('#total').textContent = 
                `${currency} ${this.formatNumber(data.total)}`;

            this.showResults();
        }

        formatNumber(num) {
            return new Intl.NumberFormat('en-NA', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(num);
        }

        showLoading() {
            this.container.querySelector('#loading').style.display = 'block';
        }

        hideLoading() {
            this.container.querySelector('#loading').style.display = 'none';
        }

        showResults() {
            this.container.querySelector('#results').style.display = 'block';
        }

        hideResults() {
            this.container.querySelector('#results').style.display = 'none';
        }

        showError(message) {
            const errorElement = this.container.querySelector('#error');
            const errorMessageElement = this.container.querySelector('#errorMessage');
            errorMessageElement.textContent = message;
            errorElement.style.display = 'block';
        }

        hideError() {
            this.container.querySelector('#error').style.display = 'none';
        }

        // Public method to update configuration
        updateConfig(newConfig) {
            this.config = { ...this.config, ...newConfig };
            this.render();
            this.attachEventListeners();
        }
    }

    // Make widget available globally
    window.LegalCalculatorWidget = LegalCalculatorWidget;
})(); 