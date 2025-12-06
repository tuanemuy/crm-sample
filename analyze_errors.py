import re
import sys
from collections import defaultdict

# Read the lint output
with open('lint_errors.txt', 'r') as f:
    content = f.read()

# Extract errors using regex
error_pattern = r'(src/[^:]+):(\d+):(\d+) (lint/[^\s]+)'
errors = re.findall(error_pattern, content)

# Categorize errors
error_by_type = defaultdict(int)
error_by_file = defaultdict(list)
files_with_errors = set()

for file_path, line, col, error_type in errors:
    error_by_type[error_type] += 1
    error_by_file[file_path].append((line, col, error_type))
    files_with_errors.add(file_path)

print("=== ERROR ANALYSIS ===")
print(f"Total errors found: {len(errors)}")
print(f"Total files with errors: {len(files_with_errors)}")
print()

print("=== ERROR TYPES (sorted by frequency) ===")
for error_type, count in sorted(error_by_type.items(), key=lambda x: x[1], reverse=True):
    print(f"{error_type}: {count}")
print()

print("=== FILES WITH MOST ERRORS (top 10) ===")
file_error_counts = [(file, len(error_list)) for file, error_list in error_by_file.items()]
file_error_counts.sort(key=lambda x: x[1], reverse=True)

for file, count in file_error_counts[:10]:
    print(f"{file}: {count} errors")
print()

print("=== DETAILED BREAKDOWN BY FILE ===")
for file, count in file_error_counts:
    print(f"\n{file} ({count} errors):")
    error_types_in_file = defaultdict(int)
    for line, col, error_type in error_by_file[file]:
        error_types_in_file[error_type] += 1
    
    for error_type, type_count in sorted(error_types_in_file.items(), key=lambda x: x[1], reverse=True):
        print(f"  - {error_type}: {type_count}")
