exports.handler = async (event) => {
    try {
        // Handle OPTIONS request for CORS
        if (event.httpMethod === 'OPTIONS') {
            return {
                statusCode: 200,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
                    "Access-Control-Allow-Methods": "GET,POST,OPTIONS"
                },
                body: ''
            };
        }

        const inputData = JSON.parse(event.body);
        
        // Validate required fields
        if (!inputData.amount || !inputData.sub_type || !inputData.dutytype || !inputData.date) {
            return {
                statusCode: 400,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Credentials": true
                },
                body: JSON.stringify({ error: 'Missing required fields: amount, sub_type, dutytype, date' })
            };
        }

        var amount = inputData.amount.toString().replace(/\s+/g, '');
        amount = parseFloat(amount);

        if (isNaN(amount) || amount <= 0) {
            return {
                statusCode: 400,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Credentials": true
                },
                body: JSON.stringify({ error: 'Invalid amount provided' })
            };
        }

        var response;
        
        if (inputData.date === 'before') {
            response = calculateTransferCostsOlder(amount, inputData.sub_type, inputData.dutytype);
        } else {
            response = calculateTransferCostsNewer(amount, inputData.sub_type, inputData.dutytype);
        }

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Credentials": true
            },
            body: JSON.stringify(response)
        };
    } catch (error) {
        console.error('Error processing request:', error);
        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Credentials": true
            },
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};

// Prior to 1 October 2024
const calculateTransferCostsOlder = (amount, sub_type, dutytype) => {
    let fee, vat, duty = 0, stamp = 0, office, sundries = 1265, total;

    // Define office fees based on sub_type
    const office_fee_S = 250;
    const office_fee_F = 345;

    // Fee calculation based on sub_type and amount
    if (sub_type === 'F') {
        if (amount < 500000) {
            fee = 5000;
        } else if (amount < 600000) {
            fee = 6800;
        } else if (amount < 1000000) {
            fee = 11160 + (Math.ceil((amount - 600000) / 100000) * 1540);
        } else if (amount < 5000000) {
            fee = 18860 + (Math.ceil((amount - 1000000) / 200000) * 1540);
        } else {
            fee = 49660 + (Math.ceil((amount - 5000000) / 500000) * 1925);
        }
    } else if (sub_type === 'S') {
        if (amount < 100000) {
            fee = 3000;
        } else if (amount < 300000) {
            fee = 4500;
        } else if (amount < 500000) {
            fee = 6000;
        } else if (amount < 600000) {
            fee = 6800;
        } else if (amount < 1000000) {
            fee = 10260 + (Math.ceil((amount - 600000) / 100000) * 1200);
        } else if (amount < 5000000) {
            fee = 16260 + (Math.ceil((amount - 1000000) / 200000) * 1200);
        } else {
            fee = 40260 + (Math.ceil((amount - 5000000) / 500000) * 1600);
        }
    }

    // VAT calculation at 15% of the fee
    vat = fee * 0.15;

    // Duty and Stamp Duty calculation based on dutytype and amount
    switch (dutytype) {
        case 'N':
            if (amount <= 600000) {
                duty = 0;
            } else if (amount < 1000000) {
                duty = (amount - 600000) * 0.01;
            } else if (amount < 2000000) {
                duty = 4000 + (amount - 1000000) * 0.05;
            } else {
                duty = 54000 + (amount - 2000000) * 0.08;
            }
            stamp = amount > 1100000 ? Math.ceil((amount - 1100000) / 1000) * 10 : 0;
            break;
        case 'A':
            if (amount < 1500000) {
                duty = 0;
            } else if (amount < 2500000) {
                duty = (amount - 1500000) * 0.01;
            } else {
                duty = 10000 + (amount - 2500000) * 0.03;
            }
            stamp = amount > 1100000 ? Math.ceil((amount - 1100000) / 1000) * 10 : 0;
            break;
        case 'C':
            duty = amount * 0.12;
            stamp = Math.ceil(amount / 1000) * 12;
            break;
    }

    // Ensure duty and stamp are non-negative and rounded to two decimal places
    duty = Math.max(0, Math.floor(duty * 100) / 100);
    stamp = Math.max(0, Math.floor(stamp * 100) / 100);

    // Assign office fee based on sub_type
    office = sub_type === 'S' ? office_fee_S : office_fee_F;

    // Calculate total costs
    total = fee + vat + duty + stamp + office + sundries;

    return {
        transferFees: parseFloat(fee.toFixed(2)),
        vatOnFees: parseFloat(vat.toFixed(2)),
        transferDuty: parseFloat(duty.toFixed(2)),
        stampDuty: parseFloat(stamp.toFixed(2)),
        deedsOfficeFee: parseFloat(office.toFixed(2)),
        sundriesPostagesVAT: parseFloat(sundries.toFixed(2)),
        total: parseFloat(total.toFixed(2))
    };
};

