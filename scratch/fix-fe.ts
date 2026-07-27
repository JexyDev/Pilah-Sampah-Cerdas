
const fs = require('fs');

let f1 = fs.readFileSync('frontend/src/pages/ManajemenLokasi/ManajemenLokasi.tsx', 'utf8');
f1 = f1.replace(/const _rwGroups = useMemo\(\(\) => \{[\s\S]*?\}, \[householdGroups, locations\]\);/g, '');
f1 = f1.replace(/formatRegionName\(loc.rw, loc.kelurahan\)/g, 'formatRegionName(loc.rw)');
fs.writeFileSync('frontend/src/pages/ManajemenLokasi/ManajemenLokasi.tsx', f1);

let f2 = fs.readFileSync('frontend/src/pages/RwPortal/RwApproval.tsx', 'utf8');
f2 = f2.replace(/setPendingBins\(binsRes.data\);/g, '// setPendingBins(binsRes.data);');
f2 = f2.replace(/const _approveBin = async[\s\S]*?  \};\n/g, '');
f2 = f2.replace(/const _rejectBin = async[\s\S]*?  \};\n/g, '');
fs.writeFileSync('frontend/src/pages/RwPortal/RwApproval.tsx', f2);

let f3 = fs.readFileSync('frontend/src/pages/SuperAdmin/MasterQrManager.tsx', 'utf8');
f3 = f3.replace(/setPendingBins\(pendingBinsRes.data.data\);/g, '// setPendingBins(pendingBinsRes.data.data);');
f3 = f3.replace(/const _approveBin = async[\s\S]*?  \};\n/g, '');
fs.writeFileSync('frontend/src/pages/SuperAdmin/MasterQrManager.tsx', f3);

