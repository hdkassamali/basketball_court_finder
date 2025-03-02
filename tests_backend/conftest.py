import sys
import os

#Adds the project root to sys.path so that 'app' can be imported no matter where test files are.
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

