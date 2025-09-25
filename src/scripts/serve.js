#!/usr/bin/env node
const chokidar = require("chokidar");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const { transformFileSync } = require("@swc/core");

const SRC_DIR = path.resolve(process.cwd(), "../src");
const DIST_DIR = path.resolve(process.cwd(), "../dist");
const ENTRY_FILE = path.join(DIST_DIR, "server.js");

let nodeProcess = null;
let isRestarting = false;

// Unified logging with colors and timestamps
function log(category, message, color = '\x1b[37m') {
  const timestamp = new Date().toTimeString().split(' ')[0];
  console.log(`\x1b[90m[${timestamp}]\x1b[0m ${color}[${category}]\x1b[0m ${message}`);
}

function logCompile(message) { log('SWC', message, '\x1b[36m'); }
function logServer(message) { log('SERVER', message, '\x1b[32m'); }
function logWatch(message) { log('WATCH', message, '\x1b[33m'); }
function logError(category, message) { log(category, message, '\x1b[31m'); }

// compile single TS file
function compileFile(filePath) {
  try {
    const rel = path.relative(SRC_DIR, filePath);
    const outFile = path.join(DIST_DIR, rel).replace(/\.ts$/, ".js");
    
    const { code } = transformFileSync(filePath, {
      jsc: {
        parser: { syntax: "typescript", decorators: true },
        target: "es2022",
        transform: { decoratorMetadata: true },
      },
      module: { type: "commonjs" },
      sourceMaps: false,
    });
    
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    fs.writeFileSync(outFile, code, "utf8");
    logCompile(`✓ ${rel}`);
    return true;
  } catch (error) {
    logError('SWC', `✗ ${path.relative(SRC_DIR, filePath)} - ${error.message}`);
    return false;
  }
}

// compile all TS
function compileAll(dir = SRC_DIR) {
  if (!fs.existsSync(dir)) {
    logError('SWC', `Source directory ${dir} does not exist`);
    return 0;
  }
  
  let compiled = 0;
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const f of files) {
    const full = path.join(dir, f.name);
    if (f.isDirectory()) {
      compiled += compileAll(full);
    } else if (f.name.endsWith(".ts")) {
        if (f.name.includes('.test.') || f.name.includes('.spec.')) {
        logWatch(`⏭️  Skipping test file: ${path.relative(SRC_DIR, full)}`);
        continue;
      }
      if (compileFile(full)) compiled++;
    }
  }
  return compiled;
}

// start Node with integrated output
function startNode() {
  if (nodeProcess) {
    logServer("⚠️  Process already running, skipping start");
    return;
  }
  
  if (isRestarting) {
    // Reset the flag when actually starting
    isRestarting = false;
  }
  
  if (!fs.existsSync(ENTRY_FILE)) {
    logError('SERVER', `Entry file ${ENTRY_FILE} does not exist`);
    return;
  }
  
  logServer("🚀 Starting server...");
  
  try {
    nodeProcess = spawn("node", [ENTRY_FILE], { 
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, FORCE_COLOR: '1' },
      detached: false // Ensure process stays attached
    });
    
    // Forward stdout with server prefix
    nodeProcess.stdout?.on('data', (data) => {
      const lines = data.toString().split('\n').filter(line => line.trim());
      lines.forEach(line => logServer(line));
    });
    
    // Forward stderr with server prefix
    nodeProcess.stderr?.on('data', (data) => {
      const lines = data.toString().split('\n').filter(line => line.trim());
      lines.forEach(line => logError('SERVER', line));
    });
    
    nodeProcess.on("exit", (code, signal) => {
      const wasRestarting = isRestarting;
      nodeProcess = null;
      
      if (wasRestarting) {
        // This is expected during restart
        return;
      }
      
      if (code && code !== 0) {
        logError('SERVER', `Process exited with code ${code}`);
      } else if (signal) {
        logServer(`Process terminated by signal ${signal}`);
      } else {
       // logServer("Process exited normally");
      }
      isRestarting = false;
    });
    
    nodeProcess.on("error", (error) => {
      logError('SERVER', `Process error: ${error.message}`);
      nodeProcess = null;
      isRestarting = false;
    });
    
    // Add a small delay to let the server start
    setTimeout(() => {
      if (nodeProcess) {
        logServer("✅ Server started successfully");
      }
    }, 500);
    
  } catch (error) {
    logError('SERVER', `Failed to start server: ${error.message}`);
    nodeProcess = null;
    isRestarting = false;
  }
}

