import os
import shutil
import subprocess
import filecmp

def run_determinism_check():
    temp_dir = 'temp_clean_checkout'
    os.makedirs(temp_dir, exist_ok=True)
    
    shutil.copy('run_research_backtest_v7.py', temp_dir)
    # also copy the market data cache so it doesn't take forever to download
    if os.path.exists('market_data_cache.pkl'):
        shutil.copy('market_data_cache.pkl', temp_dir)
        
    print("Running canonical V7 script in isolated directory...")
    # we just run the script using subprocess
    subprocess.run([sys.executable, 'run_research_backtest_v7.py'], cwd=temp_dir, check=True)
    
    print("\nComparing CSV files...")
    csv_files = [f for f in os.listdir(os.path.join(temp_dir, 'results_v7')) if f.endswith('.csv')]
    all_match = True
    
    for csv in csv_files:
        orig = os.path.join('results_v7', csv)
        new = os.path.join(temp_dir, 'results_v7', csv)
        
        if os.path.exists(orig):
            # Check byte-for-byte matching
            match = filecmp.cmp(orig, new, shallow=False)
            if match:
                print(f"MATCH: {csv}")
            else:
                print(f"MISMATCH: {csv}")
                all_match = False
        else:
            print(f"Original not found for {csv}")
            
    if all_match:
        print("Determinism verified! All CSVs matched perfectly.")
    
    # Cleanup
    try: shutil.rmtree(temp_dir)
    except: pass

import sys
if __name__ == '__main__':
    run_determinism_check()
