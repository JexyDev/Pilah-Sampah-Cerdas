/**
 * trello-sync.js — Commit-Driven GitHub ↔ Trello Automation
 * Pilah Sampah Cerdas (Monorepo: Backend + Frontend + Mobile)
 *
 * Cara kerja:
 * 1. Baca .trello-sync-state.json → tahu commit terakhir yang sudah diproses
 * 2. Scan git log sejak commit itu → cari pola "refs <ID-TASK>"
 * 3. Buat/update card Trello sesuai commit, anti-duplikat via state file
 * 4. Simpan state terbaru ke .trello-sync-state.json
 *
 * Konvensi commit: <tipe>(<modul>): <judul> - refs <ID>
 * Contoh: feat(mobile): redesign login - refs MOB-012
 * Selesai: fix(backend): perbaiki RBAC - refs BUG-014 done
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// ── Konfigurasi ───────────────────────────────────────────────────────────────
const TRELLO_KEY   = process.env.TRELLO_API_KEY;
const TRELLO_TOKEN = process.env.TRELLO_TOKEN;
const BOARD_ID     = process.env.TRELLO_BOARD_ID;
const GITHUB_REPO  = process.env.GITHUB_REPOSITORY || 'JexyDev/Pilah-Sampah-Cerdas';
const GITHUB_SERVER_URL = process.env.GITHUB_SERVER_URL || 'https://github.com';

// Label default dari environment (di-set oleh GitHub Actions berdasarkan file yang berubah)
// Format: "Backend,Frontend" atau "Mobile" dst.
const DEFAULT_MODULE_LABELS = (process.env.TRELLO_MODULE_LABELS || 'Backend')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const STATE_FILE   = path.resolve('.trello-sync-state.json');
const TRELLO_BASE  = 'https://api.trello.com/1';

const DRY_RUN = !TRELLO_KEY || !TRELLO_TOKEN || !BOARD_ID;

if (DRY_RUN) {
  console.warn('⚠️  Trello credentials tidak ditemukan — berjalan dalam mode DRY-RUN (tidak ada perubahan di Trello).');
}

// ── State Management ──────────────────────────────────────────────────────────
function loadState() {
  if (!fs.existsSync(STATE_FILE)) {
    return { lastProcessedSha: null, cardMap: {} };
  }
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
  } catch {
    console.warn('⚠️  Gagal membaca state file, mulai dari awal.');
    return { lastProcessedSha: null, cardMap: {} };
  }
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
}

// ── Git Utilities ─────────────────────────────────────────────────────────────
function getNewCommits(sincesha) {
  try {
    // Format: SHA|subject|body|author|timestamp
    const format = '%H|%s|%b|%an|%aI';
    const range  = sincesha ? `${sincesha}..HEAD` : '-n 50';
    const cmd    = sincesha
      ? `git log ${range} --pretty=format:"${format}" --`
      : `git log ${range} --pretty=format:"${format}" --`;

    const raw = execSync(cmd, { maxBuffer: 10 * 1024 * 1024 }).toString().trim();
    if (!raw) return [];

    // Split per commit (SHA selalu 40 karakter hex di awal baris)
    const commits = [];
    const lines = raw.split('\n');
    let current = null;

    for (const line of lines) {
      // Baris baru commit dimulai dengan SHA 40-char diikuti "|"
      if (/^[0-9a-f]{40}\|/.test(line)) {
        if (current) commits.push(current);
        const parts = line.split('|');
        current = {
          sha:       parts[0],
          subject:   parts[1] || '',
          body:      parts[2] || '',
          author:    parts[3] || '',
          timestamp: parts[4] || '',
        };
      } else if (current) {
        // Baris lanjutan body commit multi-baris
        current.body += '\n' + line;
      }
    }
    if (current) commits.push(current);

    return commits;
  } catch (err) {
    console.warn('⚠️  Gagal baca git log:', err.message);
    return [];
  }
}

function getChangedFiles(sha) {
  try {
    const out = execSync(`git diff-tree --no-commit-id -r --name-only ${sha}`)
      .toString()
      .trim();
    return out ? out.split('\n').filter(Boolean) : [];
  } catch {
    return [];
  }
}

/**
 * Deteksi label modul dari daftar file yang berubah.
 * Prioritas: path file → default label dari env
 */
function detectLabelsFromFiles(files, defaultLabels) {
  const labels = new Set();
  for (const f of files) {
    if (f.startsWith('mobile/'))                          labels.add('Mobile');
    else if (f.startsWith('frontend/') || f.startsWith('fe/')) labels.add('Frontend');
    else                                                  labels.add('Backend');
  }
  if (labels.size === 0) defaultLabels.forEach(l => labels.add(l));
  return [...labels];
}

