#!/usr/bin/env python3
"""
MindCare Server Runner
This script helps run the MindCare backend server with proper frontend serving.
"""

import os
import sys
import subprocess
from pathlib import Path

def check_project_structure():
    """Check if the project structure is correct"""
    current_dir = Path.cwd()
    
    # Check if we're in the backend directory
    if current_dir.name == "backend":
        project_root = current_dir.parent
    else:
        project_root = current_dir
    
    print(f"Project root: {project_root}")
    
    # Required frontend files
    frontend_files = [
        "index.html",
        "styles.css", 
        "script.js",
        "counseling.html",
        "counseling.js",
        "about.html",
        "auth.js"
    ]
    
    # Required backend files
    backend_files = [
        "backend/main.py",
        "backend/ai_model.py",
        "backend/email_service.py",
        "backend/requirements.txt"
    ]
    
    missing_files = []
    
    # Check frontend files
    for file in frontend_files:
        file_path = project_root / file
        if not file_path.exists():
            missing_files.append(f"Frontend: {file}")
        else:
            print(f"✓ Found: {file}")
    
    # Check backend files
    for file in backend_files:
        file_path = project_root / file
        if not file_path.exists():
            missing_files.append(f"Backend: {file}")
        else:
            print(f"✓ Found: {file}")
    
    if missing_files:
        print("\n❌ Missing files:")
        for file in missing_files:
            print(f"  - {file}")
        return False, project_root
    
    print("\n✅ All required files found!")
    return True, project_root

def install_dependencies(project_root):
    """Install Python dependencies"""
    requirements_path = project_root / "backend" / "requirements.txt"
    
    if requirements_path.exists():
        print("\n📦 Installing Python dependencies...")
        try:
            subprocess.run([
                sys.executable, "-m", "pip", "install", "-r", str(requirements_path)
            ], check=True)
            print("✅ Dependencies installed successfully!")
            return True
        except subprocess.CalledProcessError as e:
            print(f"❌ Failed to install dependencies: {e}")
            return False
    else:
        print("❌ requirements.txt not found!")
        return False

def run_server(project_root):
    """Run the FastAPI server"""
    backend_dir = project_root / "backend"
    main_py = backend_dir / "main.py"
    
    if not main_py.exists():
        print("❌ main.py not found in backend directory!")
        return False
    
    print(f"\n🚀 Starting MindCare server...")
    print(f"Backend directory: {backend_dir}")
    print(f"Project root: {project_root}")
    print(f"Server will be available at: http://localhost:8000")
    print(f"API documentation: http://localhost:8000/docs")
    
    try:
        # Change to backend directory and run the server
        os.chdir(backend_dir)
        subprocess.run([
            sys.executable, "-m", "uvicorn", "main:app", 
            "--host", "0.0.0.0", 
            "--port", "8000", 
            "--reload"
        ], check=True)
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to start server: {e}")
        return False
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
        return True

def main():
    """Main function"""
    print("🧠 MindCare Server Setup")
    print("=" * 50)
    
    # Check project structure
    structure_ok, project_root = check_project_structure()
    
    if not structure_ok:
        print("\n❌ Project structure is incomplete!")
        print("Please ensure all frontend and backend files are in place.")
        return
    
    # Install dependencies
    if not install_dependencies(project_root):
        print("\n❌ Failed to install dependencies!")
        return
    
    # Run server
    run_server(project_root)

if __name__ == "__main__":
    main()
