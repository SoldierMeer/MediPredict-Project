import pandas as pd
import numpy as np

def generate_synthetic_data(samples=1500):
    np.random.seed(42)
    data = []

    for _ in range(samples):
        # Randomly choose a persona to ensure class balance
        persona = np.random.choice(['Stable', 'Warning', 'Critical'], p=[0.4, 0.3, 0.3])
        
        if persona == 'Stable':
            avg_latency = np.random.uniform(0, 20)
            missed = np.random.randint(0, 1)
            late = np.random.randint(0, 2)
            label = 0
            
        elif persona == 'Warning':
            avg_latency = np.random.uniform(30, 80)
            missed = np.random.choice([1, 2])
            late = np.random.randint(2, 5)
            label = 1
            
        else: # Critical
            avg_latency = np.random.uniform(100, 300)
            missed = np.random.randint(3, 8)
            late = np.random.randint(3, 10)
            label = 2
            
        data.append([avg_latency, missed, late, label])

    df = pd.DataFrame(data, columns=['avg_latency_minutes', 'missed_doses_last_7_days', 'late_doses_last_7_days', 'label'])
    df.to_csv("synthetic_adherence_data.csv", index=False)
    print(f"Generated {samples} samples in synthetic_adherence_data.csv")

generate_synthetic_data()