// ── Trello API ────────────────────────────────────────────────────────────────
async function callTrello(endpoint, method = 'GET', body = null) {
  if (DRY_RUN) {
    console.log(`[DRY-RUN] ${method} ${endpoint}`, body ? JSON.stringify(body).slice(0, 120) : '');
    // Return mock agar flow tidak error
    return { id: 'mock-id-' + Math.random().toString(36).slice(2), name: 'mock', idList: 'mock' };
  }

  const sep = endpoint.includes('?') ? '&' : '?';
  const url = `${TRELLO_BASE}${endpoint}${sep}key=${TRELLO_KEY}&token=${TRELLO_TOKEN}`;
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) opts.body = JSON.stringify(body);

  const res  = await fetch(url, opts);
  const text = await res.text();
  if (!res.ok) throw new Error(`Trello ${method} ${endpoint} → ${res.status}: ${text}`);
  return JSON.parse(text);
}

// Cache lists & labels agar tidak berulang kali GET
let _lists = null;
let _labelMap = null; // name → id

async function getLists() {
  if (_lists) return _lists;
  _lists = await callTrello(`/boards/${BOARD_ID}/lists`);
  return _lists;
}

function findList(lists, keyword) {
  return lists.find(l => l.name.toLowerCase().includes(keyword.toLowerCase()));
}

async function getLabelMap() {
  if (_labelMap) return _labelMap;
  const existing = await callTrello(`/boards/${BOARD_ID}/labels`);
  _labelMap = {};
  existing.forEach(l => { if (l.name) _labelMap[l.name] = l.id; });
  return _labelMap;
}

async function getOrCreateLabel(name) {
  const map = await getLabelMap();
  if (map[name]) return map[name];

  // Pilih warna berdasarkan nama label
  const colorMap = {
    Backend:   'sky',
    Frontend:  'lime',
    Mobile:    'purple',
    Completed: 'green',
  };
  const color = colorMap[name] || 'pink';
  console.log(`🏷️  Membuat label "${name}" (${color})...`);
  const label = await callTrello(`/boards/${BOARD_ID}/labels`, 'POST', { name, color });
  map[name] = label.id;
  return label.id;
}

// ── Card Operations ───────────────────────────────────────────────────────────

/**
 * Bangun deskripsi card dengan format standar.
 */
function buildCardDescription({ subject, body, labels, files, sha, timestamp }) {
  const commitUrl = `${GITHUB_SERVER_URL}/${GITHUB_REPO}/commit/${sha}`;
  const fileList  = files.length > 0
    ? files.map(f => `- \`${f}\``).join('\n')
    : '_Tidak ada file terdeteksi_';

  return [
    `## Ringkasan`,
    subject,
    ``,
    `## Detail`,
    body && body.trim() ? body.trim() : '_Tidak ada body commit_',
    ``,
    `## Modul`,
    labels.join(', '),
    ``,
    `## File Terkait`,
    fileList,
    ``,
    `## Commit Terakhir`,
    `[${sha.slice(0, 8)}](${commitUrl}) — ${timestamp}`,
  ].join('\n');
}

/**
 * Buat card baru di "Backlog" dengan deskripsi lengkap + checklist default.
 */
async function createCard({ taskId, subject, description, labelIds, listId }) {
  console.log(`📋 Membuat card baru untuk ${taskId}: ${subject}`);

  const card = await callTrello('/cards', 'POST', {
    name:     `[${taskId}] ${subject}`,
    desc:     description,
    idList:   listId,
    idLabels: labelIds,
  });

  // Tambahkan checklist default
  if (!DRY_RUN) {
    const checklist = await callTrello(`/checklists`, 'POST', {
      idCard: card.id,
      name:   'Progress',
    });
    const items = ['Implementasi', 'Testing', 'Review'];
    for (const item of items) {
      await callTrello(`/checklists/${checklist.id}/checkItems`, 'POST', { name: item });
    }
  }

  return card;
}

/**
 * Tambahkan comment ke card yang sudah ada.
 */
async function addComment(cardId, text) {
  await callTrello(`/cards/${cardId}/actions/comments`, 'POST', { text });
}

/**
 * Pindahkan card ke list tertentu.
 */
async function moveCard(cardId, listId) {
  await callTrello(`/cards/${cardId}`, 'PUT', { idList: listId });
}

/**
 * Update deskripsi card.
 */
async function updateCardDesc(cardId, desc) {
  await callTrello(`/cards/${cardId}`, 'PUT', { desc });
}

