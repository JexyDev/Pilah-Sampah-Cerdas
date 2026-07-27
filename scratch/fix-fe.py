
import re

# ManajemenLokasi.tsx
with open('frontend/src/pages/ManajemenLokasi/ManajemenLokasi.tsx', 'r', encoding='utf-8') as f:
    c = f.read()
c = re.sub(r'const _rwGroups = useMemo\(\(\) => \{.*?\}, \[householdGroups, locations\]\);', '', c, flags=re.DOTALL)
c = re.sub(r'formatRegionName\(loc\.rw, loc\.kelurahan\)', 'formatRegionName(loc.rw)', c)
with open('frontend/src/pages/ManajemenLokasi/ManajemenLokasi.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

# RwApproval.tsx
with open('frontend/src/pages/RwPortal/RwApproval.tsx', 'r', encoding='utf-8') as f:
    c = f.read()
c = re.sub(r'const \[_pendingBins, _setPendingBins\] = useState<any\[\]>\(\[\]\);\n', '', c)
c = re.sub(r'setPendingBins\(binsRes\.data\);', '//', c)
c = re.sub(r'const _approveBin = async.*?\};\n', '', c, flags=re.DOTALL)
c = re.sub(r'const _rejectBin = async.*?\};\n', '', c, flags=re.DOTALL)
with open('frontend/src/pages/RwPortal/RwApproval.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

# MasterQrManager.tsx
with open('frontend/src/pages/SuperAdmin/MasterQrManager.tsx', 'r', encoding='utf-8') as f:
    c = f.read()
c = re.sub(r'const \[_pendingBins, _setPendingBins\] = useState<any\[\]>\(\[\]\);\n', '', c)
c = re.sub(r'setPendingBins\(pendingBinsRes\.data\.data\);', '//', c)
c = re.sub(r'const _approveBin = async.*?\};\n', '', c, flags=re.DOTALL)
with open('frontend/src/pages/SuperAdmin/MasterQrManager.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

