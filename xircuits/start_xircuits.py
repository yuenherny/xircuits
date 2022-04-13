# coding: utf-8
"""A wrapper to start xircuits and offer to start to XAI-components"""

from pathlib import Path
from urllib import request
import os
import argparse

from .handlers.request_folder import request_folder

def init_xircuits():
    url = "https://raw.githubusercontent.com/XpressAI/xircuits/master/.xircuits/config.ini"
    path = ".xircuits"
    os.mkdir(path)
    request.urlretrieve(url, path+"/config.ini")

def start_xircuits(branch_name):
    print(
'''
======================================
__   __  ___                _ _       
\ \  \ \/ (_)_ __ ___ _   _(_) |_ ___ 
 \ \  \  /| | '__/ __| | | | | __/ __|
 / /  /  \| | | | (__| |_| | | |_\__ \\
/_/  /_/\_\_|_|  \___|\__,_|_|\__|___/
                                      
======================================
'''
    )

    config_path = Path(os.getcwd()) / ".xircuits"
    component_library_path = Path(os.getcwd()) / "xai_components"

    if not config_path.exists():
        init_xircuits()

    if not component_library_path.exists():
        val = input("Xircuits Component Library is not found. Would you like to load it in the current path (Y/N)? ")
        if val.lower() == ("y" or "yes"):
            request_folder("xai_components", branch=branch_name)
    
    os.system("jupyter lab")


def download_examples():
    parser = argparse.ArgumentParser()
    parser.add_argument('--branch', nargs='?', help='pull files from a xircuits branch')

    args = parser.parse_args()
    branch_name = args.branch if args.branch else "master"

    request_folder("examples", branch=branch_name)
    request_folder("datasets", branch=branch_name)
    

def main(argv=None):
    parser = argparse.ArgumentParser()
    parser.add_argument('--branch', nargs='?', help='pull files from a xircuits branch')

    args = parser.parse_args()
    branch_name = args.branch if args.branch else "master"

    start_xircuits(branch_name)