// backend/utils/aiEngine.js

export const calculateRiskLevel = (logs) => {
    const recentLogs = logs.slice(0, 15); 
    if (!recentLogs.length) return { level: 'Stable', score: 100, insight: "Ready." };

    let totalPoints = 0;
    let extremeDelay = false;
    let bulkDoseDetected = false;

    const timestamps = recentLogs.map(l => new Date(l.timestamp).getTime());
    
    recentLogs.forEach(log => {
        const latency = log.latencyMinutes || 0;

        // 1. Toxicity Check (4+ pills in 10 mins)
        const sameTime = timestamps.filter(t => 
            Math.abs(t - new Date(log.timestamp).getTime()) < 10 * 60 * 1000
        ).length;
        
        if (sameTime >= 4) bulkDoseDetected = true;

        // 2. Strict Point Deduction
        if (latency >= 480) { // 8+ hours late is a failure
            totalPoints += 0; 
            extremeDelay = true;
        } else if (latency > 60) {
            totalPoints += 50; 
        } else {
            totalPoints += 100;
        }
    });

    // 3. Calculate Base Score
    let finalScore = Math.round(totalPoints / recentLogs.length);

    // 4. ✅ THE CRASH LOGIC
    // If toxicity is detected, the score CANNOT be higher than 35%
    if (bulkDoseDetected) {
        finalScore = Math.min(finalScore, 35); 
        return {
            level: 'Critical',
            score: finalScore,
            insight: "⚠️ EMERGENCY: Bulk-dosing detected (4+ pills at once). High toxicity risk!"
        };
    }

    // If severe gaps are detected, the score CANNOT be higher than 60%
    if (extremeDelay) {
        finalScore = Math.min(finalScore, 60);
        return {
            level: 'Critical',
            score: finalScore,
            insight: "Critical: Severe 8h+ timing gaps detected. Efficacy compromised."
        };
    }

    return { 
        level: finalScore < 80 ? 'Warning' : 'Stable', 
        score: finalScore, 
        insight: "Pattern analysis complete." 
    };
};