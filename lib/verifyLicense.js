const axios = require('axios');

async function verifyNYLicense(licenseNumber) {
    // Clean license number: remove spaces/dashes
    const cleanNum = licenseNumber.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    
    // Dataset: Active Appearance Enhancement and Barber Individual Licenses
    // Endpoint: https://data.ny.gov/resource/ucu3-8265.json
    const url = `https://data.ny.gov/resource/ucu3-8265.json?license_number=${cleanNum}`;
    
    try {
        const response = await axios.get(url, { timeout: 10000 });
        const data = response.data;
        
        if (!data || data.length === 0) {
            return { valid: false, error: 'License not found in NY database' };
        }
        
        const record = data[0];
        return {
            valid: true,
            name: record.license_holder_name,
            type: record.license_type,
            status: 'Active',
            expiry: record.license_expiration_date,
            state: 'NY'
        };
    } catch (error) {
        return { valid: false, error: error.message };
    }
}

async function verifyLicense(state, licenseNumber) {
    const s = state.toUpperCase();
    if (s === 'NY') {
        return await verifyNYLicense(licenseNumber);
    } else {
        return { valid: false, error: `Auto-lookup for ${s} is still in development (scraping required)` };
    }
}

// CLI support
if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.log(JSON.stringify({ error: 'Usage: node verify_license.js <STATE> <LICENSE_NUMBER>' }));
        process.exit(1);
    }
    
    verifyLicense(args[0], args[1]).then(result => {
        console.log(JSON.stringify(result));
    });
}

module.exports = { verifyLicense };
