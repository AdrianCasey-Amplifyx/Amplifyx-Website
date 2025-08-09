// Test the lead scoring algorithm
import { calculateLeadScore } from './api/system-prompt.js';

const testCases = [
    {
        name: "High-value lead with urgent timeline",
        data: {
            name: "Sarah Johnson",
            email: "sarah@company.com",
            company: "Tech Corp",
            projectType: "AI automation for customer service",
            timeline: "ASAP - need this implemented urgently",
            budget: "$75,000",
            phone: "+61412345678"
        },
        expectedRange: [80, 100]
    },
    {
        name: "Medium-value lead with moderate timeline",
        data: {
            name: "John Smith",
            email: "john@startup.com",
            company: "Startup Inc",
            projectType: "Chatbot development",
            timeline: "2-3 months",
            budget: "25k"
        },
        expectedRange: [60, 80]
    },
    {
        name: "Low-value lead just researching",
        data: {
            email: "test@example.com",
            projectType: "Maybe some AI stuff",
            timeline: "Just researching options",
            budget: "Not sure yet"
        },
        expectedRange: [20, 40]
    },
    {
        name: "Complete lead with $100k budget",
        data: {
            name: "Enterprise Client",
            email: "client@bigcorp.com",
            company: "Big Corporation",
            phone: "0412345678",
            projectType: "Full AI transformation of customer service department",
            timeline: "Within 1 month",
            budget: "$100,000+"
        },
        expectedRange: [85, 100]
    }
];

console.log("Testing Lead Scoring Algorithm\n");
console.log("=" .repeat(50));

testCases.forEach(test => {
    const score = calculateLeadScore(test.data);
    const inRange = score >= test.expectedRange[0] && score <= test.expectedRange[1];
    const status = inRange ? "✅ PASS" : "❌ FAIL";
    
    console.log(`\n${test.name}`);
    console.log(`Expected: ${test.expectedRange[0]}-${test.expectedRange[1]}`);
    console.log(`Actual: ${score}`);
    console.log(`Result: ${status}`);
    
    if (!inRange) {
        console.log("Debug info:");
        console.log("  Data:", JSON.stringify(test.data, null, 2));
    }
});

console.log("\n" + "=".repeat(50));
console.log("Score Breakdown for High-Value Lead:");
const highValueLead = testCases[0].data;
let breakdown = 0;

// Timeline
if (highValueLead.timeline.toLowerCase().includes('asap')) {
    console.log("  Timeline (ASAP): +30");
    breakdown += 30;
}

// Budget
if (highValueLead.budget.includes('75')) {
    console.log("  Budget ($75k): +28");
    breakdown += 28;
}

// Fields
if (highValueLead.name) {
    console.log("  Name provided: +10");
    breakdown += 10;
}
if (highValueLead.company) {
    console.log("  Company provided: +10");
    breakdown += 10;
}
if (highValueLead.email) {
    console.log("  Email provided: +15");
    breakdown += 15;
}
if (highValueLead.phone) {
    console.log("  Phone provided: +5");
    breakdown += 5;
}
if (highValueLead.projectType) {
    console.log("  Project type: +10");
    breakdown += 10;
}

console.log(`  Total: ${breakdown} (capped at 100)`);