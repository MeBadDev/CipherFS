import { Octokit } from "octokit";

export class GitHubStorage {
  private octokit: Octokit;
  private owner: string;
  private repo: string;

  constructor(token: string | undefined, owner: string, repo: string) {
    this.octokit = new Octokit({ auth: token });
    this.owner = owner;
    this.repo = repo;
  }

  async getFile(path: string): Promise<{ content: string; sha: string } | null> {
    try {
      const response = await this.octokit.request("GET /repos/{owner}/{repo}/contents/{path}", {
        owner: this.owner,
        repo: this.repo,
        path: path,
      });

      if (Array.isArray(response.data) || response.data.type !== "file") {
        throw new Error("Path is not a file");
      }

      return {
        content: response.data.content, // in base64
        sha: response.data.sha,
      };
    } catch (error: any) {
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async uploadFile(path: string, contentBase64: string, message: string, sha?: string) {
    try {
      await this.octokit.request("PUT /repos/{owner}/{repo}/contents/{path}", {
        owner: this.owner,
        repo: this.repo,
        path: path,
        message: message,
        content: contentBase64,
        sha: sha, // required if updating
      });
    } catch (error: any) {
      if (error.status === 401 || error.status === 403) {
        throw new Error("Invalid token or insufficient permissions");
      }
      throw error;
    }
  }

  async deleteFile(path: string, message: string, sha: string) {
    try {
      await this.octokit.request("DELETE /repos/{owner}/{repo}/contents/{path}", {
        owner: this.owner,
        repo: this.repo,
        path: path,
        message: message,
        sha: sha,
      });
    } catch (error: any) {
      if (error.status === 401 || error.status === 403) {
        throw new Error("Invalid token or insufficient permissions");
      }
      throw error;
    }
  }

  async validateToken(): Promise<boolean> {
    try {
      // Try to get repo info to validate token has access
      await this.octokit.request("GET /repos/{owner}/{repo}", {
        owner: this.owner,
        repo: this.repo,
      });
      return true;
    } catch (error: any) {
      if (error.status === 401 || error.status === 403 || error.status === 404) {
        return false;
      }
      throw error;
    }
  }
}
