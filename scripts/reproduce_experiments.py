import subprocess
import sys
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def run_script(script_path):
    logger.info(f"Running {script_path}...")
    try:
        # Use current python executable to run the scripts
        result = subprocess.run([sys.executable, script_path], check=True, text=True, capture_output=True)
        logger.info(f"Successfully finished {script_path}")
        print(result.stdout)
    except subprocess.CalledProcessError as e:
        logger.error(f"Error running {script_path}:\n{e.stderr}")
        sys.exit(1)

if __name__ == "__main__":
    logger.info("Starting Full Reproducibility Pipeline for OptiVest Research...")
    
    # 1. Run the research backtest (ML pipeline, APDE optimizers, ablations, latency)
    run_script("scripts/run_research_backtest.py")
    
    # 2. Regenerate all IEEE-formatted figures
    run_script("scripts/generate_figures.py")
    
    logger.info("Pipeline completed successfully! All results are in 'results/' and figures in 'figures/output/'.")
