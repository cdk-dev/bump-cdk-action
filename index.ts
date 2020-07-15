const core = require('@actions/core');
const github = require('@actions/github');
const { bumpCdk } = require('bump-cdk');
const { Octokit } = require("@octokit/rest");

interface GithubProps {
  actor: string;
  token: string;
  owner: string;
  repo: string;
}

class Github {
  constructor(props: GithubProps) {
    this.actor = actor;
    this.owner = owner;
    this.repo = repo;

    this.client = new Octokit({
      auth: token
    });
  }
  
  async _getTreeSha(base='master') {
    try {
      const { data } = await this.client.repos.listCommits({
        owner: this.owner,
        repo: this.repo,
        sha: base,
        per_page: 1
      });
      return data[0].commit.tree.sha
    } catch (e) {
      return Promise.reject(e)
    }
  }
  
  async add(file='./package.json') {
    try {
      const content = fs.readFileSync(file);

      const { data } = await this.client.git.createBlob({
        owner: this.owner,
        repo: this.repo,
        content: content.toString()
      });

      const tree = [
        {
          path: file,
          mode: '100644',
          sha: data.sha
        }
      ];

      return this.client.git.createTree({
        owner: this.owner,
        repo: this.repo,
        this.treeSha,
        tree
      });
    } catch (e) {
      console.error(e)
      return Promise.reject(e)
    }
  }
  
  async commit(message, tree) {
    return this.client.git.createCommit({
      owner: this.owner,
      repo: this.repo,
      message,
      tree,
      parents: [baseRef],
      committer: {
        name: this.actor
      }
    });
  }

  async createBranch(name, sha) {
    try {
      return this.client.git.createRef({
        owner: this.owner,
        repo: this.repo,
        ref: `refs/heads/${name}`,
        sha
      });
    } catch (e) {
      return Promise.reject(e)
    }
  }

  async createPull(branch, base='master', title='Initial Code') {
    try {
      return this.client.pulls.create({
        owner: this.owner,
        repo: this.repo,
        base,
        title,
        head: branch
      })
    } catch (e) {
      return Promise.reject(e)
    }
  }
}

function loadConfig() {
  const workingDirectory = core.getInput('working-directory') || process.cwd();

    const version = core.getInput('version') || undefined;

    const debug = core.getInput('debug') || false;
    
    const branch = core.getInput('branch-name') || `bump-cdk/${version}`;
    
    const token = core.getInput('github-token');
    const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/';
    const actor = process.env.GITHUB_ACTOR;
  
    const eventType = process.env.GITHUB_EVENT_NAME;
    
    return {
      workingDirectory,
      version,
      debug,
      branch,
      token,
      owner,
      repo,
      actor,
      eventType
    }
}

async function run() {
  try {
    const {
      workingDirectory,
      version,
      debug,
      branch,
      token,
      owner,
      repo,
      actor,
      eventType
    } = loadConfig();

    const github = new Github({
     token,
     owner,
     repo,
     actor
    });

    const { hasChanges } = await bumpCdk(workingDirectory, version, false, debug);
    
    if (!hasChanges) {
      console.log('done');
      return;
    }
    
    // add changes
    const { data: { sha } } = await git.add(`${workingDirectory}/package.json`);
    
    // commit changes
    const { data: { sha: commitSha } } = await git.commit("", sha);
    
    core.setOutput('commitSha', commitSha);
    
    switch(eventType) {
      case 'schedule': {
        const branchName = `bump-cdk/${version}`;
        await git.createBranch(branchName, commitSha);
        await git.push(commitSha, `heads/${branchName}`);
        const { data: { number: pullNumber } } = await git.createPull(branchName);
        
        core.setOutput('pullNumber', pullNumber);

        break;
      }
      default: {
      
      }
    }

    core.setOutput('version', version);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