// kill Node
function killNode() {
  return new Promise((resolve) => {
    if (!nodeProcess) return resolve();
    
    logServer("🛑 Stopping server...");
    
    let resolved = false;
    const cleanup = () => {
      if (!resolved) {
        resolved = true;
        nodeProcess = null;
        logServer("✓ Server stopped");
        resolve();
      }
    };
    
    nodeProcess.once("exit", cleanup);
    nodeProcess.once("close", cleanup);
    
    // Try graceful shutdown first
    try {
      nodeProcess.kill("SIGTERM");
    } catch (error) {
      logError('SERVER', `Error sending SIGTERM: ${error.message}`);
    }
    
    // Force kill after 1 second if still running
    const forceKillTimeout = setTimeout(() => {
      if (nodeProcess && !resolved) {
        logServer("⚠️  Force killing server...");
        try {
          nodeProcess.kill("SIGKILL");
        } catch (error) {
          logError('SERVER', `Error sending SIGKILL: ${error.message}`);
        }
        // Ensure cleanup happens even if SIGKILL fails
        setTimeout(cleanup, 100);
      }
    }, 1000);
    
    // Fallback timeout - always resolve within 3 seconds
    setTimeout(() => {
      clearTimeout(forceKillTimeout);
      if (!resolved) {
        logError('SERVER', 'Force cleanup - process may still be running');
        nodeProcess = null;
        resolved = true;
        resolve();
      }
    }, 3000);
  });
}

// restart Node
async function restartNode() {
  if (isRestarting) {
    logServer("⏳ Already restarting, skipping...");
    return;
  }
  isRestarting = true;
  
  logServer("🔄 Restarting server...");
  
  try {
    await killNode();
    
    // Add delay to ensure process is fully cleaned up
    await new Promise(resolve => setTimeout(resolve, 200));
    
    startNode();
  } catch (error) {
    logError('SERVER', `Restart error: ${error.message}`);
    isRestarting = false;
  }
}

// watch src
function watch() {
  logWatch(`👀 Watching ${path.relative(process.cwd(), SRC_DIR)} for changes...`);
  
  // Add debug logging
  logWatch(`📂 Source directory: ${SRC_DIR}`);
  logWatch(`📂 Output directory: ${DIST_DIR}`);
  
  const watcher = chokidar.watch(SRC_DIR, { 
    ignoreInitial: true,
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
    followSymlinks: false,
    awaitWriteFinish: {
      stabilityThreshold: 100,
      pollInterval: 50
    }
  });
  
  // Debug: log when watcher is ready
  watcher.on('ready', () => {
    logWatch('✅ Initial scan complete. Ready for changes');
  });
  
  watcher.on("add", (file) => {
    const rel = path.relative(SRC_DIR, file);
    logWatch(`📄 File added: ${rel}`);
    if (compileFile(file)) {
      // For new files, restart if it's a .ts file
      if (file.endsWith('.ts')) {
        setTimeout(() => restartNode(), 100);
      }
    }
  });
  
  watcher.on("change", async (file) => {
    const rel = path.relative(SRC_DIR, file);
    logWatch(`📝 File changed: ${rel}`);
    if (file.endsWith('.ts') && compileFile(file)) {
      await restartNode();
    }
  });
  
  watcher.on("unlink", async (file) => {
    const rel = path.relative(SRC_DIR, file);
    logWatch(`🗑️ File removed: ${rel}`);
    const outFile = path
      .join(DIST_DIR, path.relative(SRC_DIR, file))
      .replace(/\.ts$/, ".js");
    if (fs.existsSync(outFile)) {
      fs.unlinkSync(outFile);
      logCompile(`✗ Removed ${path.relative(DIST_DIR, outFile)}`);
    }
    await restartNode();
  });
  
  // Debug: log all watcher events
  watcher.on('all', (eventName, path) => {
    if (!['add', 'change', 'unlink'].includes(eventName)) {
      logWatch(`🔍 Debug: ${eventName} -> ${path}`);
    }
  });
  
  watcher.on("error", (error) => {
    logError('WATCH', `Watcher error: ${error.message}`);
  });
}

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log();
  logWatch("🛑 Shutting down...");
  await killNode();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log();
  logWatch("🛑 Shutting down...");
  await killNode();
  process.exit(0);
});

// Main execution
(async () => {
  console.log('\x1b[1m\x1b[36m🔧 Development Server\x1b[0m');
  console.log('━'.repeat(50));
  
  logWatch("🚀 Starting development server...");
  
  const compiled = compileAll();
  if (compiled > 0) {
    logCompile(`✅ Compiled ${compiled} file${compiled !== 1 ? 's' : ''}`);
  }
  
  startNode();
  watch();
  
  console.log('━'.repeat(50));
  logWatch("✨ Ready! Press Ctrl+C to stop");
})();