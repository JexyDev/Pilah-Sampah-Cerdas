import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const TRELLO_KEY = process.env.TRELLO_API_KEY;
const TRELLO_TOKEN = process.env.TRELLO_TOKEN;
const BOARD_ID = process.env.TRELLO_BOARD_ID;

if (!TRELLO_KEY || !TRELLO_TOKEN || !BOARD_ID) {
  console.warn("Trello credentials missing. Running in mock/dry-run mode.");
}

const baseTrelloUrl = 'https://api.trello.com/1';

// Helper to make API calls
async function callTrello(endpoint, method = 'GET', body = null) {
  const separator = endpoint.includes('?') ? '&' : '?';
  const url = `${baseTrelloUrl}${endpoint}${separator}key=${TRELLO_KEY}&token=${TRELLO_TOKEN}`;
  
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  };
  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Trello API error (${res.status}): ${errText}`);
    }
    return await res.json();
  } catch (error) {
    console.error(`Error calling Trello endpoint ${endpoint}:`, error.message);
    throw error;
  }
}

// Map module names to color
function getModuleColor(moduleName) {
  const lower = moduleName.toLowerCase();
  if (lower.includes('dashboard')) return 'green';
  if (lower.includes('login') || lower.includes('auth')) return 'blue';
  if (lower.includes('pengguna') || lower.includes('user')) return 'purple';
  if (lower.includes('lokasi')) return 'orange';
  if (lower.includes('setoran') || lower.includes('transaction')) return 'sky';
  if (lower.includes('kegiatan') || lower.includes('schedule')) return 'lime';
  return 'pink';
}

// Parse git logs for task references
function parseCommits(tasks) {
  try {
    const logOutput = execSync('git log -n 30 --pretty=format:"%H|%s"').toString();
    const lines = logOutput.split('\n').filter(Boolean);
    let updated = false;

    for (const line of lines) {
      const parts = line.split('|');
      const sha = parts[0];
      const message = parts.slice(1).join('|');

      const regex = /refs\s+([A-Z]+-\d+)/gi;
      let match;
      while ((match = regex.exec(message)) !== null) {
        const taskId = match[1].toUpperCase();
        const task = tasks.find(t => t.id === taskId);
        
        if (task) {
          const isDone = /done|close|resolve|selesai|fix|fixed|complete/i.test(message);
          const newStatus = isDone ? 'done' : 'in_progress';

          if (task.status !== 'done' && (newStatus === 'done' || task.status === 'todo')) {
            console.log(`Git commit ${sha.substring(0, 8)} matches ${taskId}. Updating status to ${newStatus}`);
            task.status = newStatus;
            task.last_commit = sha;
            updated = true;
          }
        }
      }
    }
    return updated;
  } catch (err) {
    console.warn("Could not read git logs, skipping git parsing:", err.message);
    return false;
  }
}

async function sync() {
  const tasksPath = path.resolve('tasks.json');
  if (!fs.existsSync(tasksPath)) {
    console.error("tasks.json not found! Run consolidation first.");
    process.exit(1);
  }

  const tasks = JSON.parse(fs.readFileSync(tasksPath, 'utf-8'));

  // Run git parser
  const gitUpdated = parseCommits(tasks);
  if (gitUpdated) {
    fs.writeFileSync(tasksPath, JSON.stringify(tasks, null, 2), 'utf-8');
    console.log("Updated tasks.json with new task states from Git commits.");
  }

  // Dry-run mode if no credentials
  if (!TRELLO_KEY || !TRELLO_TOKEN || !BOARD_ID) {
    console.log("Mock Mode: Simulating sync locally.");
    console.log(`Loaded ${tasks.length} tasks.`);
    console.log("First 3 tasks:");
    console.log(tasks.slice(0, 3));
    return;
  }

  console.log("Starting Trello Board Sync...");

  // 1. Get Board Lists
  const lists = await callTrello(`/boards/${BOARD_ID}/lists`);
  const backlogList = lists.find(l => l.name.toLowerCase().includes('backlog'));
  const inProgressList = lists.find(l => l.name.toLowerCase().includes('progress'));
  const doneList = lists.find(l => l.name.toLowerCase().includes('done'));

  if (!backlogList || !inProgressList || !doneList) {
    throw new Error("Could not find lists: 'Backlog', 'In Progress', and 'Done' on Trello board.");
  }

  console.log(`Lists mapped successfully: Backlog (${backlogList.id}), In Progress (${inProgressList.id}), Done (${doneList.id})`);

  // 2. Fetch Board Labels (for caching/avoiding duplicates)
  const existingLabels = await callTrello(`/boards/${BOARD_ID}/labels`);
  const labelMap = {}; // name -> id
  existingLabels.forEach(l => {
    labelMap[l.name] = l.id;
  });

  // Helper to get or create a label
  const getOrCreateLabel = async (moduleName) => {
    if (labelMap[moduleName]) return labelMap[moduleName];
    
    console.log(`Creating label '${moduleName}'...`);
    const color = getModuleColor(moduleName);
    const label = await callTrello(`/boards/${BOARD_ID}/labels`, 'POST', {
      name: moduleName,
      color
    });
    labelMap[moduleName] = label.id;
    return label.id;
  };

  // 3. Process each task
  let updated = false;

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    
    // Choose appropriate list based on status
    let targetListId = backlogList.id;
    if (task.status === 'in_progress') targetListId = inProgressList.id;
    if (task.status === 'done') targetListId = doneList.id;

    const labelId = await getOrCreateLabel(task.module);

    if (!task.trello_card_id) {
      // Create new card
      console.log(`Creating card for task ${task.id}: ${task.title}`);
      
      const newCard = await callTrello('/cards', 'POST', {
        name: `[${task.id}] ${task.title}`,
        desc: `**ID**: ${task.id}\n**Module**: ${task.module}\n**Source File**: ${task.source_file}\n\n**Description**:\n${task.description}`,
        idList: targetListId,
        idLabels: [labelId]
      });

      task.trello_card_id = newCard.id;
      updated = true;
      
      // If task is already done, let's post initial done comment
      if (task.status === 'done') {
        const commentText = `Task selesai pada sync inisial.\nSHA: ${task.last_commit || 'N/A'}`;
        await callTrello(`/cards/${newCard.id}/actions/comments`, 'POST', { text: commentText }).catch(() => {});
      }
    } else {
      // Card already exists, check status/content updates
      
      // Keep description sync'ed
      const expectedDesc = `**ID**: ${task.id}\n**Module**: ${task.module}\n**Source File**: ${task.source_file}\n\n**Description**:\n${task.description}`;
      
      // Get current card list to check if it needs to move
      const currentCard = await callTrello(`/cards/${task.trello_card_id}`);
      
      if (currentCard.idList !== targetListId) {
        console.log(`Moving card ${task.id} to correct list...`);
        await callTrello(`/cards/${task.trello_card_id}`, 'PUT', {
          idList: targetListId,
          desc: expectedDesc
        });
        
        // If transitioning to Done, post comment
        if (task.status === 'done') {
          const commentText = `Task ditandai selesai via commit/sync.\nSHA: ${task.last_commit || 'N/A'}\nTimestamp: ${new Date().toISOString()}`;
          await callTrello(`/cards/${task.trello_card_id}/actions/comments`, 'POST', { text: commentText }).catch(() => {});
        } else if (task.status === 'in_progress') {
          const commentText = `Task mulai dikerjakan (In Progress).`;
          await callTrello(`/cards/${task.trello_card_id}/actions/comments`, 'POST', { text: commentText }).catch(() => {});
        }
      } else if (currentCard.desc !== expectedDesc) {
        // Just sync description
        await callTrello(`/cards/${task.trello_card_id}`, 'PUT', { desc: expectedDesc });
      }
    }
  }

  // Save back updated tasks.json if any new card IDs were generated
  if (updated) {
    fs.writeFileSync(tasksPath, JSON.stringify(tasks, null, 2), 'utf-8');
    console.log("Updated tasks.json with generated Trello Card IDs.");
  }

  console.log("Trello Sync Completed Successfully.");
}

sync().catch(err => {
  console.error("Trello Sync failed:", err);
  // Important guideline: do not fail build / process if sync fails
  process.exit(0);
});
