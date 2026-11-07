# LinkedIn demo: one founder post becomes a reviewed brief

The goal is to show research judgement. It is not to claim that venture investing has been automated. Use a real post that you found yourself. Don't stage one.

## Before recording

- Pick a real founder post on X: a launch, a first customer or a hiring post from a European company that fits your thesis.
- Open the post and copy its text exactly. X can't be read automatically, so the pasted text is the record.
- Start with a clean database: delete `data/sourcebook.db`, then save your thesis.

## The demo (about 90 seconds)

1. **Thesis** (10s). Show the sectors, geography, stage and exclusions. Say: "No scores. Each line gets checked against these words."
2. **Add a link** (15s). Paste the post's URL.
   - Sourcebook guesses the source is an X post and fills in the author's handle.
   - Paste the post text and add the post's date.
   - Name the company. If it is already in the workspace, the duplicate warning appears. That is worth showing.
3. **Brief, before** (10s). Everything reads **Unknown**. Say: "A post isn't a brief yet."
4. **Add the company's website and one primary record** (20s). For a UK company that is Companies House. For an accelerator company it is the cohort page. Use Fetch details, or Draft with Claude if you have a key.
5. **Review the drafts** (20s). Approve a draft whose quote you can see on the page.
   - Downgrade one from verified to company claim. A customer the company names is a claim.
   - Reject one that goes further than its source.
6. **Brief, after** (10s). Show:
   - the verified and claimed marks;
   - the thesis criteria with the words that matched;
   - Stage still **Unknown**, because no source states a round.
7. **Decide and export** (10s). Mark it Investigate, write the next diligence question, then download the CSV.

## What to say

> I built a tool that turns public signals into sourced company briefs for a small fund. It doesn't recommend investments or make introductions. It separates what a company claims from what a registry or a customer confirms. Anything not yet known stays visibly unknown. AI drafts facts only when it can quote the source, and a person approves every one. Next I'm showing five briefs to three London fund operators to see whether the companies are new to them and worth a look.

## What not to claim

- "AI finds the best startups." It finds nothing. You added the link.
- A fundraising status or traction figure that no source states.
- That the operator test has passed, before it has.
