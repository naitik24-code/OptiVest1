import os
import glob
import ast

def count_loc(pattern):
    total_loc = 0
    files = glob.glob(pattern, recursive=True)
    for f in files:
        if "venv" in f or "__pycache__" in f or "node_modules" in f:
            continue
        try:
            with open(f, "r", encoding="utf-8") as file:
                lines = file.readlines()
                total_loc += len([line for line in lines if line.strip() and not line.strip().startswith(("#", "//"))])
        except Exception as e:
            pass
    return total_loc, len(files)

def count_backend_components():
    routes = glob.glob("backend/app/api/**/*.py", recursive=True)
    services = glob.glob("backend/app/services/**/*.py", recursive=True)
    models = glob.glob("backend/app/models/**/*.py", recursive=True)
    repositories = glob.glob("backend/app/repositories/**/*.py", recursive=True)
    
    routes_count = 0
    for r in routes:
        if "__init__" in r: continue
        try:
            with open(r, "r", encoding="utf-8") as file:
                content = file.read()
                routes_count += content.count("@router.")
        except:
            pass
    return {
        "routes_files": len(routes),
        "api_endpoints": routes_count,
        "services": len(services),
        "models": len(models),
        "repositories": len(repositories)
    }

def count_frontend_components():
    components = glob.glob("frontend/src/components/**/*.tsx", recursive=True)
    pages = glob.glob("frontend/src/pages/**/*.tsx", recursive=True)
    services = glob.glob("frontend/src/services/**/*.ts", recursive=True)
    return {
        "components": len(components),
        "pages": len(pages),
        "services": len(services)
    }

if __name__ == "__main__":
    py_loc, py_files = count_loc("**/*.py")
    ts_loc, ts_files = count_loc("**/*.ts")
    tsx_loc, tsx_files = count_loc("**/*.tsx")
    
    backend_stats = count_backend_components()
    frontend_stats = count_frontend_components()
    
    print(f"Total Python LOC: {py_loc} in {py_files} files")
    print(f"Total TypeScript LOC: {ts_loc} in {ts_files} files")
    print(f"Total TSX LOC: {tsx_loc} in {tsx_files} files")
    print(f"Backend Stats: {backend_stats}")
    print(f"Frontend Stats: {frontend_stats}")
