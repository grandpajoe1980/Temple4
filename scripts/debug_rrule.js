const { RRule } = require('rrule');

// Mock data based on user report
const startDateTimeStr = '2025-12-20T01:20:00.000Z'; // Saturday
const recurrenceRuleStr = 'DTSTART:20251220T012000Z\nRRULE:FREQ=WEEKLY;INTERVAL=1;BYDAY=FR';

function testRecurrence() {
    console.log('--- Testing Recurrence Logic ---');
    console.log('Start DateTime:', startDateTimeStr);
    console.log('Recurrence Rule String:', recurrenceRuleStr);

    try {
        const baseStart = new Date(startDateTimeStr);

        // Parse string options
        const ruleOptions = RRule.parseString(recurrenceRuleStr);
        console.log('Parsed Options:', ruleOptions);

        // Override dtstart as backend does
        ruleOptions.dtstart = baseStart;
        console.log('Options after override:', ruleOptions);

        const rule = new RRule(ruleOptions);
        console.log('Rule Text:', rule.toString());

        // Limit to 1 year
        const now = new Date(); // Simulating system time (approx Dec 13 2025)
        const limitDate = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
        console.log('Limit Date:', limitDate);

        const occurrences = rule.between(baseStart, limitDate, true, (_, i) => i < 52);

        console.log(`Generated ${occurrences.length} occurrences.`);
        occurrences.forEach((d, i) => console.log(`[${i}] ${d.toISOString()}`));

    } catch (e) {
        console.error('Error:', e);
    }
}

testRecurrence();