/**
 * Centang semua checklist items di card (untuk sinyal "selesai").
 * Butler akan otomatis pindahkan ke Done saat semua tercentang.
 */
async function checkAllChecklists(cardId) {
  if (DRY_RUN) {
    console.log(`[DRY-RUN] Centang semua checklist di card ${cardId}`);
    return;
  }
  const checklists = await callTrello(`/cards/${cardId}/checklists`);
  for (const cl of checklists) {
    for (const item of (cl.checkItems || [])) {
      if (item.state !== 'complete') {
        await callTrello(
          `/cards/${cardId}/checkItem/${item.id}`,
          'PUT',
          { state: 'complete' }
        );
      }
    }
  }
}

// ── Kata Kunci "Selesai" ──────────────────────────────────────────────────────
const DONE_KEYWORDS = /\b(done|selesai|close[sd]?|resolve[sd]?|complete[sd]?|fix(?:ed)?)\b/i;

function isDoneCommit(subject, body) {
  return DONE_KEYWORDS.test(subject) || DONE_KEYWORDS.test(body || '');
}

// ── Pola Parsing Commit ───────────────────────────────────────────────────────
// Cocokkan: "refs ID-TASK" atau "refs: ID-TASK" (case-insensitive)
const REFS_PATTERN = /\brefs\s*:?\s+([A-Z]+-\d+)\b/gi;

function extractTaskIds(text) {
  const ids = new Set();
  let m;
  REFS_PATTERN.lastIndex = 0;
  while ((m = REFS_PATTERN.exec(text)) !== null) {
    ids.add(m[1].toUpperCase());
  }
  return [...ids];
}

// ── Komit yang Harus Dilewati ─────────────────────────────────────────────────
const SKIP_PATTERNS = [
  /^\[skip ci\]/i,
  /^chore: update trello sync state/i,
  /^chore: sync task tracker/i,
];

function shouldSkipCommit(subject) {
  return SKIP_PATTERNS.some(p => p.test(subject));
}

