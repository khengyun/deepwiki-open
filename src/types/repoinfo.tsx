export interface RepoInfo {
    owner: string;
    repo: string;
    type: string;
    token: string | null;
    localPath: string | null;
    repoUrl: string | null;
    ref: string | null;
}

export default RepoInfo;