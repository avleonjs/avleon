#!/usr/bin/env node
const chokidar = require("chokidar");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const { transformFileSync } = require("@swc/core");

const SRC_DIR = path.resolve(process.cwd(), "./src");
const DIST_DIR = path.resolve(process.cwd(), "./dist");
const pkg = fs.existsSync(path.join(process.cwd(), "package.json"))
    ? JSON.parse(fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8"))
    : {};

const ENTRY_RELATIVE = pkg?.avleon?.entry || pkg?.main?.replace("src/", "dist/").replace(".ts", ".js") || "dist/server.js";
const ENTRY_FILE = path.resolve(process.cwd(), ENTRY_RELATIVE);

let nodeProcess = null;
let isRestarting = false;

// Color constants for better type safety
const Colors = {
  RESET: '\x1b[0m',
  DIM: '\x1b[90m',
  WHITE: '\x1b[37m',
  CYAN: '\x1b[36m',
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  RED: '\x1b[31m',
  BOLD: '\x1b[1m'
};

// Unified logging with colors and timestamps
function log(category: string, message: any, color = Colors.WHITE) {
  const timestamp = new Date().toTimeString().split(' ')[0];
  console.log(`${Colors.DIM}[${timestamp}]${Colors.RESET} ${color}[${category}]${Colors.RESET} ${message}`);
}

function logCompile(message: string) { 
  log('COMPILE', message, Colors.CYAN); 
}

function logServer(message: string) { 
  log('AVLEON', message, Colors.GREEN); 
}

function logWatch(message: string) { 
  log('WATCH', message, Colors.YELLOW); 
}

function logError(category: string, message: string) { 
  log(category, message, Colors.RED); 
}

// Helper function to check if file is a test file
function isTestFile(filePath: any) {
  const filename = path.basename(filePath);
  return filename.includes('.test.') || filename.includes('.spec.');
}

// compile single TS file
function compileFile(filePath: any) {
  try {
    const rel = path.relative(SRC_DIR, filePath);
    const outFile = path.join(DIST_DIR, rel).replace(/\.ts$/, ".js");
    
    const result = transformFileSync(filePath, {
      jsc: {
        parser: { syntax: "typescript", decorators: true },
        target: "es2022",
        transform: { decoratorMetadata: true },
      },
      module: { type: "commonjs" },
      sourceMaps: false,
    });
    
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    fs.writeFileSync(outFile, result.code, "utf8");
    //logCompile(`✓ ${rel}`);
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logError('COMPILE', `✗ ${path.relative(SRC_DIR, filePath)} - ${errorMessage}`);
    return false;
  }
}

// compile all TS (excluding test files)
function compileAll(dir = SRC_DIR) {
  if (!fs.existsSync(dir)) {
    logError('COMPILE', `Source directory ${dir} does not exist`);
    return 0;
  }
  
  let compiled = 0;
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const f of files) {
    const full = path.join(dir, f.name);
    
    if (f.isDirectory()) {
      compiled += compileAll(full);
    } else if (f.name.endsWith(".ts")) {
      // Skip test files
      if (isTestFile(full)) {
      //  logWatch(`⏭️  Skipping test file: ${path.relative(SRC_DIR, full)}`);
        continue;
      }
      
      if (compileFile(full)) {
        compiled++;
      }
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
    logError('AVLEON', `Entry file ${ENTRY_FILE} does not exist`);
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
    nodeProcess.stdout?.on('data', (data: { toString: () => string; }) => {
      const lines = data.toString().split('\n').filter((line: string) => line.trim());
      lines.forEach((line: any) => logServer(line));
    });
    
    // Forward stderr with server prefix
    nodeProcess.stderr?.on('data', (data: { toString: () => string; }) => {
      const lines = data.toString().split('\n').filter((line: string) => line.trim());
      lines.forEach((line: any) => logError('AVLEON', line));
    });
    
    nodeProcess.on("exit", (code: number, signal: any) => {
      const wasRestarting = isRestarting;
      nodeProcess = null;
      
      if (wasRestarting) {
        // This is expected during restart
        return;
      }
      
      if (code && code !== 0) {
        logError('AVLEON', `Process exited with code ${code}`);
      } else if (signal) {
        logServer(`Process terminated by signal ${signal}`);
      }
      isRestarting = false;
    });
    
    nodeProcess.on("error", (error: { message: any; }) => {
      logError('AVLEON', `Process error: ${error.message}`);
      nodeProcess = null;
      isRestarting = false;
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logError('AVLEON', `Failed to start server: ${errorMessage}`);
    nodeProcess = null;
    isRestarting = false;
  }
}

// kill Node
function killNode() {
  return new Promise<void>((resolve) => {
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
      const errorMessage = error instanceof Error ? error.message : String(error);
      logError('AVLEON', `Error sending SIGTERM: ${errorMessage}`);
    }
    
    // Force kill after 1 second if still running
    const forceKillTimeout = setTimeout(() => {
      if (nodeProcess && !resolved) {
        logServer("⚠️  Force killing server...");
        try {
          nodeProcess.kill("SIGKILL");
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          logError('AVLEON', `Error sending SIGKILL: ${errorMessage}`);
        }
        setTimeout(cleanup, 100);
      }
    }, 1000);
    
    // Fallback timeout - always resolve within 3 seconds
    setTimeout(() => {
      clearTimeout(forceKillTimeout);
      if (!resolved) {
        logError('AVLEON', 'Force cleanup - process may still be running');
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
    const errorMessage = error instanceof Error ? error.message : String(error);
    logError('AVLEON', `Restart error: ${errorMessage}`);
    isRestarting = false;
  }
}
let restartTimer = null;

async function debouncedRestart() {
    if (restartTimer) clearTimeout(restartTimer);
    restartTimer = setTimeout(async () => {
        restartTimer = null;
        await restartNode();
    }, 300); // wait 300ms after last change
}
// watch src
function watch() {

  const watcher = chokidar.watch(SRC_DIR, { 
    ignoreInitial: true,
    ignored: [
      /(^|[\/\\])\../, // ignore dotfiles
      /\.(test|spec)\.(ts|js)$/ // ignore test files
    ],
    persistent: true,
    followSymlinks: false,
    awaitWriteFinish: {
      stabilityThreshold: 100,
      pollInterval: 50
    }
  });
  

  
  watcher.on("add", (file: string) => {
    
    if (file.endsWith('.ts') && !isTestFile(file)) {
      if (compileFile(file)) {
        setTimeout(() => restartNode(), 100);
      }
    }
  });
  
  watcher.on("change", async (file: string) => {
    if (file.endsWith('.ts') && !isTestFile(file)) {
        if (compileFile(file)) {
            await debouncedRestart();
        }
    }
  });
  
  watcher.on("unlink", async (file: any) => {
    if (!isTestFile(file)) {
      const outFile = path
        .join(DIST_DIR, path.relative(SRC_DIR, file))
        .replace(/\.ts$/, ".js");
      if (fs.existsSync(outFile)) {
        fs.unlinkSync(outFile);
      }
      await restartNode();
    } 
  });
  
  // Debug: log all watcher events
  watcher.on('all', (eventName: string, filePath: any) => {
    if (!['add', 'change', 'unlink'].includes(eventName)) {
      //logWatch(`🔍 Debug: ${eventName} -> ${filePath}`);
    }
  });
  
  watcher.on("error", (error: { message: any; }) => {
    logError('WATCH', `Watcher error: ${error.message}`);
  });
}
process.on("uncaughtException", (error) => {
    logError('CLI', `Uncaught exception: ${error.message}`);
    logError('CLI', error.stack ?? "");
});

process.on("unhandledRejection", (reason) => {
    logError('CLI', `Unhandled rejection: ${reason}`);
});
// Graceful shutdown
process.on("SIGINT", async () => {

  await killNode();
  process.exit(0);
});


// Main execution
(async () => {
  console.log(`${Colors.BOLD}${Colors.CYAN}🔧 Development Server${Colors.RESET}`);
  console.log('━'.repeat(50));
  
  logWatch("🚀 Starting development server...");
  
  const compiled = compileAll();
  startNode();
  watch();
  
  console.log('━'.repeat(50));
  logWatch("✨ Ready! Press Ctrl+C to stop");
})();