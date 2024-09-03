import { Octokit } from "@octokit/rest";
import fs from "fs";
import path from "path";
import { context } from "@actions/github";
import { minimatch } from "minimatch";

import { createLineSpecificReview, createFileReview } from "./openai-helper.js";

const LINE_COMMENTS_ENABLED = true;

// GitHub token is automatically provided by GitHub Actions
const token = process.env.GITHUB_TOKEN;
const includedFiles = process.env.SRC_FOLDER_PATTERN;
const octokit = new Octokit({ auth: token });

// Get the context of the pull request
const { owner, repo } = context.repo;
const pull_number = context.payload.pull_request.number;

// Fetch the list of files changed in the pull request
octokit.pulls
  .listFiles({
    owner,
    repo,
    pull_number,
  })
  .then(async(files) => {
    const commit_id = await getLatestCommitSHA();
    files.data.forEach((file) => {
      const filePath = path.resolve(file.filename);
      if (!isIncludedFilePath(filePath, includedFiles)) {
        return;
      }
      console.log('commit_id', commit_id);
      console.log(filePath);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, "utf8");
        console.log('LINE_COMMENT_ENABLED', LINE_COMMENTS_ENABLED);
        if (LINE_COMMENTS_ENABLED) {
          createLineComments(file, content, commit_id)
        } else {
          createPRComment(file, content);
        }
      }
    });
  })
  .catch((err) => {
    console.error("Error fetching pull request files:", err);
  });

  async function getLatestCommitSHA() {
    const { data: commits } = await octokit.pulls.listCommits({
      owner,
      repo,
      pull_number,
    });
    return commits[commits.length - 1].sha;
  }

function createLineComments(file, fileContent, commit_id) {
  createLineSpecificReview(fileContent).then((reviewRes) => {
    try {
      const completionText = reviewRes.choices[0].message.content.trim();
      console.log("completionText", completionText);
      const jsonResponse =JSON.parse(completionText);
      let reviewList = [];
      const keys = Object.keys(jsonResponse);
      console.log('keys', keys);
      keys.forEach((key) => {
        reviewList = [...reviewList, ...jsonResponse[key]];
      });
      console.log('reviewList', reviewList);
      reviewList.forEach((review) => {
        octokit.pulls.createReviewComment({
          owner: owner,
          repo: repo,
          pull_number: pull_number,
          path: file.filename,
          line: review.line,
          commit_id: commit_id,
          body: `
          ${review.suggested_change}\n
          Explantion: ${review.explantions}
          `
        })
      })
    } catch (error) {
      throw new Error("Failed to parse JSON response");
    }
  })
}
 
function createPRComment(file, fileContent) {
  createFileReview(fileContent)
    .then(reviewRes => {
      // Post a review comment to the pull request
      octokit.issues.createComment({
        owner,
        repo,
        issue_number: pull_number,
        body: `### OpenAI Code Review for ${file.filename}\n${reviewRes.choices[0].message.content}`,
      });
    })
    .catch((err) => {
      console.error("Error generating review:", err);
    });
}

function isIncludedFilePath(filePath, patterns = "**/*.js") {
  const patternList = patterns.split(",");
  return patternList.reduce((prev, pattern) => {
    return prev || minimatch(filePath, pattern.trim());
  }, false);
}