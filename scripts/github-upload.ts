import { Octokit } from '@octokit/rest';
import * as fs from 'fs';
import * as path from 'path';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('GitHub not connected');
  }
  return accessToken;
}

async function getUncachableGitHubClient() {
  const accessToken = await getAccessToken();
  return new Octokit({ auth: accessToken });
}

const IGNORE_PATTERNS = [
  'node_modules',
  '.git',
  '.replit',
  '.cache',
  '.config',
  '.upm',
  'dist',
  '.local',
  'replit.nix',
  '.breakpoints',
  'generated-icon.png',
  'package-lock.json'
];

function shouldIgnore(filePath: string): boolean {
  return IGNORE_PATTERNS.some(pattern => filePath.includes(pattern));
}

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (shouldIgnore(fullPath)) return;
    
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

async function main() {
  try {
    console.log('Getting GitHub client...');
    const octokit = await getUncachableGitHubClient();
    
    console.log('Getting authenticated user...');
    const { data: user } = await octokit.users.getAuthenticated();
    console.log(`Logged in as: ${user.login}`);
    
    console.log('Listing repositories...');
    const { data: repos } = await octokit.repos.listForAuthenticatedUser({
      per_page: 100,
      sort: 'updated'
    });
    
    if (repos.length === 0) {
      console.log('No repositories found. Creating a new one...');
      const { data: newRepo } = await octokit.repos.createForAuthenticatedUser({
        name: 'obentchi-project',
        description: 'Obentchi IDE Project',
        private: false,
        auto_init: false
      });
      console.log(`Created repository: ${newRepo.full_name}`);
      await uploadFiles(octokit, user.login, newRepo.name);
    } else {
      console.log(`Found ${repos.length} repository(ies):`);
      repos.forEach((repo, index) => {
        console.log(`  ${index + 1}. ${repo.name} (${repo.html_url})`);
      });
      
      const targetRepo = repos[0];
      console.log(`\nUploading to: ${targetRepo.full_name}`);
      await uploadFiles(octokit, user.login, targetRepo.name);
    }
    
    console.log('\nUpload completed successfully!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

async function uploadFiles(octokit: Octokit, owner: string, repo: string) {
  const files = getAllFiles('.');
  console.log(`\nFound ${files.length} files to upload...`);
  
  let defaultBranch = 'main';
  
  try {
    const { data: repoData } = await octokit.repos.get({ owner, repo });
    defaultBranch = repoData.default_branch;
  } catch (e) {
    console.log('Could not get repo info, using main as default branch');
  }
  
  let latestCommitSha: string | undefined;
  let treeSha: string | undefined;
  
  try {
    const { data: ref } = await octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${defaultBranch}`
    });
    latestCommitSha = ref.object.sha;
    
    const { data: commit } = await octokit.git.getCommit({
      owner,
      repo,
      commit_sha: latestCommitSha
    });
    treeSha = commit.tree.sha;
  } catch (e) {
    console.log('Repository is empty, will create initial commit');
  }
  
  const treeItems: { path: string; mode: '100644'; type: 'blob'; sha: string }[] = [];
  
  for (const filePath of files) {
    const relativePath = filePath.startsWith('./') ? filePath.slice(2) : filePath;
    console.log(`Uploading: ${relativePath}`);
    
    try {
      const content = fs.readFileSync(filePath);
      const base64Content = content.toString('base64');
      
      const { data: blob } = await octokit.git.createBlob({
        owner,
        repo,
        content: base64Content,
        encoding: 'base64'
      });
      
      treeItems.push({
        path: relativePath,
        mode: '100644',
        type: 'blob',
        sha: blob.sha
      });
    } catch (err) {
      console.error(`Failed to upload ${relativePath}:`, err);
    }
  }
  
  console.log('\nCreating tree...');
  const { data: newTree } = await octokit.git.createTree({
    owner,
    repo,
    tree: treeItems,
    base_tree: treeSha
  });
  
  console.log('Creating commit...');
  const { data: newCommit } = await octokit.git.createCommit({
    owner,
    repo,
    message: 'Upload all project files from Replit',
    tree: newTree.sha,
    parents: latestCommitSha ? [latestCommitSha] : []
  });
  
  console.log('Updating reference...');
  try {
    await octokit.git.updateRef({
      owner,
      repo,
      ref: `heads/${defaultBranch}`,
      sha: newCommit.sha
    });
  } catch (e) {
    await octokit.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${defaultBranch}`,
      sha: newCommit.sha
    });
  }
  
  console.log(`\nAll files uploaded to https://github.com/${owner}/${repo}`);
}

main();
