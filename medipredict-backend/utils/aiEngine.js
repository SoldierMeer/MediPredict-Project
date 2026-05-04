/**
 * Simple Heuristic Engine for Risk Classification
 * This acts as the baseline for future ML model training.
 */
export const calculateRiskLevel = (logs) => {
    if (!logs || logs.length === 0) {
        return { level: 'Stable', insight: "No data yet. Keep tracking to see insights.", score: 100 };
    }

    const total = logs.length;
    const missed = logs.filter(l => l.status === 'missed').length;
    const late = logs.filter(l => l.status === 'late').length;
    const totalSnoozes = logs.reduce((acc, curr) => acc + (curr.snoozeCount || 0), 0);

    // Calculate a raw adherence score
    // Weighted: Missed doses hurt more than late doses
    const adherenceRate = ((total - missed - (late * 0.5)) / total) * 100;

    // Classification Logic
    if (adherenceRate < 70 || missed >= 3) {
        return { 
            level: 'Critical', 
            score: Math.max(0, Math.round(adherenceRate)),
            insight: "Significant pattern of missed doses. Caregiver intervention is highly recommended." 
        };
    } else if (adherenceRate < 90 || totalSnoozes > 5 || late > 4) {
        return { 
            level: 'Warning', 
            score: Math.round(adherenceRate),
            insight: "Inconsistent timing detected. Consider setting a more convenient schedule." 
        };
    } else {
        return { 
            level: 'Stable', 
            score: Math.round(adherenceRate),
            insight: "Excellent consistency! The current routine is working perfectly." 
        };
    }
};

