
import { summarizeContent } from './gemini';

export const getGithubMeta = async (url: string) => {
    try {
        // Extract owner and repo
        const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
        if (!match) return null;
        const owner = match[1];
        const repo = match[2];

        // Fetch Repo Details
        const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
        if (!repoRes.ok) return null;
        const repoData = await repoRes.json();

        // Fetch README
        const readmeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`);
        let readmeText = '';
        if (readmeRes.ok) {
            const readmeData = await readmeRes.json();
            // content is base64 encoded
            if (readmeData.content) {
                const buff = Buffer.from(readmeData.content, 'base64');
                readmeText = buff.toString('utf-8').slice(0, 2000); // Limit context
            }
        }

        const combinedContext = `
Repo: ${repoData.full_name}
Description: ${repoData.description || 'No description'}
Topics: ${repoData.topics?.join(', ') || 'None'}
Language: ${repoData.language}
README Snippet:
${readmeText}
        `.trim();

        console.log(`💻 GitHub: Fetched metadata for ${owner}/${repo}`);

        // Summarize immediately
        const aiSummary = await summarizeContent(combinedContext);

        return {
            title: repoData.description || repoData.full_name,
            summary: aiSummary,
            lastEditedAt: repoData.pushed_at,
            authorName: repoData.owner?.login
        };

    } catch (error) {
        console.error("GitHub Meta Error:", error);
        return null;
    }
};