// From 1 October 2024 onwards
const calculateTransferCostsNewer = (amount, sub_type, dutytype) => {
    let fee, vat, duty = 0, stamp = 0, office, sundries = 1265, total;

    // Define office fees based on sub_type
    const office_fee_S = 400;
    const office_fee_F = 345;

    // Fee calculation based on sub_type and amount
    if (sub_type === 'S') {
        if (amount < 100000) {
            fee = 3000;
        } else if (amount < 300000) {
            fee = 4500;
        } else if (amount < 500000) {
            fee = 6000;
        } else if (amount < 600000) {
            fee = 6800;
        } else if (amount < 1000000) {
            fee = 10260 + (Math.ceil((amount - 600000) / 100000) * 1200);
        } else if (amount < 5000000) {
            fee = 16260 + (Math.ceil((amount - 1000000) / 200000) * 1200);
        } else {
            fee = 40260 + (Math.ceil((amount - 5000000) / 500000) * 1600);
        }
    } else if (sub_type === 'F') {
        if (amount < 500000) {
            fee = 5000;
        } else if (amount < 600000) {
            fee = 6800;
        } else if (amount < 1000000) {
            fee = 11160 + (Math.ceil((amount - 600000) / 100000) * 1540);
        } else if (amount < 5000000) {
            fee = 18860 + (Math.ceil((amount - 1000000) / 200000) * 1540);
        } else {
            fee = 49660 + (Math.ceil((amount - 5000000) / 500000) * 1925);
        }
    }

    // Duty calculation based on dutytype and amount (updated rates from Oct 2024)
    switch (dutytype) {
        case 'N':
            if (amount <= 1100000) {
                duty = 0;
            } else if (amount < 1580000) {
                duty = (amount - 1100000) * 0.01;
            } else if (amount < 3150000) {
                duty = 4800 + (amount - 1580000) * 0.05;
            } else if (amount < 12100000) {
                duty = 83300 + (amount - 3150000) * 0.08;
            } else {
                duty = 799300 + (amount - 12100000) * 0.11;
            }
            stamp = amount > 1100000 ? Math.ceil((amount - 1100000) / 1000) * 10 : 0;
            break;
        case 'A':
            if (amount < 1500000) {
                duty = 0;
            } else if (amount < 2500000) {
                duty = (amount - 1500000) * 0.01;
            } else {
                duty = 10000 + (amount - 2500000) * 0.03;
            }
            stamp = amount > 1100000 ? Math.ceil((amount - 1100000) / 1000) * 10 : 0;
            break;
        case 'C':
            duty = amount * 0.12;
            stamp = Math.ceil(amount / 1000) * 12;
            break;
    }

    // Ensure duty and stamp are non-negative and rounded to two decimal places
    duty = Math.max(0, Math.floor(duty * 100) / 100);
    stamp = Math.max(0, Math.floor(stamp * 100) / 100);

    // VAT calculation at 15% of the fee
    vat = fee * 0.15;

    // Assign office fee based on sub_type
    office = sub_type === 'S' ? office_fee_S : office_fee_F;

    // Calculate total costs
    total = fee + vat + duty + stamp + office + sundries;

    return {
        transferFees: parseFloat(fee.toFixed(2)),
        vatOnFees: parseFloat(vat.toFixed(2)),
        transferDuty: parseFloat(duty.toFixed(2)),
        stampDuty: parseFloat(stamp.toFixed(2)),
        deedsOfficeFee: parseFloat(office.toFixed(2)),
        sundriesPostagesVAT: parseFloat(sundries.toFixed(2)),
        total: parseFloat(total.toFixed(2))
    };
}; 