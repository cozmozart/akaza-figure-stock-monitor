// Test script to run the monitor multiple times
const { monitorStock } = require('./monitor.js');

console.log('🧪 Starting test monitoring session...');
console.log('This will run the monitor 3 times with 10-second intervals');
console.log('Press Ctrl+C to stop\n');

let runCount = 0;
const maxRuns = 3;

function runTest() {
    runCount++;
    console.log(`\n--- Test Run ${runCount}/${maxRuns} ---`);
    console.log(`Time: ${new Date().toLocaleString()}`);
    
    monitorStock()
        .then(() => {
            console.log(`✅ Test run ${runCount} completed`);
            
            if (runCount < maxRuns) {
                console.log('⏳ Waiting 10 seconds before next run...');
                setTimeout(runTest, 10000);
            } else {
                console.log('\n🎉 All test runs completed!');
                console.log('Check the status.json file to see the latest status.');
                process.exit(0);
            }
        })
        .catch((error) => {
            console.error(`❌ Test run ${runCount} failed:`, error);
            process.exit(1);
        });
}

// Start the first test run
runTest();

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
    console.log('\n👋 Test monitoring stopped by user');
    process.exit(0);
});