// ── Main Sync ─────────────────────────────────────────────────────────────────
async function sync() {
  console.log('🚀 Memulai Trello Sync (Commit-Driven)...');
  console.log(`   Repo        : ${GITHUB_REPO}`);
  console.log(`   Default label: ${DEFAULT_MODULE_LABELS.join(', ')}`);
  console.log(`   Mode        : ${DRY_RUN ? 'DRY-RUN' : 'LIVE'}`);

  const state = loadState();
  console.log(`   Last SHA    : ${state.lastProcessedSha || '(belum ada — scan 50 commit terakhir)'}`);

  // Ambil commit baru sejak terakhir
  const commits = getNewCommits(state.lastProcessedSha);
  if (commits.length === 0) {
    console.log('✅ Tidak ada commit baru untuk diproses.');
    return;
  }
  console.log(`📦 ${commits.length} commit baru ditemukan.`);

  // Proses dari yang TERLAMA ke TERBARU (kronologis)
  const orderedCommits = [...commits].reverse();

  if (!DRY_RUN) {
    // Pastikan lists & labels tersedia
    const lists = await getLists();
    const backlogList    = findList(lists, 'backlog');
    const inProgressList = findList(lists, 'progress');
    if (!backlogList || !inProgressList) {
      throw new Error(
        'Board Trello harus memiliki list bernama "Backlog" dan "In Progress". ' +
        `List yang ditemukan: ${lists.map(l => l.name).join(', ')}`
      );
    }
    console.log(`📋 Lists: Backlog(${backlogList.id}), In Progress(${inProgressList.id})`);
  }

  let latestSha = state.lastProcessedSha;
  let stateChanged = false;

  for (const commit of orderedCommits) {
    const { sha, subject, body, author, timestamp } = commit;
    console.log(`\n🔍 Commit ${sha.slice(0, 8)}: ${subject}`);

    // Skip commit otomatis (chore sync state, skip ci, dll.)
    if (shouldSkipCommit(subject)) {
      console.log(`   ⏭️  Dilewati (auto-commit)`);
      latestSha = sha;
      continue;
    }

    // Gabungkan subject + body untuk parsing
    const fullText = `${subject}\n${body || ''}`;
    const taskIds  = extractTaskIds(fullText);

    if (taskIds.length === 0) {
      console.log(`   ℹ️  Tidak ada refs <ID> → dilewati`);
      latestSha = sha;
      continue;
    }

    console.log(`   🎯 Task IDs ditemukan: ${taskIds.join(', ')}`);

    // Deteksi modul dari file yang berubah
    const changedFiles = getChangedFiles(sha);
    const labels = detectLabelsFromFiles(changedFiles, DEFAULT_MODULE_LABELS);
    console.log(`   📁 Files (${changedFiles.length}): ${changedFiles.slice(0, 5).join(', ')}${changedFiles.length > 5 ? '...' : ''}`);
    console.log(`   🏷️  Labels: ${labels.join(', ')}`);

    const description = buildCardDescription({
      subject, body, labels,
      files: changedFiles,
      sha, timestamp,
    });

    const isDone = isDoneCommit(subject, body);
    if (isDone) console.log(`   ✅ Commit ini menandai task SELESAI`);

    if (!DRY_RUN) {
      const lists = await getLists();
      const backlogList    = findList(lists, 'backlog');
      const inProgressList = findList(lists, 'progress');

      // Resolve label IDs
      const labelIds = await Promise.all(labels.map(l => getOrCreateLabel(l)));

      for (const taskId of taskIds) {
        if (state.cardMap[taskId]) {
          // ── Card sudah ada — update ──────────────────────────────────────
          const cardId = state.cardMap[taskId];
          console.log(`   🔄 Update card ${cardId} untuk ${taskId}`);

          // Get current card info
          let currentCard;
          try {
            currentCard = await callTrello(`/cards/${cardId}?fields=idList,name`);
          } catch (err) {
            console.warn(`   ⚠️  Card ${cardId} tidak ditemukan di Trello, buat baru...`);
            delete state.cardMap[taskId];
            stateChanged = true;
            // Lanjut ke blok create di bawah
            currentCard = null;
          }

          if (currentCard) {
            // Update deskripsi dengan info commit terbaru
            await updateCardDesc(cardId, description);

            // Tambah comment
            const commitUrl = `${GITHUB_SERVER_URL}/${GITHUB_REPO}/commit/${sha}`;
            const commentText = [
              `**Commit baru: ${sha.slice(0, 8)}**`,
              `_Oleh_: ${author} — ${timestamp}`,
              ``,
              `**${subject}**`,
              body && body.trim() ? body.trim() : '',
              ``,
              `🔗 [Lihat commit](${commitUrl})`,
              `📁 Files: ${changedFiles.slice(0, 10).join(', ')}${changedFiles.length > 10 ? '...' : ''}`,
            ].join('\n');
            await addComment(cardId, commentText);

            // Pindah ke In Progress jika masih di Backlog
            if (currentCard.idList === backlogList.id && !isDone) {
              console.log(`   ➡️  Pindah ke In Progress`);
              await moveCard(cardId, inProgressList.id);
            }

            // Jika done: centang semua checklist → Butler otomatis pindahkan ke Done
            if (isDone) {
              console.log(`   ☑️  Mencentang semua checklist...`);
              await checkAllChecklists(cardId);
            }
            continue;
          }
        }

        // ── Buat card baru ────────────────────────────────────────────────
        const card = await createCard({
          taskId,
          subject,
          description,
          labelIds,
          listId: backlogList.id,
        });

        state.cardMap[taskId] = card.id;
        stateChanged = true;
        console.log(`   ✅ Card baru dibuat: ${card.id}`);

        // Jika commit langsung done → centang semua checklist
        if (isDone) {
          console.log(`   ☑️  Mencentang semua checklist (langsung done)...`);
          await checkAllChecklists(card.id);
        }
      }
    } else {
      // DRY-RUN: tampilkan apa yang akan dilakukan
      for (const taskId of taskIds) {
        if (state.cardMap[taskId]) {
          console.log(`   [DRY-RUN] Update card ${state.cardMap[taskId]} untuk ${taskId}`);
        } else {
          console.log(`   [DRY-RUN] Buat card baru untuk ${taskId} di Backlog`);
          state.cardMap[taskId] = `mock-${taskId}`;
          stateChanged = true;
        }
        if (isDone) console.log(`   [DRY-RUN] Centang semua checklist → Butler pindahkan ke Done`);
      }
    }

    latestSha = sha;
  }

  // Simpan state terbaru
  state.lastProcessedSha = latestSha || state.lastProcessedSha;
  saveState(state);

  if (stateChanged) {
    console.log(`\n💾 State disimpan ke ${STATE_FILE}`);
  }

  console.log('\n🎉 Trello Sync selesai!');
}

// ── Entry Point ───────────────────────────────────────────────────────────────
sync().catch(err => {
  console.error('❌ Trello Sync gagal:', err.message);
  console.error(err.stack);
  // PENTING: exit 0 agar build/deploy tetap jalan meski sync gagal
  process.exit(0);
});
