import os
import glob

def replace_in_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        if 'Pilah Sampah Cerdas' in content:
            content = content.replace('Pilah Sampah Cerdas', 'TrashCare')
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Replaced in {filepath}")
    except Exception as e:
        print(f"Error {filepath}: {e}")

def main():
    search_paths = [
        'frontend/src/**/*.ts',
        'frontend/src/**/*.tsx',
        'frontend/index.html'
    ]
    
    for path in search_paths:
        for file in glob.glob(path, recursive=True):
            if os.path.isfile(file):
                replace_in_file(file)

if __name__ == "__main__":
    main()
